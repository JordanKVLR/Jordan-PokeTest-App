import { briefingsOnEntry, missionBriefing, stageBriefing } from "../briefings";
import { stagesReachedBy } from "../../state/gameStore";
import { STAGES } from "../zoneProgression";
import { allTrainers } from "../trainers";

describe("briefings", () => {
  it("opens a new game with the mission, then the first stage", () => {
    const pages = briefingsOnEntry("melita_woods", []);
    expect(pages.map((p) => p.id)).toEqual(["mission", "stage:melita_woods"]);
  });

  it("briefs a stage on the first entry only", () => {
    expect(briefingsOnEntry("salina_saltpans", ["melita_woods"]).map((p) => p.id)).toEqual([
      "stage:salina_saltpans",
    ]);
    // Coming back — whether to return to it or to pass through once it is cleared — is silent.
    expect(briefingsOnEntry("melita_woods", ["melita_woods", "salina_saltpans"])).toEqual([]);
  });

  it("does not repeat the mission once anywhere has been visited", () => {
    const pages = briefingsOnEntry("dingli_cliffs", ["melita_woods", "salina_saltpans"]);
    expect(pages.some((p) => p.id === "mission")).toBe(false);
  });

  it("states the win condition with the real totals", () => {
    const mission = missionBriefing().lines.join(" ");
    expect(mission).toContain(`${allTrainers().length} trainers`);
    expect(mission).toContain(`${STAGES.length} stages`);
  });

  it("names the gym leader and their medal on a gym stage", () => {
    const gymStage = STAGES.find((s) => s.gym)!;
    const text = stageBriefing(gymStage.id)!.lines.join(" ");
    expect(text).toContain(gymStage.gym!.medalName);
    expect(stageBriefing(gymStage.id)!.kicker).toContain("Gym");
  });

  it("has a briefing for every stage", () => {
    for (const stage of STAGES) expect(stageBriefing(stage.id)?.title).toBe(stage.name);
  });

  it("credits an old save with every stage up to where the player stands", () => {
    expect(stagesReachedBy("dingli_cliffs", 1)).toEqual(["melita_woods", "salina_saltpans", "dingli_cliffs"]);
    // No party means no game was ever started, so nothing was visited.
    expect(stagesReachedBy("dingli_cliffs", 0)).toEqual([]);
  });
});
