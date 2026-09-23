import {
  DEFAULT_SETTINGS,
  autoAdvanceMs,
  detectLanguage,
  encounterChance,
  trainerIntroHoldMs,
  withDefaults,
} from "../settings";

const at = (battlePace: "tap" | "standard" | "quick", textSpeed: "slow" | "normal" | "fast" = "normal") => ({
  battlePace,
  textSpeed,
});

describe("battle pacing", () => {
  it("plays a chosen action on its own after one second by default", () => {
    expect(DEFAULT_SETTINGS.battlePace).toBe("standard");
    expect(autoAdvanceMs("action", DEFAULT_SETTINGS)).toBe(1000);
  });

  it("still holds the result of an action for a tap by default, so damage can be read", () => {
    expect(autoAdvanceMs("result", DEFAULT_SETTINGS)).toBeNull();
    expect(autoAdvanceMs("key", DEFAULT_SETTINGS)).toBeNull();
  });

  it("waits for a tap on everything when the player asks for that", () => {
    for (const kind of ["action", "result", "info", "key"] as const) {
      expect(autoAdvanceMs(kind, at("tap"))).toBeNull();
    }
  });

  it("never waits on quick pace", () => {
    for (const kind of ["action", "result", "info", "key"] as const) {
      expect(autoAdvanceMs(kind, at("quick"))).toBeGreaterThan(0);
    }
  });

  it("gives a longer message longer to be read", () => {
    expect(autoAdvanceMs("result", at("quick"), 3)!).toBeGreaterThan(autoAdvanceMs("result", at("quick"), 1)!);
  });

  it("scales every hold by text speed", () => {
    const slow = autoAdvanceMs("action", at("standard", "slow"))!;
    const fast = autoAdvanceMs("action", at("standard", "fast"))!;
    expect(slow).toBeGreaterThan(1000);
    expect(fast).toBeLessThan(1000);
  });

  it("only lets a trainer's line pass by itself on quick pace", () => {
    expect(trainerIntroHoldMs(at("standard"))).toBeNull();
    expect(trainerIntroHoldMs(at("tap"))).toBeNull();
    expect(trainerIntroHoldMs(at("quick"))).toBeGreaterThan(0);
  });
});

describe("other settings", () => {
  it("scales the wild encounter rate and never exceeds certainty", () => {
    expect(encounterChance(0.2, "normal")).toBeCloseTo(0.2);
    expect(encounterChance(0.2, "fewer")).toBeCloseTo(0.1);
    expect(encounterChance(0.2, "more")).toBeCloseTo(0.3);
    expect(encounterChance(0.9, "more")).toBe(1);
  });

  it("fills options a stored blob is missing, keeping the ones it has", () => {
    const merged = withDefaults({ language: "mt" });
    expect(merged.language).toBe("mt");
    expect(merged.battlePace).toBe(DEFAULT_SETTINGS.battlePace);
    expect(withDefaults(null)).toEqual(DEFAULT_SETTINGS);
  });

  it("starts a Maltese device in Maltese", () => {
    expect(detectLanguage("mt-MT")).toBe("mt");
    expect(detectLanguage("MT")).toBe("mt");
    expect(detectLanguage("en-GB")).toBe("en");
    expect(detectLanguage(undefined)).toBe("en");
  });
});
