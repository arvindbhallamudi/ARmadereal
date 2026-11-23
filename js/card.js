// =====================================================================
//  Story card artwork, laid out like the #MadeRealHere campaign posters:
//  quote top-left with highlighted words, name + role, pillar and hashtag
//  bottom-left, logo bottom-right, illustrated portrait on the right.
//  Drawn on a 4:5 canvas; `scale` lets the same layout export at high res.
// =====================================================================

export const CARD_BASE_W = 640, CARD_BASE_H = 800;
const VIBRANT = "#12ABDB";

export function roundRect(x, X, Y, W, H, r) {
  x.beginPath();
  x.moveTo(X + r, Y);
  x.arcTo(X + W, Y, X + W, Y + H, r);
  x.arcTo(X + W, Y + H, X, Y + H, r);
  x.arcTo(X, Y + H, X, Y, r);
  x.arcTo(X, Y, X + W, Y, r);
  x.closePath();
}

// "“*a* b”" -> words, each a list of coloured segments: [[{t:"“"},{t:"a",hl:true}], [{t:"b”"}]]
function tokens(text) {
  const words = [];
  let hl = false, word = [], seg = "";
  const flush = () => { if (seg) { word.push({ t: seg, hl }); seg = ""; } };
  for (const ch of text) {
    if (ch === "*") { flush(); hl = !hl; }
    else if (/\s/.test(ch)) { flush(); if (word.length) { words.push(word); word = []; } }
    else seg += ch;
  }
  flush();
  if (word.length) words.push(word);
  return words;
}
const wordWidth = (x, w) => w.reduce((a, s) => a + x.measureText(s.t).width, 0);

function layoutWords(x, words, maxW) {
  const lines = [[]];
  let width = 0;
  const space = x.measureText(" ").width;
  for (const w of words) {
    const ww = wordWidth(x, w);
    const line = lines[lines.length - 1];
    if (line.length && width + space + ww > maxW) { lines.push([w]); width = ww; }
    else { width += (line.length ? space : 0) + ww; line.push(w); }
  }
  return lines;
}

export function wrapPlain(x, text, maxW) {
  return layoutWords(x, tokens(text.replace(/\*/g, "")), maxW).map((l) => l.map((w) => w.map((s) => s.t).join("")).join(" "));
}

/**
 * @param ctx      2D context of a canvas sized CARD_BASE_W*scale x CARD_BASE_H*scale
 * @param story    { name, role, quote, scene:[c1,c2] }
 * @param opts     { pillar, avatar: Image|null, logo: Image|null, status: null|"open"|"heard", scale }
 */
