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
    goto(idx);
  })
);

dotsBox.addEventListener("click", (e) => {
  const t = e.target;
  if (t.classList.contains("dot")) goto(Number(t.dataset.goto));
});

window.addEventListener("keydown", (e) => {
  if (["ArrowDown", "PageDown", "ArrowRight"].includes(e.key))
    goto(current + 1);
  if (["ArrowUp", "PageUp", "ArrowLeft"].includes(e.key)) goto(current - 1);
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
// === SKYBOX (правильный) ===
var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);

var skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMat", scene);
skyboxMaterial.backFaceCulling = false;
skyboxMaterial.disableLighting = true;

skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(
    "assets/img/textures/skybox/skybox",
    scene
);
skyboxMaterial.reflectionTexture.coordinatesMode =
    BABYLON.Texture.SKYBOX_MODE;

skybox.material = skyboxMaterial;


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
const pointLight = new BABYLON.PointLight(
  "point",
  new BABYLON.Vector3(-5, 3, -4),
  scene
);
pointLight.intensity = 0.3;
pointLight.range = 50;

// ===== МАТЕРИАЛЫ С КРАСИВЫМИ ЦВЕТАМИ И ЭФФЕКТАМИ =====

// Дорога - асфальт
const roadMat = new BABYLON.StandardMaterial("roadMat", scene);
roadMat.diffuseColor = new BABYLON.Color3(0.08, 0.08, 0.1);
roadMat.specularColor = new BABYLON.Color3(0.25, 0.25, 0.3);
roadMat.specularPower = 24;
roadMat.emissiveColor = new BABYLON.Color3(0.02, 0.02, 0.03);

// Травянистое поле с фото-текстурой
const fieldMat = new BABYLON.StandardMaterial("field", scene);
fieldMat.diffuseTexture = new BABYLON.Texture(
  "assets/img/textures/grade.jpg",
  scene
);
fieldMat.diffuseTexture.uScale = 6;
fieldMat.diffuseTexture.vScale = 6;
fieldMat.specularColor = new BABYLON.Color3(0.08, 0.12, 0.08);
fieldMat.emissiveColor = new BABYLON.Color3(0.01, 0.02, 0.01);

// Обочина - песок/грунт
const shoulderTexture = new BABYLON.Texture(
  "assets/img/textures/shoulder.jpg",
  scene
);
shoulderTexture.uScale = 10;
shoulderTexture.vScale = 1;

const shoulderMat = new BABYLON.StandardMaterial("shoulderMat", scene);
shoulderMat.diffuseTexture = shoulderTexture;
shoulderMat.specularColor = new BABYLON.Color3(0, 0, 0);

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

const crownTexMat = new BABYLON.StandardMaterial("crownTexMat", scene);
crownTexMat.diffuseTexture = new BABYLON.Texture(
  "assets/img/textures/el.jpg",
  scene
);
crownTexMat.diffuseTexture.hasAlpha = true;
crownTexMat.opacityTexture = crownTexMat.diffuseTexture;
crownTexMat.useAlphaFromDiffuseTexture = true;
crownTexMat.alpha = 1;
crownTexMat.backFaceCulling = false;

function createRealHedgehog(x, z) {
  const hedgehog = new BABYLON.TransformNode("hedgehog", scene);

  const beamMaterial = new BABYLON.StandardMaterial("hedgeMat", scene);
  beamMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.22);
  beamMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  beamMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.05);

  // Текстура ржавчины
  beamMaterial.diffuseTexture = new BABYLON.Texture(
    "assets/img/textures/metal_rust.jpg",
    scene
  );
  beamMaterial.bumpTexture = new BABYLON.Texture(
    "assets/img/textures/metal_rust_norm.png",
    scene
  );
  beamMaterial.diffuseTexture.uScale = 1.2;
  beamMaterial.diffuseTexture.vScale = 1.2;

  const beamLength = 3.8;
  const beamThickness = 0.25;

  function makeBeam(name) {
    const b = BABYLON.MeshBuilder.CreateBox(
      name,
      {
        width: beamLength,
        height: beamThickness,
        depth: beamThickness,
      },
      scene
    );
    b.material = beamMaterial;
    b.parent = hedgehog;
    b.castShadows = true;
    return b;
  }

  const b1 = makeBeam("beam1");
  b1.rotation.z = Math.PI / 2;

  const b2 = makeBeam("beam2");
  b2.rotation.x = Math.PI / 2;

  const b3 = makeBeam("beam3");
  b3.rotation.y = Math.PI / 2;
  b3.rotation.z = Math.PI / 4;

  hedgehog.position.set(x, 0.3, z);
  hedgehog.scaling = new BABYLON.Vector3(1, 1, 1);

  return hedgehog;
}

