import interviews from "./data/interviews.json" assert { type: "json" };

const track = document.getElementById("carousel-track");
const modal = document.getElementById("iv-modal");
const modalBody = document.getElementById("iv-modal-body");
const backdrop = document.getElementById("iv-backdrop");
const closeBtn = document.getElementById("iv-close");

// ── Build cards (duplicated for infinite loop) ──
function buildCard(interview) {
    const card = document.createElement("div");
    card.className = "iv-card" + (interview.station_id ? "" : " iv-card--no-station");

    card.innerHTML = `
        <div class="iv-card__name">${interview.name}</div>
        <div class="iv-card__station">${interview.station_name ?? "Station inconnue"}</div>
        <p class="iv-card__summary">${interview.summary}</p>
        <div class="iv-card__cta">Lire l'interview →</div>
    `;

    if (interview.interview) {
        card.addEventListener("click", () => openModal(interview));
    } else {
        card.style.cursor = "default";
        card.querySelector(".iv-card__cta").style.display = "none";
    }

    return card;
}

[...interviews, ...interviews].forEach(iv => track.appendChild(buildCard(iv)));

// ── Modal ──
function openModal(interview) {
    const stationLink = interview.station_id
        ? `<a class="iv-modal__station-link" href="./index.html">Voir la station · ${interview.station_name}</a>`
        : "";

    const qa = interview.interview.map(({ question, answer }) => `
        <div>
            <p class="iv-modal__q">${question}</p>
            <p class="iv-modal__a">${interview.name.split(" ")[0]} : ${answer}</p>
        </div>
    `).join("");

    modalBody.innerHTML = `
        <h2 class="iv-modal__name">${interview.name}</h2>
        ${stationLink}
        <div class="iv-modal__qa">${qa}</div>
    `;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
}

backdrop.addEventListener("click", closeModal);
closeBtn.addEventListener("click", closeModal);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

// ── Infinite auto-scroll carousel ──
const SPEED = 0.6; // px per frame
let paused = false;
let pos = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartScroll = 0;

function loop() {
    if (!paused && !isDragging) {
        pos += SPEED;
        const half = track.scrollWidth / 2;
        if (pos >= half) pos -= half;
        track.parentElement.scrollLeft = pos;
    }
    requestAnimationFrame(loop);
}

// Pause on hover
track.parentElement.addEventListener("mouseenter", () => { paused = true; });
track.parentElement.addEventListener("mouseleave", () => { paused = false; });

// Drag to scroll
track.parentElement.addEventListener("mousedown", e => {
    isDragging = true;
    dragStartX = e.pageX;
    dragStartScroll = track.parentElement.scrollLeft;
    pos = dragStartScroll;
});

window.addEventListener("mousemove", e => {
    if (!isDragging) return;
    const dx = e.pageX - dragStartX;
    const newPos = dragStartScroll - dx;
    track.parentElement.scrollLeft = newPos;
    pos = newPos;
});

window.addEventListener("mouseup", () => { isDragging = false; });

// Touch support
track.parentElement.addEventListener("touchstart", e => {
    isDragging = true;
    dragStartX = e.touches[0].pageX;
    dragStartScroll = track.parentElement.scrollLeft;
    pos = dragStartScroll;
}, { passive: true });

track.parentElement.addEventListener("touchmove", e => {
    if (!isDragging) return;
    const dx = e.touches[0].pageX - dragStartX;
    const newPos = dragStartScroll - dx;
    track.parentElement.scrollLeft = newPos;
    pos = newPos;
}, { passive: true });

track.parentElement.addEventListener("touchend", () => { isDragging = false; });

requestAnimationFrame(loop);
