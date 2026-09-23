import wildCreaturesData from "../../data/wildCreatures.json";
import { WildCreaturesFileSchema } from "../../data/schemas";
import { getDexEntry } from "../speciesCatalog";
import { buildBiomeEncounterTable, earliestWildLevel, rollEncounter, STARTER_FIRST_STAGE_BST, type EncounterOption } from "../encounterTable";

const wildCreatures = WildCreaturesFileSchema.parse(wildCreaturesData).wildCreatures;

describe("buildBiomeEncounterTable — per-biome pools", () => {
  it("only includes species tagged with the requested biome (plus the universal legendary tier)", () => {
    // Level 17: late enough that the stronger first forms (held back early, see
    // earliestWildLevel) have joined the table, still short of any evolved rock form.
    const rockTable = buildBiomeEncounterTable("rock", "Water", { baseLevel: 17, levelSpread: 2, legendaryMinLevel: 25 });
    const rockIds = rockTable.map((o: EncounterOption) => o.build("probe").creature.speciesId);
    // Rock-biome wild creatures + the two rock-tagged regional variants should all be present...
    for (const id of ["qortong", "xrobbog", "karkarun", "bulqajra", "santwarr", "ferrocane", "katakomba"]) {
      expect(rockIds).toContain(id);
    }
    // ...and species tagged with a different biome should never appear in the rock pool.
    for (const id of ["luzzitt", "ramliet", "fossary", "zavorra"]) {
      expect(rockIds).not.toContain(id);
    }
  });

  it("gives each of the 4 biomes its own distinct, non-empty common-species pool", () => {
    const config = { baseLevel: 10, levelSpread: 2, legendaryMinLevel: 30 };
    const biomes = ["grass", "rock", "water", "sand"] as const;
    const commonIdsByBiome = biomes.map((biome) => {
      const table = buildBiomeEncounterTable(biome, "Water", config);
      const common = table.filter((o) => o.weight > 0.3);
      expect(common.length).toBeGreaterThan(0);
      return new Set(common.map((o) => o.build("probe").creature.speciesId));
    });
    // Biomes share only the Normal-type creatures, which are deliberately at home anywhere
    // (see spawning.ts). Everything else must be exclusive to its own terrain.
    const anywhere = new Set(
      wildCreatures.filter((c) => c.biome === "any").map((c) => c.id)
    );
    expect(anywhere.size).toBeGreaterThan(0);
    for (let i = 0; i < commonIdsByBiome.length; i++) {
      for (let j = i + 1; j < commonIdsByBiome.length; j++) {
        const overlap = [...commonIdsByBiome[i]]
          .filter((id) => commonIdsByBiome[j].has(id))
          .filter((id) => !anywhere.has(id));
        expect(overlap).toEqual([]);
      }
    }
  });

  it("offers the Normal-type wanderers on every biome's table", () => {
    // High enough that the evolved Normal forms have come of age too (see EVOLVES_AT).
    const config = { baseLevel: 40, levelSpread: 2, legendaryMinLevel: 50 };
    const anywhere = wildCreatures.filter((c) => c.biome === "any").map((c) => c.id);
    for (const biome of ["grass", "rock", "water", "sand"] as const) {
      const ids = new Set(
        buildBiomeEncounterTable(biome, "Water", config).map((o) => o.build("probe").creature.speciesId)
      );
      for (const id of anywhere) {
        expect({ biome, id, offered: ids.has(id) }).toEqual({ biome, id, offered: true });
      }
    }
  });

  it("only offers a matching starter line's wild encounter in its associated biome", () => {
    // Player picked Water, so Grass and Fire are "other" lines — Grass should show up in the
    // grass pool, Fire in the rock pool, and neither should leak into the water pool itself.
    const grassTable = buildBiomeEncounterTable("grass", "Water", { baseLevel: 4, levelSpread: 2, legendaryMinLevel: 25 });
    const rockTable = buildBiomeEncounterTable("rock", "Water", { baseLevel: 4, levelSpread: 2, legendaryMinLevel: 25 });
    const waterTable = buildBiomeEncounterTable("water", "Water", { baseLevel: 4, levelSpread: 2, legendaryMinLevel: 25 });

    expect(grassTable.some((o) => o.weight === 3)).toBe(true);
    expect(rockTable.some((o) => o.weight === 3)).toBe(true);
    // The player's own line (Water) never appears as a wild "other starter" encounter anywhere.
    const waterCommonIds = waterTable.filter((o) => o.weight === 3).map((o) => o.build("probe").creature.speciesId);
    expect(waterCommonIds).toEqual([]);
  });

  describe("legendary tier", () => {
    it("includes exactly the 3 legendaries in every biome, each far rarer than a common wild creature", () => {
      const table = buildBiomeEncounterTable("sand", "Water", { baseLevel: 4, levelSpread: 2, legendaryMinLevel: 25 });
      const legendaryWeights = table.filter((o) => o.weight === 0.3);
      expect(legendaryWeights).toHaveLength(3);
      const commonWeight = Math.max(...table.map((o) => o.weight));
      expect(commonWeight).toBeGreaterThan(0.3);
    });

    it("never builds a legendary below the configured minimum level, and honors a higher floor for later zones", () => {
      const table = buildBiomeEncounterTable("sand", "Water", { baseLevel: 4, levelSpread: 2, legendaryMinLevel: 25 });
      const legendaryOptions = table.filter((o) => o.weight === 0.3);
      for (const option of legendaryOptions) {
        for (let i = 0; i < 20; i++) {
          const participant = option.build(`test-${i}`);
          expect(participant.creature.level).toBeGreaterThanOrEqual(25);
        }
      }

      const laterZoneTable = buildBiomeEncounterTable("sand", "Water", { baseLevel: 17, levelSpread: 3, legendaryMinLevel: 40 });
      const laterLegendaryOptions = laterZoneTable.filter((o) => o.weight === 0.3);
      for (const option of laterLegendaryOptions) {
        const participant = option.build("test-later");
        expect(participant.creature.level).toBeGreaterThanOrEqual(40);
      }
    });

    it("rollEncounter can still select a legendary when it's the only weighted option", () => {
      const table = buildBiomeEncounterTable("sand", "Water", { baseLevel: 4, levelSpread: 2, legendaryMinLevel: 25 });
      const legendaryOnly = table.filter((o) => o.weight === 0.3);
      const participant = rollEncounter(legendaryOnly, "solo-roll");
      expect(participant.creature.level).toBeGreaterThanOrEqual(25);
      expect(["aegilord", "megalithos", "siroccus"]).toContain(participant.creature.speciesId);
    });
  });
});

describe("early wild creatures do not outclass the starters", () => {
  const statTotal = (s: { hp: number; atk: number; def: number; spatk: number; spdef: number; speed: number }) =>
    s.hp + s.atk + s.def + s.spatk + s.spdef + s.speed;

  it("keeps every non-legendary on the first road within reach of a starter's first stage", () => {
    for (const biome of ["grass", "rock", "water", "sand"] as const) {
      const table = buildBiomeEncounterTable(biome, "Grass", { baseLevel: 4, levelSpread: 2, legendaryMinLevel: 99 });
      for (const option of table) {
        const { creature } = option.build("probe");
        if (creature.level >= 99) continue; // the rare legendary layer is meant to be a shock
        const total = statTotal(getDexEntry(creature.speciesId)!.stats!);
        expect({ id: creature.speciesId, over: total > STARTER_FIRST_STAGE_BST + 25 }).toEqual({
          id: creature.speciesId,
          over: false,
        });
      }
    }
  });

  it("still lets the strongest first forms in once the levels catch up", () => {
    expect(earliestWildLevel({ id: "falkun", baseStats: wildCreatures.find((w) => w.id === "falkun")!.baseStats })).toBeGreaterThan(20);
  });
});
