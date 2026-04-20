// ── Unit 4 Solvers ──────────────────────────────────────────────────────────

const fmt = (v, n = 2) => Number(v).toFixed(n)
const d2r = (d) => (d * Math.PI) / 180

// ── Shape MOI about own centroidal axes ─────────────────────────────────────
// dims: {b, h, r}  — only relevant keys needed
// Returns Ix_cg and Iy_cg (second moment of area about centroidal x and y axes)

export const MOI_SHAPES = {
  rectangle: {
    label: 'Rectangle',
    params: [
      { key: 'b', label: 'Width b (m)' },
      { key: 'h', label: 'Height h (m)' },
    ],
    refLabel: 'Bottom-left corner (x₀, y₀) → centroid is at (x₀+b/2, y₀+h/2)',
    area: ({ b, h }) => b * h,
    cx: ({ b }, x0) => x0 + b / 2,
    cy: ({ h }, _, y0) => y0 + h / 2,
    Ix_cg: ({ b, h }) => (b * Math.pow(h, 3)) / 12,
    Iy_cg: ({ b, h }) => (h * Math.pow(b, 3)) / 12,
    IxFormula: 'Ix_cg = bh³/12',
    IyFormula: 'Iy_cg = hb³/12',
  },
  triangle: {
    label: 'Triangle (right, right-angle at x₀,y₀)',
    params: [
      { key: 'b', label: 'Base b (m)' },
      { key: 'h', label: 'Height h (m)' },
    ],
    refLabel: 'Right-angle corner (x₀, y₀) → centroid at (x₀+b/3, y₀+h/3)',
    area: ({ b, h }) => 0.5 * b * h,
    cx: ({ b }, x0) => x0 + b / 3,
    cy: ({ h }, _, y0) => y0 + h / 3,
    Ix_cg: ({ b, h }) => (b * Math.pow(h, 3)) / 36,
    Iy_cg: ({ b, h }) => (h * Math.pow(b, 3)) / 36,
    IxFormula: 'Ix_cg = bh³/36',
    IyFormula: 'Iy_cg = hb³/36',
  },
  circle: {
    label: 'Circle',
    params: [{ key: 'r', label: 'Radius r (m)' }],
    refLabel: 'Centre (x₀, y₀)',
    area: ({ r }) => Math.PI * r * r,
    cx: (_, x0) => x0,
    cy: (_, __, y0) => y0,
    Ix_cg: ({ r }) => (Math.PI * Math.pow(r, 4)) / 4,
    Iy_cg: ({ r }) => (Math.PI * Math.pow(r, 4)) / 4,
    IxFormula: 'Ix_cg = πr⁴/4',
    IyFormula: 'Iy_cg = πr⁴/4',
  },
  semicircle: {
    label: 'Semicircle (flat edge at bottom, x₀,y₀ = centre of flat)',
    params: [{ key: 'r', label: 'Radius r (m)' }],
    refLabel: 'Centre of flat edge (x₀, y₀) → centroid at (x₀, y₀+4r/3π)',
    area: ({ r }) => 0.5 * Math.PI * r * r,
    cx: (_, x0) => x0,
    cy: ({ r }, __, y0) => y0 + (4 * r) / (3 * Math.PI),
    Ix_cg: ({ r }) => (Math.PI / 8 - 8 / (9 * Math.PI)) * Math.pow(r, 4),
    Iy_cg: ({ r }) => (Math.PI * Math.pow(r, 4)) / 8,
    IxFormula: 'Ix_cg = (π/8 − 8/9π) r⁴ ≈ 0.1098 r⁴',
    IyFormula: 'Iy_cg = πr⁴/8',
  },
}

