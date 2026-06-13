import { LEADERBOARD_URL } from './config.js';

const NICK_KEY = 'parkit-nick';

export function getNick(){
  try { return localStorage.getItem(NICK_KEY) || ''; } catch { return ''; }
}
export function setNick(n){
  try { localStorage.setItem(NICK_KEY, n); } catch {}
}

export async function fetchTop(mode = 'normal', limit = 10){
  if (!LEADERBOARD_URL) return [];
  try {
    const r = await fetch(`${LEADERBOARD_URL}/scores?mode=${mode}&limit=${limit}`);
    return r.ok ? await r.json() : [];
  } catch { return []; }
}

export async function submitScore({ nickname, level, stars, difficulty }){
  if (!LEADERBOARD_URL) return { ok: false, error: 'disabled' };
  try {
    const r = await fetch(`${LEADERBOARD_URL}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, level, stars, difficulty }),
    });
    return await r.json();
  } catch (e) { return { ok: false, error: String(e) }; }
}
