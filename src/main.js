import { LoaderOverlay } from "./loader.js";
import { GlobeExperience } from "./globe.js";
import { MapExperience } from "./map.js";
import { HintOverlay, StationPanel } from "./ui.js";
import { mapConfig } from "./data/stations.js";

const loader = new LoaderOverlay(document.getElementById("loader"));
const globeStage = document.getElementById("globe-stage");
const mapStage = document.getElementById("map-stage");
const hintOverlay = new HintOverlay(document.querySelector("[data-hint]"));
const stationPanel = new StationPanel(document.getElementById("station-panel"));
const hasVisitedBefore = sessionStorage.getItem("atlasVisited") === "1";

const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function bootstrap() {
    const shouldPlayIntro = !hasVisitedBefore;
    let globe = null;

    if (shouldPlayIntro) {
        loader.hide();
        globe = new GlobeExperience({
            canvas: document.getElementById("globe-canvas"),
            container: globeStage,
            targetLatLng: mapConfig.globeTarget,
            onReady: () => {}
        });
        await globe.init();
        requestAnimationFrame(() => {
            globeStage.classList.add("is-visible");
        });
        await globe.playIntroSequence();
        loader.show();
        loader.setStatus("Preparation de la carte interactive");
        loader.setProgress(45);
    } else {
        globeStage.remove();
        loader.show();
        loader.setStatus("Chargement de la carte interactive");
        loader.setProgress(10);
    }

    const map = new MapExperience("map");
    loader.setStatus("Preparation de la carte interactive");
    loader.setProgress(shouldPlayIntro ? 65 : 70);
    await map.init();

    if (shouldPlayIntro) {
        loader.setProgress(90);
        loader.setStatus("Synchronisation de l'experience");
        await delay(400);
    }

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

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            stationPanel.hide();
        }
    });

    if (shouldPlayIntro) {
        mapStage.classList.add("is-visible");
        map.activate();
        hintOverlay.schedule(5000);
        await delay(300);
        globeStage.classList.remove("is-visible");
        await delay(500);
        globe?.destroy();
        globeStage.remove();
        sessionStorage.setItem("atlasVisited", "1");
    } else {
        mapStage.classList.add("is-visible");
        map.activate();
        hintOverlay.schedule(2000);
    }
}

bootstrap().catch((error) => {
    console.error("[Bootstrap] Initialisation interrompue:", error);
    loader.setStatus("Une erreur est survenue. Voir la console.");
});
