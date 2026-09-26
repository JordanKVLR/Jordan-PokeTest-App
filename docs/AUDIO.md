# Sound — A Maltese Tale

All music and sound effects are **synthesised live in the browser** with the Web Audio API.
There are no audio files: nothing to license, nothing to download, and the score lives in the
code next to everything else.

| File | What it is |
|---|---|
| `src/audio/notes.ts` | The score notation (`"A4:2 D3+F#3+A3:8 r:4"`), pitch maths, chord and arpeggio helpers |
| `src/audio/tracks.ts` | The soundtrack: 15 pieces written as scores |
| `src/audio/engine.ts` | Instruments, drums, reverb, the look-ahead sequencer, crossfades and jingles |
| `src/audio/sfx.ts` | Every sound effect: interface, overworld, battle, one attack sound per type |
| `src/audio/choose.ts` | Which piece plays where |
| `src/audio/AudioBridge.tsx` | Unlocks sound on the first touch, gives every button a click, follows the volume settings |
| `src/audio/useMusic.ts` | `useMusic("overworld")` — the music a screen wants while it's on top |

## The band

A small Mediterranean folk group, with brass and bells for the fanfares:

- **Guitar** — plucked string (Karplus–Strong), the għana accompaniment
- **Flute** — breathy, with vibrato that blooms after the attack
- **Reed** — accordion-like, two detuned voices with bellows tremolo
- **Żaqq** — the Maltese bagpipe: a nasal drone under the trainer and gym themes
- **Tanbur** — frame drum, open *dum* and rim *tek* strokes, with tambourine and shaker
- **Brass, bells, marimba, pad, bass, battle lead**

Every instrument is level-matched (measured in the browser) and tuned to within a few cents.

## The soundtrack

| Piece | Where | Character |
|---|---|---|
| A Maltese Tale | Title and new-game screens | D major, 84 bpm — guitar and flute, sunrise over Dingli |
| Island Roads | Land stages | G Mixolydian, 112 bpm, swung — accordion walking tune |
| Luzzu | Stages that open on water | A major in 6/8 — a painted boat rocking on the swell |
| Bastions | Gym stages | D minor march, brass over a żaqq drone |
| Clash in the Garigue | Wild battles | E Phrygian dominant, 148 bpm |
| The Challenge | Trainer battles | A harmonic minor with żaqq and tanbur, 156 bpm |
| Keeper of the Walls | Gym leader battles | The Challenge, faster, with brass and crashes |
| Something Stirs | Evolution | Glittering maj7 arpeggios |
| Every Road Walked | Beating every trainer | The title theme with the full band |
| Victory, Caught!, Level Up, The Medal, The Chapel, Lights Out | Jingles | Short pieces over (or ending) the music |

Jingles never cut each other off: a level-up arriving mid-fanfare waits its turn.

## Sound effects

Interface taps come from one listener on the page, so every button has a sound without asking
for one. Disabled buttons buzz softly, back/close buttons drop in pitch, toggles chime. The map
has footsteps, a bump for walking into trees, an encounter sting, a trainer "spotted" call and a
bell phrase on reaching a new stage. In battle, each of the 18 types has its own attack sound;
hits vary with effectiveness and crits; misses whoosh; faints fall away; stat changes arpeggiate
up or down; and a catch plays out throw → snap shut → wobbles → click (or burst free).

## Settings and the Music Room

Settings → Sound has Music and Sound effects volumes (Off / Low / Medium / High) and the
**Music room**, which plays any piece on demand.

## Adding or changing music

Write parts in the notation from `notes.ts`; `src/audio/__tests__/score.test.ts` checks that
every part in a looping piece is the same length (so loops never drift), that drum lines fit, and
that everything parses. In the browser console, `__maltaAudio.nowPlaying()` shows what's on and
`__maltaSfx.battle.attack("Fire", "special", true)` plays any effect.

**Phones:** on an iPhone, Web Audio follows the silent switch — if the game is quiet, check it.
