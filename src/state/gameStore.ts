import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildStarterParticipant, STARTER_STARTING_LEVEL, type StarterLineName } from "../game/creatureFactory";
import {
  partyMemberFromParticipant,
  partyMemberStats,
  fullPpFor,
  remainingPp,
  addExperience,
  applyLevelUp,
  type PartyMember,
  type EvolutionReveal,
  type MoveLearnResult,
} from "../game/party";
import { defaultStartingInventory, getItem } from "../game/itemsRepo";
import { getMove } from "../game/movesRepo";

export type ControlMode = "joystick" | "dpad";

const SAVE_KEY = "melita-save";
const SAVE_VERSION = 1;
const STARTING_ZONE_ID = "melita_woods";
const DEFAULT_PLAYER_NAME = "Traveler";
const MAX_PARTY_SIZE = 6;
const STARTING_CURRENCY = 50;

export interface ExperienceGainResult {
  member: PartyMember;
  leveledUp: boolean;
  newLevel: number;
  levelsGained: number;
  evolution: EvolutionReveal | null;
  moveLearning: MoveLearnResult;
}

export type UseItemResult =
  | { applied: false }
  | { applied: true; effect: "heal"; healedAmount: number }
  | {
      applied: true;
      effect: "level_up";
      member: PartyMember;
      evolution: EvolutionReveal | null;
      moveLearning: MoveLearnResult;
    };

interface GameState {
  playerName: string;
  selectedLine: StarterLineName | null;
  currentZoneId: string;
  battlesWon: number;
  party: PartyMember[];
  seenSpeciesIds: string[];
  caughtSpeciesIds: string[];
  inventory: Record<string, number>;
  currency: number;
  /** True once the persisted save (if any) has finished loading from disk. Screens that decide
   * whether to offer "Continue" should wait for this before trusting `party.length`. */
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  /** Overworld control scheme. Joystick suits a thumb; the D-pad suits a mouse or keyboard. */
  controlMode: ControlMode;
  setControlMode: (mode: ControlMode) => void;
  /** Gym medals earned, in the order they were won — these gate the later stages. */
  medals: string[];
  awardMedal: (medalId: string) => void;
  hasMedal: (medalId: string) => boolean;
  /** Trainers already beaten, so they don't re-challenge on every pass. */
  defeatedTrainerIds: string[];
  markTrainerDefeated: (trainerId: string) => void;

  selectStarter: (line: StarterLineName) => void;
  recordBattleResult: (won: boolean) => void;
  updatePartyMemberHp: (uid: string, currentHp: number) => void;
  markSeen: (speciesId: string) => void;
  catchCreature: (member: PartyMember) => boolean;
  consumeItem: (itemId: string) => boolean;
  earnCurrency: (amount: number) => void;
  spendCurrency: (amount: number) => boolean;
  addItem: (itemId: string, quantity: number) => void;
  grantExperience: (uid: string, xp: number) => ExperienceGainResult | null;
  setCurrentZone: (zoneId: string) => void;
  setPlayerName: (name: string) => void;
  releaseCreature: (uid: string) => boolean;
  /** Applies a "heal" or "level_up" item to a party member outside of battle (e.g. from Creature Detail). */
  useItemOnPartyMember: (uid: string, itemId: string) => UseItemResult;
  /** Bumps a party member's level by 1 in the store, independent of any live battle context. */
  bumpPartyMemberLevel: (uid: string) => void;
  /** Moves the given party member to the front of the party order, so it leads future battles
   * (the battle screen always picks the first conscious member as the active fighter). */
  setMainPartyMember: (uid: string) => void;
  /** Renames a party member's displayName (a nickname); ignores blank input. */
  renamePartyMember: (uid: string, name: string) => void;
  /** Healing Center: fully revives every KO'd (currentHp <= 0) party member to max HP.
   * Deliberately leaves already-conscious members untouched, even if not at full HP —
   * this is a blackout-recovery station, not a full-party top-up. Returns how many were healed. */
  /** Healing Centre: restores HP and move PP across the whole party. Returns how many
   * members actually needed it. */
  healFaintedPartyMembers: () => number;
  /** Consumes one PP of a move for a party member. */
  spendPp: (uid: string, moveId: string) => void;
  /** Swaps a known move for a newly learned one, giving the new move full PP. Passing a
   * forgotten move the member doesn't know is a no-op. */
  replacePartyMemberMove: (uid: string, forgetMoveId: string, learnMoveId: string) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
    playerName: DEFAULT_PLAYER_NAME,
    selectedLine: null,
    currentZoneId: STARTING_ZONE_ID,
    battlesWon: 0,
    party: [],
    seenSpeciesIds: [],
    caughtSpeciesIds: [],
    inventory: defaultStartingInventory(),
    currency: STARTING_CURRENCY,
    hasHydrated: false,
    setHasHydrated: (value) => set({ hasHydrated: value }),
    controlMode: "joystick",
    setControlMode: (mode) => set({ controlMode: mode }),
    medals: [],
    awardMedal: (medalId) =>
      set((state) =>
        state.medals.includes(medalId) ? state : { medals: [...state.medals, medalId] }
      ),
    hasMedal: (medalId) => get().medals.includes(medalId),
    defeatedTrainerIds: [],
    markTrainerDefeated: (trainerId) =>
      set((state) =>
        state.defeatedTrainerIds.includes(trainerId)
          ? state
          : { defeatedTrainerIds: [...state.defeatedTrainerIds, trainerId] }
      ),

