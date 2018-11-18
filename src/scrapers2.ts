interface Geometry {
    metadata: any;
    scale: number;
    [key: string]: any;
}

declare const Scrapers2Vertices: Array<number>;
declare const Scrapers2Normals: Array<number>;
declare const Scrapers2Uvs: Array<number>;
declare const Scrapers2Faces: Array<number>;

export const Scrapers2 = {
    "metadata" : {
        "formatVersion" : 3.1,
        "sourceFile"    : "skyscrapper2.obj",
        "generatedBy"   : "OBJConverter",
        "vertices"      : 96,
        "faces"         : 176,
        "normals"       : 24,
        "colors"        : 0,
        "uvs"           : 24,
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
    "vertices": Scrapers2Vertices,
    "morphTargets": [],
    "morphColors": [],
    "normals": Scrapers2Normals,
    "colors": [],
    "uvs": [Scrapers2Uvs],
    "faces": Scrapers2Faces
}
