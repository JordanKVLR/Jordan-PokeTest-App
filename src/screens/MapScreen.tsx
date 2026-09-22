import { useRef, useState } from "react";
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
import { CreatureAvatar } from "./components/CreatureAvatar";
import { Joystick } from "./components/Joystick";
import { ScreenBackground } from "./components/ScreenBackground";
import { useKeyboardShortcuts } from "./components/useKeyboardShortcuts";
import { colors } from "./theme";

type Props = NativeStackScreenProps<RootStackParamList, "Map">;

const TILE_SIZE = 44;
/** How many tiles are visible at once — bigger zones now scroll a camera around the player
 * rather than rendering the whole map (which stopped fitting on a phone screen). Odd, so the
 * avatar can sit dead-center. */
const VIEWPORT_TILES = 7;
/** Base 0.15, bumped 30% per request. */
const ENCOUNTER_CHANCE = 0.195;
/** Screen-flash transition before cutting to Battle — a burst of quick flashes,
 * matching the classic "surprise encounter" screen-flash from the mainline games. */
const ENCOUNTER_FLASH_SEQUENCE = [1, 0, 1, 0, 1, 0, 1];
const ENCOUNTER_FLASH_STEP_MS = 90;
const DRAWER_WIDTH = 116;
const TOTAL_STAGES = STAGES.length;

type Direction = "up" | "down" | "left" | "right";

const DIRECTION_DELTA: Record<Direction, { dRow: number; dCol: number; glyph: string }> = {
  up: { dRow: -1, dCol: 0, glyph: "▲" },
  down: { dRow: 1, dCol: 0, glyph: "▼" },
  left: { dRow: 0, dCol: -1, glyph: "◀" },
  right: { dRow: 0, dCol: 1, glyph: "▶" },
};

/**
 * Camera offset for one axis: follows the player's animated pixel position, centering them in
 * the viewport, but clamps at the map's edges so the camera never shows past the map bounds.
 * Returns a plain 0 (no scrolling needed) when the whole axis already fits inside the viewport.
 */
