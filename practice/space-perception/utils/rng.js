export function hashSeed(input) {
  if (!input) {
    return Date.now() >>> 0;
  }
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed) {
  let state = seed >>> 0;
  return function rng() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomChoice(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

export function randomRange(rng, min, max) {
  return min + rng() * (max - min);
}

export function randomInt(rng, min, max) {
  return Math.floor(randomRange(rng, min, max + 1));
}