function createConcreteBlock(x, z) {
  const mat = new BABYLON.StandardMaterial("concreteMat", scene);
  mat.diffuseColor = new BABYLON.Color3(0.55, 0.55, 0.55);

  const block = BABYLON.MeshBuilder.CreateBox(
    "concreteBlock",
    { width: 2.5, height: 1.3, depth: 1.2 },
    scene
  );
  block.position.set(x, 0.65, z);
  block.material = mat;
  block.rotation.y = -Math.PI / 2;
}

function createMGpost(x, z) {
  const root = new BABYLON.TransformNode("mgPostRoot", scene);

  const sandMat = new BABYLON.StandardMaterial("sandbagMat", scene);
  sandMat.diffuseColor = new BABYLON.Color3(0.75, 0.7, 0.6);

  // мешки
  for (let i = -2; i <= 2; i++) {
    const bag = BABYLON.MeshBuilder.CreateCylinder(
      "bag",
      { height: 0.4, diameter: 0.9, tessellation: 6 },
      scene
    );
    bag.position.set(i * 0.9, 0.2, 0);
    bag.material = sandMat;
    bag.parent = root;
  }

  // ствол пулемета
  const barrel = BABYLON.MeshBuilder.CreateBox(
    "mgBarrel",
    { width: 0.1, height: 0.1, depth: 1.3 },
    scene
  );
  barrel.position.set(0, 0.8, 0.6);
  barrel.material = new BABYLON.StandardMaterial("gunMat", scene);
  barrel.material.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  barrel.parent = root;

  // размещаем пост
  root.position.set(x, 0, z);

  // ПОВОРОТ НА 90 ГРАДУСОВ
  root.rotation.y = -Math.PI / 2; // ← вот это
}

const X = 100; // центр дороги (у тебя всё сдвинуто на +100)
const Z1 = 0; // бетонные блоки
const Z2 = 0; // ежи
const Z3 = 0; // пулеметный расчет

// Бетонные плиты (первый ряд)
createConcreteBlock(X + 6, Z1 - 3);
createConcreteBlock(X + 8, Z1 + 3);

// Ёжики (второй ряд)
createRealHedgehog(X - 10, Z2);
createRealHedgehog(X - 8, Z2 - 2);
createRealHedgehog(X - 6, Z2 + 2);

// Пулемётный расчет (за ежами)
createMGpost(X + 8, Z3);

// === ТЕКСТУРА ХВОИ ===
const pineLeafMat = new BABYLON.StandardMaterial("pineLeafMat", scene);
pineLeafMat.diffuseTexture = new BABYLON.Texture(
  "assets/img/textures/needles.jpg",
  scene
);
pineLeafMat.diffuseTexture.uScale = 1.5;
pineLeafMat.diffuseTexture.vScale = 1.5;

pineLeafMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
pineLeafMat.emissiveColor = new BABYLON.Color3(0.02, 0.05, 0.02);
pineLeafMat.backFaceCulling = false; // видно с обеих сторон

