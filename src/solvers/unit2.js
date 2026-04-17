// ── Unit 2 Solvers ──────────────────────────────────────────────────────────

const d2r = (d) => (d * Math.PI) / 180
const fmt = (v, n = 4) => Number(v).toFixed(n)
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// ── Gaussian Elimination ─────────────────────────────────────────────────────
function gaussElim(A, b) {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])

  for (let col = 0; col < n; col++) {
    let maxRow = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row
    }
    ;[M[col], M[maxRow]] = [M[maxRow], M[col]]
    if (Math.abs(M[col][col]) < 1e-12) continue
    for (let row = col + 1; row < n; row++) {
      const f = M[row][col] / M[col][col]
      for (let j = col; j <= n; j++) M[row][j] -= f * M[col][j]
    }
  }

  const x = new Array(n).fill(0)
  for (let row = n - 1; row >= 0; row--) {
    x[row] = M[row][n]
    for (let col = row + 1; col < n; col++) x[row] -= M[row][col] * x[col]
    x[row] /= M[row][row]
  }
  return x
}

// ── Simply-Supported Beam Equilibrium ────────────────────────────────────────
// Supports: pin at A (x=0) gives RAx, RAy; roller at B (x=L) gives RB (vertical)
// pointLoads: [{ P, x, angle? }]  angle default = 270 (downward)
// udls: [{ w, x1, x2 }]  w in N/m, downward
// moments: [{ M, x }]  positive = CCW
export function solveBeamEquilibrium({ L, pointLoads = [], udls = [], uvls = [], moments = [], supports: supportsInput }) {
  const steps = []

  const supports = Array.isArray(supportsInput) && supportsInput.length > 0
    ? supportsInput
    : [
      { id: 'A', x: 0, type: 'pin' },
      { id: 'B', x: L, type: 'rollerY' },
    ]

  // Collect downward point-load equivalents + UDL resultants
  const allV = [] // { P, x } vertical downward
  const allH = [] // { P, x } horizontal (for RAx)

  pointLoads.forEach((pl, i) => {
    const ang = pl.angle ?? 270  // default downward
    const Px = pl.P * Math.cos(d2r(ang))
    const Py = pl.P * Math.sin(d2r(ang)) // negative = downward when ang=270
    allV.push({ P: -Py, x: pl.x, label: `P${i + 1}` })
    if (Math.abs(Px) > 1e-9) allH.push({ P: Px, x: pl.x, label: `P${i + 1}x` })
  })

  udls.forEach((u, i) => {
    const W = u.w * (u.x2 - u.x1)
    const xbar = (u.x1 + u.x2) / 2
    allV.push({ P: W, x: xbar, label: `UDL${i + 1} (${u.w} N/m, ${u.x1}–${u.x2} m)` })
  })

  uvls.forEach((u, i) => {
    const span = u.x2 - u.x1
    const W = 0.5 * (u.w1 + u.w2) * span
    let xbar = u.x1 + span / 2
    if (Math.abs(u.w1 + u.w2) > 1e-12) {
      xbar = u.x1 + (span * (u.w1 + 2 * u.w2)) / (3 * (u.w1 + u.w2))
    }
    allV.push({ P: W, x: xbar, label: `UVL${i + 1} (${u.w1}→${u.w2} N/m, ${u.x1}–${u.x2} m)` })
  })

  steps.push({ type: 'header', text: 'Step 1 — Free-Body Diagram Summary' })
  steps.push({ type: 'note', text: `Beam length L = ${L} m.` })
  supports.forEach((s, i) => {
    steps.push({
      type: 'note',
      text: `Support ${s.id ?? `S${i + 1}`} at x = ${fmt(s.x, 3)} m: ${s.type}`,
    })
  })
  allV.forEach((v) =>
    steps.push({ type: 'note', text: `Load ${v.label}: ${fmt(v.P, 2)} N ↓ at x = ${v.x} m` })
  )

  const unknowns = []
  supports.forEach((s, i) => {
    const sid = s.id ?? `S${i + 1}`
    if (s.type === 'pin') {
      unknowns.push({ name: `R${sid}x`, kind: 'Rx', support: s })
      unknowns.push({ name: `R${sid}y`, kind: 'Ry', support: s })
    } else if (s.type === 'rollerY') {
      unknowns.push({ name: `R${sid}y`, kind: 'Ry', support: s })
    } else if (s.type === 'rollerX') {
      unknowns.push({ name: `R${sid}x`, kind: 'Rx', support: s })
    } else if (s.type === 'fixed') {
      unknowns.push({ name: `R${sid}x`, kind: 'Rx', support: s })
      unknowns.push({ name: `R${sid}y`, kind: 'Ry', support: s })
      unknowns.push({ name: `M${sid}`, kind: 'M', support: s })
    }
  })

  if (unknowns.length > 3) {
    return {
      result: null,
      steps,
      error: `Beam is statically indeterminate by equilibrium only. Unknown reactions = ${unknowns.length}. Use compatibility/stiffness method.`,
    }
  }

  if (unknowns.length < 2) {
    return {
      result: null,
      steps,
      error: `Beam support set is unstable or incomplete. Unknown reactions = ${unknowns.length}.`,
    }
  }

  const extFx = allH.reduce((s, h) => s + h.P, 0)
  const extFyDown = allV.reduce((s, v) => s + v.P, 0)
  const extMoment = moments.reduce((s, m) => s + m.M, 0) - allV.reduce((s, v) => s + v.P * v.x, 0)

  const rows = [
    {
      label: 'ΣFx = 0',
      coeff: (u) => (u.kind === 'Rx' ? 1 : 0),
      rhs: -extFx,
    },
    {
      label: 'ΣFy = 0',
      coeff: (u) => (u.kind === 'Ry' ? 1 : 0),
      rhs: extFyDown,
    },
    {
      label: 'ΣM@x=0 = 0 (CCW +)',
      coeff: (u) => {
        if (u.kind === 'Ry') return u.support.x
        if (u.kind === 'M') return 1
        return 0
      },
      rhs: -extMoment,
    },
  ]

  const chooseRows = () => {
    if (unknowns.length === 3) return rows
    if (unknowns.length === 2) {
      const cands = [
        [rows[0], rows[1]],
        [rows[1], rows[2]],
        [rows[0], rows[2]],
      ]
      for (const pair of cands) {
        const a11 = pair[0].coeff(unknowns[0])
        const a12 = pair[0].coeff(unknowns[1])
        const a21 = pair[1].coeff(unknowns[0])
        const a22 = pair[1].coeff(unknowns[1])
        const det = a11 * a22 - a12 * a21
        if (Math.abs(det) > 1e-10) return pair
      }
      return null
    }
    if (unknowns.length === 1) return [rows[1]]
    return null
  }

  const activeRows = chooseRows()
  if (!activeRows) {
    return {
      result: null,
      steps,
      error: 'Could not form an independent equilibrium set. Check support types/positions.',
    }
  }

  let solution = []
  if (unknowns.length === 3) {
    const A = activeRows.map((r) => unknowns.map((u) => r.coeff(u)))
    const b = activeRows.map((r) => r.rhs)
    solution = gaussElim(A, b)
  } else if (unknowns.length === 2) {
    const a11 = activeRows[0].coeff(unknowns[0])
    const a12 = activeRows[0].coeff(unknowns[1])
    const a21 = activeRows[1].coeff(unknowns[0])
    const a22 = activeRows[1].coeff(unknowns[1])
    const b1 = activeRows[0].rhs
    const b2 = activeRows[1].rhs
    const det = a11 * a22 - a12 * a21
    solution = [
      (b1 * a22 - b2 * a12) / det,
      (a11 * b2 - a21 * b1) / det,
    ]
  } else {
    const c = activeRows[0].coeff(unknowns[0])
    solution = [activeRows[0].rhs / c]
  }

  if (solution.some((v) => !Number.isFinite(v))) {
    return {
      result: null,
      steps,
      error: 'Solver failed due to singular equations. Check support layout and beam stability.',
    }
  }

  const reactions = {}
  unknowns.forEach((u, i) => {
    reactions[u.name] = solution[i]
  })

  const supportReactions = supports.map((s, i) => {
    const sid = s.id ?? `S${i + 1}`
    return {
      id: sid,
      x: s.x,
      type: s.type,
      Rx: reactions[`R${sid}x`] ?? 0,
      Ry: reactions[`R${sid}y`] ?? 0,
      M: reactions[`M${sid}`] ?? 0,
    }
  })

  steps.push({ type: 'header', text: 'Step 2 — Equilibrium Equations Used' })
  activeRows.forEach((r) => {
    const lhs = unknowns.map((u) => {
      const c = r.coeff(u)
      if (Math.abs(c) < 1e-10) return null
      return `${fmt(c, 4)}·${u.name}`
    }).filter(Boolean).join(' + ')
    steps.push({
      type: 'calc',
      label: r.label,
      lines: [`${lhs || '0'} = ${fmt(r.rhs, 4)}`],
    })
  })

  steps.push({ type: 'header', text: 'Results' })
  steps.push({
    type: 'result',
    lines: Object.entries(reactions).map(([k, v]) => `${k} = ${fmt(v, 4)}`),
  })

  const legacy = {
    RAx: reactions.RAx ?? reactions.RAx ?? 0,
    RAy: reactions.RAy ?? reactions.RAy ?? 0,
    RB: reactions.RBy ?? reactions.RB ?? 0,
  }

  return {
    result: {
      ...Object.fromEntries(Object.entries(reactions).map(([k, v]) => [k, fmt(v)])),
      ...Object.fromEntries(Object.entries(legacy).map(([k, v]) => [k, fmt(v)])),
      supportReactions: supportReactions.map((s) => ({
        ...s,
        Rx: fmt(s.Rx),
        Ry: fmt(s.Ry),
        M: fmt(s.M),
      })),
    },
    steps,
    error: null,
  }
}

