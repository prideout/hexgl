import "./filament";

import { mat3, mat4, quat, vec3, vec4 } from "gl-matrix";
import { createWorker, ITypedWorker } from "typed-web-workers";
import { vec4_packSnorm16 } from "./math";
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

const tracksDiffuseUrl = "tracks/diffuse.png";
const tracksSpecularUrl = "tracks/specular.png";
const tracksNormalUrl = "tracks/normal.png";

const shipDiffuseUrl = "ship/diffuse.png";
const shipSpecularUrl = "ship/specular.png";
const shipNormalUrl = "ship/normal.png";

const shippos = [-1134 * 2, 900, -443 * 2];
const camheight = 1000;

Filament.init([skySmallUrl, iblUrl, tracksMaterialUrl ], () => {
    // tslint:disable-next-line:no-string-literal
    window["app"] = new App(document.getElementsByTagName("canvas")[0]);
});

class App {
    private canvas: HTMLCanvasElement;
    private engine: Filament.Engine;
    private scene: Filament.Scene;
    private skybox: Filament.Skybox;
    private indirectLight: Filament.IndirectLight;
    private camera: Filament.Camera;
    private view: Filament.View;
    private swapChain: Filament.SwapChain;
    private renderer: Filament.Renderer;
    private sampler: Filament.TextureSampler;
    private material: Filament.Material;

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

        this.sampler = new Filament.TextureSampler(
            Filament.MinFilter.LINEAR_MIPMAP_LINEAR, Filament.MagFilter.LINEAR,
            Filament.WrapMode.REPEAT);

        this.material = this.engine.createMaterial(tracksMaterialUrl);

        Filament.fetch([ skyLargeUrl, tracksDiffuseUrl, tracksSpecularUrl, tracksNormalUrl ],
                this.onLoadedTracks.bind(this));

        Filament.fetch([ shipDiffuseUrl, shipSpecularUrl, shipNormalUrl ],
                this.onLoadedShip.bind(this));

        const eye =    [ shippos[0], camheight,  shippos[2] ];
        const center = [ shippos[0],    0,  shippos[2] ];
        const up =     [ 0,  0,  1 ];
        this.camera.lookAt(eye, center, up);

        const sunlight = Filament.EntityManager.get().create();
        this.scene.addEntity(sunlight);
        Filament.LightManager.Builder(Filament.LightManager$Type.SUN)
            .color([0.98, 0.92, 0.89])
            .intensity(1100000.0)
            .direction([0, -1, 0])
            .build(this.engine, sunlight);

        this.render = this.render.bind(this);
        this.resize = this.resize.bind(this);
        window.addEventListener("resize", this.resize);
        this.resize();
        window.requestAnimationFrame(this.render);
    }

    private onLoadedTracks() {
        const matinstance = this.material.createInstance();
        const tracks = this.createRenderable(tracksDiffuseUrl, tracksSpecularUrl, tracksNormalUrl,
            Track.faces, Track.vertices, Track.uvs, Track.normals, matinstance);
        this.scene.addEntity(tracks);
        this.engine.destroySkybox(this.skybox);
        this.skybox = this.engine.createSkyFromKtx(skyLargeUrl);
        this.scene.setSkybox(this.skybox);
    }

    private onLoadedShip() {
        const matinstance = this.material.createInstance();
        const ship = this.createRenderable(shipDiffuseUrl, shipSpecularUrl, shipNormalUrl,
            Ship.faces, Ship.vertices, Ship.uvs, Ship.normals, matinstance);

        const transform = mat4.fromTranslation(mat4.create(), shippos) as unknown;
        const tcm = this.engine.getTransformManager();
        const inst = tcm.getInstance(ship);
        tcm.setTransform(inst, transform as number[]);
        inst.delete();

        this.scene.addEntity(ship);
    }

    private render() {
        this.renderer.render(this.swapChain, this.view);
        window.requestAnimationFrame(this.render);
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

    private createRenderable(diffuseUrl, specularUrl, normalUrl, faces, vertices, uvs, normals, matinstance) {
        const VertexAttribute = Filament.VertexAttribute;
        const AttributeType = Filament.VertexBuffer$AttributeType;
        const IndexType = Filament.IndexBuffer$IndexType;
        const PrimitiveType = Filament.RenderableManager$PrimitiveType;

        const diffuse = this.engine.createTextureFromPng(diffuseUrl);
        const specular = this.engine.createTextureFromPng(specularUrl);
        const normal = this.engine.createTextureFromPng(normalUrl);
        matinstance.setTextureParameter("diffuse", diffuse, this.sampler);
        matinstance.setTextureParameter("specular", specular, this.sampler);
        matinstance.setTextureParameter("normal", normal, this.sampler);

        const [verts, tcoords, norms] = processMesh(faces, vertices, uvs, normals);
        const nverts = verts.length / 3;
        const ntriangles = nverts / 3;
        const fp32vertices = new Float32Array(verts);
        const fp32normals = new Float32Array(norms);
        const fp32texcoords = new Float32Array(tcoords);
        const ui16tangents = new Uint16Array(4 * nverts);

        const maxp = vec3.fromValues(-10000, -10000, -10000);
        const minp = vec3.fromValues(+10000,  10000,  10000);

        for (let i = 0; i < nverts; ++i) {
            const src = fp32normals.subarray(i * 3, i * 3 + 3) as vec3;
            const dst = ui16tangents.subarray(i * 4, i * 4 + 4) as vec4;
            const n = vec3.normalize(vec3.create(), src);
            const b = vec3.cross(vec3.create(), n, [0, 1, 0]);
            vec3.normalize(b, b);
            const t = vec3.cross(vec3.create(), b, n);
            const m3 = mat3.fromValues(t[0], t[1], t[2], b[0], b[1], b[2], n[0], n[1], n[2]);
            const q = [0, 0, 0, 1]; // quat.fromMat3(quat.create(), m3);
            vec4_packSnorm16(dst, q);
            const v = fp32vertices.subarray(i * 3, i * 3 + 3) as vec3;
            vec3.max(maxp, maxp, v);
            vec3.min(minp, minp, v);
        }
        console.info(nverts, minp, maxp);

        const vb = Filament.VertexBuffer.Builder()
            .vertexCount(nverts)
            .bufferCount(3)
            .attribute(VertexAttribute.POSITION, 0, AttributeType.FLOAT3, 0, 0)
            .attribute(VertexAttribute.TANGENTS, 1, AttributeType.SHORT4, 0, 0)
            .attribute(VertexAttribute.UV0, 2, AttributeType.FLOAT2, 0, 0)
            .normalized(VertexAttribute.TANGENTS)
            .build(this.engine);

        vb.setBufferAt(this.engine, 0, fp32vertices);
        vb.setBufferAt(this.engine, 1, ui16tangents);
        vb.setBufferAt(this.engine, 2, fp32texcoords);

        // Filament requires an index buffer so unfortunately we need to create a trivial one.
        const dummy = new Uint16Array(ntriangles * 3);
        for (let i = 0; i < dummy.length; i++) {
            dummy[i] = i;
        }

        const ib = Filament.IndexBuffer.Builder()
            .indexCount(dummy.length)
            .bufferType(IndexType.USHORT)
            .build(this.engine);

        ib.setBuffer(this.engine, dummy);

        const renderable = Filament.EntityManager.get().create();

        Filament.RenderableManager.Builder(1)
            .boundingBox([ [-1000, -1000, -1000], [1000, 1000, 1000] ])
            .material(0, matinstance)
            .geometry(0, PrimitiveType.TRIANGLES, vb, ib)
            .build(this.engine, renderable);

        return renderable;
    }
}

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
