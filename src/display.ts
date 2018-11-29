import "./filament";

import * as urls from "./urls";

import { mat3, mat4, quat, vec3, vec4 } from "gl-matrix";
import { vec4_packSnorm16 } from "./math";
import { processMesh } from "./meshloader";

const camheight = 100;

declare class Trackball {
    constructor(canvas: HTMLCanvasElement, options: object);
    public getMatrix(): number[];
}

// -------------------------------------------------------------------------------------------------
// The Display draws to the main canvas and manages all Filament entities. Public methods:
//   - render(vehicleMatrix: mat4)
// -------------------------------------------------------------------------------------------------
export default class Display {
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
    private trackball: Trackball;
    private ship: Filament.Entity;

    constructor(canvas) {
        this.canvas = canvas;
        this.trackball = new Trackball(canvas, {
            clampTilt: 0.9 * Math.PI / 2,
            startSpin: 0.0,
        });
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

        this.material = this.engine.createMaterial(urls.tracksMaterial);

        const tracks = [ urls.tracksDiffuse, urls.tracksSpecular, urls.tracksNormal ];
        tracks.push(urls.skyLarge);
        Filament.fetch(tracks, this.onLoadedTracks.bind(this));

        const shipAssets = [ urls.shipDiffuse, urls.shipSpecular, urls.shipNormal ];
        Filament.fetch(shipAssets, this.onLoadedShip.bind(this));

        const scrapers1 = [ urls.scrapers1Diffuse, urls.scrapers1Specular, urls.scrapers1Normal ];
        Filament.fetch(scrapers1, () => {
            const script = document.createElement("script");
            script.onload = this.onLoadedScrapers1.bind(this);
            script.src = "scrapers1/geometry.js";
            document.head.appendChild(script);
        });

        const scrapers2 = [ urls.scrapers2Diffuse, urls.scrapers2Specular, urls.scrapers2Normal ];
        Filament.fetch(scrapers2, () => {
            const script = document.createElement("script");
            script.onload = this.onLoadedScrapers2.bind(this);
            script.src = "scrapers2/geometry.js";
            document.head.appendChild(script);
        });

        const sunlight = Filament.EntityManager.get().create();
        this.scene.addEntity(sunlight);
        Filament.LightManager.Builder(Filament.LightManager$Type.SUN)
            .color([0.98, 0.92, 0.89])
            .intensity(110000.0)
            .direction([0.5, -1, 0])
            .build(this.engine, sunlight);

        this.resize = this.resize.bind(this);
        window.addEventListener("resize", this.resize);
        this.resize();
    }

    public render(vehicleMatrix: mat4) {
        const shippos = mat4.getTranslation(vec3.create(), vehicleMatrix);

        const eye = vec3.fromValues(0, 0, 1);
        const xform = this.trackball.getMatrix() as unknown as mat4;
        mat4.rotateX(xform, xform, -Math.PI * 0.5);
        vec3.transformMat4(eye, eye, xform);

        const dx = eye[0];
        const dy = eye[1];
        const dz = eye[2];

        const eye2 = [
                shippos[0] + camheight * dx,
                shippos[1] + camheight * dy,
                shippos[2] + camheight * dz ];

        const center2 = [ shippos[0], shippos[1], shippos[2] ];
        const up2 =     [ 0,  0,  1 ];

        this.camera.lookAt(eye2, center2, up2);

        if (this.ship) {
            const tcm = this.engine.getTransformManager();
            const inst = tcm.getInstance(this.ship);
            tcm.setTransform(inst, vehicleMatrix as unknown as number[]);
            inst.delete();
        }

        this.renderer.render(this.swapChain, this.view);
    }

    private onLoadedTracks() {
        const matinstance = this.material.createInstance();
        const tracks = this.createRenderable(
            urls.tracksDiffuse, urls.tracksSpecular, urls.tracksNormal,
            TrackFaces, TrackVertices, [TrackUvs], TrackNormals, matinstance);
        this.scene.addEntity(tracks);
        this.engine.destroySkybox(this.skybox);
        this.skybox = this.engine.createSkyFromKtx(urls.skyLarge);
        this.scene.setSkybox(this.skybox);
    }

    private onLoadedShip() {
        const matinstance = this.material.createInstance();
        this.ship = this.createRenderable(
            urls.shipDiffuse, urls.shipSpecular, urls.shipNormal,
            ShipFaces, ShipVertices, [ShipUvs], ShipNormals, matinstance);
        this.scene.addEntity(this.ship);
    }

    private onLoadedScrapers1() {
        const matinstance = this.material.createInstance();
        const scrapers1 = this.createRenderable(
            urls.scrapers1Diffuse, urls.scrapers1Specular, urls.scrapers1Normal,
            Scrapers1Faces, Scrapers1Vertices, [Scrapers1Uvs], Scrapers1Normals, matinstance);
        const transform = mat4.fromTranslation(mat4.create(), [0, 0, 0]) as unknown;
        const tcm = this.engine.getTransformManager();
        const inst = tcm.getInstance(scrapers1);
        tcm.setTransform(inst, transform as number[]);
        inst.delete();
        this.scene.addEntity(scrapers1);
    }

    private onLoadedScrapers2() {
        const matinstance = this.material.createInstance();
        const scrapers2 = this.createRenderable(
            urls.scrapers2Diffuse, urls.scrapers2Specular, urls.scrapers2Normal,
            Scrapers2Faces, Scrapers2Vertices, [Scrapers2Uvs], Scrapers2Normals, matinstance);
        const transform = mat4.fromTranslation(mat4.create(), [0, 0, 0]) as unknown;
        const tcm = this.engine.getTransformManager();
        const inst = tcm.getInstance(scrapers2);
        tcm.setTransform(inst, transform as number[]);
        inst.delete();
        this.scene.addEntity(scrapers2);
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
            const q = quat.fromMat3(quat.create(), m3);
            vec4_packSnorm16(dst, q);
            const v = fp32vertices.subarray(i * 3, i * 3 + 3) as vec3;
            vec3.max(maxp, maxp, v);
            vec3.min(minp, minp, v);
        }

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
            .boundingBox([ minp as unknown as number[], maxp as unknown as number[] ])
            .material(0, matinstance)
            .geometry(0, PrimitiveType.TRIANGLES, vb, ib)
            .culling(false) // TODO: why is culling working incorrectly?
            .build(this.engine, renderable);

        return renderable;
    }
}

declare const TrackVertices: number[];
declare const TrackNormals: number[];
declare const TrackUvs: number[];
declare const TrackFaces: number[];

declare const ShipVertices: number[];
declare const ShipNormals: number[];
declare const ShipUvs: number[];
declare const ShipFaces: number[];

declare const Scrapers1Vertices: number[];
declare const Scrapers1Normals: number[];
declare const Scrapers1Uvs: number[];
declare const Scrapers1Faces: number[];

declare const Scrapers2Vertices: number[];
declare const Scrapers2Normals: number[];
declare const Scrapers2Uvs: number[];
declare const Scrapers2Faces: number[];
