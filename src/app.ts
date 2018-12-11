// -------------------------------------------------------------------------------------------------
// The App owns the Display and Simulation.
//
// HexGL by Thibaut 'BKcore' Despoulain <http://bkcore.com>
// Rewritten by Philip Rideout <https://prideout.net>
// -------------------------------------------------------------------------------------------------

import * as urls from "./urls";

import { glMatrix, mat4, vec3 } from "gl-matrix";
import { createWorker, ITypedWorker } from "typed-web-workers";

import ChaseCamera from "./chasecam";
import Display from "./display";
import Sampler from "./sampler";
import Simulation from "./simulation";

const initialVehiclePosition = vec3.fromValues(-1134 * 2, 400, -886);

Filament.init([urls.skySmall, urls.ibl, urls.tracksMaterial ], () => {
    // HexGL requires 64-bit precision and fast instantiation of vectors.
    glMatrix.setMatrixArrayType(Array);
    // The global app instance can be accessed for debugging purposes only.
    window["app"] = new App();
});

class App {
    private readonly display: Display;
    private readonly chasecam: ChaseCamera;
    private simulation: Simulation;
    private time: number;

    constructor() {
        const canvas = document.getElementsByTagName("canvas")[0];
        this.display = new Display(canvas);
        const collision = new Sampler(urls.collision);
        const elevation = new Sampler(urls.elevation);
        this.simulation = new Simulation(collision, elevation);
        this.simulation.resetPosition(initialVehiclePosition);
        this.chasecam = new ChaseCamera(this.display.camera, this.simulation.vehicle);
        this.tick = this.tick.bind(this);
        this.time = null;
        window.requestAnimationFrame(this.tick);
    }

    private tick() {
        // Determine the time step.
        const time = Date.now();
        if (this.time === null) {
            this.time = time;
        }
        const dt = (time - this.time) * 0.1;
        this.time = time;

        // Update the vehicle orientation and position.
        this.simulation.tick(dt);

        // Update the camera position.
        this.chasecam.tick(dt, this.simulation.getSpeedRatio());

        // Render the 3D scene.
        this.display.render(this.simulation.vehicle.getMatrix());

        // Request the next frame.
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
