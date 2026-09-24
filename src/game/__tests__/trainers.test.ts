import { trainersForZone, gymLeaderForZone, getTrainer, trainerAt, TRAINER_REWARD_MULTIPLIER, GYM_REWARD_MULTIPLIER } from "../trainers";
import { STAGES, medalRequiredToEnter, ALL_MEDALS } from "../zoneProgression";
import { getZoneEncounterSettings } from "../zones";
import { getMove } from "../movesRepo";
import { getDexEntry } from "../speciesCatalog";
import { useGameStore } from "../../state/gameStore";

describe("trainers", () => {
  it("puts at least two trainers on every stage", () => {
    for (const stage of STAGES) {
      expect(trainersForZone(stage.id).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("gives every trainer a party of real species with usable moves", () => {
    for (const stage of STAGES) {
      for (const trainer of trainersForZone(stage.id)) {
        expect(trainer.party.length).toBeGreaterThan(0);
        for (const slot of trainer.party) {
          expect(getDexEntry(slot.speciesId)).toBeDefined();
          expect(slot.level).toBeGreaterThan(0);
        }
      }
    }
  });

  it("sets trainer levels above the local wild level, so they are the harder fight", () => {
    for (const stage of STAGES) {
      const wildLevel = getZoneEncounterSettings(stage.id).baseLevel;
      for (const trainer of trainersForZone(stage.id)) {
        for (const slot of trainer.party) {
          expect(slot.level).toBeGreaterThan(wildLevel);
        }
      }
    }
  });

  it("pays better than the grass, and gyms better still", () => {
    expect(TRAINER_REWARD_MULTIPLIER).toBeGreaterThan(1);
    expect(GYM_REWARD_MULTIPLIER).toBeGreaterThan(TRAINER_REWARD_MULTIPLIER);
  });

  it("is deterministic — a zone's trainers never reshuffle", () => {
    const first = JSON.stringify(trainersForZone("dingli_cliffs"));
    const second = JSON.stringify(trainersForZone("dingli_cliffs"));
    expect(second).toBe(first);
  });

  it("looks a trainer up by id and by the tile they stand on", () => {
    const trainer = trainersForZone("melita_woods")[0];
    expect(getTrainer(trainer.id)?.id).toBe(trainer.id);
    expect(trainerAt("melita_woods", trainer.position.row, trainer.position.col)?.id).toBe(trainer.id);
    expect(trainerAt("melita_woods", -1, -1)).toBeUndefined();
  });
});

describe("gym leaders", () => {
  it("stands one on each gym stage and nowhere else", () => {
    for (const stage of STAGES) {
      const leader = gymLeaderForZone(stage.id);
      if (stage.gym) {
        expect(leader).toBeDefined();
        expect(leader!.medalId).toBe(stage.gym.medalId);
        expect(leader!.isGymLeader).toBe(true);
      } else {
        expect(leader).toBeUndefined();
      }
    }
  });

  it("fields a bigger, higher-level party than the route's trainers", () => {
    for (const stage of STAGES.filter((s) => s.gym)) {
      const leader = gymLeaderForZone(stage.id)!;
      const routeTrainers = trainersForZone(stage.id).filter((t) => !t.isGymLeader);
      const bestRouteLevel = Math.max(...routeTrainers.flatMap((t) => t.party.map((p) => p.level)));
      const leaderAce = Math.max(...leader.party.map((p) => p.level));

      expect(leader.party.length).toBeGreaterThanOrEqual(3);
      expect(leaderAce).toBeGreaterThan(bestRouteLevel);
    }
  });

  it("builds the leader's party around their advertised specialty where the roster allows", () => {
    for (const stage of STAGES.filter((s) => s.gym)) {
      const leader = gymLeaderForZone(stage.id)!;
      const onTheme = leader.party.filter((slot) =>
        getDexEntry(slot.speciesId)?.types.includes(stage.gym!.specialty as never)
      );
      expect(onTheme.length).toBeGreaterThan(0);
    }
  });

  it("gives every trainer's creature only moves that exist", () => {
    for (const stage of STAGES) {
      for (const trainer of trainersForZone(stage.id)) {
        for (const slot of trainer.party) {
          for (const moveId of require("../trainers").trainerCreatureMoves(slot.speciesId, slot.level)) {
            expect(() => getMove(moveId)).not.toThrow();
          }
        }
      }
    }
  });
});

describe("medal gating", () => {
  beforeEach(() => useGameStore.getState().resetGame());

  it("locks the stage after each gym behind that gym's medal", () => {
    for (const gymStage of STAGES.filter((s) => s.gym)) {
      const next = STAGES.find((s) => s.stage === gymStage.stage + 1);
      if (!next) continue;
      expect(medalRequiredToEnter(next.id)?.medalId).toBe(gymStage.gym!.medalId);
    }
  });

  it("leaves non-gated stages open", () => {
    expect(medalRequiredToEnter("melita_woods")).toBeNull();
    expect(medalRequiredToEnter("buskett_groves")).toBeNull();
  });

  it("records medals once and reports them back", () => {
    const store = useGameStore.getState();
    expect(store.hasMedal("silent_city")).toBe(false);

    store.awardMedal("silent_city");
    store.awardMedal("silent_city");

    expect(useGameStore.getState().medals).toEqual(["silent_city"]);
    expect(useGameStore.getState().hasMedal("silent_city")).toBe(true);
  });

  it("remembers beaten trainers so they don't re-challenge", () => {
    const store = useGameStore.getState();
    store.markTrainerDefeated("melita_woods-trainer-0");
    store.markTrainerDefeated("melita_woods-trainer-0");
    expect(useGameStore.getState().defeatedTrainerIds).toEqual(["melita_woods-trainer-0"]);
  });

  it("clears medals and defeated trainers on a new game", () => {
    const store = useGameStore.getState();
    store.awardMedal("solstice");
    store.markTrainerDefeated("x");
    useGameStore.getState().resetGame();
    expect(useGameStore.getState().medals).toEqual([]);
    expect(useGameStore.getState().defeatedTrainerIds).toEqual([]);
  });

  it("covers every medal with exactly one gym", () => {
    const ids = ALL_MEDALS.map((m) => m.medalId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
