// -------------------------------------------------------------------------------------------------
// The Simulation listens to input events and periodically updates the position, orientation, and
// other attributes of a given Vehicle. The CPU reads from two images (collision and elevation)
// to glean information about the race track.
//
//   - constructor(vehicle: Vehicle)
//   - tick(dt: number)
//
// HexGL by Thibaut 'BKcore' Despoulain <http://bkcore.com>
// Rewritten by Philip Rideout <https://prideout.net>
// -------------------------------------------------------------------------------------------------

import * as urls from "./urls";

import Sampler from "./sampler";
import Vehicle from "./vehicle";

import { mat4, quat, vec3 } from "gl-matrix";

export default class Simulation {
    private readonly collision: Sampler;
    private readonly elevation: Sampler;
    private readonly gfxvehicle: Vehicle;
    private readonly keyState: KeyState;
    private readonly movement: vec3;
    private readonly repulsionForce: vec3;
    private readonly repulsionVLeft: vec3;
    private readonly repulsionVRight: vec3;
    private readonly simvehicle: Vehicle;

    private boost: number;
    private drift: number;
    private gradient: number;
    private gradientTarget: number;
    private roll: number;
    private speed: number;
    private tilt: number;
    private tiltTarget: number;
    private yawAngle: number;

    constructor(vehicle: Vehicle) {
        // The orientation of the simulation vehicle only includes yaw.
        this.simvehicle = new Vehicle(vehicle.position);

        // The graphics vehicle includes roll and pitch as well, but for visual appeal only.
        this.gfxvehicle = vehicle;

        this.collision = new Sampler(urls.collision);
        this.elevation = new Sampler(urls.elevation);

        this.keyState = {
            backward: false,
            forward: false,
            left: false,
            ltrigger: false,
            right: false,
            rtrigger: false,
            use: false,
        };
        document.addEventListener("keydown", this.onKeyDown.bind(this));
        document.addEventListener("keyup", this.onKeyUp.bind(this));

        this.movement = vec3.fromValues(0, 0, 0);
        this.roll = 0.0;
        this.drift = 0.0;
        this.speed = 0.0;
        this.boost = 0.0;
        this.yawAngle = 0.0;
        this.gradient = 0.0;
        this.gradientTarget = 0.0;
        this.tilt = 0.0;
        this.tiltTarget = 0.0;
        this.repulsionVLeft = vec3.fromValues(1, 0, 0);
        this.repulsionVRight = vec3.fromValues(-1, 0, 0);
        this.repulsionForce = vec3.create();
    }

