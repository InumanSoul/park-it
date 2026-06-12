'use strict';
const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d');
const W = cvs.width, H = cvs.height;

// typography (loaded via Google Fonts in index.html, with system fallbacks)
const FD = '"Titan One", "Segoe UI", system-ui, sans-serif';   // display
const FB = '"Nunito", "Segoe UI", system-ui, sans-serif';      // body

// ---------- Game state ----------
const G = {
  scene: 'title',         // title | menu | play | crashed | parked | timeup
  menuIndex: 0,
  difficulty: null,
  level: 1,
  crashes: 0,
  totalStars: 0,
  stars: 0,
  timeLeft: 0,
  levelTime: 1,
  parkHold: 0,
  hintT: 0,               // "back in only" hint timer
  banner: null,           // {text, t}
  plan: null,             // {lvl, layout, reverseIn, night}
  failMsg: '', winMsg: '',
  laneTop: 0, laneBottom: H,
  muted: false,
  keys: {},
};

const CHARACTERS = [
  { id:'normal', img:'male',   name:'MALE',   sub:'Normal — forgiving steering' },
  { id:'hard',   img:'female', name:'FEMALE', sub:'Hard — twitchy steering, tight slots, less time' },
];

// ---------- SVG sprites (inline, no external files) ----------
const SPRITES = {
  male: `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='160' viewBox='0 0 120 160'>
    <rect x='30' y='66' width='12' height='42' rx='6' fill='#f2c79a'/>
    <rect x='78' y='66' width='12' height='42' rx='6' fill='#f2c79a'/>
    <rect x='36' y='60' width='48' height='54' rx='14' fill='#4a7fd4'/>
    <rect x='42' y='110' width='14' height='40' rx='6' fill='#2e3545'/>
    <rect x='64' y='110' width='14' height='40' rx='6' fill='#2e3545'/>
    <rect x='38' y='148' width='20' height='9' rx='4' fill='#1c1f27'/>
    <rect x='62' y='148' width='20' height='9' rx='4' fill='#1c1f27'/>
    <circle cx='60' cy='36' r='22' fill='#f2c79a'/>
    <path d='M38 36 a22 22 0 0 1 44 0 l-6 -3 q-16 -10 -32 0 z' fill='#3a2e26'/>
    <circle cx='52' cy='38' r='2.4' fill='#2a2d35'/>
    <circle cx='68' cy='38' r='2.4' fill='#2a2d35'/>
    <path d='M53 48 q7 5 14 0' stroke='#a06a42' stroke-width='2.2' fill='none' stroke-linecap='round'/>
  </svg>`,
  female: `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='160' viewBox='0 0 120 160'>
    <rect x='34' y='16' width='52' height='58' rx='24' fill='#6b3f1f'/>
    <rect x='38' y='40' width='10' height='38' rx='5' fill='#6b3f1f'/>
    <rect x='72' y='40' width='10' height='38' rx='5' fill='#6b3f1f'/>
    <rect x='30' y='66' width='12' height='42' rx='6' fill='#f2c79a'/>
    <rect x='78' y='66' width='12' height='42' rx='6' fill='#f2c79a'/>
    <path d='M40 60 h40 l6 54 h-52 z' fill='#c4584f'/>
    <rect x='44' y='112' width='13' height='38' rx='6' fill='#f2c79a'/>
    <rect x='63' y='112' width='13' height='38' rx='6' fill='#f2c79a'/>
    <rect x='40' y='148' width='20' height='9' rx='4' fill='#7a2f3a'/>
    <rect x='60' y='148' width='20' height='9' rx='4' fill='#7a2f3a'/>
    <circle cx='60' cy='36' r='21' fill='#f2c79a'/>
    <path d='M39 38 a21 21 0 0 1 42 0 l-5 -4 q-16 -11 -32 0 z' fill='#6b3f1f'/>
    <circle cx='52' cy='38' r='2.4' fill='#2a2d35'/>
    <circle cx='68' cy='38' r='2.4' fill='#2a2d35'/>
    <path d='M53 48 q7 5 14 0' stroke='#a0524a' stroke-width='2.2' fill='none' stroke-linecap='round'/>
  </svg>`,
  // top-down, "forward" = up
  granny: `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'>
    <ellipse cx='20' cy='22' rx='13' ry='9' fill='#7a5fb5'/>
    <ellipse cx='9' cy='22' rx='3.4' ry='4' fill='#f2c79a'/>
    <ellipse cx='31' cy='22' rx='3.4' ry='4' fill='#f2c79a'/>
    <circle cx='20' cy='15' r='8' fill='#e9bd9a'/>
    <circle cx='20' cy='13' r='7' fill='#cfd2d8'/>
    <circle cx='20' cy='9.5' r='3.2' fill='#b9bdc6'/>
    <rect x='30' y='26' width='7' height='9' rx='2.5' fill='#8c4a3a'/>
  </svg>`,
  cart: `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='44' viewBox='0 0 36 44'>
    <circle cx='9' cy='7' r='2.6' fill='#3a3f4c'/><circle cx='27' cy='7' r='2.6' fill='#3a3f4c'/>
    <circle cx='9' cy='32' r='2.6' fill='#3a3f4c'/><circle cx='27' cy='32' r='2.6' fill='#3a3f4c'/>
    <rect x='6' y='4' width='24' height='31' rx='4' fill='#aab2c0' stroke='#6e7686' stroke-width='2'/>
    <path d='M10 11 h16 M10 17 h16 M10 23 h16 M10 29 h16 M13 6 v27 M18 6 v27 M23 6 v27' stroke='#6e7686' stroke-width='1.3'/>
    <rect x='4' y='37' width='28' height='5' rx='2.5' fill='#c4584f'/>
  </svg>`,
};
const IMG = {};
if (typeof Image !== 'undefined'){
  for (const k in SPRITES){
    const i = new Image();
    i.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(SPRITES[k]);
    IMG[k] = i;
  }
}
function spriteReady(k){ return IMG[k] && IMG[k].complete && IMG[k].naturalWidth > 0; }

