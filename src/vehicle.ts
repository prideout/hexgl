// -------------------------------------------------------------------------------------------------
// Vehicle represents the position, orientation, and other attributes of a race car.
//
// The Simulation is basically the only component that modifies Vehicle attributes, other components
// need only read-only access.
//
// For convenience, this class can compute a 4x4 matrix that transforms the vehicle from its rest
// pose at the origin to its designated position and orientation within the world. It also proffers
// a method that allows clients to move the ship along its own axis.
//
//   - constructor(position: vec3)
//   - speed: number;
//   - position: vec3;
//   - orientation: quat;
//   - collisionState: CollisionState;
//   - getMatrix(): mat4
//   - translate(v: vec3): void
//
// HexGL by Thibaut 'BKcore' Despoulain <http://bkcore.com>
// Rewritten by Philip Rideout <https://prideout.net>
// -------------------------------------------------------------------------------------------------

import { mat4, quat, vec3 } from "gl-matrix";

export default class Vehicle {
    // The speed is normalized such that 1.0 is maximum and 0.0 is minimum.
    public speed: number;
    public accelerating: boolean;
    public boosted: boolean;

    public readonly position: vec3;
    public readonly orientation: quat;

    // The sole purpose of the collision struct is to allow the effects engine (particles etc)
    // to check if the vehicle has been banged up and draw sparks etc.
    public readonly collisionState: CollisionState;

    // Temporaries.
    private readonly matrix: mat4;
    private readonly temp: vec3;

    constructor(pos: vec3) {
        this.speed = 0.0;
        this.accelerating = false;
        this.boosted = false;
        this.position = vec3.copy(vec3.create(), pos);
        this.orientation = quat.create();
        this.matrix = mat4.create();
        this.temp = vec3.create();
        this.collisionState = {
            front: false,
            left: false,
            right: false,
        };
    }

    public getMatrix(): mat4 {
        return mat4.fromRotationTranslation(this.matrix, this.orientation, this.position);
    }

    public translate(v: vec3) {
        vec3.transformQuat(this.temp, v, this.orientation);
        vec3.add(this.position, this.position, this.temp);
    }
}

interface CollisionState {
    front: boolean;
    left: boolean;
    right: boolean;
}
