import { dropIndex, moveItem, shiftFor, type Slot } from "../reorder";

// Four 100px cards with a 12px gap between them.
const slots: Slot[] = [0, 1, 2, 3].map((i) => ({ y: i * 112, height: 100 }));

describe("moveItem", () => {
  it("moves one entry and keeps the rest in order", () => {
    expect(moveItem(["a", "b", "c", "d"], 3, 0)).toEqual(["d", "a", "b", "c"]);
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(["a", "b", "c"], 1, 1)).toEqual(["a", "b", "c"]);
  });

  it("clamps a target past either end and ignores a bad source", () => {
    expect(moveItem(["a", "b", "c"], 0, 9)).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b", "c"], 2, -4)).toEqual(["c", "a", "b"]);
    expect(moveItem(["a", "b"], 5, 0)).toEqual(["a", "b"]);
  });
});

describe("dropIndex", () => {
  it("stays put for a small wobble", () => {
    expect(dropIndex(slots, 1, 20)).toBe(1);
    expect(dropIndex(slots, 1, -20)).toBe(1);
  });

  it("takes the slot whose middle the card has passed", () => {
    expect(dropIndex(slots, 0, 70)).toBe(0);
    expect(dropIndex(slots, 0, 120)).toBe(1);
    expect(dropIndex(slots, 0, 230)).toBe(2);
    expect(dropIndex(slots, 3, -350)).toBe(0);
    expect(dropIndex(slots, 3, -330)).toBe(1);
    expect(dropIndex(slots, 3, -130)).toBe(2);
  });

  it("never goes past either end", () => {
    expect(dropIndex(slots, 0, 5000)).toBe(3);
    expect(dropIndex(slots, 2, -5000)).toBe(0);
  });
});

describe("shiftFor", () => {
  it("opens a gap by moving the passed-over cards the other way", () => {
    // Dragging card 0 down to slot 2: cards 1 and 2 move up.
    expect([0, 1, 2, 3].map((i) => shiftFor(i, 0, 2, 112))).toEqual([0, -112, -112, 0]);
    // Dragging card 3 up to slot 1: cards 1 and 2 move down.
    expect([0, 1, 2, 3].map((i) => shiftFor(i, 3, 1, 112))).toEqual([0, 112, 112, 0]);
  });
});
