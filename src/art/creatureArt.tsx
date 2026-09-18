import type { ReactNode } from "react";
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from "react-native-svg";
import { shade } from "../screens/theme";

/**
 * Creature art is *composed*, not hand-drawn per species: a body archetype supplies the
 * silhouette, then crest/tail/pattern/prop layers differentiate species that share one.
 * That keeps ~40 creatures visually distinct without 40 bespoke illustrations, and means a
 * new creature is a few lines of data (see creatureDesigns.ts) rather than new art.
 *
 * Everything is drawn in a 0..100 box and scaled by the <Svg> viewBox, so a sprite is
 * resolution-independent — the same design renders as a 28px party row icon or a 140px
 * battle sprite.
 */

export type BodyArchetype =
  | "quadruped"
  | "feline"
  | "biped"
  | "serpent"
  | "avian"
  | "golem"
  | "blob"
  | "mollusc"
  | "insect"
  | "aquatic"
  | "vessel";

export type CrestKind = "none" | "horn" | "twinhorn" | "plume" | "fin" | "ears" | "antennae";
export type TailKind = "none" | "stub" | "long" | "leaf" | "flame" | "fan";
export type PatternKind = "none" | "spots" | "stripes" | "plates" | "mosaic" | "waves";
export type EyeKind = "round" | "sleepy" | "fierce" | "wide" | "glow";

export type PropKind =
  | "none"
  | "megalith"
  | "spiralShell"
  | "eyeOfOsiris"
  | "laurel"
  | "amphora"
  | "mosaicCrown"
  | "knightHelm"
  | "malteseCross"
  | "crescent"
  | "turban"
  | "cannon"
  | "sail"
  | "propeller"
  | "lantern"
  | "honeycomb"
  | "citrus"
  | "waterwheel";

export interface CreatureDesign {
  body: BodyArchetype;
  primary: string;
  secondary?: string;
  crest?: CrestKind;
  tail?: TailKind;
  pattern?: PatternKind;
  eyes?: EyeKind;
  prop?: PropKind;
  propColor?: string;
}

const OUTLINE = "#2b3a44";
const STROKE = 2.6;

interface Ctx {
  base: string;
  dark: string;
  light: string;
  belly: string;
  accent: string;
}

function ctxFor(design: CreatureDesign): Ctx {
  const base = design.primary;
  return {
    base,
    dark: shade(base, 0.76),
    light: shade(base, 1.18),
    belly: design.secondary ?? shade(base, 1.3),
    accent: design.secondary ?? shade(base, 0.62),
  };
}

/** Contact shadow — sells "standing on ground" more than any amount of body detail. */
function groundShadow(cy = 93, rx = 30) {
  return <Ellipse cx={50} cy={cy} rx={rx} ry={5} fill="rgba(35,60,45,0.22)" />;
}

function eyes(kind: EyeKind, cx: number, cy: number, r: number, spread: number) {
  const glow = kind === "glow";
  const pupilFill = glow ? "#ffe9a8" : OUTLINE;
  const scleraFill = glow ? "#ff9d3d" : "#ffffff";
  const left = cx - spread;
  const right = cx + spread;

  if (kind === "sleepy") {
    return (
      <G>
        <Path d={`M${left - r} ${cy} q${r} ${r * 0.9} ${r * 2} 0`} stroke={OUTLINE} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        <Path d={`M${right - r} ${cy} q${r} ${r * 0.9} ${r * 2} 0`} stroke={OUTLINE} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      </G>
    );
  }

  const ry = kind === "fierce" ? r * 0.72 : r;
  return (
    <G>
      <Ellipse cx={left} cy={cy} rx={r} ry={ry} fill={scleraFill} stroke={OUTLINE} strokeWidth={1.6} />
      <Ellipse cx={right} cy={cy} rx={r} ry={ry} fill={scleraFill} stroke={OUTLINE} strokeWidth={1.6} />
      <Circle cx={left} cy={cy + (kind === "fierce" ? 0.6 : 0)} r={r * 0.5} fill={pupilFill} />
      <Circle cx={right} cy={cy + (kind === "fierce" ? 0.6 : 0)} r={r * 0.5} fill={pupilFill} />
      <Circle cx={left - r * 0.22} cy={cy - r * 0.3} r={r * 0.19} fill="#ffffff" />
      <Circle cx={right - r * 0.22} cy={cy - r * 0.3} r={r * 0.19} fill="#ffffff" />
      {kind === "fierce" && (
        <G>
          <Path d={`M${left - r * 1.2} ${cy - r * 1.3} l${r * 2.1} ${r * 0.7}`} stroke={OUTLINE} strokeWidth={2.6} strokeLinecap="round" />
          <Path d={`M${right + r * 1.2} ${cy - r * 1.3} l${-r * 2.1} ${r * 0.7}`} stroke={OUTLINE} strokeWidth={2.6} strokeLinecap="round" />
        </G>
      )}
    </G>
  );
}