// ── Area Moment of Inertia (Composite) ───────────────────────────────────────
// shapes: [{ type, dims, x0, y0, hole }]
// axis: 'X' | 'Y' | 'both'
// refAxis: { x: number, y: number } — coordinates of reference axes (default 0,0)
export function solveAreaMOI(shapes, refAxis = { x: 0, y: 0 }) {
  const steps = []

  steps.push({ type: 'header', text: 'Step 1 — MOI of each part about its own centroidal axis' })

  let Ix_total = 0, Iy_total = 0
  const table = []

  shapes.forEach((s, i) => {
    const def = MOI_SHAPES[s.type]
    if (!def) return
    const sign = s.hole ? -1 : 1

    const A = def.area(s.dims)
    const xcg = def.cx(s.dims, s.x0, s.y0)
    const ycg = def.cy(s.dims, s.x0, s.y0)

    const Ix_cg = def.Ix_cg(s.dims)
    const Iy_cg = def.Iy_cg(s.dims)

    const dy = ycg - refAxis.y
    const dx = xcg - refAxis.x

    // Parallel axis theorem: I_ref = I_cg + A·d²
    const Ix_ref = Ix_cg + A * dy * dy
    const Iy_ref = Iy_cg + A * dx * dx

    Ix_total += sign * Ix_ref
    Iy_total += sign * Iy_ref

    table.push({
      i: i + 1,
      label: def.label + (s.hole ? ' (hole)' : ''),
      A: fmt(A),
      xcg: fmt(xcg), ycg: fmt(ycg),
      Ix_cg: fmt(Ix_cg), Iy_cg: fmt(Iy_cg),
      dy: fmt(dy), dx: fmt(dx),
      Ix_ref: fmt(sign * Ix_ref), Iy_ref: fmt(sign * Iy_ref),
    })

    steps.push({
      type: 'calc',
      label: `Part ${i + 1}: ${def.label}${s.hole ? ' [hole −]' : ''}`,
      lines: [
        `A = ${fmt(A)} m²,  centroid: (${fmt(xcg)}, ${fmt(ycg)}) m`,
        `${def.IxFormula}  →  Ix_cg = ${fmt(Ix_cg)} m⁴`,
        `${def.IyFormula}  →  Iy_cg = ${fmt(Iy_cg)} m⁴`,
        `dy = ycg − y_ref = ${fmt(ycg)} − ${refAxis.y} = ${fmt(dy)} m`,
        `dx = xcg − x_ref = ${fmt(xcg)} − ${refAxis.x} = ${fmt(dx)} m`,
        `Ix (about ref x-axis) = Ix_cg + A·dy²  = ${fmt(Ix_cg)} + ${fmt(A)}·${fmt(dy)}²  = ${fmt(sign * Ix_ref)} m⁴`,
        `Iy (about ref y-axis) = Iy_cg + A·dx²  = ${fmt(Iy_cg)} + ${fmt(A)}·${fmt(dx)}²  = ${fmt(sign * Iy_ref)} m⁴`,
      ],
    })
  })

  steps.push({ type: 'header', text: 'Step 2 — Sum all parts' })
  steps.push({
    type: 'result',
    lines: [
      `Ix (total, about y = ${refAxis.y}) = ${fmt(Ix_total)} m⁴`,
      `Iy (total, about x = ${refAxis.x}) = ${fmt(Iy_total)} m⁴`,
    ],
  })

  return {
    result: { Ix: fmt(Ix_total), Iy: fmt(Iy_total), table },
    steps, error: null,
  }
}

// ── Friction — Horizontal Surface ────────────────────────────────────────────
// W: weight (N), μs, μk, P: horizontal applied force (N)
export function solveFrictionHorizontal({ W, mu_s, mu_k, P }) {
  const N = W
  const F_s_max = mu_s * N
  const F_k = mu_k * N
  const steps = []

  steps.push({ type: 'header', text: 'Step 1 — Identify forces' })
  steps.push({
    type: 'calc',
    label: 'Normal force',
    lines: ['ΣFy = 0  →  N = W', `N = ${fmt(W)} N`],
  })

  steps.push({ type: 'header', text: 'Step 2 — Maximum static friction' })
  steps.push({
    type: 'calc',
    label: 'F_s,max',
    lines: [`F_s,max = μs × N = ${fmt(mu_s)} × ${fmt(W)} = ${fmt(F_s_max)} N`],
  })

  const moving = P > F_s_max
  steps.push({ type: 'header', text: 'Step 3 — Check motion' })
  steps.push({
    type: moving ? 'warn' : 'ok',
    lines: moving
      ? [`P = ${fmt(P)} N  >  F_s,max = ${fmt(F_s_max)} N  → SLIDING OCCURS`]
      : [`P = ${fmt(P)} N  ≤  F_s,max = ${fmt(F_s_max)} N  → Block remains STATIONARY`],
  })

  steps.push({ type: 'header', text: 'Step 4 — Friction force' })
  const f = moving ? F_k : P
  steps.push({
    type: 'result',
    lines: moving
      ? [`f = μk × N = ${fmt(mu_k)} × ${fmt(W)} = ${fmt(F_k)} N (kinetic friction)`, `Net force = P − f = ${fmt(P - F_k)} N (→ acceleration exists)`]
      : [`f = P = ${fmt(f)} N (static friction, equals applied force)`],
  })

  return {
    result: {
      N: fmt(N), F_s_max: fmt(F_s_max), F_k: fmt(F_k),
      friction: fmt(f), status: moving ? 'Sliding' : 'Stationary',
    },
    steps, error: null,
  }
}

