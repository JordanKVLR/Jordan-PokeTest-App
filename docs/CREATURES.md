# Creature Roster — Chivalry & Antiquity

**106 species.** Generated from `src/data/starters.json`,
`wildCreatures.json`, `regionalVariants.json` and `legendaries.json`; the rules below are
enforced by `src/data/__tests__/roster.test.ts`, so this table cannot drift from the game
without a test going red.

Every creature sits in an evolution line — there are no single-stage dead ends. Every creature
carries one or two types, never three, and never two that contradict each other (see
`src/data/typeCompatibility.ts`). All 18 types are represented.

**Base** forms are single-typed and gain their second type on evolving. **BST** is the base
stat total.

---

## Starters (9)

Three lines of three. You pick one at the start of the run.

| Line | Stage 1 | → | Stage 2 | → | Stage 3 |
|------|---------|---|---------|---|---------|
| Grass | **Calfleaf** (Grass) | Lv. 16 | **Vinehorn** (Grass) | Lv. 36 | **Moss-taur** (Grass / Ground) |
| Fire | **Pharawoof** (Fire) | Lv. 17 | **Infernux** (Fire / Psychic) | Lv. 34 | **Pyrollis** (Fire / Psychic) |
| Water | **Duckling** (Water) | Lv. 15 | **Platyflow** (Water) | Lv. 33 | **Marinedge** (Water / Steel) |

---

## Wild creatures (85)

Grouped by the layer of Maltese history they draw on.

### Native fauna (38)

| Creature | Types | Biome | BST | Evolves | Becomes |
|---|---|---|---|---|---|
| Fossary | Bug | grass | 415 | Lv. 22 | Garrigarn |
| Garrigarn | Bug / Grass | grass | 553 | — | — |
| Qortong | Rock | rock | 335 | Lv. 24 | Qortagħan |
| Qortagħan | Rock / Ground | rock | 447 | — | — |
| Xrobbog | Rock | rock | 380 | Lv. 26 | Xrobbraxx |
| Xrobbraxx | Rock / Dark | rock | 508 | — | — |
| Bulqajra | Fighting | rock | 400 | Lv. 25 | Bulqajrun |
| Bulqajrun | Fighting / Rock | rock | 535 | — | — |
| Luzzitt | Water | water | 365 | Lv. 20 | Luzzarju |
| Luzzarju | Water / Flying | water | 487 | — | — |
| Marsupp | Water | water | 375 | Lv. 23 | Marsuppjun |
| Marsuppjun | Water / Poison | water | 501 | — | — |
| Kalanka | Water | water | 405 | Lv. 27 | Kalankros |
| Kalankros | Water / Rock | water | 542 | — | — |
| Vurjenn | Flying | water | 415 | Lv. 21 | Vurjenzu |
| Vurjenzu | Flying / Water | water | 552 | — | — |
| Ondallus | Water | water | 495 | Lv. 35 | Ondraguna |
| Ondraguna | Water / Dragon | water | 661 | — | — |
| Ramliet | Ground | sand | 340 | Lv. 22 | Ramlietan |
| Ramlietan | Ground / Rock | sand | 453 | — | — |
| Xemxun | Fire | sand | 390 | Lv. 26 | Xemxarju |
| Xemxarju | Fire / Ground | sand | 520 | — | — |
| Dunkorr | Ground | sand | 390 | Lv. 28 | Dunkorrax |
| Dunkorrax | Ground / Steel | sand | 523 | — | — |
| Sirokk | Flying | sand | 415 | Lv. 24 | Sirokkjun |
| Sirokkjun | Flying / Dark | sand | 552 | — | — |
| Ossijan | Ground | sand | 420 | Lv. 29 | Ossijark |
| Ossijark | Ground / Ghost | sand | 560 | — | — |
| Qattusepp | Normal | **any** | 346 | Lv. 20 | Qattusinja |
| Qattusinja | Normal / Fairy | **any** | 460 | — | — |
| Kelbfenek | Normal | **any** | 364 | Lv. 22 | Kelbsajjied |
| Kelbsajjied | Normal / Fighting | **any** | 484 | — | — |
| Ħamiemu | Normal | **any** | 334 | Lv. 18 | Ħamiemarju |
| Ħamiemarju | Normal / Flying | **any** | 446 | — | — |
| Silġina | Ice | water | 374 | Lv. 26 | Silġmewġa |
| Silġmewġa | Ice / Water | water | 499 | — | — |
| Tramunt | Ice | rock | 380 | Lv. 28 | Tramuntarju |
| Tramuntarju | Ice / Flying | rock | 506 | — | — |

