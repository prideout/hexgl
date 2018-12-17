// -------------------------------------------------------------------------------------------------
// The App owns the Display and Simulation.
//
// HexGL by Thibaut 'BKcore' Despoulain <http://bkcore.com>
// Rewritten by Philip Rideout <https://prideout.net>
// -------------------------------------------------------------------------------------------------

import * as Filament from "filament";
import * as urls from "./urls";

import { glMatrix, vec3 } from "gl-matrix";

import Audio from "./audio";
import ChaseCamera from "./chasecam";
import Display from "./display";
import Simulation from "./simulation";
import Vehicle from "./vehicle";

// These are only the assets that must be loaded before creating the Filament engine. Note that many
// other assets are fetched later in the initialization process (e.g. mesh data).
const initialAssets = [
    urls.skySmall,
    urls.ibl,
    urls.pbrMaterial,
    urls.nonlitMaterial,
    urls.texMaterial,
];

Filament.init(initialAssets, () => {
    // HexGL requires 64-bit precision and fast instantiation of vectors.
    glMatrix.setMatrixArrayType(Array);

    // The global app instance can be accessed for debugging purposes only.
    window["app"] = new App();
});

class App {
    private readonly display: Display;
    private readonly chasecam: ChaseCamera;
    private readonly simulation: Simulation;
    private readonly audio: Audio;
    private time: number;

    constructor() {
        this.tick = this.tick.bind(this);
        const canvas = document.getElementsByTagName("canvas")[0];
        const vehicle = new Vehicle(initialVehiclePosition);
        this.simulation = new Simulation(vehicle);
        this.audio = new Audio(vehicle);
        this.display = new Display(canvas, vehicle, this.audio.init.bind(this.audio));
        this.chasecam = new ChaseCamera(this.display.camera, vehicle);
        this.time = Date.now();
        window.requestAnimationFrame(this.tick);
    }

    private tick() {
        // Determine the time step.
        const time = Date.now();
        const dt = (time - this.time) * 0.1;
        this.time = time;

        // Update the vehicle orientation and position.
        this.simulation.tick(dt);

        // Update the camera position.
        this.chasecam.tick(dt);

        // Render the 3D scene.
        this.display.render();
        this.audio.render();

        // Request the next frame.
        window.requestAnimationFrame(this.tick);
    }
}

const initialVehiclePosition = vec3.fromValues(-2268, 400, -886);
