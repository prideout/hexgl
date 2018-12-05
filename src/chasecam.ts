// -------------------------------------------------------------------------------------------------
// The ChaseCamera updates a camera to follow an object transformed by a shared matrix.
//
//   - constructor(camera: Filament.Camera, target: mat4)
//   - tick(dt: number)
//
// HexGL by Thibaut 'BKcore' Despoulain <http://bkcore.com>
// Rewritten by Philip Rideout <https://prideout.net>
// -------------------------------------------------------------------------------------------------

import "./filament";

import { mat4 } from "gl-matrix";

export default class ChaseCamera {
    readonly camera: Filament.Camera;
    readonly target: mat4;

    constructor(camera: Filament.Camera, target: mat4) {
        this.camera = camera;
        this.target = target;
    }

    tick(dt: number) {

    }
}
