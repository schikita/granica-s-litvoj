// ---------- Секции / навигация ----------
const sections = Array.from(document.querySelectorAll(".page"));
const navLinks = Array.from(
  document.querySelectorAll("nav a, .btn[data-goto]")
);

let current = 0;
let transitioning = false;
let targetBarrierAngle = 0; // объявляем в начале

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const idx = Number(en.target.dataset.index);
      if (idx === current) return;
      const dir = idx > current ? +1 : -1;
      current = idx;
      setActiveNav(current);
      applySceneMode(current);
      pageFlipAnimation(dir, null);
    });
  },
  { threshold: 0.55 }
);

sections.forEach((s) => io.observe(s));

const dotsBox = document.getElementById("dots");

// Инициализация точек навигации
sections.forEach((_, i) => {
  const d = document.createElement("div");
  d.className = "dot" + (i === 0 ? " active" : "");
  d.dataset.goto = String(i);
  dotsBox.appendChild(d);
});

function setActiveNav(i) {
  document
    .querySelectorAll("nav a")
    .forEach((a) => a.classList.toggle("active", Number(a.dataset.goto) === i));
  Array.from(dotsBox.children).forEach((d, idx) =>
    d.classList.toggle("active", idx === i)
  );
}

function pageFlipAnimation(direction, done) {
  page.isVisible = true;
  page.rotation.y = direction > 0 ? 0 : Math.PI;
  page.material.alpha = 0.14;
  
  const flip = new BABYLON.Animation(
    "flip",
    "rotation.y",
    90,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  const from = page.rotation.y;
  const to = from + (direction > 0 ? Math.PI : -Math.PI);
  flip.setKeys([
    { frame: 0, value: from },
    { frame: 40, value: from + 0.15 * (to - from) },
    { frame: 80, value: to },
  ]);
  
  const ease = new BABYLON.CubicEase();
  ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
  flip.setEasingFunction(ease);
  
  const fade = new BABYLON.Animation(
    "fade",
    "material.alpha",
    90,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  fade.setKeys([
    { frame: 0, value: 0.18 },
    { frame: 50, value: 0.1 },
    { frame: 80, value: 0 },
  ]);
  
  page.animations = [flip, fade];
  const anim = scene.beginAnimation(page, 0, 80, false);
  anim.onAnimationEndObservable.addOnce(() => {
    page.isVisible = false;
    if (done) done();
  });
}

function goto(i) {
  if (i < 0 || i >= sections.length || i === current || transitioning) return;
  transitioning = true;
  const dir = i > current ? +1 : -1;
  pageFlipAnimation(dir, () => {
    current = i;
    sections[current].scrollIntoView({ behavior: "instant", block: "center" });
    setActiveNav(current);
    applySceneMode(current);
    setTimeout(() => (transitioning = false), 120);
  });
}

navLinks.forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    const idx = Number(a.dataset.goto);
    sections[idx].scrollIntoView({ behavior: "smooth", block: "center" });
  })
);

dotsBox.addEventListener("click", (e) => {
  const t = e.target;
  if (t.classList.contains("dot")) goto(Number(t.dataset.goto));
});

window.addEventListener("keydown", (e) => {
  if (["ArrowDown", "PageDown", "ArrowRight"].includes(e.key))
    goto(current + 1);
  if (["ArrowUp", "PageUp", "ArrowLeft"].includes(e.key)) 
    goto(current - 1);
});

// ---------- Babylon.js инициализация ----------
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
  antialias: true,
});

const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0.15, 0.2, 0.25, 1);
scene.collisionsEnabled = true;

// ===== НЕБО И СВЕТ =====
const sky = BABYLON.MeshBuilder.CreateSphere(
  "sky",
  { diameter: 1000, sideOrientation: BABYLON.Mesh.BACKSIDE },
  scene
);

const skyMat = new BABYLON.SkyMaterial("skyMat", scene);
skyMat.luminance = 0.95;
skyMat.rayleigh = 1.8;
skyMat.turbidity = 10.0;
skyMat.inclination = 0.08;
skyMat.azimuth = 0.2;
sky.material = skyMat;

