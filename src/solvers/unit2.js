// ── Unit 2 Solvers ──────────────────────────────────────────────────────────

const d2r = (d) => (d * Math.PI) / 180
const fmt = (v, n = 4) => Number(v).toFixed(n)

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
export function solveBeamEquilibrium({ L, pointLoads = [], udls = [], moments = [] }) {
  const steps = []

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

  steps.push({ type: 'header', text: 'Step 1 — Free-Body Diagram Summary' })
  steps.push({
    type: 'note',
    text: `Beam length L = ${L} m. Pin at A (x = 0): RAx, RAy. Roller at B (x = ${L} m): RB ↑.`,
  })
  allV.forEach((v) =>
    steps.push({ type: 'note', text: `Load ${v.label}: ${fmt(v.P, 2)} N ↓ at x = ${v.x} m` })
  )

  steps.push({ type: 'header', text: 'Step 2 — ΣMA = 0  (moments about A, CCW +)' })
  let sumMoments = 0
  allV.forEach((v) => { sumMoments += v.P * v.x })
  moments.forEach((m) => { sumMoments += m.M })

  const RB = sumMoments / L
  const RAy = allV.reduce((s, v) => s + v.P, 0) - RB
  const RAx = -allH.reduce((s, h) => s + h.P, 0)

  steps.push({
    type: 'calc',
    label: 'Moment equation',
    lines: [
      `RB × ${L} = ${allV.map((v) => `${fmt(v.P, 2)} × ${v.x}`).join(' + ')}${moments.length ? ' + ' + moments.map((m) => fmt(m.M)).join(' + ') : ''}`,
      `RB = ${fmt(sumMoments, 4)} / ${L} = ${fmt(RB, 4)} N`,
    ],
  })

  steps.push({ type: 'header', text: 'Step 3 — ΣFy = 0' })
  steps.push({
    type: 'calc',
    label: 'Vertical equilibrium',
    lines: [
      `RAy + RB = ${fmt(allV.reduce((s, v) => s + v.P, 0), 4)} N`,
      `RAy = ${fmt(RAy, 4)} N`,
    ],
  })

  steps.push({ type: 'header', text: 'Step 4 — ΣFx = 0' })
  steps.push({
    type: 'calc',
    label: 'Horizontal equilibrium',
    lines: [`RAx = ${fmt(RAx, 4)} N`],
  })

  steps.push({ type: 'header', text: 'Results' })
  steps.push({
    type: 'result',
    lines: [
      `RAx = ${fmt(RAx, 4)} N`,
      `RAy = ${fmt(RAy, 4)} N  (${RAy >= 0 ? '↑' : '↓'})`,
      `RB  = ${fmt(RB, 4)} N  (${RB >= 0 ? '↑' : '↓'})`,
    ],
  })

  return {
    result: { RAx: fmt(RAx), RAy: fmt(RAy), RB: fmt(RB) },
    steps,
    error: null,
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