function createBillboardTree(size = 6) {
  const tree = BABYLON.MeshBuilder.CreatePlane(
    "billboardTree",
    { width: size, height: size * 1.2 },
    scene
  );

  tree.material = crownTexMat;
  tree.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  tree.position.y = size * 0.6;
  tree.receiveShadows = true;
  tree.castShadows = true;

  return tree;
}

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
  { width: 300, height: 200, subdivisions: 4 }, // было 180
  scene
);

field.position.y = -0.005;
field.material = fieldMat;
field.receiveShadows = true;

// Разметка дороги
const stripeMat = new BABYLON.StandardMaterial("stripe", scene);
stripeMat.emissiveColor = new BABYLON.Color3(0.98, 0.98, 0.98);
stripeMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);

for (let x = -100; x <= 100; x += 6) {
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
barBase.position.set(100.0, 0.55, baseZ);
barBase.material = boothMat;
barBase.castShadows = true;
barBase.receiveShadows = true;

const pivot = new BABYLON.TransformNode("pivot", scene);
pivot.position = new BABYLON.Vector3(100.0, 1.05, baseZ);

const barPole = BABYLON.MeshBuilder.CreateBox(
  "barPole",
  { width: 0.22, height: 0.18, depth: 8.6 },
  scene
);
barPole.setParent(pivot);
barPole.position.x = 0.0;
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
  stripe.position.z = -4 + (i * 8) / stripeCount;
  stripe.position.y = 0.04;

  const stripeMat2 = new BABYLON.StandardMaterial("barStripe" + i, scene);
  stripeMat2.diffuseColor =
    i % 2 === 0
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
booth.position.set(104, 1.15, -5.5);
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
roof.position.set(104, 2.4, -5.5);
roof.material = roofMat;
roof.castShadows = true;

// Окна будки - улучшены
for (const offsetZ of [-0.9, 0.9]) {
  const window = BABYLON.MeshBuilder.CreateBox(
    "window_" + offsetZ,
    { width: 0.1, height: 1.0, depth: 1.1 },
    scene
  );
  window.position.set(104.85, 1.15, offsetZ - 5.5);
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
    vFrame.position.set(104.85 + i * 0.45, 1.15, offsetZ - 5.5);
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
    hFrame.position.set(104.85, 1.15 + i * 0.35, offsetZ - 5.5);
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
    const z1 = zStart + seg * segmentLength;
    const z2 = zStart + (seg + 1) * segmentLength;

    const fence = BABYLON.MeshBuilder.CreateBox(
      `fence_${seg}_${x}`,
      { width: 0.15, height: fenceH, depth: segmentLength },
      scene
    );
    fence.position.set(x + 100, fenceY, (z1 + z2) / 2);
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
    post.position.set(x + 100, fenceY, z);
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
          new BABYLON.Vector3(x + 100, fenceY + height, z),
          new BABYLON.Vector3(x + 100, fenceY + height, z + step),
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

// ===== ПОЛУПРОЗРАЧНАЯ СТРАНИЦА =====

const page = BABYLON.MeshBuilder.CreatePlane(
  "page",
  { width: 38, height: 23 },
  scene
);
page.position.set(0, 6, 0);
page.material = pageMat;
page.isVisible = false;

const PARKING_X_START = -50;
const PARKING_Z_START = 20;
const parkingWidth = 40; // ← заменишь на свои
const parkingDepth = 20; // ← заменишь на свои

const parkingMinX = PARKING_X_START;
const parkingMaxX = PARKING_X_START + parkingWidth;

const parkingMinZ = PARKING_Z_START;
const parkingMaxZ = PARKING_Z_START + parkingDepth;

// ===== АСФАЛЬТ ПОД ПАРКОВКОЙ =====
const parkingAsphaltMat = new BABYLON.StandardMaterial(
  "parkingAsphaltMat",
  scene
);
parkingAsphaltMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
parkingAsphaltMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
parkingAsphaltMat.emissiveColor = new BABYLON.Color3(0.02, 0.02, 0.02);

const parkingGround = BABYLON.MeshBuilder.CreateGround(
  "parkingGround",
  { width: parkingWidth, height: parkingDepth },
  scene
);
parkingGround.position.set(
  PARKING_X_START + parkingWidth / 2,
  0.004,
  PARKING_Z_START + parkingDepth / 2
);
parkingGround.material = parkingAsphaltMat;
parkingGround.receiveShadows = true;

// ===== ДОРОГА К ПАРКОВКЕ =====

const accessRoadMat = new BABYLON.StandardMaterial("accessRoadMat", scene);
accessRoadMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.12);
accessRoadMat.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);

