import * as THREE from "three";
import { CAMPAIGN, CHAPTERS, STORIES } from "./stories.js?v=20261123f";
import { avatarSVG, avatarImage, AVATAR_OPTIONS } from "./avatar.js?v=20261123f";
import { drawStoryCard, CARD_BASE_W, CARD_BASE_H } from "./card.js?v=20261123f";

/* =====================================================================
   #MadeRealHere — browser AR experience
   - Rear camera feed behind a transparent WebGL scene (iOS + Android),
     with an adjustable translucent layer for legibility
   - Device orientation drives the virtual camera, so stories stay
     anchored in the room; drag-to-look when there's no camera / gyro
   - Story cards sit on a path of light that lights up as you progress
   - Stories are collected on this device; visitors can make their own card
   ===================================================================== */

const $ = (s) => document.querySelector(s);
const DEG = Math.PI / 180;
const RADIUS = 3.4;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const chapterOf = (id) => CHAPTERS.find((c) => c.id === id);

/* ---------------- device storage (per viewer, may be unavailable) ---------------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem("mrh." + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("mrh." + k, JSON.stringify(v)); } catch {} },
};

const state = {
  mode: null,             // "ar" | "virtual"
  gyro: false,
  started: false,
  chapterIndex: -1,       // highest chapter revealed
  seen: new Set(store.get("collected", []).filter((id) => STORIES.some((s) => s.id === id))),
  mine: store.get("mine", []),   // stories the visitor made
  avatars: {},            // id -> Image
  logo: null,
  finaleShown: false,
};

/* *word* -> highlighted span, built without innerHTML */
function rich(el, text) {
  el.textContent = "";
  text.split(/(\*[^*]+\*)/).forEach((part) => {
    if (!part) return;
    if (part.startsWith("*") && part.endsWith("*")) {
      const s = document.createElement("span");
      s.className = "hl";
      s.textContent = part.slice(1, -1);
      el.appendChild(s);
    } else el.appendChild(document.createTextNode(part));
  });
}
const plain = (t) => t.replace(/\*/g, "");
const firstName = (n) => n.split(/\s+/)[0];

/* ---------------- static copy ---------------- */
$("#tagline").textContent = CAMPAIGN.tagline;
rich($("#finale-title"), CAMPAIGN.finale.title);
setLink($("#finale-primary"), CAMPAIGN.finale.primary);
setLink($("#finale-secondary"), CAMPAIGN.finale.secondary);
setLink($("#create-submit"), CAMPAIGN.submit);
function setLink(el, cfg) {
  if (!el) return;
  if (!cfg) { el.hidden = true; return; }
  el.textContent = cfg.label;
  el.href = cfg.url;
}

/* ---------------- brand logo (optional file) ---------------- */
if (CAMPAIGN.logo) {
  const img = new Image();
  img.onload = () => {
    state.logo = img;
    document.querySelectorAll("[data-logo]").forEach((el) => { el.src = CAMPAIGN.logo; el.hidden = false; });
    document.body.classList.add("has-logo");
    cards.forEach(drawCard);
  };
  img.src = CAMPAIGN.logo;
}

/* ---------------- three.js setup ---------------- */
const canvas = $("#scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, 1, 0.05, 100);
camera.rotation.order = "YXZ";
const world = new THREE.Group(); // rotated to recenter
scene.add(world);

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < h ? 75 : 55;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();
const hfov = () => 2 * Math.atan(Math.tan((camera.fov * DEG) / 2) * camera.aspect);

function glowTexture(color) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, color);
  g.addColorStop(0.25, color + "aa");
  g.addColorStop(1, color + "00");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const glowTex = glowTexture("#12abdb");

