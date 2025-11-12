// ---------- Секции / навигация ----------
const sections = Array.from(document.querySelectorAll(".page"));
const navLinks = Array.from(
  document.querySelectorAll("nav a, .btn[data-goto]")
);

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

let current = 0,
  transitioning = false;
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
  const from = page.rotation.y,
    to = from + (direction > 0 ? Math.PI : -Math.PI);
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

  scene.beginAnimation(page, 0, 80, false);
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
  if (["ArrowUp", "PageUp", "ArrowLeft"].includes(e.key)) goto(current - 1);
});

// ---------- Babylon.js ----------
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
  antialias: true,
});
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

const sky = BABYLON.MeshBuilder.CreateSphere(
  "sky",
  { diameter: 1000, sideOrientation: BABYLON.Mesh.BACKSIDE },
  scene
);
const skyMat = new BABYLON.SkyMaterial("skyMat", scene);
skyMat.luminance = 0.9;
skyMat.rayleigh = 1.6;
skyMat.turbidity = 8.0; // более «мутный» воздух
skyMat.inclination = 0.05; // низкое солнце
skyMat.azimuth = 0.18;
sky.material = skyMat;

const shoulderMat = new BABYLON.StandardMaterial("shoulder", scene);
shoulderMat.diffuseTexture = new BABYLON.Texture(
  "https://assets.babylonjs.com/textures/sand.jpg",
  scene
);
shoulderMat.diffuseTexture.uScale = 40;
shoulderMat.diffuseTexture.vScale = 2;
shoulderMat.specularColor = new BABYLON.Color3(0, 0, 0);

// Свет
const hemi = new BABYLON.HemisphericLight(
  "hemi",
  new BABYLON.Vector3(0.5, 1, 0.5),
  scene
);
hemi.intensity = 0.95;
const dir = new BABYLON.DirectionalLight(
  "dir",
  new BABYLON.Vector3(-0.8, -1, -0.3),
  scene
);
dir.position = new BABYLON.Vector3(20, 25, 12);
dir.intensity = 0.55;

// Камера-дрон (UniversalCamera + «риг» для ролла/покачивания)
const droneRig = new BABYLON.TransformNode("droneRig", scene);
const camera = new BABYLON.UniversalCamera(
  "drone",
  new BABYLON.Vector3(-40, 8, 6.5),
  scene
);
camera.minZ = 0.1;
camera.maxZ = 1000;
camera.fov = 0.9;
camera.parent = droneRig;

// Поле/обочины/дорога
const fieldMat = new BABYLON.StandardMaterial("field", scene);
fieldMat.diffuseColor = new BABYLON.Color3(0.12, 0.25, 0.12);
const field = BABYLON.MeshBuilder.CreateGround(
  "field",
  { width: 300, height: 180, subdivisions: 2 },
  scene
);
field.position.y = -0.005;
field.material = fieldMat;

const roadMat = new BABYLON.StandardMaterial("roadMat", scene);
roadMat.diffuseColor = new BABYLON.Color3(0.07, 0.09, 0.13);
const road = BABYLON.MeshBuilder.CreateGround(
  "road",
  { width: 300, height: 8, subdivisions: 2 },
  scene
);
road.material = roadMat;

// Разметка
const stripeMat = new BABYLON.StandardMaterial("stripe", scene);
stripeMat.emissiveColor = new BABYLON.Color3(0.95, 0.95, 0.95);
for (let x = -86; x <= 86; x += 6) {
  const s = BABYLON.MeshBuilder.CreateBox(
    "stripe",
    { width: 2, height: 0.02, depth: 0.15 },
    scene
  );
  s.position.set(x, 0.01, 0);
  s.material = stripeMat;
}

// Шлагбаум
const baseZ = -4.8; // левая кромка дороги
const barBase = BABYLON.MeshBuilder.CreateBox(
  "barBase",
  { width: 0.6, height: 1.0, depth: 0.6 },
  scene
);
barBase.position.set(0.0, 0.5, baseZ);
barBase.material = roadMat;

const pivot = new BABYLON.TransformNode("pivot", scene);
pivot.position = new BABYLON.Vector3(0.0, 1.0, baseZ); // шарнир у стойки

