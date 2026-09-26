import { arpeggiate, bassLine, chordNotes, midiToFrequency, noteToMidi, parsePart, sustain } from "../notes";
import { TRACKS, trackLength } from "../tracks";
import { battleTrack, mapTrack } from "../choose";
import { STAGES } from "../../game/zoneProgression";

describe("notation", () => {
  it("names pitches the usual way", () => {
    expect(noteToMidi("C4")).toBe(60);
    expect(noteToMidi("A4")).toBe(69);
    expect(noteToMidi("F#3")).toBe(54);
    expect(noteToMidi("Bb5")).toBe(82);
    expect(midiToFrequency(69)).toBeCloseTo(440);
    expect(midiToFrequency(81)).toBeCloseTo(880);
    expect(() => noteToMidi("H2")).toThrow();
  });

  it("parses notes, chords and rests with their lengths", () => {
    const { events, length } = parsePart("A4:2 r:1 D3+F#3+A3:4 B4");
    expect(length).toBe(8);
    expect(events).toEqual([
      { step: 0, length: 2, midi: [69] },
      { step: 3, length: 4, midi: [50, 54, 57] },
      { step: 7, length: 1, midi: [71] },
    ]);
  });

  it("builds chords, arpeggios, pads and bass lines from a chord chart", () => {
    expect(chordNotes("F#m", 3)).toEqual([54, 57, 61]);
    expect(parsePart(arpeggiate(["C", "G"], 4, [0, 1, 2, 3], 4)).events.map((e) => e.midi[0])).toEqual([
      60, 64, 67, 72, 67, 71, 74, 79,
    ]);
    expect(parsePart(sustain(["C", "Am"], 3, 8)).length).toBe(16);
    expect(parsePart(bassLine(["C"], 2, [[0, 0, 2], [4, 1, 2]], 8))).toEqual({
      events: [
        { step: 0, length: 2, midi: [36] },
        { step: 4, length: 2, midi: [43] },
      ],
      length: 8,
    });
  });
});

describe("the score", () => {
  for (const track of Object.values(TRACKS)) {
    describe(track.id, () => {
      const length = trackLength(track);

      it("parses", () => {
        expect(length).toBeGreaterThan(0);
        for (const part of track.parts) expect(() => parsePart(part.notes)).not.toThrow();
      });

      if (track.loop) {
        it("has every part the same length, so the loop never drifts", () => {
          for (const part of track.parts) {
            expect({ instrument: part.instrument, length: parsePart(part.notes).length }).toEqual({
              instrument: part.instrument,
              length,
            });
          }
          for (const drum of track.drums ?? []) {
            expect({ voice: drum.voice, fits: length % drum.pattern.length === 0 }).toEqual({ voice: drum.voice, fits: true });
          }
        });

        it("is written in whole bars", () => {
          const barSteps = track.stepsPerBeat === 3 ? 6 : track.stepsPerBeat * 4;
          expect(length % barSteps).toBe(0);
        });
      }

      it("uses drum lines made only of hits and rests", () => {
        for (const drum of track.drums ?? []) expect(drum.pattern).toMatch(/^[xX.]+$/);
      });

      it("stays within a sensible pitch range", () => {
        for (const part of track.parts) {
          for (const event of parsePart(part.notes).events) {
            for (const midi of event.midi) {
              expect(midi).toBeGreaterThanOrEqual(noteToMidi("C1"));
              expect(midi).toBeLessThanOrEqual(noteToMidi("C8"));
            }
          }
        }
      });
    });
  }
});

describe("which music plays where", () => {
  it("marches in gym stages, rocks on the water, walks everywhere else", () => {
    expect(mapTrack({ gym: { medalId: "x" }, biomes: ["water", "rock"] })).toBe("bastions");
    expect(mapTrack({ biomes: ["water", "sand"] })).toBe("harbour");
    expect(mapTrack({ biomes: ["grass", "rock"] })).toBe("overworld");
    expect(mapTrack(undefined)).toBe("overworld");
  });

  it("matches the battle to who you are fighting", () => {
    expect(battleTrack(null)).toBe("battleWild");
    expect(battleTrack({ isGymLeader: false })).toBe("battleTrainer");
    expect(battleTrack({ isGymLeader: true })).toBe("battleGym");
  });

  it("gives every real stage a piece that exists", () => {
    for (const stage of STAGES) expect(TRACKS[mapTrack(stage)]).toBeDefined();
    expect(new Set(STAGES.map((stage) => mapTrack(stage)))).toEqual(new Set(["overworld", "harbour", "bastions"]));
  });
});
