// -------------------------------------------------------------------------------------------------
// The ChaseCamera adjusts a camera to make it follow a target whose position and orientation are
// represented by a shared matrix.
//
//   - constructor(camera: Filament.Camera, target: mat4)
//   - tick(dt: number, speedRatio: number)
//
// HexGL by Thibaut 'BKcore' Despoulain <http://bkcore.com>
// Rewritten by Philip Rideout <https://prideout.net>
// -------------------------------------------------------------------------------------------------

import "./filament";

import { mat4, quat, vec3 } from "gl-matrix";

export default class ChaseCamera {
    private readonly camera: Filament.Camera;
    private readonly target: mat4;
    private readonly speedOffsetMax: number;
    private readonly yoffset: number;
    private readonly zoffset: number;
    private readonly viewOffset: number;

    private speedOffset: number;

    constructor(camera: Filament.Camera, target: mat4) {
        this.camera = camera;
        this.target = target;
        this.speedOffset = 0;
        this.speedOffsetMax = 10;
        this.yoffset = 8.0;
        this.zoffset = 30.0; // <= this was 10 in the original game
        this.viewOffset = 10.0;
    }

    public tick(dt: number, speedRatio: number) {
        const vehicleOrientation = quat.create();
        mat4.getRotation(vehicleOrientation, this.target);

        const up = vec3.fromValues(0, 1, 0);
        vec3.transformQuat(up, up, vehicleOrientation);

        const dir = vec3.fromValues(0, 0, 1);
        vec3.transformQuat(dir, dir, vehicleOrientation);

        this.speedOffset += (this.speedOffsetMax * speedRatio - this.speedOffset) *
                Math.min(1.0, 0.3 * dt);

        const position = vec3.create();
        mat4.getTranslation(position, this.target);

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
