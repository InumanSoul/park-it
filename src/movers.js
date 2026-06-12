import { G, obstacles, movers } from './state.js';
import { W, H } from './canvas.js';
import { rand, pick } from './util.js';

export function clearLaneY(margin, usedY){
  const laneObsList = obstacles.filter(o => o.y > G.laneTop && o.y < G.laneBottom);
  for (let tries=0; tries<40; tries++){
    const y = rand(G.laneTop + 40, G.laneBottom - 40);
    if (!laneObsList.every(o => Math.abs(o.y - y) > margin)) continue;
    if (!usedY.every(u => Math.abs(u - y) > 52)) continue;
    return y;
  }
  return null;
}
// vertical walking line (x) clear of lane obstacles (incl. granny sway) and other grannies
export function grannyX(usedX){
  const laneObsList = obstacles.filter(o => o.y > G.laneTop && o.y < G.laneBottom);
  for (let tries=0; tries<25; tries++){
    const x = rand(W*0.3, W*0.9);
    if (!laneObsList.every(o => Math.abs(o.x - x) > 90)) continue;
    if (!usedX.every(u => Math.abs(u - x) > 90)) continue;
    return x;
  }
  return null;
}
export function spawnMovers(lvl){
  const usedY = [], usedX = [];
  const addGranny = (fromTop, waitMin, waitMax) => {
    const x = grannyX(usedX); if (x === null) return;
    usedX.push(x);
    movers.push({
      type:'granny', baseX:x, x,
      y: fromTop ? G.laneTop + 8 : G.laneBottom - 8,
      vy: (fromTop ? 1 : -1) * (16 + lvl),
      wait: rand(waitMin, waitMax), pauseT: 0, wob: 0,
    });
  };
  if (lvl >= 2) addGranny(true, 1, 3);
  if (lvl >= 9) addGranny(false, 2, 5);
  if (lvl >= 3){ const y = clearLaneY(55, usedY); if (y!==null){ usedY.push(y); movers.push(makeCart(y, lvl)); } }
  if (lvl >= 8){ const y = clearLaneY(55, usedY); if (y!==null){ usedY.push(y); movers.push(makeCart(y, lvl)); } }
  if (lvl >= 5){ const y = clearLaneY(62, usedY); if (y!==null){ usedY.push(y); movers.push({ type:'traffic', x:W*0.55, y, vx: 85 + lvl*3, a:0, color:'#d8b62e' }); } }
  if (lvl >= 11){ const y = clearLaneY(62, usedY); if (y!==null){ usedY.push(y); movers.push({ type:'traffic', x:W*0.9, y, vx:-(80 + lvl*3), a:Math.PI, color:'#cccfd6' }); } }
}
export function makeCart(y, lvl){
  const dir = pick([1,-1]);
  return { type:'cart', x: dir>0 ? -30 : W+30, y, vx: dir*rand(60, 75+lvl*3), wait:rand(0,3) };
}
export function updateMovers(dt){
  for (const m of movers){
    if (m.type === 'granny'){
      // meandering: sways side to side, randomly stops to look around
      if (m.wait > 0){ m.wait -= dt; continue; }
      m.wob += dt;
      if (m.pauseT > 0){
        m.pauseT -= dt;
      } else {
        m.y += m.vy * dt;
        m.x = m.baseX + Math.sin(m.wob * 1.6) * 20;
        if (Math.random() < dt * 0.2) m.pauseT = rand(0.5, 1.5);
      }
      if ((m.vy > 0 && m.y > G.laneBottom - 8) || (m.vy < 0 && m.y < G.laneTop + 8)){
        m.vy *= -1; m.wait = rand(2,6);
        const others = movers.filter(o => o !== m && o.type==='granny').map(o => o.baseX);
        const nx = grannyX(others);
        if (nx !== null){ m.baseX = nx; m.x = nx; }
      }
    } else if (m.type === 'cart'){
      // runaway cart: dead straight, constant speed
      if (m.wait > 0){ m.wait -= dt; continue; }
      m.x += m.vx * dt;
      if (m.x > W+40 || m.x < -40){
        m.wait = rand(1.5, 4);
        m.x = m.vx > 0 ? -30 : W + 30;
        const usedY = movers.filter(o => o !== m && (o.type==='cart' || o.type==='traffic')).map(o => o.y);
        const y = clearLaneY(55, usedY); if (y !== null) m.y = y;
      }
    } else { // traffic
      m.x += m.vx * dt;
      if (m.x > W + 150) m.x = -150;
      if (m.x < -150) m.x = W + 150;
    }
  }
}
