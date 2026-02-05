export class HintOverlay {
    constructor(element) {
        this.element = element;
        this.timeoutId = null;
    }

    schedule(delay = 5000) {
        this.cancel();
        this.timeoutId = window.setTimeout(() => {
            this.show();
        }, delay);
    }

    show() {
        if (!this.element) {
            return;
        }
        this.element.classList.add("is-visible");
    }

    hide() {
        if (!this.element) {
            return;
        }
        this.cancel();
        this.element.classList.remove("is-visible");
    }

    cancel() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
}

export class StationPanel {
    constructor(root) {
        this.root = root;
        this.titleEl = root?.querySelector("[data-station-name]");
        this.lineEl = root?.querySelector("[data-station-line]");
        this.artworkEl = root?.querySelector("[data-station-artwork]");
        this.artistEl = root?.querySelector("[data-station-artist]");
        this.descriptionEl = root?.querySelector("[data-station-description]");
        this.ctaEl = root?.querySelector("[data-open-station]");
        this.onNavigate = null;

        if (this.ctaEl) {
            this.ctaEl.addEventListener("click", () => {
                if (this.onNavigate) {
                    this.onNavigate();
                }
            });
        }
    }

    update(station) {
        if (!station || !this.root) {
            return;
        }

        this.root.classList.add("is-visible");

        if (this.titleEl) {
            this.titleEl.textContent = station.name;
        }
        if (this.lineEl) {
            this.lineEl.textContent = `Ligne ${station.line}`;
            this.lineEl.style.background = station.line === "A"
                ? "linear-gradient(135deg, rgba(255,59,106,0.95), rgba(255,121,63,0.7))"
                : "linear-gradient(135deg, rgba(255,208,86,0.95), rgba(255,255,164,0.7))";
        }
        if (this.artworkEl) {
            this.artworkEl.textContent = station?.art?.title ?? "Oeuvre a venir";
        }
        if (this.artistEl) {
            this.artistEl.textContent = station?.art?.artist
                ? `Artiste : ${station.art.artist}`
                : "Artiste à confirmer";
        }
        if (this.descriptionEl) {
            this.descriptionEl.textContent = station?.art?.description ?? "La narration de cette station sera ajoutee prochainement.";
        }
        if (this.ctaEl) {
            this.ctaEl.disabled = true;
        }
    }

    setNavigateHandler(callback) {
        this.onNavigate = callback;
    }

    hide() {
        if (!this.root) {
            return;
        }
        this.root.classList.remove("is-visible");
    }
}
