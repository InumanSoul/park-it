import { car } from './state.js';
import { CAR_LEN, CAR_W } from './config.js';

export function corners(cx, cy, a, len, w){
  const ca = Math.cos(a), sa = Math.sin(a);
  const hl = len/2, hw = w/2;
  return [
    { x: cx + ca*hl - sa*hw, y: cy + sa*hl + ca*hw },
    { x: cx + ca*hl + sa*hw, y: cy + sa*hl - ca*hw },
    { x: cx - ca*hl + sa*hw, y: cy - sa*hl - ca*hw },
    { x: cx - ca*hl - sa*hw, y: cy - sa*hl + ca*hw },
  ];
}
export function project(pts, ax){
  let mn = Infinity, mx = -Infinity;
  for (const p of pts){ const d = p.x*ax.x + p.y*ax.y; if(d<mn)mn=d; if(d>mx)mx=d; }
  return [mn, mx];
}
export function obbHit(c1, c2){
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
export function insideSlot(s, pts, m){
  const ca = Math.cos(-s.a), sa = Math.sin(-s.a);
  return pts.every(p => {
    const dx = p.x - s.cx, dy = p.y - s.cy;
    const lx = dx*ca - dy*sa, ly = dx*sa + dy*ca;
    return Math.abs(lx) < s.len/2 - m && Math.abs(ly) < s.w/2 - m;
  });
}
export function circleHitsCar(cx, cy, r){
  const dx = cx - car.x, dy = cy - car.y;
  const ca = Math.cos(-car.a), sa = Math.sin(-car.a);
  const lx = dx*ca - dy*sa, ly = dx*sa + dy*ca;
  const qx = Math.max(Math.abs(lx) - CAR_LEN/2, 0);
  const qy = Math.max(Math.abs(ly) - CAR_W/2, 0);
  return qx*qx + qy*qy < r*r;
}