function crestLayer(kind: CrestKind, c: Ctx, x: number, y: number) {
  switch (kind) {
    case "horn":
      return <Polygon points={`${x},${y - 16} ${x - 6},${y + 2} ${x + 6},${y + 2}`} fill={c.belly} stroke={OUTLINE} strokeWidth={STROKE} />;
    case "twinhorn":
      return (
        <G>
          <Polygon points={`${x - 11},${y - 14} ${x - 16},${y + 3} ${x - 4},${y + 1}`} fill={c.belly} stroke={OUTLINE} strokeWidth={STROKE} />
          <Polygon points={`${x + 11},${y - 14} ${x + 16},${y + 3} ${x + 4},${y + 1}`} fill={c.belly} stroke={OUTLINE} strokeWidth={STROKE} />
        </G>
      );
    case "ears":
      return (
        <G>
          <Polygon points={`${x - 14},${y - 4} ${x - 18},${y - 20} ${x - 4},${y - 10}`} fill={c.base} stroke={OUTLINE} strokeWidth={STROKE} />
          <Polygon points={`${x + 14},${y - 4} ${x + 18},${y - 20} ${x + 4},${y - 10}`} fill={c.base} stroke={OUTLINE} strokeWidth={STROKE} />
        </G>
      );
    case "plume":
      return (
        <G>
          <Path d={`M${x} ${y - 2} q-4 -18 6 -24 q2 14 -2 24 z`} fill={c.accent} stroke={OUTLINE} strokeWidth={2.2} />
          <Path d={`M${x - 7} ${y} q-5 -15 2 -21 q3 12 1 21 z`} fill={c.belly} stroke={OUTLINE} strokeWidth={2.2} />
        </G>
      );
    case "fin":
      return <Path d={`M${x - 12} ${y} q12 -20 24 0 z`} fill={c.accent} stroke={OUTLINE} strokeWidth={STROKE} />;
    case "antennae":
      return (
        <G>
          <Path d={`M${x - 6} ${y - 2} q-6 -12 -13 -15`} stroke={OUTLINE} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d={`M${x + 6} ${y - 2} q6 -12 13 -15`} stroke={OUTLINE} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Circle cx={x - 19} cy={y - 17} r={3.4} fill={c.accent} stroke={OUTLINE} strokeWidth={1.8} />
          <Circle cx={x + 19} cy={y - 17} r={3.4} fill={c.accent} stroke={OUTLINE} strokeWidth={1.8} />
        </G>
      );
    default:
      return null;
  }
}

function tailLayer(kind: TailKind, c: Ctx, x: number, y: number) {
  switch (kind) {
    case "stub":
      return <Circle cx={x} cy={y} r={7} fill={c.base} stroke={OUTLINE} strokeWidth={STROKE} />;
    case "long":
      return <Path d={`M${x} ${y} q16 -4 18 -20 q1 -8 -5 -9`} stroke={OUTLINE} strokeWidth={7.5} fill="none" strokeLinecap="round" />;
    case "leaf":
      return (
        <G>
          <Path d={`M${x} ${y} q14 -2 20 -14`} stroke={OUTLINE} strokeWidth={5.5} fill="none" strokeLinecap="round" />
          <Path d={`M${x + 18} ${y - 13} q12 -12 2 -20 q-14 6 -2 20 z`} fill={c.belly} stroke={OUTLINE} strokeWidth={2.2} />
        </G>
      );
    case "flame":
      return (
        <G>
          <Path d={`M${x} ${y} q14 -2 19 -15`} stroke={OUTLINE} strokeWidth={6} fill="none" strokeLinecap="round" />
          <Path d={`M${x + 19} ${y - 14} q10 -10 3 -19 q-3 6 -9 6 q6 8 6 13 z`} fill="#f7a83c" stroke={OUTLINE} strokeWidth={2.2} />
        </G>
      );
    case "fan":
      return (
        <G>
          <Path d={`M${x} ${y - 4} q18 -10 24 -2 q-10 10 -24 8 z`} fill={c.accent} stroke={OUTLINE} strokeWidth={2.3} />
          <Path d={`M${x + 4} ${y - 2} q12 -4 18 0`} stroke={OUTLINE} strokeWidth={1.4} fill="none" opacity={0.5} />
        </G>
      );
    default:
      return null;
  }
}

