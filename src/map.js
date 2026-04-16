import { lines } from "./data/stations.js";

const TILE_LAYERS = {
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
};
const TILE_LAYER_ATTRIBUTION = "&copy; OpenStreetMap &copy; CARTO";

export class MapExperience {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.map = null;
        this.tileLayer = null;
        this.stationListeners = new Set();
        this.interactionListeners = new Set();
        this.markerIndex = new Map();
        this.mediaCache = new Map();
        this.isReady = false;
    }

    async fetchMedia(id) {
        if (this.mediaCache.has(id)) return this.mediaCache.get(id);
        const parse = txt => {
            const lines = txt.trim().split("\n");
            return { heading: lines[0] ?? "", body: lines.slice(2).join("\n").trim() };
        };
        const [oeuvreText, artistText] = await Promise.all([
            fetch(`media/${id}/oeuvre.txt`).then(r => r.ok ? r.text() : "").catch(() => ""),
            fetch(`media/${id}/artist.txt`).then(r => r.ok ? r.text() : "").catch(() => "")
        ]);
        const data = { oeuvre: parse(oeuvreText), artist: parse(artistText) };
        this.mediaCache.set(id, data);
        return data;
    }

    async init() {
        if (!this.container) {
            throw new Error("Element map introuvable");
        }

        await this.ensureLeaflet();

        this.map = window.L.map(this.container, {
            zoomControl: false,
            attributionControl: false,
            scrollWheelZoom: true
        }).setView([43.6005, 1.444], 13);

        const isDark = !document.body.classList.contains("light-mode");
        this.tileLayer = window.L.tileLayer(isDark ? TILE_LAYERS.dark : TILE_LAYERS.light, {
            attribution: TILE_LAYER_ATTRIBUTION,
            subdomains: "abcd",
            maxZoom: 20
        }).addTo(this.map);

        this.drawLines();
        this.drawStations();

        this.map.whenReady(() => {
            this.isReady = true;
        });

        this.map.on("movestart zoomstart dragstart", () => this.notifyInteraction());
        this.map.on("click", () => this.notifyInteraction());

        window.L.control.zoom({ position: "topright" }).addTo(this.map);
    }

    async ensureLeaflet() {
        if (window.L) {
            return;
        }
        await new Promise((resolve, reject) => {
            const maxAttempts = 20;
            let attempts = 0;
            const interval = setInterval(() => {
                attempts += 1;
                if (window.L) {
                    clearInterval(interval);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    reject(new Error("Leaflet n'est pas charge."));
                }
            }, 100);
        });
    }

    drawLines() {
        for (const line of lines) {
            const smoothPath = this.solveCatmullRom(line.stations.map((station) => ({
                lat: station.coordinates[1],
                lng: station.coordinates[0]
            })));

            window.L.polyline(smoothPath, {
                className: `ligne-neon ligne-neon--${line.id.toLowerCase()}`,
                color: "#ffffff",
                weight: 6,
                opacity: 0.85,
                lineCap: "round",
                lineJoin: "round"
            }).addTo(this.map);
        }
    }

    drawStations() {
        // Build a map of stationId → all lines it belongs to
        const stationLines = new Map();
        for (const line of lines) {
            for (const station of line.stations) {
                if (!stationLines.has(station.id)) stationLines.set(station.id, []);
                stationLines.get(station.id).push({ line, station });
            }
        }

        const rendered = new Set();

        for (const line of lines) {
            for (const station of line.stations) {
                if (rendered.has(station.id)) continue;
                rendered.add(station.id);

                const position = [station.coordinates[1], station.coordinates[0]];
                const allLines = stationLines.get(station.id);
                const isTransfer = allLines.length > 1;

                const lineTags = allLines.map(({ line: l }) =>
                    `<span class="line-tag" style="background: ${l.color};">LIGNE ${l.id}</span>`
                ).join("");

                const skeletonContent = `
                    <div class="art-content">
                        <div class="station-header">
                            <div class="station-name-row">
                                <img src="media/${station.id}/logo.svg" class="station-logo" alt="" onerror="this.style.display='none'">
                                <h3>${station.name}</h3>
                            </div>
                            <div class="line-tags">${lineTags}</div>
                        </div>
                        <div class="art-info">
                            <h4>…</h4>
                            <em>…</em>
                        </div>
                        <span class="click-hint">CLIQUEZ POUR VOIR PLUS →</span>
                    </div>
                `;

                const iconClass = isTransfer ? "station-icon station-icon--transfer" : "station-icon";
                const iconSize = isTransfer ? [14, 14] : [10, 10];
                const iconAnchor = isTransfer ? [7, 7] : [5, 5];

                const marker = window.L.marker(position, {
                    icon: window.L.divIcon({
                        className: iconClass,
                        iconSize,
                        iconAnchor,
                        popupAnchor: [0, -8]
                    }),
                    riseOnHover: true
                }).addTo(this.map);

                marker.bindTooltip(skeletonContent, {
                    direction: "top",
                    offset: [0, -12],
                    opacity: 1,
                    className: "custom-art-tooltip",
                    sticky: true
                });

                marker.on("tooltipopen", () => {
                    this.fetchMedia(station.id).then(data => {
                        const tooltip = marker.getTooltip();
                        if (!tooltip) return;
                        const desc = data.oeuvre.body.length > 120
                            ? data.oeuvre.body.slice(0, 120).trimEnd() + "…"
                            : data.oeuvre.body;
                        tooltip.setContent(`
                            <div class="art-content">
                                <div class="station-header">
                                    <div class="station-name-row">
                                        <img src="media/${station.id}/logo.svg" class="station-logo" alt="" onerror="this.style.display='none'">
                                        <h3>${station.name}</h3>
                                    </div>
                                    <div class="line-tags">${lineTags}</div>
                                </div>
                                <div class="art-info">
                                    <h4>${data.artist.heading || "Artiste à confirmer"}</h4>
                                    <em>${data.oeuvre.heading || "Titre à venir"}</em>
                                    <p class="art-desc">${desc || "Récit à venir."}</p>
                                </div>
                                <span class="click-hint">CLIQUEZ POUR VOIR PLUS →</span>
                            </div>
                        `);
                    });
                });

                marker.on("click", () => {
                    this.notifyInteraction();
                    const target = this.getStationTarget(station, line);
                    this.fetchMedia(station.id).then(data => {
                        this.stationListeners.forEach(listener => listener({
                            ...station,
                            line: line.id,
                            lineName: line.name,
                            lineColor: line.color,
                            art: {
                                title: data.oeuvre.heading,
                                artist: data.artist.heading,
                                description: data.oeuvre.body
                            }
                        }));
                    });
                    window.location.href = target;
                });

                marker.on("mouseover", () => this.notifyInteraction());
                this.markerIndex.set(station.id, marker);
            }
        }
    }

    getStationTarget(station, line) {
        const base = line.id === "A" ? "details_ligne_A.html" : "details_ligne_B.html";
        return `${base}?station=${station.id}`;
    }

    solveCatmullRom(points) {
        const path = [];
        const segments = Math.max(points.length - 1, 1);
        for (let i = 0; i < segments; i += 1) {
            const p0 = points[i === 0 ? i : i - 1];
            const p1 = points[i];
            const p2 = points[i + 1] ?? points[i];
            const p3 = points[i + 2] ?? p2;

            for (let t = 0; t < 1; t += 0.05) {
                const lat = this.interpolateCatmullRom(p0.lat, p1.lat, p2.lat, p3.lat, t);
                const lng = this.interpolateCatmullRom(p0.lng, p1.lng, p2.lng, p3.lng, t);
                path.push([lat, lng]);
            }
        }
        const last = points[points.length - 1];
        path.push([last.lat, last.lng]);
        return path;
    }

    interpolateCatmullRom(p0, p1, p2, p3, t) {
        const v0 = (p2 - p0) * 0.5;
        const v1 = (p3 - p1) * 0.5;
        return (
            (2 * p1 - 2 * p2 + v0 + v1) * t * t * t +
            (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t * t +
            v0 * t +
            p1
        );
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
        if (!this.map) {
            return;
        }
        const marker = this.markerIndex.get(station.id);
        if (!marker) {
            return;
        }
        this.map.flyTo(marker.getLatLng(), Math.max(this.map.getZoom(), 15), {
            duration: 1.2,
            easeLinearity: 0.25
        });
        marker.openTooltip();
    }

    setTheme(isDark) {
        if (!this.map || !this.tileLayer) return;
        this.tileLayer.setUrl(isDark ? TILE_LAYERS.dark : TILE_LAYERS.light);
    }

    activate() {
        if (this.map && this.isReady) {
            setTimeout(() => this.map.invalidateSize(), 50);
        }
    }
}