### Temple Builders · 3600–2500 BC (8)

| Creature | Types | Biome | BST | Evolves | Becomes |
|---|---|---|---|---|---|
| Karkarun | Rock | rock | 425 | Lv. 25 | Karkarotta |
| Karkarotta | Rock / Ground | rock | 567 | — | — |
| Santwarr | Rock | rock | 470 | Lv. 30 | Santwarjun |
| Santwarjun | Rock / Psychic | rock | 629 | — | — |
| Dormina | Psychic | rock | 405 | Lv. 28 | Dorminarja |
| Dorminarja | Psychic / Fairy | rock | 541 | — | — |
| Ggantroll | Rock | rock | 472 | Lv. 32 | Ġgantmastru |
| Ġgantmastru | Rock / Fighting | rock | 632 | — | — |

### Bronze Age · 2500–700 BC (4)

| Creature | Types | Biome | BST | Evolves | Becomes |
|---|---|---|---|---|---|
| Borżnadur | Rock | rock | 438 | Lv. 27 | Borżnaduru |
| Borżnaduru | Rock / Dark | rock | 585 | — | — |
| Kartrutt | Ground | rock | 418 | Lv. 26 | Kartruttan |
| Kartruttan | Ground / Rock | rock | 558 | — | — |

### Phoenician & Punic · 800–218 BC (6)

| Creature | Types | Biome | BST | Evolves | Becomes |
|---|---|---|---|---|---|
| Murexil | Water | water | 350 | Lv. 28 | Tirjanu |
| Tirjanu | Water / Poison | water | 488 | — | — |
| Lembuqa | Water | water | 448 | Lv. 29 | Bastimenta |
| Bastimenta | Water / Steel | water | 598 | — | — |
| Għajnuq | Psychic | water | 428 | Lv. 27 | Għajnsaħħa |
| Għajnsaħħa | Psychic / Water | water | 570 | — | — |

### Roman & Byzantine · 218 BC–870 AD (8)

| Creature | Types | Biome | BST | Evolves | Becomes |
|---|---|---|---|---|---|
| Tessera | Rock | rock | 366 | Lv. 30 | Mosaikos |
| Mosaikos | Rock / Psychic | rock | 532 | — | — |
| Amforu | Ground | sand | 418 | Lv. 25 | Amforjun |
| Amforjun | Ground / Water | sand | 559 | — | — |
| Laurentu | Grass | grass | 472 | Lv. 28 | Laurentissu |
| Laurentissu | Grass / Fighting | grass | 630 | — | — |
| Vipaulus | Poison | grass | 470 | Lv. 26 | Vipaulinu |
| Vipaulinu | Poison / Fighting | grass | 626 | — | — |

### Arab Period · 870–1091 (6)

| Creature | Types | Biome | BST | Evolves | Becomes |
|---|---|---|---|---|---|
| Għasel | Bug | grass | 364 | Lv. 26 | Naħlija |
| Naħlija | Bug / Fairy | grass | 520 | — | — |
| Larinġa | Grass | grass | 450 | Lv. 24 | Larinġola |
| Larinġola | Grass / Fairy | grass | 602 | — | — |
| Sienja | Water | water | 464 | Lv. 27 | Sienjarja |
| Sienjarja | Water / Steel | water | 620 | — | — |

### Order of St John · 1530–1798 (5)