/* ambient sparks */
const sparks = (() => {
  const N = 380, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 2 + Math.random() * 7, th = Math.random() * Math.PI * 2;
    pos.set([Math.cos(th) * r, (Math.random() - 0.5) * 6, Math.sin(th) * r], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({
    size: 0.05, map: glowTexture("#9fe9ff"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  world.add(p);
  return p;
})();

/* floor ring */
const ring = new THREE.Mesh(
  new THREE.RingGeometry(RADIUS - 0.02, RADIUS + 0.02, 128),
  new THREE.MeshBasicMaterial({ color: 0x12abdb, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = -1.4;
world.add(ring);

/* ---------------- story cards on the path ---------------- */
const CARD_W = 1.12, CARD_H = 1.4;
const TEX_SCALE = 1.25; // texture resolution
const cardGeo = new THREE.PlaneGeometry(CARD_W, CARD_H);
const cards = []; // { story, mine, chapterIdx, mesh, glow, node, canvas, ctx, tex, baseY, phase, reveal, revealing, yaw, index }

const allStories = () => [...STORIES, ...state.mine];

function makeCard(story, mine) {
  const c = document.createElement("canvas");
  c.width = CARD_BASE_W * TEX_SCALE; c.height = CARD_BASE_H * TEX_SCALE;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mesh = new THREE.Mesh(cardGeo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  mesh.renderOrder = 3;
  mesh.scale.setScalar(0.0001);
  mesh.visible = false;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  glow.scale.set(2.6, 2.6, 1);
  glow.visible = false;
  glow.renderOrder = 1;
  const node = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 }));
  node.scale.set(0.45, 0.45, 1);
  node.renderOrder = 2;
  world.add(glow, node, mesh);
  const card = {
    story, mine, chapterIdx: mine ? CHAPTERS.length : CHAPTERS.findIndex((ch) => ch.id === story.chapter),
    mesh, glow, node, canvas: c, ctx: c.getContext("2d"), tex,
    baseY: 0, phase: Math.random() * 6, reveal: 0, revealing: false, yaw: 0, index: 0,
  };
  mesh.userData.card = card;
  cards.push(card);
  return card;
}

function drawCard(card) {
  drawStoryCard(card.ctx, card.story, {
    scale: TEX_SCALE,
    pillar: card.mine ? (chapterOf(card.story.chapter)?.title || "My story") : chapterOf(card.story.chapter).title,
    avatar: state.avatars[card.story.id] || null,
    logo: state.logo,
    status: card.mine ? null : state.seen.has(card.story.id) ? "heard" : "open",
  });
  card.tex.needsUpdate = true;
}

async function loadAvatar(story) {
  state.avatars[story.id] = await avatarImage(story.look);
  const c = cards.find((k) => k.story.id === story.id);
  if (c) drawCard(c);
}

/* Lay every card out along a path that winds around the viewer (clockwise). */
function layout() {
  const n = cards.length;
  const step = Math.min(34, 328 / Math.max(1, n - 1)); // keep a clear gap between the last and first card
  cards.forEach((c, i) => {
    c.index = i;
    c.yaw = -i * step * DEG;
    c.baseY = 0.24 * Math.sin(i * 1.15);
    c.mesh.position.set(-Math.sin(c.yaw) * RADIUS, c.baseY, -Math.cos(c.yaw) * RADIUS);
    c.mesh.lookAt(0, c.baseY, 0);
    c.glow.position.copy(c.mesh.position).multiplyScalar(1.05);
    c.node.position.copy(c.mesh.position);
  });
  placeSignposts();
  buildPath();
}

/* ---------------- chapter signposts above the first card of each chapter ---------------- */
const signposts = CHAPTERS.map((ch, ci) => {
  const c = document.createElement("canvas");
  c.width = 768; c.height = 128;
  const x = c.getContext("2d");
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0 }));
  sprite.scale.set(1.5, 0.25, 1);
  sprite.renderOrder = 4;
  sprite.visible = false;
  world.add(sprite);
  const draw = () => {
    x.clearRect(0, 0, 768, 128);
    x.font = `500 52px Ubuntu, "Segoe UI", sans-serif`;
    x.textAlign = "center"; x.textBaseline = "middle";
    const label = `${String(ci + 1).padStart(2, "0")}  ${ch.title.toUpperCase()}`;
    const w = x.measureText(label).width + 64;
    x.fillStyle = "rgba(11,21,48,0.72)";
    x.beginPath(); x.roundRect ? x.roundRect(384 - w / 2, 18, w, 92, 46) : x.rect(384 - w / 2, 18, w, 92); x.fill();
    x.fillStyle = "#12ABDB";
    x.fillText(label, 384, 66);
    t.needsUpdate = true;
  };
  return { ch, ci, sprite, draw };
});
function placeSignposts() {
  signposts.forEach((sp) => {
    sp.card = cards.find((c) => !c.mine && c.chapterIdx === sp.ci);
    if (sp.card) sp.sprite.position.set(sp.card.mesh.position.x, sp.card.baseY + 0.98, sp.card.mesh.position.z);
  });
}

/* ---------------- the path of light ---------------- */
const path = { curve: null, dim: null, lit: null, pulse: null, count: 0, frac: 0, target: 0 };
const pathDimMat = new THREE.MeshBasicMaterial({ color: 0x12abdb, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending });
const pathLitMat = new THREE.MeshBasicMaterial({ color: 0x7fe3ff, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
path.pulse = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("#e6fbff"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
path.pulse.scale.set(0.5, 0.5, 1);
path.pulse.renderOrder = 2;
world.add(path.pulse);

function buildPath() {
  if (path.dim) { world.remove(path.dim, path.lit); path.dim.geometry.dispose(); path.lit.geometry.dispose(); path.dim = path.lit = null; }
  if (cards.length < 2) return;
  // pass just behind the cards, dipping slightly between them like a trail
  const pts = [];
  cards.forEach((c, i) => {
    const r = RADIUS + 0.12;
    pts.push(new THREE.Vector3(-Math.sin(c.yaw) * r, c.baseY - 0.35, -Math.cos(c.yaw) * r));
    const nx = cards[i + 1];
    if (nx) {
      const my = (c.yaw + nx.yaw) / 2, myY = (c.baseY + nx.baseY) / 2 - 0.55;
      pts.push(new THREE.Vector3(-Math.sin(my) * r, myY, -Math.cos(my) * r));
    }
  });
  path.curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
  const segs = 48 * (cards.length - 1);
  const geo = new THREE.TubeGeometry(path.curve, segs, 0.014, 6, false);
  path.count = geo.index.count;
  path.dim = new THREE.Mesh(geo, pathDimMat);
  path.lit = new THREE.Mesh(geo.clone(), pathLitMat);
  path.dim.renderOrder = path.lit.renderOrder = 1;
  world.add(path.dim, path.lit);
  updatePathTarget();
  path.frac = Math.min(path.frac, path.target);
}
// curve parameter for card i (2 control points per gap)
const tForCard = (i) => (cards.length < 2 ? 0 : (i * 2) / ((cards.length - 1) * 2));
function updatePathTarget() {
  let last = 0;
  cards.forEach((c, i) => { if (c.mesh.visible) last = i; });
  path.target = tForCard(last);
}

/* ---------------- build the scene ---------------- */
STORIES.forEach((s) => makeCard(s, false));
state.mine.forEach((s) => makeCard(s, true));
layout();
(async () => {
  try { await Promise.all(["300 40px Ubuntu", "500 28px Ubuntu"].map((f) => document.fonts.load(f))); } catch {}
  cards.forEach(drawCard);
  signposts.forEach((sp) => sp.draw());
  allStories().forEach(loadAvatar);
})();

/* ---------------- camera feed + translucent layer ---------------- */
async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
    });
    const v = $("#camera");
    v.srcObject = stream;
    await v.play().catch(() => {});
    v.classList.add("is-live");
    document.body.classList.add("ar-live");
    $("#btn-veil").hidden = false;
    applyVeil();
    return true;
  } catch (e) {
    console.warn("Camera unavailable", e);
    return false;
  }
}

const VEILS = [
  { name: "Clear", tint: 0.2, blur: 0 },
  { name: "Soft", tint: 0.55, blur: 1.5 },
  { name: "Focus", tint: 0.8, blur: 6 },
];
let veil = Math.min(store.get("veil", 1), VEILS.length - 1);
function applyVeil() {
  const v = VEILS[veil];
  document.documentElement.style.setProperty("--veil", v.tint);
  document.documentElement.style.setProperty("--veil-blur", v.blur + "px");
  $("#btn-veil").textContent = `Layer: ${v.name}`;
  $("#btn-veil").setAttribute("aria-label", `Camera background: ${v.name}. Tap to change`);
}
$("#btn-veil")?.addEventListener("click", () => { veil = (veil + 1) % VEILS.length; store.set("veil", veil); applyVeil(); });

/* ---------------- orientation controls ---------------- */
const orient = { alpha: 0, beta: 90, gamma: 0, has: false };
const zee = new THREE.Vector3(0, 0, 1), yAxis = new THREE.Vector3(0, 1, 0);
const euler = new THREE.Euler();
const q0 = new THREE.Quaternion(), qYaw = new THREE.Quaternion();
const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
let yawOffset = 0;

function onOrient(e) {
  if (e.alpha == null && e.beta == null) return;
  orient.alpha = e.alpha || 0; orient.beta = e.beta || 0; orient.gamma = e.gamma || 0;
  if (!orient.has) { orient.has = true; state.gyro = true; }
}
async function startOrientation() {
  const DOE = window.DeviceOrientationEvent;
  if (!DOE) return false;
  if (typeof DOE.requestPermission === "function") {
    try { if ((await DOE.requestPermission()) !== "granted") return false; } catch { return false; }
  }
  addEventListener("deviceorientation", onOrient, true);
  await new Promise((r) => setTimeout(r, 600));
  return orient.has;
}
const screenAngle = () => ((screen.orientation && screen.orientation.angle) ?? window.orientation ?? 0) * DEG;
function applyGyro() {
  euler.set(orient.beta * DEG, orient.alpha * DEG, -orient.gamma * DEG, "YXZ");
  camera.quaternion.setFromEuler(euler);
  camera.quaternion.multiply(q1);
  camera.quaternion.multiply(q0.setFromAxisAngle(zee, -screenAngle()));
  camera.quaternion.premultiply(qYaw.setFromAxisAngle(yAxis, yawOffset));
}

/* drag-to-look + tap */
const look = { yaw: 0, pitch: 0, tYaw: 0, tPitch: 0 };
let drag = null;
canvas.addEventListener("pointerdown", (e) => {
  drag = { x: e.clientX, y: e.clientY, moved: 0 };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.x = e.clientX; drag.y = e.clientY;
  drag.moved += Math.abs(dx) + Math.abs(dy);
  const k = 0.0045;
  if (state.gyro) yawOffset += dx * k;
  else { look.tYaw += dx * k; look.tPitch = THREE.MathUtils.clamp(look.tPitch + dy * k, -1.1, 1.1); }
});
canvas.addEventListener("pointerup", (e) => { if (drag && drag.moved < 10) tap(e.clientX, e.clientY); drag = null; });
canvas.addEventListener("pointercancel", () => (drag = null));
addEventListener("keydown", (e) => {
  if (!state.started || anySheetOpen()) return;
  if (e.key === "ArrowLeft") look.tYaw += 0.3;
  if (e.key === "ArrowRight") look.tYaw -= 0.3;
});

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function tap(x, y) {
  if (!state.started || anySheetOpen()) return;
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(cards.filter((c) => c.mesh.visible).map((c) => c.mesh));
  if (hits[0]) openStory(hits[0].object.userData.card);
}

/* ---------------- where to look next ---------------- */
function nextCard() {
  // prefer the newest chapter, then anything left behind on the path
  const open = cards.filter((c) => !c.mine && c.mesh.visible && !state.seen.has(c.story.id));
  return open.find((c) => c.chapterIdx === state.chapterIndex) || open[0] || null;
}
const fwd = new THREE.Vector3();
function cameraYaw() { camera.getWorldDirection(fwd); return Math.atan2(-fwd.x, -fwd.z); }
const wrapAngle = (a) => ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

function turnTo(card, animate = true) {
  if (!card) return;
  if (state.gyro) {
    const target = cameraYaw() - card.yaw;
    if (!animate) { world.rotation.y = target; return; }
    const from = world.rotation.y, d = wrapAngle(target - from), t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 700);
      world.rotation.y = from + d * (1 - Math.pow(1 - k, 3));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  } else {
    look.tYaw += wrapAngle(card.yaw + world.rotation.y - look.tYaw);
    look.tPitch = 0;
    if (!animate) { look.yaw = look.tYaw; look.pitch = 0; }
  }
}
$("#btn-recenter")?.addEventListener("click", () => {
  const n = nextCard() || [...cards].reverse().find((c) => c.mesh.visible);
  turnTo(n);
});