// Улучшенное освещение с тенями
const hemi = new BABYLON.HemisphericLight(
  "hemi",
  new BABYLON.Vector3(0.3, 1, 0.5),
  scene
);
hemi.intensity = 0.7;
hemi.diffuse = new BABYLON.Color3(0.8, 0.9, 1.0);
hemi.groundColor = new BABYLON.Color3(0.2, 0.3, 0.4);

const dir = new BABYLON.DirectionalLight(
  "dir",
  new BABYLON.Vector3(-0.7, -1, -0.4),
  scene
);
dir.position = new BABYLON.Vector3(30, 40, 20);
dir.intensity = 0.8;
dir.range = 500;

// Настройка теней
dir.shadowMinZ = 1;
dir.shadowMaxZ = 500;
const shadowGen = new BABYLON.ShadowGenerator(2048, dir);
shadowGen.useBlurCloseExponentialShadowMap = true;
shadowGen.blurKernel = 16;
shadowGen.darkness = 0.3;

// Точечный свет для деталей
const pointLight = new BABYLON.PointLight("point", new BABYLON.Vector3(-5, 3, -4), scene);
pointLight.intensity = 0.3;
pointLight.range = 50;

// ===== МАТЕРИАЛЫ С КРАСИВЫМИ ЦВЕТАМИ И ЭФФЕКТАМИ =====

// Дорога - асфальт
const roadMat = new BABYLON.StandardMaterial("roadMat", scene);
roadMat.diffuseColor = new BABYLON.Color3(0.08, 0.08, 0.1);
roadMat.specularColor = new BABYLON.Color3(0.25, 0.25, 0.3);
roadMat.specularPower = 24;
roadMat.emissiveColor = new BABYLON.Color3(0.02, 0.02, 0.03);

// Травянистое поле
const fieldMat = new BABYLON.StandardMaterial("field", scene);
fieldMat.diffuseColor = new BABYLON.Color3(0.12, 0.32, 0.12);
fieldMat.specularColor = new BABYLON.Color3(0.08, 0.12, 0.08);
fieldMat.emissiveColor = new BABYLON.Color3(0.01, 0.02, 0.01);

// Обочина - песок/грунт
const shoulderMat = new BABYLON.StandardMaterial("shoulder", scene);
shoulderMat.diffuseColor = new BABYLON.Color3(0.6, 0.52, 0.42);
shoulderMat.specularColor = new BABYLON.Color3(0.12, 0.1, 0.08);
shoulderMat.emissiveColor = new BABYLON.Color3(0.02, 0.02, 0.01);

// Забор - металл
const fenceMat = new BABYLON.StandardMaterial("fenceMat", scene);
fenceMat.diffuseColor = new BABYLON.Color3(0.28, 0.26, 0.24);
fenceMat.emissiveColor = new BABYLON.Color3(0.04, 0.04, 0.04);
fenceMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
fenceMat.specularPower = 12;

// КПП - бетон
const boothMat = new BABYLON.StandardMaterial("boothMat", scene);
boothMat.diffuseColor = new BABYLON.Color3(0.38, 0.4, 0.42);
boothMat.emissiveColor = new BABYLON.Color3(0.06, 0.08, 0.1);
boothMat.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
boothMat.specularPower = 8;

// Стекло
const glassMat = new BABYLON.StandardMaterial("glassMat", scene);
glassMat.diffuseColor = new BABYLON.Color3(0.5, 0.7, 0.95);
glassMat.specularColor = new BABYLON.Color3(1, 1, 1);
glassMat.specularPower = 96;
glassMat.alpha = 0.7;

// Стволы деревьев
const trunkMat = new BABYLON.StandardMaterial("tMat", scene);
trunkMat.diffuseColor = new BABYLON.Color3(0.22, 0.14, 0.08);
trunkMat.specularColor = new BABYLON.Color3(0.05, 0.03, 0.01);
trunkMat.emissiveColor = new BABYLON.Color3(0.01, 0.005, 0.002);

