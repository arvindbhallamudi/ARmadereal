import * as THREE from "three";
import { CAMPAIGN, CHAPTERS, STORIES } from "./stories.js";

/* =====================================================================
   #MadeRealHere — browser AR experience
   - Rear camera feed behind a transparent WebGL scene (iOS + Android)
   - Device orientation drives the virtual camera, so stories stay
     anchored in the room around the viewer
   - Falls back to drag-to-look when there's no camera / gyro (desktop)
   ===================================================================== */

const $ = (s) => document.querySelector(s);
const DEG = Math.PI / 180;
const RADIUS = 3.4;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
  mode: null,              // "ar" | "virtual"
  gyro: false,
  started: false,
  chapterIndex: -1,
  seen: new Set(),
  images: {},              // story.id -> HTMLImageElement
  finaleShown: false,
};

/* *word* -> highlighted span (campaign poster style), built without innerHTML */
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

/* ---------------- intro text ---------------- */
$("#tagline").textContent = CAMPAIGN.tagline;
rich($("#finale-title"), CAMPAIGN.finale.title);
$("#finale-body").textContent = CAMPAIGN.finale.body;
setLink($("#finale-primary"), CAMPAIGN.finale.primary);
setLink($("#finale-secondary"), CAMPAIGN.finale.secondary);
function setLink(el, cfg) {
  if (!cfg) return el.remove();
  el.textContent = cfg.label;
  el.href = cfg.url;
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

/* ---------------- ambient particles ("sparks") ---------------- */
const sparks = (() => {
  const N = 420;
  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = 2 + Math.random() * 7;
    const th = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 6;
    pos.set([Math.cos(th) * r, y, Math.sin(th) * r], i * 3);
    seed[i] = Math.random() * 100;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
  const m = new THREE.PointsMaterial({
    size: 0.05, map: glowTexture("#9fe9ff"), transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9,
  });
  const p = new THREE.Points(g, m);
  world.add(p);
  return p;
})();

/* floor ring for a sense of place */
const ring = new THREE.Mesh(
  new THREE.RingGeometry(RADIUS - 0.02, RADIUS + 0.02, 128),
  new THREE.MeshBasicMaterial({ color: 0x12abdb, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = -1.4;
world.add(ring);

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

/* ---------------- story cards ---------------- */
const CARD_W = 1.12, CARD_H = 1.4;
const TEX_W = 640, TEX_H = 800;
const cards = []; // { story, chapterIdx, mesh, glow, canvas, ctx, tex, baseY, phase, reveal }

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
}

function roundRect(x, X, Y, W, H, r) {
  x.beginPath();
  x.moveTo(X + r, Y);
  x.arcTo(X + W, Y, X + W, Y + H, r);
  x.arcTo(X + W, Y + H, X, Y + H, r);
  x.arcTo(X, Y + H, X, Y, r);
  x.arcTo(X, Y, X + W, Y, r);
  x.closePath();
}

function wrap(x, text, maxW) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (x.measureText(t).width > maxW && line) { lines.push(line); line = w; }
    else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function drawCard(card) {
  const { ctx: x, story } = card;
  const seen = state.seen.has(story.id);
  const img = state.images[story.id];
  x.clearRect(0, 0, TEX_W, TEX_H);

  // poster, clipped to a rounded card
  x.save();
  roundRect(x, 4, 4, TEX_W - 8, TEX_H - 8, 28);
  x.clip();
  if (img) {
    const s = Math.max(TEX_W / img.width, TEX_H / img.height);
    const w = img.width * s, h = img.height * s;
    x.drawImage(img, (TEX_W - w) / 2, (TEX_H - h) / 2, w, h);
  } else {
    const g = x.createLinearGradient(0, 0, 0, TEX_H);
    g.addColorStop(0, "#0070AD");
    g.addColorStop(1, "#0b1530");
    x.fillStyle = g;
    x.fillRect(0, 0, TEX_W, TEX_H);
    x.fillStyle = "#fff";
    x.textAlign = "center";
    x.font = "300 44px Ubuntu, sans-serif";
    wrap(x, plain(story.quote), TEX_W - 120).slice(0, 6).forEach((l, i) => x.fillText(l, TEX_W / 2, 200 + i * 56));
    x.font = "500 34px Ubuntu, sans-serif";
    x.fillText(story.name, TEX_W / 2, 620);
  }
  x.restore();

  // frame
  roundRect(x, 4, 4, TEX_W - 8, TEX_H - 8, 28);
  x.lineWidth = 6;
  x.strokeStyle = seen ? "#12ABDB" : "rgba(255,255,255,0.55)";
  x.stroke();

  // CTA pill, bottom centre (posters keep their own labels bottom-left/right)
  const label = seen ? "✓ Story heard" : "Tap to open";
  x.font = "500 26px Ubuntu, sans-serif";
  const pw = x.measureText(label).width + 56, ph = 54, px = (TEX_W - pw) / 2, py = TEX_H - 96;
  roundRect(x, px, py, pw, ph, 27);
  x.fillStyle = seen ? "rgba(11,21,48,0.82)" : "#12ABDB";
  x.fill();
  x.fillStyle = seen ? "#12ABDB" : "#04122b";
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText(label, TEX_W / 2, py + ph / 2 + 1);
  x.textBaseline = "alphabetic";

  card.tex.needsUpdate = true;
}

const cardGeo = new THREE.PlaneGeometry(CARD_W, CARD_H);
const glowTex = glowTexture("#12abdb");

CHAPTERS.forEach((ch, ci) => {
  const list = STORIES.filter((s) => s.chapter === ch.id);
  const spread = 24; // degrees between cards
  list.forEach((story, i) => {
    const yaw = (ch.direction + (i - (list.length - 1) / 2) * spread) * DEG;
    const c = document.createElement("canvas");
    c.width = TEX_W; c.height = TEX_H;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mesh = new THREE.Mesh(cardGeo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    const baseY = (i % 2 ? -0.12 : 0.1);
    mesh.position.set(-Math.sin(yaw) * RADIUS, baseY, -Math.cos(yaw) * RADIUS);
    mesh.lookAt(0, baseY, 0);
    mesh.scale.setScalar(0.0001);
    mesh.visible = false;

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    glow.scale.set(2.6, 2.6, 1);
    glow.position.copy(mesh.position).multiplyScalar(1.04);
    glow.visible = false;

    world.add(glow, mesh);
    const card = { story, chapterIdx: ci, mesh, glow, canvas: c, ctx: c.getContext("2d"), tex, baseY, phase: Math.random() * 6, reveal: 0, revealing: false, yaw };
    mesh.userData.card = card;
    cards.push(card);
  });
});

async function loadAssets() {
  try { await Promise.all(["300 40px Ubuntu", "500 28px Ubuntu"].map((f) => document.fonts.load(f))); } catch {}
  cards.forEach(drawCard);
  await Promise.all(STORIES.filter((s) => s.poster).map((s) => new Promise((res) => {
    const img = new Image();
    img.onload = () => { state.images[s.id] = img; const c = cards.find((k) => k.story.id === s.id); if (c) drawCard(c); res(); };
    img.onerror = () => res();
    img.src = s.poster;
  })));
  cards.forEach(drawCard);
}
loadAssets();

/* ---------------- camera feed ---------------- */
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
    return true;
  } catch (e) {
    console.warn("Camera unavailable", e);
    return false;
  }
}

/* ---------------- orientation controls ---------------- */
const orient = { alpha: 0, beta: 90, gamma: 0, has: false };
const zee = new THREE.Vector3(0, 0, 1);
const euler = new THREE.Euler();
const q0 = new THREE.Quaternion();
const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -PI/2 around X
const qYaw = new THREE.Quaternion();
let yawOffset = 0; // user drag adjustment in gyro mode

function onOrient(e) {
  if (e.alpha == null && e.beta == null) return;
  orient.alpha = e.alpha || 0; orient.beta = e.beta || 0; orient.gamma = e.gamma || 0;
  if (!orient.has) { orient.has = true; state.gyro = true; }
}

async function startOrientation() {
  const DOE = window.DeviceOrientationEvent;
  if (!DOE) return false;
  if (typeof DOE.requestPermission === "function") {
    try {
      const r = await DOE.requestPermission(); // iOS — must be inside a tap
      if (r !== "granted") return false;
    } catch { return false; }
  }
  addEventListener("deviceorientation", onOrient, true);
  // Wait briefly to see if real sensor data arrives (desktops fire nothing / nulls)
  await new Promise((r) => setTimeout(r, 600));
  return orient.has;
}

function screenAngle() {
  return ((screen.orientation && screen.orientation.angle) ?? window.orientation ?? 0) * DEG;
}

function applyGyro() {
  euler.set(orient.beta * DEG, orient.alpha * DEG, -orient.gamma * DEG, "YXZ");
  camera.quaternion.setFromEuler(euler);
  camera.quaternion.multiply(q1);
  camera.quaternion.multiply(q0.setFromAxisAngle(zee, -screenAngle()));
  qYaw.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawOffset);
  camera.quaternion.premultiply(qYaw);
}

/* drag-to-look (desktop / no gyro) + tap detection */
const look = { yaw: 0, pitch: 0, tYaw: 0, tPitch: 0 };
let drag = null;
canvas.addEventListener("pointerdown", (e) => {
  drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: 0 };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.x = e.clientX; drag.y = e.clientY;
  drag.moved += Math.abs(dx) + Math.abs(dy);
  const k = 0.0045;
  if (state.gyro) yawOffset += dx * k;
  else {
    look.tYaw += dx * k;
    look.tPitch = THREE.MathUtils.clamp(look.tPitch + dy * k, -1.1, 1.1);
  }
});
canvas.addEventListener("pointerup", (e) => {
  if (drag && drag.moved < 10) tap(e.clientX, e.clientY);
  drag = null;
});
canvas.addEventListener("pointercancel", () => (drag = null));
addEventListener("keydown", (e) => {
  if (!state.started || anySheetOpen()) return;
  if (e.key === "ArrowLeft") look.tYaw += 0.25;
  if (e.key === "ArrowRight") look.tYaw -= 0.25;
});

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function tap(x, y) {
  if (!state.started || anySheetOpen()) return;
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(cards.filter((c) => c.mesh.visible).map((c) => c.mesh));
  if (hits[0]) openStory(hits[0].object.userData.card.story);
}

