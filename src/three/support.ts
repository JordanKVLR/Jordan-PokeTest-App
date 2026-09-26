/**
 * Whether this device can draw the 3D scenes. Checked once: a WebGL context is created and
 * thrown away. Where it fails (old phones, native builds, locked-down browsers) the game keeps
 * its 2D art, so nothing is ever lost by asking.
 */
let cached: boolean | null = null;

export function supports3D(): boolean {
  if (cached !== null) return cached;
  cached = false;
  try {
    if (typeof document === "undefined") return cached;
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    cached = !!gl;
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}
