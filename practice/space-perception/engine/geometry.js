const EPS = 1e-6;

export function makeSquare() {
  return [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];
}

export function lineFromPoints(p1, p2) {
  const a = p1.y - p2.y;
  const b = p2.x - p1.x;
  const c = p1.x * p2.y - p2.x * p1.y;
  const len = Math.hypot(a, b) || 1;
  return { a: a / len, b: b / len, c: c / len };
}

export function sideOfLine(line, p) {
  return line.a * p.x + line.b * p.y + line.c;
}

export function clipPolygon(polygon, line, keepSide = 1) {
  if (!polygon.length) return [];
  const output = [];
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    const currentInside = keepSide * sideOfLine(line, current) >= -EPS;
    const nextInside = keepSide * sideOfLine(line, next) >= -EPS;

    if (currentInside && nextInside) {
      output.push(next);
    } else if (currentInside && !nextInside) {
      const intersect = lineIntersection(current, next, line);
      if (intersect) output.push(intersect);
    } else if (!currentInside && nextInside) {
      const intersect = lineIntersection(current, next, line);
      if (intersect) output.push(intersect);
      output.push(next);
    }
  }
  return output;
}

export function lineIntersection(p1, p2, line) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const denom = line.a * dx + line.b * dy;
  if (Math.abs(denom) < EPS) return null;
  const t = -(line.a * p1.x + line.b * p1.y + line.c) / denom;
  return { x: p1.x + t * dx, y: p1.y + t * dy };
}

export function reflectPoint(p, line) {
  const d = line.a * p.x + line.b * p.y + line.c;
  return {
    x: p.x - 2 * line.a * d,
    y: p.y - 2 * line.b * d,
  };
}

export function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    area += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(area) / 2;
}

export function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + EPS) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

export function formatPoint(p, scale = 1) {
  return `${p.x * scale},${p.y * scale}`;
}

export function clampPoint(p) {
  return {
    x: Math.min(1, Math.max(0, p.x)),
    y: Math.min(1, Math.max(0, p.y)),
  };
}

export function holesEqual(a, b, eps = 0.002) {
  if (a.length !== b.length) return false;
  const format = (hole) =>
    `${hole.shape}-${hole.size.toFixed(3)}-${hole.x.toFixed(3)}-${hole.y.toFixed(3)}`;
  const listA = a.map(format).sort();
  const listB = b.map(format).sort();
  for (let i = 0; i < listA.length; i += 1) {
    if (listA[i] !== listB[i]) return false;
  }
  return true;
}

export function isWithinSquare(p) {
  return p.x >= -EPS && p.x <= 1 + EPS && p.y >= -EPS && p.y <= 1 + EPS;
}