// Крона деревьев
const crownMat = new BABYLON.StandardMaterial("cMat", scene);
crownMat.diffuseColor = new BABYLON.Color3(0.08, 0.35, 0.14);
crownMat.specularColor = new BABYLON.Color3(0.06, 0.1, 0.06);
crownMat.emissiveColor = new BABYLON.Color3(0.01, 0.02, 0.01);

// Полупрозрачная страница
const pageMat = new BABYLON.StandardMaterial("pageMat", scene);
pageMat.diffuseColor = new BABYLON.Color3(0.12, 0.48, 0.7);
pageMat.specularColor = new BABYLON.Color3(0.6, 0.6, 0.6);
pageMat.specularPower = 32;
pageMat.alpha = 0.14;

// ===== ГЕОМЕТРИЯ СЦЕНЫ =====

// Дорога
const road = BABYLON.MeshBuilder.CreateGround(
  "road",
  { width: 300, height: 8, subdivisions: 4 },
  scene
);
road.material = roadMat;
road.receiveShadows = true;

// Поле
const field = BABYLON.MeshBuilder.CreateGround(
  "field",
  { width: 300, height: 180, subdivisions: 4 },
  scene
);
field.position.y = -0.005;
field.material = fieldMat;
field.receiveShadows = true;

// Разметка дороги
const stripeMat = new BABYLON.StandardMaterial("stripe", scene);
stripeMat.emissiveColor = new BABYLON.Color3(0.98, 0.98, 0.98);
stripeMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);

for (let x = -86; x <= 86; x += 6) {
  const s = BABYLON.MeshBuilder.CreateBox(
    "stripe_" + x,
    { width: 2.2, height: 0.03, depth: 0.18 },
    scene
  );
  s.position.set(x, 0.012, 0);
  s.material = stripeMat;
  s.receiveShadows = true;
}

// ===== ШЛАГБАУМ =====
const baseZ = -4.8;

const barBase = BABYLON.MeshBuilder.CreateBox(
  "barBase",
  { width: 0.7, height: 1.1, depth: 0.7 },
  scene
);
barBase.position.set(0.0, 0.55, baseZ);
barBase.material = boothMat;
barBase.castShadows = true;
barBase.receiveShadows = true;

const pivot = new BABYLON.TransformNode("pivot", scene);
pivot.position = new BABYLON.Vector3(0.0, 1.05, baseZ);

const barPole = BABYLON.MeshBuilder.CreateBox(
  "barPole",
  { width: 0.22, height: 0.18, depth: 8.6 },
  scene
);
barPole.setParent(pivot);
barPole.position.z = 4.3;
barPole.position.y = 0.1;

const poleMat = new BABYLON.StandardMaterial("pole", scene);
poleMat.diffuseColor = new BABYLON.Color3(0.95, 0.25, 0.25);
poleMat.emissiveColor = new BABYLON.Color3(0.3, 0.08, 0.08);
poleMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
barPole.material = poleMat;
barPole.castShadows = true;

// Элементы на барьере для визуальности
const stripeCount = 10;
for (let i = 0; i < stripeCount; i++) {
  const stripe = BABYLON.MeshBuilder.CreateBox(
    "barStripe_" + i,
    { width: 0.24, height: 0.04, depth: 0.4 },
    scene
  );
  stripe.position.z = -4 + (i * 8 / stripeCount);
  stripe.position.y = 0.04;
  
  const stripeMat2 = new BABYLON.StandardMaterial("barStripe" + i, scene);
  stripeMat2.diffuseColor = i % 2 === 0 
    ? new BABYLON.Color3(1, 1, 1) 
    : new BABYLON.Color3(0.95, 0.25, 0.25);
  stripeMat2.emissiveColor = new BABYLON.Color3(0.15, 0.15, 0.15);
  stripe.material = stripeMat2;
  stripe.parent = barPole;
  stripe.castShadows = true;
}

// ===== КПП И ЗАБОР =====

// Будка охраны
const booth = BABYLON.MeshBuilder.CreateBox(
  "booth",
  { width: 2.3, height: 2.3, depth: 2.3 },
  scene
);
booth.position.set(4, 1.15, -5.5);
booth.material = boothMat;
booth.castShadows = true;
booth.receiveShadows = true;