function equivalentDownwardPointLoads(pointLoads = []) {
  return pointLoads.map((pl) => {
    const ang = pl.angle ?? 270
    const Py = pl.P * Math.sin(d2r(ang))
    return { Pdown: -Py, x: pl.x }
  })
}

function overlapLength(x, x1, x2) {
  const a = Math.min(x1, x2)
  const b = Math.max(x1, x2)
  return clamp(x, a, b) - a
}

function parseSupportReactions(supports = [], reactions = {}) {
  const parsed = []
  supports.forEach((s, i) => {
    const sid = s.id ?? `S${i + 1}`
    const ryKey = `R${sid}y`
    const rxKey = `R${sid}x`
    const mKey = `M${sid}`
    parsed.push({
      id: sid,
      x: s.x,
      type: s.type,
      Rx: parseFloat(reactions[rxKey] ?? 0),
      Ry: parseFloat(reactions[ryKey] ?? 0),
      M: parseFloat(reactions[mKey] ?? 0),
    })
  })
  return parsed
}

export function evaluateShearMomentAtX({
  x,
  pointLoads = [],
  udls = [],
  uvls = [],
  moments = [],
  supports = [],
  reactions = {},
}) {
  const xq = Number(x)
  const ptLoads = equivalentDownwardPointLoads(pointLoads)
  const supportReactions = parseSupportReactions(supports, reactions)

  let V = 0
  let M = 0

  supportReactions.forEach((s) => {
    if (xq >= s.x) {
      V += s.Ry
      M += s.Ry * (xq - s.x)
      M += s.M
    }
  })

  ptLoads.forEach((p) => {
    if (xq >= p.x) {
      V -= p.Pdown
      M -= p.Pdown * (xq - p.x)
    }
  })

  udls.forEach((u) => {
    const a = Math.min(u.x1, u.x2)
    const t = overlapLength(xq, u.x1, u.x2)
    if (t <= 0) return
    const W = u.w * t
    const xc = a + t / 2
    V -= W
    M -= W * (xq - xc)
  })

  uvls.forEach((u) => {
    const a = Math.min(u.x1, u.x2)
    const b = Math.max(u.x1, u.x2)
    const Ls = b - a
    if (Ls <= 0) return
    const t = clamp(xq, a, b) - a
    if (t <= 0) return

    const wStart = u.x1 <= u.x2 ? u.w1 : u.w2
    const wEnd = u.x1 <= u.x2 ? u.w2 : u.w1
    const k = (wEnd - wStart) / Ls
    const W = wStart * t + 0.5 * k * t * t

    let xc = a + t / 2
    if (Math.abs(W) > 1e-12) {
      const q = (wStart * t * t) / 2 + (k * t * t * t) / 3
      xc = a + q / W
    }

    V -= W
    M -= W * (xq - xc)
  })

  moments.forEach((m) => {
    if (xq >= m.x) M += m.M
  })

  return { V, M }
}