/** Markings are clipped visually by sitting inside the body mass, not by a real clip path. */
function patternLayer(kind: PatternKind, c: Ctx, cx: number, cy: number) {
  switch (kind) {
    case "spots":
      return (
        <G opacity={0.55}>
          <Circle cx={cx + 6} cy={cy - 8} r={5} fill={c.accent} />
          <Circle cx={cx + 16} cy={cy + 3} r={3.6} fill={c.accent} />
          <Circle cx={cx - 3} cy={cy + 6} r={4.2} fill={c.accent} />
        </G>
      );
    case "stripes":
      return (
        <G opacity={0.5} stroke={c.accent} strokeWidth={4} strokeLinecap="round">
          <Path d={`M${cx - 6} ${cy - 13} q4 12 0 24`} fill="none" />
          <Path d={`M${cx + 6} ${cy - 14} q4 13 0 26`} fill="none" />
          <Path d={`M${cx + 18} ${cy - 11} q3 10 0 20`} fill="none" />
        </G>
      );
    case "plates":
      return (
        <G opacity={0.6} fill="none" stroke={c.accent} strokeWidth={2.4}>
          <Path d={`M${cx - 14} ${cy - 4} h30`} />
          <Path d={`M${cx - 12} ${cy + 6} h26`} />
          <Path d={`M${cx - 8} ${cy - 14} h20`} />
        </G>
      );
    case "mosaic":
      return (
        <G opacity={0.75}>
          {[-12, -2, 8, 18].map((dx, i) =>
            [-10, 0, 10].map((dy, j) => (
              <Rect
                key={`${i}-${j}`}
                x={cx + dx}
                y={cy + dy}
                width={7}
                height={7}
                rx={1.2}
                fill={(i + j) % 2 === 0 ? c.accent : c.belly}
                opacity={(i * 3 + j) % 4 === 0 ? 0.35 : 0.85}
              />
            ))
          )}
        </G>
      );
    case "waves":
      return (
        <G opacity={0.5} stroke={c.accent} strokeWidth={2.6} fill="none" strokeLinecap="round">
          <Path d={`M${cx - 16} ${cy - 4} q8 -6 16 0 q8 6 16 0`} />
          <Path d={`M${cx - 16} ${cy + 7} q8 -6 16 0 q8 6 16 0`} />
        </G>
      );
    default:
      return null;
  }
}