// Крыша будки со скатом
const roofMat = new BABYLON.StandardMaterial("roofMat", scene);
roofMat.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.25);
roofMat.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);

const roof = BABYLON.MeshBuilder.CreateBox(
  "roof",
  { width: 2.6, height: 0.25, depth: 2.6 },
  scene
);
roof.position.set(4, 2.4, -5.5);
roof.material = roofMat;
roof.castShadows = true;

// Окна будки - улучшены
for (const offsetZ of [-0.9, 0.9]) {
  const window = BABYLON.MeshBuilder.CreateBox(
    "window_" + offsetZ,
    { width: 0.1, height: 1.0, depth: 1.1 },
    scene
  );
  window.position.set(4.85, 1.15, offsetZ - 5.5);
  window.material = glassMat;
  window.receiveShadows = true;
  
  // Рама окна
  const frameMat = new BABYLON.StandardMaterial("frame_" + offsetZ, scene);
  frameMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
  frameMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  
  const frameThickness = 0.08;
  const frames = [];
  
  // Вертикальные линии
  for (let i = -1; i <= 1; i += 2) {
    const vFrame = BABYLON.MeshBuilder.CreateBox(
      "vFrame_" + i + "_" + offsetZ,
      { width: frameThickness, height: 1.0, depth: frameThickness },
      scene
    );
    vFrame.position.set(4.85 + i * 0.45, 1.15, offsetZ - 5.5);
    vFrame.material = frameMat;
    vFrame.castShadows = true;
  }
  
  // Горизонтальные линии
  for (let i = -1; i <= 1; i += 2) {
    const hFrame = BABYLON.MeshBuilder.CreateBox(
      "hFrame_" + i + "_" + offsetZ,
      { width: frameThickness, height: frameThickness, depth: 1.0 },
      scene
    );
    hFrame.position.set(4.85, 1.15 + i * 0.35, offsetZ - 5.5);
    hFrame.material = frameMat;
    hFrame.castShadows = true;
  }
}

// ===== ЗАБОР И КОЛЮЧАЯ ПРОВОЛОКА =====

const fenceY = 0.9;
const fenceH = 1.9;
const roadWidth = 8;
const fenceLength = 65;

function createFence(zStart, zEnd, x, segments = 1) {
  const length = Math.abs(zEnd - zStart);
  const segmentLength = length / segments;
  
  for (let seg = 0; seg < segments; seg++) {
    const z1 = zStart + (seg * segmentLength);
    const z2 = zStart + ((seg + 1) * segmentLength);
    
    const fence = BABYLON.MeshBuilder.CreateBox(
      `fence_${seg}_${x}`,
      { width: 0.15, height: fenceH, depth: segmentLength },
      scene
    );
    fence.position.set(x, fenceY, (z1 + z2) / 2);
    fence.material = fenceMat;
    fence.castShadows = true;
    fence.receiveShadows = true;
  }
}

// Левый забор
createFence(-fenceLength, -roadWidth / 2 - 1.2, -6.8, 4);
createFence(roadWidth / 2 + 3.2, fenceLength, -6.8, 4);

// Правый забор
createFence(-fenceLength, -roadWidth / 2 - 1.2, 6.8, 4);
createFence(roadWidth / 2 + 3.2, fenceLength, 6.8, 4);

// Столбы забора
const postMat = new BABYLON.StandardMaterial("postMat", scene);
postMat.diffuseColor = new BABYLON.Color3(0.25, 0.22, 0.2);
postMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

function createFencePosts(zStart, zEnd, x, spacing = 8) {
  for (let z = zStart; z <= zEnd; z += spacing) {
    const post = BABYLON.MeshBuilder.CreateCylinder(
      `post_${z}_${x}`,
      { height: fenceH, diameter: 0.12, tessellation: 8 },
      scene
    );
    post.position.set(x, fenceY, z);
    post.material = postMat;
    post.castShadows = true;
  }
}

createFencePosts(-fenceLength, -roadWidth / 2 - 1, -6.8);
createFencePosts(roadWidth / 2 + 3, fenceLength, -6.8);
createFencePosts(-fenceLength, -roadWidth / 2 - 1, 6.8);
createFencePosts(roadWidth / 2 + 3, fenceLength, 6.8);

