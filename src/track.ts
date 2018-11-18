declare const TrackVertices: number[];
declare const TrackNormals: number[];
declare const TrackUvs: number[];
declare const TrackFaces: number[];

export const Track = {
    "metadata": {
        "formatVersion" : 3.1,
        "sourceFile"    : "track2o.obj",
        "generatedBy"   : "OBJConverter",
        "vertices"      : 4800,
        "faces"         : 9600,
        "normals"       : 6800,
        "colors"        : 0,
        "uvs"           : 59,
        "materials"     : 1
    },
    "scale" : 1.000000,
    "materials": [	{
        "colorAmbient" : [0.588235, 0.588235, 0.588235],
        "colorDiffuse" : [0.588235, 0.588235, 0.588235],
        "colorSpecular" : [0.0, 0.0, 0.0],
        "illumination" : 2,
        "opticalDensity" : 1.5,
        "specularCoef" : 9.999999,
        "transparency" : 0.0
    }],
    "vertices": TrackVertices,
    "morphTargets": [],
    "morphColors": [],
    "normals": TrackNormals,
    "colors": [],
    "uvs": [TrackUvs],
    "faces": TrackFaces
};