function propLayer(kind: PropKind, color: string): ReactNode {
  const dark = shade(color, 0.72);
  switch (kind) {
    /** Neolithic trilithon — two uprights and a lintel, the Ġgantija/Ħaġar Qim signature. */
    case "megalith":
      return (
        <G>
          <Rect x={22} y={6} width={9} height={18} rx={2} fill={color} stroke={OUTLINE} strokeWidth={2.2} />
          <Rect x={69} y={6} width={9} height={18} rx={2} fill={color} stroke={OUTLINE} strokeWidth={2.2} />
          <Rect x={17} y={0} width={66} height={9} rx={2.5} fill={dark} stroke={OUTLINE} strokeWidth={2.2} />
        </G>
      );
    /** Murex shell — the sea snail the Phoenicians boiled for imperial purple. */
    case "spiralShell":
      return (
        <G>
          <Path
            d="M50 4 q16 2 18 16 q2 13 -12 15 q-11 2 -12 -8 q-1 -8 8 -8 q6 0 5 5"
            fill={color}
            stroke={OUTLINE}
            strokeWidth={2.4}
          />
          <Path d="M40 12 q-8 6 -6 14" stroke={OUTLINE} strokeWidth={2} fill="none" strokeLinecap="round" />
        </G>
      );
    /** The eye painted on every luzzu prow, carried over from Phoenician ships. */
    case "eyeOfOsiris":
      return (
        <G>
          <Path d="M32 16 q18 -13 36 0 q-18 13 -36 0 z" fill="#ffffff" stroke={OUTLINE} strokeWidth={2.4} />
          <Circle cx={50} cy={16} r={6} fill={color} stroke={OUTLINE} strokeWidth={1.8} />
          <Circle cx={50} cy={16} r={2.4} fill={OUTLINE} />
          <Path d="M68 18 q7 4 8 11" stroke={OUTLINE} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </G>
      );
    case "laurel":
      return (
        <G stroke={OUTLINE} strokeWidth={1.8}>
          <Path d="M26 22 q-6 -18 10 -22" fill="none" />
          <Path d="M74 22 q6 -18 -10 -22" fill="none" />
          {[0, 1, 2, 3].map((i) => (
            <G key={i}>
              <Ellipse cx={27 + i * 2.5} cy={17 - i * 5} rx={4.6} ry={2.8} fill={color} transform={`rotate(-35 ${27 + i * 2.5} ${17 - i * 5})`} />
              <Ellipse cx={73 - i * 2.5} cy={17 - i * 5} rx={4.6} ry={2.8} fill={color} transform={`rotate(35 ${73 - i * 2.5} ${17 - i * 5})`} />
            </G>
          ))}
        </G>
      );
    case "amphora":
      return (
        <G>
          <Path d="M42 26 q-10 -10 -2 -18 h20 q8 8 -2 18 z" fill={color} stroke={OUTLINE} strokeWidth={2.4} />
          <Rect x={46} y={0} width={8} height={9} rx={2} fill={dark} stroke={OUTLINE} strokeWidth={2} />
          <Path d="M40 10 q-7 3 -3 9" stroke={OUTLINE} strokeWidth={2.2} fill="none" />
          <Path d="M60 10 q7 3 3 9" stroke={OUTLINE} strokeWidth={2.2} fill="none" />
        </G>
      );
    case "mosaicCrown":
      return (
        <G>
          {[-18, -6, 6, 18].map((dx, i) => (
            <Rect key={i} x={50 + dx - 5} y={6 + (i % 2) * 4} width={10} height={10} rx={1.5} fill={i % 2 ? dark : color} stroke={OUTLINE} strokeWidth={1.8} />
          ))}
        </G>
      );
    /** Knight's close helm with slit visor. */
    case "knightHelm":
      return (
        <G>
          <Path d="M30 26 q0 -24 20 -24 q20 0 20 24 z" fill={color} stroke={OUTLINE} strokeWidth={2.5} />
          <Rect x={34} y={14} width={32} height={4.5} rx={2} fill={OUTLINE} />
          <Path d="M50 2 q3 12 0 24" stroke={dark} strokeWidth={2.4} fill="none" />
          <Path d="M50 2 q-7 -8 -14 -6 q8 3 10 8" fill="#e05252" stroke={OUTLINE} strokeWidth={1.8} />
        </G>
      );
    case "malteseCross":
      return (
        <G>
          <Path
            d="M50 4 l7 9 l-7 6 l-7 -6 z M50 30 l7 -9 l-7 -6 l-7 6 z M37 17 l9 -7 l6 7 l-6 7 z M63 17 l-9 -7 l-6 7 l6 7 z"
            fill={color}
            stroke={OUTLINE}
            strokeWidth={1.8}
          />
        </G>
      );
    case "crescent":
      return (
        <G>
          <Path d="M58 4 a13 13 0 1 0 0 24 a10 10 0 1 1 0 -24 z" fill={color} stroke={OUTLINE} strokeWidth={2.3} />
        </G>
      );
    case "turban":
      return (
        <G>
          <Path d="M28 24 q2 -20 22 -20 q20 0 22 20 z" fill={color} stroke={OUTLINE} strokeWidth={2.4} />
          <Path d="M29 18 q21 -8 42 0" stroke={dark} strokeWidth={3} fill="none" />
          <Path d="M30 12 q20 -9 40 0" stroke={dark} strokeWidth={2.6} fill="none" opacity={0.7} />
        </G>
      );
    case "cannon":
      return (
        <G>
          <Rect x={24} y={10} width={52} height={13} rx={6} fill={color} stroke={OUTLINE} strokeWidth={2.4} />
          <Circle cx={24} cy={16.5} r={8} fill={dark} stroke={OUTLINE} strokeWidth={2.2} />
          <Circle cx={78} cy={16.5} r={4} fill={OUTLINE} opacity={0.75} />
        </G>
      );
    /** Lateen sail — the rig on everything from Punic traders to the Knights' galleys. */
    case "sail":
      return (
        <G>
          <Path d="M50 0 l0 28" stroke={OUTLINE} strokeWidth={3} strokeLinecap="round" />
          <Path d="M50 2 q22 10 18 24 l-18 0 z" fill={color} stroke={OUTLINE} strokeWidth={2.3} />
          <Path d="M50 6 q-16 8 -13 20 l13 0 z" fill={dark} stroke={OUTLINE} strokeWidth={2.1} />
        </G>
      );
    case "propeller":
      return (
        <G>
          <Ellipse cx={50} cy={16} rx={5} ry={5} fill={dark} stroke={OUTLINE} strokeWidth={2} />
          <Path d="M50 16 q-22 -12 -26 -2 q6 8 26 2 z" fill={color} stroke={OUTLINE} strokeWidth={2} />
          <Path d="M50 16 q22 12 26 2 q-6 -8 -26 -2 z" fill={color} stroke={OUTLINE} strokeWidth={2} />
        </G>
      );
    case "lantern":
      return (
        <G>
          <Path d="M44 8 h12 l3 16 h-18 z" fill={color} stroke={OUTLINE} strokeWidth={2.2} />
          <Rect x={46} y={2} width={8} height={5} rx={1.6} fill={dark} stroke={OUTLINE} strokeWidth={1.8} />
          <Circle cx={50} cy={16} r={3.6} fill="#ffe9a8" opacity={0.95} />
        </G>
      );
    /** Malta = Melita = honey; the endemic bee is as old a symbol as the temples. */
    case "honeycomb":
      return (
        <G>
          {[[42, 6], [58, 6], [50, 18]].map(([hx, hy], i) => (
            <Polygon
              key={i}
              points={`${hx},${hy - 7} ${hx + 6},${hy - 3.5} ${hx + 6},${hy + 3.5} ${hx},${hy + 7} ${hx - 6},${hy + 3.5} ${hx - 6},${hy - 3.5}`}
              fill={color}
              stroke={OUTLINE}
              strokeWidth={1.9}
            />
          ))}
        </G>
      );
    case "citrus":
      return (
        <G>
          <Circle cx={50} cy={15} r={11} fill={color} stroke={OUTLINE} strokeWidth={2.3} />
          <Path d="M50 15 l0 -11 M50 15 l9.5 5.5 M50 15 l-9.5 5.5" stroke={dark} strokeWidth={1.8} />
          <Path d="M52 4 q9 -6 14 0 q-8 5 -14 0 z" fill="#5fbb56" stroke={OUTLINE} strokeWidth={1.8} />
        </G>
      );
    case "waterwheel":
      return (
        <G>
          <Circle cx={50} cy={15} r={13} fill="none" stroke={OUTLINE} strokeWidth={2.5} />
          <Circle cx={50} cy={15} r={4} fill={color} stroke={OUTLINE} strokeWidth={2} />
          {[0, 45, 90, 135].map((a) => (
            <Path key={a} d={`M50 15 l${13 * Math.cos((a * Math.PI) / 180)} ${13 * Math.sin((a * Math.PI) / 180)}`} stroke={OUTLINE} strokeWidth={2} />
          ))}
          {[0, 45, 90, 135].map((a) => (
            <Path key={`n${a}`} d={`M50 15 l${-13 * Math.cos((a * Math.PI) / 180)} ${-13 * Math.sin((a * Math.PI) / 180)}`} stroke={OUTLINE} strokeWidth={2} />
          ))}
        </G>
      );
    default:
      return null;
  }
}

