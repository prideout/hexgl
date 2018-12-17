// -------------------------------------------------------------------------------------------------
// The Display draws to the main canvas and manages all Filament entities.
//
//   - constructor(canvas: HTMLCanvasElement, vehicle: Vehicle)
//   - readonly camera: Filament.Camera;
//   - render()
//
// HexGL by Thibaut 'BKcore' Despoulain <http://bkcore.com>
// Rewritten by Philip Rideout <https://prideout.net>
// -------------------------------------------------------------------------------------------------

import * as Filament from "filament";
import * as urls from "./urls";
import Vehicle from "./vehicle";

export default class Display {
    public readonly camera: Filament.Camera;

    private readonly canvas: HTMLCanvasElement;
    private readonly engine: Filament.Engine;
    private readonly indirectLight: Filament.IndirectLight;
    private readonly renderer: Filament.Renderer;
    private readonly sampler: Filament.TextureSampler;
    private readonly scene: Filament.Scene;
    private readonly swapChain: Filament.SwapChain;
    private readonly view: Filament.View;

    private readonly nonlitMaterial: Filament.Material;
    private readonly pbrMaterial: Filament.Material;
    private readonly texMaterial: Filament.Material;

    private readonly vehicle: Vehicle;

    private ship: Filament.Entity;
    private skybox: Filament.Skybox;

    constructor(canvas, vehicle) {
        this.canvas = canvas;
        this.vehicle = vehicle;
        this.engine = Filament.Engine.create(canvas);
        this.scene = this.engine.createScene();
        this.skybox = this.engine.createSkyFromKtx(urls.skySmall);
        this.scene.setSkybox(this.skybox);
        this.indirectLight = this.engine.createIblFromKtx(urls.ibl);
        this.indirectLight.setIntensity(100000);
        this.scene.setIndirectLight(this.indirectLight);
        this.swapChain = this.engine.createSwapChain();
        this.renderer = this.engine.createRenderer();
        this.camera = this.engine.createCamera();
        this.view = this.engine.createView();
        this.view.setCamera(this.camera);
        this.view.setScene(this.scene);

        this.sampler = new Filament.TextureSampler(
            Filament.MinFilter.LINEAR_MIPMAP_LINEAR, Filament.MagFilter.LINEAR,
            Filament.WrapMode.REPEAT);

        this.pbrMaterial = this.engine.createMaterial(urls.pbrMaterial);
        this.nonlitMaterial = this.engine.createMaterial(urls.nonlitMaterial);
        this.texMaterial = this.engine.createMaterial(urls.texMaterial);

        // Load the high-res skybox only after every other asset has been loaded.
        const addEntity = (entity) => {
            this.scene.addEntity(entity);
            if (8 === this.scene.getRenderableCount()) {
                Filament.fetch([urls.skyLarge], () => {
                    this.engine.destroySkybox(this.skybox);
                    this.skybox = this.engine.createSkyFromKtx(urls.skyLarge);
                    this.scene.setSkybox(this.skybox);
                });
            }
        };

        // Load the ship first since it determines camera, then all other assets.
        const filenames = [urls.diffuse, urls.specular, urls.normal, urls.mesh];
        const shipUrls = filenames.map((path) => `ship/${path}`);
        Filament.fetch(shipUrls, () => {

            // Add the vehicle to scene.
            const shipmi = this.pbrMaterial.createInstance();
            this.ship = this.createRenderable("ship", shipmi, 1.0);
            addEntity(this.ship);

            // Add buildings to scene.
            for (const bgasset of ["scrapers1", "scrapers2"]) {
                const bgurls = filenames.map((path) => `${bgasset}/${path}`);
                Filament.fetch(bgurls, () => {
                    const bgmi = this.pbrMaterial.createInstance();
                    addEntity(this.createRenderable(bgasset, bgmi, 0.1));
                });
            }

            // Add race track to scene.
            for (const bgasset of ["tracks"]) {
                const bgurls = filenames.map((path) => `${bgasset}/${path}`);
                Filament.fetch(bgurls, () => {
                    const bgmi = this.pbrMaterial.createInstance();
                    addEntity(this.createRenderable(bgasset, bgmi, 0.0));
                });
            }

            // Add blue boosters to scene.
            const boosterUrl = "bonusspeed/filamesh";
            Filament.fetch([boosterUrl], () => {
                const mi = this.nonlitMaterial.createInstance();
                mi.setFloat4Parameter("color", [0.0, 0.8, 1.0, 1.0]);
                const mesh = this.engine.loadFilamesh(boosterUrl, mi, {});
                addEntity(mesh.renderable);
            });

            // Add start banner and solar panels.
            const bannerTexUrl = "startbanner/albedo.jpg";
            const bannerGeoUrl = "startbanner/filamesh";
            Filament.fetch([bannerGeoUrl, bannerTexUrl], () => {
                const mi = this.texMaterial.createInstance();
                const albedo = this.engine.createTextureFromJpeg(bannerTexUrl);
                mi.setTextureParameter("albedo", albedo, this.sampler);
                const mesh = this.engine.loadFilamesh(bannerGeoUrl, mi, {});
                addEntity(mesh.renderable);
            });

            const panelsTexUrl = "startpanels/albedo.jpg";
            const panelsGeoUrl = "startpanels/filamesh";
            Filament.fetch([panelsGeoUrl, panelsTexUrl], () => {
                const mi = this.texMaterial.createInstance();
                const albedo = this.engine.createTextureFromJpeg(panelsTexUrl);
                mi.setTextureParameter("albedo", albedo, this.sampler);
                const mesh = this.engine.loadFilamesh(panelsGeoUrl, mi, {});
                addEntity(mesh.renderable);
            });
        });

        const sunlight = Filament.EntityManager.get().create();
        Filament.LightManager.Builder(Filament.LightManager$Type.SUN)
            .color([0.98, 0.92, 0.89])
            .castShadows(true)
            .intensity(110000.0)
            .direction([0.5, -1, 0])
            .build(this.engine, sunlight);
        addEntity(sunlight);

        this.resize = this.resize.bind(this);
        window.addEventListener("resize", this.resize);
        this.resize();
    }

