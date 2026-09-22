# Creature Roster — Chivalry & Antiquity

**106 species.** Generated from `src/data/*.json` and from the live encounter tables,
so the availability column is what the game actually rolls, not an estimate. The rules below
are enforced by `src/data/__tests__/roster.test.ts`.

Every creature sits in an evolution line — no single-stage dead ends. Every creature carries
one or two types, never three, and never two that contradict each other (see
`src/data/typeCompatibility.ts`). All 18 types are represented.

**Stages** is which of the 20 stages a creature can be found wild in. It falls out of two
rules: the stage's two biomes have to include the creature's own (Normal types carry "any" and
roll everywhere), and an evolved form is held back until the stage's levels come within 3 of
where its line evolves — so you never meet a fully-grown creature on the first road.

**BST** is the base stat total.

---

## Stage list

| # | Stage | Terrain | Wild level | | # | Stage | Terrain | Wild level |
|---|---|---|---|-|---|---|---|---|
| 1 | Melita Woods | grass + rock | ~5 | | 11 | Mtaħleb Terraces | grass + sand | ~34 |
| 2 | Salina Saltpans | water + sand | ~8 | | 12 | Azure Caverns | rock + water | ~37 |
| 3 | Dingli Cliffs | rock + water | ~11 | | 13 | Golden Bay Sands | sand + grass | ~40 |
| 4 | Ramla Dunes | sand + grass | ~14 | | 14 | Comino Blue Lagoon | water + rock | ~43 |
| 5 🏅 | Mdina Bastions | rock + grass | ~17 | | 15 🏅 | Ħaġar Qim Sanctum | rock + grass | ~46 |
| 6 | Marsaxlokk Bay | water + sand | ~19 | | 16 | Delimara Point | sand + water | ~48 |
| 7 | Wied il-Għasel | grass + water | ~22 | | 17 | Ġgantija Terrace | grass + rock | ~51 |
| 8 | Sirocco Flats | sand + rock | ~25 | | 18 | Għar Dalam Deep | sand + rock | ~54 |
| 9 | Is-Simar Wetlands | water + grass | ~28 | | 19 | Wied Babu Gorge | grass + water | ~57 |
| 10 🏅 | Fort St Angelo | rock + water | ~31 | | 20 🏅 | Valletta Grand Harbour | water + rock | ~60 |

🏅 = gym stage. Beating its leader awards the medal that opens the next five stages.

---

## Starters (9)

Three lines of three; you pick one at the start. The stage-1 forms of the **two lines you did
not pick** also turn up wild — Grass in grass, Water in water, Fire on rock — so a full Codex
does not need three playthroughs. Stages 2 and 3 are never found wild; you evolve into them.

| Line | Creature | Types | BST | Evolves | Becomes | Stages |
|---|---|---|---|---|---|---|
| Grass | Calfleaf | Grass | 315 | Lv. 16 | Vinehorn | 1, 4–5, 7, 9, 11, 13, 15, 17, 19 |
| Grass | Vinehorn | Grass | 416 | Lv. 36 | Moss-taur | — |
| Grass | Moss-taur | Grass/Ground | 508 | — | — | — |
| Fire | Pharawoof | Fire | 329 | Lv. 17 | Infernux | 1, 3, 5, 8, 10, 12, 14–15, 17–18, 20 |
| Fire | Infernux | Fire/Psychic | 438 | Lv. 34 | Pyrollis | — |
| Fire | Pyrollis | Fire/Psychic | 548 | — | — | — |
| Water | Duckling | Water | 324 | Lv. 15 | Platyflow | 2–3, 6–7, 9–10, 12, 14, 16, 19–20 |
| Water | Platyflow | Water | 432 | Lv. 33 | Marinedge | — |
| Water | Marinedge | Water/Steel | 540 | — | — | — |

---

## Wild creatures (85)

Grouped by the layer of Maltese history they draw on.

