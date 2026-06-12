export function rand(min, max){ return min + Math.random()*(max-min); }
export function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
export function rectCorners(x, y, w, h){
  return [{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
}
