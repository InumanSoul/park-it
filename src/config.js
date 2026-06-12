export const FD = '"Titan One", "Segoe UI", system-ui, sans-serif';   // display
export const FB = '"Nunito", "Segoe UI", system-ui, sans-serif';      // body

export const CHARACTERS = [
  { id:'normal', img:'male',   name:'MALE',   licName:'BOB',
    diffLabel:'NORMAL', diffColor:'#56b06b',
    sub:'Forgiving steering, roomier slots, more time.' },
  { id:'hard',   img:'female', name:'FEMALE', licName:'LIZ',
    diffLabel:'HARD', diffColor:'#ff5555',
    sub:'Twitchy steering, tight slots, less time.' },
];

export const DIFF = {
  normal: { steerRate: 3.0, maxSteer: 0.55, slotMul: 0.93, timeMul: 0.85 },
  hard:   { steerRate: 7.0, maxSteer: 0.85, slotMul: 0.80, timeMul: 0.60 },
};

export const MSG = {
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

export const CAR_LEN = 84, CAR_W = 44, WHEELBASE = 60;
export const ACCEL = 195, REV_ACCEL = 140, MAX_FWD = 215, MAX_REV = 120, DRAG = 2.4;

export const PALETTE = ['#4a7fd4','#56b06b','#c4584f','#b08a3e','#7a5fb5','#3e9da8','#8c6d5a'];