// HUD mini-avatars + sound icons (inline SVG strings for the DOM)
const HUD_AVATAR = {
  none: `<svg width="26" height="16" viewBox="0 0 52 32"><rect x="2" y="6" width="48" height="20" rx="8" fill="#e23b3b"/><rect x="14" y="9" width="10" height="14" rx="3" fill="#1a2233"/><rect x="30" y="9" width="8" height="14" rx="3" fill="#1a2233"/></svg>`,
  normal: `<svg width="22" height="22" viewBox="0 0 40 40"><circle cx="20" cy="22" r="13" fill="#f2c79a"/><path d="M7 22 a13 13 0 0 1 26 0 l-4 -2 q-9 -6 -18 0 z" fill="#3a2e26"/><circle cx="15" cy="23" r="1.6" fill="#2a2d35"/><circle cx="25" cy="23" r="1.6" fill="#2a2d35"/></svg>`,
  hard: `<svg width="22" height="22" viewBox="0 0 40 40"><rect x="6" y="10" width="28" height="26" rx="13" fill="#6b3f1f"/><circle cx="20" cy="22" r="12" fill="#f2c79a"/><path d="M8 22 a12 12 0 0 1 24 0 l-4 -3 q-8 -5 -16 0 z" fill="#6b3f1f"/><circle cx="15" cy="23" r="1.6" fill="#2a2d35"/><circle cx="25" cy="23" r="1.6" fill="#2a2d35"/></svg>`,
};
const ICON_SND_ON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>`;
const ICON_SND_OFF = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><line x1="15" y1="9" x2="21" y2="15"/><line x1="21" y1="9" x2="15" y2="15"/></svg>`;

// Difficulty tuning
const DIFF = {
  normal: { steerRate: 3.0, maxSteer: 0.55, slotMul: 0.93, timeMul: 0.85 },
  hard:   { steerRate: 7.0, maxSteer: 0.85, slotMul: 0.80, timeMul: 0.60 },
};

// ---------- Comedy ----------
const MSG = {
  crash: [
    "Your insurance just called. They're crying.",
    "That'll buff right out. (It won't.)",
    "You had ONE job.",
    "The other car had feelings, you monster.",
    "Parking sensors would've been cheaper than this.",
    "BREAKING: local driver mistakes bumper for brake.",
    "The wall didn't move. Walls rarely do.",
  ],
  granny: [
    "You hit Doris! She was 92 and full of life.",
    "Granny down. The bingo club will hear about this.",
    "She survived two wars. Not your parking, though.",
  ],
  cart: [
    "You hit a shopping cart. It's part of your car now.",
    "That cart had a family. Of groceries.",
  ],
  traffic: [
    "That car had right of way. And a dashcam.",
    "You merged into someone who wasn't merging.",
  ],
  timeup: [
    "The spot got taken by a Fiat. Embarrassing.",
    "Mall security is towing you as we speak.",
    "You circled so long, gas prices went up twice.",
    "Your ice cream melted. All of it.",
  ],
  win1: [
    "Parked. Technically. Like, legally speaking.",
    "It's in. We don't talk about HOW.",
    "Three witnesses filmed that. It's online now.",
  ],
  win2: [
    "Decent. Your driving instructor only sighed once.",
    "Not bad. The other cars stopped flinching.",
  ],
  win3: [
    "Show-off.",
    "Okay, that was actually beautiful.",
    "Valet companies fear you.",
  ],
};

// ---------- Car ----------
const CAR_LEN = 84, CAR_W = 44, WHEELBASE = 60;
const car = { x:0, y:0, a:0, v:0, steer:0 };
const ACCEL = 195, REV_ACCEL = 140, MAX_FWD = 215, MAX_REV = 120, DRAG = 2.4;

// ---------- Level data ----------
let slots = [];        // {cx,cy,a,len,w,row,occupied,target,outward}
let obstacles = [];    // parked cars {x,y,a,len,w,color}
let movers = [];       // {type:'granny'|'cart'|'traffic', ...}
let targetSlot = null;

const PALETTE = ['#4a7fd4','#56b06b','#c4584f','#b08a3e','#7a5fb5','#3e9da8','#8c6d5a'];

