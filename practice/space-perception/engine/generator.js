import {
  makeSquare,
  lineFromPoints,
  clipPolygon,
  polygonArea,
  pointInPolygon,
  reflectPoint,
  isWithinSquare,
} from "./geometry.js";
import { randomChoice, randomInt, randomRange } from "../utils/rng.js";

const SHAPES = ["circle", "square", "triangle"];

function buildLine(type, offset = 0.5) {
  if (type === "v") {
    return lineFromPoints({ x: offset, y: 0 }, { x: offset, y: 1 });
  }
  if (type === "h") {
    return lineFromPoints({ x: 0, y: offset }, { x: 1, y: offset });
  }
  if (type === "d1") {
    return lineFromPoints({ x: 0, y: 0 }, { x: 1, y: 1 });
  }
  return lineFromPoints({ x: 1, y: 0 }, { x: 0, y: 1 });
}

function generateFolds(rng, difficulty) {
  const folds = [];
  const countMap = { easy: 1, medium: 2, hard: randomInt(rng, 2, 3), expert: 3 };
  const count = countMap[difficulty] || 2;

  for (let i = 0; i < count; i += 1) {
    let typePool = ["v", "h"];
    if (difficulty === "hard" || difficulty === "expert") {
      typePool = ["v", "h", "d1", "d2"];
    }
    const type = randomChoice(rng, typePool);
    let offset = 0.5;
    if (type === "v" || type === "h") {
      if (difficulty === "hard" || difficulty === "expert") {
        offset = randomChoice(rng, [0.35, 0.4, 0.5, 0.6, 0.65]);
      }
    }
    folds.push({
      type,
      line: buildLine(type, offset),
      keepSide: randomChoice(rng, [1, -1]),
      offset,
    });
  }
  return folds;
}

function foldedPolygonFromFolds(folds) {
  let poly = makeSquare();
  for (const fold of folds) {
    poly = clipPolygon(poly, fold.line, fold.keepSide);
  }
  return poly;
}

function randomPointInPolygon(rng, polygon) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of polygon) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  for (let i = 0; i < 200; i += 1) {
    const p = { x: randomRange(rng, minX, maxX), y: randomRange(rng, minY, maxY) };
    if (pointInPolygon(p, polygon)) return p;
  }
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

function generateHoles(rng, polygon, difficulty) {
  const countMap = { easy: 1, medium: randomInt(rng, 2, 3), hard: randomInt(rng, 2, 3), expert: randomInt(rng, 3, 4) };
  const count = countMap[difficulty] || 2;
  const holes = [];

  for (let i = 0; i < count; i += 1) {
    const p = randomPointInPolygon(rng, polygon);
    const shape = difficulty === "easy" ? "circle" : randomChoice(rng, SHAPES);
    const size = difficulty === "expert" ? 0.045 : 0.04;
    holes.push({ x: p.x, y: p.y, shape, size });
  }
  return holes;
}

function dedupeHoles(holes) {
  const unique = [];
  for (const hole of holes) {
    const key = `${hole.shape}-${hole.x.toFixed(3)}-${hole.y.toFixed(3)}`;
    if (!unique.some((h) => `${h.shape}-${h.x.toFixed(3)}-${h.y.toFixed(3)}` === key)) {
      unique.push(hole);
    }
  }
  return unique;
}

function unfoldHoles(holes, folds) {
  let current = holes.slice();
  for (let i = folds.length - 1; i >= 0; i -= 1) {
    const fold = folds[i];
    const reflected = current.map((hole) => {
      const center = reflectPoint(hole, fold.line);
      return { ...hole, x: center.x, y: center.y };
    });
    current = dedupeHoles(
      current
        .concat(reflected)
        .filter((hole) => isWithinSquare(hole))
    );
  }
  return current;
}

export function createQuestion(rng, difficulty) {
  let folds = [];
  let foldedPolygon = [];
  let attempts = 0;

  while (attempts < 40) {
    folds = generateFolds(rng, difficulty);
    foldedPolygon = foldedPolygonFromFolds(folds);
    if (foldedPolygon.length && polygonArea(foldedPolygon) > 0.08) {
      break;
    }
    attempts += 1;
  }

  const foldedHoles = generateHoles(rng, foldedPolygon, difficulty);
  const unfoldedHoles = unfoldHoles(foldedHoles, folds);

  return {
    id: crypto.randomUUID(),
    difficulty,
    folds,
    foldedPolygon,
    foldedHoles,
    unfoldedHoles,
  };
}

export function unfoldWithSkip(holes, folds, skipIndex) {
  let current = holes.slice();
  for (let i = folds.length - 1; i >= 0; i -= 1) {
    if (i === skipIndex) continue;
    const fold = folds[i];
    const reflected = current.map((hole) => {
      const center = reflectPoint(hole, fold.line);
      return { ...hole, x: center.x, y: center.y };
    });
    current = dedupeHoles(
      current
        .concat(reflected)
        .filter((hole) => isWithinSquare(hole))
    );
  }
  return current;
}
