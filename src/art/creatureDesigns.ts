import type { CreatureDesign } from "./creatureArt";

/**
 * One design per species. Bodies and props are chosen to echo what the creature *is* in the
 * Codex flavour text — a standing stone that turns to face you gets the megalith prop, the
 * harbour fish that chases luzzu boats gets a fish body, the shipwreck coral gets a hull.
 *
 * Species missing from this map fall back to a type-derived design (see designFor), so the
 * game never crashes on a new creature that hasn't been styled yet.
 */
export const CREATURE_DESIGNS: Record<string, CreatureDesign> = {
  // ---------------------------------------------------------------- starters: Grass line
  calfleaf: { body: "quadruped", primary: "#7cc45a", secondary: "#e6f5c8", crest: "horn", tail: "leaf" },
  vinehorn: { body: "quadruped", primary: "#5aa845", secondary: "#d8efb0", crest: "twinhorn", tail: "leaf", pattern: "stripes" },
  mosstaur: {
    body: "quadruped",
    primary: "#44823a",
    secondary: "#cfe6a0",
    crest: "twinhorn",
    tail: "leaf",
    pattern: "plates",
    eyes: "fierce",
    // Its signature move is Megalith Charge — it carries a trilithon on its back.
    prop: "megalith",
    propColor: "#cdb182",
  },

  // ---------------------------------------------------------------- starters: Fire line
  pharawoof: { body: "feline", primary: "#f0a04b", secondary: "#ffe0b0", crest: "ears", tail: "long" },
  infernux: { body: "feline", primary: "#e8763c", secondary: "#ffd39a", crest: "plume", tail: "flame", eyes: "fierce" },
  pyrollis: {
    body: "biped",
    primary: "#e05a2b",
    secondary: "#ffc98a",
    crest: "plume",
    tail: "flame",
    eyes: "glow",
    prop: "lantern",
    propColor: "#f3c14a",
  },

  // ---------------------------------------------------------------- starters: Water line
  duckling: { body: "avian", primary: "#6fc3e8", secondary: "#dff4fd", tail: "fan" },
  platyflow: { body: "aquatic", primary: "#4a9fd4", secondary: "#cfeafa", crest: "fin", pattern: "waves" },
  marinedge: {
    body: "vessel",
    primary: "#3f7fae",
    secondary: "#bfe2f5",
    pattern: "stripes",
    eyes: "fierce",
    // Water/Steel hull-rammer — the eye on the prow is the oldest boat marking in the islands.
    prop: "eyeOfOsiris",
    propColor: "#4a90e2",
  },

  // ---------------------------------------------------------------- garrigue
  fossary: { body: "insect", primary: "#8aa83f", secondary: "#dbe8a8", pattern: "plates" },

  // ---------------------------------------------------------------- limestone / temple country
  qortong: { body: "blob", primary: "#d8bd84", secondary: "#f2e3bd", pattern: "plates" },
  xrobbog: { body: "quadruped", primary: "#b9a274", secondary: "#e3d3ad", pattern: "plates", eyes: "fierce" },
  karkarun: {
    body: "golem",
    primary: "#cdb182",
    secondary: "#eeddb4",
    eyes: "glow",
    prop: "megalith",
    propColor: "#b89a68",
  },
  bulqajra: { body: "golem", primary: "#a89372", secondary: "#d9c7a3", eyes: "fierce", pattern: "plates" },
  santwarr: {
    body: "golem",
    primary: "#ddc490",
    secondary: "#f6ead0",
    eyes: "glow",
    pattern: "plates",
    prop: "megalith",
    propColor: "#c6a875",
  },

  // ---------------------------------------------------------------- harbour and open sea
  luzzitt: { body: "aquatic", primary: "#8fd0e8", secondary: "#e4f7ff", pattern: "waves" },
  marsupp: { body: "mollusc", primary: "#5fb6c9", secondary: "#d4f0f6" },
  kalanka: { body: "mollusc", primary: "#52a8a0", secondary: "#cfeee8", pattern: "plates" },
  vurjenn: { body: "avian", primary: "#6fa8dc", secondary: "#dceafa", crest: "fin", tail: "fan", eyes: "fierce" },
  ondallus: { body: "serpent", primary: "#2f8fbf", secondary: "#bfe6f7", crest: "fin", eyes: "fierce" },

  // ---------------------------------------------------------------- dunes
  ramliet: { body: "serpent", primary: "#d9a45f", secondary: "#f6e0b8", eyes: "sleepy" },
  xemxun: { body: "quadruped", primary: "#e08a3c", secondary: "#fbd9a4", pattern: "spots", eyes: "fierce", tail: "flame" },
  dunkorr: { body: "golem", primary: "#c9a465", secondary: "#eed9ac", pattern: "plates" },
  sirokk: { body: "blob", primary: "#e0c07a", secondary: "#f8ecc9", eyes: "wide", pattern: "waves" },
  ossijan: { body: "quadruped", primary: "#cbb894", secondary: "#f0e6cf", crest: "twinhorn", pattern: "plates", eyes: "glow" },

  // ---------------------------------------------------------------- regional variants
  ferrocane: { body: "feline", primary: "#e8b93c", secondary: "#ffeab0", crest: "ears", tail: "flame", eyes: "fierce", pattern: "stripes" },
  katakomba: {
    body: "golem",
    primary: "#8d8478",
    secondary: "#c7c0b3",
    eyes: "glow",
    prop: "lantern",
    propColor: "#c9a227",
  },
  zavorra: { body: "vessel", primary: "#6b93a8", secondary: "#cde6f0", pattern: "waves" },

  // ---------------------------------------------------------------- legendaries
  aegilord: {
    body: "biped",
    primary: "#9aa7b5",
    secondary: "#e2e9f0",
    crest: "plume",
    eyes: "fierce",
    prop: "knightHelm",
    propColor: "#b7c3ce",
  },
  megalithos: {
    body: "golem",
    primary: "#d9c08a",
    secondary: "#f5e9c9",
    eyes: "glow",
    pattern: "plates",
    prop: "megalith",
    propColor: "#bfa172",
  },
  siroccus: { body: "avian", primary: "#d9b06a", secondary: "#f7e6c0", crest: "plume", tail: "fan", eyes: "fierce" },

  // ================================================================ temple builders
  dormina: { body: "blob", primary: "#cbb3e0", secondary: "#f0e4f7", eyes: "sleepy" },
  ggantroll: {
    body: "golem",
    primary: "#c9a878",
    secondary: "#eeddb4",
    eyes: "fierce",
    pattern: "plates",
    prop: "megalith",
    propColor: "#b08f5e",
  },

  // ================================================================ bronze age
  bornadur: { body: "golem", primary: "#8f7f6a", secondary: "#c3b59f", eyes: "fierce", pattern: "plates" },
  kartrutt: { body: "mollusc", primary: "#b9a274", secondary: "#e6d7b4", pattern: "plates" },

  // ================================================================ phoenician & punic
  murexil: { body: "mollusc", primary: "#9a6bb5", secondary: "#e3cdf0", prop: "spiralShell", propColor: "#7d4c99" },
  tirjanu: {
    body: "mollusc",
    primary: "#6b3f85",
    secondary: "#d3b4e3",
    pattern: "waves",
    eyes: "fierce",
    prop: "spiralShell",
    propColor: "#4e2a63",
  },
  lembuqa: { body: "vessel", primary: "#7a6ba8", secondary: "#d8d0ee", prop: "sail", propColor: "#e8dfc0" },
  ghajnuq: { body: "blob", primary: "#4a90e2", secondary: "#cfe6fa", eyes: "wide", prop: "eyeOfOsiris", propColor: "#2f6fb5" },

  // ================================================================ roman
  tessera: { body: "blob", primary: "#d8c9a8", secondary: "#f3ead4", pattern: "mosaic", eyes: "wide" },
  mosaikos: {
    body: "golem",
    primary: "#c9b48d",
    secondary: "#efe2c4",
    pattern: "mosaic",
    eyes: "glow",
    prop: "mosaicCrown",
    propColor: "#b1633f",
  },
  amforu: { body: "blob", primary: "#c96b47", secondary: "#f0c6a8", prop: "amphora", propColor: "#a8512f" },
  laurentu: { body: "biped", primary: "#7ba83c", secondary: "#dcecb4", eyes: "fierce", prop: "laurel", propColor: "#5f8c2c" },
  vipaulus: { body: "serpent", primary: "#6b7a4a", secondary: "#cfd8ae", eyes: "fierce", crest: "none" },

  // ================================================================ arab period
  ghasel: { body: "insect", primary: "#e8b93c", secondary: "#fdefc0", pattern: "stripes", prop: "honeycomb", propColor: "#d99a1f" },
  nahlija: {
    body: "insect",
    primary: "#f0c94a",
    secondary: "#fff3cf",
    pattern: "stripes",
    crest: "antennae",
    eyes: "fierce",
    prop: "honeycomb",
    propColor: "#e0a516",
  },
  larinja: { body: "blob", primary: "#f0913c", secondary: "#ffe0bd", prop: "citrus", propColor: "#f0a83c" },
  sienja: { body: "golem", primary: "#9aa7b5", secondary: "#dfe7ee", prop: "waterwheel", propColor: "#6b93a8" },

  // ================================================================ order of st john
  skudier: { body: "biped", primary: "#b0bcc9", secondary: "#e8eef4", prop: "malteseCross", propColor: "#e8e2d4" },
  kavallier: {
    body: "biped",
    primary: "#9aa7b5",
    secondary: "#dde5ec",
    eyes: "fierce",
    prop: "knightHelm",
    propColor: "#aebbc7",
  },
  granmastru: {
    body: "biped",
    primary: "#8d99ae",
    secondary: "#d7dfe8",
    crest: "plume",
    eyes: "glow",
    prop: "knightHelm",
    propColor: "#c2a24a",
  },
  falkun: {
    body: "avian",
    primary: "#a8927a",
    secondary: "#ecdfc9",
    crest: "plume",
    tail: "fan",
    eyes: "fierce",
    prop: "malteseCross",
    propColor: "#e8e2d4",
  },

  // ================================================================ great siege
  jannisar: { body: "biped", primary: "#d4563c", secondary: "#f7c9a8", eyes: "fierce", prop: "turban", propColor: "#efe6d2" },
  bombarda: { body: "golem", primary: "#7a8590", secondary: "#c4ccd4", eyes: "fierce", pattern: "plates", prop: "cannon", propColor: "#5c666f" },
  hilalux: { body: "avian", primary: "#5a5670", secondary: "#b9b4cf", crest: "plume", tail: "fan", eyes: "glow", prop: "crescent", propColor: "#e8d98a" },

  // ================================================================ british period
  pustaljon: { body: "golem", primary: "#cf4740", secondary: "#f2b3ad", pattern: "plates" },
  konvoj: { body: "vessel", primary: "#6b7a85", secondary: "#ccd8df", pattern: "waves", prop: "sail", propColor: "#b9c4cc" },
};

/** Body archetype guessed from a type, for any species without an authored design. */
const TYPE_FALLBACK_BODY: Record<string, CreatureDesign["body"]> = {
  Water: "aquatic",
  Grass: "quadruped",
  Fire: "feline",
  Rock: "golem",
  Ground: "quadruped",
  Steel: "golem",
  Bug: "insect",
  Flying: "avian",
  Dragon: "serpent",
  Poison: "mollusc",
  Psychic: "blob",
  Ghost: "blob",
  Electric: "feline",
  Fighting: "biped",
  Fairy: "blob",
  Ice: "blob",
  Dark: "serpent",
  Normal: "quadruped",
};

export function designFor(speciesId: string, types: string[], typeColorOf: (t: string) => string): CreatureDesign {
  const authored = CREATURE_DESIGNS[speciesId];
  if (authored) return authored;
  const primaryType = types[0] ?? "Normal";
  return {
    body: TYPE_FALLBACK_BODY[primaryType] ?? "quadruped",
    primary: typeColorOf(primaryType),
    secondary: types[1] ? typeColorOf(types[1]) : undefined,
  };
}
