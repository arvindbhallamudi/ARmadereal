// =====================================================================
//  Illustrated portraits (no photos). A flat, friendly bust built from a
//  few traits, so every person gets a likeness without using their photo.
//
//  look = {
//    skin, hairColor, hairTip?,                 // hex colours
//    hair: "bald" | "buzz" | "short" | "side-part" | "short-up" | "short-curly"
//        | "pixie" | "afro" | "bun" | "ponytail" | "braid" | "shoulder-layered"
//        | "shoulder-curly" | "long-straight" | "long-wavy" | "long-curly" | "locs",
//    beard: "none" | "stubble" | "mustache" | "goatee" | "short" | "full",
//    glasses: null | { color, shape: "round" | "square" | "cat-eye" },
//    headwear: null | { type: "turban" | "hijab" | "cap" | "headband", color },
//    bindi, noseStud, necklace, headphones, freckles: bool,
//    earrings: null | { color, style: "stud" | "drop" | "hoop" },
//    smile: "soft" | "big", lips?: hex,
//    outfit: { type, color, accent?, accent2?, pattern? },
//      type: "tshirt" | "top" | "polo" | "shirt" | "blazer" | "hoodie" | "turtleneck"
//          | "kurta" | "saree" | "kurta-dupatta" | "kurta-vest"
//    lanyard: bool
//  }
// =====================================================================

