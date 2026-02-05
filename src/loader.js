export class LoaderOverlay {
    constructor(element) {
        this.element = element;
        this.statusEl = element?.querySelector("[data-status]") ?? null;
        this.progressEl = element?.querySelector("[data-progress]") ?? null;
    }

    setStatus(text) {
        if (this.statusEl) {
            this.statusEl.textContent = text;
        }
    }

    setProgress(percent) {
        if (this.progressEl) {
            const clamped = Math.max(0, Math.min(100, percent));
            this.progressEl.style.width = `${clamped}%`;
        }
    }

    show() {
        if (this.element) {
            this.element.classList.remove("is-hidden");
        }
    }

    hide() {
        if (this.element) {
            this.element.classList.add("is-hidden");
        }
    }
}
