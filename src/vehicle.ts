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
    private readonly temp: vec3;
    constructor(pos: vec3) {
        this.position = vec3.copy(vec3.create(), pos);
        this.orientation = quat.create();
        this.matrix = mat4.create();
        this.temp = vec3.create();
    }
    public getMatrix(): mat4 {
        return mat4.fromRotationTranslation(this.matrix, this.orientation, this.position);
    }
    public translate(v: vec3) {
        vec3.transformQuat(this.temp, v, this.orientation);
        vec3.add(this.position, this.position, this.temp);
    }
}