/* Off-screen guide: works in camera space, so it is right even when the
   target is behind the viewer. */
const tmp = new THREE.Vector3();
let guideState = "";
function updateGuides() {
  let side = null, target = null;
  if (state.started && !anySheetOpen()) {
    target = nextCard();
    if (target) {
      camera.updateMatrixWorld();
      target.mesh.getWorldPosition(tmp).applyMatrix4(camera.matrixWorldInverse);
      const ang = Math.atan2(tmp.x, -tmp.z); // 0 = straight ahead, + = right
      const inView = tmp.z < 0 && Math.abs(ang) < hfov() / 2 * 0.8;
      if (!inView) side = ang >= 0 ? "right" : "left";
    }
  }
  const key = side ? side + target.story.id : "";
  if (key === guideState) return;
  guideState = key;
  const g = $("#guide");
  g.classList.toggle("show", !!side);
  g.classList.toggle("left", side === "left");
  g.classList.toggle("right", side === "right");
  if (side) $("#guide-label").textContent = `${side === "left" ? "Turn left" : "Turn right"} · ${firstName(target.story.name)}`;
}
$("#guide")?.addEventListener("click", () => turnTo(nextCard()));

/* ---------------- narrative ---------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const narr = $("#narration");
async function say(text, hold = 2400) {
  rich(narr, text);
  narr.classList.add("show");
  await sleep(hold);
  narr.classList.remove("show");
  await sleep(700);
}
let hintTimer;
function hint(text, ms = 3800) {
  const h = $("#hint");
  h.textContent = text;
  h.classList.add("show");
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => h.classList.remove("show"), ms);
}
let toastTimer;
function toast(text) {
  const t = $("#toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

function revealChapter(ci, stagger = true) {
  cards.filter((c) => c.chapterIdx === ci && !c.mesh.visible).forEach((c, i) => {
    const go = () => { c.mesh.visible = c.glow.visible = true; c.revealing = true; updatePathTarget(); };
    stagger ? setTimeout(go, 500 + i * 450) : go();
  });
  state.chapterIndex = Math.max(state.chapterIndex, ci);
  updateChip();
}

function updateChip() {
  const ci = Math.max(0, state.chapterIndex);
  $("#chip-num").textContent = `Chapter ${ci + 1} of ${CHAPTERS.length}`;
  $("#chip-title").textContent = CHAPTERS[ci].title;
  $("#btn-chapters").hidden = !state.started;
}

async function showChapter(ci) {
  const ch = CHAPTERS[ci];
  const b = $("#chapter-banner");
  b.querySelector(".chapter-num").textContent = `Chapter ${ci + 1} of ${CHAPTERS.length}`;
  b.querySelector(".chapter-title").textContent = ch.title;
  rich(b.querySelector(".chapter-intro"), ch.intro);
  b.classList.add("show");
  revealChapter(ci);
  await sleep(3200);
  b.classList.remove("show");
  if (ci === 0) hint(state.gyro ? "Move your phone to look around · tap a card" : "Drag to look around · tap a card", 5000);
  else hint("Follow the path of light to the next story");
}

async function begin(mode) {
  state.mode = mode;
  state.started = true;
  $("#intro").classList.remove("is-active");
  $("#hud").hidden = false;
  updateProgress();
  await sleep(60);
  turnTo(cards[0], false);

  // returning visitor: restore what they've already collected
  const firstUnvisited = CHAPTERS.findIndex((ch) => !chapterVisited(ch));
  const resumeTo = firstUnvisited === -1 ? CHAPTERS.length - 1 : firstUnvisited;
  if (firstUnvisited === -1) state.finaleShown = true;
  cards.filter((c) => c.mine).forEach((c) => { c.mesh.visible = c.glow.visible = true; c.revealing = true; });

  const deep = deepLinkStory();
  if (resumeTo > 0 || state.seen.size) {
    for (let i = 0; i < resumeTo; i++) revealChapter(i, false);
    updatePathTarget();
    path.frac = path.target;
    await say("Welcome back. Your collection is *waiting*.", 2200);
    await showChapter(resumeTo);
  } else if (!deep) {
    for (const line of CAMPAIGN.prologue) await say(line);
    await showChapter(0);
  } else {
    await showChapter(0);
  }
  if (deep) openStory(deep);
}

const IS_PHONE = matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)
  || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPadOS
if (!IS_PHONE) {
  // a laptop webcam faces the viewer, so AR makes no sense there: go straight to the virtual space
  $("#start-virtual").hidden = true;
  $("#ar-note").hidden = true;
}
$("#start-ar")?.addEventListener("click", async (e) => {
  if (!IS_PHONE) { startOrientation(); begin("virtual"); return; }
  e.currentTarget.disabled = true;
  e.currentTarget.textContent = "Starting…";
  // both permission prompts must start inside the tap (iOS)
  const [, camOk] = await Promise.all([startOrientation(), startCamera()]);
  if (!camOk) toast("Camera not available, showing the virtual space instead");
  begin(camOk ? "ar" : "virtual");
});
$("#start-virtual")?.addEventListener("click", async () => { await startOrientation(); begin("virtual"); });

/* ---------------- story sheet ---------------- */
let openCard = null, lastFocus = null;
function pillarOf(story) { return chapterOf(story.chapter)?.title || "My story"; }

