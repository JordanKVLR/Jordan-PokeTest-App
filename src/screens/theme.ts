/**
 * Palette notes: the game reads as a sunny Mediterranean afternoon — the look of the modern
 * mainline games (bright saturated world, clean light UI panels) filtered through Malta's own
 * materials: honey-coloured globigerina limestone, prickly-pear green, sea blue, terracotta.
 * UI surfaces are light with dark text; only scrims and shadows stay dark.
 */
export const colors = {
  /** Page background — a pale sky wash rather than flat white, so panels read as raised. */
  background: "#e8f4fb",
  surface: "#ffffff",
  surfaceAlt: "#f1f7ec",
  border: "#c8dccf",
  /** Deep slate rather than pure black: softer against bright panels. */
  text: "#22333f",
  textMuted: "#6d8797",
  /** Maltese limestone honey — the game's signature highlight. */
  accent: "#ef9f2e",
  accentDeep: "#c97a12",
  danger: "#e05252",
  success: "#43ad68",
  /** Scrim behind full-screen reveals (level-up, evolution). Stays dark for contrast. */
  scrim: "rgba(18,32,42,0.86)",
  shadow: "rgba(25,45,60,0.22)",
};

/**
 * Overworld/battle art palette. Kept separate from UI tokens because these are "paint", not
 * interface colours — tile fills, canopy layers, stone shading, sea depth.
 */
export const world = {
  skyTop: "#7fc8f0",
  skyLow: "#c7ecfb",
  sunHaze: "#fff3cf",

  grassLight: "#7ec850",
  grass: "#63b13f",
  grassDark: "#4a9331",
  grassShadow: "#3d7a2a",
  tuft: "#95d867",

  treeCanopy: "#4ea83c",
  treeCanopyLight: "#6fc451",
  treeCanopyDark: "#357a29",
  treeTrunk: "#8a5f3a",
  treeTrunkDark: "#6b4629",

  /** Globigerina limestone — the stone every Maltese wall, temple and bastion is cut from. */
  limestone: "#e8cf9a",
  limestoneLight: "#f5e4bd",
  limestoneDark: "#c9a86c",
  limestoneShadow: "#a8874f",

  pathLight: "#e3c893",
  path: "#d4b378",
  pathDark: "#b9945a",

  seaShallow: "#57c6e8",
  sea: "#2f9ed4",
  seaDeep: "#1d6fa8",
  seaFoam: "#d6f4ff",

  sand: "#f0dca4",
  sandDark: "#d9bf7f",

  terracotta: "#c96b47",
  terracottaDark: "#9e4f31",

  outline: "#2b3a44",
  shadowSoft: "rgba(40,70,50,0.22)",
};

/** Type colours follow mainline conventions closely enough to read at a glance. */
export const TYPE_COLORS: Record<string, string> = {
  Normal: "#b6b3a2",
  Fire: "#f0803c",
  Water: "#4a90e2",
  Grass: "#5fbb56",
  Electric: "#f5c542",
  Ice: "#86cfe8",
  Fighting: "#cf5a4a",
  Poison: "#a465b5",
  Ground: "#d4a857",
  Flying: "#93b8e8",
  Psychic: "#f0587f",
  Bug: "#96b93f",
  Rock: "#b8a067",
  Ghost: "#7c6bb0",
  Dragon: "#6b5ecf",
  Dark: "#5a5670",
  Steel: "#9aa7b5",
  Fairy: "#f29ccd",
};

export function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? colors.surfaceAlt;
}

/** A darker partner for each type colour, for outlines/underside shading on sprites. */
export function typeShade(type: string): string {
  return shade(typeColor(type), 0.72);
}

/** Multiplies a hex colour's channels — used for cheap, consistent shading across the art. */
export function shade(hex: string, factor: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  const r = Math.max(0, Math.min(255, Math.round(((num >> 16) & 255) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(((num >> 8) & 255) * factor)));
  const b = Math.max(0, Math.min(255, Math.round((num & 255) * factor)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export const TYPE_ICONS: Record<string, string> = {
  Steel: "⚙",
  Ghost: "👻",
  Psychic: "🔮",
  Rock: "🪨",
  Water: "💧",
  Fire: "🔥",
  Grass: "🌿",
  Electric: "⚡",
  Ground: "⛰",
  Flying: "🕊",
  Fighting: "👊",
  Fairy: "✨",
  Ice: "❄",
  Bug: "🐛",
  Poison: "☠",
  Normal: "⚪",
  Dark: "🌑",
  Dragon: "🐉",
};

export function typeIcon(type: string): string {
  return TYPE_ICONS[type] ?? "❔";
}
