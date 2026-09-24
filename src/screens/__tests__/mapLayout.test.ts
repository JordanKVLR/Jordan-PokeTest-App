import { BASE_TILE, computeMapLayout } from "../components/mapLayout";

const COLS = 17;
const ROWS = 15;

describe("map layout", () => {
  it("shows the whole zone at natural size on a laptop — more map, not a bigger one", () => {
    const layout = computeMapLayout({ width: 1440, height: 900 }, COLS, ROWS);
    expect(layout.mode).toBe("wide");
    expect(layout.tileSize).toBe(BASE_TILE);
    expect(layout.viewportWidth).toBe(COLS * BASE_TILE);
    expect(layout.viewportHeight).toBe(ROWS * BASE_TILE);
  });

  it("scrolls rather than magnifies on a laptop too short for the whole zone", () => {
    const layout = computeMapLayout({ width: 1280, height: 600 }, COLS, ROWS);
    expect(layout.mode).toBe("wide");
    expect(layout.tileSize).toBe(BASE_TILE);
    expect(layout.viewportHeight).toBeLessThan(ROWS * BASE_TILE);
  });

  it("fills the whole screen on a phone, in both directions", () => {
    for (const phone of [
      { width: 390, height: 844 },
      { width: 375, height: 667 },
      { width: 430, height: 932 },
      { width: 844, height: 390 }, // on its side
    ]) {
      const layout = computeMapLayout(phone, COLS, ROWS);
      expect(layout.mode).toBe("compact");
      expect(layout.viewportWidth).toBe(phone.width);
      expect(layout.viewportHeight).toBe(phone.height);
      // The drawn zone must reach every edge, or the page shows round the world.
      expect(COLS * layout.tileSize).toBeGreaterThanOrEqual(phone.width);
      expect(ROWS * layout.tileSize).toBeGreaterThanOrEqual(phone.height);
    }
  });

  it("treats a narrow laptop window like a phone", () => {
    expect(computeMapLayout({ width: 700, height: 900 }, COLS, ROWS).mode).toBe("compact");
  });

  it("never draws tiles smaller than their natural size", () => {
    expect(computeMapLayout({ width: 320, height: 480 }, COLS, ROWS).tileSize).toBeGreaterThanOrEqual(BASE_TILE);
  });
});
