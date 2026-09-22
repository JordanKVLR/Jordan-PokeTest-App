# Creature Roster — Chivalry & Antiquity

57 species in total. Generated from `src/data/starters.json`, `wildCreatures.json`,
`regionalVariants.json` and `legendaries.json` — if those files change, this table needs
regenerating alongside them.

Evolution columns read: the level the creature evolves at, and what it becomes. A blank
means the creature is a final form (or, for legendaries, that it does not evolve at all).

---

## Starters (9)

Three lines, each a full three-stage evolution. You pick one at the start of the run.

| # | Creature | Types | Stage | Evolves | Becomes |
|---|----------|-------|-------|---------|---------|
| 1 | Calfleaf | Grass | 1 | Lv. 16 | Vinehorn |
| 2 | Vinehorn | Grass | 2 | Lv. 36 | Moss-taur |
| 3 | Moss-taur | Grass / Ground | 3 | — | — |
| 4 | Pharawoof | Fire | 1 | Lv. 17 | Infernux |
| 5 | Infernux | Fire / Psychic | 2 | Lv. 34 | Pyrollis |
| 6 | Pyrollis | Fire / Psychic | 3 | — | — |
| 7 | Duckling | Water | 1 | Lv. 15 | Platyflow |
| 8 | Platyflow | Water | 2 | Lv. 33 | Marinedge |
| 9 | Marinedge | Water / Steel | 3 | — | — |

---

## Wild creatures (42)

Grouped by the Maltese era they draw on. `Biome` is where they spawn on the world map.

### Native / unaffiliated (14)

| Creature | Types | Biome | Evolves | Becomes |
|----------|-------|-------|---------|---------|
| Fossary | Bug / Grass | grass | — | — |
| Qortong | Rock | rock | — | — |
| Xrobbog | Rock / Ground | rock | — | — |
| Bulqajra | Rock / Fighting | rock | — | — |
| Luzzitt | Water | water | — | — |
| Marsupp | Water | water | — | — |
| Kalanka | Water / Rock | water | — | — |
| Vurjenn | Water / Flying | water | — | — |
| Ondallus | Water / Dragon | water | — | — |
| Ramliet | Ground | sand | — | — |
| Xemxun | Ground / Fire | sand | — | — |
| Dunkorr | Ground / Rock | sand | — | — |
| Sirokk | Ground / Flying | sand | — | — |
| Ossijan | Ground | sand | — | — |

### Neolithic / temple builders (4)

| Creature | Types | Biome | Evolves | Becomes |
|----------|-------|-------|---------|---------|
| Karkarun | Rock | rock | — | — |
| Santwarr | Rock / Psychic | rock | — | — |
| Dormina | Psychic / Fairy | rock | — | — |
| Ggantroll | Rock / Fighting | rock | — | — |

### Bronze Age (2)

| Creature | Types | Biome | Evolves | Becomes |
|----------|-------|-------|---------|---------|
| Borżnadur | Rock / Dark | rock | — | — |
| Kartrutt | Rock / Ground | rock | — | — |

### Phoenician (4)

| Creature | Types | Biome | Evolves | Becomes |
|----------|-------|-------|---------|---------|
| Murexil | Water / Poison | water | **Lv. 28** | **Tirjanu** |
| Tirjanu | Water / Poison | water | — | — |
| Lembuqa | Water / Steel | water | — | — |
| Għajnuq | Psychic / Water | water | — | — |

### Roman (5)

| Creature | Types | Biome | Evolves | Becomes |
|----------|-------|-------|---------|---------|
| Tessera | Rock / Psychic | rock | **Lv. 30** | **Mosaikos** |
| Mosaikos | Rock / Psychic | rock | — | — |
| Amforu | Ground / Water | sand | — | — |
| Laurentu | Grass / Fighting | grass | — | — |
| Vipaulus | Poison / Fighting | grass | — | — |

### Arab period (4)

| Creature | Types | Biome | Evolves | Becomes |
|----------|-------|-------|---------|---------|
| Għasel | Bug / Ground | grass | **Lv. 26** | **Naħlija** |
| Naħlija | Bug / Fairy | grass | — | — |
| Larinġa | Grass / Fairy | grass | — | — |
| Sienja | Water / Steel | water | — | — |

### Knights of St John (4)

The only three-stage wild line in the game.

| Creature | Types | Biome | Evolves | Becomes |
|----------|-------|-------|---------|---------|
| Skudier | Steel | rock | **Lv. 27** | **Kavallier** |
| Kavallier | Steel / Fighting | rock | **Lv. 42** | **Granmastru** |
| Granmastru | Steel / Psychic | rock | — | — |
| Falkun | Flying / Steel | rock | — | — |

### Ottoman (3)

| Creature | Types | Biome | Evolves | Becomes |
|----------|-------|-------|---------|---------|
| Jannisar | Fire / Fighting | sand | — | — |
| Bombarda | Fire / Steel | rock | — | — |
| Hilalux | Dark / Flying | sand | — | — |

### British period (2)

| Creature | Types | Biome | Evolves | Becomes |
|----------|-------|-------|---------|---------|
| Pustaljon | Steel / Electric | grass | — | — |
| Konvoj | Water / Steel | water | — | — |

---

## Regional variants (3)

| Creature | Types | Biome | Evolves | Becomes |
|----------|-------|-------|---------|---------|
| Ferrocane | Electric / Fire | rock | — | — |
| Katakomba | Rock / Ghost | rock | — | — |
| Zavorra | Water / Steel | water | — | — |

---

## Legendaries (3)

Story-gated, one per trial. None of them evolve.

| Creature | Types | Signature move | Gate |
|----------|-------|----------------|------|
| Aegilord | Steel / Fighting | Cross of Valour | `chivalry_trial_complete` |
| Megalithos | Rock / Psychic | — | — |
| Siroccus | Flying / Ground | — | — |

---

## Evolution summary

Only 6 of the 48 non-legendary, non-starter creatures currently evolve. Every starter
line evolves twice.

| Line | Chain |
|------|-------|
| Grass starter | Calfleaf → 16 → Vinehorn → 36 → Moss-taur |
| Fire starter | Pharawoof → 17 → Infernux → 34 → Pyrollis |
| Water starter | Duckling → 15 → Platyflow → 33 → Marinedge |
| Phoenician | Murexil → 28 → Tirjanu |
| Roman | Tessera → 30 → Mosaikos |
| Arab | Għasel → 26 → Naħlija |
| Knights | Skudier → 27 → Kavallier → 42 → Granmastru |

## Type coverage

16 of the 18 types are represented. **Normal** and **Ice** have no creature at all — Normal
exists only as a move type (tackle, scrap), and Ice is unused, which fits the setting but
does leave a hole in the type chart that nothing on the roster can exploit or resist.

Counting both types of dual-typed creatures:

| Type | Count | | Type | Count |
|------|-------|-|------|-------|
| Water | 16 | | Flying | 5 |
| Rock | 14 | | Bug | 3 |
| Steel | 12 | | Fairy | 3 |
| Ground | 11 | | Poison | 3 |
| Psychic | 9 | | Dark | 2 |
| Fire | 7 | | Electric | 2 |
| Fighting | 7 | | Dragon | 1 |
| Grass | 6 | | Ghost | 1 |

The skew towards Water, Rock and Steel follows from the setting: a limestone island with a
fortified harbour, where the Knights and British eras are both armour-and-machinery themed.