/* ---------------- recenter ---------------- */
const fwd = new THREE.Vector3();
function cameraYaw() {
  camera.getWorldDirection(fwd);
  return Math.atan2(-fwd.x, -fwd.z);
}
function recenter(chapterIdx = Math.max(0, state.chapterIndex), animate = false) {
  const target = cameraYaw() - CHAPTERS[chapterIdx].direction * DEG;
  if (!animate) { world.rotation.y = target; return; }
  const from = world.rotation.y;
  let d = ((target - from + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / 700);
    world.rotation.y = from + d * (1 - Math.pow(1 - k, 3));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
$("#btn-recenter").addEventListener("click", () => {
  if (state.gyro) recenter(currentTargetChapter(), true);
  else {
    // turn the shortest way toward the chapter that still has unheard stories
    const target = CHAPTERS[currentTargetChapter()].direction * DEG + world.rotation.y;
    const d = ((target - look.tYaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    look.tYaw += d;
    look.tPitch = 0;
  }
});
function currentTargetChapter() {
  const next = cards.find((c) => c.mesh.visible && !state.seen.has(c.story.id));
  return next ? next.chapterIdx : Math.max(0, state.chapterIndex);
}

/* ---------------- narrative ---------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const narr = $("#narration");
async function say(text, hold = 2600) {
  rich(narr, text);
  narr.classList.add("show");
  await sleep(hold);
  narr.classList.remove("show");
  await sleep(700);
}

let hintTimer;
function hint(text, ms = 3500) {
  const h = $("#hint");
  h.textContent = text;
  h.classList.add("show");
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => h.classList.remove("show"), ms);
}

function toast(text) {
  const t = $("#toast");
  t.textContent = text;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}

async function showChapter(ci) {
  state.chapterIndex = ci;
  const ch = CHAPTERS[ci];
  const b = $("#chapter-banner");
  b.querySelector(".chapter-num").textContent = `Chapter ${ci + 1} of ${CHAPTERS.length}`;
  b.querySelector(".chapter-title").textContent = ch.title;
  rich(b.querySelector(".chapter-intro"), ch.intro);
  b.classList.add("show");
  await sleep(2800);
  b.classList.remove("show");
  cards.filter((c) => c.chapterIdx === ci).forEach((c, i) => {
    setTimeout(() => { c.mesh.visible = c.glow.visible = true; c.revealing = true; }, i * 350);
  });
  await sleep(600);
  hint(ci === 0 ? (state.gyro ? "Move your phone to look around · tap a card" : "Drag to look around · tap a card")
                : "Follow the arrow to find the next stories", 4500);
}

async function begin(mode) {
  state.mode = mode;
  state.started = true;
  $("#intro").classList.remove("is-active");
  $("#hud").hidden = false;
  updateProgress();

  if (state.gyro) {
    await sleep(50);
    recenter(0); // place chapter 1 in front of wherever the viewer faces
  } else {
    look.tYaw = look.yaw = Math.round(look.yaw / (Math.PI * 2)) * Math.PI * 2;
    look.tPitch = look.pitch = 0;
  }
  for (const line of CAMPAIGN.prologue) await say(line, 2400);
  await showChapter(0);
}

$("#start-ar").addEventListener("click", async (e) => {
  e.currentTarget.disabled = true;
  e.currentTarget.textContent = "Starting…";
  // Orientation permission must be requested synchronously-ish inside the tap on iOS
  const [gyroOk, camOk] = await Promise.all([startOrientation(), startCamera()]);
  if (!camOk) toast("Camera not available — showing the virtual space instead");
  begin(camOk ? "ar" : "virtual");
});
$("#start-virtual").addEventListener("click", async () => {
  await startOrientation(); // still use motion if the phone has it
  begin("virtual");
});

/* ---------------- story sheet ---------------- */
function thumbStyle(el, story) {
  if (story.poster) { el.style.backgroundImage = `url("${story.poster}")`; el.textContent = ""; }
  else {
    el.style.backgroundImage = "linear-gradient(135deg, #0070AD, #12ABDB)";
    el.textContent = initials(story.name);
  }
}

let openId = null;
let lastFocus = null;
function openStory(story) {
  openId = story.id;
  lastFocus = document.activeElement;
  const ch = CHAPTERS.find((c) => c.id === story.chapter);
  const ci = CHAPTERS.indexOf(ch);
  const poster = $("#story-poster");
  poster.hidden = !story.poster;
  if (story.poster) { poster.src = story.poster; poster.alt = `${story.name}, ${story.role}: “${plain(story.quote)}”`; }
  $("#story-chapter").textContent = `Chapter ${ci + 1} · ${ch.title}`;
  $("#story-name").textContent = story.name;
  $("#story-role").textContent = [story.role, story.team].filter(Boolean).join(" · ");
  $("#story-meta").textContent = [story.location, story.since && `At Capgemini since ${story.since}`].filter(Boolean).join(" · ");
  $("#story-meta").hidden = !$("#story-meta").textContent;
  $("#story-placeholder").hidden = !story.placeholder;
  rich($("#story-quote"), `“${story.quote}”`);
  const body = $("#story-body");
  body.innerHTML = "";
  (story.story || []).forEach((p) => { const el = document.createElement("p"); el.textContent = p; body.appendChild(el); });
  if (story.video) {
    const v = document.createElement("video");
    v.src = story.video; v.controls = true; v.playsInline = true;
    body.appendChild(v);
  }
  const remaining = STORIES.length - new Set([...state.seen, story.id]).size;
  $("#story-continue").textContent = remaining ? "Continue the journey" : "Finish";
  $("#story").hidden = false;
  $("#story .sheet-close").focus();
}

function closeStory() {
  $("#story").hidden = true;
  if (!openId) return;
  const id = openId; openId = null;
  const isNew = !state.seen.has(id);
  state.seen.add(id);
  const card = cards.find((c) => c.story.id === id);
  if (card) drawCard(card);
  updateProgress();
  lastFocus?.focus?.();
  if (isNew) advance();
}

function advance() {
  if (state.seen.size >= STORIES.length) { setTimeout(showFinale, 900); return; }
  // unlock the next chapter once every story in the unlocked chapters is heard
  const unlockedDone = cards.filter((c) => c.chapterIdx <= state.chapterIndex).every((c) => state.seen.has(c.story.id));
  if (unlockedDone && state.chapterIndex < CHAPTERS.length - 1) setTimeout(() => showChapter(state.chapterIndex + 1), 700);
}

function updateProgress() {
  const n = state.seen.size, t = STORIES.length;
  $("#progress-text").textContent = `${n} / ${t} stories`;
  $("#progress-fill").style.width = `${(n / t) * 100}%`;
}

/* ---------------- list sheet ---------------- */
function openList() {
  lastFocus = document.activeElement;
  const body = $("#list-body");
  body.innerHTML = "";
  CHAPTERS.forEach((ch, ci) => {
    const sec = document.createElement("div");
    sec.className = "list-chapter";
    sec.innerHTML = `<h3>Chapter ${ci + 1} · ${ch.title}</h3>`;
    STORIES.filter((s) => s.chapter === ch.id).forEach((s) => {
      const b = document.createElement("button");
      b.className = "list-item";
      const av = document.createElement("span"); av.className = "av"; thumbStyle(av, s);
      const tx = document.createElement("span"); tx.className = "tx";
      const nm = document.createElement("div"); nm.className = "nm"; nm.textContent = s.name;
      const hk = document.createElement("div"); hk.className = "hk"; hk.textContent = s.role;
      tx.append(nm, hk);
      const ck = document.createElement("span"); ck.className = "ck"; ck.textContent = state.seen.has(s.id) ? "✓" : "";
      b.append(av, tx, ck);
      b.addEventListener("click", () => {
        $("#list").hidden = true;
        // make sure the card's chapter is revealed in the scene too
        if (ci > state.chapterIndex) {
          for (let k = state.chapterIndex + 1; k <= ci; k++) cards.filter((c) => c.chapterIdx === k).forEach((c) => { c.mesh.visible = c.glow.visible = true; c.revealing = true; });
          state.chapterIndex = ci;
        }
        openStory(s);
      });
      sec.appendChild(b);
    });
    body.appendChild(sec);
  });
  $("#list").hidden = false;
  $("#list .sheet-close").focus();
}
$("#btn-list").addEventListener("click", openList);

document.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => {
  const sheet = el.closest(".sheet");
  if (sheet.id === "story") closeStory();
  else { sheet.hidden = true; lastFocus?.focus?.(); }
}));
addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!$("#story").hidden) closeStory();
  else if (!$("#list").hidden) $("#list").hidden = true;
});
function anySheetOpen() { return !$("#story").hidden || !$("#list").hidden || $("#finale").classList.contains("is-active"); }