### Native fauna (38)

| Creature | Types | Biome | BST | Evolves | Becomes | Stages |
|---|---|---|---|---|---|---|
| Fossary | Bug | grass | 415 | Lv. 22 | Garrigarn | 1, 4–5, 7, 9, 11, 13, 15, 17, 19 |
| Garrigarn | Bug/Grass | grass | 553 | — | — | 7, 9, 11, 13, 15, 17, 19 |
| Qortong | Rock | rock | 335 | Lv. 24 | Qortagħan | 1, 3, 5, 8, 10, 12, 14–15, 17–18, 20 |
| Qortagħan | Rock/Ground | rock | 447 | — | — | 8, 10, 12, 14–15, 17–18, 20 |
| Xrobbog | Rock | rock | 380 | Lv. 26 | Xrobbraxx | 1, 3, 5, 8, 10, 12, 14–15, 17–18, 20 |
| Xrobbraxx | Rock/Dark | rock | 508 | — | — | 8, 10, 12, 14–15, 17–18, 20 |
| Bulqajra | Fighting | rock | 400 | Lv. 25 | Bulqajrun | 1, 3, 5, 8, 10, 12, 14–15, 17–18, 20 |
| Bulqajrun | Fighting/Rock | rock | 535 | — | — | 8, 10, 12, 14–15, 17–18, 20 |
| Luzzitt | Water | water | 365 | Lv. 20 | Luzzarju | 2–3, 6–7, 9–10, 12, 14, 16, 19–20 |
| Luzzarju | Water/Flying | water | 487 | — | — | 6–7, 9–10, 12, 14, 16, 19–20 |
| Marsupp | Water | water | 375 | Lv. 23 | Marsuppjun | 2–3, 6–7, 9–10, 12, 14, 16, 19–20 |
| Marsuppjun | Water/Poison | water | 501 | — | — | 7, 9–10, 12, 14, 16, 19–20 |
| Kalanka | Water | water | 405 | Lv. 27 | Kalankros | 2–3, 6–7, 9–10, 12, 14, 16, 19–20 |
| Kalankros | Water/Rock | water | 542 | — | — | 9–10, 12, 14, 16, 19–20 |
| Vurjenn | Flying | water | 415 | Lv. 21 | Vurjenzu | 2–3, 6–7, 9–10, 12, 14, 16, 19–20 |
| Vurjenzu | Flying/Water | water | 552 | — | — | 6–7, 9–10, 12, 14, 16, 19–20 |
| Ondallus | Water | water | 495 | Lv. 35 | Ondraguna | 2–3, 6–7, 9–10, 12, 14, 16, 19–20 |
| Ondraguna | Water/Dragon | water | 661 | — | — | 12, 14, 16, 19–20 |
| Ramliet | Ground | sand | 340 | Lv. 22 | Ramlietan | 2, 4, 6, 8, 11, 13, 16, 18 |
| Ramlietan | Ground/Rock | sand | 453 | — | — | 6, 8, 11, 13, 16, 18 |
| Xemxun | Fire | sand | 390 | Lv. 26 | Xemxarju | 2, 4, 6, 8, 11, 13, 16, 18 |
| Xemxarju | Fire/Ground | sand | 520 | — | — | 8, 11, 13, 16, 18 |
| Dunkorr | Ground | sand | 390 | Lv. 28 | Dunkorrax | 2, 4, 6, 8, 11, 13, 16, 18 |
| Dunkorrax | Ground/Steel | sand | 523 | — | — | 8, 11, 13, 16, 18 |
| Sirokk | Flying | sand | 415 | Lv. 24 | Sirokkjun | 2, 4, 6, 8, 11, 13, 16, 18 |
| Sirokkjun | Flying/Dark | sand | 552 | — | — | 8, 11, 13, 16, 18 |
| Ossijan | Ground | sand | 420 | Lv. 29 | Ossijark | 2, 4, 6, 8, 11, 13, 16, 18 |
| Ossijark | Ground/Ghost | sand | 560 | — | — | 11, 13, 16, 18 |
| Qattusepp | Normal | **any** | 346 | Lv. 20 | Qattusinja | 1–20 |
| Qattusinja | Normal/Fairy | **any** | 460 | — | — | 5–20 |
| Kelbfenek | Normal | **any** | 364 | Lv. 22 | Kelbsajjied | 1–20 |
| Kelbsajjied | Normal/Fighting | **any** | 484 | — | — | 6–20 |
| Ħamiemu | Normal | **any** | 334 | Lv. 18 | Ħamiemarju | 1–20 |
| Ħamiemarju | Normal/Flying | **any** | 446 | — | — | 5–20 |
| Silġina | Ice | water | 374 | Lv. 26 | Silġmewġa | 2–3, 6–7, 9–10, 12, 14, 16, 19–20 |
| Silġmewġa | Ice/Water | water | 499 | — | — | 9–10, 12, 14, 16, 19–20 |
| Tramunt | Ice | rock | 380 | Lv. 28 | Tramuntarju | 1, 3, 5, 8, 10, 12, 14–15, 17–18, 20 |
| Tramuntarju | Ice/Flying | rock | 506 | — | — | 8, 10, 12, 14–15, 17–18, 20 |

