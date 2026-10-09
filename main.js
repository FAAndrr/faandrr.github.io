'use strict';

const status = document.querySelector('#status');
let renderer;

try {
  renderer = new THREE.WebGLRenderer({ antialias: true });
} catch (error) {
  status.textContent =
    'WebGL could not start. Try a browser with hardware acceleration enabled.';
  throw error;
}

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0xb8d9ef);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xb8d9ef, 65, 150);

const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  250
);

// Sky illumination and sunlight.
scene.add(new THREE.HemisphereLight(0xd6edff, 0x6c7457, 2));

const sun = new THREE.DirectionalLight(0xfff1d2, 3);
sun.position.set(18, 40, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);

Object.assign(sun.shadow.camera, {
  left: -45,
  right: 45,
  top: 45,
  bottom: -45,
  near: 1,
  far: 100
});

sun.shadow.normalBias = 0.025;
scene.add(sun);
scene.add(sun.target);

// Baseplate.
const planeSize = 160;
const groundY = -10;

function configureTexture(texture) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(planeSize / 4, planeSize / 4);
  texture.magFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

const groundMaterial = new THREE.MeshPhongMaterial({
  color: 0xb9c6bc
});

const baseplate = new THREE.Mesh(
  new THREE.BoxGeometry(planeSize, 0.6, planeSize),
  [
    new THREE.MeshStandardMaterial({ color: 0x647b6c }),
    new THREE.MeshStandardMaterial({ color: 0x647b6c }),
    groundMaterial,
    new THREE.MeshStandardMaterial({ color: 0x647b6c }),
    new THREE.MeshStandardMaterial({ color: 0x647b6c }),
    new THREE.MeshStandardMaterial({ color: 0x647b6c })
  ]
);

baseplate.position.y = groundY - 0.3;
baseplate.receiveShadow = true;
scene.add(baseplate);

// Character and eye-level camera.
const character = new THREE.Group();
scene.add(character);
character.position.y = groundY;

character.add(camera);
camera.position.set(0, 2.33, 0);
camera.rotation.order = 'YXZ';

const blue = new THREE.MeshStandardMaterial({
  color: 0x337cdb,
  roughness: 0.65
});

const skin = new THREE.MeshStandardMaterial({
  color: 0xffd294,
  roughness: 0.8
});

const pants = new THREE.MeshStandardMaterial({
  color: 0x293c59,
  roughness: 0.85
});

function box(w, h, d, material, x, y, z, parent = character) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

box(0.9, 1, 0.5, blue, 0, 1.5, 0);

// No head mesh: it would block the first-person camera.
const limbs = [];

for (const side of [-1, 1]) {
  const arm = new THREE.Group();
  arm.position.set(side * 0.65, 1.9, 0);
  character.add(arm);

  box(0.3, 0.95, 0.35, skin, 0, -0.4, 0, arm);

  const leg = new THREE.Group();
  leg.position.set(side * 0.24, 1, 0);
  character.add(leg);

  box(0.38, 1, 0.42, pants, 0, -0.5, 0, leg);
  limbs.push({ arm, leg, side });
}

// Donut landmark from the prototype.
const donut = new THREE.Mesh(
  new THREE.TorusGeometry(8, 3, 16, 100),
  new THREE.MeshPhongMaterial({ color: 0xffffff })
);

donut.position.set(1, 10, -25);
donut.castShadow = true;
scene.add(donut);

// Keyboard movement.
let yaw = 0;
let pitch = -0.12;
let verticalSpeed = 0;
let grounded = true;

const keys = new Set();
const movementKeys = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Space'
]);

addEventListener('keydown', event => {
  if (
    !movementKeys.has(event.code) ||
    event.target instanceof HTMLInputElement
  ) {
    return;
  }

  event.preventDefault();
  keys.add(event.code);

  if (event.code === 'Space' && grounded && !event.repeat) {
    verticalSpeed = 8;
    grounded = false;
  }
});

addEventListener('keyup', event => keys.delete(event.code));
addEventListener('blur', () => keys.clear());

// First-person mouse look, with drag fallback.
let dragging = false;
let previousX = 0;
let previousY = 0;

const lookStatus = document.querySelector('#look-status');

function rotateView(dx, dy) {
  yaw -= dx * 0.0025;
  pitch = THREE.MathUtils.clamp(
    pitch - dy * 0.0025,
    -Math.PI / 2 + 0.05,
    Math.PI / 2 - 0.05
  );
}