    selectStarter: (line) => {
      const participant = buildStarterParticipant(line, STARTER_STARTING_LEVEL, "player-1");
      const member = partyMemberFromParticipant(participant, "starter");
      set({
        selectedLine: line,
        party: [member],
        seenSpeciesIds: [member.speciesId],
        caughtSpeciesIds: [member.speciesId],
      });
    },

    recordBattleResult: (won) =>
      set((state) => ({ battlesWon: won ? state.battlesWon + 1 : state.battlesWon })),

    updatePartyMemberHp: (uid, currentHp) =>
      set((state) => ({
        party: state.party.map((m) => (m.uid === uid ? { ...m, currentHp: Math.max(0, currentHp) } : m)),
      })),

    markSeen: (speciesId) =>
      set((state) =>
        state.seenSpeciesIds.includes(speciesId)
          ? state
          : { seenSpeciesIds: [...state.seenSpeciesIds, speciesId] }
      ),

    catchCreature: (member) => {
      const { party, caughtSpeciesIds } = get();
      if (party.length >= MAX_PARTY_SIZE) return false;
      set({
        party: [...party, member],
        caughtSpeciesIds: caughtSpeciesIds.includes(member.speciesId)
          ? caughtSpeciesIds
          : [...caughtSpeciesIds, member.speciesId],
      });
      return true;
    },

    consumeItem: (itemId) => {
      const qty = get().inventory[itemId] ?? 0;
      if (qty <= 0) return false;
      set((state) => ({ inventory: { ...state.inventory, [itemId]: qty - 1 } }));
      return true;
    },

    earnCurrency: (amount) => set((state) => ({ currency: state.currency + Math.max(0, amount) })),

    spendCurrency: (amount) => {
      const { currency } = get();
      if (amount <= 0 || currency < amount) return false;
      set({ currency: currency - amount });
      return true;
    },

    addItem: (itemId, quantity) =>
      set((state) => ({
        inventory: { ...state.inventory, [itemId]: (state.inventory[itemId] ?? 0) + quantity },
      })),

    grantExperience: (uid, xp) => {
      const member = get().party.find((m) => m.uid === uid);
      if (!member) return null;
      const result = addExperience(member, xp);
      set((state) => ({
        party: state.party.map((m) => (m.uid === uid ? result.member : m)),
      }));
      return result;
    },

    setCurrentZone: (zoneId) => set({ currentZoneId: zoneId }),

    setPlayerName: (name) => set({ playerName: name.trim().length > 0 ? name.trim() : DEFAULT_PLAYER_NAME }),

    releaseCreature: (uid) => {
      const { party } = get();
      if (party.length <= 1) return false;
      const exists = party.some((m) => m.uid === uid);
      if (!exists) return false;
      set({ party: party.filter((m) => m.uid !== uid) });
      return true;
    },