const barPole = BABYLON.MeshBuilder.CreateBox(
  "barPole",
  { width: 0.18, height: 0.16, depth: 8.2 },
  scene
); // тянется поперёк дороги
barPole.setParent(pivot);
barPole.position.z = 4.1; // от шарнира до другой кромки
barPole.position.y = 0.1;
const poleMat = new BABYLON.StandardMaterial("pole", scene);
poleMat.diffuseColor = new BABYLON.Color3(0.9, 0.2, 0.25);
poleMat.emissiveColor = new BABYLON.Color3(0.25, 0.05, 0.06);
barPole.material = poleMat;

let targetBarrierAngle = 0; // 0 — закрыт (горизонт), -PI/2 — поднят


// === КПП и забор ===

// Материалы
const fenceMat = new BABYLON.StandardMaterial("fenceMat", scene);
fenceMat.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.25);
fenceMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.05);

const boothMat = new BABYLON.StandardMaterial("boothMat", scene);
boothMat.diffuseColor = new BABYLON.Color3(0.32, 0.35, 0.38);
boothMat.emissiveColor = new BABYLON.Color3(0.08, 0.1, 0.12);

const glassMat = new BABYLON.StandardMaterial("glassMat", scene);
glassMat.diffuseColor = new BABYLON.Color3(0.3, 0.5, 0.8);
glassMat.alpha = 0.6;

// === Будка охраны ===
const booth = BABYLON.MeshBuilder.CreateBox("booth", { width: 2.2, height: 2.2, depth: 2.2 }, scene);
booth.position.set(4, 1.1, -5.5);
booth.material = boothMat;

// Окна
for (const offsetZ of [-0.8, 0.8]) {
    const window = BABYLON.MeshBuilder.CreatePlane("window", { width: 1.2, height: 1.0 }, scene);
    window.position.set(4.9, 1.1, offsetZ);
    window.rotation.y = -Math.PI / 2;
    window.material = glassMat;
}

// Крыша будки
const roof = BABYLON.MeshBuilder.CreateBox("roof", { width: 2.5, height: 0.2, depth: 2.5 }, scene);
roof.position.set(4, 2.3, -5.5);
roof.material = boothMat;


// === Забор (по обе стороны от шлагбаума) ===
function createFenceSegment(x, zStart, zEnd) {
    const length = Math.abs(zEnd - zStart);
    const fence = BABYLON.MeshBuilder.CreateBox("fence", { width: 0.1, height: 1.8, depth: length }, scene);
    fence.position.set(x, 0.9, (zStart + zEnd) / 2);
    fence.material = fenceMat;
    return fence;
}

// Левая и правая часть забора
const fenceLeft = createFenceSegment(-6, -20, 20);
const fenceRight = createFenceSegment(6, -20, 20);

// Добавляем колючую проволоку сверху
function addBarbedWire(fence, count = 5) {
    for (let i = 0; i < count; i++) {
        const wire = BABYLON.MeshBuilder.CreateTube("wire", {
            path: [
                new BABYLON.Vector3(fence.position.x, fence.position.y + 1.0 + Math.sin(i * 0.6) * 0.05, fence.position.z - fence.scaling.z * 10 + i * 2.0),
                new BABYLON.Vector3(fence.position.x, fence.position.y + 1.0 + Math.cos(i * 0.6) * 0.05, fence.position.z - fence.scaling.z * 10 + (i + 1) * 2.0)
            ],
            radius: 0.02
        }, scene);
        wire.material = fenceMat;
    }
}

addBarbedWire(fenceLeft);
addBarbedWire(fenceRight);



// Лесополоса (тонкие инстансы)
const trunk = BABYLON.MeshBuilder.CreateCylinder(
  "trunk",
  { height: 1, diameterTop: 0.9, diameterBottom: 1, tessellation: 6 },
  scene
);
const crown = BABYLON.MeshBuilder.CreateCylinder(
  "crown",
  { height: 1, diameterTop: 0.0, diameterBottom: 1.7, tessellation: 6 },
  scene
);
const trunkMat = new BABYLON.StandardMaterial("tMat", scene);
trunkMat.diffuseColor = new BABYLON.Color3(0.25, 0.16, 0.08);
trunk.material = trunkMat;
const crownMat = new BABYLON.StandardMaterial("cMat", scene);
crownMat.diffuseColor = new BABYLON.Color3(0.07, 0.28, 0.12);
crown.material = crownMat;