/* ---------------- finale ---------------- */
function showFinale() {
  state.finaleShown = true;
  $("#finale").classList.add("is-active");
}
$("#finale-replay").addEventListener("click", () => $("#finale").classList.remove("is-active"));

/* ---------------- off-screen guidance ---------------- */
const tmp = new THREE.Vector3();
const camRight = new THREE.Vector3();
function updateGuides() {
  const L = $("#guide-left"), R = $("#guide-right");
  let show = null;
  if (state.started && !anySheetOpen()) {
    const pending = cards.filter((c) => c.mesh.visible && !state.seen.has(c.story.id));
    let anyInView = false, best = null, bestAng = Infinity;
    for (const c of pending) {
      c.mesh.getWorldPosition(tmp);
      const p = tmp.clone().project(camera);
      if (p.z < 1 && Math.abs(p.x) < 0.95 && Math.abs(p.y) < 0.95) { anyInView = true; break; }
      camera.getWorldDirection(fwd);
      const ang = fwd.angleTo(tmp.clone().normalize());
      if (ang < bestAng) { bestAng = ang; best = tmp.clone(); }
    }
    if (!anyInView && best) {
      camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
      show = best.dot(camRight) > 0 ? "right" : "left";
    }
  }
  L.classList.toggle("show", show === "left");
  R.classList.toggle("show", show === "right");
}