// Колючая проволока (оптимизирована)
const wireMat = new BABYLON.StandardMaterial("wireMat", scene);
wireMat.diffuseColor = new BABYLON.Color3(0.3, 0.28, 0.28);
wireMat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);

function addBarbedWire(zStart, zEnd, x, height = 1.95, step = 3) {
  for (let z = zStart; z < zEnd; z += step) {
    const wire = BABYLON.MeshBuilder.CreateTube(
      `wire_${z}_${x}`,
      {
        path: [
          new BABYLON.Vector3(x, fenceY + height, z),
          new BABYLON.Vector3(x, fenceY + height, z + step),
        ],
        radius: 0.025,
        updatable: false,
      },
      scene
    );
    wire.material = wireMat;
    wire.castShadows = true;
  }
}

addBarbedWire(-fenceLength, -roadWidth / 2 - 1, -6.8);
addBarbedWire(roadWidth / 2 + 1, fenceLength, -6.8);
addBarbedWire(-fenceLength, -roadWidth / 2 - 1, 6.8);
addBarbedWire(roadWidth / 2 + 1, fenceLength, 6.8);

// ===== ОБОЧИНЫ =====

const shoulderWidth = 3.2;
const roadLength = 200;

const leftShoulder = BABYLON.MeshBuilder.CreateGround(
  "leftShoulder",
  { width: roadLength, height: shoulderWidth, subdivisions: 4 },
  scene
);
leftShoulder.material = shoulderMat;
leftShoulder.position.set(0, 0.003, -(roadWidth / 2 + shoulderWidth / 2));
leftShoulder.receiveShadows = true;

const rightShoulder = BABYLON.MeshBuilder.CreateGround(
  "rightShoulder",
  { width: roadLength, height: shoulderWidth, subdivisions: 4 },
  scene
);
rightShoulder.material = shoulderMat;
rightShoulder.position.set(0, 0.003, roadWidth / 2 + shoulderWidth / 2);
rightShoulder.receiveShadows = true;

// ===== ЛЕСОПОЛОСА С ИНСТАНСИРОВАНИЕМ =====

const trunk = BABYLON.MeshBuilder.CreateCylinder(
  "trunk",
  { height: 1, diameterTop: 0.8, diameterBottom: 1, tessellation: 6 },
  scene
);
trunk.material = trunkMat;
trunk.castShadows = true;

const crown = BABYLON.MeshBuilder.CreateCylinder(
  "crown",
  { height: 1, diameterTop: 0.0, diameterBottom: 1.8, tessellation: 8 },
  scene
);
crown.material = crownMat;
crown.castShadows = true;

function addWideForest(side = 1, width = 80, count = 800) {
  for (let i = 0; i < count; i++) {
    const x = -130 + Math.random() * 260;
    const z = side * (6.5 + Math.random() * width);
    const th = 1.5 + Math.random() * 2.0;
    const cr = th * 1.2;

    const trScale = new BABYLON.Vector3(
      0.12 + Math.random() * 0.06,
      th,
      0.12 + Math.random() * 0.06
    );
    const crScale = new BABYLON.Vector3(
      1.0 + Math.random() * 0.5,
      cr,
      1.0 + Math.random() * 0.5
    );

    const trPos = new BABYLON.Vector3(x, th / 2, z);
    const crPos = new BABYLON.Vector3(x, th + cr / 2, z);
    const I = BABYLON.Quaternion.Identity();

    trunk.thinInstanceAdd(BABYLON.Matrix.Compose(trScale, I, trPos));
    crown.thinInstanceAdd(BABYLON.Matrix.Compose(crScale, I, crPos));
  }
}

addWideForest(+1, 95, 1200);
addWideForest(-1, 95, 1200);

trunk.setEnabled(true);
crown.setEnabled(true);

// ===== ФУРЫ (ГРУЗОВИКИ) =====