### Temple Builders · 3600–2500 BC (8)

| Creature | Types | Biome | BST | Evolves | Becomes | Stages |
|---|---|---|---|---|---|---|
| Karkarun | Rock | rock | 425 | Lv. 25 | Karkarotta | 1, 3, 5, 8, 10, 12, 14–15, 17–18, 20 |
| Karkarotta | Rock/Ground | rock | 567 | — | — | 8, 10, 12, 14–15, 17–18, 20 |
| Santwarr | Rock | rock | 470 | Lv. 30 | Santwarjun | 1, 3, 5, 8, 10, 12, 14–15, 17–18, 20 |
| Santwarjun | Rock/Psychic | rock | 629 | — | — | 10, 12, 14–15, 17–18, 20 |
| Dormina | Psychic | rock | 405 | Lv. 28 | Dorminarja | 1, 3, 5, 8, 10, 12, 14–15, 17–18, 20 |
| Dorminarja | Psychic/Fairy | rock | 541 | — | — | 8, 10, 12, 14–15, 17–18, 20 |
| Ggantroll | Rock | rock | 472 | Lv. 32 | Ġgantmastru | 1, 3, 5, 8, 10, 12, 14–15, 17–18, 20 |
| Ġgantmastru | Rock/Fighting | rock | 632 | — | — | 10, 12, 14–15, 17–18, 20 |

### Bronze Age · 2500–700 BC (4)

| Creature | Types | Biome | BST | Evolves | Becomes | Stages |
|---|---|---|---|---|---|---|
| Borżnadur | Rock | rock | 438 | Lv. 27 | Borżnaduru | 1, 3, 5, 8, 10, 12, 14–15, 17–18, 20 |
| Borżnaduru | Rock/Dark | rock | 585 | — | — | 8, 10, 12, 14–15, 17–18, 20 |
| Kartrutt | Ground | rock | 418 | Lv. 26 | Kartruttan | 1, 3, 5, 8, 10, 12, 14–15, 17–18, 20 |
| Kartruttan | Ground/Rock | rock | 558 | — | — | 8, 10, 12, 14–15, 17–18, 20 |

### Phoenician & Punic · 800–218 BC (6)