/* ---------------- render loop ---------------- */
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (state.gyro) applyGyro();
  else {
    if (!state.started && !reduceMotion) look.tYaw += dt * 0.05; // idle drift behind intro
    look.yaw += (look.tYaw - look.yaw) * Math.min(1, dt * 8);
    look.pitch += (look.tPitch - look.pitch) * Math.min(1, dt * 8);
    camera.rotation.set(look.pitch, look.yaw, 0, "YXZ");
  }

  for (const c of cards) {
    if (!c.mesh.visible) continue;
    if (c.revealing) {
      c.reveal = Math.min(1, c.reveal + dt * 1.6);
      if (c.reveal >= 1) c.revealing = false;
    }
    const e = 1 - Math.pow(1 - c.reveal, 3);
    const seen = state.seen.has(c.story.id);
    const pulse = seen ? 1 : 1 + Math.sin(t * 2 + c.phase) * 0.02;
    c.mesh.scale.setScalar(Math.max(0.0001, e * pulse));
    c.mesh.position.y = c.baseY + (reduceMotion ? 0 : Math.sin(t * 0.9 + c.phase) * 0.05);
    c.glow.position.y = c.mesh.position.y;
    c.glow.material.opacity = e * (seen ? 0.25 : 0.6 + Math.sin(t * 2 + c.phase) * 0.15);
  }

  if (!reduceMotion) {
    sparks.rotation.y = t * 0.01;
    sparks.material.opacity = 0.7 + Math.sin(t * 0.7) * 0.2;
  }
  ring.material.opacity = 0.25 + Math.sin(t * 1.2) * 0.08;

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

// Deep link for testing: ?skip skips the intro in virtual mode
if (new URLSearchParams(location.search).has("skip")) begin("virtual");
