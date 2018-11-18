declare module Filament {
    function getSupportedFormatSuffix(desired: string): void;
    function init(assets: string[], onready: () => void): void;
    function fetch(assets: string[], onready: () => void): void;

    class Skybox {}
    class SwapChain {}

    enum Camera$Fov { VERTICAL, HORIZONTAL }

    class Renderer {
        public render(swapChain: SwapChain, view: View): void;
    }

    class Camera {
        public lookAt(eye: number[], center: number[], up: number[]): void;
        public setProjectionFov(fovInDegrees: number, aspect: number,
                                near: number, far: number, fov: Camera$Fov): void;
    }

    class IndirectLight {
        public setIntensity(intensity: number);
    }

    class Scene {
        public setSkybox(sky: Skybox);
        public setIndirectLight(ibl: IndirectLight);
    }

    class View {
        public setCamera(camera: Camera);
        public setScene(scene: Scene);
        public setViewport(viewport: number[]);
    }

    class Engine {
        public static create(HTMLCanvasElement): Engine;
        public getSupportedFormatSuffix(suffix: string): void;
        public init(assets: string[], onready: () => void): void;
        public createScene(): Scene;
        public createSkyFromKtx(url: string): Skybox;
        public createIblFromKtx(url: string): IndirectLight;
        public createSwapChain(): SwapChain;
        public createRenderer(): Renderer;
        public createCamera(): Camera;
        public createView(): View;
        public destroySkybox(skybox: Skybox): void;
    }
}