    public tick(dt: number) {
        if (!this.collision.ready() || !this.elevation.ready()) {
            return;
        }
        vec3.copy(this.simvehicle.position, this.gfxvehicle.position);
        vec3.set(this.movement, 0, 0, 0);
        this.drift = -this.drift * driftLerp;
        this.yawAngle = -this.yawAngle * yawAngleLerp * .5;

        let rollAmount = 0;
        let yawAngleAmount = 0;

        if (this.keyState.left) {
            yawAngleAmount += yawAngleSpeed * dt;
            rollAmount -= rollAngle;
        }
        if (this.keyState.right) {
            yawAngleAmount -= yawAngleSpeed * dt;
            rollAmount += rollAngle;
        }

        if (this.keyState.forward) {
            this.gfxvehicle.accelerating = true;
            this.speed += thrust * dt;
        } else {
            this.gfxvehicle.accelerating = false;
            this.speed -= airResist * dt;
        }

        if (this.keyState.ltrigger) {
            if (this.keyState.left) {
                yawAngleAmount += airAngularSpeed * dt;
            } else {
                yawAngleAmount += airAngularSpeed * .5 * dt;
            }
            this.speed -= airBrake * dt;
            this.drift += (airDrift - this.drift) * driftLerp;
            this.movement[0] += this.speed * this.drift * dt;
            if (this.drift > 0) {
                this.movement[2] -= this.speed * this.drift * dt;
            }
            rollAmount -= rollAngle * .7;
        }

        if (this.keyState.rtrigger) {
            if (this.keyState.right) {
                yawAngleAmount -= airAngularSpeed * dt;
            } else {
                yawAngleAmount -= airAngularSpeed * .5 * dt;
            }
            this.speed -= airBrake * dt;
            this.drift += (-airDrift - this.drift) * driftLerp;
            this.movement[0] += this.speed * this.drift * dt;
            if (this.drift < 0) {
                this.movement[2] += this.speed * this.drift * dt;
            }
            rollAmount += rollAngle * .7;
        }

        this.yawAngle += (yawAngleAmount - this.yawAngle) * yawAngleLerp;

        this.speed = Math.max(0, Math.min(this.speed, maxSpeed));
        this.movement[2] += this.speed * dt;

        if (vec3AlmostEquals(this.repulsionForce, zero3, 0.0001)) {
            vec3.copy(this.repulsionForce, zero3);
        } else {
            if (this.repulsionForce[2] !== 0) {
                this.movement[2] = 0;
            }
            vec3.add(this.movement, this.movement, this.repulsionForce);
            const t = dt > 1.5 ? repulsionLerp * 2 : repulsionLerp;
            vec3.lerp(this.repulsionForce, this.repulsionForce, zero3, t);
        }

        this.boosterCheck(dt);

        this.simvehicle.translate(vec3.fromValues(this.movement[0], 0, this.movement[2]));
        this.heightCheck();

        this.simvehicle.translate(vec3.fromValues(0, this.movement[1], 0));
        this.collisionCheck();

        // The original HexGL app directly manipulated the Y component of this quat value, but I
        // feel it is more sensical to build the quat from Euler anglers.
        const degrees = this.yawAngle * 150.0;
        const quaternion = quat.fromEuler(quat.create(), 0, degrees, 0);
        quat.multiply(this.simvehicle.orientation, this.simvehicle.orientation, quaternion);

        // The remaining rotations affect the graphics vehicle but not the simulation vehicle.
        const xform = mat4.identity(mat4.create());

        // Gradient
        const gradientDelta = (this.gradientTarget - this.gradient) * gradientLerp;
        if (Math.abs(gradientDelta) > epsilon) {
            this.gradient += gradientDelta;
        }
        if (Math.abs(this.gradient) > epsilon) {
            mat4.rotate(xform, xform, this.gradient, gradientAxis);
        }

        // Tilting
        const tiltDelta = (this.tiltTarget - this.tilt) * tiltLerp;
        if (Math.abs(tiltDelta) > epsilon) {
            this.tilt += tiltDelta;
        }
        if (Math.abs(this.tilt) > epsilon) {
            mat4.rotate(xform, xform, this.tilt, tiltAxis);
        }

        // Rolling
        const rollDelta = (rollAmount - this.roll) * rollLerp;
        if (Math.abs(rollDelta) > epsilon) {
            this.roll += rollDelta;
        }
        if (Math.abs(this.roll) > epsilon) {
            mat4.rotate(xform, xform, this.roll, rollDirection);
        }

        mat4.multiply(xform, this.simvehicle.getMatrix(), xform);
        mat4.getTranslation(this.gfxvehicle.position, xform);
        mat4.getRotation(this.gfxvehicle.orientation, xform);
    }

    private onKeyDown(event) {
        const key = this.keyState;
        switch (event.keyCode) {
            case 38: /*up*/ key.forward = true; break;
            case 40: /*down*/ key.backward = true; break;
            case 37: /*left*/ key.left = true; break;
            case 39: /*right*/ key.right = true; break;
            case 81: /*Q*/ key.ltrigger = true; break;
            case 65: /*A*/ key.ltrigger = true; break;
            case 68: /*D*/ key.rtrigger = true; break;
            case 69: /*E*/ key.rtrigger = true; break;
        }
    }

