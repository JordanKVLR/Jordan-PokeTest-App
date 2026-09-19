import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import type { TypeName } from "../../data/schemas";
import { HpBar } from "./HpBar";
import { TypeBadge } from "./TypeBadge";
import { CreatureAvatar } from "./CreatureAvatar";
import type { useCombatantAnimation } from "./useCombatantAnimation";
import { BattleBackdrop, BattlePlatform } from "../../art/battleArt";
import type { Biome } from "../../data/schemas";
import { colors, typeColor, typeIcon } from "../theme";

const STAGE_HEIGHT = 220;
const ENEMY_AVATAR_SIZE = 68;
const PLAYER_AVATAR_SIZE = 92;
const ENEMY_TOP = 18;
const ENEMY_RIGHT = 24;
const PLAYER_BOTTOM = 18;
const PLAYER_LEFT = 24;
/** Fallback before the stage's real width is measured via onLayout (first paint only). */
const FALLBACK_STAGE_WIDTH = 340;

/** Exported so BattleScreen can delay a hit's shake/flash/faint reaction until the projectile
 * visually lands, instead of reacting instantly while the projectile is still mid-flight. */
export const PROJECTILE_TRAVEL_MS = 360;
/** Same idea for the ball-throw wobble reaction. */
export const BALL_TRAVEL_MS = 480;
const PROJECTILE_SIZE = 30;
const BALL_SIZE = 22;

export type ProjectileDirection = "toEnemy" | "toPlayer";

export interface BattleStageHandle {
  /** Animates a type-colored projectile from attacker to defender. */
  fireProjectile: (moveType: TypeName, direction: ProjectileDirection) => void;
  /** Animates a ball arcing from the player's position to the wild creature. */
  throwBall: () => void;
}

interface CombatantProps {
  speciesId: string;
  name: string;
  types: TypeName[];
  level: number;
  hp: number;
  maxHp: number;
  highlightCrux?: boolean;
  anim: ReturnType<typeof useCombatantAnimation>;
}

interface Props {
  enemy: CombatantProps;
  player: CombatantProps;
  /** Which landscape to fight in front of. Defaults to inland if a caller doesn't say. */
  biome?: Biome;
}

/**
 * A Pokemon-Yellow-style battle stage: the wild creature stands upper-right with its info box
 * upper-left, the player's creature stands lower-left (larger, "closer to camera") with its info
 * box lower-right. Elemental attacks fire a type-colored projectile between the two; a ball throw
 * arcs the same path. There's still no illustrated sprite art (see CreatureAvatar) — this is about
 * layout and motion reading like a real battle, not a sprite upgrade.
 */