function openStory(card) {
  if (typeof card === "string") card = cards.find((c) => c.story.id === card);
  if (!card) return;
  // make sure it (and its chapter) is on the path
  if (!card.mine && card.chapterIdx > state.chapterIndex) for (let k = state.chapterIndex + 1; k <= card.chapterIdx; k++) revealChapter(k, false);
  openCard = card;
  lastFocus = document.activeElement;
  const s = card.story;
  const ci = CHAPTERS.findIndex((c) => c.id === s.chapter);
  $("#story-avatar").innerHTML = avatarSVG(s.look);
  $("#story-avatar").style.background = `linear-gradient(160deg, ${s.scene[0]}, ${s.scene[1]})`;
  $("#story-chapter").textContent = card.mine ? `Your story · ${pillarOf(s)}` : `Chapter ${ci + 1} · ${pillarOf(s)}`;
  $("#story-name").textContent = s.name;
  $("#story-role").textContent = s.role;
  rich($("#story-quote"), s.quote);
  const body = $("#story-body");
  body.textContent = "";
  (s.story || []).forEach((p) => { const el = document.createElement("p"); el.textContent = p; body.appendChild(el); });
  const willCollect = !card.mine && !state.seen.has(s.id);
  $("#story-collected").hidden = card.mine;
  $("#story-collected").textContent = willCollect ? `Added to your collection · ${state.seen.size + 1} of ${STORIES.length}` : "In your collection";
  $("#story-delete").hidden = !card.mine;
  const remaining = STORIES.filter((x) => !state.seen.has(x.id) && x.id !== s.id).length;
  $("#story-continue").textContent = card.mine ? "Back to the path" : remaining ? "Continue the journey" : "Finish the journey";
  $("#story").hidden = false;
  $("#story .sheet-close").focus();
  if (willCollect) { state.seen.add(s.id); store.set("collected", [...state.seen]); drawCard(card); updateProgress(); }
}