    private onKeyUp(event) {
        const key = this.keyState;
        switch (event.keyCode) {
            case 38: /*up*/ key.forward = false; break;
            case 40: /*down*/ key.backward = false; break;
            case 37: /*left*/ key.left = false; break;
            case 39: /*right*/ key.right = false; break;
            case 81: /*Q*/ key.ltrigger = false; break;
            case 65: /*A*/ key.ltrigger = false; break;
            case 68: /*D*/ key.rtrigger = false; break;
            case 69: /*E*/ key.rtrigger = false; break;
        }
    }

    private collisionCheck(): void {
        this.gfxvehicle.collisionState.left = false;
        this.gfxvehicle.collisionState.right = false;
        this.gfxvehicle.collisionState.front = false;

        const simpos = this.simvehicle.position;
        const simquat = this.simvehicle.orientation;

        const x = this.collision.width / 2 + simpos[0] * collisionPixelRatio;
        const z = this.collision.height / 2 + simpos[2] * collisionPixelRatio;
        const pos = vec3.fromValues(x, 0, z);

        const collision = this.collision.getPixelBilinear(x, z);
        if (collision.r < 255) {

            // repulsion
            vec3.set(this.repulsionVLeft, 1, 0, 0);
            vec3.set(this.repulsionVRight, -1, 0, 0);
            vec3.transformQuat(this.repulsionVLeft, this.repulsionVLeft, simquat);
            vec3.transformQuat(this.repulsionVRight, this.repulsionVRight, simquat);

            const lPos = vec3.add(this.repulsionVLeft, this.repulsionVLeft, pos);
            const rPos = vec3.add(this.repulsionVRight, this.repulsionVRight, pos);
            const lCol = this.collision.getPixel(Math.round(lPos[0]), Math.round(lPos[2])).r;
            const rCol = this.collision.getPixel(Math.round(rPos[0]), Math.round(rPos[2])).r;

            const repulsionAmount = Math.max(0.8, Math.min(repulsionCap, this.speed * repulsionRatio));
            if (rCol > lCol) {
                this.repulsionForce[0] -= repulsionAmount;
                this.gfxvehicle.collisionState.left = true;
            } else if (rCol < lCol) {
                this.repulsionForce[0] += repulsionAmount;
                this.gfxvehicle.collisionState.right = true;
            } else {
                this.repulsionForce[2] -= repulsionAmount * 4;
                this.gfxvehicle.collisionState.front = true;
                this.speed = 0;
            }

            // Check for a "messy game over". This should rarely happen if the collision system is
            // working properly.
            if (rCol < 128 && lCol < 128) {
                const fCol = this.collision.getPixel(Math.round(pos[0] + 2), Math.round(pos[2] + 2)).r;
                if (fCol < 128) {
                    console.log("GAMEOVER");
                }
            }

            this.speed *= collisionSpeedDecrease;
            this.speed *= (1 - collisionSpeedDecreaseCoef * (1 - collision.r / 255));
            this.boost = 0;
        }
    }

    private boosterCheck(dt: number): void {
        this.gfxvehicle.boosted = false;
        const simpos = this.simvehicle.position;
        this.boost -= boosterDecay * dt;
        if (this.boost < 0) {
            this.boost = 0.0;
        }

        const x = Math.round(this.collision.width / 2 + simpos[0] * collisionPixelRatio);
        const z = Math.round(this.collision.height / 2 + simpos[2] * collisionPixelRatio);
        const color = this.collision.getPixel(x, z);

        if (color.r === 255 && color.g < 127 && color.b < 127) {
            if (this.boost === 0.0) {
                this.gfxvehicle.boosted = true;
            }
            this.boost = boosterSpeed;
        }

        this.movement[2] += this.boost * dt;
    }

