export const SPRITES = {
  male: `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='160' viewBox='0 0 120 160'>
    <rect x='30' y='66' width='12' height='42' rx='6' fill='#f2c79a'/>
    <rect x='78' y='66' width='12' height='42' rx='6' fill='#f2c79a'/>
    <rect x='36' y='60' width='48' height='54' rx='14' fill='#4a7fd4'/>
    <rect x='42' y='110' width='14' height='40' rx='6' fill='#2e3545'/>
    <rect x='64' y='110' width='14' height='40' rx='6' fill='#2e3545'/>
    <rect x='38' y='148' width='20' height='9' rx='4' fill='#1c1f27'/>
    <rect x='62' y='148' width='20' height='9' rx='4' fill='#1c1f27'/>
    <circle cx='60' cy='36' r='22' fill='#f2c79a'/>
    <path d='M38 36 a22 22 0 0 1 44 0 l-6 -3 q-16 -10 -32 0 z' fill='#3a2e26'/>
    <circle cx='52' cy='38' r='2.4' fill='#2a2d35'/>
    <circle cx='68' cy='38' r='2.4' fill='#2a2d35'/>
    <path d='M53 48 q7 5 14 0' stroke='#a06a42' stroke-width='2.2' fill='none' stroke-linecap='round'/>
  </svg>`,
  female: `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='160' viewBox='0 0 120 160'>
    <rect x='34' y='16' width='52' height='58' rx='24' fill='#6b3f1f'/>
    <rect x='38' y='40' width='10' height='38' rx='5' fill='#6b3f1f'/>
    <rect x='72' y='40' width='10' height='38' rx='5' fill='#6b3f1f'/>
    <rect x='30' y='66' width='12' height='42' rx='6' fill='#f2c79a'/>
    <rect x='78' y='66' width='12' height='42' rx='6' fill='#f2c79a'/>
    <path d='M40 60 h40 l6 54 h-52 z' fill='#c4584f'/>
    <rect x='44' y='112' width='13' height='38' rx='6' fill='#f2c79a'/>
    <rect x='63' y='112' width='13' height='38' rx='6' fill='#f2c79a'/>
    <rect x='40' y='148' width='20' height='9' rx='4' fill='#7a2f3a'/>
    <rect x='60' y='148' width='20' height='9' rx='4' fill='#7a2f3a'/>
    <circle cx='60' cy='36' r='21' fill='#f2c79a'/>
    <path d='M39 38 a21 21 0 0 1 42 0 l-5 -4 q-16 -11 -32 0 z' fill='#6b3f1f'/>
    <circle cx='52' cy='38' r='2.4' fill='#2a2d35'/>
    <circle cx='68' cy='38' r='2.4' fill='#2a2d35'/>
    <path d='M53 48 q7 5 14 0' stroke='#a0524a' stroke-width='2.2' fill='none' stroke-linecap='round'/>
  </svg>`,
  // top-down, "forward" = up
  granny: `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'>
    <ellipse cx='20' cy='22' rx='13' ry='9' fill='#7a5fb5'/>
    <ellipse cx='9' cy='22' rx='3.4' ry='4' fill='#f2c79a'/>
    <ellipse cx='31' cy='22' rx='3.4' ry='4' fill='#f2c79a'/>
    <circle cx='20' cy='15' r='8' fill='#e9bd9a'/>
    <circle cx='20' cy='13' r='7' fill='#cfd2d8'/>
    <circle cx='20' cy='9.5' r='3.2' fill='#b9bdc6'/>
    <rect x='30' y='26' width='7' height='9' rx='2.5' fill='#8c4a3a'/>
  </svg>`,
  cart: `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='44' viewBox='0 0 36 44'>
    <circle cx='9' cy='7' r='2.6' fill='#3a3f4c'/><circle cx='27' cy='7' r='2.6' fill='#3a3f4c'/>
    <circle cx='9' cy='32' r='2.6' fill='#3a3f4c'/><circle cx='27' cy='32' r='2.6' fill='#3a3f4c'/>
    <rect x='6' y='4' width='24' height='31' rx='4' fill='#aab2c0' stroke='#6e7686' stroke-width='2'/>
    <path d='M10 11 h16 M10 17 h16 M10 23 h16 M10 29 h16 M13 6 v27 M18 6 v27 M23 6 v27' stroke='#6e7686' stroke-width='1.3'/>
    <rect x='4' y='37' width='28' height='5' rx='2.5' fill='#c4584f'/>
  </svg>`,
};
export const IMG = {};
if (typeof Image !== 'undefined'){
  for (const k in SPRITES){
    const i = new Image();
    i.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(SPRITES[k]);
    IMG[k] = i;
  }
}
export function spriteReady(k){ return IMG[k] && IMG[k].complete && IMG[k].naturalWidth > 0; }

// HUD mini-avatars + sound icons (inline SVG strings for the DOM)
export const HUD_AVATAR = {
  none: `<svg width="26" height="16" viewBox="0 0 52 32"><rect x="2" y="6" width="48" height="20" rx="8" fill="#e23b3b"/><rect x="14" y="9" width="10" height="14" rx="3" fill="#1a2233"/><rect x="30" y="9" width="8" height="14" rx="3" fill="#1a2233"/></svg>`,
  normal: `<svg width="22" height="22" viewBox="0 0 40 40"><circle cx="20" cy="22" r="13" fill="#f2c79a"/><path d="M7 22 a13 13 0 0 1 26 0 l-4 -2 q-9 -6 -18 0 z" fill="#3a2e26"/><circle cx="15" cy="23" r="1.6" fill="#2a2d35"/><circle cx="25" cy="23" r="1.6" fill="#2a2d35"/></svg>`,
  hard: `<svg width="22" height="22" viewBox="0 0 40 40"><rect x="6" y="10" width="28" height="26" rx="13" fill="#6b3f1f"/><circle cx="20" cy="22" r="12" fill="#f2c79a"/><path d="M8 22 a12 12 0 0 1 24 0 l-4 -3 q-8 -5 -16 0 z" fill="#6b3f1f"/><circle cx="15" cy="23" r="1.6" fill="#2a2d35"/><circle cx="25" cy="23" r="1.6" fill="#2a2d35"/></svg>`,
};
export const ICON_SND_ON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>`;
export const ICON_SND_OFF = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><line x1="15" y1="9" x2="21" y2="15"/><line x1="21" y1="9" x2="15" y2="15"/></svg>`;
