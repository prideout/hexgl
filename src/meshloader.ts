// https://github.com/mrdoob/three.js/blob/dev/src/loaders/JSONLoader.js#L169
export function processMesh(faces, verts, uvs, normals) {
    const zLength = faces.length;
    let i, j, fi, colorIndex, normalIndex, uvIndex, materialIndex, normal, hex,
            face, faceA, faceB, uvLayer, uv, u, v, offset = 0;
    const faceVertexUvs = [], colors = [];

    let nUvLayers = 0;

    if (uvs !== undefined) {
        for (i = 0; i < uvs.length; i++) {
            if (uvs[i].length) { nUvLayers++; }
        }
        for (i = 0; i < nUvLayers; i++) {
            faceVertexUvs[i] = [];
        }
    }

    const tris = [];
    let nquads = 0;

    while (offset < zLength) {
        const type = faces[offset++];
        const isQuad = type & 1;
        const hasMaterial = type & 2;
        const hasFaceVertexUv = type & 8;
        const hasFaceNormal = type & 16;
        const hasFaceVertexNormal = type & 32;
        const hasFaceColor = type & 64;
        const hasFaceVertexColor = type & 128;

        if (isQuad) {
            nquads++;
            faceA = [
                faces[offset],
                faces[offset + 1],
                faces[offset + 3],
           ];
            faceB = [
                faces[offset + 1],
                faces[offset + 2],
                faces[offset + 3],
           ];
            offset += 4;
            if (hasMaterial) {
                materialIndex = faces[offset++];
                faceA.materialIndex = materialIndex;
                faceB.materialIndex = materialIndex;
            }

            // to get face <=> uv index correspondence

            fi = tris.length / 3;
            if (hasFaceVertexUv) {
                for (i = 0; i < nUvLayers; i++) {
                    uvLayer = uvs[i];
                    faceVertexUvs[i][fi] = [];
                    faceVertexUvs[i][fi + 1] = [];
                    for (j = 0; j < 4; j++) {
                        uvIndex = faces[offset++];
                        u = uvLayer[uvIndex * 2];
                        v = uvLayer[uvIndex * 2 + 1];
                        uv = [u, v];
                        if (j !== 2) { faceVertexUvs[i][fi].push(uv); }
                        if (j !== 0) { faceVertexUvs[i][fi + 1].push(uv); }
                    }
                }
            }

            if (hasFaceNormal) {
                normalIndex = faces[offset++] * 3;
                const x = normals[normalIndex++];
                const y = normals[normalIndex++];
                const z = normals[normalIndex];
                // faceA.normal.set(x, y, z);
                // faceB.normal.set(x, y, z);
            }

            if (hasFaceVertexNormal) {
                for (i = 0; i < 4; i++) {
                    normalIndex = faces[offset++] * 3;
                    normal = [
                        normals[normalIndex++],
                        normals[normalIndex++],
                        normals[normalIndex],
                   ];
                    // if (i !== 2) { faceA.vertexNormals.push(normal); }
                    // if (i !== 0) { faceB.vertexNormals.push(normal); }
                }
            }

            if (hasFaceColor) {
                colorIndex = faces[offset++];
                hex = colors[colorIndex];
                // faceA.color.setHex(hex);
                // faceB.color.setHex(hex);
            }

            if (hasFaceVertexColor) {
                for (i = 0; i < 4; i++) {
                    colorIndex = faces[offset++];
                    hex = colors[colorIndex];
                    // if (i !== 2) { faceA.vertexColors.push(hex); }
                    // if (i !== 0) { faceB.vertexColors.push(hex); }
                }
            }

            tris.push(faceA[0]);
            tris.push(faceA[1]);
            tris.push(faceA[2]);
            tris.push(faceB[0]);
            tris.push(faceB[1]);
            tris.push(faceB[2]);

        } else { // ! isQuad

            face = [
                faces[offset++],
                faces[offset++],
                faces[offset++],
           ];

            if (hasMaterial) {
                materialIndex = faces[offset++];
                face.materialIndex = materialIndex;
            }

            // to get face <=> uv index correspondence

            fi = tris.length / 3;
            if (hasFaceVertexUv) {
                for (i = 0; i < nUvLayers; i++) {
                    uvLayer = uvs[i];
                    faceVertexUvs[i][fi] = [];
                    for (j = 0; j < 3; j++) {
                        uvIndex = faces[offset++];
                        u = uvLayer[uvIndex * 2];
                        v = uvLayer[uvIndex * 2 + 1];
                        uv = [u, v];
                        faceVertexUvs[i][fi].push(uv);
                    }
                }
            }

            if (hasFaceNormal) {
                normalIndex = faces[offset++] * 3;
                const x = normals[normalIndex++];
                const y = normals[normalIndex++];
                const z = normals[normalIndex];
                // face.normal.set(x, y, z);
            }

            if (hasFaceVertexNormal) {
                for (i = 0; i < 3; i++) {
                    normalIndex = faces[offset++] * 3;
                    normal = [
                        normals[normalIndex++],
                        normals[normalIndex++],
                        normals[normalIndex],
                   ];
                    // face.vertexNormals.push(normal); // prideout
                }
            }

            if (hasFaceColor) {
                colorIndex = faces[offset++];
                // face.color.setHex(colors[colorIndex]);
            }

            if (hasFaceVertexColor) {
                for (i = 0; i < 3; i++) {
                    colorIndex = faces[offset++];
                    // face.vertexColors.push(colors[colorIndex]);
                }
            }

            tris.push(face[0]);
            tris.push(face[1]);
            tris.push(face[2]);
        }
    }

    const texcoords = [];

    const transformFaceUvsToVertexUvs = true;
    if (transformFaceUvsToVertexUvs) {
        for (let f = 0, nfaces = tris.length / 3; f < nfaces; f++) {
            const thisface = faceVertexUvs[0][f];
            const uv0 = thisface[0];
            const uv1 = thisface[1];
            const uv2 = thisface[2];
            const i0 = tris[f * 3 + 0];
            const i1 = tris[f * 3 + 1];
            const i2 = tris[f * 3 + 2];
            texcoords[i0 * 2 + 0] = uv0[0];
            texcoords[i0 * 2 + 1] = uv0[1];
            texcoords[i1 * 2 + 0] = uv1[0];
            texcoords[i1 * 2 + 1] = uv1[1];
            texcoords[i2 * 2 + 0] = uv2[0];
            texcoords[i2 * 2 + 1] = uv2[1];
        }
    }

    console.info(`# of uv coords = ${faceVertexUvs[0].length}, quads = ${nquads}`);
    return [tris, texcoords];
}
