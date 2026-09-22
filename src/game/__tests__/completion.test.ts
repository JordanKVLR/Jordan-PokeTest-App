import { allTrainers, completionProgress, trainersForZone } from "../trainers";
import { STAGES } from "../zoneProgression";

describe("win condition — beat every trainer and boss", () => {
  it("counts every trainer on every stage", () => {
    const all = allTrainers();
    const summed = STAGES.reduce((n, stage) => n + trainersForZone(stage.id).length, 0);
    expect(all.length).toBe(summed);
    expect(all.length).toBeGreaterThan(STAGES.length); // more than one per stage
  });

  it("includes exactly one gym leader per gym stage", () => {
    const gyms = allTrainers().filter((t) => t.isGymLeader);
    expect(gyms).toHaveLength(STAGES.filter((s) => s.gym).length);
    for (const gym of gyms) expect(gym.medalId).toBeTruthy();
  });

  it("reports nothing done on a fresh save", () => {
    const progress = completionProgress([]);
    expect(progress.trainersDefeated).toBe(0);
    expect(progress.gymsDefeated).toBe(0);
    expect(progress.complete).toBe(false);
    expect(progress.trainersTotal).toBeGreaterThan(0);
    expect(progress.gymsTotal).toBe(4);
  });

  it("does not call the run complete while a single trainer is left standing", () => {
    const all = allTrainers().map((t) => t.id);
    const allButOne = all.slice(0, -1);
    const progress = completionProgress(allButOne);
    expect(progress.trainersDefeated).toBe(all.length - 1);
    expect(progress.complete).toBe(false);
  });

  it("does not call the run complete when only the gyms have been beaten", () => {
    const gymIds = allTrainers().filter((t) => t.isGymLeader).map((t) => t.id);
    const progress = completionProgress(gymIds);
    expect(progress.gymsDefeated).toBe(progress.gymsTotal);
    expect(progress.complete).toBe(false);
  });

  it("calls the run complete once everyone has been beaten", () => {
    const progress = completionProgress(allTrainers().map((t) => t.id));
    expect(progress).toEqual({
      trainersDefeated: progress.trainersTotal,
      trainersTotal: progress.trainersTotal,
      gymsDefeated: 4,
      gymsTotal: 4,
      complete: true,
    });
  });

  it("ignores ids that aren't trainers, so a stale save can't fake a win", () => {
    const progress = completionProgress(["not-a-trainer", "melita_woods-trainer-99"]);
    expect(progress.trainersDefeated).toBe(0);
    expect(progress.complete).toBe(false);
  });
});