function cameraOffset(playerAnim: Animated.Value, mapPx: number, viewportPx: number) {
  if (mapPx <= viewportPx) return 0;
  const half = (viewportPx - TILE_SIZE) / 2;
  const rightBound = mapPx - viewportPx;
  const maxPlayer = mapPx - TILE_SIZE;
  return playerAnim.interpolate({
    inputRange: [0, half, half + rightBound, maxPlayer],
    outputRange: [0, 0, rightBound, rightBound],
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
  const controlMode = useGameStore((s) => s.controlMode);
  const setControlMode = useGameStore((s) => s.setControlMode);

  const mapPixelWidth = map.rows[0].length * TILE_SIZE;
  const mapPixelHeight = map.rows.length * TILE_SIZE;
  const viewportWidth = Math.min(VIEWPORT_TILES * TILE_SIZE, mapPixelWidth);
  const viewportHeight = Math.min(VIEWPORT_TILES * TILE_SIZE, mapPixelHeight);

  const [position, setPosition] = useState(startPosition);
  const [facing, setFacing] = useState<Direction>("down");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const anim = useRef(
    new Animated.ValueXY({
      x: startPosition.col * TILE_SIZE,
      y: startPosition.row * TILE_SIZE,
    })
  ).current;
  const encounterFlash = useRef(new Animated.Value(0)).current;
  /** The lead creature walks one tile behind, so it animates to where the player just was. */
  const followerAnim = useRef(
    new Animated.ValueXY({ x: startPosition.col * TILE_SIZE, y: startPosition.row * TILE_SIZE })
  ).current;
  const healGlow = useRef(new Animated.Value(0)).current;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const leadCreature = party.find((m) => m.currentHp > 0) ?? party[0];
  const trainers = trainersForZone(map.zoneId);
  const stage = getStage(map.zoneId);
  const zoneBiome = stage?.biomes[0] ?? "grass";

  function toggleDrawer(open: boolean) {
    setDrawerOpen(open);
    Animated.spring(drawerAnim, { toValue: open ? 1 : 0, useNativeDriver: false, friction: 8 }).start();
  }

  const cameraX = cameraOffset(anim.x, mapPixelWidth, viewportWidth);
  const cameraY = cameraOffset(anim.y, mapPixelHeight, viewportHeight);
  const cameraTranslateX = typeof cameraX === "number" ? cameraX : Animated.multiply(cameraX, -1);
  const cameraTranslateY = typeof cameraY === "number" ? cameraY : Animated.multiply(cameraY, -1);

  function move(direction: Direction) {
    if (busy) return;
    setFacing(direction);
    const { dRow, dCol } = DIRECTION_DELTA[direction];
    const next = { row: position.row + dRow, col: position.col + dCol };

    if (!isWalkable(map, next.row, next.col)) {
      setMessage("Can't walk that way — trees block the path.");
      return;
    }

    // A trainer standing in the road stops you where you are and challenges, rather than
    // letting you walk through them.
    const blocker = trainerAt(map.zoneId, next.row, next.col);
    if (blocker && !defeatedTrainerIds.includes(blocker.id)) {
      setMessage(blocker.intro);
      setBusy(true);
      const flashes = ENCOUNTER_FLASH_SEQUENCE.map((toValue) =>
        Animated.timing(encounterFlash, { toValue, duration: ENCOUNTER_FLASH_STEP_MS, useNativeDriver: false })
      );
      Animated.sequence(flashes).start(() => {
        encounterFlash.setValue(0);
        setBusy(false);
        // The biome only picks the backdrop here; a trainer fight isn't tied to terrain, so
        // use the zone's own primary biome.
        navigation.navigate("Battle", { biome: zoneBiome, trainerId: blocker.id });
      });
      return;
    }

    setMessage(null);
    // Follower steps into the tile being vacated, one beat behind the player.
    Animated.timing(followerAnim, {
      toValue: { x: position.col * TILE_SIZE, y: position.row * TILE_SIZE },
      duration: 150,
      useNativeDriver: false,
    }).start();
    setPosition(next);
    setBusy(true);
    Animated.timing(anim, {
      toValue: { x: next.col * TILE_SIZE, y: next.row * TILE_SIZE },
      duration: 150,
      useNativeDriver: false, // animating a plain View position, not a native-driver-eligible property
    }).start(() => {
      if (isExitTile(map, next.row, next.col) && map.exitTo) {
        const gate = medalRequiredToEnter(map.exitTo);
        if (gate && !medals.includes(gate.medalId)) {
          setMessage(`The way on is barred. Earn the ${gate.medalName} from ${gate.leaderName} first.`);
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
        setMessage(
          healedCount > 0
            ? `The chapel restores your party — ${healedCount} creature${healedCount === 1 ? "" : "s"} back to full.`
            : "Your party is already rested."
        );
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
      if (biome && Math.random() < ENCOUNTER_CHANCE) {
        // Screen-flash transition before cutting to Battle — busy stays true
        // for the whole sequence so the player can't walk away mid-flash.
        const flashAnimations = ENCOUNTER_FLASH_SEQUENCE.map((toValue) =>
          Animated.timing(encounterFlash, { toValue, duration: ENCOUNTER_FLASH_STEP_MS, useNativeDriver: false })
        );
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

  useKeyboardShortcuts({
    ArrowUp: () => move("up"),
    ArrowDown: () => move("down"),
    ArrowLeft: () => move("left"),
    ArrowRight: () => move("right"),
    b: () => navigation.navigate("Bag"),
    p: () => navigation.navigate("Party"),
    m: () => navigation.navigate("Home"),
  });

  return (
    <ScreenBackground style={styles.container}>
      <Text style={styles.title}>{map.zoneName}</Text>
      <Text style={styles.subtitle}>
        Stage {stage?.stage ?? 1} of {TOTAL_STAGES} · wild creatures lurk in the tall grass, rock,
        water and sand. The chapel restores your party; trainers on the road must be beaten to pass.
      </Text>

      <View style={[styles.gridWrap, { width: viewportWidth, height: viewportHeight }]}>
        <Animated.View
          style={[
            styles.grid,
            {
              width: mapPixelWidth,
              height: mapPixelHeight,
              transform: [{ translateX: cameraTranslateX }, { translateY: cameraTranslateY }],
            },
          ]}
        >
          {map.rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((tile, colIndex) => (
                <View key={colIndex} style={styles.tile}>
                  <TileArt type={tile} seed={rowIndex * 31 + colIndex * 17} size={TILE_SIZE} />
                </View>
              ))}
            </View>
          ))}
          {trainers.map((trainer) => (
            <View
              key={trainer.id}
              testID={`trainer-${trainer.id}`}
              style={[
                styles.entity,
                { left: trainer.position.col * TILE_SIZE, top: trainer.position.row * TILE_SIZE },
              ]}
            >
              <TrainerSprite
                size={TILE_SIZE}
                isGymLeader={trainer.isGymLeader}
                defeated={defeatedTrainerIds.includes(trainer.id)}
              />
            </View>
          ))}

          {leadCreature && (
            <Animated.View
              testID="follower-creature"
              pointerEvents="none"
              style={[styles.follower, { transform: followerAnim.getTranslateTransform() }]}
            >
              <CreatureAvatar
                speciesId={leadCreature.speciesId}
                types={leadCreature.types}
                size={TILE_SIZE * 0.72}
              />
            </Animated.View>
          )}

          <Animated.View testID="player-avatar" style={[styles.avatar, { transform: anim.getTranslateTransform() }]}>
            <PlayerSprite facing={facing} size={TILE_SIZE} />
          </Animated.View>
        </Animated.View>
        <Animated.View
          testID="encounter-flash"
          pointerEvents="none"
          style={[styles.encounterFlash, { opacity: encounterFlash }]}
        />
        <Animated.View
          testID="heal-glow"
          pointerEvents="none"
          style={[styles.healGlow, { opacity: healGlow }]}
        />

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
            { label: "Party", testID: "drawer-party", go: () => navigation.navigate("Party") },
            { label: "Bag", testID: "drawer-bag", go: () => navigation.navigate("Bag") },
            { label: "Codex", testID: "drawer-codex", go: () => navigation.navigate("Codex") },
            { label: "Shop", testID: "drawer-shop", go: () => navigation.navigate("Shop") },
            { label: "Menu", testID: "menu-button", go: () => navigation.navigate("Home") },
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
      </View>

      <Text style={styles.message}>{message ?? " "}</Text>

      {controlMode === "joystick" ? (
        <View style={styles.joystickWrap}>
          <Joystick onStep={move} disabled={busy} />
        </View>
      ) : (
      <View style={styles.dpad}>
        <Pressable testID="move-up" onPress={() => move("up")} style={styles.dpadButton}>
          <Text style={styles.dpadGlyph}>▲</Text>
        </Pressable>
        <View style={styles.dpadMiddleRow}>
          <Pressable testID="move-left" onPress={() => move("left")} style={styles.dpadButton}>
            <Text style={styles.dpadGlyph}>◀</Text>
          </Pressable>
          <View style={styles.dpadSpacer} />
          <Pressable testID="move-right" onPress={() => move("right")} style={styles.dpadButton}>
            <Text style={styles.dpadGlyph}>▶</Text>
          </Pressable>
        </View>
        <Pressable testID="move-down" onPress={() => move("down")} style={styles.dpadButton}>
          <Text style={styles.dpadGlyph}>▼</Text>
        </Pressable>
      </View>
      )}

      <Pressable
        testID="toggle-control-mode"
        onPress={() => setControlMode(controlMode === "joystick" ? "dpad" : "joystick")}
        style={({ pressed }) => [styles.controlToggle, pressed && styles.drawerItemPressed]}
      >
        <Text style={styles.controlToggleText}>
          {controlMode === "joystick" ? "Switch to D-pad" : "Switch to joystick"}
        </Text>
      </Pressable>


    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 24,
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  gridWrap: {
    marginTop: 8,
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.border,
  },
  grid: {
    position: "relative",
  },
  row: {
    flexDirection: "row",
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    // No border: tiles are drawn art now, and a per-tile outline would grid the world up.
    alignItems: "center",
    justifyContent: "center",
  },
  biomeGlyph: {
    fontSize: 16,
    opacity: 0.75,
  },
  healGlyph: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },
  entranceGlyph: {
    fontSize: 16,
    opacity: 0.85,
  },
  encounterFlash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
  },
  avatar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGlyph: {
    fontSize: 22,
    color: colors.accent,
    textShadowColor: "#000",
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 1 },
  },
  message: {
    color: colors.danger,
    fontSize: 12,
    minHeight: 16,
    textAlign: "center",
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
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dpadSpacer: {
    width: 52,
    height: 52,
  },
  healGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#7ddba0",
  },
  /** Anything standing on the map — trainers, the follower — is absolutely placed in grid space. */
  entity: {
    position: "absolute",
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  follower: {
    position: "absolute",
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: "center",
    justifyContent: "center",
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
  joystickWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  controlToggle: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  controlToggleText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  dpadGlyph: {
    fontSize: 20,
    color: colors.text,
  },
});
