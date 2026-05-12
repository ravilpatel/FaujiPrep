import { formatPoint } from "../engine/geometry.js";

export function svgWrapper(inner, size = 120) {
  return `
    <svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
      <rect x="2" y="2" width="96" height="96" fill="#fff" stroke="#111" stroke-width="2" rx="6" />
      ${inner}
    </svg>
  `;
}

export function renderPolygon(points, fill = "#f3f3ef", stroke = "#111") {
  const pts = points.map((p) => formatPoint(p, 100)).join(" ");
  return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" />`;
}

export function renderFoldLine(line) {
  const { a, b, c } = line;
  const points = [];
  const edges = [
    { x: 0, y: -(c) / b },
    { x: 1, y: -(a + c) / b },
    { x: -(c) / a, y: 0 },
    { x: -(b + c) / a, y: 1 },
  ];
  for (const p of edges) {
    if (Number.isFinite(p.x) && Number.isFinite(p.y)) {
      if (p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1) {
        points.push({ x: p.x * 100, y: p.y * 100 });
      }
    }
  }
  if (points.length < 2) {
    return "";
  }
  const [p1, p2] = points;
  return `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#111" stroke-dasharray="4 4" />`;
}

export function renderHoles(holes) {
  return holes
    .map((hole) => {
      const cx = hole.x * 100;
      const cy = hole.y * 100;
      const size = hole.size * 100;
      if (hole.shape === "circle") {
        return `<circle cx="${cx}" cy="${cy}" r="${size}" fill="#111" />`;
      }
      if (hole.shape === "square") {
        return `<rect x="${cx - size}" y="${cy - size}" width="${size * 2}" height="${size * 2}" fill="#111" />`;
      }
      return `<polygon points="${cx},${cy - size} ${cx - size},${cy + size} ${cx + size},${cy + size}" fill="#111" />`;
    })
    .join("");
}