const accessRoadWidth = 8; // ширина съезда
const accessRoadLength = PARKING_Z_START; // от 0 до начала парковки (20)

const accessRoad = BABYLON.MeshBuilder.CreateGround(
  "accessRoad",
  { width: accessRoadLength, height: accessRoadWidth },
  scene
);

accessRoad.rotation.y = Math.PI / 2; // делаем направление вдоль Z
accessRoad.position.set(
  PARKING_X_START + parkingWidth / 2, // центр парковки по X
  0.002,
  accessRoadLength / 1.3 // половина длины
);

accessRoad.material = accessRoadMat;
accessRoad.receiveShadows = true;

// ===== ЛЕСОПОЛОСА (LOW-POLY ЁЛКИ) =====

// можно добавить легкую текстуру: pineLeafMat.diffuseTexture = new Texture(...);

// создаём один прототип ёлки из геометрии и потом инстансим
function createPinePrototype(name = "pinePrototype") {
  const parts = [];

  // Ствол
  const trunkMesh = BABYLON.MeshBuilder.CreateCylinder(
    name + "_trunk",
    {
      height: 1.6,
      diameterTop: 0.26,
      diameterBottom: 0.32,
      tessellation: 6, // low-poly
    },
    scene
  );
  trunkMesh.material = trunkMat;
  trunkMesh.position.y = 0.8;
  parts.push(trunkMesh);

  // Кроны (несколько "юбок", как на рефе)
  const levels = 4;
  for (let i = 0; i < levels; i++) {
    const h = 1.0; // высота яруса
    const bottom = 1.9 - i * 0.35; // диаметр снизу
    const top = 0.05; // почти конус
    const cone = BABYLON.MeshBuilder.CreateCylinder(
      `${name}_cone_${i}`,
      {
        height: h,
        diameterTop: top,
        diameterBottom: bottom,
        tessellation: 8, // гранёная форма
      },
      scene
    );
    cone.material = pineLeafMat;
    cone.position.y = 1.1 + i * 0.7; // поднимаем выше ствола
    parts.push(cone);
  }

  const pine = BABYLON.Mesh.MergeMeshes(
    parts,
    true, // disposeSource
    true, // allow32BitsIndices
    undefined,
    false,
    true // subdivideWithSubMeshes
  );

  pine.receiveShadows = true;
  pine.castShadows = true;
  pine.name = name;
  return pine;
}

const pinePrototype = createPinePrototype();
pinePrototype.setEnabled(false); // сам прототип не отображаем

// вспомогательная функция спавна ёлки
function spawnPine(x, z, scale = 1.0) {
  const inst = pinePrototype.createInstance(
    "pine_" + Math.random().toString(36).slice(2)
  );
  inst.position.set(x, 0, z);
  inst.scaling = new BABYLON.Vector3(scale, scale, scale);

  // лёгкий рандомный разворот
  inst.rotation.y = Math.random() * Math.PI * 2;
  return inst;
}

// ограничиваем Z в границах поля (field: height = 180 => -90..90)
function clampFieldZ(z) {
  const minZ = -90;
  const maxZ = 90;
  return Math.max(minZ, Math.min(maxZ, z));
}

