import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useGameStore } from "../state/gameStore";
import {
  getMap,
  isWalkable,
  biomeAt,
  isExitTile,
  isEntranceTile,
  isHealTile,
  findTilePosition,
} from "../game/mapData";
import { TileArt, PlayerSprite, TrainerSprite } from "../art/tileArt";
import { trainerAt, trainersForZone } from "../game/trainers";
import { medalRequiredToEnter, getStage, STAGES } from "../game/zoneProgression";
import { briefingsOnEntry, type BriefingPage } from "../game/briefings";
import { CreatureAvatar } from "./components/CreatureAvatar";
import { Joystick } from "./components/Joystick";
import { BriefingModal } from "./components/BriefingModal";
import { ScreenBackground } from "./components/ScreenBackground";
import { useKeyboardShortcuts } from "./components/useKeyboardShortcuts";
import { useMapLayout } from "./components/useMapLayout";
import { useSettings } from "../state/settingsStore";
import { encounterChance, type ControlSide } from "../game/settings";
import { useI18n, currentI18n } from "../i18n";
import { colors, world } from "./theme";

type Props = NativeStackScreenProps<RootStackParamList, "Map">;

/** Base 0.15, bumped 30% per request. */
const ENCOUNTER_CHANCE = 0.195;
/** Screen-flash transition before cutting to Battle — a burst of quick flashes,
 * matching the classic "surprise encounter" screen-flash from the mainline games. */
const ENCOUNTER_FLASH_SEQUENCE = [1, 0, 1, 0, 1, 0, 1];
const ENCOUNTER_FLASH_STEP_MS = 90;
/** Reduced motion: one slow fade to white and back instead of seven fast strobes. */
const GENTLE_FLASH_SEQUENCE = [0.85, 0];
const GENTLE_FLASH_STEP_MS = 320;
const DRAWER_WIDTH = 116;
const TOTAL_STAGES = STAGES.length;
/** Walking feedback ("trees block the path") is a passing note, not something to dismiss. */
const TOAST_MS = 1800;
const DPAD_BUTTON = 52;

/** Where the movement control sits, per the player's thumb preference in Settings. */
const SIDE_STYLE: Record<ControlSide, { alignItems: "flex-start" | "center" | "flex-end" }> = {
  left: { alignItems: "flex-start" },
  center: { alignItems: "center" },
  right: { alignItems: "flex-end" },
};

type Direction = "up" | "down" | "left" | "right";

const DIRECTION_DELTA: Record<Direction, { dRow: number; dCol: number }> = {
  up: { dRow: -1, dCol: 0 },
  down: { dRow: 1, dCol: 0 },
  left: { dRow: 0, dCol: -1 },
  right: { dRow: 0, dCol: 1 },
};

/**
 * Camera translation for one axis. Positions are tracked in tiles rather than pixels, so the
 * same walk animation stays correct when the tile size changes under it — rotating a phone, or
 * dragging a laptop window from one layout to the other. The camera follows the player,
 * centred, and clamps at the zone's edges so it never shows past the map. A zone that fits
 * entirely is simply centred in the viewport.
 */
function cameraOffset(playerTile: Animated.Value, mapTiles: number, viewportPx: number, tile: number) {
  const mapPx = mapTiles * tile;
  if (mapPx <= viewportPx) return (viewportPx - mapPx) / 2;
  const halfTiles = (viewportPx - tile) / 2 / tile;
  const travel = mapPx - viewportPx;
  return playerTile.interpolate({
    inputRange: [0, halfTiles, halfTiles + travel / tile, mapTiles - 1],
    outputRange: [0, 0, -travel, -travel],
    extrapolate: "clamp",
  });
}