function rand(min, max){ return min + Math.random()*(max-min); }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function rectCorners(x, y, w, h){
  return [{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
}

// ---------- Geometry (OBB / SAT) ----------
function corners(cx, cy, a, len, w){
  const ca = Math.cos(a), sa = Math.sin(a);
  const hl = len/2, hw = w/2;
  return [
    { x: cx + ca*hl - sa*hw, y: cy + sa*hl + ca*hw },
    { x: cx + ca*hl + sa*hw, y: cy + sa*hl - ca*hw },
    { x: cx - ca*hl + sa*hw, y: cy - sa*hl - ca*hw },
    { x: cx - ca*hl - sa*hw, y: cy - sa*hl + ca*hw },
  ];
}
function project(pts, ax){
  let mn = Infinity, mx = -Infinity;
  for (const p of pts){ const d = p.x*ax.x + p.y*ax.y; if(d<mn)mn=d; if(d>mx)mx=d; }
  return [mn, mx];
}
function obbHit(c1, c2){
  for (const pts of [c1, c2]){
    for (let i=0;i<2;i++){
      const e = { x: pts[(i+1)%4].x - pts[i].x, y: pts[(i+1)%4].y - pts[i].y };
      const ax = { x:-e.y, y:e.x };
      const [a1,a2] = project(c1, ax), [b1,b2] = project(c2, ax);
      if (a2 < b1 || b2 < a1) return false;
    }
  }
  return true;
}
function insideSlot(s, pts, m){
  const ca = Math.cos(-s.a), sa = Math.sin(-s.a);
  return pts.every(p => {
    const dx = p.x - s.cx, dy = p.y - s.cy;
    const lx = dx*ca - dy*sa, ly = dx*sa + dy*ca;
    return Math.abs(lx) < s.len/2 - m && Math.abs(ly) < s.w/2 - m;
  });
}
function circleHitsCar(cx, cy, r){
  const dx = cx - car.x, dy = cy - car.y;
  const ca = Math.cos(-car.a), sa = Math.sin(-car.a);
  const lx = dx*ca - dy*sa, ly = dx*sa + dy*ca;
  const qx = Math.max(Math.abs(lx) - CAR_LEN/2, 0);
  const qy = Math.max(Math.abs(ly) - CAR_W/2, 0);
  return qx*qx + qy*qy < r*r;
}

// ---------- Level plan ----------
function makePlan(lvl){
  const pool = ['standard'];
  if (lvl >= 4) pool.push('parallel');
  if (lvl >= 6) pool.push('diagonal');
  let layout = lvl < 4 ? 'standard' : pick(pool);
  if (lvl === 4) layout = 'parallel';   // guaranteed introductions
  if (lvl === 6) layout = 'diagonal';
  let reverseIn = layout !== 'parallel' && lvl >= 5 && Math.random() < 0.35;
  if (lvl === 5) reverseIn = true;
  let night = lvl >= 7 && Math.random() < 0.30;
  if (lvl === 8) night = true;
  return { lvl, layout, reverseIn, night };
}

// ---------- Layout builders ----------
function layoutStandard(d, lvl){
  const slotW = Math.max(CAR_W + 10, (114 - lvl*7) * d.slotMul);
  const len = 150, margin = 10;
  const count = Math.floor((W - margin*2) / slotW);
  const startX = (W - count*slotW) / 2;
  for (const row of [0,1]){
    const cy = row === 0 ? margin + len/2 : H - margin - len/2;
    const a  = row === 0 ? Math.PI/2 : -Math.PI/2;
    for (let i=0;i<count;i++){
      slots.push({ cx:startX + i*slotW + slotW/2, cy, a, len, w:slotW, row, occupied:false, target:false, outward:a });
    }
  }
  G.laneTop = margin + len; G.laneBottom = H - margin - len;
}

function layoutDiagonal(d, lvl){
  const slotW = Math.max(CAR_W + 12, (120 - lvl*7) * d.slotMul);
  const len = 144, margin = 8, tilt = 0.6;
  const pitch = (slotW + 4) / Math.cos(tilt);
  const count = Math.floor((W - margin*2 - 60) / pitch);
  const startX = (W - count*pitch) / 2 + pitch/2;
  for (const row of [0,1]){
    const a = row === 0 ? Math.PI/2 - tilt : -Math.PI/2 + tilt;
    const ext = (len/2)*Math.abs(Math.sin(a)) + (slotW/2)*Math.abs(Math.cos(a));
    const cy = row === 0 ? margin + ext : H - margin - ext;
    for (let i=0;i<count;i++){
      slots.push({ cx:startX + i*pitch, cy, a, len, w:slotW, row, occupied:false, target:false, outward:a });
    }
    if (row === 0) G.laneTop = margin + ext*2;
    else G.laneBottom = H - margin - ext*2;
  }
}

function layoutParallel(d, lvl){
  const gap = Math.max(26, (70 - lvl*3) * d.slotMul);
  const len = CAR_LEN + gap;
  const w = 58, margin = 8;
  const pitch = len + 6;
  const count = Math.floor((W - 20) / pitch);
  const startX = (W - count*pitch) / 2 + pitch/2;
  for (const row of [0,1]){
    const cy = row === 0 ? margin + w/2 : H - margin - w/2;
    const outward = row === 0 ? Math.PI/2 : -Math.PI/2;
    for (let i=0;i<count;i++){
      slots.push({ cx:startX + i*pitch, cy, a:0, len, w, row, occupied:false, target:false, outward });
    }
  }
  G.laneTop = margin + w; G.laneBottom = H - margin - w;
}

// ---------- Level build ----------
function buildLevel(){
  if (!G.plan || G.plan.lvl !== G.level) G.plan = makePlan(G.level);
  const plan = G.plan;
  const d = DIFF[G.difficulty];
  const lvl = G.level;
  slots = []; obstacles = []; movers = [];

  if (plan.layout === 'parallel') layoutParallel(d, lvl);
  else if (plan.layout === 'diagonal') layoutDiagonal(d, lvl);
  else layoutStandard(d, lvl);

  // target: not the outermost slots
  const perRow = slots.length / 2;
  const candidates = slots.filter((s,i) => {
    const col = i % perRow;
    return col >= 1 && col <= perRow - 2;
  });
  targetSlot = pick(candidates);
  targetSlot.target = true;

  // occupancy
  const fillP = Math.min(0.45 + lvl*0.08, 0.95);
  const forceNeighbours = plan.layout === 'parallel' || lvl >= 2;
  for (const s of slots){
    if (s.target) continue;
    const near = s.row === targetSlot.row &&
      Math.hypot(s.cx - targetSlot.cx, s.cy - targetSlot.cy) < Math.max(s.w, s.len) * 1.4;
    if ((forceNeighbours && near) || Math.random() < fillP) s.occupied = true;
  }
  for (const s of slots){
    if (!s.occupied) continue;
    const flip = plan.layout === 'parallel' && Math.random() < 0.5 ? Math.PI : 0;
    obstacles.push({
      x: s.cx + rand(-2,2), y: s.cy + rand(-2,2),
      a: s.a + flip + rand(-0.03,0.03),
      len: CAR_LEN, w: CAR_W, color: pick(PALETTE),
    });
  }

  // lane obstacles, rejection-sampled
  const laneObs = Math.min(Math.max(0, lvl-2), 5);
  const t = targetSlot;
  const corridor = corners(
    t.cx + Math.cos(t.outward)*(t.len/2 + 115),
    t.cy + Math.sin(t.outward)*(t.len/2 + 115),
    t.outward, 240, t.w + 80
  );
  const spawnZone = rectCorners(0, H/2 - 95, 240, 190);
  const laneH = G.laneBottom - G.laneTop;
  if (laneH > CAR_W + 110){
    for (let i=0;i<laneObs;i++){
      for (let tries=0; tries<50; tries++){
        const ox = rand(W*0.25, W-80);
        const oy = rand(G.laneTop + 55, G.laneBottom - 55);
        const oa = rand(-0.1, 0.1);
        const oc = corners(ox, oy, oa, CAR_LEN+18, CAR_W+18);
        if (obbHit(oc, corridor) || obbHit(oc, spawnZone)) continue;
        if (obstacles.some(o => obbHit(oc, corners(o.x,o.y,o.a,o.len+18,o.w+18)))) continue;
        obstacles.push({ x:ox, y:oy, a:oa, len:CAR_LEN, w:CAR_W, color:pick(PALETTE) });
        break;
      }
    }
  }

  spawnMovers(lvl);

  // player spawn
  car.x = 90; car.y = H/2; car.a = 0; car.v = 0; car.steer = 0;

  // time limit (+ slack for special mechanics)
  let tl = (62 - lvl*3.5) * d.timeMul;
  if (plan.layout === 'parallel') tl += 6;
  if (plan.reverseIn) tl += 4;
  if (plan.night) tl += 6;
  G.levelTime = Math.max(18, tl);
  G.timeLeft = G.levelTime;
  G.parkHold = 0; G.hintT = 0;

  const parts = [plan.layout.toUpperCase()];
  if (plan.reverseIn) parts.push('BACK-IN ONLY');
  if (plan.night) parts.push('NIGHT SHIFT');
  G.banner = { text: `LEVEL ${lvl} — ${parts.join(' • ')}`, t: 2.6 };
  document.getElementById('hudTask').textContent = parts.join(' • ');
}

// ---------- Movers ----------
function clearLaneY(margin){
  const laneObsList = obstacles.filter(o => o.y > G.laneTop && o.y < G.laneBottom);
  for (let tries=0; tries<20; tries++){
    const y = rand(G.laneTop + 45, G.laneBottom - 45);
    if (laneObsList.every(o => Math.abs(o.y - y) > margin)) return y;
  }
  return null;
}
function spawnMovers(lvl){
  if (lvl >= 2) movers.push({ type:'granny', x:rand(W*0.3, W*0.85), y:G.laneTop - 18, vy: 16 + lvl, wait:rand(1,3), wob:0 });
  if (lvl >= 9) movers.push({ type:'granny', x:rand(W*0.3, W*0.85), y:G.laneBottom + 18, vy:-(16 + lvl), wait:rand(2,5), wob:0 });
  if (lvl >= 3){ const y = clearLaneY(55); if (y!==null) movers.push(makeCart(y, lvl)); }
  if (lvl >= 8){ const y = clearLaneY(55); if (y!==null) movers.push(makeCart(y, lvl)); }
  if (lvl >= 5){ const y = clearLaneY(62); if (y!==null) movers.push({ type:'traffic', x:W*0.55, y, vx: 85 + lvl*3, a:0, color:'#d8b62e' }); }
  if (lvl >= 11){ const y = clearLaneY(62); if (y!==null) movers.push({ type:'traffic', x:W*0.9, y, vx:-(80 + lvl*3), a:Math.PI, color:'#cccfd6' }); }
}
function makeCart(y, lvl){
  const dir = pick([1,-1]);
  return { type:'cart', x: dir>0 ? -30 : W+30, y, vx: dir*rand(60, 75+lvl*3), wait:rand(0,3), wob:0 };
}
function updateMovers(dt){
  for (const m of movers){
    if (m.type === 'granny'){
      if (m.wait > 0){ m.wait -= dt; continue; }
      m.wob += dt;
      m.y += m.vy * dt;
      if ((m.vy > 0 && m.y > G.laneBottom + 18) || (m.vy < 0 && m.y < G.laneTop - 18)){
        m.vy *= -1; m.wait = rand(2,6); m.x = rand(W*0.25, W*0.9);
      }
    } else if (m.type === 'cart'){
      if (m.wait > 0){ m.wait -= dt; continue; }
      m.wob += dt;
      m.x += m.vx * dt;
      if (m.x > W+40 || m.x < -40){
        m.wait = rand(1.5, 4);
        m.x = m.vx > 0 ? -30 : W + 30;
        const y = clearLaneY(55); if (y !== null) m.y = y;
      }
    } else { // traffic
      m.x += m.vx * dt;
      if (m.x > W + 150) m.x = -150;
      if (m.x < -150) m.x = W + 150;
    }
  }
}

// ---------- Audio (WebAudio, no files) ----------
let AC = null, engOsc = null, engGain = null, masterGain = null;
function ac(){
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!AC && Ctor) AC = new Ctor();
  } catch(e){}
  return AC;
}
function out(){
  const a = ac(); if (!a) return null;
  if (!masterGain){
    masterGain = a.createGain();
    masterGain.gain.value = G.muted ? 0 : 1;
    masterGain.connect(a.destination);
  }
  return masterGain;
}
function setMuted(v){
  G.muted = v;
  if (masterGain) masterGain.gain.value = v ? 0 : 1;
  try { localStorage.setItem('parkit-muted', v ? '1' : '0'); } catch(e){}
  const btn = document.getElementById('sndBtn');
  if (btn){ btn.innerHTML = v ? ICON_SND_OFF : ICON_SND_ON; btn.classList.toggle('muted', v); }
}
function beep(f, dur, type='square', g=0.07, delay=0, slideTo){
  const a = ac(), mg = out(); if (!a || !mg) return;
  try {
    const o = a.createOscillator(), gn = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, a.currentTime + delay);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + delay + dur);
    gn.gain.setValueAtTime(g, a.currentTime + delay);
    gn.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + delay + dur);
    o.connect(gn).connect(mg);
    o.start(a.currentTime + delay); o.stop(a.currentTime + delay + dur + 0.02);
  } catch(e){}
}
function noiseBurst(dur=0.3, g=0.25){
  const a = ac(), mg = out(); if (!a || !mg) return;
  try {
    const src = a.createBufferSource();
    const buf = a.createBuffer(1, a.sampleRate*dur, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * (1 - i/d.length);
    src.buffer = buf;
    const gn = a.createGain(); gn.gain.value = g;
    src.connect(gn).connect(mg); src.start();
  } catch(e){}
}
const sfx = {
  crash(){ noiseBurst(0.35, 0.3); beep(90, 0.3, 'sawtooth', 0.15); },
  granny(){ beep(900, 0.45, 'sawtooth', 0.12, 0, 250); noiseBurst(0.2, 0.15); },
  win(st){ [392,523,659,784].slice(0, 1+st).forEach((f,i)=>beep(f, 0.18, 'triangle', 0.09, i*0.13)); },
  honk(){ beep(345, 0.18, 'square', 0.1); beep(258, 0.18, 'square', 0.1, 0.02); },
};
function engineUpdate(){
  const a = ac(), mg = out(); if (!a || !mg) return;
  try {
    if (!engOsc){
      engOsc = a.createOscillator(); engGain = a.createGain();
      engOsc.type = 'sawtooth'; engGain.gain.value = 0;
      engOsc.connect(engGain).connect(mg); engOsc.start();
    }
    const sp = Math.abs(car.v);
    engOsc.frequency.value = 55 + sp*0.45;
    engGain.gain.value = G.scene === 'play' ? (sp > 3 ? 0.028 : 0.01) : 0;
  } catch(e){}
}

// ---------- Update ----------
function updatePlay(dt){
  const d = DIFF[G.difficulty];
  const k = G.keys;

  if (k.ArrowUp)        car.v += ACCEL*dt;
  else if (k.ArrowDown) car.v -= REV_ACCEL*dt;
  else                  car.v -= car.v * DRAG * dt;
  car.v = Math.max(-MAX_REV, Math.min(MAX_FWD, car.v));
  if (Math.abs(car.v) < 1 && !k.ArrowUp && !k.ArrowDown) car.v = 0;

  const steerTarget = k.ArrowLeft ? -d.maxSteer : k.ArrowRight ? d.maxSteer : 0;
  const rate = d.steerRate * dt;
  if (car.steer < steerTarget) car.steer = Math.min(car.steer + rate, steerTarget);
  else                         car.steer = Math.max(car.steer - rate, steerTarget);

  const hb = WHEELBASE/2;
  let bx = car.x - Math.cos(car.a)*hb, by = car.y - Math.sin(car.a)*hb;
  let fx = car.x + Math.cos(car.a)*hb, fy = car.y + Math.sin(car.a)*hb;
  bx += car.v*dt*Math.cos(car.a);           by += car.v*dt*Math.sin(car.a);
  fx += car.v*dt*Math.cos(car.a+car.steer); fy += car.v*dt*Math.sin(car.a+car.steer);
  car.a = Math.atan2(fy-by, fx-bx);
  car.x = (fx+bx)/2; car.y = (fy+by)/2;

  updateMovers(dt);

  // collisions
  const cc = corners(car.x, car.y, car.a, CAR_LEN, CAR_W);
  for (const p of cc){
    if (p.x < 2 || p.x > W-2 || p.y < 2 || p.y > H-2) return crash('crash');
  }
  for (const o of obstacles){
    if (Math.hypot(o.x-car.x, o.y-car.y) > CAR_LEN+14) continue;
    if (obbHit(cc, corners(o.x, o.y, o.a, o.len, o.w))) return crash('crash');
  }
  for (const m of movers){
    if (m.type === 'traffic'){
      if (Math.hypot(m.x-car.x, m.y-car.y) < CAR_LEN+14 &&
          obbHit(cc, corners(m.x, m.y, m.a, CAR_LEN, CAR_W))) return crash('traffic');
    } else if (m.wait <= 0 && circleHitsCar(m.x, m.y, 16)){
      return crash(m.type === 'granny' ? 'granny' : 'cart');
    }
  }

  // parking
  const t = targetSlot;
  const inside = insideSlot(t, cc, 3);
  const orientOk = !G.plan.reverseIn || Math.cos(car.a - t.outward) > 0.5;
  if (inside && Math.abs(car.v) < 4){
    if (orientOk){
      G.parkHold += dt;
      if (G.parkHold > 0.6){
        const st = calcStars();
        G.stars = st; G.totalStars += st;
        G.winMsg = pick(MSG['win'+st]);
        sfx.win(st);
        G.scene = 'parked';
      }
    } else {
      G.hintT = 1; G.parkHold = 0;
    }
  } else G.parkHold = 0;
  if (G.hintT > 0) G.hintT -= dt;

  G.timeLeft -= dt;
  if (G.timeLeft <= 0){
    G.timeLeft = 0;
    G.failMsg = pick(MSG.timeup);
    G.scene = 'timeup';
  }
}

function crash(type){
  G.crashes++;
  G.failMsg = pick(MSG[type] || MSG.crash);
  if (type === 'granny') sfx.granny(); else sfx.crash();
  G.scene = 'crashed';
}

function calcStars(){
  const s = targetSlot;
  const ca = Math.cos(-s.a), sa = Math.sin(-s.a);
  const dx = car.x - s.cx, dy = car.y - s.cy;
  const ly = dx*sa + dy*ca; // offset across the slot
  let aerr = Math.abs(((car.a - s.a) % Math.PI + Math.PI) % Math.PI);
  aerr = Math.min(aerr, Math.PI - aerr);
  let st = 1;
  if (G.timeLeft > G.levelTime * 0.35) st++;
  if (Math.abs(ly) < 7 && aerr < 0.12) st++;
  return st;
}

// ---------- Drawing ----------
function drawLot(){
  ctx.fillStyle = '#3c4250';
  ctx.fillRect(0,0,W,H);
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let i=0;i<60;i++) ctx.fillRect((i*149)%W, (i*97)%H, 2, 2);

  for (const s of slots) drawSlot(s);

  ctx.strokeStyle = 'rgba(255,255,180,0.22)';
  ctx.setLineDash([18,14]);
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke();
  ctx.setLineDash([]);
}

