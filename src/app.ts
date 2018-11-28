import * as urls from "./urls";

import { createWorker, ITypedWorker } from "typed-web-workers";
import { mat4, vec3 } from "gl-matrix";

import Display from "./display";
import Sampler from "./sampler";
import Simulation from "./simulation";

const initialVehiclePosition = vec3.fromValues(-1134 * 2, 400, -886);
const vehicleMatrix = mat4.create();

Filament.init([urls.skySmall, urls.ibl, urls.tracksMaterial ], () => {
    window["app"] = new App();
});

// The App owns the Display and Simulation.
class App {
    private display: Display;
    private simulation: Simulation;
    private time: number;

    constructor() {
        const canvas = document.getElementsByTagName("canvas")[0];
        this.display = new Display(canvas);
        (() => {
            let k = 0;
            const onload = () => {
                if (++k === 2) {
                    this.simulation = new Simulation(canvas, collision, elevation);
                    this.simulation.resetPosition(initialVehiclePosition);
                }
            };
            const collision = new Sampler(urls.collision, onload);
            const elevation = new Sampler(urls.elevation, onload);
        })();
        this.tick = this.tick.bind(this);
        window.requestAnimationFrame(this.tick);
    }

    private tick() {
        const time = Date.now();
        if (this.time === null) {
            this.time = time;
        }
        const dt = (time - this.time) * 0.1;
        this.time = time;
        if (this.simulation) {
            this.simulation.tick(dt);
            mat4.copy(vehicleMatrix, this.simulation.getMatrix());
        }
        this.display.render(vehicleMatrix);
        window.requestAnimationFrame(this.tick);
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