function closeStory() {
  $("#story").hidden = true;
  const card = openCard;
  openCard = null;
  lastFocus?.focus?.();
  if (!card || card.mine) return;
  advance();
}

// A chapter counts as visited once at least one of its stories has been opened.
const chapterVisited = (ch) => STORIES.some((s) => s.chapter === ch.id && state.seen.has(s.id));

function advance() {
  if (CHAPTERS.every(chapterVisited)) {
    if (!state.finaleShown) { state.finaleShown = true; setTimeout(showFinale, 900); }
    return;
  }
  const next = state.chapterIndex + 1;
  if (next < CHAPTERS.length && chapterVisited(CHAPTERS[state.chapterIndex]) && state.pendingChapter !== next) {
    state.pendingChapter = next;
    setTimeout(() => showChapter(next), 600);
  }
}

function showFinale() {
  const n = STORIES.filter((s) => state.seen.has(s.id)).length;
  const left = STORIES.length - n;
  $("#finale-body").textContent = CAMPAIGN.finale.body.replace("{count}", n) +
    (left ? ` ${left} more ${left === 1 ? "story is" : "stories are"} still waiting on the path.` : "");
  $("#finale").classList.add("is-active");
}

function updateProgress() {
  const n = STORIES.filter((s) => state.seen.has(s.id)).length, t = STORIES.length;
  $("#progress-text").textContent = `${n} / ${t}`;
  $("#progress-fill").style.width = `${(n / t) * 100}%`;
}

/* share + save a card image */
async function cardBlob(story) {
  const c = document.createElement("canvas");
  c.width = 1080; c.height = 1350;
  if (!state.avatars[story.id]) state.avatars[story.id] = await avatarImage(story.look);
  drawStoryCard(c.getContext("2d"), story, { scale: 1080 / CARD_BASE_W, pillar: pillarOf(story), avatar: state.avatars[story.id], logo: state.logo });
  return new Promise((r) => c.toBlob(r, "image/png"));
}
function fileName(story) { return `maderealhere-${story.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`; }
async function saveCard(story) {
  const blob = await cardBlob(story);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName(story);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast("Card saved");
}
async function shareCard(story, isMine) {
  const url = isMine ? CAMPAIGN.liveUrl : `${CAMPAIGN.liveUrl}#story=${story.id}`;
  const text = `“${plain(story.quote).replace(/^“|”$/g, "")}” ${story.name} ${CAMPAIGN.hashtag}`;
  try {
    const blob = await cardBlob(story);
    const file = new File([blob], fileName(story), { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text: `${text} ${url}` }); return; }
    if (navigator.share) { await navigator.share({ title: CAMPAIGN.hashtag, text, url }); return; }
  } catch (e) { if (e?.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(`${text} ${url}`); toast("Link copied"); }
  catch { toast(url); }
}
$("#story-share")?.addEventListener("click", () => openCard && shareCard(openCard.story, openCard.mine));
$("#story-save")?.addEventListener("click", () => openCard && saveCard(openCard.story));
$("#story-delete")?.addEventListener("click", () => {
  const card = openCard;
  if (!card?.mine) return;
  const btn = $("#story-delete");
  if (btn.dataset.confirm !== "1") { btn.dataset.confirm = "1"; btn.textContent = "Tap again to remove"; setTimeout(() => { btn.dataset.confirm = ""; btn.textContent = "Remove my story"; }, 3000); return; }
  btn.dataset.confirm = ""; btn.textContent = "Remove my story";
  state.mine = state.mine.filter((s) => s.id !== card.story.id);
  store.set("mine", state.mine);
  world.remove(card.mesh, card.glow, card.node);
  cards.splice(cards.indexOf(card), 1);
  layout();
  closeStory();
  toast("Your story was removed");
});

