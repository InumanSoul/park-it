import { H } from './canvas.js';

export const G = {
  scene: 'title',
  menuIndex: 0,
  difficulty: null,
  level: 1,
  crashes: 0,
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
};

export const car = { x:0, y:0, a:0, v:0, steer:0 };

// Arrays cleared in place (never reassigned); reassignable target lives on `level`.
export const slots = [];
export const obstacles = [];
export const movers = [];
export const level = { target: null };