const accessRoadMinX = PARKING_X_START + parkingWidth / 2 - accessRoadWidth / 2;
const accessRoadMaxX = PARKING_X_START + parkingWidth / 2 + accessRoadWidth / 2;
const accessRoadMinZ = 0;
const accessRoadMaxZ = accessRoadLength * 1.05;

// основной лес
function addWideForest(side = 1, width = 80, count = 600) {
  for (let i = 0; i < count; i++) {
    const x = -130 + Math.random() * 260;

    // Пропускаем деревья между заборами (x от -10 до 10)
    if (x > 85 && x < 105) continue;

    // Сначала вычисляем z
    let z = side * (6.5 + Math.random() * width);
    z = clampFieldZ(z);

    // Теперь можно проверять парковку
    const inParking =
      x > parkingMinX && x < parkingMaxX && z > parkingMinZ && z < parkingMaxZ;

    if (inParking) continue;

    const inAccessRoad =
      x > accessRoadMinX &&
      x < accessRoadMaxX &&
      z > accessRoadMinZ &&
      z < accessRoadMaxZ;

    if (inAccessRoad) continue;

    const scale = 0.6 + Math.random() * 0.7;
    spawnPine(x, z, scale);
  }
}

// вызываем по обе стороны
addWideForest(+1, 95, 1500);
addWideForest(-1, 95, 1500);

function createTreeWallX(x, startZ, endZ, count = 300) {
  for (let i = 0; i < count; i++) {
    // Равномерное распределение по Z
    const z = startZ + (endZ - startZ) * (i / count);

    // Лёгкая рандомизация
    const offsetZ = (Math.random() - 0.5) * 2;
    const offsetX = (Math.random() - 0.5) * 2;

    const scale = 0.9 + Math.random() * 0.3;

    spawnPine(x + offsetX, z + offsetZ, scale);
  }
}

// Создаем плотную лесную стенку на дальнем горизонте
// ЛЕВАЯ стена леса
createTreeWallX(-135, -120, 120, 350);
createTreeWallX(-138, -120, 120, 250); 
createTreeWallX(-142, -120, 120, 200);

// ПРАВАЯ стена леса
createTreeWallX(135, -120, 120, 350);
createTreeWallX(138, -120, 120, 250);
createTreeWallX(142, -120, 120, 200);



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
  const bodyMat = new BABYLON.StandardMaterial(
    "bodyMat_" + Math.random(),
    scene
  );
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

// Парковка слева (отдельная стоянка)

let truckIndex = 0;
for (let row = 0; row < 4; row++) {
  for (let col = 0; col < 7; col++) {
    const hue = (0.55 + (truckIndex % 8) * 0.04) % 1;
    const col_color = hsvToColor3(hue, 0.65, 0.95);
    const t = createTruck(scene, col_color);

    // Расставляем в виде парковки (рядами)
    const x = PARKING_X_START + col * 6.5;
    const z = PARKING_Z_START + row * 3.2;
    t.root.position.set(x, 0, z);

    trucks.push(t);
    truckIndex++;
  }
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
  const pos = new BABYLON.Vector3(droneX, 8.5, -5.5);
  droneRig.position.copyFrom(pos);
  camera.rotation.set(0.28, Math.PI / 2.05, 0);
});

applySceneMode(0);
sections[0].scrollIntoView({ behavior: "instant", block: "center" });

// Запуск рендера
engine.runRenderLoop(() => scene.render());

window.addEventListener("resize", () => engine.resize());


window.addEventListener("load", () => {
    const pre = document.getElementById("preloader");
    pre.style.opacity = "0";

    setTimeout(() => {
        pre.style.display = "none";
    }, 500);
});

// Элементы
const btnOpen = document.getElementById("nav-toggle");
const btnClose = document.getElementById("nav-close");
const mobileNav = document.getElementById("mobile-nav");
const overlay = document.getElementById("mobile-menu-overlay");

