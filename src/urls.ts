const iblSuffix = Filament.getSupportedFormatSuffix("etc s3tc");
const environ = "env/syferfontein_18d_clear_2k";

export const ibl = `${environ}_ibl${iblSuffix}.ktx.bmp`;
export const skySmall = `${environ}_skybox_tiny.ktx.bmp`;
export const skyLarge = `${environ}_skybox.ktx.bmp`;

export const tracksMaterial = "materials/tracks.filamat";

export const diffuse = "diffuse.jpg";
export const specular = "specular.jpg";
export const normal = "normal.jpg";
export const mesh = "filamesh";

export const collision = "tracks/collision.png";
export const elevation = "tracks/height.png";
