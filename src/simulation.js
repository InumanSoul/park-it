import { G, car, obstacles, movers, level } from './state.js';
import { DIFF, CAR_LEN, CAR_W, WHEELBASE, ACCEL, REV_ACCEL, MAX_FWD, MAX_REV, DRAG, MSG } from './config.js';
import { W, H } from './canvas.js';
import { corners, obbHit, insideSlot, circleHitsCar } from './geometry.js';
import { pick } from './util.js';
import { sfx } from './audio.js';
import { updateMovers } from './movers.js';

export function updatePlay(dt){
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
  const t = level.target;
  // parallel slots hug the car; allow a hair of overhang so a realistic reverse park registers
  const inside = insideSlot(t, cc, G.plan.layout === 'parallel' ? -2 : 3);
  // back-in levels: nose must point out of the slot (toward the lane), within ±45°
  const orientOk = !G.plan.reverseIn || Math.cos(car.a - t.outward) > 0.7;
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
    G.lives--;
    G.failMsg = pick(MSG.timeup);
    G.scene = G.lives <= 0 ? 'gameover' : 'timeup';
  }
}

export function crash(type){
  G.crashes++;
  G.lives--;
  G.failMsg = pick(MSG[type] || MSG.crash);
  if (type === 'granny') sfx.granny(); else sfx.crash();
  G.scene = G.lives <= 0 ? 'gameover' : 'crashed';
}

export function calcStars(){
  const s = level.target;
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
