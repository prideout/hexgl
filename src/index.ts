import "./filament";

import { createWorker, ITypedWorker } from "typed-web-workers";
import { processMesh } from "./meshloader";
import { Scrapers1 } from "./scrapers1";
import { Scrapers2 } from "./scrapers2";
import { Ship } from "./ship";
import { Track } from "./track";

const iblSuffix = Filament.getSupportedFormatSuffix("etc s3tc");
const environ = "env/syferfontein_18d_clear_2k";
const iblUrl = `${environ}_ibl${iblSuffix}.ktx.bmp`;
const skySmallUrl = `${environ}_skybox_tiny.ktx.bmp`;
const skyLargeUrl = `${environ}_skybox.ktx.bmp`;
const tracksMaterialUrl = "materials/tracks.filamat";

class App {
    public canvas: HTMLCanvasElement;
    public engine: Filament.Engine;
    public scene: Filament.Scene;
    public skybox: Filament.Skybox;
    public indirectLight: Filament.IndirectLight;
    public swapChain: Filament.SwapChain;
    public renderer: Filament.Renderer;
    public camera: Filament.Camera;
    public view: Filament.View;

    constructor(canvas) {
        this.canvas = canvas;
        this.engine = Filament.Engine.create(canvas);
        this.scene = this.engine.createScene();
        this.skybox = this.engine.createSkyFromKtx(skySmallUrl);
        this.scene.setSkybox(this.skybox);
        this.indirectLight = this.engine.createIblFromKtx(iblUrl);
        this.indirectLight.setIntensity(100000);
        this.scene.setIndirectLight(this.indirectLight);
        this.swapChain = this.engine.createSwapChain();
        this.renderer = this.engine.createRenderer();
        this.camera = this.engine.createCamera();
        this.view = this.engine.createView();
        this.view.setCamera(this.camera);
        this.view.setScene(this.scene);

        Filament.fetch([skyLargeUrl, tracksMaterialUrl], () => {

            const triangles0 = processMesh(Track.faces, Track.vertices, Track.uvs, Track.normals);
            const triangles1 = processMesh(Scrapers1.faces, Scrapers1.vertices, Scrapers1.uvs, Scrapers1.normals);
            const triangles2 = processMesh(Scrapers2.faces, Scrapers2.vertices, Scrapers2.uvs, Scrapers2.normals);
            const triangles3 = processMesh(Ship.faces, Ship.vertices, Ship.uvs, Ship.normals);

            console.info(Track.vertices.length / 3, triangles0.length / 3, Math.max.apply(null, triangles0));
            console.info(Scrapers1.vertices.length / 3, triangles1.length / 3, Math.max.apply(null, triangles1));
            console.info(Scrapers2.vertices.length / 3, triangles2.length / 3, Math.max.apply(null, triangles2));
            console.info(Ship.vertices.length / 3, triangles3.length / 3, Math.max.apply(null, triangles3));

            this.engine.destroySkybox(this.skybox);
            this.skybox = this.engine.createSkyFromKtx(skyLargeUrl);
            this.scene.setSkybox(this.skybox);
        });

        const eye = [0, 0, 4];
        const center = [0, 0, 0];
        const up = [0, 1, 0];
        this.camera.lookAt(eye, center, up);

        this.render = this.render.bind(this);
        this.resize = this.resize.bind(this);
        window.addEventListener("resize", this.resize);
        this.resize();
        window.requestAnimationFrame(this.render);
    }

    public render() {
        this.renderer.render(this.swapChain, this.view);
        window.requestAnimationFrame(this.render);
    }

    public resize() {
        const dpr = window.devicePixelRatio;
        const width = this.canvas.width = window.innerWidth * dpr;
        const height = this.canvas.height = window.innerHeight * dpr;
        this.view.setViewport([0, 0, width, height]);

        const aspect = width / height;
        const Fov = Filament.Camera$Fov;
        const fov = aspect < 1 ? Fov.HORIZONTAL : Fov.VERTICAL;
        this.camera.setProjectionFov(45, aspect, 1.0, 10.0, fov);
    }
}

Filament.init([skySmallUrl, iblUrl], () => {
    window["app"] = new App(document.getElementsByTagName("canvas")[0]);
});

interface Values {
    x: number;
    y: number;
}

function workFn(input: Values, callback: (_: number) => void): void {
    callback(input.x + input.y);
}

function logFn(result: number) {
    console.log(`We received this response from the worker: ${result}`);
}

const typedWorker: ITypedWorker<Values, number> = createWorker(workFn, logFn);

typedWorker.postMessage({ x: 5, y: 5 });
