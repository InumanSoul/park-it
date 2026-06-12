import { ctx, W, H } from './canvas.js';
import { G, car, slots, obstacles, movers, level } from './state.js';
import { CAR_LEN, CAR_W, FD, FB, CHARACTERS } from './config.js';
import { IMG, spriteReady, HUD_AVATAR } from './sprites.js';

export function drawLot(){
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

export function drawSlot(s){
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
    const rev = G.plan && G.plan.reverseIn;
    if (rev){
      // P at the back; arrow shows required NOSE direction (out toward the lane)
      ctx.fillText('P', -s.len*0.30, 0);
      const x0 = -s.len*0.08, x1 = s.len*0.26;
      ctx.strokeStyle = '#56b06b';
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x1 + 11, 0); ctx.lineTo(x1 - 2, -8); ctx.lineTo(x1 - 2, 8);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.fillText('P', 0, 0);
    }
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

export function drawCar(x, y, a, len, w, color, isPlayer){
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

export function drawMover(m){
  if (m.type === 'traffic'){
    drawCar(m.x, m.y, m.a, CAR_LEN, CAR_W, m.color, false);
    return;
  }
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(3, 4, 14, 11, 0, 0, 7); ctx.fill();
  if (m.type === 'granny'){
    // waddles, leans into her sway, pauses to look around
    const walking = m.wait <= 0 && m.pauseT <= 0;
    const heading = m.vy > 0 ? Math.PI : 0;
    const sway = walking ? Math.cos(m.wob * 1.6) * 0.22 : 0;
    const waddle = walking ? Math.sin(m.wob * 9) * 0.1 : Math.sin(m.wob * 2) * 0.04;
    ctx.rotate(heading + sway + waddle);
    if (spriteReady('granny')) ctx.drawImage(IMG.granny, -21, -21, 42, 42);
    else { ctx.fillStyle = '#cfd2d8'; ctx.beginPath(); ctx.arc(0,0,12,0,7); ctx.fill(); }
  } else {
    // runaway cart: rigid, dead-straight roll
    ctx.rotate(m.vx > 0 ? Math.PI/2 : -Math.PI/2);
    if (spriteReady('cart')) ctx.drawImage(IMG.cart, -19, -23, 38, 46);
    else { ctx.fillStyle = '#aab2c0'; ctx.fillRect(-12,-15,24,30); }
  }
  ctx.restore();
}

export function roundRect(x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

// night fog (offscreen layer with light holes)
export let fogCvs = null, fogCtx = null;
export function drawNight(tSec){
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
  const t = level.target, blink = 0.32 + 0.25*Math.sin(tSec*6);
  const g3 = fogCtx.createRadialGradient(t.cx, t.cy, 5, t.cx, t.cy, 75);
  g3.addColorStop(0, `rgba(0,0,0,${blink})`); g3.addColorStop(1,'rgba(0,0,0,0)');
  fogCtx.fillStyle = g3;
  fogCtx.beginPath(); fogCtx.arc(t.cx, t.cy, 75, 0, 7); fogCtx.fill();
  ctx.drawImage(fogCvs, 0, 0);
}

export function overlay(title, color, lines, action){
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
export function drawKey(cx, cy, label, w=36, h=32){
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

export function drawTitle(tSec){
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

export function drawLicense(lx, ly, lw, lh, c){
  // card body
  ctx.fillStyle = '#e9e5d8';
  roundRect(lx, ly, lw, lh, 10); ctx.fill();
  ctx.strokeStyle = '#b8b2a0'; ctx.lineWidth = 1.5;
  roundRect(lx, ly, lw, lh, 10); ctx.stroke();
  // header band
  ctx.fillStyle = '#3a5a8c';
  ctx.beginPath();
  ctx.moveTo(lx+10, ly);
  ctx.arcTo(lx+lw, ly, lx+lw, ly+30, 10);
  ctx.lineTo(lx+lw, ly+30); ctx.lineTo(lx, ly+30);
  ctx.arcTo(lx, ly, lx+10, ly, 10);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `800 13px ${FB}`;
  ctx.textAlign = 'center';
  ctx.fillText('DRIVER  LICENSE', lx + lw/2, ly + 20);
  // photo box
  const px = lx + 12, py = ly + 40, pw2 = 72, ph2 = 96;
  ctx.fillStyle = '#cfd6de';
  ctx.fillRect(px, py, pw2, ph2);
  ctx.strokeStyle = '#9aa4b0'; ctx.lineWidth = 1.5;
  ctx.strokeRect(px, py, pw2, ph2);
  if (spriteReady(c.img)) ctx.drawImage(IMG[c.img], px+3, py+4, 66, 88);
  // info lines
  const ix = px + pw2 + 14;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#2a2d35';
  ctx.font = `800 14px ${FB}`;
  ctx.fillText('NAME: ' + c.licName, ix, py + 18);
  ctx.font = `700 12px ${FB}`;
  ctx.fillStyle = '#4a4f5c';
  ctx.fillText('CLASS: B', ix, py + 40);
  ctx.fillText('EXPIRES: NEVER', ix, py + 58);
  ctx.fillText('POINTS: 0 / 12', ix, py + 76);
  // signature squiggle
  ctx.strokeStyle = '#2a2d35'; ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(ix, py + 92);
  ctx.bezierCurveTo(ix+14, py+82, ix+22, py+100, ix+36, py+90);
  ctx.bezierCurveTo(ix+48, py+82, ix+58, py+94, ix+72, py+88);
  ctx.stroke();
  // barcode
  ctx.fillStyle = '#2a2d35';
  let bx = lx + lw - 74;
  for (let i=0;i<22;i++){
    const bw = (i*7)%3 === 0 ? 2.6 : 1.2;
    ctx.fillRect(bx, ly + lh - 22, bw, 14);
    bx += bw + 1.6;
  }
}

export function drawMenu(){
  ctx.fillStyle = '#1f232d';
  ctx.fillRect(0,0,W,H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8eaf0';
  ctx.font = `32px ${FD}`;
  ctx.fillText('CHOOSE YOUR DRIVER', W/2, 80);
  ctx.font = `700 16px ${FB}`;
  ctx.fillStyle = '#8a90a0';
  ctx.fillText('← →  to select   •   Enter to start   •   Esc to go back', W/2, 112);

  CHARACTERS.forEach((c, i) => {
    const cw = 330, ch = 372;
    const cx = W/2 + (i===0 ? -cw-28 : 28);
    const cy = 145;
    const sel = G.menuIndex === i;
    ctx.fillStyle = sel ? '#2e3545' : '#252a35';
    roundRect(cx, cy, cw, ch, 16); ctx.fill();
    if (sel){ ctx.strokeStyle = '#ffb02e'; ctx.lineWidth = 3; roundRect(cx, cy, cw, ch, 16); ctx.stroke(); }

    drawLicense(cx + 25, cy + 22, cw - 50, 158, c);

    ctx.textAlign = 'center';
    ctx.font = `18px ${FD}`;
    ctx.fillStyle = sel ? '#ffb02e' : '#e8eaf0';
    ctx.fillText(c.name, cx + cw/2, cy + 222);
    // difficulty on its own prominent line
    ctx.font = `34px ${FD}`;
    ctx.fillStyle = c.diffColor;
    ctx.fillText(c.diffLabel, cx + cw/2, cy + 268);
    ctx.font = `700 14px ${FB}`;
    ctx.fillStyle = '#a8aec0';
    wrapText(c.sub, cx + cw/2, cy + 300, cw - 50, 20);
  });
}

export function wrapText(text, x, y, maxW, lh){
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
export function syncHUD(){
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
