/**
 * How big the overworld is drawn, decided by how much screen there is — not by what kind of
 * device it is, since a narrow laptop window deserves the phone layout and a tablet on its
 * side deserves the laptop one.
 *
 * - **Wide** (roughly laptop and up): tiles stay at their natural size and the viewport grows
 *   to show more of them — the whole zone when it fits. More map, not a magnified map.
 * - **Compact** (phones): the map is the whole screen, edge to edge, with the controls laid
 *   over it. Tiles grow just enough that the zone covers the screen in both directions, so
 *   there is never a band of empty page around the world.
 */

export type MapLayoutMode = "wide" | "compact";

export interface MapLayout {
  mode: MapLayoutMode;
  tileSize: number;
  viewportWidth: number;
  viewportHeight: number;
}

/** A tile's natural size. Wide layouts never draw it any bigger. */
export const BASE_TILE = 44;
/** On compact layouts tiles may grow to cover the screen, but not without limit. */
const MAX_COMPACT_TILE = 72;
const WIDE_MIN_WIDTH = 900;
const WIDE_MIN_HEIGHT = 560;
const WIDE_MARGIN = 24;

export function computeMapLayout(
  window: { width: number; height: number },
  mapCols: number,
  mapRows: number
): MapLayout {
  const { width, height } = window;
  const wide = width >= WIDE_MIN_WIDTH && height >= WIDE_MIN_HEIGHT;

  if (wide) {
    return {
      mode: "wide",
      tileSize: BASE_TILE,
      viewportWidth: Math.min(mapCols * BASE_TILE, width - WIDE_MARGIN * 2),
      viewportHeight: Math.min(mapRows * BASE_TILE, height - WIDE_MARGIN * 2),
    };
  }

  const cover = Math.max(BASE_TILE, Math.ceil(width / mapCols), Math.ceil(height / mapRows));
  return {
    mode: "compact",
    tileSize: Math.min(MAX_COMPACT_TILE, cover),
    viewportWidth: width,
    viewportHeight: height,
  };
}
