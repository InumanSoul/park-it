import './style.css';
import { cvs, ctx, W, H } from './canvas.js';
import { G, car, obstacles, movers } from './state.js';
import { CAR_LEN, CAR_W, FD, FB, CHARACTERS, MAX_LIVES } from './config.js';
import { ICON_SND_ON, ICON_SND_OFF } from './sprites.js';
import { buildLevel } from './level.js';
import { updatePlay } from './simulation.js';
import { drawTitle, drawMenu, drawLot, drawCar, drawMover, drawNight, overlay, drawLeaderboard, syncHUD } from './render.js';
import { ac, setMuted, sfx, engineUpdate } from './audio.js';
import { getNick, setNick, fetchTop, submitScore } from './leaderboard.js';

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
  } else if (G.scene === 'leaderboard'){
    drawLeaderboard();
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

    if (G.scene==='play' && G.hintT > 0){
      ctx.textAlign = 'center';
      ctx.font = `800 22px ${FB}`;
      ctx.fillStyle = `rgba(255,176,46,${Math.min(1, G.hintT*2)})`;
      ctx.fillText('BACK IN ONLY — reverse into the slot!', W/2, H/2 - 90);
    }

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

    if (G.scene === 'crashed') overlay('CRASHED!', '#ff5555', [G.failMsg, `${G.lives} ♥ remaining`], 'ENTER — RETRY');
    if (G.scene === 'timeup')  overlay("TIME'S UP!", '#ffb02e', [G.failMsg, `${G.lives} ♥ remaining`], 'ENTER — RETRY');
    if (G.scene === 'parked')  overlay('★'.repeat(G.stars) + '☆'.repeat(3-G.stars), '#56b06b',
        [G.winMsg], 'ENTER — NEXT LEVEL');
    if (G.scene === 'gameover'){
      overlay('GAME OVER', '#ff5555', [`Reached Level ${G.level}  ·  ${G.totalStars}★`], null);
      if (document.getElementById('nameModal').classList.contains('hidden')) showNameModal();
    }
  }
  engineUpdate();
  syncHUD();
  requestAnimationFrame(frame);
}

// ---------- Run / leaderboard flow ----------
function startRun(){
  G.difficulty = CHARACTERS[G.menuIndex].id;
  G.level = 1; G.crashes = 0; G.lives = MAX_LIVES; G.totalStars = 0; G.plan = null;
  buildLevel();
  G.scene = 'play';
  const a = ac(); if (a && a.resume) a.resume();
}

async function loadBoard(mode){
  G.boardMode = mode;
  G.boardLoading = true;
  G.board = [];
  const rows = await fetchTop(mode, 10);
  if (G.boardMode === mode){ G.board = rows; G.boardLoading = false; }
}

function openBoard(mode){
  G.scene = 'leaderboard';
  loadBoard(mode);
}

async function postScore(nick){
  G.scene = 'leaderboard';
  G.boardMode = G.difficulty || 'normal';
  G.boardLoading = true; G.board = [];
  await submitScore({ nickname: nick, level: G.level, stars: G.totalStars, difficulty: G.difficulty });
  const rows = await fetchTop(G.boardMode, 10);
  G.board = rows; G.boardLoading = false;
}

function showNameModal(){
  const modal = document.getElementById('nameModal');
  const input = document.getElementById('nameInput');
  input.value = getNick();
  modal.classList.remove('hidden');
  input.focus(); input.select();
}

// ---------- Input ----------
window.addEventListener('keydown', e => {
  // while the nickname modal is open, let the form own the keyboard
  if (!document.getElementById('nameModal').classList.contains('hidden')) return;

  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  G.keys[e.key] = true;

  if (e.key === 'h' || e.key === 'H') sfx.honk();
  if (e.key === 'm' || e.key === 'M') setMuted(!G.muted);

  if (G.scene === 'title'){
    if (e.key === 'Enter'){ G.scene = 'menu'; const a = ac(); if (a && a.resume) a.resume(); }
    else if (e.key === 'l' || e.key === 'L') openBoard('normal');
    return;
  }
  if (G.scene === 'menu'){
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') G.menuIndex = 1 - G.menuIndex;
    if (e.key === 'Enter') startRun();
    if (e.key === 'Escape') G.scene = 'title';
    return;
  }
  if (G.scene === 'leaderboard'){
    if (e.key === 'Enter'){ if (G.difficulty) startRun(); else G.scene = 'menu'; }
    else if (e.key === 'Tab'){ e.preventDefault(); loadBoard(G.boardMode === 'normal' ? 'hard' : 'normal'); }
    else if (e.key === 'Escape') G.scene = 'title';
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

(function initNameUI(){
  const modal = document.getElementById('nameModal');
  const input = document.getElementById('nameInput');
  const close = () => modal.classList.add('hidden');
  const doPost = () => { const nick = (input.value.trim().slice(0,12) || 'DRIVER'); setNick(nick); close(); postScore(nick); };
  const doSkip = () => { close(); openBoard(G.difficulty || 'normal'); };
  document.getElementById('namePost').addEventListener('click', doPost);
  document.getElementById('nameSkip').addEventListener('click', doSkip);
  input.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter') doPost();
    else if (e.key === 'Escape') doSkip();
  });
})();

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
