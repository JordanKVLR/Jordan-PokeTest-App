import { useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import { requestMusic } from "./engine";
import type { TrackId } from "./tracks";

/**
 * The music a screen wants while it is on top. Screens that don't call this (the menus over the
 * map) leave whatever is playing alone, so opening the Bag doesn't restart the road tune.
 */
export function useMusic(track: TrackId | null | undefined): void {
  const focused = useIsFocused();
  useEffect(() => {
    if (focused && track !== undefined) requestMusic(track);
  }, [focused, track]);
}
