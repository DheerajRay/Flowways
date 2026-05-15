export type PetMode = "sweet" | "meh" | "monster";
export type FontFamilyKey = "avenir" | "inter" | "plex" | "mono" | "rounded";
export type FontSizeKey = "s" | "m" | "l";

export type ColorPalette = {
  red: string;
  blue: string;
  green: string;
  amber: string;
  violet: string;
};

export interface UserSettings {
  pet_enabled: boolean;
  pet_mode: PetMode;
  font_family: FontFamilyKey;
  font_size: FontSizeKey;
  color_palette: ColorPalette;
}

export const DEFAULT_COLOR_PALETTE: ColorPalette = {
  red: "#d24f4f",
  blue: "#2b7fca",
  green: "#2f9e66",
  amber: "#de8a2d",
  violet: "#7666c8"
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  pet_enabled: true,
  pet_mode: "sweet",
  font_family: "avenir",
  font_size: "m",
  color_palette: DEFAULT_COLOR_PALETTE
};