export function drawStoryCard(ctx, story, opts = {}) {
  const s = opts.scale || 1;
  const W = CARD_BASE_W, H = CARD_BASE_H;
  const x = ctx;
  x.save();
  x.setTransform(s, 0, 0, s, 0, 0);
  x.clearRect(0, 0, W, H);

  // ---- background, clipped to the card ----
  x.save();
  roundRect(x, 4, 4, W - 8, H - 8, 30);
  x.clip();
  const [c1, c2] = story.scene || ["#0070AD", "#0b1530"];
  const bg = x.createLinearGradient(0, 0, W * 0.4, H);
  bg.addColorStop(0, c1);
  bg.addColorStop(1, c2);
  x.fillStyle = bg;
  x.fillRect(0, 0, W, H);

  // soft light behind the portrait + brand arcs
  const glow = x.createRadialGradient(470, 520, 20, 470, 520, 330);
  glow.addColorStop(0, "rgba(18,171,219,0.38)");
  glow.addColorStop(1, "rgba(18,171,219,0)");
  x.fillStyle = glow;
  x.fillRect(0, 0, W, H);
  x.strokeStyle = "rgba(255,255,255,0.10)";
  x.lineWidth = 2;
  [250, 300, 350].forEach((r) => { x.beginPath(); x.arc(480, 560, r, Math.PI * 1.05, Math.PI * 1.75); x.stroke(); });

  // portrait
  if (opts.avatar) x.drawImage(opts.avatar, 232, 300, 400, 500);

  // legibility: darken top-left where the quote sits, and the bottom band
  const tl = x.createLinearGradient(0, 0, 0, 460);
  tl.addColorStop(0, "rgba(5,10,26,0.55)");
  tl.addColorStop(1, "rgba(5,10,26,0)");
  x.fillStyle = tl;
  x.fillRect(0, 0, W, 460);
  const bt = x.createLinearGradient(0, H - 200, 0, H);
  bt.addColorStop(0, "rgba(5,10,26,0)");
  bt.addColorStop(1, "rgba(5,10,26,0.6)");
  x.fillStyle = bt;
  x.fillRect(0, H - 200, W, 200);
  x.restore();

  // ---- quote (fit to the space above the portrait) ----
  const toks = tokens(story.quote || "");
  let size = 50, lines;
  for (; size >= 26; size -= 2) {
    x.font = `300 ${size}px Ubuntu, "Segoe UI", sans-serif`;
    lines = layoutWords(x, toks, W - 96);
    if (lines.length * size * 1.12 <= 300) break;
  }
  const lh = size * 1.12;
  let y = 60 + size;
  x.textBaseline = "alphabetic";
  x.textAlign = "left";
  const space = x.measureText(" ").width;
  for (const line of lines) {
    let cx = 48;
    for (const w of line) {
      for (const seg of w) {
        x.fillStyle = seg.hl ? VIBRANT : "#ffffff";
        x.fillText(seg.t, cx, y);
        cx += x.measureText(seg.t).width;
      }
      cx += space;
    }
    y += lh;
  }

  // ---- name + role ----
  y += 26;
  x.fillStyle = "#ffffff";
  x.font = `500 28px Ubuntu, "Segoe UI", sans-serif`;
  wrapPlain(x, story.name || "", 250).slice(0, 2).forEach((l) => { x.fillText(l, 48, y); y += 34; });
  x.font = `300 22px Ubuntu, "Segoe UI", sans-serif`;
  x.fillStyle = "rgba(255,255,255,0.88)";
  wrapPlain(x, story.role || "", 230).slice(0, 3).forEach((l) => { x.fillText(l, 48, y); y += 28; });

  // ---- status chip ----
  if (opts.status) {
    const heard = opts.status === "heard";
    const label = heard ? "✓ Collected" : "Tap to open";
    x.font = `500 22px Ubuntu, "Segoe UI", sans-serif`;
    const pw = x.measureText(label).width + 40, ph = 44, px = 48, py = H - 186;
    roundRect(x, px, py, pw, ph, 22);
    x.fillStyle = heard ? "rgba(5,10,26,0.75)" : VIBRANT;
    x.fill();
    x.fillStyle = heard ? VIBRANT : "#04122b";
    x.textBaseline = "middle";
    x.fillText(label, px + 20, py + ph / 2 + 1);
    x.textBaseline = "alphabetic";
  }

  // ---- pillar + hashtag, bottom-left ----
  x.fillStyle = "#ffffff";
  x.font = `500 28px Ubuntu, "Segoe UI", sans-serif`;
  x.fillText((opts.pillar || "").toUpperCase(), 48, H - 82);
  x.font = `300 24px Ubuntu, "Segoe UI", sans-serif`;
  x.fillText("#MadeRealHere", 48, H - 50);

  // ---- logo, bottom-right ----
  if (opts.logo) {
    const lw = 150, lh2 = lw * (opts.logo.naturalHeight / opts.logo.naturalWidth || 0.25);
    x.drawImage(opts.logo, W - 44 - lw, H - 46 - lh2, lw, lh2);
  }

  // ---- frame ----
  roundRect(x, 4, 4, W - 8, H - 8, 30);
  x.lineWidth = 5;
  x.strokeStyle = opts.status === "heard" ? VIBRANT : "rgba(255,255,255,0.45)";
  x.stroke();
  x.restore();
}
