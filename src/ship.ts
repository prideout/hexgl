declare const ShipVertices: number[];
declare const ShipNormals: number[];
declare const ShipUvs: number[];
declare const ShipFaces: number[];

export const Ship = {
    colors: [],
    faces: ShipFaces,
    materials: [{
        colorAmbient : [0.588, 0.588, 0.588],
        colorDiffuse : [0.588, 0.588, 0.588],
        colorSpecular : [0.0, 0.0, 0.0],
        illumination : 2,
        opticalDensity : 1.5,
        specularCoef : 10.0,
        transparency : 0.0,
    }],
    morphColors: [],
    morphTargets: [],
    normals: ShipNormals,
    scale : 1.000000,
    uvs: [ShipUvs],
    vertices: ShipVertices,
};