function hexToRgb(h) {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

let uid = 0;

export function avatarSVG(look = {}) {
  const L = {
    skin: "#c68a5e", hairColor: "#1b1512", hair: "short", beard: "none",
    smile: "soft", glasses: null, bindi: false, earrings: null, lanyard: false,
    outfit: { type: "tshirt", color: "#0070AD" }, ...look,
  };
  const id = "av" + (++uid);
  const skin = L.skin, skinD = mix(skin, "#000000", 0.2), skinDD = mix(skin, "#000000", 0.35);
  const hc = L.hairColor, hcL = mix(hc, "#ffffff", 0.18);
  const o = { color: "#0070AD", accent: "#12ABDB", accent2: "#d4a537", ...L.outfit };
  const oD = mix(o.color, "#000000", 0.22);
  const hw = L.headwear && L.headwear.type ? L.headwear : null;
  const hwColor = hw ? hw.color || "#0070AD" : null;
  const covered = hw && (hw.type === "hijab" || hw.type === "turban"); // hair hidden
  const defs = [];
  const back = [], body = [], front = [], face = [], acc = [];

  // ---------- hair (back layer, behind body & head) ----------
  const hairFill = L.hairTip ? `url(#${id}hg)` : hc;
  if (L.hairTip) defs.push(`<linearGradient id="${id}hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="${hc}"/><stop offset="1" stop-color="${L.hairTip}"/></linearGradient>`);
  if (!covered) switch (L.hair) {
    case "afro":
      back.push(`<circle cx="200" cy="168" r="122" fill="${hc}"/>`);
      break;
    case "long-curly": {
      back.push(`<path d="M112 176 C84 260 80 360 98 460 L302 460 C320 360 316 260 288 176 Z" fill="${hairFill}"/>`);
      for (let y = 200; y <= 450; y += 38) [96 + (y % 3) * 2, 304 - (y % 3) * 2].forEach((x) => back.push(`<circle cx="${x}" cy="${y}" r="24" fill="${hairFill}"/>`));
      break;
    }
    case "locs":
      for (let i = 0; i < 12; i++) {
        const x = 108 + i * 17, len = 330 + ((i * 37) % 70);
        back.push(`<rect x="${x}" y="150" width="16" height="${len - 150}" rx="8" fill="${i % 2 ? hc : hcL}"/>`);
      }
      break;
    case "ponytail":
      back.push(`<path d="M262 132 C318 150 324 240 300 330 C292 360 270 362 276 330 C292 250 282 180 252 150 Z" fill="${hc}"/><circle cx="262" cy="140" r="14" fill="${hwColor || "#12ABDB"}"/>`);
      break;
    case "long-wavy":
      back.push(`<path d="M116 180 C96 260 84 330 96 400 C104 440 92 470 110 492 L290 492 C308 470 296 440 304 400 C316 330 304 260 284 180 Z" fill="${hairFill}"/>`);
      break;
    case "long-straight":
      back.push(`<path d="M118 180 C104 280 104 380 110 500 L290 500 C296 380 296 280 282 180 Z" fill="${hairFill}"/>`);
      break;
    case "shoulder-curly": {
      back.push(`<path d="M108 170 C70 230 74 320 116 352 C150 372 250 372 284 352 C326 320 330 230 292 170 Z" fill="${hairFill}"/>`);
      const bumps = [[96, 230], [90, 280], [102, 326], [134, 352], [168, 362], [232, 362], [266, 352], [298, 326], [310, 280], [304, 230]];
      bumps.forEach(([x, y]) => back.push(`<circle cx="${x}" cy="${y}" r="22" fill="${hairFill}"/>`));
      break;
    }
    case "shoulder-layered":
      back.push(`<path d="M114 176 C96 240 96 300 110 336 C130 352 160 350 176 340 L224 340 C240 350 270 352 290 336 C304 300 304 240 286 176 Z" fill="${hairFill}"/>`);
      break;
    case "bun":
      back.push(`<circle cx="272" cy="142" r="32" fill="${hc}"/>`);
      break;
  }

  // ---------- neck ----------
  body.push(`<path d="M170 262 L170 340 Q200 356 230 340 L230 262 Z" fill="${skin}"/>`);
  body.push(`<path d="M170 284 Q200 316 230 284 L230 306 Q200 334 170 306 Z" fill="${skinD}" opacity=".55"/>`);

  // ---------- outfit ----------
  const shoulders = (fill, neck = "crew") => {
    const n = {
      crew: "Q200 372 235 344",
      v: "L200 412 L235 344",
      high: "Q200 356 235 344",
    }[neck];
    return `<path d="M18 500 C24 404 98 356 165 344 ${n} C302 356 376 404 382 500 Z" fill="${fill}"/>`;
  };
  if (o.pattern === "dots") defs.push(`<pattern id="${id}pd" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="${o.color}"/><circle cx="4" cy="4" r="1.8" fill="${mix(o.color, "#ffffff", 0.45)}"/><circle cx="12" cy="12" r="1.8" fill="${mix(o.color, "#ffffff", 0.45)}"/></pattern>`);
  if (o.pattern === "print") defs.push(`<pattern id="${id}pd" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="${o.color}"/><path d="M4 6 l4 4 M14 3 q3 4 0 7 M6 16 h6 M16 15 l3 5" stroke="${mix(o.color, "#000000", 0.35)}" stroke-width="1.6" fill="none" stroke-linecap="round"/></pattern>`);
  if (o.pattern === "ditsy") defs.push(`<pattern id="${id}pd" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${o.color}"/><path d="M3 4 l2 1 M10 9 l1 2 M8 2 l1 0" stroke="${mix(o.color, "#ffffff", 0.3)}" stroke-width="1.4" stroke-linecap="round"/></pattern>`);
  const fill = o.pattern ? `url(#${id}pd)` : o.color;

  switch (o.type) {
    case "polo":
      body.push(shoulders(fill));
      body.push(`<path d="M163 340 L200 374 L182 392 L150 354 Z" fill="${mix(o.color, "#ffffff", 0.25)}" stroke="${oD}" stroke-width="2"/>`);
      body.push(`<path d="M237 340 L200 374 L218 392 L250 354 Z" fill="${mix(o.color, "#ffffff", 0.25)}" stroke="${oD}" stroke-width="2"/>`);
      body.push(`<path d="M200 374 L200 430" stroke="${oD}" stroke-width="2"/><circle cx="200" cy="396" r="3" fill="${oD}"/><circle cx="200" cy="416" r="3" fill="${oD}"/>`);
      break;
    case "shirt":
      body.push(shoulders(fill, "v"));
      body.push(`<path d="M160 340 L200 412 L178 420 L144 360 Z" fill="${fill}" stroke="${oD}" stroke-width="3"/>`);
      body.push(`<path d="M240 340 L200 412 L222 420 L256 360 Z" fill="${fill}" stroke="${oD}" stroke-width="3"/>`);
      body.push(`<path d="M200 412 L200 500" stroke="${oD}" stroke-width="3"/>` + [436, 466, 494].map((y) => `<circle cx="207" cy="${y}" r="3" fill="${mix(o.color, "#ffffff", 0.5)}"/>`).join(""));
      break;
    case "blazer":
      body.push(shoulders(o.color));
      body.push(`<path d="M166 342 L200 440 L234 342 Q200 372 166 342 Z" fill="${o.accent || "#ffffff"}"/>`);
      body.push(`<path d="M166 342 L200 440 L176 452 L138 372 Z" fill="${mix(o.color, "#ffffff", 0.12)}"/>`);
      body.push(`<path d="M234 342 L200 440 L224 452 L262 372 Z" fill="${mix(o.color, "#ffffff", 0.12)}"/>`);
      break;
    case "saree":
      body.push(shoulders(o.accent || "#6b1f2e"));
      body.push(`<path d="M300 356 C336 370 364 398 374 444 L382 500 L140 500 C184 446 246 394 300 356 Z" fill="${o.color}"/>`);
      body.push(`<path d="M140 500 C184 446 246 394 300 356" stroke="${o.accent2}" stroke-width="12" fill="none"/>`);
      body.push(`<path d="M164 500 C204 452 258 408 306 376" stroke="${o.accent2}" stroke-width="3" fill="none" opacity=".7"/>`);
      break;
    case "kurta-dupatta":
      body.push(shoulders(fill));
      body.push(`<path d="M258 350 C302 354 342 376 362 424 L374 500 L286 500 C286 440 276 392 258 350 Z" fill="${o.accent}"/>`);
      body.push(`<path d="M272 380 L300 500 M300 372 L332 500 M330 384 L356 500" stroke="${mix(o.accent, "#000000", 0.3)}" stroke-width="5" stroke-dasharray="10 8"/>`);
      body.push(`<path d="M258 350 C302 354 342 376 362 424" stroke="${o.accent2}" stroke-width="6" fill="none"/>`);
      break;
    case "kurta-vest":
      body.push(shoulders(fill, "high"));
      body.push(`<path d="M172 336 Q200 350 228 336 L230 352 Q200 366 170 352 Z" fill="${mix(o.color, "#000000", 0.12)}"/>`);
      body.push(`<path d="M18 500 C24 404 98 356 160 346 L186 500 Z" fill="${o.accent}"/>`);
      body.push(`<path d="M382 500 C376 404 302 356 240 346 L214 500 Z" fill="${o.accent}"/>`);
      body.push(`<path d="M150 352 L172 500 M64 420 L74 500 M328 420 L326 500 M250 352 L228 500" stroke="${o.accent2 || "#111111"}" stroke-width="7"/>`);
      [380, 420, 460].forEach((y) => body.push(`<path d="M${180 + (y - 380) / 16} ${y} q6 -6 12 0 q-6 6 -12 0" fill="#f4efe6"/>`));
      break;
    case "hoodie":
      back.push(`<path d="M118 360 C104 300 140 262 200 262 C260 262 296 300 282 360 Z" fill="${oD}"/>`);
      body.push(shoulders(o.color));
      body.push(`<path d="M150 350 Q200 404 250 350" stroke="${oD}" stroke-width="10" fill="none" stroke-linecap="round"/>`);
      body.push(`<path d="M184 380 L180 440 M216 380 L220 440" stroke="${mix(o.color, "#ffffff", 0.6)}" stroke-width="4" stroke-linecap="round"/>`);
      break;
    case "turtleneck":
      body.push(shoulders(o.color, "high"));
      body.push(`<path d="M168 300 L168 350 Q200 364 232 350 L232 300 Q200 314 168 300 Z" fill="${o.color}"/><path d="M168 316 Q200 330 232 316 M168 332 Q200 346 232 332" stroke="${oD}" stroke-width="3" fill="none"/>`);
      break;
    case "kurta":
      body.push(shoulders(fill, "high"));
      body.push(`<path d="M172 336 Q200 350 228 336 L230 352 Q200 366 170 352 Z" fill="${oD}"/><path d="M200 358 L200 440" stroke="${oD}" stroke-width="3"/>`);
      [378, 400, 422].forEach((y) => body.push(`<circle cx="200" cy="${y}" r="3.5" fill="${o.accent2 || "#d4a537"}"/>`));
      break;
    case "top":
    case "tshirt":
    default:
      body.push(shoulders(fill));
      body.push(`<path d="M165 344 Q200 372 235 344" stroke="${oD}" stroke-width="4" fill="none"/>`);
  }
  if (L.necklace) body.push(`<path d="M166 346 Q200 392 234 346" stroke="#d4a537" stroke-width="3" fill="none"/><circle cx="200" cy="378" r="6" fill="#d4a537"/>`);
  if (hw && hw.type === "hijab") body.push(`<path d="M106 214 C96 120 148 84 200 84 C252 84 304 120 294 214 C300 290 300 330 346 390 C300 420 100 420 54 390 C100 330 100 290 106 214 Z" fill="${hwColor}"/><path d="M120 360 Q200 400 280 360" stroke="${mix(hwColor, "#000000", 0.2)}" stroke-width="4" fill="none"/>`);
  if (L.lanyard) body.push(`<path d="M176 346 L194 500 M224 346 L206 500" stroke="#12ABDB" stroke-width="9" stroke-linecap="round"/><path d="M180 360 L194 500" stroke="#bfeeff" stroke-width="3" opacity=".7"/>`);

  // long hair strands falling in front of the shoulders
  if (!covered && L.hair === "long-wavy") front.push(`<path d="M126 220 C104 290 112 340 100 400 C92 440 112 470 128 486 C148 450 140 420 150 380 C160 330 146 280 140 236 Z" fill="${hairFill}"/>`);
  if (!covered && L.hair === "long-straight") front.push(`<path d="M272 226 C286 300 292 400 292 500 L262 500 C264 400 262 300 256 236 Z" fill="${hairFill}"/>`);

  // ---------- head ----------
  const ears = hw && hw.type === "hijab" ? "" : `<ellipse cx="124" cy="210" rx="15" ry="22" fill="${skin}"/><ellipse cx="276" cy="210" rx="15" ry="22" fill="${skin}"/><ellipse cx="125" cy="212" rx="7" ry="11" fill="${skinD}" opacity=".5"/><ellipse cx="275" cy="212" rx="7" ry="11" fill="${skinD}" opacity=".5"/>`;
  const head = `<path d="M124 188 C124 124 158 106 200 106 C242 106 276 124 276 188 C276 252 248 300 200 302 C152 300 124 252 124 188 Z" fill="${skin}"/>`;

  // ---------- face ----------
  const happy = L.smile === "big";
  face.push(`<circle cx="160" cy="244" r="13" fill="#ff7a70" opacity=".16"/><circle cx="240" cy="244" r="13" fill="#ff7a70" opacity=".16"/>`);
  if (L.freckles) [[150, 236], [160, 230], [168, 240], [232, 240], [240, 230], [250, 236]].forEach(([x, y]) => face.push(`<circle cx="${x}" cy="${y}" r="2.2" fill="${skinDD}" opacity=".55"/>`));
  if (happy) face.push(`<path d="M161 210 Q172 200 183 210 M217 210 Q228 200 239 210" stroke="#2a1d17" stroke-width="5" fill="none" stroke-linecap="round"/>`);
  else face.push(`<ellipse cx="172" cy="210" rx="6.5" ry="7.5" fill="#2a1d17"/><ellipse cx="228" cy="210" rx="6.5" ry="7.5" fill="#2a1d17"/><circle cx="174" cy="207" r="2" fill="#ffffff"/><circle cx="230" cy="207" r="2" fill="#ffffff"/>`);
  face.push(`<path d="M156 189 Q172 180 188 186 M212 186 Q228 180 244 189" stroke="${hc}" stroke-width="5.5" fill="none" stroke-linecap="round"/>`);
  face.push(`<path d="M201 216 Q193 240 199 244 Q206 247 212 242" stroke="${skinDD}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`);

  // ---------- beard ----------
  if (L.beard === "stubble") face.push(`<path d="M134 236 C138 286 168 310 200 312 C232 310 262 286 266 236 C256 272 234 288 200 290 C166 288 144 272 134 236 Z" fill="${hc}" opacity=".28"/>`);
  if (L.beard === "mustache" || L.beard === "goatee") face.push(`<path d="M170 256 Q200 238 230 256 Q214 264 200 257 Q186 264 170 256 Z" fill="${hc}"/>`);
  if (L.beard === "goatee") face.push(`<path d="M180 276 Q200 290 220 276 L216 300 Q200 318 184 300 Z" fill="${hc}"/>`);
  if (L.beard === "short" || L.beard === "full") {
    const big = L.beard === "full";
    face.push(big
      ? `<path d="M126 214 C126 300 160 340 200 342 C240 340 274 300 274 214 C266 258 244 282 200 284 C156 282 134 258 126 214 Z" fill="${hc}"/>`
      : `<path d="M132 232 C136 288 166 314 200 316 C234 314 264 288 268 232 C258 268 236 284 200 286 C164 284 142 268 132 232 Z" fill="${hc}"/>`);
    face.push(`<path d="M172 256 Q200 ${big ? 240 : 244} 228 256 Q214 262 200 256 Q186 262 172 256 Z" fill="${hc}"/>`);
  }
  // mouth last, so it sits on top of any beard
  const mouthY = L.beard === "full" ? 268 : 264;
  if (happy) face.push(`<path d="M176 ${mouthY - 4} Q200 ${mouthY + 32} 224 ${mouthY - 4} Z" fill="#6a2620"/><path d="M181 ${mouthY - 2} Q200 ${mouthY + 6} 219 ${mouthY - 2} L217 ${mouthY + 4} Q200 ${mouthY + 11} 183 ${mouthY + 4} Z" fill="#ffffff"/>`);
  else if (L.lips) face.push(`<path d="M180 ${mouthY - 2} Q200 ${mouthY + 14} 220 ${mouthY - 2} Q200 ${mouthY + 6} 180 ${mouthY - 2} Z" fill="${L.lips}"/>`);
  else face.push(`<path d="M182 ${mouthY - 2} Q200 ${mouthY + 11} 218 ${mouthY - 2}" stroke="${L.beard === "short" || L.beard === "full" ? "#f0d6c8" : mix(skin, "#5a1a1a", 0.6)}" stroke-width="4" fill="none" stroke-linecap="round"/>`);

  // ---------- hair (front) ----------
  const partCap = `<path d="M200 100 C146 100 114 140 118 236 C124 196 140 160 198 142 Z" fill="${hairFill}"/><path d="M200 100 C254 100 286 140 282 236 C276 196 260 160 202 142 Z" fill="${hairFill}"/>`;
  if (!covered) switch (L.hair) {
    case "bald":
      front.push(`<path d="M124 214 C120 186 124 168 132 158 L138 214 Z M276 214 C280 186 276 168 268 158 L262 214 Z" fill="${hc}" opacity=".85"/><path d="M170 124 Q200 112 226 122" stroke="#ffffff" stroke-width="6" opacity=".18" fill="none" stroke-linecap="round"/>`);
      break;
    case "buzz":
      front.push(`<path d="M122 200 C114 130 154 102 202 102 C248 102 288 130 278 200 C272 166 248 146 200 144 C152 146 128 166 122 200 Z" fill="${hc}" opacity=".6"/>`);
      break;
    case "side-part":
      front.push(`<path d="M120 206 C110 126 152 94 202 94 C250 94 290 126 280 206 C276 170 262 150 236 140 C210 150 180 148 150 156 C136 166 126 184 120 206 Z" fill="${hc}"/><path d="M160 100 C200 96 240 112 262 146 C232 132 196 134 150 156 Z" fill="${hcL}" opacity=".35"/>`);
      break;
    case "pixie":
      front.push(`<path d="M118 214 C108 126 152 94 202 94 C252 94 292 126 282 214 C278 178 264 156 246 146 C226 168 180 180 132 184 C126 192 120 204 118 214 Z" fill="${hairFill}"/>`);
      break;
    case "afro":
      front.push(`<path d="M120 200 C112 140 150 108 200 108 C250 108 288 140 280 200 C272 168 248 148 200 146 C152 148 128 168 120 200 Z" fill="${hc}"/>`);
      break;
    case "ponytail":
    case "braid":
      front.push(`<path d="M200 102 C150 102 120 136 122 204 C130 168 150 146 198 140 Z" fill="${hc}"/><path d="M200 102 C250 102 280 136 278 204 C270 168 250 146 202 140 Z" fill="${hc}"/>`);
      if (L.hair === "braid") {
        front.push(`<path d="M126 228 C114 300 124 400 136 476 Q146 486 156 476 C150 400 146 300 150 228 Z" fill="${hc}"/>`);
        for (let y = 250; y < 470; y += 22) front.push(`<path d="M${124 + (y - 250) / 22} ${y} Q140 ${y + 12} ${152 - (y - 250) / 60} ${y - 2}" stroke="${hcL}" stroke-width="3" fill="none" opacity=".8"/>`);
        front.push(`<circle cx="146" cy="472" r="7" fill="${hwColor || "#12ABDB"}"/>`);
      }
      break;
    case "short":
      front.push(`<path d="M120 206 C110 126 152 94 202 94 C250 94 290 126 280 206 C272 164 248 140 200 138 C152 140 128 164 120 206 Z" fill="${hc}"/>`);
      break;
    case "short-up":
      front.push(`<path d="M120 206 C104 120 146 74 208 76 C262 78 296 120 280 206 C272 160 248 134 200 132 C152 134 128 160 120 206 Z" fill="${hc}"/><path d="M160 92 Q200 70 250 90" stroke="${hcL}" stroke-width="4" fill="none" opacity=".6"/>`);
      break;
    case "short-curly":
      front.push(`<path d="M120 206 C110 130 152 98 202 98 C250 98 290 130 280 206 C272 166 248 144 200 142 C152 144 128 166 120 206 Z" fill="${hc}"/>`);
      [[132, 150], [146, 122], [170, 104], [200, 98], [230, 104], [254, 122], [268, 150], [124, 180], [276, 180]].forEach(([x, y]) => front.push(`<circle cx="${x}" cy="${y}" r="17" fill="${hc}"/>`));
      break;
    case "bun":
      front.push(`<path d="M200 102 C150 102 120 136 122 204 C130 168 150 146 198 140 Z" fill="${hc}"/><path d="M200 102 C250 102 280 136 278 204 C270 168 250 146 202 140 Z" fill="${hc}"/>`);
      break;
    case "shoulder-layered":
      front.push(partCap + `<path d="M198 104 C150 116 128 160 122 214 C150 170 176 146 214 136 Z" fill="${hairFill}"/>`);
      break;
    default: // long styles & curly share a centre-parted cap
      front.push(partCap);
      if (L.hair === "long-curly") [[128, 140], [272, 140], [116, 180], [284, 180]].forEach(([x, y]) => front.push(`<circle cx="${x}" cy="${y}" r="18" fill="${hairFill}"/>`));
      if (L.hair === "shoulder-curly") [[134, 130], [266, 130], [120, 166], [280, 166]].forEach(([x, y]) => front.push(`<circle cx="${x}" cy="${y}" r="18" fill="${hairFill}"/>`));
  }

  // ---------- headwear ----------
  if (hw) {
    const d = mix(hwColor, "#000000", 0.22), l = mix(hwColor, "#ffffff", 0.2);
    if (hw.type === "turban") front.push(`<path d="M114 206 C98 120 146 66 200 66 C254 66 302 120 286 206 C276 168 246 146 200 146 C154 146 124 168 114 206 Z" fill="${hwColor}"/><path d="M124 176 C150 120 230 98 280 150 M120 150 C160 100 236 86 272 112 M200 70 C180 110 170 140 168 150" stroke="${d}" stroke-width="5" fill="none"/><path d="M188 150 L200 120 L212 150 Z" fill="${l}"/>`);
    if (hw.type === "hijab") front.push(`<path d="M120 200 C118 130 156 104 200 104 C244 104 282 130 280 200 C276 160 250 136 200 134 C150 136 124 160 120 200 Z" fill="${hwColor}"/><path d="M120 196 C116 258 140 306 176 326 L160 340 C116 314 102 260 108 196 Z M280 196 C284 258 260 306 224 326 L240 340 C284 314 298 260 292 196 Z" fill="${hwColor}"/><path d="M128 170 C150 128 250 128 272 170" stroke="${l}" stroke-width="4" fill="none" opacity=".6"/>`);
    if (hw.type === "cap") front.push(`<path d="M118 180 C114 108 156 86 200 86 C244 86 286 108 282 180 Z" fill="${hwColor}"/><path d="M116 176 Q200 150 300 172 Q318 184 300 192 Q200 172 116 190 Z" fill="${d}"/><circle cx="200" cy="88" r="7" fill="${d}"/><path d="M200 90 L200 176" stroke="${d}" stroke-width="3"/>`);
    if (hw.type === "headband") front.push(`<path d="M124 166 Q200 108 276 166" stroke="${hwColor}" stroke-width="16" fill="none" stroke-linecap="round"/>`);
  }

  // ---------- accessories ----------
  if (L.headphones && !covered) acc.push(`<path d="M116 210 C104 96 296 96 284 210" stroke="#20232b" stroke-width="12" fill="none"/><rect x="100" y="188" width="30" height="50" rx="12" fill="#20232b"/><rect x="270" y="188" width="30" height="50" rx="12" fill="#20232b"/><rect x="104" y="196" width="8" height="34" rx="4" fill="#12ABDB"/><rect x="288" y="196" width="8" height="34" rx="4" fill="#12ABDB"/>`);
  if (L.noseStud) acc.push(`<circle cx="210" cy="240" r="3.2" fill="#e9c46a" stroke="#a87b1d" stroke-width="1"/>`);
  if (L.bindi) acc.push(`<circle cx="200" cy="178" r="4.5" fill="#c8102e"/>`);
  if (L.earrings && !(hw && hw.type === "hijab")) {
    const c = L.earrings.color || "#d4a537";
    if (L.earrings.style === "hoop") acc.push(`<circle cx="124" cy="244" r="11" fill="none" stroke="${c}" stroke-width="3.5"/><circle cx="276" cy="244" r="11" fill="none" stroke="${c}" stroke-width="3.5"/>`);
    else acc.push(L.earrings.style === "drop"
      ? `<path d="M124 230 L124 252 M276 230 L276 252" stroke="${c}" stroke-width="3"/><path d="M124 250 q-8 14 0 24 q8 -10 0 -24 Z M276 250 q-8 14 0 24 q8 -10 0 -24 Z" fill="${c}"/>`
      : `<circle cx="124" cy="234" r="5.5" fill="${c}"/><circle cx="276" cy="234" r="5.5" fill="${c}"/>`);
  }
  if (L.glasses) {
    const g = L.glasses.color || "#222222";
    if (L.glasses.shape === "cat-eye") acc.push(`<path d="M146 200 Q172 190 198 198 L196 216 Q172 234 150 218 Z M254 200 Q228 190 202 198 L204 216 Q228 234 250 218 Z" fill="#ffffff" fill-opacity=".1" stroke="${g}" stroke-width="4.5" stroke-linejoin="round"/><path d="M146 200 L136 192 M254 200 L264 192 M198 204 Q200 200 202 204" stroke="${g}" stroke-width="4" fill="none" stroke-linecap="round"/>`);
    else acc.push(L.glasses.shape === "square"
      ? `<rect x="148" y="192" width="48" height="36" rx="9" fill="#ffffff" fill-opacity=".1" stroke="${g}" stroke-width="5"/><rect x="204" y="192" width="48" height="36" rx="9" fill="#ffffff" fill-opacity=".1" stroke="${g}" stroke-width="5"/><path d="M196 206 Q200 202 204 206 M148 204 L128 200 M252 204 L272 200" stroke="${g}" stroke-width="4" fill="none"/>`
      : `<circle cx="172" cy="210" r="23" fill="#ffffff" fill-opacity=".1" stroke="${g}" stroke-width="3.5"/><circle cx="228" cy="210" r="23" fill="#ffffff" fill-opacity=".1" stroke="${g}" stroke-width="3.5"/><path d="M195 206 Q200 201 205 206 M149 206 L128 200 M251 206 L272 200" stroke="${g}" stroke-width="3" fill="none"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs>${defs.join("")}</defs>${back.join("")}${body.join("")}${ears}${head}${face.join("")}${front.join("")}${acc.join("")}</svg>`;
}

export function avatarImage(look) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(avatarSVG(look));
  });
}

