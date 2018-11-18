interface Geometry {
    metadata: any;
    scale: number;
    [key: string]: any;
}

declare const Scrapers1Vertices: Array<number>;
declare const Scrapers1Normals: Array<number>;
declare const Scrapers1Uvs: Array<number>;
declare const Scrapers1Faces: Array<number>;

export const Scrapers1 = {
    "metadata" : {
        "formatVersion" : 3.1,
        "sourceFile"    : "skyscrapper.obj",
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
        "DbgColor" : 15658734,
        "DbgIndex" : 0,
        "DbgName" : "07___Default",
        "colorAmbient" : [0.588235, 0.588235, 0.588235],
        "colorDiffuse" : [0.588235, 0.588235, 0.588235],
        "colorSpecular" : [0.0, 0.0, 0.0],
        "illumination" : 2,
        "opticalDensity" : 1.5,
        "specularCoef" : 9.999999,
        "transparency" : 0.0
	}],
    "vertices": Scrapers1Vertices,
    "morphTargets": [],
    "morphColors": [],
    "normals": Scrapers1Normals,
    "colors": [],
    "uvs": [Scrapers1Uvs],
    "faces": Scrapers1Faces
}