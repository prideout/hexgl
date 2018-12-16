// -------------------------------------------------------------------------------------------------
// The ChaseCamera continuously updates a camera to make it follow a target vehicle.
//
//   - constructor(camera: Filament.Camera, vehicle: Vehicle)
//   - tick(dt: number, speed: number)
//
// HexGL by Thibaut 'BKcore' Despoulain <http://bkcore.com>
// Rewritten by Philip Rideout <https://prideout.net>
// -------------------------------------------------------------------------------------------------

import "./filament";

import { vec3 } from "gl-matrix";
import Vehicle from "./vehicle";

export default class ChaseCamera {
    private readonly camera: Filament.Camera;
    private readonly vehicle: Vehicle;
    private readonly speedOffsetMax: number;
    private readonly yoffset: number;
    private readonly zoffset: number;
    private readonly viewOffset: number;

    private speedOffset: number;

    constructor(camera: Filament.Camera, vehicle: Vehicle) {
        this.camera = camera;
        this.vehicle = vehicle;
        this.speedOffset = 0;
        this.speedOffsetMax = 10;
        this.yoffset = 8.0;
        this.zoffset = 30.0; // <= this was 10 in the original game
        this.viewOffset = 10.0;
    }

    public tick(dt: number, speed: number) {
        const up = vec3.fromValues(0, 1, 0);
        vec3.transformQuat(up, up, this.vehicle.orientation);

        const dir = vec3.fromValues(0, 0, 1);
        vec3.transformQuat(dir, dir, this.vehicle.orientation);

        this.speedOffset += (this.speedOffsetMax * speed - this.speedOffset) *
                Math.min(1.0, 0.3 * dt);

        const position = vec3.copy(vec3.create(), this.vehicle.position);

        vec3.scale(dir, dir, this.zoffset + this.speedOffset);
        vec3.subtract(position, position, dir);

        vec3.scale(up, up, this.yoffset);
        vec3.add(position, position, up);

        position[1] += -up[1] + this.yoffset;

        vec3.normalize(dir, dir);
        vec3.scale(dir, dir, this.viewOffset);
        const target = vec3.add(vec3.create(), position, dir);

        this.camera.lookAt(
                position as unknown as number[],
                target as unknown as number[],
                [0, 1, 0]);
    }
}
