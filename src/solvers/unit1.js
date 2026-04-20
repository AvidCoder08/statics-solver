// ── Unit 1 Solvers ──────────────────────────────────────────────────────────
// All angles in degrees (converted internally)

const r2d = (r) => (r * 180) / Math.PI
const d2r = (d) => (d * Math.PI) / 180
const fmt = (v, n = 2) => Number(v).toFixed(n)

// ── Force Resultant ──────────────────────────────────────────────────────────
export function solveForceResultant(forces) {
  // forces: [{ F: number, angle: number (deg from +x, CCW) }]
  const steps = []
  let Rx = 0, Ry = 0

  steps.push({ type: 'header', text: 'Step 1 — Resolve each force into x and y components' })
  forces.forEach((f, i) => {
    const a = d2r(f.angle)
    const fx = f.F * Math.cos(a)
    const fy = f.F * Math.sin(a)
    Rx += fx
    Ry += fy
    steps.push({
      type: 'calc',
      label: `F${i + 1} = ${fmt(f.F, 2)} N  @ ${fmt(f.angle, 1)}°`,
      lines: [
        `F${i + 1}x = ${fmt(f.F, 2)} × cos(${fmt(f.angle, 1)}°) = ${fmt(fx)} N`,
        `F${i + 1}y = ${fmt(f.F, 2)} × sin(${fmt(f.angle, 1)}°) = ${fmt(fy)} N`,
      ],
    })
  })

  steps.push({ type: 'header', text: 'Step 2 — Sum all components' })
  steps.push({
    type: 'calc',
    label: 'Summation',
    lines: [
      `Rx = ΣFx = ${fmt(Rx)} N`,
      `Ry = ΣFy = ${fmt(Ry)} N`,
    ],
  })

  const R = Math.sqrt(Rx * Rx + Ry * Ry)
  let theta = r2d(Math.atan2(Ry, Rx))

  steps.push({ type: 'header', text: 'Step 3 — Resultant magnitude and direction' })
  steps.push({
    type: 'calc',
    label: 'Resultant',
    lines: [
      `R = √(Rx² + Ry²) = √(${fmt(Rx)}² + ${fmt(Ry)}²)`,
      `R = ${fmt(R)} N`,
      `θ = tan⁻¹(Ry / Rx) = tan⁻¹(${fmt(Ry)} / ${fmt(Rx)}) = ${fmt(theta)}°`,
      `(measured from +x axis, CCW positive)`,
    ],
  })

  return {
    result: {
      Rx: fmt(Rx),
      Ry: fmt(Ry),
      R: fmt(R),
      theta: fmt(theta),
    },
    steps,
    error: null,
  }
}

// ── Moment of a Force About a Point ─────────────────────────────────────────
export function solveMoment(entries) {
  // entries: [{ F, angle?, Fx?, Fy?, rx, ry }]
  // moment about origin; positive = CCW
  const steps = []
  let M = 0

  steps.push({ type: 'header', text: 'Step 1 — Resolve forces and compute individual moments' })
  steps.push({
    type: 'note',
    text: 'M = Σ (rx·Fy − ry·Fx)    [positive = CCW ↺]',
  })

  entries.forEach((e, i) => {
    let Fx, Fy
    if (e.angle !== undefined && e.F !== undefined) {
      Fx = e.F * Math.cos(d2r(e.angle))
      Fy = e.F * Math.sin(d2r(e.angle))
    } else {
      Fx = e.Fx ?? 0
      Fy = e.Fy ?? 0
    }
    const m = e.rx * Fy - e.ry * Fx
    M += m
    steps.push({
      type: 'calc',
      label: `Force ${i + 1}   (rx = ${fmt(e.rx, 2)}, ry = ${fmt(e.ry, 2)})`,
      lines: [
        `Fx = ${fmt(Fx)} N`,
        `Fy = ${fmt(Fy)} N`,
        `M${i + 1} = (${fmt(e.rx)}) × (${fmt(Fy)}) − (${fmt(e.ry)}) × (${fmt(Fx)})`,
        `M${i + 1} = ${fmt(m)} N·m`,
      ],
    })
  })

  steps.push({ type: 'header', text: 'Step 2 — Total moment' })
  steps.push({
    type: 'result',
    lines: [
      `M_total = ${fmt(M)} N·m  ${M >= 0 ? '↺ CCW' : '↻ CW'}`,
    ],
  })

  return {
    result: { M: fmt(M), direction: M >= 0 ? 'CCW ↺' : 'CW ↻' },
    steps,
    error: null,
  }
}

// ── Couple ───────────────────────────────────────────────────────────────────
export function solveCouple(F, d) {
  const C = F * d
  const steps = [
    { type: 'header', text: 'Couple — Two equal, opposite, parallel forces' },
    { type: 'note', text: 'C = F × d' },
    {
      type: 'calc',
      label: 'Calculation',
      lines: [
        `C = ${fmt(F)} × ${fmt(d)}`,
        `C = ${fmt(C)} N·m`,
      ],
    },
    {
      type: 'note',
      text: 'A couple is a free vector — it produces the same moment about every point in its plane.',
    },
  ]
  return {
    result: { C: fmt(C) },
    steps,
    error: null,
  }
}

// ── 2D Resultant (multiple forces + moments) ─────────────────────────────────
// Also computes resultant's line of action (d = M_O / R)
export function solveResultant2D(forces, moments = []) {
  const steps = []
  let Rx = 0, Ry = 0, Mo = 0

  steps.push({ type: 'header', text: 'Step 1 — Resolve all forces' })
  forces.forEach((f, i) => {
    const a = d2r(f.angle)
    const fx = f.F * Math.cos(a)
    const fy = f.F * Math.sin(a)
    Rx += fx
    Ry += fy
    const m = f.rx * fy - f.ry * fx
    Mo += m
    steps.push({
      type: 'calc',
      label: `F${i + 1} = ${fmt(f.F)} N @ ${fmt(f.angle)}°`,
      lines: [
        `Fx = ${fmt(fx)} N,  Fy = ${fmt(fy)} N`,
        `M_O (from F${i + 1}) = ${fmt(f.rx)} × ${fmt(fy)} − ${fmt(f.ry)} × ${fmt(fx)} = ${fmt(m)} N·m`,
      ],
    })
  })

  if (moments.length > 0) {
    steps.push({ type: 'header', text: 'Step 2 — Add applied couples/moments' })
    moments.forEach((m, i) => {
      Mo += m.M
      steps.push({ type: 'calc', label: `Applied moment M${i + 1}`, lines: [`M${i + 1} = ${fmt(m.M)} N·m`] })
    })
  }

  const R = Math.sqrt(Rx * Rx + Ry * Ry)
  const theta = r2d(Math.atan2(Ry, Rx))

  steps.push({ type: 'header', text: `Step ${moments.length > 0 ? 3 : 2} — Resultant` })
  steps.push({
    type: 'calc',
    label: 'Final resultant',
    lines: [
      `Rx = ${fmt(Rx)} N`,
      `Ry = ${fmt(Ry)} N`,
      `R  = ${fmt(R)} N`,
      `θ  = ${fmt(theta)}° from +x axis`,
      `M_O = ${fmt(Mo)} N·m  (moment of resultant about origin)`,
      R > 1e-10 ? `Line of action: d = M_O / R = ${fmt(Mo / R)} m from origin (⊥ to R)` : '(Force couple system — no single resultant line)',
    ],
  })

  return {
    result: { Rx: fmt(Rx), Ry: fmt(Ry), R: fmt(R), theta: fmt(theta), Mo: fmt(Mo) },
    steps,
    error: null,
  }
}