/* ---------------- collection sheet ---------------- */
function tile(story, card, collected) {
  const b = document.createElement("button");
  b.className = "tile" + (collected ? " is-collected" : " is-locked");
  b.type = "button";
  const art = document.createElement("span");
  art.className = "tile-art";
  art.style.background = `linear-gradient(160deg, ${story.scene[0]}, ${story.scene[1]})`;
  art.innerHTML = avatarSVG(story.look);
  const tx = document.createElement("span");
  tx.className = "tile-text";
  const nm = document.createElement("span"); nm.className = "tile-name";
  const pl = document.createElement("span"); pl.className = "tile-pillar";
  nm.textContent = collected ? story.name : "Not found yet";
  pl.textContent = pillarOf(story);
  tx.append(nm, pl);
  b.append(art, tx);
  b.setAttribute("aria-label", collected ? `${story.name}, ${pillarOf(story)}` : `Undiscovered ${pillarOf(story)} story, open anyway`);
  b.addEventListener("click", () => { $("#collection").hidden = true; openStory(card); });
  return b;
}
function openCollection() {
  lastFocus = document.activeElement;
  const n = STORIES.filter((s) => state.seen.has(s.id)).length;
  $("#collection-count").textContent = `${n} of ${STORIES.length} stories collected`;
  const grid = $("#collection-grid");
  grid.textContent = "";
  cards.filter((c) => !c.mine).forEach((c) => grid.appendChild(tile(c.story, c, state.seen.has(c.story.id))));
  const mineGrid = $("#mine-grid");
  mineGrid.textContent = "";
  cards.filter((c) => c.mine).forEach((c) => mineGrid.appendChild(tile(c.story, c, true)));
  $("#mine-empty").hidden = state.mine.length > 0;
  $("#collection").hidden = false;
  $("#collection .sheet-close").focus();
}
$("#btn-collection")?.addEventListener("click", openCollection);

/* ---------------- chapters sheet ---------------- */
function openChapters() {
  lastFocus = document.activeElement;
  const list = $("#chapters-list");
  list.textContent = "";
  CHAPTERS.forEach((ch, ci) => {
    const people = STORIES.filter((s) => s.chapter === ch.id);
    const got = people.filter((s) => state.seen.has(s.id)).length;
    const unlocked = state.started && ci <= state.chapterIndex;
    const current = state.started && ci === state.chapterIndex;
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ch-item" + (current ? " is-current" : "") + (unlocked ? "" : " is-locked");
    b.disabled = !unlocked;
    const num = document.createElement("span"); num.className = "ch-num"; num.textContent = String(ci + 1).padStart(2, "0");
    const body = document.createElement("span"); body.className = "ch-body";
    const title = document.createElement("span"); title.className = "ch-title"; title.textContent = ch.title;
    const line = document.createElement("span"); line.className = "ch-line"; rich(line, ch.intro);
    const meta = document.createElement("span"); meta.className = "ch-meta";
    const faces = document.createElement("span"); faces.className = "ch-faces";
    people.forEach((s) => {
      const f = document.createElement("span");
      f.className = "ch-face" + (state.seen.has(s.id) ? "" : " is-locked");
      f.style.background = `linear-gradient(160deg, ${s.scene[0]}, ${s.scene[1]})`;
      f.innerHTML = avatarSVG(s.look);
      faces.appendChild(f);
    });
    const status = document.createElement("span"); status.className = "ch-status";
    status.textContent = !state.started ? `${people.length} ${people.length === 1 ? "story" : "stories"}`
      : !unlocked ? `Unlocks after Chapter ${ci} · ${CHAPTERS[ci - 1].title}`
      : `${current ? "You are here · " : ""}${got} of ${people.length} collected`;
    meta.append(faces, status);
    body.append(title, line, meta);
    b.append(num, body);
    b.setAttribute("aria-label", `Chapter ${ci + 1}, ${ch.title}. ${plain(ch.intro)} ${status.textContent}`);
    if (unlocked) b.addEventListener("click", () => {
      $("#chapters").hidden = true;
      const target = cards.find((c) => !c.mine && c.chapterIdx === ci && !state.seen.has(c.story.id)) || cards.find((c) => !c.mine && c.chapterIdx === ci);
      turnTo(target);
    });
    li.appendChild(b);
    list.appendChild(li);
  });
  $("#chapters-sub").textContent = state.started
    ? "Open one story in a chapter to unlock the next. Tap a chapter you've reached to go there."
    : "Six pillars, one path. Open one story in a chapter to unlock the next.";
  $("#chapters").hidden = false;
  $("#chapters .sheet-close").focus();
}
$("#btn-chapters")?.addEventListener("click", openChapters);
$("#intro-chapters")?.addEventListener("click", openChapters);

/* ---------------- add your own story ---------------- */
const draft = {
  name: "", role: "", chapter: CHAPTERS[0].id, quote: "",
  look: { skin: AVATAR_OPTIONS.skin[2], hair: "short", hairColor: AVATAR_OPTIONS.hairColor[0], beard: "none", glasses: null,
          outfit: { type: "tshirt", color: AVATAR_OPTIONS.outfitColor[0] }, smile: "soft" },
};
const previewCanvas = $("#create-preview");
let previewAvatar = null, previewTimer;

