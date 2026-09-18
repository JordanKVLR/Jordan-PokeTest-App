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