function hsvToColor3(h, s, v) {
  h = ((h % 1) + 1) % 1;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  
  let r, g, b;
  switch (i % 6) {
    case 0:
      [r, g, b] = [v, t, p];
      break;
    case 1:
      [r, g, b] = [q, v, p];
      break;
    case 2:
      [r, g, b] = [p, v, t];
      break;
    case 3:
      [r, g, b] = [p, q, v];
      break;
    case 4:
      [r, g, b] = [t, p, v];
      break;
    case 5:
      [r, g, b] = [v, p, q];
      break;
  }
  return new BABYLON.Color3(r, g, b);
}

function createTruck(scene, color) {
  const root = new BABYLON.TransformNode("truckRoot", scene);
  const trailerLen = 4.3;
  const cabLen = 1.2;
  const bodyH = 1.25;
  const bodyW = 1.8;
  const wheelR = 0.4;
  const wheelT = 0.38;
  const yBody = wheelR + bodyH / 2;

  // Кузов
  const bodyMat = new BABYLON.StandardMaterial("bodyMat_" + Math.random(), scene);
  bodyMat.diffuseColor = color;
  bodyMat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
  bodyMat.emissiveColor = new BABYLON.Color3(0.05, 0.15, 0.25);

  const trailer = BABYLON.MeshBuilder.CreateBox(
    "trailer_" + Math.random(),
    { width: trailerLen, height: bodyH, depth: bodyW },
    scene
  );
  trailer.material = bodyMat;
  trailer.parent = root;
  trailer.position.set(-cabLen / 2, yBody, 0);
  trailer.castShadows = true;
  trailer.receiveShadows = true;

  // Кабина
  const cab = BABYLON.MeshBuilder.CreateBox(
    "cab_" + Math.random(),
    { width: cabLen, height: bodyH * 0.95, depth: bodyW * 0.92 },
    scene
  );
  cab.material = bodyMat.clone("cabMat_" + Math.random());
  cab.parent = root;
  cab.position.set(trailerLen / 2, yBody * 0.98, 0);
  cab.castShadows = true;
  cab.receiveShadows = true;

  // Окно кабины
  const glass = BABYLON.MeshBuilder.CreateBox(
    "glass_" + Math.random(),
    { width: cabLen * 0.58, height: bodyH * 0.42, depth: bodyW * 0.75 },
    scene
  );
  glass.parent = cab;
  glass.position.set(cabLen * 0.12, bodyH * 0.15, 0);
  glass.material = glassMat;
  glass.castShadows = true;

  // Колёса
  const wheelMat = new BABYLON.StandardMaterial("w_" + Math.random(), scene);
  wheelMat.diffuseColor = new BABYLON.Color3(0.08, 0.08, 0.1);
  wheelMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);

  const wheelZ = bodyW / 2 - 0.24;
  const xPositions = [-1.7, -0.25, 1.9];
  
  for (const x of xPositions) {
    for (const side of [-1, 1]) {
      const w = BABYLON.MeshBuilder.CreateCylinder(
        `wheel_${x}_${side}`,
        { diameter: wheelR * 2, height: wheelT, tessellation: 12 },
        scene
      );
      w.parent = root;
      w.material = wheelMat;
      w.rotation.z = Math.PI / 2;
      w.position.set(x, wheelR, side * wheelZ);
      w.castShadows = true;
      w.receiveShadows = true;
    }
  }

  return { root };
}

const trucks = [];
const SHOULDER_Z = 5.5;

for (let i = 0; i < 28; i++) {
  const hue = (0.55 + (i % 8) * 0.04) % 1;
  const col = hsvToColor3(hue, 0.65, 0.95);
  const t = createTruck(scene, col);
  const gap = 5.2 + Math.random() * 2.8;
  t.root.position.set(-85 + i * gap, 0, SHOULDER_Z);
  
  if (i % 9 === 0) {
    const t2 = createTruck(scene, hsvToColor3((hue + 0.12) % 1, 0.55, 0.88));
    t2.root.position.set(t.root.position.x - 1.8, 0, SHOULDER_Z + 1.5);
    trucks.push(t2);
  }
  trucks.push(t);
}

// ===== КАМЕРА И ВИД =====

