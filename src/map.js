import { lines, mapView } from "./data/stations.js";

export class MapExperience {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.stationListeners = new Set();
        this.interactionListeners = new Set();
        this.svg = null;
    }

    async init() {
        if (!this.container) {
            throw new Error("Element map introuvable");
        }
        this.container.innerHTML = "";
        this.svg = this.createSvg();
        this.container.appendChild(this.svg);
        this.drawLines();
        this.drawStations();
    }

    createSvg() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 1000 620");
        svg.setAttribute("class", "metro-map");

        const defs = document.createElementNS(svg.namespaceURI, "defs");

        const gradient = document.createElementNS(svg.namespaceURI, "linearGradient");
        gradient.setAttribute("id", "map-bg");
        gradient.setAttribute("x1", "50%");
        gradient.setAttribute("y1", "0%");
        gradient.setAttribute("x2", "50%");
        gradient.setAttribute("y2", "100%");

        const stopTop = document.createElementNS(svg.namespaceURI, "stop");
        stopTop.setAttribute("offset", "0%");
        stopTop.setAttribute("stop-color", "#090d1f");
        const stopBottom = document.createElementNS(svg.namespaceURI, "stop");
        stopBottom.setAttribute("offset", "100%");
        stopBottom.setAttribute("stop-color", "#0e1733");

        gradient.appendChild(stopTop);
        gradient.appendChild(stopBottom);
        defs.appendChild(gradient);

        svg.appendChild(defs);

        const background = document.createElementNS(svg.namespaceURI, "rect");
        background.setAttribute("x", "0");
        background.setAttribute("y", "0");
        background.setAttribute("width", "1000");
        background.setAttribute("height", "620");
        background.setAttribute("fill", "url(#map-bg)");
        svg.appendChild(background);

        return svg;
    }

    project([lng, lat]) {
        const { west, east, south, north, padding } = mapView;
        const width = 1000 - padding * 2;
        const height = 620 - padding * 2;

        const x = ((lng - west) / (east - west)) * width + padding;
        const y = ((north - lat) / (north - south)) * height + padding;
        return [x, y];
    }

    drawLines() {
        for (const line of lines) {
            const path = document.createElementNS(this.svg.namespaceURI, "path");
            const coords = line.stations.map((station) => this.project(station.coordinates));

            const d = coords.reduce((acc, [x, y], index) => {
                if (index === 0) {
                    return `M ${x.toFixed(2)} ${y.toFixed(2)}`;
                }
                return `${acc} L ${x.toFixed(2)} ${y.toFixed(2)}`;
            }, "");

            path.setAttribute("d", d);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", line.color);
            path.setAttribute("stroke-width", "5");
            path.setAttribute("stroke-linecap", "round");
            path.setAttribute("stroke-linejoin", "round");
            path.setAttribute("class", `metro-line metro-line-${line.id}`);

            this.svg.appendChild(path);
        }
    }

    drawStations() {
        for (const line of lines) {
            for (const station of line.stations) {
                const [x, y] = this.project(station.coordinates);

                const group = document.createElementNS(this.svg.namespaceURI, "g");
                group.setAttribute("class", "metro-station");
                group.setAttribute("data-station-id", station.id);

                const outer = document.createElementNS(this.svg.namespaceURI, "circle");
                outer.setAttribute("cx", x.toFixed(2));
                outer.setAttribute("cy", y.toFixed(2));
                outer.setAttribute("r", "8");
                outer.setAttribute("fill", "#060713");
                outer.setAttribute("stroke", "#131b33");
                outer.setAttribute("stroke-width", "2");

                const inner = document.createElementNS(this.svg.namespaceURI, "circle");
                inner.setAttribute("cx", x.toFixed(2));
                inner.setAttribute("cy", y.toFixed(2));
                inner.setAttribute("r", "5");
                inner.setAttribute("fill", line.color);
                inner.setAttribute("class", "metro-station__pulse");

                group.appendChild(outer);
                group.appendChild(inner);

                group.addEventListener("click", () => {
                    this.notifyInteraction();
                    this.stationListeners.forEach((listener) => listener({ ...station, line: line.id, lineName: line.name, lineColor: line.color }));
                });

                group.addEventListener("mouseenter", () => {
                    this.notifyInteraction();
                });

                this.svg.appendChild(group);
            }
        }
    }

    onStationSelected(listener) {
        this.stationListeners.add(listener);
        return () => this.stationListeners.delete(listener);
    }

    onInteraction(listener) {
        this.interactionListeners.add(listener);
        return () => this.interactionListeners.delete(listener);
    }

    notifyInteraction() {
        this.interactionListeners.forEach((listener) => listener());
    }

    focusOnStation(station) {
        if (!this.svg) {
            return;
        }

        const highlight = this.svg.querySelector(".metro-station--active");
        if (highlight) {
            highlight.classList.remove("metro-station--active");
        }

        const node = this.svg.querySelector(`[data-station-id="${station.id}"]`);
        if (node) {
            node.classList.add("metro-station--active");
        }
    }

    activate() {
        // No additional work required for the static map at this stage.
    }
}
