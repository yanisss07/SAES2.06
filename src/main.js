import { LoaderOverlay } from "./loader.js";
import { GlobeExperience } from "./globe.js";
import { MapExperience } from "./map.js";
import { HintOverlay, StationPanel } from "./ui.js";
import { mapConfig, buildStationIndex } from "./data/stations.js";

const loader = new LoaderOverlay(document.getElementById("loader"));
const globeStage = document.getElementById("globe-stage");
const mapStage = document.getElementById("map-stage");
const hintOverlay = new HintOverlay(document.querySelector("[data-hint]"));
const stationPanel = new StationPanel(document.getElementById("station-panel"));
const stationIndex = buildStationIndex();
const urlParams = new URLSearchParams(window.location.search);
const skipIntro = urlParams.get("view") === "map";
const initialStationId = urlParams.get("station");

const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function bootstrap() {
    loader.show();
    loader.setStatus(skipIntro ? "Chargement de la carte interactive" : "Chargement de la scene 3D");
    loader.setProgress(10);

    let globe = null;

    if (!skipIntro) {
        globe = new GlobeExperience({
            canvas: document.getElementById("globe-canvas"),
            container: globeStage,
            targetLatLng: mapConfig.globeTarget,
            onReady: () => {
                loader.setProgress(35);
                loader.setStatus("Preparation de la carte interactive");
            }
        });
        await globe.init();
    }

    const map = new MapExperience("map");
    loader.setProgress(skipIntro ? 70 : 45);
    loader.setStatus("Preparation de la carte interactive");
    await map.init();

    loader.setProgress(100);
    loader.hide();

    const handleStationSelected = (station) => {
        hintOverlay.hide();
        stationPanel.update(station);
        map.focusOnStation(station);
    };

    map.onStationSelected(handleStationSelected);

    map.onInteraction(() => {
        hintOverlay.hide();
    });

    const focusInitialStation = () => {
        if (!initialStationId || !stationIndex.has(initialStationId)) {
            return;
        }
        const station = stationIndex.get(initialStationId);
        hintOverlay.hide();
        stationPanel.update(station);
        window.setTimeout(() => map.focusOnStation(station), 150);
    };

    if (skipIntro) {
        mapStage.classList.add("is-visible");
        map.activate();
        hintOverlay.schedule(2000);
        focusInitialStation();
        globeStage.remove();
        window.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                stationPanel.hide();
            }
        });
        return;
    }

    requestAnimationFrame(() => {
        globeStage.classList.add("is-visible");
    });

    await globe.playIntroSequence();
    mapStage.classList.add("is-visible");
    map.activate();
    hintOverlay.schedule(5000);
    focusInitialStation();
    await delay(300);
    globeStage.classList.remove("is-visible");
    await delay(500);
    globe?.destroy();
    globeStage.remove();

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            stationPanel.hide();
        }
    });
}

bootstrap().catch((error) => {
    console.error("[Bootstrap] Initialisation interrompue:", error);
    loader.setStatus("Une erreur est survenue. Voir la console.");
});
