import { useEffect } from "react";
import { nowPlaying, requestMusic } from "./engine";
import type { TrackId } from "./tracks";

/**
 * For overlays with their own music — an evolution, the finale. The piece plays while the
 * overlay is up, and whatever was wanted before comes back when it closes.
 */
export function useMusicWhileMounted(track: TrackId): void {
  useEffect(() => {
    const previous = nowPlaying().wanted;
    requestMusic(track, 0.5);
    return () => requestMusic(previous, 0.8);
  }, [track]);
}