const droneRig = new BABYLON.TransformNode("droneRig", scene);
const camera = new BABYLON.UniversalCamera(
  "drone",
  new BABYLON.Vector3(-40, 8, 6.5),
  scene
);
camera.minZ = 0.1;
camera.maxZ = 1000;
camera.fov = 0.85;
camera.parent = droneRig;
scene.activeCamera = camera;

// ===== ПОЛУПРОЗРАЧНАЯ СТРАНИЦА =====

const page = BABYLON.MeshBuilder.CreatePlane(
  "page",
  { width: 38, height: 23 },
  scene
);
page.position.set(0, 6, 0);
page.material = pageMat;
page.isVisible = false;

// ===== ПАРАМЕТРЫ ДВИЖЕНИЯ =====

const droneAnchors = [-60, -20, 0, 40];
const WORLD_MIN_X = -95;
const WORLD_MAX_X = 95;

let droneX = WORLD_MIN_X;
let droneTargetX = WORLD_MIN_X;

function updateDroneTargetFromScroll() {
  const doc = document.documentElement;
  const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
  const p = Math.min(1, Math.max(0, window.scrollY / maxScroll));
  droneTargetX = WORLD_MIN_X + (WORLD_MAX_X - WORLD_MIN_X) * p;
}

window.addEventListener("scroll", updateDroneTargetFromScroll, {
  passive: true,
});
window.addEventListener("resize", updateDroneTargetFromScroll);
updateDroneTargetFromScroll();

// ===== СЦЕНЫ И АНИМАЦИИ =====

function applySceneMode(i) {
  switch (i) {
    case 0: // hero
      targetBarrierAngle = 0;
      setMetrics(6, 35, 1.2);
      break;
    case 1: // problem
      targetBarrierAngle = 0;
      setMetrics(14, 12, 6.8);
      break;
    case 2: // solution
      targetBarrierAngle = -Math.PI / 2;
      setMetrics(5, 38, 0.9);
      break;
    case 3: // result
      targetBarrierAngle = -Math.PI / 2;
      setMetrics(3, 45, 0.2, true);
      break;
  }
}

function animateNumber(el, to, ms = 600) {
  const start = performance.now();
  const from = Number((el.textContent || "0").replace(",", ".")) || 0;
  const diff = to - from;
  
  function tick(t) {
    const k = Math.min(1, (t - start) / ms);
    el.textContent = (from + diff * (1 - Math.pow(1 - k, 3)))
      .toFixed(1)
      .replace(".", ",");
    if (k < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function setMetrics(waitH, throughput, queueKm, also = false) {
  const m1 = document.getElementById("m1");
  const m2 = document.getElementById("m2");
  const m3 = document.getElementById("m3");
  
  if (m1 && m2 && m3) {
    animateNumber(m1, waitH);
    animateNumber(m2, throughput);
    animateNumber(m3, queueKm);
  }
  
  if (also) {
    const r1 = document.getElementById("r1");
    const r2 = document.getElementById("r2");
    const r3 = document.getElementById("r3");
    
    if (r1 && r2 && r3) {
      animateNumber(r1, waitH);
      animateNumber(r2, throughput);
      animateNumber(r3, queueKm);
    }
  }
}

// ===== ГЛАВНОЙ ЦИКЛ РЕНДЕРА =====

scene.onBeforeRenderObservable.add(() => {
  const dt = engine.getDeltaTime() / 1000;

  // Инерция дрона при прокрутке
  droneX += (droneTargetX - droneX) * Math.min(1, dt * 3.5);

  // Барьер поднимается/опускается
  const rot = pivot.rotation || (pivot.rotation = new BABYLON.Vector3());
  rot.x += (targetBarrierAngle - rot.x) * Math.min(1, dt * 5.5);

  // Позиция камеры-дрона
  const pos = new BABYLON.Vector3(droneX, 8.5, SHOULDER_Z + -11);
  droneRig.position.copyFrom(pos);
  camera.rotation.set(0.28, Math.PI / 2.05, 0);
});

applySceneMode(0);
sections[0].scrollIntoView({ behavior: "instant", block: "center" });

// Запуск рендера
engine.runRenderLoop(() => scene.render());

window.addEventListener("resize", () => engine.resize());