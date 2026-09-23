import { en, type StringKey } from "../en";
import { mt } from "../mt";
import { translate, plural, i18nFor } from "../core";
import { CONTENT_IDS } from "../content";
import { MT_ERAS, MT_FLAVOR, MT_GYMS, MT_ITEMS, MT_MOVES, MT_QUIZ, MT_STAGES, MT_STATS, MT_TRAINER_TITLES, MT_TYPES } from "../content.mt";
import { TYPE_BOASTS, TITLE_BOASTS } from "../boasts";
import { TypeNameSchema } from "../../data/schemas";
import { STARTER_QUIZ_QUESTIONS } from "../../game/starterQuiz";
import { settingsStringKeys } from "../../game/settingsLayout";
import { DEFAULT_SETTINGS } from "../../game/settings";

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("UI strings", () => {
  it("has a Maltese string for every English key, and nothing extra", () => {
    expect(Object.keys(mt).sort()).toEqual(Object.keys(en).sort());
  });

  it("uses the same placeholders in both languages", () => {
    const mismatched = (Object.keys(en) as StringKey[]).filter(
      (key) => placeholders(en[key]).join(",") !== placeholders(mt[key]).join(",")
    );
    expect(mismatched).toEqual([]);
  });

  it("leaves no Maltese string empty, or identical to a long English one by accident", () => {
    const suspicious = (Object.keys(en) as StringKey[]).filter((key) => {
      if (!mt[key].trim()) return true;
      // Short labels (names, "HP", "D-pad") and the game's own title are the same in both.
      if (key === "title.name") return false;
      const words = en[key].replace(/\{\w+\}/g, "").match(/[A-Za-z]{2,}/g) ?? [];
      return mt[key] === en[key] && words.length > 3;
    });
    expect(suspicious).toEqual([]);
  });

  it("has every label the settings screen looks up, and covers every setting", () => {
    const missing = settingsStringKeys().filter((key) => !(key in en));
    expect(missing).toEqual([]);
    const shown = new Set(settingsStringKeys());
    const unlisted = Object.keys(DEFAULT_SETTINGS).filter((key) => !shown.has(`settings.${key}`));
    expect(unlisted).toEqual([]);
  });

  it("fills placeholders and picks plurals", () => {
    expect(translate("en", "battle.damage", { amount: 12 })).toBe("Dealt 12 damage!");
    expect(translate("mt", "battle.damage", { amount: 12 })).toBe("Għamel 12 ħsara!");
    expect(plural("en", 1, "battle.brokeFreeOne", "battle.brokeFreeMany", { item: "Trap" })).toContain("1 shake");
    expect(plural("en", 3, "battle.brokeFreeOne", "battle.brokeFreeMany", { item: "Trap" })).toContain("3 shakes");
  });
});

describe("game content in Maltese", () => {
  const missing = (ids: string[], dict: Record<string, unknown>) => ids.filter((id) => !(id in dict));

  it("names every type", () => expect(missing(TypeNameSchema.options, MT_TYPES)).toEqual([]));
  it("names every move", () => expect(missing(CONTENT_IDS.moves, MT_MOVES)).toEqual([]));
  it("names and describes every item", () => expect(missing(CONTENT_IDS.items, MT_ITEMS)).toEqual([]));
  it("names every stage", () => expect(missing(CONTENT_IDS.stages, MT_STAGES)).toEqual([]));
  it("names every medal and gym title", () => expect(missing(CONTENT_IDS.medals, MT_GYMS)).toEqual([]));
  it("has lore for every creature", () => expect(missing(CONTENT_IDS.creatures, MT_FLAVOR)).toEqual([]));
  it("labels every era and stat", () => {
    expect(missing(CONTENT_IDS.eras, MT_ERAS)).toEqual([]);
    expect(missing(CONTENT_IDS.stats, MT_STATS)).toEqual([]);
  });
  it("translates every trainer title and its boast", () => {
    expect(missing(Object.keys(TITLE_BOASTS.en), MT_TRAINER_TITLES)).toEqual([]);
    expect(missing(Object.keys(TITLE_BOASTS.en), TITLE_BOASTS.mt)).toEqual([]);
  });
  it("gives every type the same number of boasts in both languages", () => {
    for (const type of TypeNameSchema.options) {
      expect({ type, mt: TYPE_BOASTS.mt[type].length }).toEqual({ type, mt: TYPE_BOASTS.en[type].length });
    }
  });
  it("translates every quiz question and all its options", () => {
    for (const q of STARTER_QUIZ_QUESTIONS) {
      expect(MT_QUIZ[q.id]?.options.length).toBe(q.options.length);
    }
  });

  it("serves English from the data files and Maltese from the dictionary", () => {
    expect(i18nFor("en").c.move("vine_lash")).toBe("Vine Lash");
    expect(i18nFor("mt").c.move("vine_lash")).toBe("Frosta tad-Dielja");
    expect(i18nFor("mt").c.type("Ice")).toBe("Silġ");
    expect(i18nFor("mt").c.boast({ kind: "gym", medalId: "solstice" })).toContain("Midalja tas-Solstizju");
  });
});