renderer.domElement.addEventListener('click', () => {
  if (document.pointerLockElement === renderer.domElement) return;

  try {
    const request = renderer.domElement.requestPointerLock?.();

    request?.catch(() => {
      lookStatus.textContent = 'Drag to look around · WASD to walk';
    });
  } catch {
    lookStatus.textContent = 'Drag to look around · WASD to walk';
  }
});

document.addEventListener('pointerlockchange', () => {
  keys.clear();
  dragging = false;

  lookStatus.textContent =
    document.pointerLockElement === renderer.domElement
      ? 'Mouse to look · Esc to release cursor'
      : 'Click to look around · Drag also works';
});

document.addEventListener('pointerlockerror', () => {
  lookStatus.textContent = 'Drag to look around · WASD to walk';
});

document.addEventListener('mousemove', event => {
  if (document.pointerLockElement === renderer.domElement) {
    rotateView(event.movementX, event.movementY);
  }
});

renderer.domElement.addEventListener('pointerdown', event => {
  if (
    event.button !== 0 ||
    document.pointerLockElement === renderer.domElement
  ) {
    return;
  }

  dragging = true;
  previousX = event.clientX;
  previousY = event.clientY;
  renderer.domElement.setPointerCapture(event.pointerId);
});

renderer.domElement.addEventListener('pointermove', event => {
  if (
    !dragging ||
    document.pointerLockElement === renderer.domElement
  ) {
    return;
  }

  rotateView(
    event.clientX - previousX,
    event.clientY - previousY
  );

  previousX = event.clientX;
  previousY = event.clientY;
});

for (const name of [
  'pointerup',
  'pointercancel',
  'lostpointercapture'
]) {
  renderer.domElement.addEventListener(name, () => {
    dragging = false;
  });
}

// Apply a selected PNG without generating a checker texture.
let textureRequest = 0;

document.querySelector('#texture').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.type !== 'image/png') {
    status.textContent = 'Please choose a PNG image.';
    return;
  }

  const request = ++textureRequest;
  const url = URL.createObjectURL(file);

  try {
    const texture = await new THREE.TextureLoader().loadAsync(url);

    if (request !== textureRequest) {
      texture.dispose();
      return;
    }

    groundMaterial.map?.dispose();
    groundMaterial.map = configureTexture(texture);
    groundMaterial.color.set(0xffffff);
    groundMaterial.needsUpdate = true;

    status.textContent = `${file.name} applied to baseplate.`;
  } catch {
    if (request === textureRequest) {
      status.textContent =
        'Could not read this PNG. Please choose another image.';
    }
  } finally {
    URL.revokeObjectURL(url);
  }
});

// Game loop.
const clock = new THREE.Clock();
const direction = new THREE.Vector3();
let walkTime = 0;

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);

  const forward =
    Number(keys.has('KeyW') || keys.has('ArrowUp')) -
    Number(keys.has('KeyS') || keys.has('ArrowDown'));

  const right =
    Number(keys.has('KeyD') || keys.has('ArrowRight')) -
    Number(keys.has('KeyA') || keys.has('ArrowLeft'));

  direction.set(
    -Math.sin(yaw) * forward + Math.cos(yaw) * right,
    0,
    -Math.cos(yaw) * forward - Math.sin(yaw) * right
  );

  const moving = direction.lengthSq() > 0;

  if (moving) {
    direction.normalize();
    character.position.addScaledVector(direction, dt * 6);

    const boundary = planeSize / 2 - 0.6;
    character.position.x = THREE.MathUtils.clamp(
      character.position.x, -boundary, boundary
    );
    character.position.z = THREE.MathUtils.clamp(
      character.position.z, -boundary, boundary
    );

    walkTime += dt * 11;
  }

  for (const { arm, leg, side } of limbs) {
    const swing =
      moving && grounded ? Math.sin(walkTime) * 0.55 * side : 0;

    leg.rotation.x = THREE.MathUtils.lerp(
      leg.rotation.x,
      swing,
      Math.min(1, dt * 16)
    );

    arm.rotation.x = -leg.rotation.x;
  }

  if (!grounded) {
    verticalSpeed -= 22 * dt;
    character.position.y += verticalSpeed * dt;

    if (character.position.y <= groundY) {
      character.position.y = groundY;
      verticalSpeed = 0;
      grounded = true;
    }
  }

  character.rotation.y = yaw + Math.PI;
  camera.rotation.set(pitch, Math.PI, 0, 'YXZ');

  donut.rotation.x += dt * 0.3;
  donut.rotation.y += dt * 0.15;

  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
});

renderer.setAnimationLoop(animate);
