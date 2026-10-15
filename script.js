const timeline = document.getElementById("timeline")
const loading = document.getElementById("loading")
const modal = document.getElementById("modal")
const modalMedia = document.getElementById("modal-media")
const modalEyebrow = document.getElementById("modal-eyebrow")
const modalTitle = document.getElementById("modal-title")
const modalTags = document.getElementById("modal-tags")
const modalText = document.getElementById("modal-text")
const modalLinks = document.getElementById("modal-links")

let lastFocused = null

document.getElementById("year").textContent = new Date().getFullYear()

function youtubeId(url) {
	const match = String(url).match(
		/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/
	)

	return match ? match[1] : null
}

function buildMedia(project) {
	const url = project.video || ""
	const id = youtubeId(url)

	if (id) {
		const iframe = document.createElement("iframe")
		iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`
		iframe.allow = "accelerometer; autoplay; encrypted-media; picture-in-picture"
		iframe.allowFullscreen = true
		iframe.title = project.title
		return iframe
	}

	if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) {
		const video = document.createElement("video")
		video.src = url
		video.controls = true
		video.autoplay = true
		video.playsInline = true
		if (project.thumbnail) video.poster = project.thumbnail
		return video
	}

	if (project.thumbnail) {
		const img = document.createElement("img")
		img.src = project.thumbnail
		img.alt = project.title
		return img
	}

	return null
}

function makeTag(label) {
	const span = document.createElement("span")
	span.className = "tag"
	span.textContent = label
	return span
}

function makeLink(href, label, primary) {
	const link = document.createElement("a")
	link.className = primary ? "btn btn-primary" : "btn"
	link.href = href
	link.textContent = label
	link.target = "_blank"
	link.rel = "noopener"
	return link
}

function openModal(project) {
	lastFocused = document.activeElement

	modalMedia.replaceChildren()
	modalTags.replaceChildren()
	modalText.replaceChildren()
	modalLinks.replaceChildren()

	const media = buildMedia(project)
	modalMedia.hidden = !media
	if (media) modalMedia.appendChild(media)

	modalEyebrow.textContent = project.role || project.year || "Project"
	modalTitle.textContent = project.title || "Untitled"

	for (const tag of project.tags || []) {
		modalTags.appendChild(makeTag(tag))
	}

	const paragraphs = String(project.description || "").split(/\n\s*\n/)

	for (const text of paragraphs) {
		if (!text.trim()) continue
		const p = document.createElement("p")
		p.textContent = text.trim()
		modalText.appendChild(p)
	}

	if (project.game) modalLinks.appendChild(makeLink(project.game, "Play on Roblox"))
	if (project.video) modalLinks.appendChild(makeLink(project.video, "Watch on YouTube"))

	if (project.download) {
		const link = document.createElement("a")
		link.className = "btn"
		link.href = project.download
		link.textContent = "Download place file"
		link.setAttribute("download", "")
		modalLinks.appendChild(link)
	}

	modal.hidden = false
	document.body.style.overflow = "hidden"
	modal.querySelector(".modal-close").focus()
}

function closeModal() {
	modal.hidden = true
	modalMedia.replaceChildren()
	document.body.style.overflow = ""

	if (lastFocused) lastFocused.focus()
}

function makeCard(project) {
	const node = document.createElement("div")
	node.className = "node"

	const card = document.createElement("button")
	card.className = "card"
	card.type = "button"

	const thumb = document.createElement("div")
	thumb.className = "card-thumb"

	const img = document.createElement("img")
	img.src = project.thumbnail || ""
	img.alt = project.title || ""
	img.loading = "lazy"
	thumb.appendChild(img)

	const play = document.createElement("div")
	play.className = "card-play"
	play.innerHTML = "<span>&#9654;</span>"
	thumb.appendChild(play)

	const text = document.createElement("div")
	text.className = "card-text"

	const heading = document.createElement("h3")
	heading.textContent = project.title || "Untitled"

	const summary = document.createElement("p")
	summary.textContent = project.summary || ""

	const tags = document.createElement("div")
	tags.className = "tags"

	for (const tag of project.tags || []) {
		tags.appendChild(makeTag(tag))
	}

	text.append(heading, summary, tags)
	card.append(thumb, text)
	card.addEventListener("click", () => openModal(project))

	node.appendChild(card)

	return node
}

const observer = new IntersectionObserver(
	entries => {
		for (const entry of entries) {
			if (entry.isIntersecting) {
				entry.target.classList.add("is-visible")
				observer.unobserve(entry.target)
			}
		}
	},
	{ threshold: 0.15 }
)

fetch("projects.json")
	.then(response => {
		if (!response.ok) throw new Error(response.status)
		return response.json()
	})
	.then(projects => {
		loading.remove()

		for (const project of projects) {
			const node = makeCard(project)
			timeline.appendChild(node)
			observer.observe(node)
		}
	})
	.catch(error => {
		loading.textContent = "Could not load projects. Check that projects.json sits next to index.html."
		console.error(error)
	})

modal.addEventListener("click", event => {
	if (event.target.hasAttribute("data-close")) closeModal()
})

document.addEventListener("keydown", event => {
	if (event.key === "Escape" && !modal.hidden) closeModal()
})