| Creature | Types | Biome | BST | Evolves | Becomes |
|---|---|---|---|---|---|
| Skudier | Steel | rock | 354 | Lv. 27 | Kavallier |
| Kavallier | Steel / Fighting | rock | 486 | Lv. 42 | Granmastru |
| Granmastru | Steel / Psychic | rock | 590 | — | — |
| Falkun | Flying | rock | 558 | Lv. 30 | Falkunjier |
| Falkunjier | Flying / Steel | rock | 742 | — | — |

### Great Siege · 1565 (6)

| Creature | Types | Biome | BST | Evolves | Becomes |
|---|---|---|---|---|---|
| Jannisar | Fighting | sand | 500 | Lv. 28 | Jannisarju |
| Jannisarju | Fighting / Fire | sand | 667 | — | — |
| Bombarda | Fire | rock | 508 | Lv. 31 | Bombardun |
| Bombardun | Fire / Steel | rock | 681 | — | — |
| Hilalux | Dark | sand | 524 | Lv. 26 | Hilaluna |
| Hilaluna | Dark / Flying | sand | 699 | — | — |

### British Period · 1800–1964 (4)

| Creature | Types | Biome | BST | Evolves | Becomes |
|---|---|---|---|---|---|
| Pustaljon | Electric | grass | 462 | Lv. 27 | Pustaljunar |
| Pustaljunar | Electric / Steel | grass | 616 | — | — |
| Konvoj | Water | water | 506 | Lv. 33 | Konvojarma |
| Konvojarma | Water / Steel | water | 676 | — | — |

---

## Regional variants (6)

| Creature | Types | Biome | BST | Evolves | Becomes |
|---|---|---|---|---|---|
| Ferrocane | Electric | rock | 510 | Lv. 30 | Ferrocanun |
| Ferrocanun | Electric / Fire | rock | 679 | — | — |
| Katakomba | Ghost | rock | 480 | Lv. 29 | Katakombrun |
| Katakombrun | Ghost / Rock | rock | 642 | — | — |
| Zavorra | Water | water | 480 | Lv. 31 | Zavorrun |
| Zavorrun | Water / Steel | water | 640 | — | — |

---

## Legendaries (6)

Story-gated. Each has an awakened second form reached by levelling, not by catching.

| Creature | Types | BST | Signature move | Evolves | Becomes |
|---|---|---|---|---|---|
| Aegilord | Steel | 630 | Cross of Valour | Lv. 55 | Aegilordan |
| Aegilordan | Steel / Fighting | 841 | Cross of Valour | — | — |
| Megalithos | Rock | 600 | Solstice Beam | Lv. 55 | Megalithron |
| Megalithron | Rock / Psychic | 803 | Solstice Alignment | — | — |
| Siroccus | Flying | 605 | Gregale Howl | Lv. 55 | Siroccalis |
| Siroccalis | Flying / Dragon | 807 | Sirocco Judgement | — | — |

---

## Type coverage

All 18 types have at least one creature. Counting both halves of every dual-type:

| Type | Creatures | | Type | Creatures |
|---|---|-|---|---|
| Water | 25 | | Normal | 6 |
| Rock | 21 | | Dark | 5 |
| Ground | 14 | | Bug | 4 |
| Steel | 14 | | Poison | 4 |
| Flying | 12 | | Fairy | 4 |
| Psychic | 10 | | Ice | 4 |
| Fighting | 10 | | Electric | 4 |
| Fire | 9 | | Ghost | 3 |
| Grass | 8 | | Dragon | 2 |

## Conflicting type pairs

No creature may carry both halves of any of these. The first seven are the type chart's own
immunities — a creature cannot be a thing and simultaneously the thing that thing cannot touch.
The rest are elemental opposites.

Ghost/Normal · Psychic/Dark · Electric/Ground · Ground/Flying · Fighting/Ghost ·
Poison/Steel · Dragon/Fairy · Fire/Water · Fire/Ice · Fire/Grass · Water/Electric · Grass/Steel
