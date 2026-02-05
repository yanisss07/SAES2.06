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

const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function bootstrap() {
    loader.show();
    loader.setStatus("Chargement de la scene 3D");
    loader.setProgress(10);

    const globe = new GlobeExperience({
        canvas: document.getElementById("globe-canvas"),
        container: globeStage,
        targetLatLng: mapConfig.globeTarget,
        onReady: () => {
            loader.setProgress(35);
            loader.setStatus("Preparation de la carte interactive");
        }
    });

    await globe.init();

    const map = new MapExperience("map");
    loader.setProgress(45);
    loader.setStatus("Preparation de la carte interactive");
    await map.init();

    loader.setProgress(90);
    loader.setStatus("Synchronisation de l'experience");
    await delay(400);
    loader.setProgress(100);
    loader.hide();

    requestAnimationFrame(() => {
        globeStage.classList.add("is-visible");
    });

    await globe.playIntroSequence();
    mapStage.classList.add("is-visible");
    map.activate();
    await delay(300);
    globeStage.classList.remove("is-visible");

    hintOverlay.schedule(5000);

    map.onStationSelected((station) => {
        hintOverlay.hide();
        stationPanel.update(station);
    });

    map.onInteraction(() => {
        hintOverlay.hide();
    });

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
