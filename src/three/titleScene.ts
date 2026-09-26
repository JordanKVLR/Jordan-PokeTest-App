import * as THREE from "three";

/**
 * The title screen in 3D: the south-west coast of Malta in the late afternoon. Honey-coloured
 * globigerina cliffs drop into a moving sea, a luzzu rocks at anchor with its painted eye on the
 * prow, the sun sits low over the water and clouds drift across. The camera floats slowly, as if
 * from a boat.
 */
export function createTitleScene(options: { reducedMotion?: boolean } = {}) {
  const scene = new THREE.Scene();
  const horizon = new THREE.Color("#f6dcae");
  scene.fog = new THREE.Fog(horizon, 18, 70);

  // Sky: warm at the horizon, deep blue overhead.
  const skyGeometry = new THREE.SphereGeometry(90, 32, 16);
  const mid = new THREE.Color("#8fc3e8");
  const top = new THREE.Color("#3a86cc");
  const skyColors: number[] = [];
  const sp = skyGeometry.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    // Three stops — warm horizon, clear blue, deep zenith — so there is no grey in between.
    const t = Math.max(0, sp.getY(i) / 90);
    const c = t < 0.12 ? horizon.clone().lerp(mid, t / 0.12) : mid.clone().lerp(top, Math.min(1, (t - 0.12) / 0.5));
    skyColors.push(c.r, c.g, c.b);
  }
  skyGeometry.setAttribute("color", new THREE.Float32BufferAttribute(skyColors, 3));
  scene.add(new THREE.Mesh(skyGeometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })));

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  const cameraHome = new THREE.Vector3(0, 3.2, 12);
  camera.position.copy(cameraHome);
  camera.lookAt(0, 2.4, 0);

  scene.add(new THREE.HemisphereLight("#ffe8c4", "#3a6f8f", 0.9));
  const sun = new THREE.DirectionalLight("#ffd79a", 2.6);
  sun.position.set(-20, 8, -30);
  scene.add(sun);
  const fill = new THREE.DirectionalLight("#bfe0ff", 0.6);
  fill.position.set(10, 6, 12);
  scene.add(fill);

  // The sun itself, and its glitter path across the water.
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(3, 32), new THREE.MeshBasicMaterial({ color: "#fff2c8", fog: false }));
  sunDisc.position.set(-14, 6.5, -70);
  sunDisc.lookAt(camera.position);
  scene.add(sunDisc);
  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(8, 32),
    new THREE.MeshBasicMaterial({ color: "#ffdca0", transparent: true, opacity: 0.35, fog: false, depthWrite: false })
  );
  halo.position.set(-14, 6.5, -70.5);
  halo.lookAt(camera.position);
  scene.add(halo);

  // The sea: a large sheet, rippled every frame.
  const seaGeometry = new THREE.PlaneGeometry(160, 160, 120, 120);
  seaGeometry.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(
    seaGeometry,
    new THREE.MeshStandardMaterial({ color: "#2f8fc4", emissive: new THREE.Color("#0c3a58"), emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.05, flatShading: true })
  );
  scene.add(sea);

  // Cliffs: a jagged wall of limestone on the right, falling away into the distance.
  const limestone = new THREE.MeshStandardMaterial({ color: "#d9b77a", roughness: 0.95, flatShading: true });
  const shadowStone = new THREE.MeshStandardMaterial({ color: "#b8935a", roughness: 0.95, flatShading: true });
  const cliffs = new THREE.Group();
  let seed = 11;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 26; i++) {
    const z = 4 - i * 2.4;
    const x = 7 + i * 0.55 + random() * 1.2;
    const height = 4.5 + random() * 3 - i * 0.05;
    const block = new THREE.Mesh(new THREE.BoxGeometry(3 + random() * 2, height, 2.8), i % 3 === 0 ? shadowStone : limestone);
    block.position.set(x, height / 2 - 0.6, z);
    block.rotation.y = (random() - 0.5) * 0.4;
    cliffs.add(block);
    // Strata: the layered faces are what make Maltese cliffs look Maltese.
    for (let s = 0; s < 3; s++) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.12, 2.9), shadowStone);
      band.position.set(x, 0.8 + s * height * 0.28, z);
      band.rotation.y = block.rotation.y;
      cliffs.add(band);
    }
    if (random() > 0.5) {
      const tuft = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 + random() * 0.4, 0), new THREE.MeshStandardMaterial({ color: "#7a8f4a", roughness: 0.9, flatShading: true }));
      tuft.position.set(x - 0.5, height - 0.4, z);
      cliffs.add(tuft);
    }
  }
  // Fallen boulders at the foot of the cliffs.
  for (let i = 0; i < 18; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + random() * 0.8, 0), limestone);
    rock.position.set(5.5 + random() * 3, 0, 6 - random() * 40);
    rock.rotation.set(random() * 3, random() * 3, random() * 3);
    cliffs.add(rock);
  }
  scene.add(cliffs);

  // A distant islet — Filfla — on the horizon.
  const islet = new THREE.Mesh(new THREE.CylinderGeometry(2, 3.5, 2.2, 9), limestone);
  islet.position.set(-9, 0.6, -45);
  scene.add(islet);

  // The luzzu: blue and yellow hull, tall prow and stern posts, the eye on the bow.
  const luzzu = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: "#2f6fb5", roughness: 0.5 });
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), hullMat);
  hull.scale.set(0.7, 0.7, 2.2);
  luzzu.add(hull);
  // A yellow gunwale strip and a dark deck inside it, so the hull reads as a boat, not a disc.
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 6, 32), new THREE.MeshStandardMaterial({ color: "#f0c94a", roughness: 0.5 }));
  band.rotation.x = Math.PI / 2;
  band.scale.set(1, 3.1, 1);
  band.position.y = 0.02;
  const deck = new THREE.Mesh(new THREE.CircleGeometry(0.68, 24), new THREE.MeshStandardMaterial({ color: "#6b4f35", roughness: 0.8 }));
  deck.rotation.x = -Math.PI / 2;
  deck.scale.set(1, 3.05, 1);
  deck.position.y = -0.02;
  luzzu.add(deck);
  luzzu.add(band);
  const red = new THREE.MeshStandardMaterial({ color: "#c9423a", roughness: 0.5 });
  for (const [z, tilt] of [[2.05, -0.3], [-2.05, 0.3]] as const) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), red);
    post.position.set(0, 0.35, z);
    post.rotation.x = tilt;
    luzzu.add(post);
  }
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
    eye.position.set(side * 0.5, 0.0, 1.6);
    eye.rotation.y = side * 1.2;
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), new THREE.MeshBasicMaterial({ color: "#1d2328" }));
    pupil.position.z = 0.01;
    eye.add(pupil);
    luzzu.add(eye);
  }
  luzzu.position.set(-3.5, 0.3, -3);
  luzzu.rotation.y = 1.35;
  scene.add(luzzu);

  // Clouds: soft clusters drifting slowly west.
  const cloudMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, transparent: true, opacity: 0.92 });
  const clouds: THREE.Group[] = [];
  for (let i = 0; i < 6; i++) {
    const cloud = new THREE.Group();
    for (let j = 0; j < 5; j++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 + random(), 1), cloudMat);
      puff.position.set(j * 1.3 - 2.6, random() * 0.6, random() * 0.8);
      puff.scale.y = 0.6;
      cloud.add(puff);
    }
    cloud.position.set(-30 + i * 12 + random() * 5, 14 + random() * 6, -40 - random() * 10);
    scene.add(cloud);
    clouds.push(cloud);
  }

  // Gulls: little V shapes wheeling over the cliffs.
  const gullMat = new THREE.MeshBasicMaterial({ color: "#f4f4f4", side: THREE.DoubleSide });
  const gulls: THREE.Group[] = [];
  for (let i = 0; i < 4; i++) {
    const gull = new THREE.Group();
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.1), gullMat);
      wing.position.x = side * 0.24;
      wing.rotation.z = side * 0.35;
      gull.add(wing);
    }
    gull.userData.phase = i * 1.7;
    scene.add(gull);
    gulls.push(gull);
  }

  const drift = options.reducedMotion ? 0 : 1;

  return {
    scene,
    camera,
    frame(_dt: number, time: number) {
      const p = seaGeometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        const z = p.getZ(i);
        p.setY(i, Math.sin(x * 0.35 + time * 0.9) * 0.12 + Math.cos(z * 0.42 + time * 0.7) * 0.12 + Math.sin((x + z) * 0.9 + time * 1.6) * 0.04);
      }
      p.needsUpdate = true;
      seaGeometry.computeVertexNormals();

      luzzu.position.y = 0.3 + Math.sin(time * 1.1) * 0.08;
      luzzu.rotation.z = Math.sin(time * 0.9) * 0.05;
      luzzu.rotation.x = Math.sin(time * 0.7) * 0.03;

      for (const cloud of clouds) {
        cloud.position.x -= 0.004 * drift;
        if (cloud.position.x < -40) cloud.position.x = 40;
      }
      gulls.forEach((gull) => {
        const t = time * 0.35 + gull.userData.phase;
        gull.position.set(6 + Math.cos(t) * 5, 8 + Math.sin(t * 2) * 0.8, -6 + Math.sin(t) * 4);
        gull.rotation.y = -t;
        gull.children.forEach((wing, i) => (wing.rotation.z = (i === 0 ? -1 : 1) * (0.35 + Math.sin(time * 6 + gull.userData.phase) * 0.35)));
      });

      camera.position.set(cameraHome.x + Math.sin(time * 0.12) * 1.2 * drift, cameraHome.y + Math.sin(time * 0.25) * 0.15 * drift, cameraHome.z);
      camera.lookAt(0, 2.4, 0);
      sunDisc.lookAt(camera.position);
      halo.lookAt(camera.position);
    },
    resize(width: number, height: number) {
      camera.aspect = width / Math.max(1, height);
      // A tall phone gets a wider view so the cliffs still show.
      camera.fov = camera.aspect < 0.8 ? 68 : 50;
      camera.updateProjectionMatrix();
    },
    dispose() {
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material as THREE.Material | undefined;
        material?.dispose?.();
      });
    },
  };
}
