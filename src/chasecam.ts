// -------------------------------------------------------------------------------------------------
// The ChaseCamera continuously updates a camera to make it follow a target vehicle.
//
//   - constructor(camera: Filament.Camera, vehicle: Vehicle)
//   - tick(dt: number)
//
// HexGL by Thibaut 'BKcore' Despoulain <http://bkcore.com>
// Rewritten by Philip Rideout <https://prideout.net>
// -------------------------------------------------------------------------------------------------

import * as Filament from "filament";

import { vec3 } from "gl-matrix";

import Vehicle from "./vehicle";

const yoffset = 10.0; // how far above the ship the camera flies
const zoffset = 23.0; // how far behind the ship the camera flies
const speedOffsetMax = 10;
const targetYoffset = 6.0; // how far above the ship the camera looks

export default class ChaseCamera {
    private readonly camera: Filament.Camera;
    private readonly vehicle: Vehicle;
    private speedOffset: number; // adds to zoffset after sudden acceleration

    constructor(camera: Filament.Camera, vehicle: Vehicle) {
        this.camera = camera;
        this.vehicle = vehicle;
        this.speedOffset = 0;
    }

    public tick(dt: number) {
        const speed = this.vehicle.speed;
        const orientation = this.vehicle.orientation;
        const position = this.vehicle.position;

        this.speedOffset += (speedOffsetMax * speed - this.speedOffset) *
                Math.min(1.0, 0.3 * dt);

        const up = vec3.fromValues(0, 1, 0);
        vec3.transformQuat(up, up, orientation);

        const dir = vec3.fromValues(0, 0, 1);
        vec3.transformQuat(dir, dir, orientation);

        const cameraPos = vec3.copy(vec3.create(), position);
        vec3.scale(dir, dir, zoffset + this.speedOffset);
        vec3.subtract(cameraPos, cameraPos, dir);
        vec3.scale(up, up, yoffset);
        vec3.add(cameraPos, cameraPos, up);

        const targetPos = vec3.copy(vec3.create(), position);
        vec3.set(up, 0, 1, 0);
        vec3.transformQuat(up, up, orientation);
        vec3.scale(up, up, targetYoffset);
        vec3.add(targetPos, targetPos, up);

        this.camera.lookAt(cameraPos, targetPos, [0, 1, 0]);
    }
}