function drawSlot(s){
  ctx.save();
  ctx.translate(s.cx, s.cy);
  ctx.rotate(s.a);
  if (s.target){
    ctx.fillStyle = 'rgba(86,176,107,0.18)';
    ctx.fillRect(-s.len/2, -s.w/2, s.len, s.w);
    ctx.strokeStyle = '#56b06b';
    ctx.setLineDash([8,6]);
    ctx.lineWidth = 3;
    ctx.strokeRect(-s.len/2+2, -s.w/2+2, s.len-4, s.w-4);
    ctx.setLineDash([]);
    ctx.fillStyle = '#56b06b';
    ctx.font = `22px ${FD}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', 0, 0);
    ctx.textBaseline = 'alphabetic';
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s.len/2, -s.w/2); ctx.lineTo(s.len/2, -s.w/2);
    ctx.moveTo(-s.len/2,  s.w/2); ctx.lineTo(s.len/2,  s.w/2);
    ctx.moveTo(-s.len/2, -s.w/2); ctx.lineTo(-s.len/2, s.w/2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCar(x, y, a, len, w, color, isPlayer){
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  roundRect(-len/2+2, -w/2+3, len, w, 8); ctx.fill();
  ctx.fillStyle = color;
  roundRect(-len/2, -w/2, len, w, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(20,30,45,0.8)';
  roundRect(len*0.08, -w/2+5, len*0.22, w-10, 4); ctx.fill();
  roundRect(-len*0.34, -w/2+5, len*0.18, w-10, 4); ctx.fill();
  ctx.fillStyle = isPlayer ? '#ffe9a8' : 'rgba(255,233,168,0.7)';
  ctx.fillRect(len/2-4, -w/2+4, 3, 7);
  ctx.fillRect(len/2-4,  w/2-11, 3, 7);
  // reverse lights when player backing up
  if (isPlayer && car.v < -5){
    ctx.fillStyle = '#fff';
    ctx.fillRect(-len/2+1, -w/2+5, 3, 6);
    ctx.fillRect(-len/2+1,  w/2-11, 3, 6);
  }
  ctx.restore();
}

function drawMover(m){
  if (m.type === 'traffic'){
    drawCar(m.x, m.y, m.a, CAR_LEN, CAR_W, m.color, false);
    return;
  }
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(3, 4, 14, 11, 0, 0, 7); ctx.fill();
  // face direction of travel ("forward" in the sprite is up), with a walk/roll wobble
  const heading = m.type === 'granny'
    ? (m.vy > 0 ? Math.PI : 0)
    : (m.vx > 0 ? Math.PI/2 : -Math.PI/2);
  ctx.rotate(heading + Math.sin(m.wob*8) * 0.09);
  if (m.type === 'granny'){
    if (spriteReady('granny')) ctx.drawImage(IMG.granny, -21, -21, 42, 42);
    else { ctx.fillStyle = '#cfd2d8'; ctx.beginPath(); ctx.arc(0,0,12,0,7); ctx.fill(); }
  } else {
    if (spriteReady('cart')) ctx.drawImage(IMG.cart, -19, -23, 38, 46);
    else { ctx.fillStyle = '#aab2c0'; ctx.fillRect(-12,-15,24,30); }
  }
  ctx.restore();
}

function roundRect(x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

// night fog (offscreen layer with light holes)
let fogCvs = null, fogCtx = null;
function drawNight(tSec){
  if (!fogCvs){
    fogCvs = document.createElement('canvas');
    fogCvs.width = W; fogCvs.height = H;
    fogCtx = fogCvs.getContext('2d');
  }
  fogCtx.globalCompositeOperation = 'source-over';
  fogCtx.clearRect(0,0,W,H);
  fogCtx.fillStyle = 'rgba(4,6,14,0.93)';
  fogCtx.fillRect(0,0,W,H);
  fogCtx.globalCompositeOperation = 'destination-out';
  // ambient glow around the car
  let g = fogCtx.createRadialGradient(car.x, car.y, 10, car.x, car.y, 115);
  g.addColorStop(0,'rgba(0,0,0,0.9)'); g.addColorStop(1,'rgba(0,0,0,0)');
  fogCtx.fillStyle = g;
  fogCtx.beginPath(); fogCtx.arc(car.x, car.y, 115, 0, 7); fogCtx.fill();
  // headlight cone
  const fx = car.x + Math.cos(car.a)*CAR_LEN/2, fy = car.y + Math.sin(car.a)*CAR_LEN/2;
  const reach = 300, spread = 0.42;
  const g2 = fogCtx.createRadialGradient(fx, fy, 8, fx, fy, reach);
  g2.addColorStop(0,'rgba(0,0,0,0.95)'); g2.addColorStop(1,'rgba(0,0,0,0)');
  fogCtx.fillStyle = g2;
  fogCtx.beginPath();
  fogCtx.moveTo(fx, fy);
  fogCtx.arc(fx, fy, reach, car.a - spread, car.a + spread);
  fogCtx.closePath(); fogCtx.fill();
  // blinking beacon over the target slot
  const t = targetSlot, blink = 0.32 + 0.25*Math.sin(tSec*6);
  const g3 = fogCtx.createRadialGradient(t.cx, t.cy, 5, t.cx, t.cy, 75);
  g3.addColorStop(0, `rgba(0,0,0,${blink})`); g3.addColorStop(1,'rgba(0,0,0,0)');
  fogCtx.fillStyle = g3;
  fogCtx.beginPath(); fogCtx.arc(t.cx, t.cy, 75, 0, 7); fogCtx.fill();
  ctx.drawImage(fogCvs, 0, 0);
}

function overlay(title, color, lines, action){
  ctx.fillStyle = 'rgba(15,17,22,0.78)';
  ctx.fillRect(0,0,W,H);
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = `46px ${FD}`;
  ctx.fillText(title, W/2, H/2 - 50);
  ctx.fillStyle = '#e8eaf0';
  ctx.font = `700 20px ${FB}`;
  lines.forEach((l,i)=> ctx.fillText(l, W/2, H/2 + i*30));
  if (action){
    // framed action prompt
    ctx.font = `800 17px ${FB}`;
    const tw = ctx.measureText(action).width;
    const bw = tw + 56, bh = 46;
    const bx = W/2 - bw/2, by = H/2 + 58;
    ctx.fillStyle = 'rgba(37,42,53,0.95)';
    roundRect(bx, by, bw, bh, 12); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    roundRect(bx, by, bw, bh, 12); ctx.stroke();
    ctx.fillStyle = '#e8eaf0';
    ctx.fillText(action, W/2, by + 29);
  }
}

// keycap helper for menus
function drawKey(cx, cy, label, w=36, h=32){
  ctx.fillStyle = '#333a4a';
  roundRect(cx - w/2, cy - h/2, w, h, 7); ctx.fill();
  ctx.strokeStyle = '#4a5266'; ctx.lineWidth = 1.5;
  roundRect(cx - w/2, cy - h/2, w, h, 7); ctx.stroke();
  ctx.fillStyle = '#e8eaf0';
  ctx.font = `800 14px ${FB}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cy + 1);
  ctx.textBaseline = 'alphabetic';
}

