import render = require('./render');

import { createWorker, ITypedWorker } from 'typed-web-workers'

declare namespace Filament {
    function getSupportedFormatSuffix(string): void;
    function init(assets: Array<string>, onready: Function): void;
    function fetch(assets: Array<string>, onready: Function): void;

    class Skybox {}
    class SwapChain {}
    class Renderer {}

    enum Camera$Fov { VERTICAL, HORIZONTAL, }

    class Camera {
        lookAt(eye: Array<number>, center: Array<number>, up: Array<number>): void;
        setProjectionFov(fovInDegrees: number, aspect: number,
                near: number, far: number, fov: Camera$Fov): void;
    }

    class IndirectLight {
        setIntensity(intensity: number);
    }

    class Scene {
        setSkybox(sky: Skybox);
        setIndirectLight(ibl: IndirectLight);
    }

    class View {
        setCamera(camera: Camera);
        setScene(scene: Scene);
        setViewport(viewport: Array<number>);
    }

    class Engine {
        static create(HTMLCanvasElement): Engine;
        getSupportedFormatSuffix(string): void;
        init(assets: Array<string>, onready: Function): void;
        createScene(): Scene;
        createSkyFromKtx(url: string): Skybox;
        createIblFromKtx(url: string): IndirectLight;
        createSwapChain(): SwapChain;
        createRenderer(): Renderer;
        createCamera(): Camera;
        createView(): View;
        destroySkybox(skybox: Skybox): void;
    }
}

const ibl_suffix = Filament.getSupportedFormatSuffix('etc s3tc');
const environ = 'syferfontein_18d_clear_2k'
const ibl_url = `${environ}_ibl${ibl_suffix}.ktx.bmp`;
const sky_small_url = `${environ}_skybox_tiny.ktx.bmp`;
const sky_large_url = `${environ}_skybox.ktx.bmp`;

class App {
    canvas: HTMLCanvasElement;
    engine: Filament.Engine;
    scene: Filament.Scene;
    skybox: Filament.Skybox;
    indirectLight: Filament.IndirectLight;
    swapChain: Filament.SwapChain;
    renderer: Filament.Renderer;
    camera: Filament.Camera;
    view: Filament.View;

    constructor(canvas) {
        this.canvas = canvas;
        this.engine = Filament.Engine.create(canvas);
        this.scene = this.engine.createScene();
        this.skybox = this.engine.createSkyFromKtx(sky_small_url);
        this.scene.setSkybox(this.skybox);
        this.indirectLight = this.engine.createIblFromKtx(ibl_url);
        this.indirectLight.setIntensity(100000);
        this.scene.setIndirectLight(this.indirectLight);
        this.swapChain = this.engine.createSwapChain();
        this.renderer = this.engine.createRenderer();
        this.camera = this.engine.createCamera();
        this.view = this.engine.createView();
        this.view.setCamera(this.camera);
        this.view.setScene(this.scene);

        Filament.fetch([sky_large_url], () => {
            this.engine.destroySkybox(this.skybox);
            this.skybox = this.engine.createSkyFromKtx(sky_large_url);
            this.scene.setSkybox(this.skybox);
        });

        const eye = [0, 0, 4], center = [0, 0, 0], up = [0, 1, 0];
        this.camera.lookAt(eye, center, up);

        this.render = this.render.bind(this);
        this.resize = this.resize.bind(this);
        window.addEventListener('resize', this.resize);
        this.resize();
        window.requestAnimationFrame(this.render);
    }

    render() {
        this.renderer.render(this.swapChain, this.view);
        window.requestAnimationFrame(this.render);
    }

    resize() {
        const dpr = window.devicePixelRatio;
        const width = this.canvas.width = window.innerWidth * dpr;
        const height = this.canvas.height = window.innerHeight * dpr;
        this.view.setViewport([0, 0, width, height]);

        const aspect = width / height;
        const Fov = Filament.Camera$Fov, fov = aspect < 1 ? Fov.HORIZONTAL : Fov.VERTICAL;
        this.camera.setProjectionFov(45, aspect, 1.0, 10.0, fov);
    }
}

declare namespace window {
    let app: App;
}

Filament.init([sky_small_url, ibl_url], () => {
    window.app = new App(document.getElementsByTagName('canvas')[0]);
});

render();

interface Values {
    x: number
    y: number
}

function workFn(input: Values, callback: (_: number) => void): void {
    callback(input.x + input.y)
}

function logFn(result: number) {
    console.log(`We received this response from the worker: ${result}`)
}

const typedWorker: ITypedWorker<Values, number> = createWorker(workFn, logFn)

typedWorker.postMessage({ x: 5, y: 5 })
