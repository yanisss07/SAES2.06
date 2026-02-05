import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class GlobeExperience {
    constructor(options) {
        this.canvas = options.canvas;
        this.container = options.container;
        this.targetLatLng = options.targetLatLng;
        this.onReady = options.onReady ?? (() => {});

        this.scene = null;
        this.renderer = null;
        this.camera = null;
        this.clock = null;
        this.animationFrame = null;

        this.earth = null;
        this.atmosphere = null;
        this.marker = null;
        this.stars = null;

        this.cameraStart = new THREE.Vector3(0, 0, 6.2);
        this.cameraEnd = null;
        this.lookAtStart = new THREE.Vector3(0, 0, 0);
        this.lookAtEnd = null;

        this.sequencePlaying = false;
        this._handleResize = this.handleResize.bind(this);
    }

    async init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x040714);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 120);
        this.camera.position.copy(this.cameraStart);

        const ambientLight = new THREE.AmbientLight(0x6f85ff, 0.55);
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
        keyLight.position.set(-5, 3, 5);
        const rimLight = new THREE.DirectionalLight(0x6c9cff, 0.35);
        rimLight.position.set(3, -2, -4);
        this.scene.add(ambientLight, keyLight, rimLight);

        const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
        const earthMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a2a54,
            emissive: 0x06080f,
            shininess: 18,
            specular: 0x335b92
        });
        this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
        this.scene.add(this.earth);

        const atmosphereGeometry = new THREE.SphereGeometry(1.03, 64, 64);
        const atmosphereMaterial = new THREE.MeshPhongMaterial({
            color: 0x4aa2ff,
            transparent: true,
            opacity: 0.18,
            side: THREE.DoubleSide
        });
        this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.scene.add(this.atmosphere);

        const starGeometry = new THREE.BufferGeometry();
        const starVertices = [];
        for (let i = 0; i < 2000; i += 1) {
            const distance = THREE.MathUtils.randFloat(6, 14);
            const theta = THREE.MathUtils.randFloatSpread(360);
            const phi = THREE.MathUtils.randFloatSpread(360);
            const x = distance * Math.sin(theta) * Math.cos(phi);
            const y = distance * Math.sin(theta) * Math.sin(phi);
            const z = distance * Math.cos(theta);
            starVertices.push(x, y, z);
        }
        starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starVertices, 3));
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.04,
            transparent: true,
            opacity: 0.65
        });
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);

        const targetVector = this.latLngToVector3(this.targetLatLng.lat, this.targetLatLng.lng, 1.02);
        this.lookAtEnd = targetVector.clone().multiplyScalar(0.92);
        this.cameraEnd = targetVector.clone().setLength(1.8);

        const markerGeometry = new THREE.SphereGeometry(0.026, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4d67
        });
        this.marker = new THREE.Mesh(markerGeometry, markerMaterial);
        this.marker.position.copy(targetVector);
        this.scene.add(this.marker);

        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        this.animationFrame = requestAnimationFrame(this.animate);
        window.addEventListener("resize", this._handleResize);

        this.onReady();
    }

    animate() {
        this.animationFrame = requestAnimationFrame(this.animate);
        const elapsed = this.clock.getElapsedTime();

        this.earth.rotation.y += 0.0007;
        this.atmosphere.rotation.y += 0.001;
        this.stars.rotation.y += 0.00015;

        if (!this.sequencePlaying) {
            const drift = Math.sin(elapsed * 0.1) * 0.02;
            this.camera.position.x = this.cameraStart.x + drift;
            this.camera.lookAt(this.lookAtStart);
        }

        if (this.marker) {
            const pulse = 0.35 + Math.sin(elapsed * 3.2) * 0.15;
            this.marker.scale.setScalar(1 + pulse * 0.25);
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

                const earthTilt = easeInOutCubic(Math.min(t * 1.4, 1)) * 0.35;
                this.earth.rotation.x = earthTilt;
                this.atmosphere.rotation.x = earthTilt;

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
        this.renderer.setSize(width, height);
    }

    latLngToVector3(lat, lng, radius = 1) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        const x = -radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        return new THREE.Vector3(x, y, z);
    }

    destroy() {
        cancelAnimationFrame(this.animationFrame);
        window.removeEventListener("resize", this._handleResize);
        this.renderer?.dispose();
    }
}