export function buildShearBendingDiagram({
  L,
  pointLoads = [],
  udls = [],
  uvls = [],
  moments = [],
  supports = [],
  reactions = {},
  xQuery = 0,
  sampleCount = 240,
}) {
  const critical = [0, L]
  supports.forEach((s) => critical.push(s.x))
  pointLoads.forEach((p) => critical.push(p.x))
  moments.forEach((m) => critical.push(m.x))
  udls.forEach((u) => { critical.push(u.x1, u.x2) })
  uvls.forEach((u) => { critical.push(u.x1, u.x2) })

  const xs = []
  for (let i = 0; i <= sampleCount; i++) xs.push((L * i) / sampleCount)
  const eps = Math.max(1e-5, L * 1e-6)
  critical.forEach((c) => {
    xs.push(c)
    xs.push(c - eps)
    xs.push(c + eps)
  })

  const uniq = [...new Set(xs.map((x) => Number(clamp(x, 0, L).toFixed(6))))].sort((a, b) => a - b)
  const data = uniq.map((x) => {
    const vm = evaluateShearMomentAtX({ x, pointLoads, udls, uvls, moments, supports, reactions })
    return { x, V: vm.V, M: vm.M }
  })

  const q = clamp(Number(xQuery) || 0, 0, L)
  const atQuery = evaluateShearMomentAtX({ x: q, pointLoads, udls, uvls, moments, supports, reactions })

  return {
    data,
    atQuery: { x: q, V: atQuery.V, M: atQuery.M },
    extrema: {
      Vmax: Math.max(...data.map((d) => d.V)),
      Vmin: Math.min(...data.map((d) => d.V)),
      Mmax: Math.max(...data.map((d) => d.M)),
      Mmin: Math.min(...data.map((d) => d.M)),
    },
  }
}