// Options offered in the "add your own story" maker
export const AVATAR_OPTIONS = {
  skin: ["#f6d3b3", "#f1c9a5", "#e0ac83", "#c68a5e", "#a86f45", "#8a5534", "#6b4128", "#4a2c1b"],
  hair: [
    ["bald", "Bald"], ["buzz", "Buzz cut"], ["short", "Short"], ["side-part", "Side part"],
    ["short-up", "Short, styled up"], ["short-curly", "Short curly"], ["pixie", "Pixie"], ["afro", "Afro"],
    ["shoulder-layered", "Shoulder length"], ["shoulder-curly", "Curly, shoulder length"],
    ["long-straight", "Long straight"], ["long-wavy", "Long wavy"], ["long-curly", "Long curly"],
    ["locs", "Locs"], ["bun", "Bun"], ["ponytail", "Ponytail"], ["braid", "Braid"],
  ],
  hairColor: ["#141010", "#3b2618", "#6b4226", "#a0703c", "#d8b06a", "#8a3324", "#9a9a9a", "#2f6fb0"],
  beard: [["none", "None"], ["stubble", "Stubble"], ["mustache", "Moustache"], ["goatee", "Goatee"], ["short", "Short beard"], ["full", "Full beard"]],
  glasses: [["none", "None"], ["round", "Round"], ["square", "Square"], ["cat-eye", "Cat-eye"]],
  earrings: [["none", "None"], ["stud", "Studs"], ["drop", "Drops"], ["hoop", "Hoops"]],
  headwear: [["none", "None"], ["turban", "Turban"], ["hijab", "Hijab"], ["cap", "Cap"], ["headband", "Headband"]],
  headwearColor: ["#0070AD", "#12ABDB", "#2B0A3D", "#c4232b", "#e88a2a", "#14596b", "#1f1f1f", "#f2ede4"],
  outfit: [["tshirt", "T-shirt"], ["shirt", "Shirt"], ["polo", "Polo"], ["hoodie", "Hoodie"], ["turtleneck", "Turtleneck"], ["blazer", "Blazer"], ["kurta", "Kurta"], ["kurta-dupatta", "Kurta & dupatta"], ["saree", "Saree"]],
  outfitColor: ["#0070AD", "#12ABDB", "#2B0A3D", "#FF304C", "#14596b", "#1f1f1f", "#f2ede4", "#e88a2a"],
  extras: [["bindi", "Bindi"], ["noseStud", "Nose stud"], ["necklace", "Necklace"], ["headphones", "Headphones"], ["freckles", "Freckles"], ["lanyard", "Lanyard"]],
};