    private heightCheck(): void {
        const simpos = this.simvehicle.position;
        const simquat = this.simvehicle.orientation;

        let x = this.elevation.width / 2 + simpos[0] * heightPixelRatio;
        let z = this.elevation.height / 2 + simpos[2] * heightPixelRatio;
        const height = this.elevation.getPixelFBilinear(x, z) / heightScale + heightBias;
        if (height < 16777) {
            const delta = height - simpos[1];
            if (delta > 0) {
                this.movement[1] += delta;
            } else {
                this.movement[1] += delta * heightLerp;
            }
        }

        // gradient
        const gradientVector = vec3.fromValues(0, 0, 5);
        vec3.transformQuat(gradientVector, gradientVector, simquat);
        vec3.add(gradientVector, gradientVector, simpos);
        x = this.elevation.width / 2 + gradientVector[0] * heightPixelRatio;
        z = this.elevation.height / 2 + gradientVector[2] * heightPixelRatio;
        let nheight = this.elevation.getPixelFBilinear(x, z) / heightScale + heightBias;
        if (nheight < 16777) {
            this.gradientTarget = -Math.atan2(nheight - height, 5.0);
        }

        // tilt
        const tiltVector = vec3.fromValues(5, 0, 0);
        vec3.transformQuat(tiltVector, tiltVector, simquat);
        vec3.add(tiltVector, tiltVector, simpos);
        x = this.elevation.width / 2 + tiltVector[0] * heightPixelRatio;
        z = this.elevation.height / 2 + tiltVector[2] * heightPixelRatio;
        nheight = this.elevation.getPixelFBilinear(x, z) / heightScale + heightBias;
        if (nheight >= 16777) {
            vec3.subtract(tiltVector, tiltVector, simpos);
            vec3.scale(tiltVector, tiltVector, -1);
            vec3.add(tiltVector, tiltVector, simpos);
            x = this.elevation.width / 2 + tiltVector[0] * heightPixelRatio;
            z = this.elevation.height / 2 + tiltVector[2] * heightPixelRatio;
            nheight = this.elevation.getPixelFBilinear(x, z) / heightScale + heightBias;
        }
        if (nheight < 16777) {
            this.tiltTarget = Math.atan2(nheight - height, 5.0);
        }
    }
}

interface KeyState {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    ltrigger: boolean;
    rtrigger: boolean;
    use: boolean;
}

const epsilon = 0.00000001;
const zero3 = vec3.create();
const airResist = 0.02;
const airDrift = 0.1;
const thrust = 0.02;
const airBrake = 0.02;
const maxSpeed = 7.0;
const boosterSpeed = maxSpeed * 0.2;
const boosterDecay = 0.01;
const yawAngleSpeed = 0.005;
const airAngularSpeed = 0.0065;
const repulsionRatio = 0.5;
const repulsionCap = 2.5;
const repulsionLerp = 0.1;
const collisionSpeedDecrease = 0.8;
const collisionSpeedDecreaseCoef = 0.8;
const driftLerp = 0.35;
const yawAngleLerp = 0.35;
const gradientAxis = vec3.fromValues(1, 0, 0);
const tiltAxis = vec3.fromValues(0, 0, 1);
const rollAngle = 0.6;
const rollLerp = 0.08;
const rollDirection = vec3.fromValues(0, 0, 1);
const collisionPixelRatio = 2048.0 / 6000.0;
const gradientLerp = 0.05;
const tiltLerp = 0.05;
const heightPixelRatio = 2048.0 / 6000.0;
const heightBias = 4.0;
const heightLerp = 0.4;
const heightScale = 10.0;

function vec3AlmostEquals(a: vec3, b: vec3, vepsilon: number): boolean {
    const a0 = a[0], a1 = a[1], a2 = a[2];
    const b0 = b[0], b1 = b[1], b2 = b[2];
    return (Math.abs(a0 - b0) <= vepsilon * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= vepsilon * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= vepsilon * Math.max(1.0, Math.abs(a2), Math.abs(b2)));
}
