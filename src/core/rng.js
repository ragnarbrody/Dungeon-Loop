export function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFrom(gx, gy) {
  let h = 2166136261 ^ gx;
  h = Math.imul(h, 16777619) ^ gy;
  h = Math.imul(h, 16777619);
  return h >>> 0;
}

export function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}