// -------------------------------------------------------------------------------------------------
// The ChaseCamera continuously updates a camera to make it follow a target vehicle.
//
//   - constructor(camera: Filament.Camera, vehicle: Vehicle)
//   - tick(dt: number, speed: number)
//
// HexGL by Thibaut 'BKcore' Despoulain <http://bkcore.com>
// Rewritten by Philip Rideout <https://prideout.net>
// -------------------------------------------------------------------------------------------------

import * as Filament from "./filament";

import { vec3 } from "gl-matrix";

import Vehicle from "./vehicle";

export default class ChaseCamera {
    private readonly camera: Filament.Camera;
    private readonly vehicle: Vehicle;
    private readonly speedOffsetMax: number;
    private readonly yoffset: number;
    private readonly targetYoffset: number;
    private readonly zoffset: number;

    private speedOffset: number;

    constructor(camera: Filament.Camera, vehicle: Vehicle) {
        this.camera = camera;
        this.vehicle = vehicle;
        this.yoffset = 10.0; // how far above the ship the camera flies
        this.zoffset = 23.0; // how far behind the ship the camera flies
        this.speedOffset = 0; // adds to zoffset after sudden acceleration
        this.speedOffsetMax = 10;

        this.targetYoffset = 6.0; // how far above the ship the camera looks
    }

    public tick(dt: number, speed: number) {
        this.speedOffset += (this.speedOffsetMax * speed - this.speedOffset) *
                Math.min(1.0, 0.3 * dt);

        const up = vec3.fromValues(0, 1, 0);
        vec3.transformQuat(up, up, this.vehicle.orientation);

        const dir = vec3.fromValues(0, 0, 1);
        vec3.transformQuat(dir, dir, this.vehicle.orientation);

        const cameraPos = vec3.copy(vec3.create(), this.vehicle.position);
        vec3.scale(dir, dir, this.zoffset + this.speedOffset);
        vec3.subtract(cameraPos, cameraPos, dir);
        vec3.scale(up, up, this.yoffset);
        vec3.add(cameraPos, cameraPos, up);

        const targetPos = vec3.copy(vec3.create(), this.vehicle.position);
        vec3.set(up, 0, 1, 0);
        vec3.transformQuat(up, up, this.vehicle.orientation);
        vec3.scale(up, up, this.targetYoffset);
        vec3.add(targetPos, targetPos, up);

        this.camera.lookAt(
                cameraPos as unknown as number[],
                targetPos as unknown as number[],
                [0, 1, 0]);
    }
}