    public render() {
        if (this.ship) {
            const tcm = this.engine.getTransformManager();
            const inst = tcm.getInstance(this.ship);
            tcm.setTransform(inst, this.vehicle.getMatrix());
            inst.delete();
        }
        this.renderer.render(this.swapChain, this.view);
    }

    private resize() {
        const dpr = window.devicePixelRatio;
        const width = this.canvas.width = window.innerWidth * dpr;
        const height = this.canvas.height = window.innerHeight * dpr;
        this.view.setViewport([0, 0, width, height]);

        const aspect = width / height;
        const Fov = Filament.Camera$Fov;
        const fov = aspect < 1 ? Fov.HORIZONTAL : Fov.VERTICAL;
        this.camera.setProjectionFov(45, aspect, 1.0, 20000.0, fov);
    }

    private createRenderable(name, matinstance, clearCoat) {
        const diffuse = this.engine.createTextureFromJpeg(`${name}/${urls.diffuse}`);
        const specular = this.engine.createTextureFromJpeg(`${name}/${urls.specular}`);
        const normal = this.engine.createTextureFromJpeg(`${name}/${urls.normal}`);
        matinstance.setTextureParameter("diffuse", diffuse, this.sampler);
        matinstance.setTextureParameter("specular", specular, this.sampler);
        matinstance.setTextureParameter("normal", normal, this.sampler);

        matinstance.setFloatParameter("metallic", 1.0);
        matinstance.setFloatParameter("reflectance", 1.0);
        matinstance.setFloatParameter("clearCoat", clearCoat);
        matinstance.setFloatParameter("clearCoatRoughness", 0.0);

        const entity = this.engine.loadFilamesh(`${name}/${urls.mesh}`, matinstance, {}).renderable;

        const rm = this.engine.getRenderableManager();
        const inst = rm.getInstance(entity);
        rm.setCastShadows(inst, true);
        rm.setReceiveShadows(inst, true);
        inst.delete();

        return entity;
    }
}
