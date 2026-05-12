import { formatPoint } from "../engine/geometry.js";

let gridCounter = 0;

export function svgWrapper(inner, size = 120, options = {}) {
  const showGrid = options.showGrid === true;
  const gridId = showGrid ? `grid-${gridCounter++}` : "";
  return `
    <svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
      ${showGrid ? `
      <defs>
        <pattern id="${gridId}" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e6e6e2" stroke-width="1" />
        </pattern>
      </defs>` : ""}
      <rect x="2" y="2" width="96" height="96" fill="#fff" stroke="#111" stroke-width="2" rx="6" />
      ${showGrid ? `<rect x="2" y="2" width="96" height="96" fill="url(#${gridId})" rx="6" />` : ""}
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
      const displaySize = size * 1.25;
      if (hole.shape === "circle") {
        return `<circle cx="${cx}" cy="${cy}" r="${displaySize}" fill="#111" stroke="#fff" stroke-width="1.5" />`;
      }
      if (hole.shape === "square") {
        return `<rect x="${cx - displaySize}" y="${cy - displaySize}" width="${displaySize * 2}" height="${displaySize * 2}" fill="#111" stroke="#fff" stroke-width="1.5" />`;
      }
      return `<polygon points="${cx},${cy - displaySize} ${cx - displaySize},${cy + displaySize} ${cx + displaySize},${cy + displaySize}" fill="#111" stroke="#fff" stroke-width="1.5" />`;
    })
    .join("");
}