export const BattleStage = forwardRef<BattleStageHandle, Props>(function BattleStage({ enemy, player, biome = "grass" }, ref) {
  const [stageWidth, setStageWidth] = useState(FALLBACK_STAGE_WIDTH);

  const [projectileType, setProjectileType] = useState<TypeName>("Normal");
  const [projectileDirection, setProjectileDirection] = useState<ProjectileDirection>("toEnemy");
  const projectileProgress = useRef(new Animated.Value(0)).current;
  const projectileOpacity = useRef(new Animated.Value(0)).current;

  const ballProgress = useRef(new Animated.Value(0)).current;
  const ballOpacity = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    fireProjectile(moveType, direction) {
      setProjectileType(moveType);
      setProjectileDirection(direction);
      projectileProgress.setValue(0);
      projectileOpacity.setValue(1);
      Animated.timing(projectileProgress, {
        toValue: 1,
        duration: PROJECTILE_TRAVEL_MS,
        useNativeDriver: false,
      }).start(() => projectileOpacity.setValue(0));
    },
    throwBall() {
      ballProgress.setValue(0);
      ballOpacity.setValue(1);
      Animated.timing(ballProgress, { toValue: 1, duration: BALL_TRAVEL_MS, useNativeDriver: false }).start(() =>
        ballOpacity.setValue(0)
      );
    },
  }));

  const enemyCenter = { x: stageWidth - ENEMY_RIGHT - ENEMY_AVATAR_SIZE / 2, y: ENEMY_TOP + ENEMY_AVATAR_SIZE / 2 };
  const playerCenter = {
    x: PLAYER_LEFT + PLAYER_AVATAR_SIZE / 2,
    y: STAGE_HEIGHT - PLAYER_BOTTOM - PLAYER_AVATAR_SIZE / 2,
  };
  const [fromPos, toPos] = projectileDirection === "toEnemy" ? [playerCenter, enemyCenter] : [enemyCenter, playerCenter];

  const projectileX = projectileProgress.interpolate({ inputRange: [0, 1], outputRange: [fromPos.x, toPos.x] });
  const projectileY = projectileProgress.interpolate({ inputRange: [0, 1], outputRange: [fromPos.y, toPos.y] });

  const ballStraightY = ballProgress.interpolate({ inputRange: [0, 1], outputRange: [playerCenter.y, enemyCenter.y] });
  const ballArc = ballProgress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -70, 0] });
  const ballX = ballProgress.interpolate({ inputRange: [0, 1], outputRange: [playerCenter.x, enemyCenter.x] });
  const ballSpin = ballProgress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "540deg"] });

  return (
    <View style={styles.stage} onLayout={(e) => setStageWidth(e.nativeEvent.layout.width)}>
      <BattleBackdrop biome={biome} width={stageWidth} height={STAGE_HEIGHT} />

      <View pointerEvents="none" style={[styles.platform, styles.enemyPlatform]}>
        <BattlePlatform size={ENEMY_AVATAR_SIZE * 1.5} biome={biome} />
      </View>
      <View pointerEvents="none" style={[styles.platform, styles.playerPlatform]}>
        <BattlePlatform size={PLAYER_AVATAR_SIZE * 1.45} biome={biome} />
      </View>

      <View style={[styles.infoBox, styles.enemyInfoBox]}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoName}>{enemy.name}</Text>
          <Text style={styles.infoLevel}>Lv. {enemy.level}</Text>
        </View>
        <View style={styles.badgeRow}>
          {enemy.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </View>
        <HpBar currentHp={enemy.hp} maxHp={enemy.maxHp} />
      </View>

      <View style={[styles.infoBox, styles.playerInfoBox, player.highlightCrux && styles.playerInfoBoxCrux]}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoName}>{player.name}</Text>
          <Text style={styles.infoLevel}>Lv. {player.level}</Text>
        </View>
        <View style={styles.badgeRow}>
          {player.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </View>
        <HpBar currentHp={player.hp} maxHp={player.maxHp} />
        {player.highlightCrux && <Text style={styles.cruxActiveLabel}>Crux Aura active</Text>}
      </View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.flashOverlay,
          styles.hitFlashOverlay,
          { top: ENEMY_TOP, right: ENEMY_RIGHT, width: ENEMY_AVATAR_SIZE, height: ENEMY_AVATAR_SIZE, opacity: enemy.anim.hitFlash },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.flashOverlay,
          styles.healFlashOverlay,
          { top: ENEMY_TOP, right: ENEMY_RIGHT, width: ENEMY_AVATAR_SIZE, height: ENEMY_AVATAR_SIZE, opacity: enemy.anim.healFlash },
        ]}
      />
      <Animated.View
        style={[
          styles.enemyAvatarWrap,
          {
            opacity: enemy.anim.opacity,
            transform: [{ translateX: enemy.anim.shakeX }, { scale: enemy.anim.scale }],
          },
        ]}
      >
        <CreatureAvatar speciesId={enemy.speciesId} types={enemy.types} size={ENEMY_AVATAR_SIZE} />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.flashOverlay,
          styles.hitFlashOverlay,
          {
            bottom: PLAYER_BOTTOM,
            left: PLAYER_LEFT,
            width: PLAYER_AVATAR_SIZE,
            height: PLAYER_AVATAR_SIZE,
            opacity: player.anim.hitFlash,
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.flashOverlay,
          styles.healFlashOverlay,
          {
            bottom: PLAYER_BOTTOM,
            left: PLAYER_LEFT,
            width: PLAYER_AVATAR_SIZE,
            height: PLAYER_AVATAR_SIZE,
            opacity: player.anim.healFlash,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.playerAvatarWrap,
          player.highlightCrux && styles.playerAvatarCruxRing,
          {
            opacity: player.anim.opacity,
            transform: [{ translateX: player.anim.shakeX }, { scale: player.anim.scale }],
          },
        ]}
      >
        <CreatureAvatar speciesId={player.speciesId} types={player.types} size={PLAYER_AVATAR_SIZE} />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.projectile,
          {
            backgroundColor: typeColor(projectileType),
            opacity: projectileOpacity,
            transform: [
              { translateX: Animated.subtract(projectileX, PROJECTILE_SIZE / 2) },
              { translateY: Animated.subtract(projectileY, PROJECTILE_SIZE / 2) },
            ],
          },
        ]}
      >
        <Text style={styles.projectileGlyph}>{typeIcon(projectileType)}</Text>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.ball,
          {
            opacity: ballOpacity,
            transform: [
              { translateX: Animated.subtract(ballX, BALL_SIZE / 2) },
              { translateY: Animated.add(Animated.subtract(ballStraightY, BALL_SIZE / 2), ballArc) },
              { rotate: ballSpin },
            ],
          },
        ]}
      >
        <Text style={styles.ballGlyph}>⚪</Text>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  stage: {
    height: STAGE_HEIGHT,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    position: "relative",
  },
  platform: {
    position: "absolute",
    alignItems: "center",
  },
  enemyPlatform: {
    top: ENEMY_TOP + ENEMY_AVATAR_SIZE - 14,
    right: ENEMY_RIGHT - ENEMY_AVATAR_SIZE * 0.25,
  },
  playerPlatform: {
    bottom: PLAYER_BOTTOM - 12,
    left: PLAYER_LEFT - PLAYER_AVATAR_SIZE * 0.22,
  },
  // Light plaques over a bright outdoor scene, sized to leave the sprites clear.
  infoBox: {
    position: "absolute",
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 9,
    paddingVertical: 7,
    gap: 3,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  enemyInfoBox: {
    top: 12,
    left: 12,
  },
  playerInfoBox: {
    bottom: 12,
    right: 12,
  },
  playerInfoBoxCrux: {
    borderColor: colors.accent,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  infoLevel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  badgeRow: {
    flexDirection: "row",
  },
  cruxActiveLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "600",
  },
  enemyAvatarWrap: {
    position: "absolute",
    top: ENEMY_TOP,
    right: ENEMY_RIGHT,
  },
  playerAvatarWrap: {
    position: "absolute",
    bottom: PLAYER_BOTTOM,
    left: PLAYER_LEFT,
  },
  playerAvatarCruxRing: {
    shadowColor: colors.accent,
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  flashOverlay: {
    position: "absolute",
    borderRadius: 999,
  },
  hitFlashOverlay: {
    backgroundColor: colors.danger,
  },
  healFlashOverlay: {
    backgroundColor: colors.success,
  },
  projectile: {
    position: "absolute",
    width: PROJECTILE_SIZE,
    height: PROJECTILE_SIZE,
    borderRadius: PROJECTILE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  projectileGlyph: {
    fontSize: 16,
  },
  ball: {
    position: "absolute",
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: "#e0e1dd",
    borderWidth: 2,
    borderColor: "#0d1b2a",
    alignItems: "center",
    justifyContent: "center",
  },
  ballGlyph: {
    fontSize: 10,
  },
});