// Копируем пункты меню из desktop в mobile
const desktopItems = document.querySelectorAll(".nav-list li a");
const mobileMenu = document.getElementById("mobile-nav-menu");

desktopItems.forEach(item => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = item.getAttribute("href");
    a.textContent = item.textContent;
    li.appendChild(a);
    mobileMenu.appendChild(li);
});

// Открыть меню
btnOpen.addEventListener("click", () => {
    document.querySelector(".site-header").classList.add("menu-open");
    mobileNav.classList.add("open");
    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
});


// Закрыть меню
function closeMenu() {
    document.querySelector(".site-header").classList.remove("menu-open");
    mobileNav.classList.remove("open");
    overlay.classList.remove("show");
    document.body.style.overflow = "";
}


btnClose.addEventListener("click", closeMenu);
overlay.addEventListener("click", closeMenu);

// Easing-функция (чтобы движение было плавным, как в iPhone)
function easeInOutQuad(t) {
    return t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Плавный скролл с кастомным easing
function smoothScrollTo(targetY, duration = 900) {
    const startY = window.scrollY;
    const diff = targetY - startY;
    let start;

    function step(timestamp) {
        if (!start) start = timestamp;
        const time = timestamp - start;
        const progress = Math.min(time / duration, 1);
        const eased = easeInOutQuad(progress);

        window.scrollTo(0, startY + diff * eased);

        if (time < duration) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}


// Обработчик кнопки data-goto
document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => {

        const index = Number(btn.dataset.goto);
        if (index !== 1) {
            goto(index);
            return;
        }

        const hero = document.querySelector('.hero');
        let triggered = false;

        // Легкий старт — маленький скролл
        window.scrollBy({ top: 80, behavior: "smooth" });

        // Ждём исчезновение HERO на 50%
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {

                if (!triggered && entry.intersectionRatio <= 0.5) {
                    triggered = true;

                    observer.disconnect();

                    // Запускаем штатный переход
                    goto(1);
                }

            });
        }, {
            threshold: [0, 0.5, 1]
        });

        observer.observe(hero);
    });
});


// =======================================
// СЛАЙДЕР СЕКЦИИ №1
// =======================================

function initSlider(selector) {
    const slider = document.querySelector(selector);
    if (!slider) return;

    const slides = slider.querySelector(".slides");
    const images = slides.querySelectorAll("img");
    const btnPrev = slider.querySelector(".prev");
    const btnNext = slider.querySelector(".next");

    let index = 0;
    const total = images.length;

    // Создаем точки
    const dotsWrap = document.createElement("div");
    dotsWrap.classList.add("slider-dots");

    images.forEach((_, i) => {
        const dot = document.createElement("div");
        dot.classList.add("slider-dot");
        if (i === 0) dot.classList.add("active");
        dot.addEventListener("click", () => goTo(i));
        dotsWrap.appendChild(dot);
    });

    slider.appendChild(dotsWrap);

    const dots = dotsWrap.querySelectorAll(".slider-dot");

    function update() {
        slides.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle("active", i === index));
    }

    function next() {
        index = (index + 1) % total;
        update();
    }

    function prev() {
        index = (index - 1 + total) % total;
        update();
    }

    function goTo(i) {
        index = i;
        update();
    }

    // Кнопки
    btnNext.addEventListener("click", next);
    btnPrev.addEventListener("click", prev);

    // Свайп
    let startX = 0;
    slides.addEventListener("touchstart", e => {
        startX = e.touches[0].clientX;
    });

    slides.addEventListener("touchend", e => {
        const dx = e.changedTouches[0].clientX - startX;
        if (dx > 50) prev();
        else if (dx < -50) next();
    });
}

// Инициализация
initSlider(".news-section .slider");


