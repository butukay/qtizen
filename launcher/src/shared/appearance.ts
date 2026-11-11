// Stable saved palette IDs and display names. Paint is defined in css/themes.css.
const COLOUR_ACCENTS = [
  { value: "ice", labelKey: "accent.ice" },
  { value: "blue", labelKey: "accent.blue" },
  { value: "violet", labelKey: "accent.violet" },
  { value: "rose", labelKey: "accent.rose" },
  { value: "amber", labelKey: "accent.amber" },
  { value: "mint", labelKey: "accent.mint" },
] as const;

export const NEUTRAL_ACCENTS = {
  dark: { value: "white", labelKey: "accent.default" },
  light: { value: "black", labelKey: "accent.default" },
} as const;

export const APPEARANCE_PALETTES = {
  dark: [NEUTRAL_ACCENTS.dark, ...COLOUR_ACCENTS],
  light: [NEUTRAL_ACCENTS.light, ...COLOUR_ACCENTS],
};

export const ACCENT_IDS = [...COLOUR_ACCENTS, ...Object.values(NEUTRAL_ACCENTS)].map((accent) => accent.value);