// === Густой лес от дороги в обе стороны ===
function addWideForest(side = 1, width = 70, depth = 8, count = 20000) {
    // side: +1 — справа от дороги, -1 — слева
    for (let i = 0; i < count; i++) {
        const x = -120 + Math.random() * 240;  // вдоль дороги
        const z = side * (6 + Math.random() * width); // от дороги вглубь поля
        const th = 1.4 + Math.random() * 1.8;
        const cr = th * 1.3;

        const trScale = new BABYLON.Vector3(
            0.15 + Math.random() * 0.05,
            th,
            0.15 + Math.random() * 0.05
        );
        const crScale = new BABYLON.Vector3(
            0.9 + Math.random() * 0.4,
            cr,
            0.9 + Math.random() * 0.4
        );

        const trPos = new BABYLON.Vector3(x, th / 2, z);
        const crPos = new BABYLON.Vector3(x, th + cr / 2, z);
        const I = BABYLON.Quaternion.Identity();

        trunk.thinInstanceAdd(BABYLON.Matrix.Compose(trScale, I, trPos));
        crown.thinInstanceAdd(BABYLON.Matrix.Compose(crScale, I, crPos));
    }
}

// Создаем лес по обе стороны дороги
addWideForest(+1, 90, 8, 700);  // справа — 90 метров шириной
addWideForest(-1, 90, 8, 700);  // слева — 90 метров шириной

trunk.setEnabled(true);
crown.setEnabled(true);


// Фуры на обочине (статично)
function hsvToColor3(h, s, v) {
  h = ((h % 1) + 1) % 1;
  const i = Math.floor(h * 6),
    f = h * 6 - i;
  const p = v * (1 - s),
    q = v * (1 - f * s),
    t = v * (1 - (1 - f) * s);
  let r, g, b;
  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }
  return new BABYLON.Color3(r, g, b);
}
function createTruck(scene, color) {
  const root = new BABYLON.TransformNode("truckRoot", scene);
  const trailerLen = 4.2,
    cabLen = 1.1,
    bodyH = 1.2,
    bodyW = 1.7;
  const wheelR = 0.38,
    wheelT = 0.35,
    yBody = wheelR + bodyH / 2;

  const trailer = BABYLON.MeshBuilder.CreateBox(
    "trailer",
    { width: trailerLen, height: bodyH, depth: bodyW },
    scene
  );
  const cab = BABYLON.MeshBuilder.CreateBox(
    "cab",
    { width: cabLen, height: bodyH * 0.95, depth: bodyW * 0.92 },
    scene
  );
  const bodyMat = new BABYLON.StandardMaterial("bodyMat", scene);
  bodyMat.diffuseColor = color;
  bodyMat.emissiveColor = new BABYLON.Color3(0.05, 0.2, 0.35);
  trailer.material = bodyMat;
  cab.material = bodyMat.clone("cabMat");
  trailer.parent = root;
  cab.parent = root;
  trailer.position.set(-cabLen / 2, yBody, 0);
  cab.position.set(trailerLen / 2, yBody * 0.98, 0);

  const glass = BABYLON.MeshBuilder.CreateBox(
    "glass",
    { width: cabLen * 0.55, height: bodyH * 0.4, depth: bodyW * 0.7 },
    scene
  );
  glass.parent = cab;
  glass.position.set(cabLen * 0.1, bodyH * 0.12, 0);
  const gmat = new BABYLON.StandardMaterial("g", scene);
  gmat.diffuseColor = new BABYLON.Color3(0.2, 0.55, 0.8);
  gmat.alpha = 0.8;
  glass.material = gmat;

  const wheelMat = new BABYLON.StandardMaterial("w", scene);
  wheelMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.12);
  wheelMat.specularColor = new BABYLON.Color3(0.02, 0.02, 0.02);
  const wheelZ = bodyW / 2 - 0.22;
  const xPos = [-1.6, -0.3, 1.8];
  for (const x of xPos)
    for (const side of [-1, 1]) {
      const w = BABYLON.MeshBuilder.CreateCylinder(
        "wheel",
        { diameter: wheelR * 2, height: wheelT, tessellation: 12 },
        scene
      );
      w.parent = root;
      w.material = wheelMat;
      w.rotation.x = Math.PI / 2;
      w.position.set(x, wheelR, side * wheelZ);
    }
  return { root };
}
const trucks = [];
const SHOULDER_Z = 5.2; // правая обочина
for (let i = 0; i < 26; i++) {
  const hue = (0.55 + (i % 7) * 0.05) % 1;
  const col = hsvToColor3(hue, 0.55, 0.9);
  const t = createTruck(scene, col);
  const gap = 5 + Math.random() * 2.5;
  t.root.position.set(-80 + i * gap, 0, SHOULDER_Z);
  // часть «в два ряда»
  if (i % 9 === 0) {
    const t2 = createTruck(scene, hsvToColor3((hue + 0.15) % 1, 0.45, 0.85));
    t2.root.position.set(t.root.position.x - 1.6, 0, SHOULDER_Z + 1.4);
    trucks.push(t2);
  }
  trucks.push(t);
}