export function MapScreen({ navigation, route }: Props) {
  const map = getMap(route.params.zoneId);
  // Normally the zone's own default spawn point — but when walking back into a zone via its
  // entrance tile, this is the exact exit tile the player used to leave it in the first place.
  const startPosition = route.params.startAt ?? map.playerStart;
  const setCurrentZone = useGameStore((s) => s.setCurrentZone);
  const healFaintedPartyMembers = useGameStore((s) => s.healFaintedPartyMembers);
  const party = useGameStore((s) => s.party);
  const medals = useGameStore((s) => s.medals);
  const defeatedTrainerIds = useGameStore((s) => s.defeatedTrainerIds);
  const controlMode = useSettings((s) => s.controlMode);
  const controlSide = useSettings((s) => s.controlSide);
  const showFollower = useSettings((s) => s.showFollower);
  const reducedMotion = useSettings((s) => s.reducedMotion);
  const setSetting = useSettings((s) => s.set);
  const setControlMode = (mode: "joystick" | "dpad") => setSetting("controlMode", mode);
  const i18n = useI18n();
  const { t, c } = i18n;
  const markStageVisited = useGameStore((s) => s.markStageVisited);

  const mapCols = map.rows[0].length;
  const mapRows = map.rows.length;
  const layout = useMapLayout(mapCols, mapRows);
  const tile = layout.tileSize;
  const compact = layout.mode === "compact";

  const [position, setPosition] = useState(startPosition);
  const [facing, setFacing] = useState<Direction>("down");
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Decided once, as the zone opens: the store marks the stage visited when the briefing is
  // dismissed, and the briefing must not vanish mid-read when that lands.
  const [briefing, setBriefing] = useState<BriefingPage[]>(() =>
    briefingsOnEntry(map.zoneId, useGameStore.getState().visitedStageIds, currentI18n(), {
      stageBriefings: useSettings.getState().stageBriefings,
    })
  );
  /** A one-off notice that has to be acknowledged — the chapel, a barred gate. */
  const [notice, setNotice] = useState<BriefingPage | null>(null);
  const modalOpen = briefing.length > 0 || notice !== null;

  // Positions in tile units; multiplied out by the current tile size at render.
  const anim = useRef(new Animated.ValueXY({ x: startPosition.col, y: startPosition.row })).current;
  /** The lead creature walks one tile behind, so it animates to where the player just was. */
  const followerAnim = useRef(new Animated.ValueXY({ x: startPosition.col, y: startPosition.row })).current;
  const encounterFlash = useRef(new Animated.Value(0)).current;
  const healGlow = useRef(new Animated.Value(0)).current;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const leadCreature = party.find((m) => m.currentHp > 0) ?? party[0];
  const trainers = trainersForZone(map.zoneId);
  const stage = getStage(map.zoneId);
  const zoneBiome = stage?.biomes[0] ?? "grass";

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  // A zone with nothing to say is still a zone the player has now been to.
  useEffect(() => {
    if (briefing.length === 0) markStageVisited(map.zoneId);
    // Only on arrival; dismissing a briefing marks it separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finishBriefing() {
    markStageVisited(map.zoneId);
    setBriefing([]);
  }

  function toggleDrawer(open: boolean) {
    setDrawerOpen(open);
    Animated.spring(drawerAnim, { toValue: open ? 1 : 0, useNativeDriver: false, friction: 8 }).start();
  }

  const cameraX = cameraOffset(anim.x, mapCols, layout.viewportWidth, tile);
  const cameraY = cameraOffset(anim.y, mapRows, layout.viewportHeight, tile);
  const toPx = (v: Animated.Value) => Animated.multiply(v, tile);

  function flashSequence() {
    const [steps, ms] = reducedMotion
      ? [GENTLE_FLASH_SEQUENCE, GENTLE_FLASH_STEP_MS]
      : [ENCOUNTER_FLASH_SEQUENCE, ENCOUNTER_FLASH_STEP_MS];
    return steps.map((toValue) => Animated.timing(encounterFlash, { toValue, duration: ms, useNativeDriver: false }));
  }

  function move(direction: Direction) {
    if (busy || modalOpen) return;
    setFacing(direction);
    const { dRow, dCol } = DIRECTION_DELTA[direction];
    const next = { row: position.row + dRow, col: position.col + dCol };

    if (!isWalkable(map, next.row, next.col)) {
      setToast(t("map.treesBlock"));
      return;
    }

    // A trainer you walk into stops you where you are and challenges, rather than letting you
    // walk through them.
    const blocker = trainerAt(map.zoneId, next.row, next.col);
    if (blocker && !defeatedTrainerIds.includes(blocker.id)) {
      setBusy(true);
      const flashes = flashSequence();
      Animated.sequence(flashes).start(() => {
        encounterFlash.setValue(0);
        setBusy(false);
        // The biome only picks the backdrop here; a trainer fight isn't tied to terrain, so
        // use the zone's own primary biome.
        navigation.navigate("Battle", { biome: zoneBiome, trainerId: blocker.id });
      });
      return;
    }

    setToast(null);
    // Follower steps into the tile being vacated, one beat behind the player.
    Animated.timing(followerAnim, {
      toValue: { x: position.col, y: position.row },
      duration: 150,
      useNativeDriver: false,
    }).start();
    setPosition(next);
    setBusy(true);
    Animated.timing(anim, {
      toValue: { x: next.col, y: next.row },
      duration: 150,
      useNativeDriver: false, // animating a plain View position, not a native-driver-eligible property
    }).start(() => {
      if (isExitTile(map, next.row, next.col) && map.exitTo) {
        const gate = medalRequiredToEnter(map.exitTo);
        if (gate && !medals.includes(gate.medalId)) {
          const medal = c.medal(gate.medalId);
          setNotice({
            id: "gate",
            kicker: t("map.gate.kicker"),
            title: t("map.gate.title", { medal }),
            lines: [t("map.gate.line1", { medal }), t("map.gate.line2", { leader: gate.leaderName })],
          });
          setBusy(false);
          return;
        }
        setCurrentZone(map.exitTo);
        // reset (not push): Map is the app's default/root screen, so moving
        // to a new zone replaces the stack's root with a fresh Map instance
        // for that zone rather than growing an ever-longer push chain.
        navigation.reset({ index: 0, routes: [{ name: "Map", params: { zoneId: map.exitTo } }] });
        return;
      }

      // Walking back onto the entrance tile (where you originally spawned in this zone) returns
      // to the previous zone, landing exactly on the exit tile used to leave it — not that zone's
      // own default spawn point, so the round trip feels continuous rather than resetting you.
      if (isEntranceTile(map, next.row, next.col) && map.previousZoneId) {
        const prevMap = getMap(map.previousZoneId);
        const startAt = findTilePosition(prevMap, "exit") ?? prevMap.playerStart;
        setCurrentZone(map.previousZoneId);
        navigation.reset({ index: 0, routes: [{ name: "Map", params: { zoneId: map.previousZoneId, startAt } }] });
        return;
      }

      if (isHealTile(map, next.row, next.col)) {
        const healedCount = healFaintedPartyMembers();
        setNotice({
          id: "chapel",
          kicker: t("map.chapel.kicker"),
          title: healedCount > 0 ? t("map.chapel.restored") : t("map.chapel.quiet"),
          lines: [
            healedCount === 0
              ? t("map.chapel.rested")
              : healedCount === 1
                ? t("map.chapel.healedOne")
                : t("map.chapel.healedMany", { count: healedCount }),
          ],
        });
        if (healedCount > 0) {
          // A green wash over the scene so healing registers as an event, not a line of text.
          Animated.sequence([
            Animated.timing(healGlow, { toValue: 1, duration: 260, useNativeDriver: false }),
            Animated.timing(healGlow, { toValue: 0, duration: 520, useNativeDriver: false }),
          ]).start();
        }
        setBusy(false);
        return;
      }

      const biome = biomeAt(map, next.row, next.col);
      if (biome && Math.random() < encounterChance(ENCOUNTER_CHANCE, useSettings.getState().encounterRate)) {
        // Screen-flash transition before cutting to Battle — busy stays true
        // for the whole sequence so the player can't walk away mid-flash.
        const flashAnimations = flashSequence();
        Animated.sequence(flashAnimations).start(() => {
          encounterFlash.setValue(0);
          setBusy(false);
          navigation.navigate("Battle", { biome });
        });
        return;
      }

      setBusy(false);
    });
  }

  // While a briefing or notice is up, the keyboard goes nowhere — the same rule as the battle.
  const guarded = (fn: () => void) => () => {
    if (!modalOpen) fn();
  };
  useKeyboardShortcuts({
    ArrowUp: () => move("up"),
    ArrowDown: () => move("down"),
    ArrowLeft: () => move("left"),
    ArrowRight: () => move("right"),
    b: guarded(() => navigation.navigate("Bag")),
    p: guarded(() => navigation.navigate("Party")),
    m: guarded(() => navigation.navigate("Home")),
  });

  const entitySize = { width: tile, height: tile };

  const world_ = (
    <View
      testID="map-viewport"
      style={[
        styles.viewport,
        compact ? styles.viewportCompact : styles.viewportWide,
        { width: layout.viewportWidth, height: layout.viewportHeight },
      ]}
    >
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: mapCols * tile,
          height: mapRows * tile,
          transform: [{ translateX: cameraX }, { translateY: cameraY }],
        }}
      >
        {map.rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((tileType, colIndex) => (
              <View key={colIndex} style={entitySize}>
                <TileArt type={tileType} seed={rowIndex * 31 + colIndex * 17} size={tile} />
              </View>
            ))}
          </View>
        ))}
        {trainers.map((trainer) => (
          <View
            key={trainer.id}
            testID={`trainer-${trainer.id}`}
            style={[styles.entity, entitySize, { left: trainer.position.col * tile, top: trainer.position.row * tile }]}
          >
            <TrainerSprite
              size={tile}
              isGymLeader={trainer.isGymLeader}
              defeated={defeatedTrainerIds.includes(trainer.id)}
            />
          </View>
        ))}

        {leadCreature && showFollower && (
          <Animated.View
            testID="follower-creature"
            pointerEvents="none"
            style={[
              styles.entity,
              entitySize,
              { transform: [{ translateX: toPx(followerAnim.x) }, { translateY: toPx(followerAnim.y) }] },
            ]}
          >
            <CreatureAvatar speciesId={leadCreature.speciesId} types={leadCreature.types} size={tile * 0.72} />
          </Animated.View>
        )}

        <Animated.View
          testID="player-avatar"
          style={[
            styles.entity,
            entitySize,
            { transform: [{ translateX: toPx(anim.x) }, { translateY: toPx(anim.y) }] },
          ]}
        >
          <PlayerSprite facing={facing} size={tile} />
        </Animated.View>
      </Animated.View>

      <Animated.View testID="encounter-flash" pointerEvents="none" style={[styles.wash, { opacity: encounterFlash }]} />
      <Animated.View
        testID="heal-glow"
        pointerEvents="none"
        style={[styles.wash, styles.healGlow, { opacity: healGlow }]}
      />

      {/* Where you are, laid over the corner of the map rather than taking a band of screen. */}
      <View testID="zone-badge" pointerEvents="none" style={[styles.badge, compact && styles.badgeCompact]}>
        <Text style={styles.badgeKicker}>
          {t(stage?.gym ? "map.stageBadgeGym" : "map.stageBadge", { stage: stage?.stage ?? 1, total: TOTAL_STAGES })}
        </Text>
        <Text style={styles.badgeTitle}>{c.stage(map.zoneId)}</Text>
      </View>

      {toast && (
        <View testID="map-toast" pointerEvents="none" style={[styles.toast, compact && styles.toastCompact]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Hidden side menu: a slim tab on the edge that slides a panel out, so the map's
          controls can't be hit by accident while walking. */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [
              { translateX: drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [DRAWER_WIDTH, 0] }) },
            ],
          },
        ]}
      >
        {[
          { label: t("home.party"), testID: "drawer-party", go: () => navigation.navigate("Party") },
          { label: t("home.bag"), testID: "drawer-bag", go: () => navigation.navigate("Bag") },
          { label: t("home.codex"), testID: "drawer-codex", go: () => navigation.navigate("Codex") },
          { label: t("home.shop"), testID: "drawer-shop", go: () => navigation.navigate("Shop") },
          { label: t("home.settings"), testID: "drawer-settings", go: () => navigation.navigate("Settings") },
          { label: t("map.menu"), testID: "menu-button", go: () => navigation.navigate("Home") },
        ].map((entry) => (
          <Pressable
            key={entry.label}
            testID={entry.testID}
            onPress={() => {
              toggleDrawer(false);
              entry.go();
            }}
            style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]}
          >
            <Text style={styles.drawerItemText}>{entry.label}</Text>
          </Pressable>
        ))}
      </Animated.View>

      <Pressable
        testID="drawer-tab"
        onPress={() => toggleDrawer(!drawerOpen)}
        style={({ pressed }) => [styles.drawerTab, pressed && styles.drawerTabPressed]}
      >
        <Text style={styles.drawerTabGlyph}>{drawerOpen ? "›" : "‹"}</Text>
      </Pressable>

      {/* Controls float over the world. Black outlines and arrows, nothing filled in behind
          them, so the map stays visible through the control you are using. */}
      <View
        testID="map-controls"
        pointerEvents="box-none"
        style={[styles.controls, compact ? styles.controlsCompact : styles.controlsWide, SIDE_STYLE[controlSide]]}
      >
        {controlMode === "joystick" ? (
          <Joystick onStep={move} disabled={busy || modalOpen} overlay />
        ) : (
          <View style={styles.dpad}>
            <DpadButton testID="move-up" glyph="▲" onPress={() => move("up")} />
            <View style={styles.dpadMiddleRow}>
              <DpadButton testID="move-left" glyph="◀" onPress={() => move("left")} />
              <View style={styles.dpadSpacer} />
              <DpadButton testID="move-right" glyph="▶" onPress={() => move("right")} />
            </View>
            <DpadButton testID="move-down" glyph="▼" onPress={() => move("down")} />
          </View>
        )}
      </View>

      <Pressable
        testID="toggle-control-mode"
        onPress={() => setControlMode(controlMode === "joystick" ? "dpad" : "joystick")}
        style={({ pressed }) => [
          styles.controlToggle,
          compact && styles.controlToggleCompact,
          // Kept in the corner the controls are not in, so the two never overlap.
          controlSide === "right" && styles.controlToggleLeft,
          pressed && styles.controlTogglePressed,
        ]}
      >
        <Text style={styles.controlToggleText}>{controlMode === "joystick" ? t("map.dpad") : t("map.joystick")}</Text>
      </Pressable>
    </View>
  );

  return (
    <>
      {compact ? (
        <View style={styles.compactRoot}>{world_}</View>
      ) : (
        <ScreenBackground style={styles.wideRoot}>{world_}</ScreenBackground>
      )}
      {briefing.length > 0 && <BriefingModal pages={briefing} onDone={finishBriefing} />}
      {notice && <BriefingModal pages={[notice]} onDone={() => setNotice(null)} />}
    </>
  );
}