// ── Friction — Inclined Surface ───────────────────────────────────────────────
// W: weight (N), theta: incline angle (deg), mu_s, mu_k
// P: force applied along slope (positive = up the slope), 0 if not applied
export function solveFrictionInclined({ W, theta, mu_s, mu_k, P = 0 }) {
  const t = d2r(theta)
  const N = W * Math.cos(t)
  const Wslope = W * Math.sin(t)  // component down the slope
  const F_s_max = mu_s * N
  const F_k = mu_k * N
  const phi = (Math.atan(mu_s) * 180) / Math.PI  // angle of friction

  const steps = []

  steps.push({ type: 'header', text: 'Step 1 — Resolve weight along and perpendicular to slope' })
  steps.push({
    type: 'calc',
    label: 'Weight components',
    lines: [
      `N = W cos θ = ${fmt(W)} × cos(${fmt(theta)}°) = ${fmt(N)} N  (normal to slope)`,
      `W∥ = W sin θ = ${fmt(W)} × sin(${fmt(theta)}°) = ${fmt(Wslope)} N  (down the slope)`,
    ],
  })

  steps.push({ type: 'header', text: 'Step 2 — Friction limits' })
  steps.push({
    type: 'calc',
    label: 'Friction forces',
    lines: [
      `F_s,max = μs × N = ${fmt(mu_s)} × ${fmt(N)} = ${fmt(F_s_max)} N`,
      `F_k     = μk × N = ${fmt(mu_k)} × ${fmt(N)} = ${fmt(F_k)} N`,
      `Angle of friction: φ = tan⁻¹(μs) = ${fmt(phi)}°`,
    ],
  })

  // Equilibrium range:
  // P_min (prevent sliding down): W sinθ − μs W cosθ = W(sinθ − μs cosθ)
  // P_max (prevent sliding up):   W sinθ + μs W cosθ = W(sinθ + μs cosθ)
  const P_min = Wslope - F_s_max  // if negative, block won't slide down without force
  const P_max = Wslope + F_s_max

  steps.push({ type: 'header', text: 'Step 3 — Equilibrium range of P (force along slope, ↑ positive)' })
  steps.push({
    type: 'calc',
    label: 'Limits',
    lines: [
      `P_min = W sinθ − μs W cosθ = ${fmt(Wslope)} − ${fmt(F_s_max)} = ${fmt(P_min)} N`,
      P_min < 0 ? `  (negative → block self-supports, no force needed to prevent sliding down)` : '',
      `P_max = W sinθ + μs W cosθ = ${fmt(Wslope)} + ${fmt(F_s_max)} = ${fmt(P_max)} N`,
    ].filter(Boolean),
  })

  // Check applied P
  let status = ''
  let f = 0
  if (P >= P_min && P <= P_max) {
    status = 'Equilibrium'
    f = Wslope - P  // friction balances the net slope force
  } else if (P < P_min) {
    status = 'Slides DOWN'
    f = -F_k  // kinetic friction acts up the slope
  } else {
    status = 'Slides UP'
    f = F_k  // kinetic friction acts down the slope
  }

  steps.push({ type: 'header', text: 'Step 4 — Check for applied P' })
  steps.push({
    type: P >= P_min && P <= P_max ? 'ok' : 'warn',
    lines: [
      `Applied P = ${fmt(P)} N`,
      `Status: ${status}`,
      `Friction force f = ${fmt(f)} N  (+ = up slope, − = down slope)`,
    ],
  })

  return {
    result: {
      N: fmt(N), Wslope: fmt(Wslope), F_s_max: fmt(F_s_max), F_k: fmt(F_k),
      phi: fmt(phi), P_min: fmt(P_min), P_max: fmt(P_max),
      status, friction: fmt(f),
    },
    steps, error: null,
  }
}