// ── Method of Joints — Truss Solver ─────────────────────────────────────────
// nodes:   [{ id, x, y }]
// members: [{ id, nodeA, nodeB }]  (node ids)
// supports:[{ nodeId, type: 'pin'|'rollerX'|'rollerY' }]
// loads:   [{ nodeId, Fx, Fy }]
//
// Returns member forces (+ = tension, − = compression) and reactions.
export function solveTruss({ nodes, members, supports, loads }) {
  const nNodes = nodes.length
  const nMembers = members.length

  // Build list of unknowns: member forces then reactions
  const unknownNames = []
  members.forEach((m) => unknownNames.push(`F_${m.id}`))
  const reactionMap = {} // nodeId → { Rx?: idx, Ry?: idx }
  supports.forEach((s) => {
    reactionMap[s.nodeId] = {}
    if (s.type === 'pin') {
      reactionMap[s.nodeId].Rx = unknownNames.length
      unknownNames.push(`Rx_${s.nodeId}`)
      reactionMap[s.nodeId].Ry = unknownNames.length
      unknownNames.push(`Ry_${s.nodeId}`)
    } else if (s.type === 'rollerY') {
      reactionMap[s.nodeId].Ry = unknownNames.length
      unknownNames.push(`Ry_${s.nodeId}`)
    } else if (s.type === 'rollerX') {
      reactionMap[s.nodeId].Rx = unknownNames.length
      unknownNames.push(`Rx_${s.nodeId}`)
    }
  })

  const nUnknowns = unknownNames.length
  const nEquations = 2 * nNodes

  if (nUnknowns !== nEquations) {
    return {
      error: `System is ${nUnknowns > nEquations ? 'statically indeterminate' : 'a mechanism'}. Unknowns = ${nUnknowns}, equations = ${nEquations}.`,
      result: null, steps: [],
    }
  }

  // Build coefficient matrix A and RHS b
  const A = Array.from({ length: nEquations }, () => new Array(nUnknowns).fill(0))
  const b = new Array(nEquations).fill(0)

  const nodeById = {}
  nodes.forEach((n) => (nodeById[n.id] = n))

  nodes.forEach((node, ni) => {
    const eqX = 2 * ni      // ΣFx = 0 equation index
    const eqY = 2 * ni + 1  // ΣFy = 0 equation index

    // Member contributions at this node
    members.forEach((m, mi) => {
      let otherNode = null
      if (m.nodeA === node.id) otherNode = nodeById[m.nodeB]
      else if (m.nodeB === node.id) otherNode = nodeById[m.nodeA]
      if (!otherNode) return

      const dx = otherNode.x - node.x
      const dy = otherNode.y - node.y
      const len = Math.sqrt(dx * dx + dy * dy)
      const cosT = dx / len
      const sinT = dy / len

      // Positive F means tension → force on joint points AWAY from joint (toward other node)
      A[eqX][mi] += cosT
      A[eqY][mi] += sinT
    })

    // Reaction contributions
    const rm = reactionMap[node.id]
    if (rm) {
      if (rm.Rx !== undefined) A[eqX][rm.Rx] = 1
      if (rm.Ry !== undefined) A[eqY][rm.Ry] = 1
    }

    // External loads (move to RHS: A·x = −loads)
    const load = loads.find((l) => l.nodeId === node.id)
    if (load) {
      b[eqX] -= load.Fx ?? 0
      b[eqY] -= load.Fy ?? 0
    }
  })

  let x
  try {
    x = gaussElim(A, b)
  } catch {
    return { error: 'Singular system — check geometry and supports.', result: null, steps: [] }
  }

  // Check for NaN
  if (x.some((v) => isNaN(v))) {
    return { error: 'Could not solve — system may be singular or ill-conditioned.', result: null, steps: [] }
  }

  const memberResults = members.map((m, mi) => ({
    id: m.id,
    nodeA: m.nodeA,
    nodeB: m.nodeB,
    force: x[mi],
    type: Math.abs(x[mi]) < 1e-6 ? 'ZFM' : x[mi] > 0 ? 'Tension' : 'Compression',
  }))

  const reactionResults = {}
  supports.forEach((s) => {
    const rm = reactionMap[s.nodeId]
    reactionResults[s.nodeId] = {
      Rx: rm.Rx !== undefined ? x[rm.Rx] : 0,
      Ry: rm.Ry !== undefined ? x[rm.Ry] : 0,
    }
  })

  const steps = [
    { type: 'header', text: 'Method of Joints — System Setup' },
    {
      type: 'note',
      text: `${nNodes} joints · ${nMembers} members · ${nUnknowns - nMembers} reactions → ${nEquations} equations, ${nUnknowns} unknowns → Statically determinate ✓`,
    },
    {
      type: 'note',
      text: 'Sign convention: Positive member force = Tension (member pulls joint). Negative = Compression.',
    },
    { type: 'header', text: 'Support Reactions' },
    ...supports.map((s) => ({
      type: 'calc',
      label: `Node ${s.nodeId} (${s.type})`,
      lines: [
        reactionMap[s.nodeId].Rx !== undefined ? `Rx = ${fmt(reactionResults[s.nodeId].Rx)} N` : '',
        reactionMap[s.nodeId].Ry !== undefined ? `Ry = ${fmt(reactionResults[s.nodeId].Ry)} N` : '',
      ].filter(Boolean),
    })),
    { type: 'header', text: 'Member Forces' },
    ...memberResults.map((m) => ({
      type: 'calc',
      label: `Member ${m.id}  (${m.nodeA}–${m.nodeB})`,
      lines: [`F = ${fmt(m.force)} N  → ${m.type}`],
    })),
  ]

  return { result: { members: memberResults, reactions: reactionResults }, steps, error: null }
}