function DpadButton({ testID, glyph, onPress }: { testID: string; glyph: string; onPress: () => void }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.dpadButton, pressed && styles.dpadButtonPressed]}
    >
      <Text style={styles.dpadGlyph}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Compact: the map is the screen. The backdrop is the same deep green as the tree line, so
  // if a zone is ever smaller than the screen the edge reads as more forest, not a gap.
  compactRoot: {
    flex: 1,
    backgroundColor: world.treeCanopyDark,
  },
  wideRoot: {
    alignItems: "center",
    justifyContent: "center",
  },
  viewport: {
    position: "relative",
    overflow: "hidden",
  },
  viewportCompact: {},
  viewportWide: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
  },
  /** Anything standing on the map — trainers, the follower, the player — is placed in grid space. */
  entity: {
    position: "absolute",
    left: 0,
    top: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffffff",
  },
  healGlow: {
    backgroundColor: "#7ddba0",
  },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Clears the status bar / notch on a phone.
  badgeCompact: {
    top: 44,
  },
  badgeKicker: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  badgeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  toast: {
    position: "absolute",
    top: 76,
    left: 12,
    right: 12,
    alignItems: "center",
  },
  toastCompact: {
    top: 108,
  },
  toastText: {
    backgroundColor: "rgba(20,28,34,0.82)",
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    overflow: "hidden",
  },
  controls: {
    position: "absolute",
    alignItems: "center",
  },
  // Thumb height on a phone, clear of the home indicator.
  controlsCompact: {
    left: 0,
    right: 0,
    bottom: 36,
    paddingHorizontal: 22,
  },
  controlsWide: {
    left: 0,
    right: 0,
    bottom: 18,
    paddingHorizontal: 18,
  },
  dpad: {
    alignItems: "center",
    gap: 6,
  },
  dpadMiddleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dpadButton: {
    width: DPAD_BUTTON,
    height: DPAD_BUTTON,
    borderRadius: 12,
    backgroundColor: "transparent",
    borderWidth: 2.5,
    borderColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  dpadButtonPressed: {
    backgroundColor: "rgba(0,0,0,0.18)",
    transform: [{ scale: 0.95 }],
  },
  dpadSpacer: {
    width: DPAD_BUTTON,
    height: DPAD_BUTTON,
  },
  dpadGlyph: {
    fontSize: 22,
    color: "#000000",
    // A thin light halo so a black arrow still reads over a dark tree or deep water.
    textShadowColor: "rgba(255,255,255,0.75)",
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 0 },
  },
  controlToggle: {
    position: "absolute",
    right: 14,
    bottom: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#000000",
    backgroundColor: "transparent",
  },
  controlToggleLeft: {
    right: undefined,
    left: 14,
  },
  controlToggleCompact: {
    bottom: 36,
  },
  controlTogglePressed: {
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  controlToggleText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "800",
    textShadowColor: "rgba(255,255,255,0.75)",
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 0 },
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 6,
    justifyContent: "center",
  },
  drawerItem: {
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  drawerItemPressed: {
    backgroundColor: colors.accent,
    transform: [{ scale: 0.97 }],
  },
  drawerItemText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  /** Deliberately small and hard against the edge: easy to find, hard to hit while walking. */
  drawerTab: {
    position: "absolute",
    right: 0,
    top: "42%",
    width: 22,
    height: 54,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerTabPressed: {
    backgroundColor: colors.accent,
  },
  drawerTabGlyph: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: "700",
  },
});
