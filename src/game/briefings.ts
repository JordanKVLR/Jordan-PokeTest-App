import { STAGES, getStage } from "./zoneProgression";
import { allTrainers, trainersForZone } from "./trainers";

/**
 * What the player is told, and when.
 *
 * Two kinds of briefing: the mission, once, at the very start of a new game; and a stage
 * briefing the first time the player sets foot in each stage. Walking back into a stage says
 * nothing, and neither does passing back through one already cleared — a briefing is news, and
 * news only happens once. Kept free of React so the rule can be tested on its own.
 */

export interface BriefingPage {
  /** Stable id, so the screen and tests can tell which page is up. */
  id: string;
  kicker: string;
  title: string;
  lines: string[];
}

const TERRAIN: Record<string, string> = {
  grass: "tall grass",
  rock: "broken rock",
  water: "shallows",
  sand: "open sand",
};

export function missionBriefing(): BriefingPage {
  const trainers = allTrainers();
  const gyms = trainers.filter((t) => t.isGymLeader);
  const finalStage = STAGES[STAGES.length - 1];
  return {
    id: "mission",
    kicker: "Your mission",
    title: "Beat everyone on Melita",
    lines: [
      `${STAGES.length} stages lie between here and ${finalStage.name}. ${trainers.length} trainers are waiting along the way — ${gyms.length} of them gym leaders.`,
      `Win the game by beating every one of them. Each gym leader carries a medal, and each medal opens the next five stages.`,
      "Catch wild creatures in the tall grass, rock, shallows and sand to grow your party. When it is hurt, rest at a chapel.",
    ],
  };
}

export function stageBriefing(zoneId: string): BriefingPage | null {
  const stage = getStage(zoneId);
  if (!stage) return null;

  const trainers = trainersForZone(zoneId);
  const regulars = trainers.filter((t) => !t.isGymLeader);
  const leader = trainers.find((t) => t.isGymLeader);
  const [a, b] = stage.biomes;
  const lines: string[] = [
    `Wild creatures here live in the ${TERRAIN[a] ?? a} and the ${TERRAIN[b] ?? b}.`,
    regulars.length === 1
      ? "One trainer waits beside the road. Beat them — every trainer counts towards the win."
      : `${regulars.length} trainers wait beside the road. Beat them all — every trainer counts towards the win.`,
  ];

  if (leader && stage.gym) {
    const nextBlock = stage.stage < STAGES.length ? ` Without it, stage ${stage.stage + 1} stays shut.` : "";
    lines.push(
      `${leader.name}, ${leader.title}, stands at the far end holding the ${stage.gym.medalName}.${nextBlock}`
    );
  }

  if (stage.stage === STAGES.length) {
    lines.push("This is the last stage. Clear it and there is no one left on the islands to face.");
  } else {
    lines.push("The road runs straight to the exit; the chapel near the entrance heals your party.");
  }

  return {
    id: `stage:${zoneId}`,
    kicker: `Stage ${stage.stage} of ${STAGES.length}${stage.gym ? " · Gym" : ""}`,
    title: stage.name,
    lines,
  };
}

/**
 * The pages to show on arriving in a zone. Nothing, if the player has been here before. On a
 * brand-new game — nowhere visited yet — the mission comes first, then the first stage.
 */
export function briefingsOnEntry(zoneId: string, visitedStageIds: readonly string[]): BriefingPage[] {
  if (visitedStageIds.includes(zoneId)) return [];
  const pages: BriefingPage[] = [];
  if (visitedStageIds.length === 0) pages.push(missionBriefing());
  const stage = stageBriefing(zoneId);
  if (stage) pages.push(stage);
  return pages;
}