// ----- Fade Slider -----
function initFadeSlider() {
    const sliders = document.querySelectorAll(".fade-slider");

    sliders.forEach(slider => {
        const slides = slider.querySelectorAll(".fade-slide");
        let index = 0;

        setInterval(() => {
            slides[index].classList.remove("active");
            index = (index + 1) % slides.length;
            slides[index].classList.add("active");
        }, 3500); // время переключения
    });
}

initFadeSlider();

function typewriterEffect(element, text, speed = 25) {
    return new Promise(resolve => {
        element.textContent = "";
        element.classList.add("typing");

        let i = 0;

        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                element.classList.remove("typing");
                resolve();
            }
        }

        type();
    });
}

function initGridCarousel() {
    const track = document.querySelector(".grid-track");
    const cards = Array.from(document.querySelectorAll(".grid-card"));

    if (!track || cards.length === 0) return;

    let index = 0;
    let cardWidth = getCardWidth();

    // Дублируем оригинальные карточки — для бесконечного цикла
    cards.forEach(card => {
        track.appendChild(card.cloneNode(true));
    });

    // Функция для точного вычисления ширины
    function getCardWidth() {
        const card = document.querySelector(".grid-card");
        if (!card) return 0;

        const styles = window.getComputedStyle(track);
        const gap = parseInt(styles.columnGap || styles.gap || 0);

        return card.offsetWidth + gap;
    }

    // Основной слайд
    function slide() {
        index++;
        track.style.transform = `translateX(${-index * cardWidth}px)`;

        if (index >= cards.length) {
            setTimeout(() => {
                track.style.transition = "none";
                index = 0;
                track.style.transform = "translateX(0)";
                void track.offsetWidth; // принудительный реflow
                track.style.transition = "transform 0.8s ease";
            }, 900);
        }
    }

    // Пересчёт ширины при изменении окна/ориентации
    window.addEventListener("resize", () => {
        cardWidth = getCardWidth();
        track.style.transition = "none";
        track.style.transform = `translateX(${-index * cardWidth}px)`;
        void track.offsetWidth;
        track.style.transition = "transform 0.8s ease";
    });

    setInterval(slide, 8000);
}

initGridCarousel();


// ===============================
// КАРУСЕЛЬ ПРОЕКТОВ
// ===============================
(function setupProjectsCarousel() {
  const viewport = document.querySelector('#projects .projects-viewport');
  if (!viewport) return;

  const stage = viewport.querySelector('.projects-stage');
  const cards = [...stage.querySelectorAll('.project-card')];
  if (!cards.length) return;

  const dotsWrap = viewport.querySelector('.pr-dots');
  const prevBtn = viewport.querySelector('.prev');
  const nextBtn = viewport.querySelector('.next');

  let i = 0, timer = null;
  const interval = +(viewport.dataset.interval || 5000);
  const autoplay = viewport.dataset.autoplay !== 'false';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  dotsWrap.innerHTML = cards.map(() => '<i></i>').join('');
  const dots = [...dotsWrap.children];

  const show = (idx) => {
    i = (idx + cards.length) % cards.length;
    cards.forEach((c, k) => c.classList.toggle('is-active', k === i));
    dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
  };

  const next = () => show(i + 1);
  const prev = () => show(i - 1);
  const play = () => {
    if (reduce || !autoplay) return;
    stop();
    timer = setInterval(next, interval);
  };
  const stop = () => timer && clearInterval(timer);

  show(0);
  play();

  nextBtn?.addEventListener('click', () => { next(); play(); });
  prevBtn?.addEventListener('click', () => { prev(); play(); });
  dotsWrap.addEventListener('click', (e) => {
    const idx = dots.indexOf(e.target);
    if (idx > -1) { show(idx); play(); }
  });

  viewport.addEventListener('mouseenter', stop);
  viewport.addEventListener('mouseleave', play);
  viewport.addEventListener('focusin', stop);
  viewport.addEventListener('focusout', play);

  // Авто-пауза вне экрана
const sectionsObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('in-view');
  });
}, { threshold: 0.2 });
  io.observe(viewport);
})();
