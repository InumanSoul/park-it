import { G, car, slots, obstacles, movers, level } from './state.js';
import { DIFF, CAR_LEN, CAR_W, PALETTE } from './config.js';
import { W, H } from './canvas.js';
import { corners, obbHit } from './geometry.js';
import { rand, pick, rectCorners } from './util.js';
import { spawnMovers } from './movers.js';

export function makePlan(lvl){
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
export function layoutStandard(d, lvl){
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

export function layoutDiagonal(d, lvl){
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

export function layoutParallel(d, lvl){
  const gap = Math.max(26, (70 - lvl*3) * d.slotMul);
  const len = CAR_LEN + gap;
  const w = 62, margin = 8;
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
export function buildLevel(){
  if (!G.plan || G.plan.lvl !== G.level) G.plan = makePlan(G.level);
  const plan = G.plan;
  const d = DIFF[G.difficulty];
  const lvl = G.level;
  slots.length = 0; obstacles.length = 0; movers.length = 0;

  if (plan.layout === 'parallel') layoutParallel(d, lvl);
  else if (plan.layout === 'diagonal') layoutDiagonal(d, lvl);
  else layoutStandard(d, lvl);

  // target: not the outermost slots
  const perRow = slots.length / 2;
  const candidates = slots.filter((s,i) => {
    const col = i % perRow;
    return col >= 1 && col <= perRow - 2;
  });
  level.target = pick(candidates);
  level.target.target = true;

  // occupancy
  const fillP = Math.min(0.45 + lvl*0.08, 0.95);
  const forceNeighbours = plan.layout === 'parallel' || lvl >= 2;
  for (const s of slots){
    if (s.target) continue;
    const near = s.row === level.target.row &&
      Math.hypot(s.cx - level.target.cx, s.cy - level.target.cy) < Math.max(s.w, s.len) * 1.4;
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

  // movers FIRST so their paths are guaranteed; static lane cars fit around them
  spawnMovers(lvl);

  // lane obstacles, rejection-sampled against everything incl. mover paths
  const laneObs = Math.min(Math.max(0, lvl-2), 5);
  const t = level.target;
  const corridor = corners(
    t.cx + Math.cos(t.outward)*(t.len/2 + 115),
    t.cy + Math.sin(t.outward)*(t.len/2 + 115),
    t.outward, 240, t.w + 80
  );
  const spawnZone = rectCorners(0, H/2 - 95, 240, 190);
  const horizPaths = movers.filter(m => m.type==='cart' || m.type==='traffic');
  const grannyPaths = movers.filter(m => m.type==='granny');
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
        if (!horizPaths.every(m => Math.abs(m.y - oy) > 56)) continue;
        if (!grannyPaths.every(m => Math.abs(m.baseX - ox) > 92)) continue;
        obstacles.push({ x:ox, y:oy, a:oa, len:CAR_LEN, w:CAR_W, color:pick(PALETTE) });
        break;
      }
    }
  }

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
