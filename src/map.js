import { lines, mapConfig, buildStationIndex } from "./data/stations.js";

export class MapExperience {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.maplibregl = null;
        this.stationIndex = buildStationIndex();
        this.stationListeners = new Set();
        this.interactionListeners = new Set();
        this.isLoaded = false;
    }

    async init() {
        if (this.map) {
            return;
        }

        const module = await import("https://cdn.jsdelivr.net/npm/maplibre-gl@4.3.2/dist/maplibre-gl.esm.js");
        this.maplibregl = module.default ?? module;

        this.map = new this.maplibregl.Map({
            container: this.containerId,
            style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
            center: mapConfig.initialCenter,
            zoom: mapConfig.initialZoom,
            pitch: mapConfig.pitch,
            bearing: mapConfig.bearing,
            attributionControl: false,
            hash: false
        });

        this.map.addControl(new this.maplibregl.NavigationControl({ showCompass: false }), "top-right");

        await new Promise((resolve) => {
            this.map.on("load", () => {
                this.addSources();
                this.addLayers();
                this.bindInteractions();
                this.isLoaded = true;
                resolve();
            });
        });
    }

    addSources() {
        const lineFeatures = [];
        const stationFeatures = [];

        for (const line of lines) {
            const coordinates = line.stations.map((station) => station.coordinates);

            lineFeatures.push({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates
                },
                properties: {
                    id: line.id,
                    name: line.name,
                    color: line.color
                }
            });

            for (const station of line.stations) {
                stationFeatures.push({
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: station.coordinates
                    },
                    properties: {
                        id: station.id,
                        name: station.name,
                        lineId: line.id,
                        lineName: line.name,
                        color: line.color
                    }
                });
            }
        }

        this.map.addSource("metro-lines", {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: lineFeatures
            }
        });

        this.map.addSource("metro-stations", {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: stationFeatures
            }
        });
    }

    addLayers() {
        this.map.addLayer({
            id: "metro-lines-outer",
            type: "line",
            source: "metro-lines",
            paint: {
                "line-color": ["get", "color"],
                "line-width": 8,
                "line-opacity": 0.15
            }
        });

        this.map.addLayer({
            id: "metro-lines",
            type: "line",
            source: "metro-lines",
            paint: {
                "line-color": ["get", "color"],
                "line-width": 4.8,
                "line-opacity": 0.9
            }
        });

        this.map.addLayer({
            id: "metro-stations",
            type: "circle",
            source: "metro-stations",
            paint: {
                "circle-color": ["get", "color"],
                "circle-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    10,
                    4,
                    13.5,
                    7,
                    16,
                    10
                ],
                "circle-opacity": 0.95,
                "circle-stroke-width": 2,
                "circle-stroke-color": "#111322"
            }
        });
    }

    bindInteractions() {
        this.map.on("mouseenter", "metro-stations", () => {
            this.map.getCanvas().style.cursor = "pointer";
        });

        this.map.on("mouseleave", "metro-stations", () => {
            this.map.getCanvas().style.cursor = "";
        });

        this.map.on("click", "metro-stations", (event) => {
            if (!event.features?.length) {
                return;
            }
            const feature = event.features[0];
            const stationId = feature.properties.id;
            const station = this.stationIndex.get(stationId);
            if (!station) {
                return;
            }

            this.notifyInteraction();
            this.focusOnStation(station);
            this.stationListeners.forEach((listener) => listener(station));
        });

        const interactionEvents = ["dragstart", "zoomstart", "pitchstart", "rotatestart"];
        interactionEvents.forEach((eventName) => {
            this.map.on(eventName, () => this.notifyInteraction());
        });
    }

    focusOnStation(station) {
        if (!this.map) {
            return;
        }

        const currentZoom = this.map.getZoom();
        const targetZoom = Math.max(currentZoom, 14);

        this.map.easeTo({
            center: station.coordinates,
            zoom: targetZoom,
            pitch: 60,
            duration: 1400,
            bearing: mapConfig.bearing
        });
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

    activate() {
        if (!this.map) {
            return;
        }
        this.map.resize();
    }
}