function draftStory() {
  return {
    id: "mine-" + Date.now(), chapter: draft.chapter,
    name: draft.name.trim() || "Your name",
    role: draft.role.trim() || "Your role",
    quote: draft.quote.trim() ? `“${draft.quote.trim().replace(/^["“]|["”]$/g, "")}”` : "“Write the moment you *made it real*.”",
    scene: ["#0070AD", "#0b1530"],
    look: JSON.parse(JSON.stringify(draft.look)),
  };
}
function renderPreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(async () => {
    const s = draftStory();
    previewAvatar = await avatarImage(s.look);
    previewCanvas.width = CARD_BASE_W; previewCanvas.height = CARD_BASE_H;
    drawStoryCard(previewCanvas.getContext("2d"), s, { pillar: pillarOf(s), avatar: previewAvatar, logo: state.logo });
  }, 60);
}

function swatches(el, colors, get, set) {
  el.textContent = "";
  colors.forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.style.background = c;
    b.setAttribute("aria-label", c);
    b.setAttribute("aria-pressed", String(get() === c));
    b.addEventListener("click", () => { set(c); el.querySelectorAll(".swatch").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); renderPreview(); });
    el.appendChild(b);
  });
}
function options(sel, list, value) {
  sel.textContent = "";
  list.forEach(([v, label]) => { const o = document.createElement("option"); o.value = v; o.textContent = label; o.selected = v === value; sel.appendChild(o); });
}

function setupCreate() {
  options($("#c-pillar"), CHAPTERS.map((c) => [c.id, c.title]), draft.chapter);
  options($("#c-hair"), AVATAR_OPTIONS.hair, draft.look.hair);
  options($("#c-beard"), AVATAR_OPTIONS.beard, draft.look.beard);
  options($("#c-outfit"), AVATAR_OPTIONS.outfit, draft.look.outfit.type);
  swatches($("#c-skin"), AVATAR_OPTIONS.skin, () => draft.look.skin, (c) => (draft.look.skin = c));
  swatches($("#c-haircolor"), AVATAR_OPTIONS.hairColor, () => draft.look.hairColor, (c) => (draft.look.hairColor = c));
  swatches($("#c-outfitcolor"), AVATAR_OPTIONS.outfitColor, () => draft.look.outfit.color, (c) => (draft.look.outfit.color = c));
  const bind = (id, fn) => $(id).addEventListener("input", (e) => { fn(e.target); renderPreview(); });
  bind("#c-name", (t) => (draft.name = t.value));
  bind("#c-role", (t) => (draft.role = t.value));
  bind("#c-quote", (t) => { draft.quote = t.value; $("#c-quote-count").textContent = `${t.value.length} / 140`; });
  bind("#c-pillar", (t) => (draft.chapter = t.value));
  bind("#c-hair", (t) => (draft.look.hair = t.value));
  bind("#c-beard", (t) => (draft.look.beard = t.value));
  bind("#c-outfit", (t) => {
    draft.look.outfit.type = t.value;
    if (t.value === "saree") Object.assign(draft.look.outfit, { accent: "#6b1f2e", accent2: "#c9a24a" });
    if (t.value === "kurta-dupatta") Object.assign(draft.look.outfit, { accent: "#147c8a", accent2: "#c9a24a" });
    if (t.value === "blazer") Object.assign(draft.look.outfit, { accent: "#f4f4f4" });
    if (t.value === "kurta") Object.assign(draft.look.outfit, { accent2: "#c9a24a" });
  });
  options($("#c-glasses"), AVATAR_OPTIONS.glasses, "none");
  options($("#c-earrings"), AVATAR_OPTIONS.earrings, "none");
  options($("#c-headwear"), AVATAR_OPTIONS.headwear, "none");
  swatches($("#c-headwearcolor"), AVATAR_OPTIONS.headwearColor, () => draft.look.headwear?.color, (c) => { if (draft.look.headwear) draft.look.headwear.color = c; });
  bind("#c-glasses", (t) => (draft.look.glasses = t.value === "none" ? null : { color: "#1b1b1b", shape: t.value }));
  bind("#c-earrings", (t) => (draft.look.earrings = t.value === "none" ? null : { color: "#d4a537", style: t.value }));
  bind("#c-headwear", (t) => {
    draft.look.headwear = t.value === "none" ? null : { type: t.value, color: draft.look.headwear?.color || AVATAR_OPTIONS.headwearColor[0] };
    $("#c-headwear-colors").hidden = !draft.look.headwear;
    swatches($("#c-headwearcolor"), AVATAR_OPTIONS.headwearColor, () => draft.look.headwear?.color, (c) => { if (draft.look.headwear) draft.look.headwear.color = c; });
  });
  const extras = $("#c-extras");
  AVATAR_OPTIONS.extras.forEach(([key, label]) => {
    const l = document.createElement("label");
    const i = document.createElement("input");
    i.type = "checkbox"; i.id = "c-x-" + key;
    i.addEventListener("input", () => { draft.look[key] = i.checked; renderPreview(); });
    l.append(i, " " + label);
    extras.appendChild(l);
  });
  bind("#c-smile", (t) => (draft.look.smile = t.checked ? "big" : "soft"));
}
setupCreate();

function openCreate() {
  lastFocus = document.activeElement;
  $("#collection").hidden = true;
  $("#finale").classList.remove("is-active");
  $("#create").hidden = false;
  renderPreview();
  $("#c-name").focus();
}
document.querySelectorAll("[data-open-create]").forEach((b) => b.addEventListener("click", openCreate));
$("#create-form")?.addEventListener("submit", (e) => e.preventDefault());

