import "./filament";

import { mat3, quat, vec3, vec4 } from "gl-matrix";
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

    constructor(canvas) {
        this.canvas = canvas;
        this.engine = Filament.Engine.create(canvas);
        this.scene = this.engine.createScene();
        this.skybox = this.engine.createSkyFromKtx(skySmallUrl);
        this.scene.setSkybox(this.skybox);
        this.indirectLight = this.engine.createIblFromKtx(iblUrl);
        this.indirectLight.setIntensity(1000000); // extra zero :)
        this.scene.setIndirectLight(this.indirectLight);
        this.swapChain = this.engine.createSwapChain();
        this.renderer = this.engine.createRenderer();
        this.camera = this.engine.createCamera();
        this.view = this.engine.createView();
        this.view.setCamera(this.camera);
        this.view.setScene(this.scene);

        Filament.fetch([
            skyLargeUrl,
            tracksMaterialUrl,
            tracksDiffuseUrl,
            tracksSpecularUrl,
            tracksNormalUrl,
        ], () => {
            this.onload();
        });

        const shippos = [-1134 * 2, 15, -443 * 2];

        const eye =    [ 0, -1000,  0];
        const center = [ 0,  0,  0];
        const up =     [ 0,  0,  1];
        this.camera.lookAt(eye, center, up);

        this.render = this.render.bind(this);
        this.resize = this.resize.bind(this);
        window.addEventListener("resize", this.resize);
        this.resize();
        window.requestAnimationFrame(this.render);
    }

    private onload() {
        const sampler = new Filament.TextureSampler(
            Filament.MinFilter.LINEAR_MIPMAP_LINEAR,
            Filament.MagFilter.LINEAR,
            Filament.WrapMode.REPEAT);

        const diffuse = this.engine.createTextureFromPng(tracksDiffuseUrl);
        const specular = this.engine.createTextureFromPng(tracksSpecularUrl);
        const normal = this.engine.createTextureFromPng(tracksNormalUrl);

        const material = this.engine.createMaterial(tracksMaterialUrl);
        const matinstance = material.createInstance();
        matinstance.setTextureParameter("diffuse", diffuse, sampler);
        matinstance.setTextureParameter("specular", specular, sampler);
        matinstance.setTextureParameter("normal", normal, sampler);

        const [triangles0, uvs0] = processMesh(Track.faces, Track.vertices, Track.uvs, Track.normals);
        console.info(`TRACK
            nverts=${Track.vertices.length / 3}
            nuvs=${Track.uvs[0].length / 2}
            ntris=${triangles0.length / 3}
            maxind=${Math.max.apply(null, triangles0)}`);

        const [triangles1, uvs1] = processMesh(Scrapers1.faces, Scrapers1.vertices, Scrapers1.uvs,
            Scrapers1.normals);
        console.info(`SCRAPERS1
            nverts=${Scrapers1.vertices.length / 3}
            nuvs=${Scrapers1.uvs[0].length / 2}
            ntris=${triangles1.length / 3}
            maxind=${Math.max.apply(null, triangles1)}`);

        const [triangles2, uvs2] = processMesh(Scrapers2.faces, Scrapers2.vertices, Scrapers2.uvs,
            Scrapers2.normals);
        console.info(`SCRAPERS2
            nverts=${Scrapers2.vertices.length / 3}
            nuvs=${Scrapers2.uvs[0].length / 2}
            ntris=${triangles2.length / 3}
            maxind=${Math.max.apply(null, triangles2)}`);

        const [triangles3, uvs3] = processMesh(Ship.faces, Ship.vertices, Ship.uvs, Ship.normals);
        console.info(`SHIP
            nverts=${Ship.vertices.length / 3}
            nuvs=${Ship.uvs[0].length / 2}
            ntris=${triangles3.length / 3}
            maxind=${Math.max.apply(null, triangles3)}`);

        const nverts = Track.vertices.length / 3;
        const vertices = new Float32Array(Track.vertices);
        const tangents = new Uint16Array(4 * nverts);
        const texcoords = new Float32Array(uvs0);

        for (let i = 0; i < nverts; ++i) {
            const src = vertices.subarray(i * 3, i * 3 + 3) as vec3;
            const dst = tangents.subarray(i * 4, i * 4 + 4) as vec4;
            const n = vec3.normalize(vec3.create(), src);
            const b = vec3.cross(vec3.create(), n, [0, 1, 0]);
            vec3.normalize(b, b);
            const t = vec3.cross(vec3.create(), b, n);
            const m3 = mat3.fromValues(t[0], t[1], t[2], b[0], b[1], b[2], n[0], n[1], n[2]);
            const q = quat.fromMat3(quat.create(), m3);
            vec4_packSnorm16(dst, q);
        }

        const VertexAttribute = Filament.VertexAttribute;
        const AttributeType = Filament.VertexBuffer$AttributeType;
        const IndexType = Filament.IndexBuffer$IndexType;
        const PrimitiveType = Filament.RenderableManager$PrimitiveType;

        const vb = Filament.VertexBuffer.Builder()
            .vertexCount(nverts)
            .bufferCount(3)
            .attribute(VertexAttribute.POSITION, 0, AttributeType.FLOAT3, 0, 0)
            .attribute(VertexAttribute.TANGENTS, 1, AttributeType.SHORT4, 0, 0)
            .attribute(VertexAttribute.UV0, 2, AttributeType.FLOAT2, 0, 0)
            .normalized(VertexAttribute.TANGENTS)
            .build(this.engine);

        vb.setBufferAt(this.engine, 0, vertices);
        vb.setBufferAt(this.engine, 1, tangents);
        vb.setBufferAt(this.engine, 2, texcoords);

        const ib = Filament.IndexBuffer.Builder()
            .indexCount(triangles0.length)
            .bufferType(IndexType.USHORT)
            .build(this.engine);

        ib.setBuffer(this.engine, new Uint16Array(triangles0));

        const renderable = Filament.EntityManager.get().create();
        this.scene.addEntity(renderable);

        Filament.RenderableManager.Builder(1)
            .boundingBox([ [-1, -1, -1], [1, 1, 1] ])
            .material(0, matinstance)
            .geometry(0, PrimitiveType.TRIANGLES, vb, ib)
            .build(this.engine, renderable);

        this.engine.destroySkybox(this.skybox);
        this.skybox = this.engine.createSkyFromKtx(skyLargeUrl);
        this.scene.setSkybox(this.skybox);
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
        this.camera.setProjectionFov(45, aspect, 1.0, 2000.0, fov);
    }
}

Filament.init([skySmallUrl, iblUrl], () => {
    // tslint:disable-next-line:no-string-literal
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
