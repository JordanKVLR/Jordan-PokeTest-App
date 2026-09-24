import { STAGES, getStage } from "./zoneProgression";
import { allTrainers, trainersForZone } from "./trainers";
import type { I18n, StringKey } from "../i18n/core";

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

export function missionBriefing(i18n: I18n): BriefingPage {
  const { t, c } = i18n;
  const trainers = allTrainers();
  const gyms = trainers.filter((trainer) => trainer.isGymLeader);
  const finalStage = STAGES[STAGES.length - 1];
  return {
    id: "mission",
    kicker: t("brief.mission.kicker"),
    title: t("brief.mission.title"),
    lines: [
      t("brief.mission.line1", {
        stages: STAGES.length,
        final: c.stage(finalStage.id),
        trainers: trainers.length,
        gyms: gyms.length,
      }),
      t("brief.mission.line2"),
      t("brief.mission.line3"),
    ],
  };
}

export function stageBriefing(zoneId: string, i18n: I18n): BriefingPage | null {
  const { t, c } = i18n;
  const stage = getStage(zoneId);
  if (!stage) return null;

  const trainers = trainersForZone(zoneId);
  const regulars = trainers.filter((trainer) => !trainer.isGymLeader);
  const leader = trainers.find((trainer) => trainer.isGymLeader);
  const [a, b] = stage.biomes;
  const lines: string[] = [
    t("brief.stage.terrain", { a: t(`terrain.${a}` as StringKey), b: t(`terrain.${b}` as StringKey) }),
    regulars.length === 1
      ? t("brief.stage.trainersOne")
      : t("brief.stage.trainersMany", { count: regulars.length }),
  ];

  if (leader && stage.gym) {
    const holds = t("brief.stage.gym", {
      leader: leader.name,
      title: c.gymTitle(stage.gym.medalId),
      medal: c.medal(stage.gym.medalId),
    });
    const gate = stage.stage < STAGES.length ? ` ${t("brief.stage.gymGate", { next: stage.stage + 1 })}` : "";
    lines.push(holds + gate);
  }

  lines.push(stage.stage === STAGES.length ? t("brief.stage.final") : t("brief.stage.road"));

  const kickerParams = { stage: stage.stage, total: STAGES.length };
  return {
    id: `stage:${zoneId}`,
    kicker: stage.gym ? t("brief.stage.kickerGym", kickerParams) : t("brief.stage.kicker", kickerParams),
    title: c.stage(zoneId),
    lines,
  };
}

/**
 * The pages to show on arriving in a zone. Nothing, if the player has been here before. On a
 * brand-new game — nowhere visited yet — the mission comes first, then the first stage. With
 * stage briefings turned off in Settings, the mission still plays once: it is the goal of the
 * game, not a per-stage summary.
 */
export function briefingsOnEntry(
  zoneId: string,
  visitedStageIds: readonly string[],
  i18n: I18n,
  options: { stageBriefings?: boolean } = {}
): BriefingPage[] {
  if (visitedStageIds.includes(zoneId)) return [];
  const pages: BriefingPage[] = [];
  if (visitedStageIds.length === 0) pages.push(missionBriefing(i18n));
  if (options.stageBriefings !== false) {
    const stage = stageBriefing(zoneId, i18n);
    if (stage) pages.push(stage);
  }
  return pages;
}