function validDraft() {
  const missing = [];
  if (!draft.name.trim()) missing.push("your name");
  if (!draft.quote.trim()) missing.push("your quote");
  if (missing.length) { toast(`Add ${missing.join(" and ")} first`); (draft.name.trim() ? $("#c-quote") : $("#c-name")).focus(); return false; }
  return true;
}
$("#create-place")?.addEventListener("click", () => {
  if (!validDraft()) return;
  const s = draftStory();
  state.mine.push(s);
  store.set("mine", state.mine);
  const card = makeCard(s, true);
  layout();
  loadAvatar(s);
  drawCard(card);
  $("#create").hidden = true;
  if (!state.started) { begin("virtual"); }
  card.mesh.visible = card.glow.visible = true;
  card.revealing = true;
  setTimeout(() => turnTo(card), 300);
  toast("Your story is now on the path");
});
$("#create-save")?.addEventListener("click", () => { if (validDraft()) saveCard(draftStory()); });
$("#create-share")?.addEventListener("click", () => { if (validDraft()) shareCard(draftStory(), true); });

/* ---------------- sheets: close + escape ---------------- */
document.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => {
  const sheet = el.closest(".sheet");
  if (sheet.id === "story") closeStory();
  else { sheet.hidden = true; lastFocus?.focus?.(); }
}));
addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!$("#story").hidden) closeStory();
  else document.querySelectorAll(".sheet:not([hidden])").forEach((s) => (s.hidden = true));
});
function anySheetOpen() {
  return [...document.querySelectorAll(".sheet")].some((s) => !s.hidden) || $("#finale").classList.contains("is-active");
}

/* ---------------- finale ---------------- */
$("#finale-replay")?.addEventListener("click", () => $("#finale").classList.remove("is-active"));
$("#finale-collection")?.addEventListener("click", () => { $("#finale").classList.remove("is-active"); openCollection(); });

/* ---------------- deep link: #story=<id> ---------------- */
function deepLinkStory() {
  const m = location.hash.match(/story=([\w-]+)/);
  return m ? cards.find((c) => c.story.id === m[1]) || null : null;
}

/* ---------------- render loop ---------------- */
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (state.gyro) applyGyro();
  else {
    if (!state.started && !reduceMotion) look.tYaw -= dt * 0.05;
    look.yaw += (look.tYaw - look.yaw) * Math.min(1, dt * 8);
    look.pitch += (look.tPitch - look.pitch) * Math.min(1, dt * 8);
    camera.rotation.set(look.pitch, look.yaw, 0, "YXZ");
  }

  const next = nextCard();
  for (const c of cards) {
    if (c.mesh.visible) {
      if (c.revealing) { c.reveal = Math.min(1, c.reveal + dt * 1.6); if (c.reveal >= 1) c.revealing = false; }
      const e = 1 - Math.pow(1 - c.reveal, 3);
      const seen = c.mine || state.seen.has(c.story.id);
      const isNext = c === next;
      const pulse = isNext && !reduceMotion ? 1 + Math.sin(t * 3) * 0.025 : 1;
      c.mesh.scale.setScalar(Math.max(0.0001, e * pulse));
      c.mesh.position.y = c.baseY + (reduceMotion ? 0 : Math.sin(t * 0.9 + c.phase) * 0.04);
      c.glow.position.y = c.mesh.position.y;
      c.glow.material.opacity = e * (seen ? 0.22 : isNext ? 0.75 + Math.sin(t * 3) * 0.2 : 0.5);
      c.node.visible = false;
    } else {
      // undiscovered stops on the map: small beacons along the dim path
      c.node.visible = true;
      c.node.material.opacity = 0.35 + (reduceMotion ? 0 : Math.sin(t * 1.5 + c.index) * 0.15);
    }
  }

  for (const sp of signposts) {
    sp.sprite.visible = !!sp.card && sp.card.mesh.visible;
    if (sp.sprite.visible) {
      sp.sprite.material.opacity = Math.min(1, sp.card.reveal * 1.2);
      sp.sprite.position.y = sp.card.mesh.position.y + 0.98;
    }
  }

  // path grows toward the newest revealed card; a light travels along it
  if (path.curve && path.dim) {
    path.frac += (path.target - path.frac) * Math.min(1, dt * 1.6);
    const tris = Math.floor((path.frac * path.count) / 6) * 6;
    path.lit.geometry.setDrawRange(0, tris);
    path.dim.geometry.setDrawRange(tris, path.count - tris);
    path.pulse.visible = path.frac > 0.01;
    if (path.pulse.visible) {
      const u = reduceMotion ? path.frac : ((t * 0.08) % 1) * path.frac;
      path.pulse.position.copy(path.curve.getPoint(u));
    }
  }

  if (!reduceMotion) sparks.rotation.y = t * 0.01;
  ring.material.opacity = 0.22 + Math.sin(t * 1.2) * 0.08;

  updateGuides();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------------- desktop: hand off to phone ---------------- */
(function phoneHandoff() {
  const isPhone = matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
  const box = $("#handoff");
  if (isPhone || !box || typeof window.qrcode !== "function") return;
  const url = CAMPAIGN.liveUrl || new URL("./", location.href).href;
  box.querySelector(".url").textContent = url.replace(/^https:\/\//, "");
  const qr = window.qrcode(0, "M");
  qr.addData(url);
  qr.make();
  box.querySelector(".qr").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  box.hidden = false;
})();

// ?skip jumps straight into the virtual space (testing / kiosk use)
if (new URLSearchParams(location.search).has("skip")) begin("virtual");
