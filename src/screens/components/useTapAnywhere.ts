import { useEffect, useRef } from "react";

/**
 * For screens that close on a tap anywhere. The tap that dismissed the last battle message
 * can land a frame after this screen opens, and would close it before it was ever seen —
 * so presses only count once the screen has been up for a moment.
 */
export function useTapAnywhere(onTap: () => void, armAfterMs = 450): () => void {
  const armed = useRef(false);
  const done = useRef(false);
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;

  useEffect(() => {
    const timer = setTimeout(() => {
      armed.current = true;
    }, armAfterMs);
    return () => clearTimeout(timer);
  }, [armAfterMs]);

  return () => {
    if (!armed.current || done.current) return;
    done.current = true;
    onTapRef.current();
  };
}
