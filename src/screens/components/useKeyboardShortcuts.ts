import { useEffect, useRef } from "react";
import { useIsFocused } from "@react-navigation/native";

type KeyHandler = (e: KeyboardEvent) => void;
export type KeyMap = Record<string, KeyHandler>;

/**
 * Web-only keyboard shortcuts (no-ops on native, where `window` doesn't exist).
 * Keys are matched case-insensitively for single characters (so "b" and "B"
 * both work) and verbatim for named keys like "ArrowUp". The map is read from
 * a ref updated every render, so callers can pass a fresh object each render
 * without the listener being torn down and re-attached each time.
 *
 * Only the focused screen listens. Every screen in the stack stays mounted underneath the one
 * on top, so without this each of them kept its own window listener: pressing B during a battle
 * fired the battle's handler (which correctly refused) and the map's (which navigated away to
 * the Bag), and the arrow keys walked the player around a map they were not looking at.
 */
export function useKeyboardShortcuts(keyMap: KeyMap): void {
  const keyMapRef = useRef(keyMap);
  keyMapRef.current = keyMap;

  const isFocused = useIsFocused();
  const focusedRef = useRef(isFocused);
  focusedRef.current = isFocused;

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleKeyDown(e: KeyboardEvent) {
      if (!focusedRef.current) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const handler = keyMapRef.current[key];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
