const iblSuffix = Filament.getSupportedFormatSuffix("etc s3tc");
const environ = "env/syferfontein_18d_clear_2k";

export const ibl = `${environ}_ibl${iblSuffix}.ktx.bmp`;
export const skySmall = `${environ}_skybox_tiny.ktx.bmp`;
export const skyLarge = `${environ}_skybox.ktx.bmp`;

export const tracksMaterial = "materials/tracks.filamat";

export const diffuse = "diffuse.png";
export const specular = "specular.png";
export const normal = "normal.png";

export const collision = "tracks/collision.png";
export const elevation = "tracks/height.png";
