import { LoaderOverlay } from "./loader.js";
import { GlobeExperience } from "./globe.js";
import { MapExperience } from "./map.js";
import { HintOverlay, StationPanel } from "./ui.js";
import { mapConfig, buildStationIndex } from "./data/stations.js";

// ── Theme initialisation (runs before anything renders) ──
const mq = window.matchMedia("(prefers-color-scheme: light)");
const savedTheme = localStorage.getItem("theme");
let isLightMode = savedTheme ? savedTheme === "light" : mq.matches;
if (isLightMode) document.body.classList.add("light-mode");

const loader = new LoaderOverlay(document.getElementById("loader"));
const globeStage = document.getElementById("globe-stage");
const mapStage = document.getElementById("map-stage");
const interviewsBtn = document.querySelector(".interviews-ctrl-btn");
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

    // ── Hover guide panel ──
    const guideEl      = document.getElementById("map-guide");
    const guideArt     = document.getElementById("guide-art");
    const guideImgWrap = document.getElementById("guide-img-wrap");
    const guideImg     = document.getElementById("guide-img");
    const guideLogo    = document.getElementById("guide-logo");
    const guideName    = document.getElementById("guide-name");
    if (guideEl) {
        map.onStationHovered((station) => {
            if (!station) return;
            const title = station.art?.title;
            const artist = station.art?.artist || "Artiste inconnu";
            guideArt.textContent = (!title || title === "Sans titre")
                ? `Œuvre par ${artist} :`
                : `${title} par ${artist} :`;
            guideName.textContent = station.name;
            guideLogo.src = `media/${station.id}/logo.svg`;
            guideLogo.alt = station.name;
            guideLogo.style.display = "";
            guideLogo.onerror = () => { guideLogo.style.display = "none"; };

            // Line tint
            const isA = station.line === "A";
            guideEl.style.setProperty("--guide-tint",   isA ? "rgba(210, 35, 42, 0.07)"  : "rgba(255, 180, 0, 0.07)");
            guideEl.style.setProperty("--guide-border",  isA ? "rgba(210, 35, 42, 0.35)"  : "rgba(255, 180, 0, 0.35)");

            // Thumb instantly, full image progressively
            guideImg.classList.add("is-loading");
            guideImgWrap.classList.add("is-loading");
            guideImg.src = `media/${station.id}/main_thumb.jpg`;
            guideImg.alt = station.name;

            const full = new Image();
            full.onload = () => {
                guideImg.src = full.src;
                guideImg.classList.remove("is-loading");
                guideImgWrap.classList.remove("is-loading");
            };
            full.src = `media/${station.id}/main.jpg`;

            guideEl.classList.add("has-station");
        });
    }

    const targetId = new URLSearchParams(window.location.search).get("station");
    if (targetId) {
        const station = buildStationIndex().get(targetId);
        if (station) handleStationSelected(station);
    }

    map.onInteraction(() => {
        hintOverlay.hide();
    });

    // ── Theme toggle wiring ──
    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) {
        const applyTheme = (light, save = true) => {
            isLightMode = light;
            document.body.classList.toggle("light-mode", light);
            map.setTheme(!light);
            if (save) localStorage.setItem("theme", light ? "light" : "dark");
        };

        toggleBtn.addEventListener("click", () => applyTheme(!isLightMode));

        // Keep in sync if the OS theme changes and the user hasn't overridden it
        mq.addEventListener("change", (e) => {
            if (!localStorage.getItem("theme")) applyTheme(e.matches, false);
        });
    }

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            stationPanel.hide();
        }
    });

    if (shouldPlayIntro) {
        mapStage.classList.add("is-visible");
        interviewsBtn?.classList.add("is-visible");
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
        interviewsBtn?.classList.add("is-visible");
        map.activate();
        hintOverlay.schedule(2000);
    }
}

bootstrap().catch((error) => {
    console.error("[Bootstrap] Initialisation interrompue:", error);
    loader.setStatus("Une erreur est survenue. Voir la console.");
});