function drawTitle(tSec){
  ctx.fillStyle = '#1f232d';
  ctx.fillRect(0,0,W,H);
  // faint parking-slot decoration
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 3;
  for (let i=0;i<6;i++){
    const x = 60 + i*160;
    ctx.strokeRect(x, -40, 110, 150);
    ctx.strokeRect(x - 40, H - 110, 110, 150);
  }

  // logo (two-tone)
  ctx.textAlign = 'left';
  ctx.font = `96px ${FD}`;
  const w1 = ctx.measureText('PARK ').width;
  const w2 = ctx.measureText('IT!').width;
  const lx = W/2 - (w1 + w2)/2;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillText('PARK ', lx + 5, 145 + 5);
  ctx.fillText('IT!', lx + w1 + 5, 145 + 5);
  ctx.fillStyle = '#e8eaf0';
  ctx.fillText('PARK ', lx, 145);
  ctx.fillStyle = '#ffb02e';
  ctx.fillText('IT!', lx + w1, 145);

  ctx.textAlign = 'center';
  ctx.font = `italic 700 17px ${FB}`;
  ctx.fillStyle = '#8a90a0';
  ctx.fillText('A game about not hitting Doris.', W/2, 185);

  // hero car
  drawCar(W/2, 240, -0.06, 118, 60, '#e23b3b', false);

  // controls panel
  const px = W/2 - 330, py = 300, pw = 660, ph = 200;
  ctx.fillStyle = '#252a35';
  roundRect(px, py, pw, ph, 14); ctx.fill();
  ctx.strokeStyle = '#333a4a'; ctx.lineWidth = 2;
  roundRect(px, py, pw, ph, 14); ctx.stroke();
  ctx.fillStyle = '#ffb02e';
  ctx.font = `16px ${FD}`;
  ctx.fillText('CONTROLS', W/2, py + 30);

  const rowL = [
    { keys:['↑','↓'], text:'Accelerate / Reverse' },
    { keys:['←','→'], text:'Steer' },
    { keys:['R'],     text:'Retry level' },
  ];
  const rowR = [
    { keys:['H'],   text:'Honk' },
    { keys:['M'],   text:'Sound on / off' },
    { keys:['ESC'], text:'Back to menu' },
  ];
  const drawRows = (rows, x0) => {
    rows.forEach((r, i) => {
      const y = py + 70 + i*44;
      let kx = x0;
      for (const k of r.keys){
        const kw = k.length > 1 ? 52 : 36;
        drawKey(kx + kw/2, y, k, kw);
        kx += kw + 8;
      }
      ctx.fillStyle = '#a8aec0';
      ctx.font = `700 15px ${FB}`;
      ctx.textAlign = 'left';
      ctx.fillText(r.text, x0 + 102, y + 5);
      ctx.textAlign = 'center';
    });
  };
  drawRows(rowL, px + 36);
  drawRows(rowR, px + 366);

  // pulsing start prompt
  const pulse = 0.55 + 0.45*Math.sin(tSec*3.2);
  ctx.font = `24px ${FD}`;
  ctx.fillStyle = `rgba(255,176,46,${pulse})`;
  ctx.fillText('PRESS ENTER TO START', W/2, 560);
}

