// ── Unit 3 Solvers ──────────────────────────────────────────────────────────

const fmt = (v, n = 2) => Number(v).toFixed(n)

// ── Shape Definitions ────────────────────────────────────────────────────────
// Each shape specifies:
//   area(dims)  → number
//   cx(dims, x0, y0)  → centroid x
//   cy(dims, x0, y0)  → centroid y
//   refLabel  → what x0, y0 means for the user

export const SHAPE_DEFS = {
  rectangle: {
    label: 'Rectangle',
    params: [
      { key: 'b', label: 'Width b (m)' },
      { key: 'h', label: 'Height h (m)' },
    ],
    refLabel: 'Bottom-left corner (x₀, y₀)',
    area: ({ b, h }) => b * h,
    cx: ({ b }, x0) => x0 + b / 2,
    cy: ({ h }, _x0, y0) => y0 + h / 2,
    areaFormula: 'A = b × h',
    cxFormula: 'x̄ = x₀ + b/2',
    cyFormula: 'ȳ = y₀ + h/2',
  },
  triangle_right: {
    label: 'Right Triangle (right-angle at x₀,y₀)',
    params: [
      { key: 'b', label: 'Base b (m)' },
      { key: 'h', label: 'Height h (m)' },
    ],
    refLabel: 'Right-angle corner (x₀, y₀)',
    area: ({ b, h }) => 0.5 * b * h,
    cx: ({ b }, x0) => x0 + b / 3,
    cy: ({ h }, _x0, y0) => y0 + h / 3,
    areaFormula: 'A = ½ b h',
    cxFormula: 'x̄ = x₀ + b/3',
    cyFormula: 'ȳ = y₀ + h/3',
  },
  circle: {
    label: 'Circle',
    params: [{ key: 'r', label: 'Radius r (m)' }],
    refLabel: 'Centre of circle (x₀, y₀)',
    area: ({ r }) => Math.PI * r * r,
    cx: (_d, x0) => x0,
    cy: (_d, _x0, y0) => y0,
    areaFormula: 'A = π r²',
    cxFormula: 'x̄ = x₀',
    cyFormula: 'ȳ = y₀',
  },
  semicircle: {
    label: 'Semicircle (flat edge horizontal)',
    params: [{ key: 'r', label: 'Radius r (m)' }],
    refLabel: 'Centre of flat edge (x₀, y₀)',
    area: ({ r }) => 0.5 * Math.PI * r * r,
    cx: (_d, x0) => x0,
    cy: ({ r }, _x0, y0) => y0 + (4 * r) / (3 * Math.PI),
    areaFormula: 'A = π r² / 2',
    cxFormula: 'x̄ = x₀',
    cyFormula: 'ȳ = y₀ + 4r / (3π)',
  },
  quarter_circle: {
    label: 'Quarter Circle (1st quadrant from x₀,y₀)',
    params: [{ key: 'r', label: 'Radius r (m)' }],
    refLabel: 'Corner of quarter circle (x₀, y₀)',
    area: ({ r }) => 0.25 * Math.PI * r * r,
    cx: ({ r }, x0) => x0 + (4 * r) / (3 * Math.PI),
    cy: ({ r }, _x0, y0) => y0 + (4 * r) / (3 * Math.PI),
    areaFormula: 'A = π r² / 4',
    cxFormula: 'x̄ = x₀ + 4r / (3π)',
    cyFormula: 'ȳ = y₀ + 4r / (3π)',
  },
}

// ── Centroid of Composite Area ───────────────────────────────────────────────
// shapes: [{type, dims: {b,h,r,...}, x0, y0, hole: bool}]
export function solveCentroid(shapes) {
  const steps = []
  const table = []

  steps.push({ type: 'header', text: 'Step 1 — Compute area and centroid of each part' })

  let sumA = 0, sumAx = 0, sumAy = 0

  shapes.forEach((s, i) => {
    const def = SHAPE_DEFS[s.type]
    if (!def) return

    const A = def.area(s.dims)
    const cx = def.cx(s.dims, s.x0, s.y0)
    const cy = def.cy(s.dims, s.x0, s.y0)
    const sign = s.hole ? -1 : 1

    sumA += sign * A
    sumAx += sign * A * cx
    sumAy += sign * A * cy

    table.push({ i: i + 1, label: def.label + (s.hole ? ' (HOLE)' : ''), A: fmt(A), cx: fmt(cx), cy: fmt(cy), Ax: fmt(sign * A * cx), Ay: fmt(sign * A * cy) })

    steps.push({
      type: 'calc',
      label: `Part ${i + 1}: ${def.label}${s.hole ? ' [hole −]' : ''}`,
      lines: [
        `${def.areaFormula}  →  A = ${fmt(A)} m²`,
        `${def.cxFormula}  →  x̄ = ${fmt(cx)} m`,
        `${def.cyFormula}  →  ȳ = ${fmt(cy)} m`,
        `A·x̄ = ${fmt(sign * A * cx)} m³`,
        `A·ȳ = ${fmt(sign * A * cy)} m³`,
      ],
    })
  })

  const Xbar = sumAx / sumA
  const Ybar = sumAy / sumA

  steps.push({ type: 'header', text: 'Step 2 — Apply composite centroid formula' })
  steps.push({
    type: 'calc',
    label: 'Composite centroid',
    lines: [
      `ΣA   = ${fmt(sumA)} m²`,
      `ΣAx̄ = ${fmt(sumAx)} m³`,
      `ΣAȳ = ${fmt(sumAy)} m³`,
      `X̄ = ΣAx̄ / ΣA = ${fmt(sumAx)} / ${fmt(sumA)} = ${fmt(Xbar)} m`,
      `Ȳ = ΣAȳ / ΣA = ${fmt(sumAy)} / ${fmt(sumA)} = ${fmt(Ybar)} m`,
    ],
  })

  return {
    result: { Xbar: fmt(Xbar), Ybar: fmt(Ybar), totalArea: fmt(sumA), table },
    steps,
    error: sumA <= 0 ? 'Total area ≤ 0 — check hole assignments.' : null,
  }
}