| Creature | Types | Biome | BST | Evolves | Becomes | Stages |
|---|---|---|---|---|---|---|
| Murexil | Water | water | 350 | Lv. 28 | Tirjanu | 2–3, 6–7, 9–10, 12, 14, 16, 19–20 |
| Tirjanu | Water/Poison | water | 488 | — | — | 9–10, 12, 14, 16, 19–20 |
| Lembuqa | Water | water | 448 | Lv. 29 | Bastimenta | 2–3, 6–7, 9–10, 12, 14, 16, 19–20 |
| Bastimenta | Water/Steel | water | 598 | — | — | 9–10, 12, 14, 16, 19–20 |
| Għajnuq | Psychic | water | 428 | Lv. 27 | Għajnsaħħa | 2–3, 6–7, 9–10, 12, 14, 16, 19–20 |
| Għajnsaħħa | Psychic/Water | water | 570 | — | — | 9–10, 12, 14, 16, 19–20 |

### Roman & Byzantine · 218 BC–870 AD (8)

| Creature | Types | Biome | BST | Evolves | Becomes | Stages |
|---|---|---|---|---|---|---|
| Tessera | Rock | rock | 366 | Lv. 30 | Mosaikos | 1, 3, 5, 8, 10, 12, 14–15, 17–18, 20 |
| Mosaikos | Rock/Psychic | rock | 532 | — | — | 10, 12, 14–15, 17–18, 20 |
| Amforu | Ground | sand | 418 | Lv. 25 | Amforjun | 2, 4, 6, 8, 11, 13, 16, 18 |
| Amforjun | Ground/Water | sand | 559 | — | — | 8, 11, 13, 16, 18 |
| Laurentu | Grass | grass | 472 | Lv. 28 | Laurentissu | 1, 4–5, 7, 9, 11, 13, 15, 17, 19 |
| Laurentissu | Grass/Fighting | grass | 630 | — | — | 9, 11, 13, 15, 17, 19 |
| Vipaulus | Poison | grass | 470 | Lv. 26 | Vipaulinu | 1, 4–5, 7, 9, 11, 13, 15, 17, 19 |
| Vipaulinu | Poison/Fighting | grass | 626 | — | — | 9, 11, 13, 15, 17, 19 |

### Arab Period · 870–1091 (6)

| Creature | Types | Biome | BST | Evolves | Becomes | Stages |
|---|---|---|---|---|---|---|
| Għasel | Bug | grass | 364 | Lv. 26 | Naħlija | 1, 4–5, 7, 9, 11, 13, 15, 17, 19 |
| Naħlija | Bug/Fairy | grass | 520 | — | — | 9, 11, 13, 15, 17, 19 |
| Larinġa | Grass | grass | 450 | Lv. 24 | Larinġola | 1, 4–5, 7, 9, 11, 13, 15, 17, 19 |
| Larinġola | Grass/Fairy | grass | 602 | — | — | 7, 9, 11, 13, 15, 17, 19 |
| Sienja | Water | water | 464 | Lv. 27 | Sienjarja | 2–3, 6–7, 9–10, 12, 14, 16, 19–20 |
| Sienjarja | Water/Steel | water | 620 | — | — | 9–10, 12, 14, 16, 19–20 |

### Order of St John · 1530–1798 (5)

| Creature | Types | Biome | BST | Evolves | Becomes | Stages |
|---|---|---|---|---|---|---|
| Skudier | Steel | rock | 354 | Lv. 27 | Kavallier | 1, 3, 5, 8, 10, 12, 14–15, 17–18, 20 |
| Kavallier | Steel/Fighting | rock | 486 | Lv. 42 | Granmastru | 8, 10, 12, 14–15, 17–18, 20 |
| Granmastru | Steel/Psychic | rock | 590 | — | — | 14–15, 17–18, 20 |
| Falkun | Flying | rock | 558 | Lv. 30 | Falkunjier | 1, 3, 5, 8, 10, 12, 14–15, 17–18, 20 |
| Falkunjier | Flying/Steel | rock | 742 | — | — | 10, 12, 14–15, 17–18, 20 |

### Great Siege · 1565 (6)

