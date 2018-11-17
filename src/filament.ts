declare module Filament {
    function getSupportedFormatSuffix(string): void;
    function init(assets: Array<string>, onready: Function): void;
    function fetch(assets: Array<string>, onready: Function): void;

    class Skybox {}
    class SwapChain {}

    enum Camera$Fov { VERTICAL, HORIZONTAL, }

    class Renderer {
        render(swapChain: SwapChain, view: View): void;
    }

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
