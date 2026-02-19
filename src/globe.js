import * as THREE from "../vendor/three.module.js";

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const loader = new THREE.TextureLoader();
const loadTexture = (url) =>
    new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
    });

export class GlobeExperience {
    constructor(options) {
        this.canvas = options.canvas;
        this.onReady = options.onReady ?? (() => {});
        this.targetLatLng = options.targetLatLng ?? { lat: 43.638306, lng: 1.444087 };

        this.scene = null;
        this.renderer = null;
        this.camera = null;
        this.controls = null;
        this.clock = null;
        this.animationFrame = null;

        this.earth = null;
        this.atmosphere = null;
        this.marker = null;
        this.stars = null;

        this.sequencePlaying = false;

        const startDistance = 10;
        // Position the starting camera above Western Europe so the intro begins over that region
        this.cameraStart = this.latLngToVector3(48, 2, startDistance);
        this.cameraEnd = null;
        this.lookAtStart = new THREE.Vector3(0, 0, 0);
        this.lookAtEnd = null;

        this.handleResize = this.handleResize.bind(this);
        this.animate = this.animate.bind(this);
    }

    async init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x040714);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.autoClear = true;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
        this.camera.position.copy(this.cameraStart);

        this.clock = new THREE.Clock();

        const ambientLight = new THREE.AmbientLight(0x5c6aff, 0.6);
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
        keyLight.position.set(-5, 3, 5);
        const rimLight = new THREE.DirectionalLight(0x6c9cff, 0.45);
        rimLight.position.set(4, -3, -4);
        this.scene.add(ambientLight, keyLight, rimLight);

        const earthGeometry = new THREE.SphereGeometry(1.35, 96, 96);
        const earthTextureUrl = new URL("../assets/earth-night.jpg", import.meta.url).href;
        const earthTexture = await loadTexture(earthTextureUrl);

        const earthMaterial = new THREE.MeshPhongMaterial({
            map: earthTexture,
            shininess: 18,
            specular: new THREE.Color(0x1c284f)
        });
        this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
        this.scene.add(this.earth);

        const atmosphereGeometry = new THREE.SphereGeometry(1.42, 96, 96);
        const atmosphereMaterial = new THREE.MeshPhongMaterial({
            color: 0x5aa0ff,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.scene.add(this.atmosphere);

        const starsGeometry = new THREE.BufferGeometry();
        const starVertices = [];
        for (let i = 0; i < 1500; i += 1) {
            const distance = THREE.MathUtils.randFloat(9, 20);
            const theta = THREE.MathUtils.randFloatSpread(360);
            const phi = THREE.MathUtils.randFloatSpread(360);
            const x = distance * Math.sin(theta) * Math.cos(phi);
            const y = distance * Math.sin(theta) * Math.sin(phi);
            const z = distance * Math.cos(theta);
            starVertices.push(x, y, z);
        }
        starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starVertices, 3));
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.055,
            transparent: true,
            opacity: 0.75
        });
        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);

        const targetVector = this.latLngToVector3(this.targetLatLng.lat, this.targetLatLng.lng, 1.42);
        this.lookAtEnd = targetVector.clone().multiplyScalar(0.68);
        this.cameraEnd = targetVector.clone().setLength(2.3);

        this.marker = null;

        this.animationFrame = requestAnimationFrame(this.animate);
        window.addEventListener("resize", this.handleResize);

        this.onReady();
    }

    animate() {
        this.animationFrame = requestAnimationFrame(this.animate);

        const elapsed = this.clock.getElapsedTime();

        if (!this.sequencePlaying) {
            this.earth.rotation.y += 0.0009;
            this.atmosphere.rotation.y += 0.0006;
        } else {
            this.earth.rotation.y += 0.0015;
            this.atmosphere.rotation.y += 0.001;
        }
        this.stars.rotation.y += 0.00012;

        if (this.marker) {
            const pulse = 0.6 + Math.sin(elapsed * 4.2) * 0.25;
            this.marker.scale.setScalar(THREE.MathUtils.lerp(1, 1.35, pulse));
        }

        this.renderer.render(this.scene, this.camera);
    }

    playIntroSequence(duration = 6500) {
        this.sequencePlaying = true;
        return new Promise((resolve) => {
            const start = performance.now();
            const startPos = this.camera.position.clone();
            const startLookAt = this.lookAtStart.clone();

            const step = (now) => {
                const t = Math.min(1, (now - start) / duration);
                const eased = easeInOutCubic(t);

                const currentPos = startPos.clone().lerp(this.cameraEnd, eased);
                this.camera.position.copy(currentPos);

                const lookAtVec = startLookAt.clone().lerp(this.lookAtEnd, eased);
                this.camera.lookAt(lookAtVec);

                const tilt = easeInOutCubic(Math.min(t * 1.4, 1)) * THREE.MathUtils.degToRad(18);
                this.earth.rotation.x = tilt;
                this.atmosphere.rotation.x = tilt;

                if (t < 1) {
                    requestAnimationFrame(step);
                } else {
                    this.sequencePlaying = false;
                    resolve();
                }
            };

            requestAnimationFrame(step);
        });
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(width, height);
    }

    latLngToVector3(lat, lng, radius = 1) {
        const phi = THREE.MathUtils.degToRad(90 - lat);
        const theta = THREE.MathUtils.degToRad(lng + 180);
        const x = -radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        return new THREE.Vector3(x, y, z);
    }

    destroy() {
        cancelAnimationFrame(this.animationFrame);
        window.removeEventListener("resize", this.handleResize);
        this.renderer?.dispose();
        this.scene?.traverse((object) => {
            if (!object.isMesh) {
                return;
            }
            object.geometry?.dispose();
            if (object.material?.isMaterial) {
                this.disposeMaterial(object.material);
            } else if (Array.isArray(object.material)) {
                object.material.forEach((material) => this.disposeMaterial(material));
            }
        });
    }

    disposeMaterial(material) {
        Object.keys(material).forEach((key) => {
            const value = material[key];
            if (value && typeof value === "object" && "minFilter" in value) {
                value.dispose?.();
            }
        });
        material.dispose?.();
    }
}
