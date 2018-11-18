import { mat3, mat4 } from "gl-matrix";

export function clamp(v, least, most) {
    return Math.max(Math.min(most, v), least);
}

export function packSnorm16(value) {
    return Math.round(clamp(value, -1.0, 1.0) * 32767.0);
}

export function vec4_packSnorm16(out, src) {
    out[0] = packSnorm16(src[0]);
    out[1] = packSnorm16(src[1]);
    out[2] = packSnorm16(src[2]);
    out[3] = packSnorm16(src[3]);
    return out;
}

export function mat3_fromRotation(out, radians, axis) {
    const fromRotationZ = mat3.fromRotation;
    if (axis) {
        return mat3.fromMat4(out, mat4.fromRotation(mat4.create(), radians, axis));
    }
    return fromRotationZ(out, radians);
}