    useItemOnPartyMember: (uid, itemId) => {
      const { party, inventory } = get();
      const member = party.find((m) => m.uid === uid);
      if (!member) return { applied: false };
      const qty = inventory[itemId] ?? 0;
      if (qty <= 0) return { applied: false };
      const item = getItem(itemId);

      if (item.effect === "heal" && item.healAmount !== undefined) {
        const maxHp = partyMemberStats(member).hp;
        const newHp = Math.min(maxHp, member.currentHp + item.healAmount);
        const healedAmount = newHp - member.currentHp;
        set({
          party: party.map((m) => (m.uid === uid ? { ...m, currentHp: newHp } : m)),
          inventory: { ...inventory, [itemId]: qty - 1 },
        });
        return { applied: true, effect: "heal", healedAmount };
      }

      if (item.effect === "level_up") {
        const { member: leveled, evolution, moveLearning } = applyLevelUp(member);
        set({
          party: party.map((m) => (m.uid === uid ? leveled : m)),
          inventory: { ...inventory, [itemId]: qty - 1 },
        });
        return { applied: true, effect: "level_up", member: leveled, evolution, moveLearning };
      }

      return { applied: false };
    },

    bumpPartyMemberLevel: (uid) => {
      const member = get().party.find((m) => m.uid === uid);
      if (!member) return;
      const { member: leveled } = applyLevelUp(member);
      set((state) => ({ party: state.party.map((m) => (m.uid === uid ? leveled : m)) }));
    },

    setMainPartyMember: (uid) => {
      const { party } = get();
      const index = party.findIndex((m) => m.uid === uid);
      if (index <= 0) return; // already main, or not found
      const reordered = [party[index], ...party.slice(0, index), ...party.slice(index + 1)];
      set({ party: reordered });
    },

    renamePartyMember: (uid, name) => {
      const trimmed = name.trim().slice(0, 16);
      if (!trimmed) return;
      set((state) => ({
        party: state.party.map((m) => (m.uid === uid ? { ...m, displayName: trimmed } : m)),
      }));
    },

    healFaintedPartyMembers: () => {
      const { party } = get();
      let restoredCount = 0;
      const healed = party.map((m) => {
        const maxHp = partyMemberStats(m).hp;
        const needsHp = m.currentHp < maxHp;
        const needsPp = m.moveIds.some((id) => remainingPp(m, id) < getMove(id).pp);
        if (!needsHp && !needsPp) return m;
        restoredCount += 1;
        return { ...m, currentHp: maxHp, movePp: fullPpFor(m.moveIds) };
      });
      if (restoredCount > 0) set({ party: healed });
      return restoredCount;
    },

    replacePartyMemberMove: (uid, forgetMoveId, learnMoveId) =>
      set((state) => ({
        party: state.party.map((m) => {
          if (m.uid !== uid || !m.moveIds.includes(forgetMoveId)) return m;
          const moveIds = m.moveIds.map((id) => (id === forgetMoveId ? learnMoveId : id));
          const movePp = { ...(m.movePp ?? {}) };
          delete movePp[forgetMoveId];
          movePp[learnMoveId] = getMove(learnMoveId).pp;
          return { ...m, moveIds, movePp };
        }),
      })),

    spendPp: (uid, moveId) =>
      set((state) => ({
        party: state.party.map((m) => {
          if (m.uid !== uid) return m;
          const current = remainingPp(m, moveId);
          return { ...m, movePp: { ...(m.movePp ?? fullPpFor(m.moveIds)), [moveId]: Math.max(0, current - 1) } };
        }),
      })),

    resetGame: () =>
      set({
        medals: [],
        defeatedTrainerIds: [],
        playerName: DEFAULT_PLAYER_NAME,
        selectedLine: null,
        currentZoneId: STARTING_ZONE_ID,
        battlesWon: 0,
        party: [],
        seenSpeciesIds: [],
        caughtSpeciesIds: [],
        inventory: defaultStartingInventory(),
        currency: STARTING_CURRENCY,
      }),
    }),
    {
      name: SAVE_KEY,
      version: SAVE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist actual save data — never the derived hasHydrated flag (zustand's
      // `set`/`get`-bound action functions can't survive JSON serialization anyway, so those
      // are dropped automatically, but hasHydrated needs an explicit exclusion).
      partialize: (state) => ({
        controlMode: state.controlMode,
        medals: state.medals,
        defeatedTrainerIds: state.defeatedTrainerIds,
        playerName: state.playerName,
        selectedLine: state.selectedLine,
        currentZoneId: state.currentZoneId,
        battlesWon: state.battlesWon,
        party: state.party,
        seenSpeciesIds: state.seenSpeciesIds,
        caughtSpeciesIds: state.caughtSpeciesIds,
        inventory: state.inventory,
        currency: state.currency,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