function bodyLayer(design: CreatureDesign, c: Ctx): ReactNode {
  const eye = design.eyes ?? "round";
  const crest = design.crest ?? "none";
  const tail = design.tail ?? "none";
  const pattern = design.pattern ?? "none";

  switch (design.body) {
    case "quadruped":
      return (
        <G>
          {groundShadow()}
          {tailLayer(tail, c, 74, 60)}
          {[30, 44, 60, 72].map((x, i) => (
            <Rect key={i} x={x} y={72} width={11} height={18} rx={5} fill={i % 2 ? c.dark : c.base} stroke={OUTLINE} strokeWidth={STROKE} />
          ))}
          <Ellipse cx={54} cy={60} rx={30} ry={22} fill={c.base} stroke={OUTLINE} strokeWidth={STROKE} />
          <Ellipse cx={56} cy={68} rx={22} ry={12} fill={c.belly} opacity={0.75} />
          {patternLayer(pattern, c, 54, 56)}
          <Circle cx={27} cy={44} r={20} fill={c.light} stroke={OUTLINE} strokeWidth={STROKE} />
          {crestLayer(crest, c, 27, 30)}
          {eyes(eye, 25, 43, 4.6, 8)}
          <Ellipse cx={17} cy={52} rx={5} ry={3.6} fill={c.dark} stroke={OUTLINE} strokeWidth={1.8} />
        </G>
      );

    case "feline":
      return (
        <G>
          {groundShadow()}
          {tailLayer(tail === "none" ? "long" : tail, c, 76, 58)}
          {[32, 46, 62, 74].map((x, i) => (
            <Rect key={i} x={x} y={74} width={9} height={16} rx={4.5} fill={i % 2 ? c.dark : c.base} stroke={OUTLINE} strokeWidth={STROKE} />
          ))}
          <Ellipse cx={55} cy={62} rx={28} ry={18} fill={c.base} stroke={OUTLINE} strokeWidth={STROKE} />
          {patternLayer(pattern, c, 55, 58)}
          <Circle cx={28} cy={45} r={18} fill={c.light} stroke={OUTLINE} strokeWidth={STROKE} />
          {crestLayer(crest === "none" ? "ears" : crest, c, 28, 32)}
          {eyes(eye === "round" ? "fierce" : eye, 26, 45, 4.4, 7.5)}
          <Path d="M22 53 q4 3 8 0" stroke={OUTLINE} strokeWidth={2} fill="none" strokeLinecap="round" />
        </G>
      );

    case "biped":
      return (
        <G>
          {groundShadow(94, 26)}
          {tailLayer(tail, c, 72, 70)}
          <Ellipse cx={38} cy={88} rx={11} ry={6} fill={c.dark} stroke={OUTLINE} strokeWidth={STROKE} />
          <Ellipse cx={62} cy={88} rx={11} ry={6} fill={c.dark} stroke={OUTLINE} strokeWidth={STROKE} />
          <Ellipse cx={50} cy={62} rx={25} ry={26} fill={c.base} stroke={OUTLINE} strokeWidth={STROKE} />
          <Ellipse cx={50} cy={68} rx={16} ry={17} fill={c.belly} opacity={0.8} />
          {patternLayer(pattern, c, 50, 60)}
          <Ellipse cx={24} cy={60} rx={7} ry={12} fill={c.base} stroke={OUTLINE} strokeWidth={STROKE} transform="rotate(18 24 60)" />
          <Ellipse cx={76} cy={60} rx={7} ry={12} fill={c.base} stroke={OUTLINE} strokeWidth={STROKE} transform="rotate(-18 76 60)" />
          <Circle cx={50} cy={32} r={20} fill={c.light} stroke={OUTLINE} strokeWidth={STROKE} />
          {crestLayer(crest, c, 50, 18)}
          {eyes(eye, 50, 32, 4.8, 9)}
        </G>
      );

    case "serpent":
      return (
        <G>
          {groundShadow(92, 26)}
          <Path
            d="M30 88 q-10 -16 8 -22 q20 -6 24 -18 q4 -13 -10 -16"
            stroke={OUTLINE}
            strokeWidth={22}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M30 88 q-10 -16 8 -22 q20 -6 24 -18 q4 -13 -10 -16"
            stroke={c.base}
            strokeWidth={17}
            fill="none"
            strokeLinecap="round"
          />
          <Path d="M30 88 q-10 -16 8 -22" stroke={c.belly} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.7} />
          <Circle cx={50} cy={28} r={17} fill={c.light} stroke={OUTLINE} strokeWidth={STROKE} />
          {crestLayer(crest, c, 50, 16)}
          {eyes(eye === "round" ? "fierce" : eye, 50, 27, 4.2, 7.5)}
          <Path d="M50 37 q0 6 6 7" stroke="#e05252" strokeWidth={2.2} fill="none" strokeLinecap="round" />
        </G>
      );

    case "avian":
      return (
        <G>
          {groundShadow(94, 22)}
          <Path d="M44 84 l0 8 M56 84 l0 8" stroke={OUTLINE} strokeWidth={3.4} strokeLinecap="round" />
          {tailLayer(tail === "none" ? "fan" : tail, c, 66, 66)}
          <Ellipse cx={50} cy={62} rx={24} ry={25} fill={c.base} stroke={OUTLINE} strokeWidth={STROKE} />
          <Ellipse cx={50} cy={68} rx={15} ry={16} fill={c.belly} opacity={0.85} />
          <Path d="M27 54 q-14 14 -2 28 q10 -6 12 -20 z" fill={c.dark} stroke={OUTLINE} strokeWidth={STROKE} />
          <Path d="M73 54 q14 14 2 28 q-10 -6 -12 -20 z" fill={c.dark} stroke={OUTLINE} strokeWidth={STROKE} />
          {patternLayer(pattern, c, 50, 60)}
          <Circle cx={50} cy={32} r={18} fill={c.light} stroke={OUTLINE} strokeWidth={STROKE} />
          {crestLayer(crest, c, 50, 18)}
          {eyes(eye, 50, 30, 4.4, 8)}
          <Polygon points="50,38 42,44 58,44" fill="#f3b23c" stroke={OUTLINE} strokeWidth={2} />
        </G>
      );

    /** Stacked stone — reads as a walking megalith rather than an animal. */
    case "golem":
      return (
        <G>
          {groundShadow(94, 30)}
          <Rect x={28} y={84} width={16} height={9} rx={2} fill={c.dark} stroke={OUTLINE} strokeWidth={STROKE} />
          <Rect x={56} y={84} width={16} height={9} rx={2} fill={c.dark} stroke={OUTLINE} strokeWidth={STROKE} />
          <Rect x={22} y={56} width={56} height={30} rx={4} fill={c.base} stroke={OUTLINE} strokeWidth={STROKE} />
          <Rect x={14} y={60} width={12} height={22} rx={3} fill={c.dark} stroke={OUTLINE} strokeWidth={STROKE} />
          <Rect x={74} y={60} width={12} height={22} rx={3} fill={c.dark} stroke={OUTLINE} strokeWidth={STROKE} />
          {patternLayer(pattern === "none" ? "plates" : pattern, c, 50, 66)}
          <Rect x={30} y={26} width={40} height={32} rx={4} fill={c.light} stroke={OUTLINE} strokeWidth={STROKE} />
          <Path d="M34 40 l8 -6 M62 36 l5 6" stroke={c.accent} strokeWidth={2} opacity={0.6} />
          {crestLayer(crest, c, 50, 26)}
          {eyes(eye === "round" ? "glow" : eye, 50, 42, 4.6, 9)}
        </G>
      );

    case "blob":
      return (
        <G>
          {groundShadow(92, 28)}
          <Path
            d="M20 76 q-4 -34 30 -36 q34 2 30 36 q-6 10 -30 10 q-24 0 -30 -10 z"
            fill={c.base}
            stroke={OUTLINE}
            strokeWidth={STROKE}
          />
          <Path d="M26 74 q10 8 24 8 q14 0 24 -8 q-6 10 -24 10 q-18 0 -24 -10 z" fill={c.belly} opacity={0.8} />
          {patternLayer(pattern, c, 50, 56)}
          {crestLayer(crest, c, 50, 42)}
          {eyes(eye, 50, 56, 5.4, 11)}
          <Path d="M44 70 q6 5 12 0" stroke={OUTLINE} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        </G>
      );

    /** Spiral shell plus soft body — the murex that made Phoenician purple. */
    case "mollusc":
      return (
        <G>
          {groundShadow(92, 28)}
          <Path d="M18 86 q-4 -14 14 -16 h40 q14 4 10 16 z" fill={c.belly} stroke={OUTLINE} strokeWidth={STROKE} />
          <Path
            d="M64 76 q26 -6 20 -30 q-6 -24 -30 -20 q-22 4 -18 22 q4 16 20 12 q12 -4 8 -14 q-4 -8 -12 -4"
            fill={c.base}
            stroke={OUTLINE}
            strokeWidth={STROKE}
          />
          <Path d="M50 30 q10 4 10 14" stroke={c.accent} strokeWidth={2.4} fill="none" opacity={0.7} />
          <Path d="M26 66 l-8 -18 M34 64 l-2 -20" stroke={OUTLINE} strokeWidth={2.4} strokeLinecap="round" />
          <Circle cx={18} cy={46} r={4.6} fill="#ffffff" stroke={OUTLINE} strokeWidth={1.8} />
          <Circle cx={32} cy={43} r={4.6} fill="#ffffff" stroke={OUTLINE} strokeWidth={1.8} />
          <Circle cx={18} cy={46} r={2.2} fill={OUTLINE} />
          <Circle cx={32} cy={43} r={2.2} fill={OUTLINE} />
        </G>
      );

    case "insect":
      return (
        <G>
          {groundShadow(92, 24)}
          <Path d="M36 78 l-10 10 M64 78 l10 10 M32 68 l-14 6 M68 68 l14 6" stroke={OUTLINE} strokeWidth={2.8} strokeLinecap="round" />
          <Ellipse cx={50} cy={68} rx={24} ry={20} fill={c.base} stroke={OUTLINE} strokeWidth={STROKE} />
          <Path d="M28 62 q22 -6 44 0 M29 72 q21 6 42 0" stroke={c.accent} strokeWidth={4} fill="none" opacity={0.75} />
          <Ellipse cx={28} cy={50} rx={17} ry={13} fill={c.light} stroke={OUTLINE} strokeWidth={STROKE} transform="rotate(-14 28 50)" />
          <Ellipse cx={72} cy={50} rx={17} ry={13} fill={c.light} stroke={OUTLINE} strokeWidth={STROKE} transform="rotate(14 72 50)" opacity={0.92} />
          <Circle cx={50} cy={36} r={16} fill={c.light} stroke={OUTLINE} strokeWidth={STROKE} />
          {crestLayer(crest === "none" ? "antennae" : crest, c, 50, 24)}
          {eyes(eye, 50, 36, 4.6, 8)}
        </G>
      );

    case "aquatic":
      return (
        <G>
          {groundShadow(92, 26)}
          <Path d="M78 62 q18 -14 16 4 q-2 18 -16 4 z" fill={c.accent} stroke={OUTLINE} strokeWidth={STROKE} />
          <Ellipse cx={48} cy={62} rx={32} ry={22} fill={c.base} stroke={OUTLINE} strokeWidth={STROKE} />
          <Ellipse cx={46} cy={70} rx={22} ry={11} fill={c.belly} opacity={0.8} />
          {patternLayer(pattern === "none" ? "waves" : pattern, c, 48, 60)}
          <Path d="M44 40 q8 -16 18 -2 z" fill={c.accent} stroke={OUTLINE} strokeWidth={2.3} />
          <Path d="M36 74 q-8 12 4 12 q6 -2 6 -10" fill={c.dark} stroke={OUTLINE} strokeWidth={2.2} />
          {eyes(eye, 28, 58, 4.8, 0)}
          <Path d="M18 66 q6 4 11 1" stroke={OUTLINE} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        </G>
      );

    /**
     * A living luzzu: high pointed prow, painted hull bands, and the eye that every Maltese
     * boat carries on its bow. Drawn in profile so the silhouette reads as a boat, not a mask.
     */
    case "vessel":
      return (
        <G>
          {groundShadow(90, 32)}
          <Path d="M10 64 q40 -12 80 0 q-10 24 -40 24 q-30 0 -40 -24 z" fill={c.base} stroke={OUTLINE} strokeWidth={STROKE} />
          <Path d="M14 66 q36 -9 72 0 q-2 6 -4 8 q-32 -8 -64 0 z" fill={c.belly} opacity={0.9} />
          <Path d="M13 74 q37 -8 74 0" stroke={c.accent} strokeWidth={3.4} fill="none" opacity={0.85} />
          {/* Prow rising at the bow, the way a luzzu's stem post does. */}
          <Path d="M88 64 q10 -16 4 -26 q-10 8 -14 24 z" fill={c.dark} stroke={OUTLINE} strokeWidth={2.4} />
          <Path d="M12 64 q-8 -10 -3 -17 q9 5 12 16 z" fill={c.dark} stroke={OUTLINE} strokeWidth={2.4} />
          {patternLayer(pattern === "none" ? "none" : pattern, c, 50, 78)}
          {eyes(eye, 70, 70, 4.8, 0)}
        </G>
      );

    default:
      return null;
  }
}

export function CreatureArt({ design, size }: { design: CreatureDesign; size: number }) {
  const c = ctxFor(design);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {bodyLayer(design, c)}
      {design.prop && design.prop !== "none" ? propLayer(design.prop, design.propColor ?? c.accent) : null}
    </Svg>
  );
}