function drawMenu(){
  ctx.fillStyle = '#1f232d';
  ctx.fillRect(0,0,W,H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8eaf0';
  ctx.font = `32px ${FD}`;
  ctx.fillText('CHOOSE YOUR DRIVER', W/2, 90);
  ctx.font = `700 16px ${FB}`;
  ctx.fillStyle = '#8a90a0';
  ctx.fillText('← →  to select   •   Enter to start   •   Esc to go back', W/2, 125);

  CHARACTERS.forEach((c, i) => {
    const cw = 300, ch = 320;
    const cx = W/2 + (i===0 ? -cw-30 : 30);
    const cy = 170;
    const sel = G.menuIndex === i;
    ctx.fillStyle = sel ? '#2e3545' : '#252a35';
    roundRect(cx, cy, cw, ch, 16); ctx.fill();
    if (sel){ ctx.strokeStyle = '#ffb02e'; ctx.lineWidth = 3; ctx.stroke(); }
    if (spriteReady(c.img)) ctx.drawImage(IMG[c.img], cx+cw/2-54, cy+22, 108, 144);
    ctx.font = `24px ${FD}`;
    ctx.fillStyle = sel ? '#ffb02e' : '#e8eaf0';
    ctx.fillText(c.name, cx+cw/2, cy+205);
    ctx.font = `700 14px ${FB}`;
    ctx.fillStyle = '#a8aec0';
    wrapText(c.sub, cx+cw/2, cy+240, cw-40, 20);
  });
}

function wrapText(text, x, y, maxW, lh){
  const words = text.split(' ');
  let line = '';
  for (const w of words){
    if (ctx.measureText(line + w).width > maxW){
      ctx.fillText(line.trim(), x, y); line = w + ' '; y += lh;
    } else line += w + ' ';
  }
  ctx.fillText(line.trim(), x, y);
}

// ---------- HUD ----------
function syncHUD(){
  const inGame = G.scene !== 'title' && G.scene !== 'menu';
  document.getElementById('hud').classList.toggle('hidden', !inGame);
  if (!inGame) return;
  document.getElementById('hudLevel').textContent = G.level;
  document.getElementById('hudMode').textContent = G.difficulty ? (G.difficulty==='hard'?'HARD':'NORMAL') : '—';
  document.getElementById('hudCrashes').textContent = G.crashes;
  document.getElementById('hudStars').textContent = G.totalStars;
  const avKey = G.difficulty || 'none';
  const av = document.getElementById('hudAvatar');
  if (av.dataset.state !== avKey){ av.dataset.state = avKey; av.innerHTML = HUD_AVATAR[avKey]; }
  const t = document.getElementById('timer');
  t.textContent = Math.ceil(G.timeLeft) + 's';
  t.classList.toggle('low', G.scene==='play' && G.timeLeft < 10);
}

// ---------- Main loop ----------
let last = performance.now();
function frame(now){
  const dt = Math.min((now - last)/1000, 1/30);
  last = now;
  const tSec = now/1000;

  if (G.scene === 'title'){
    drawTitle(tSec);
  } else if (G.scene === 'menu'){
    drawMenu();
  } else {
    if (G.scene === 'play') updatePlay(dt);
    drawLot();
    for (const o of obstacles) drawCar(o.x, o.y, o.a, o.len, o.w, o.color, false);
    for (const m of movers) drawMover(m);
    drawCar(car.x, car.y, car.a, CAR_LEN, CAR_W, '#e23b3b', true);

    if (G.scene==='play' && G.parkHold > 0){
      ctx.strokeStyle = '#56b06b'; ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(car.x, car.y, 58, -Math.PI/2, -Math.PI/2 + (G.parkHold/0.6)*Math.PI*2);
      ctx.stroke();
    }

    if (G.plan && G.plan.night && (G.scene==='play')) drawNight(tSec);

    // "back in only" hint
    if (G.scene==='play' && G.hintT > 0){
      ctx.textAlign = 'center';
      ctx.font = `800 22px ${FB}`;
      ctx.fillStyle = `rgba(255,176,46,${Math.min(1, G.hintT*2)})`;
      ctx.fillText('BACK IN ONLY — reverse into the slot!', W/2, H/2 - 90);
    }

    // level banner
    if (G.scene==='play' && G.banner && G.banner.t > 0){
      G.banner.t -= dt;
      const a = Math.min(1, G.banner.t);
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(10,12,16,${a*0.6})`;
      ctx.fillRect(W/2-330, H/2-132, 660, 56);
      ctx.font = `26px ${FD}`;
      ctx.fillStyle = `rgba(255,176,46,${a})`;
      ctx.fillText(G.banner.text, W/2, H/2 - 94);
    }

    if (G.scene === 'crashed') overlay('CRASHED!', '#ff5555', [G.failMsg], 'R / ENTER — RETRY');
    if (G.scene === 'timeup')  overlay("TIME'S UP!", '#ffb02e', [G.failMsg], 'R / ENTER — RETRY');
    if (G.scene === 'parked')  overlay('★'.repeat(G.stars) + '☆'.repeat(3-G.stars), '#56b06b',
        [G.winMsg], 'ENTER — NEXT LEVEL');
  }
  engineUpdate();
  syncHUD();
  requestAnimationFrame(frame);
}

// ---------- Input ----------
function startRun(){
  G.difficulty = CHARACTERS[G.menuIndex].id;
  G.level = 1; G.crashes = 0; G.totalStars = 0; G.plan = null;
  buildLevel();
  G.scene = 'play';
  const a = ac(); if (a && a.resume) a.resume();
}

window.addEventListener('keydown', e => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  G.keys[e.key] = true;

  if (e.key === 'h' || e.key === 'H') sfx.honk();
  if (e.key === 'm' || e.key === 'M') setMuted(!G.muted);

  if (G.scene === 'title'){
    if (e.key === 'Enter'){ G.scene = 'menu'; const a = ac(); if (a && a.resume) a.resume(); }
    return;
  }
  if (G.scene === 'menu'){
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') G.menuIndex = 1 - G.menuIndex;
    if (e.key === 'Enter') startRun();
    if (e.key === 'Escape') G.scene = 'title';
    return;
  }
  if (e.key === 'r' || e.key === 'R'){ buildLevel(); G.scene = 'play'; return; }
  if (e.key === 'Enter'){
    if (G.scene === 'parked'){ G.level++; buildLevel(); G.scene = 'play'; }
    else if (G.scene === 'crashed' || G.scene === 'timeup'){ buildLevel(); G.scene = 'play'; }
  }
  if (e.key === 'Escape'){ G.scene = 'menu'; G.difficulty = null; G.plan = null; }
});
window.addEventListener('keyup', e => { G.keys[e.key] = false; });

cvs.addEventListener('click', e => {
  if (G.scene === 'title'){ G.scene = 'menu'; return; }
  if (G.scene !== 'menu') return;
  const r = cvs.getBoundingClientRect();
  const x = (e.clientX - r.left) * (W/r.width);
  G.menuIndex = x < W/2 ? 0 : 1;
  startRun();
});

// sound toggle button + persisted preference
(function initSound(){
  let saved = false;
  try { saved = localStorage.getItem('parkit-muted') === '1'; } catch(e){}
  G.muted = saved;
  const btn = document.getElementById('sndBtn');
  if (btn){
    btn.innerHTML = saved ? ICON_SND_OFF : ICON_SND_ON;
    btn.classList.toggle('muted', saved);
    btn.addEventListener('click', () => { setMuted(!G.muted); btn.blur(); });
  }
})();

requestAnimationFrame(frame);
