// -------------------------------------------------------------------------------------------------
// Vehicle represents the position and orientation of the racing vehicle.
//
// For convenience, this class can compute a 4x4 matrix that transforms the vehicle from its rest
// pose at the origin to its designated position and orientation within the world.
// -------------------------------------------------------------------------------------------------

import { mat4, quat, vec3 } from "gl-matrix";

export default class Vehicle {
    public readonly position: vec3;
    public readonly orientation: quat;
    private readonly matrix: mat4;
    constructor() {
        this.position = vec3.create();
        this.orientation = quat.create();
        this.matrix = mat4.create();
    }
    public getMatrix(): mat4 {
        return mat4.fromRotationTranslation(this.matrix, this.orientation, this.position);
    }
}