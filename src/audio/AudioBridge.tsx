import { useEffect } from "react";
import { useSettings } from "../state/settingsStore";
import { volumeLevel } from "../game/settings";
import { audioSupported, setAudioSuspended, setVolumes, unlockAudio } from "./engine";
import { battle, ui, world } from "./sfx";

/**
 * Connects the audio engine to the page: unlocks sound on the first touch (browsers insist),
 * gives every button a sound without each one having to ask for it, pauses while the tab is
 * hidden, and follows the volume settings. Renders nothing.
 */

/** Controls that make their own sound, or none — walking would be a wall of clicks. */
const QUIET_IDS = /^(move-(up|down|left|right)|joystick|map-viewport|battle-message|drag-handle-\d+)$/;
const BACK_IDS = /(back-button|-close|close-|backdrop)/;

function soundFor(target: EventTarget | null): (() => void) | null {
  if (!(target instanceof Element)) return null;
  const control = target.closest('[role="button"], [role="radio"], [role="switch"], [role="adjustable"], button, a, [tabindex="0"]');
  if (!control) return null;
  const testId = control.getAttribute("data-testid") ?? "";
  if (QUIET_IDS.test(testId)) return null;
  if (control.getAttribute("aria-disabled") === "true") return ui.blocked;
  const role = control.getAttribute("role");
  if (role === "radio" || role === "switch") return ui.toggle;
  if (BACK_IDS.test(testId)) return ui.back;
  return ui.tap;
}

// For automated checks and the curious: every effect, callable from the console.
if (typeof globalThis !== "undefined") {
  (globalThis as unknown as { __maltaSfx?: unknown }).__maltaSfx = { ui, world, battle };
}

export function AudioBridge() {
  const musicVolume = useSettings((s) => s.musicVolume);
  const sfxVolume = useSettings((s) => s.sfxVolume);

  useEffect(() => {
    setVolumes(volumeLevel(musicVolume), volumeLevel(sfxVolume));
  }, [musicVolume, sfxVolume]);

  useEffect(() => {
    if (!audioSupported() || typeof document === "undefined") return;
    const onPointer = (event: Event) => {
      unlockAudio();
      soundFor(event.target)?.();
    };
    const onKey = () => unlockAudio();
    const onVisibility = () => setAudioSuspended(document.visibilityState === "hidden");
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey, true);
    // iOS Safari only counts touchend and click as the gesture that may start sound.
    document.addEventListener("touchend", onKey, true);
    document.addEventListener("click", onKey, true);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("touchend", onKey, true);
      document.removeEventListener("click", onKey, true);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