// Полупрозрачная «страница» для 3D-перелистывания
const pageMat = new BABYLON.StandardMaterial("pageMat", scene);
pageMat.diffuseColor = new BABYLON.Color3(0.1, 0.45, 0.65);
pageMat.alpha = 0.14;
const page = BABYLON.MeshBuilder.CreatePlane(
  "page",
  { width: 36, height: 22 },
  scene
);
page.position.set(0, 6, 0);
page.material = pageMat;
page.isVisible = false;

// Якоря пролёта по секциям (x-координаты вдоль колонны)
const droneAnchors = [-60, -20, 0, 40]; // hero, проблема (хвост), решение (шлагбаум), результат (вперёд)
const WORLD_MIN_X = -90;
const WORLD_MAX_X = 90;

let droneX = WORLD_MIN_X;
let droneTargetX = WORLD_MIN_X;

function updateDroneTargetFromScroll() {
  const doc = document.documentElement;
  const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight); // пиксели
  const p = Math.min(1, Math.max(0, window.scrollY / maxScroll)); // 0..1
  droneTargetX = WORLD_MIN_X + (WORLD_MAX_X - WORLD_MIN_X) * p; // мировые X
}

window.addEventListener("scroll", updateDroneTargetFromScroll, {
  passive: true,
});
window.addEventListener("resize", updateDroneTargetFromScroll);
updateDroneTargetFromScroll();

function applySceneMode(i) {
  switch (i) {
    case 0:
      targetBarrierAngle = 0;
      setMetrics(6, 35, 1.2);
      break;
    case 1:
      targetBarrierAngle = 0;
      setMetrics(14, 12, 6.8);
      break;
    case 2:
      targetBarrierAngle = -Math.PI / 2;
      setMetrics(5, 38, 0.9);
      break;
    case 3:
      targetBarrierAngle = -Math.PI / 2;
      setMetrics(3, 45, 0.2, true);
      break;
  }
}

// Метрики (демо)
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
  const m1 = document.getElementById("m1"),
    m2 = document.getElementById("m2"),
    m3 = document.getElementById("m3");
  if (m1 && m2 && m3) {
    animateNumber(m1, waitH);
    animateNumber(m2, throughput);
    animateNumber(m3, queueKm);
  }
  if (also) {
    const r1 = document.getElementById("r1"),
      r2 = document.getElementById("r2"),
      r3 = document.getElementById("r3");
    if (r1 && r2 && r3) {
      animateNumber(r1, waitH);
      animateNumber(r2, throughput);
      animateNumber(r3, queueKm);
    }
  }
}

// Обновление барьера и дрона
scene.onBeforeRenderObservable.add(() => {
  const dt = engine.getDeltaTime() / 1000;

  // реакция дрона на прокрутку (чуть инерции)
  droneX += (droneTargetX - droneX) * Math.min(1, dt * 4.0);

  const rot = pivot.rotation || (pivot.rotation = new BABYLON.Vector3());
  rot.x += (targetBarrierAngle - rot.x) * Math.min(1, dt * 6);

  // далее — позиция и взгляд
  const pos = new BABYLON.Vector3(droneX, 8.2, SHOULDER_Z + -10.3);
  //const target = new BABYLON.Vector3(droneX + 12, 2.2, SHOULDER_Z + 1.3);
  droneRig.position.copyFrom(pos);
  camera.rotation.set(0.3, Math.PI / 2, 0);
});

// Старт
applySceneMode(0);
sections[0].scrollIntoView({ behavior: "instant", block: "center" });
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
