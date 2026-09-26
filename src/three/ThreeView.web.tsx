import { useEffect, useRef } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import * as THREE from "three";

/**
 * Hosts a three.js scene inside the React Native Web layout. It owns the WebGL renderer: sizes
 * it to the view, renders every frame while visible, pauses when the tab is hidden, and frees
 * everything on unmount. What is drawn comes from `create`.
 */
export interface ThreeController {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  frame?: (dt: number, time: number) => void;
  resize?: (width: number, height: number) => void;
  dispose?: () => void;
}

export function ThreeView({ style, create, testID }: { style?: StyleProp<ViewStyle>; create: () => ThreeController; testID?: string }) {
  const hostRef = useRef<View>(null);
  const createRef = useRef(create);
  createRef.current = create;

  useEffect(() => {
    const host = hostRef.current as unknown as HTMLElement | null;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    host.appendChild(canvas);

    const controller = createRef.current();
    const size = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      renderer.setSize(width, height, false);
      controller.camera.aspect = width / height;
      controller.camera.updateProjectionMatrix();
      controller.resize?.(width, height);
    };
    size();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(size) : null;
    observer?.observe(host);

    const clock = new THREE.Clock();
    let running = true;
    renderer.setAnimationLoop(() => {
      if (!running) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      controller.frame?.(dt, clock.elapsedTime);
      renderer.render(controller.scene, controller.camera);
    });
    const onVisibility = () => {
      running = document.visibilityState !== "hidden";
      if (running) clock.getDelta();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
      renderer.setAnimationLoop(null);
      controller.dispose?.();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  return <View ref={hostRef} testID={testID} pointerEvents="none" style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }, style]} />;
}
