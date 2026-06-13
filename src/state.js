import { H } from './canvas.js';
import { MAX_LIVES } from './config.js';

export const G = {
  scene: 'title',         // title | menu | play | crashed | parked | timeup | gameover | leaderboard
  menuIndex: 0,
  difficulty: null,
  level: 1,
  crashes: 0,
  lives: MAX_LIVES,
  totalStars: 0,
  stars: 0,
  timeLeft: 0,
  levelTime: 1,
  parkHold: 0,
  hintT: 0,
  banner: null,
  plan: null,
  failMsg: '', winMsg: '',
  laneTop: 0, laneBottom: H,
  muted: false,
  keys: {},
  board: [], boardMode: 'normal', boardLoading: false,
};

export const car = { x:0, y:0, a:0, v:0, steer:0 };

// Arrays cleared in place (never reassigned); reassignable target lives on `level`.
export const slots = [];
export const obstacles = [];
export const movers = [];
export const level = { target: null };