| Creature | Types | Biome | BST | Evolves | Becomes | Stages |
|---|---|---|---|---|---|---|
| Jannisar | Fighting | sand | 500 | Lv. 28 | Jannisarju | 2, 4, 6, 8, 11, 13, 16, 18 |
| Jannisarju | Fighting/Fire | sand | 667 | — | — | 8, 11, 13, 16, 18 |
| Bombarda | Fire | rock | 508 | Lv. 31 | Bombardun | 1, 3, 5, 8, 10, 12, 14–15, 17–18, 20 |
| Bombardun | Fire/Steel | rock | 681 | — | — | 10, 12, 14–15, 17–18, 20 |
| Hilalux | Dark | sand | 524 | Lv. 26 | Hilaluna | 2, 4, 6, 8, 11, 13, 16, 18 |
| Hilaluna | Dark/Flying | sand | 699 | — | — | 8, 11, 13, 16, 18 |

### British Period · 1800–1964 (4)

| Creature | Types | Biome | BST | Evolves | Becomes | Stages |
|---|---|---|---|---|---|---|
| Pustaljon | Electric | grass | 462 | Lv. 27 | Pustaljunar | 1, 4–5, 7, 9, 11, 13, 15, 17, 19 |
| Pustaljunar | Electric/Steel | grass | 616 | — | — | 9, 11, 13, 15, 17, 19 |
| Konvoj | Water | water | 506 | Lv. 33 | Konvojarma | 2–3, 6–7, 9–10, 12, 14, 16, 19–20 |
| Konvojarma | Water/Steel | water | 676 | — | — | 10, 12, 14, 16, 19–20 |

---

## Regional variants (6)

Rarer than the wild roster — a fifth of the encounter weight.

| Creature | Types | Biome | BST | Evolves | Becomes | Stages |
|---|---|---|---|---|---|---|
| Ferrocane | Electric | rock | 510 | Lv. 30 | Ferrocanun | 1, 3, 5, 8, 10, 12, 14–15, 17–18, 20 |
| Ferrocanun | Electric/Fire | rock | 679 | — | — | 10, 12, 14–15, 17–18, 20 |
| Katakomba | Ghost | rock | 480 | Lv. 29 | Katakombrun | 1, 3, 5, 8, 10, 12, 14–15, 17–18, 20 |
| Katakombrun | Ghost/Rock | rock | 642 | — | — | 10, 12, 14–15, 17–18, 20 |
| Zavorra | Water | water | 480 | Lv. 31 | Zavorrun | 2–3, 6–7, 9–10, 12, 14, 16, 19–20 |
| Zavorrun | Water/Steel | water | 640 | — | — | 9–10, 12, 14, 16, 19–20 |

---

## Legendaries (6)

Vanishingly rare in the wild and available from every biome. The awakened forms are never
found — you evolve the one you caught.

| Creature | Types | BST | Signature move | Evolves | Becomes | Stages |
|---|---|---|---|---|---|---|
| Aegilord | Steel | 630 | Cross of Valour | Lv. 55 | Aegilordan | 1–20 |
| Aegilordan | Steel/Fighting | 841 | Cross of Valour | — | — | — |
| Megalithos | Rock | 600 | Solstice Beam | Lv. 55 | Megalithron | 1–20 |
| Megalithron | Rock/Psychic | 803 | Solstice Alignment | — | — | — |
| Siroccus | Flying | 605 | Gregale Howl | Lv. 55 | Siroccalis | 1–20 |
| Siroccalis | Flying/Dragon | 807 | Sirocco Judgement | — | — | — |

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
immunities — a creature cannot be a thing and simultaneously the thing that thing cannot
touch. The rest are elemental opposites.

Ghost/Normal · Psychic/Dark · Electric/Ground · Ground/Flying · Fighting/Ghost ·
Poison/Steel · Dragon/Fairy · Fire/Water · Fire/Ice · Fire/Grass · Water/Electric · Grass/Steel
