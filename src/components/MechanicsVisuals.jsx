import { useMemo, useState } from 'react'
import { Box, Paper, Typography, Chip } from '@mui/material'

const N = (v, fallback = 0) => {
  const parsed = parseFloat(v)
  return Number.isFinite(parsed) ? parsed : fallback
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const palette = ['#0054C8', '#8C1D18', '#006E2C', '#7D3B00', '#6A1B9A', '#1565C0']

function Panel({ title, subtitle, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2.5, bgcolor: '#F9FBFF', borderColor: '#D7E3FF' }}>
      <Typography variant="subtitle2" sx={{ color: '#003E9C', fontWeight: 700 }}>{title}</Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: '#535F70', display: 'block', mb: 1.25 }}>
          {subtitle}
        </Typography>
      )}
      {children}
    </Paper>
  )
}

function useSvgPointer() {
  const toSvgCoords = (evt) => {
    const svg = evt.currentTarget.closest('svg')
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    }
  }
  return { toSvgCoords }
}

export function ForceSystemVisualizer({
  forces,
  onChange,
  showPosition = false,
  title = 'Interactive Force Plane',
}) {
  const width = 560
  const height = 300
  const pad = 30
  const { toSvgCoords } = useSvgPointer()
  const [dragState, setDragState] = useState(null)

  const forceVectors = useMemo(() => {
    return forces.map((f, i) => {
      const F = N(f.F)
      const ang = (N(f.angle) * Math.PI) / 180
      const rx = showPosition ? N(f.rx) : 0
      const ry = showPosition ? N(f.ry) : 0
      const dx = F * Math.cos(ang)
      const dy = F * Math.sin(ang)
      return {
        i,
        rx,
        ry,
        dx,
        dy,
        ex: rx + dx,
        ey: ry + dy,
      }
    })
  }, [forces, showPosition])

  const maxAbs = useMemo(() => {
    const values = [1]
    forceVectors.forEach((v) => {
      values.push(Math.abs(v.rx), Math.abs(v.ry), Math.abs(v.ex), Math.abs(v.ey))
    })
    return Math.max(...values)
  }, [forceVectors])

  const halfW = width / 2
  const halfH = height / 2
  const plotRadius = Math.min(halfW, halfH) - pad
  const scale = plotRadius / (maxAbs * 1.2)

  const toScreen = (x, y) => ({ x: halfW + x * scale, y: halfH - y * scale })
  const fromScreen = (x, y) => ({ x: (x - halfW) / scale, y: (halfH - y) / scale })

  const updateForce = (index, patch) => {
    const next = forces.map((f, i) => (i === index ? { ...f, ...patch } : f))
    onChange(next)
  }

  const onPointerMove = (evt) => {
    if (!dragState) return
    const p = toSvgCoords(evt)
    const w = fromScreen(p.x, p.y)

    if (dragState.kind === 'base' && showPosition) {
      updateForce(dragState.index, {
        rx: w.x.toFixed(2),
        ry: w.y.toFixed(2),
      })
      return
    }

    if (dragState.kind === 'tip') {
      const base = showPosition ? { x: N(forces[dragState.index].rx), y: N(forces[dragState.index].ry) } : { x: 0, y: 0 }
      const dx = w.x - base.x
      const dy = w.y - base.y
      const mag = Math.sqrt(dx * dx + dy * dy)
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI
      if (angle < 0) angle += 360
      updateForce(dragState.index, {
        F: mag.toFixed(2),
        angle: angle.toFixed(2),
      })
    }
  }

  const onPointerUp = () => setDragState(null)

  return (
    <Panel
      title={title}
      subtitle={showPosition ? 'Drag each base point to move location and drag arrow tips to change F and angle.' : 'Drag arrow tips to change magnitude and angle in real-time.'}
    >
      <Box sx={{ overflowX: 'auto' }}>
        <svg
          width={width}
          height={height}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{ touchAction: 'none', maxWidth: '100%', borderRadius: 12, background: 'linear-gradient(180deg,#FFFFFF,#F3F7FF)' }}
        >
          <defs>
            <marker id="arrowHead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 z" fill="#334155" />
            </marker>
          </defs>

          <line x1={pad} y1={halfH} x2={width - pad} y2={halfH} stroke="#CBD5E1" strokeWidth="1.5" />
          <line x1={halfW} y1={pad} x2={halfW} y2={height - pad} stroke="#CBD5E1" strokeWidth="1.5" />

          {forceVectors.map((v, idx) => {
            const c = palette[idx % palette.length]
            const b = toScreen(v.rx, v.ry)
            const e = toScreen(v.ex, v.ey)

            return (
              <g key={`${idx}-${v.rx}-${v.ry}-${v.ex}-${v.ey}`}>
                <line x1={b.x} y1={b.y} x2={e.x} y2={e.y} stroke={c} strokeWidth="2.5" markerEnd="url(#arrowHead)" />
                {showPosition && (
                  <circle
                    cx={b.x}
                    cy={b.y}
                    r="7"
                    fill="#ffffff"
                    stroke={c}
                    strokeWidth="2"
                    onPointerDown={() => setDragState({ kind: 'base', index: idx })}
                    style={{ cursor: 'grab' }}
                  />
                )}
                <circle
                  cx={e.x}
                  cy={e.y}
                  r="7"
                  fill={c}
                  onPointerDown={() => setDragState({ kind: 'tip', index: idx })}
                  style={{ cursor: 'grab' }}
                />
              </g>
            )
          })}
        </svg>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
        {forces.map((f, i) => (
          <Chip
            key={i}
            size="small"
            label={`F${i + 1}: ${N(f.F).toFixed(1)} N @ ${N(f.angle).toFixed(1)}deg`}
            sx={{ bgcolor: '#EAF2FF', color: '#003E9C', fontWeight: 600 }}
          />
        ))}
      </Box>
    </Panel>
  )
}

export function CoupleVisualizer({ F, d }) {
  const force = Math.max(0, N(F))
  const dist = Math.max(0, N(d))
  const moment = force * dist

  return (
    <Panel title="Couple Visualization" subtitle="The opposite arrows form a pure couple. Changing F or d updates C = F x d.">
      <Box sx={{ overflowX: 'auto' }}>
        <svg width="560" height="220" style={{ maxWidth: '100%', borderRadius: 12, background: 'linear-gradient(180deg,#FFFFFF,#F8FAFF)' }}>
          <defs>
            <marker id="cpArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 z" fill="#1E293B" />
            </marker>
          </defs>
          <line x1="120" y1="160" x2="440" y2="160" stroke="#CBD5E1" strokeWidth="4" />
          <line x1="190" y1="150" x2="190" y2="70" stroke="#0054C8" strokeWidth="3" markerEnd="url(#cpArrow)" />
          <line x1="370" y1="70" x2="370" y2="150" stroke="#8C1D18" strokeWidth="3" markerEnd="url(#cpArrow)" />
          <line x1="190" y1="185" x2="370" y2="185" stroke="#64748B" strokeDasharray="5 4" />
          <text x="276" y="202" fill="#475569" fontSize="12">d = {dist.toFixed(3)} m</text>
          <path d="M210,55 A85,85 0 0,1 350,55" fill="none" stroke="#0F766E" strokeWidth="2.5" markerEnd="url(#cpArrow)" />
          <text x="245" y="44" fill="#0F766E" fontSize="13" fontWeight="600">C = {moment.toFixed(3)} N.m</text>
          <text x="134" y="66" fill="#0054C8" fontSize="12">F = {force.toFixed(2)} N</text>
          <text x="348" y="66" fill="#8C1D18" fontSize="12">F = {force.toFixed(2)} N</text>
        </svg>
      </Box>
    </Panel>
  )
}

export function BeamLoadVisualizer({ L, pointLoads, onPointLoadsChange, udls = [], moments = [], onMomentsChange }) {
  const beamL = Math.max(0.1, N(L, 1))
  const width = 620
  const height = 250
  const x0 = 40
  const x1 = width - 40
  const yBeam = 140
  const mapX = (x) => x0 + (clamp(x, 0, beamL) / beamL) * (x1 - x0)
  const fromX = (sx) => ((sx - x0) / (x1 - x0)) * beamL

  const [drag, setDrag] = useState(null)
  const { toSvgCoords } = useSvgPointer()

  const updatePoint = (index, patch) => {
    if (!onPointLoadsChange) return
    const next = pointLoads.map((p, i) => (i === index ? { ...p, ...patch } : p))
    onPointLoadsChange(next)
  }

  const updateMoment = (index, patch) => {
    if (!onMomentsChange) return
    const next = moments.map((m, i) => (i === index ? { ...m, ...patch } : m))
    onMomentsChange(next)
  }

  const onMove = (evt) => {
    if (!drag) return
    const p = toSvgCoords(evt)
    if (drag.kind === 'point') {
      const x = clamp(fromX(p.x), 0, beamL)
      const dist = clamp(Math.abs(yBeam - p.y), 6, 90)
      const magnitude = (dist * 200).toFixed(2)
      const down = p.y < yBeam
      updatePoint(drag.index, {
        x: x.toFixed(2),
        P: magnitude,
        angle: down ? '270' : '90',
      })
    }
    if (drag.kind === 'moment') {
      const x = clamp(fromX(p.x), 0, beamL)
      updateMoment(drag.index, { x: x.toFixed(2) })
    }
  }

  return (
    <Panel title="Beam Diagram" subtitle="Drag load arrow tips to move loads and change magnitude. Drag moment bubbles to shift applied moment location.">
      <Box sx={{ overflowX: 'auto' }}>
        <svg
          width={width}
          height={height}
          onPointerMove={onMove}
          onPointerUp={() => setDrag(null)}
          onPointerLeave={() => setDrag(null)}
          style={{ touchAction: 'none', maxWidth: '100%', borderRadius: 12, background: 'linear-gradient(180deg,#FFFFFF,#F8FAFF)' }}
        >
          <defs>
            <marker id="beamArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 z" fill="#1E293B" />
            </marker>
          </defs>

          <line x1={x0} y1={yBeam} x2={x1} y2={yBeam} stroke="#334155" strokeWidth="5" strokeLinecap="round" />
          <text x={x0} y={yBeam + 24} fill="#64748B" fontSize="12">A (pin)</text>
          <text x={x1 - 44} y={yBeam + 24} fill="#64748B" fontSize="12">B (roller)</text>

          <line x1={x0} y1={yBeam + 16} x2={x1} y2={yBeam + 16} stroke="#CBD5E1" strokeDasharray="4 4" />
          <text x={(x0 + x1) / 2 - 22} y={yBeam + 32} fill="#64748B" fontSize="12">L = {beamL.toFixed(2)} m</text>

          {udls.map((u, i) => {
            const sx1 = mapX(N(u.x1))
            const sx2 = mapX(N(u.x2))
            return (
              <g key={`udl-${i}`}>
                <rect x={Math.min(sx1, sx2)} y={76} width={Math.abs(sx2 - sx1)} height={22} fill="#DBEAFE" stroke="#60A5FA" />
                <text x={Math.min(sx1, sx2) + 4} y={90} fill="#1D4ED8" fontSize="11">w={N(u.w).toFixed(1)} N/m</text>
              </g>
            )
          })}

          {pointLoads.map((pl, i) => {
            const sx = mapX(N(pl.x))
            const Py = N(pl.P) * Math.sin((N(pl.angle, 270) * Math.PI) / 180)
            const len = clamp(Math.abs(Py) / 200, 16, 86)
            const down = Py <= 0
            const yStart = down ? yBeam - len : yBeam + len
            const c = palette[i % palette.length]
            return (
              <g key={`pl-${i}`}>
                <line x1={sx} y1={yStart} x2={sx} y2={yBeam} stroke={c} strokeWidth="2.5" markerEnd="url(#beamArrow)" />
                <circle
                  cx={sx}
                  cy={yStart}
                  r="6"
                  fill={c}
                  onPointerDown={() => setDrag({ kind: 'point', index: i })}
                  style={{ cursor: 'grab' }}
                />
                <text x={sx + 7} y={down ? yStart - 4 : yStart + 14} fill={c} fontSize="11">P{i + 1}: {N(pl.P).toFixed(1)} N</text>
              </g>
            )
          })}

          {moments.map((m, i) => {
            const sx = mapX(N(m.x))
            const val = N(m.M)
            const ccw = val >= 0
            const c = ccw ? '#0F766E' : '#8C1D18'
            const path = ccw
              ? `M ${sx - 16} ${yBeam - 46} A 18 18 0 1 1 ${sx + 16} ${yBeam - 46}`
              : `M ${sx + 16} ${yBeam - 46} A 18 18 0 1 0 ${sx - 16} ${yBeam - 46}`
            return (
              <g key={`m-${i}`}>
                <path d={path} fill="none" stroke={c} strokeWidth="2.5" markerEnd="url(#beamArrow)" />
                <circle
                  cx={sx}
                  cy={yBeam - 46}
                  r="6"
                  fill={c}
                  onPointerDown={() => setDrag({ kind: 'moment', index: i })}
                  style={{ cursor: 'grab' }}
                />
                <text x={sx + 8} y={yBeam - 50} fill={c} fontSize="11">M{i + 1}: {val.toFixed(1)} N.m</text>
              </g>
            )
          })}
        </svg>
      </Box>
    </Panel>
  )
}

export function TrussVisualizer({ nodes, onNodesChange, members, loads, onLoadsChange }) {
  const width = 620
  const height = 320
  const pad = 40
  const { toSvgCoords } = useSvgPointer()
  const [drag, setDrag] = useState(null)

  const nodeMap = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes])

  const ext = useMemo(() => {
    const xs = nodes.map((n) => N(n.x))
    const ys = nodes.map((n) => N(n.y))
    const minX = Math.min(...xs, 0)
    const maxX = Math.max(...xs, 1)
    const minY = Math.min(...ys, 0)
    const maxY = Math.max(...ys, 1)
    return {
      minX: minX - 0.6,
      maxX: maxX + 0.6,
      minY: minY - 0.6,
      maxY: maxY + 0.6,
    }
  }, [nodes])

  const map = (x, y) => {
    const sx = pad + ((x - ext.minX) / (ext.maxX - ext.minX || 1)) * (width - 2 * pad)
    const sy = height - pad - ((y - ext.minY) / (ext.maxY - ext.minY || 1)) * (height - 2 * pad)
    return { x: sx, y: sy }
  }

  const unmap = (sx, sy) => {
    const x = ext.minX + ((sx - pad) / (width - 2 * pad || 1)) * (ext.maxX - ext.minX)
    const y = ext.minY + ((height - pad - sy) / (height - 2 * pad || 1)) * (ext.maxY - ext.minY)
    return { x, y }
  }

  const updateNode = (index, patch) => {
    if (!onNodesChange) return
    const next = nodes.map((n, i) => (i === index ? { ...n, ...patch } : n))
    onNodesChange(next)
  }

  const updateLoad = (index, patch) => {
    if (!onLoadsChange) return
    const next = loads.map((l, i) => (i === index ? { ...l, ...patch } : l))
    onLoadsChange(next)
  }

  const onMove = (evt) => {
    if (!drag) return
    const p = toSvgCoords(evt)
    if (drag.kind === 'node') {
      const world = unmap(p.x, p.y)
      updateNode(drag.index, { x: world.x.toFixed(2), y: world.y.toFixed(2) })
      return
    }
    if (drag.kind === 'load') {
      const load = loads[drag.index]
      const node = nodeMap[load.nodeId]
      if (!node) return
      const ns = map(N(node.x), N(node.y))
      const fx = ((p.x - ns.x) / 40).toFixed(2)
      const fy = ((ns.y - p.y) / 40).toFixed(2)
      updateLoad(drag.index, {
        Fx: fx,
        Fy: fy,
      })
    }
  }

  return (
    <Panel title="Truss Workspace" subtitle="Drag nodes to change geometry. Drag load tips to adjust Fx and Fy at joints.">
      <Box sx={{ overflowX: 'auto' }}>
        <svg
          width={width}
          height={height}
          onPointerMove={onMove}
          onPointerUp={() => setDrag(null)}
          onPointerLeave={() => setDrag(null)}
          style={{ touchAction: 'none', maxWidth: '100%', borderRadius: 12, background: 'linear-gradient(180deg,#FFFFFF,#F6FBFF)' }}
        >
          <defs>
            <marker id="trussArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 z" fill="#8C1D18" />
            </marker>
          </defs>

          {members.map((m) => {
            const a = nodeMap[m.nodeA]
            const b = nodeMap[m.nodeB]
            if (!a || !b) return null
            const sa = map(N(a.x), N(a.y))
            const sb = map(N(b.x), N(b.y))
            return <line key={m.id} x1={sa.x} y1={sa.y} x2={sb.x} y2={sb.y} stroke="#334155" strokeWidth="3" />
          })}

          {nodes.map((n, i) => {
            const s = map(N(n.x), N(n.y))
            return (
              <g key={`n-${n.id}-${i}`}>
                <circle
                  cx={s.x}
                  cy={s.y}
                  r="8"
                  fill="#0054C8"
                  onPointerDown={() => setDrag({ kind: 'node', index: i })}
                  style={{ cursor: 'grab' }}
                />
                <text x={s.x + 10} y={s.y - 10} fill="#0F172A" fontSize="12" fontWeight="600">{n.id}</text>
              </g>
            )
          })}

          {loads.map((l, i) => {
            const n = nodeMap[l.nodeId]
            if (!n) return null
            const ns = map(N(n.x), N(n.y))
            const tx = ns.x + N(l.Fx) * 40
            const ty = ns.y - N(l.Fy) * 40
            return (
              <g key={`ld-${i}`}>
                <line x1={ns.x} y1={ns.y} x2={tx} y2={ty} stroke="#8C1D18" strokeWidth="2.5" markerEnd="url(#trussArrow)" />
                <circle
                  cx={tx}
                  cy={ty}
                  r="6"
                  fill="#8C1D18"
                  onPointerDown={() => setDrag({ kind: 'load', index: i })}
                  style={{ cursor: 'grab' }}
                />
              </g>
            )
          })}
        </svg>
      </Box>
    </Panel>
  )
}

function shapeBounds(sh) {
  const x0 = N(sh.x0)
  const y0 = N(sh.y0)
  const b = N(sh.dims?.b)
  const h = N(sh.dims?.h)
  const r = N(sh.dims?.r)

  if (sh.type === 'rectangle') return { minX: x0, maxX: x0 + b, minY: y0, maxY: y0 + h }
  if (sh.type === 'triangle_right' || sh.type === 'triangle') return { minX: x0, maxX: x0 + b, minY: y0, maxY: y0 + h }
  if (sh.type === 'circle') return { minX: x0 - r, maxX: x0 + r, minY: y0 - r, maxY: y0 + r }
  if (sh.type === 'semicircle') return { minX: x0 - r, maxX: x0 + r, minY: y0, maxY: y0 + r }
  if (sh.type === 'quarter_circle') return { minX: x0, maxX: x0 + r, minY: y0, maxY: y0 + r }
  return { minX: x0, maxX: x0 + 1, minY: y0, maxY: y0 + 1 }
}

function shapeCenter(sh) {
  const b = shapeBounds(sh)
  return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 }
}

export function CompositeAreaVisualizer({ shapes, onShapesChange, title = 'Composite Shape View' }) {
  const width = 620
  const height = 320
  const pad = 35
  const [drag, setDrag] = useState(null)
  const { toSvgCoords } = useSvgPointer()

  const bounds = useMemo(() => {
    const all = shapes.map(shapeBounds)
    const minX = Math.min(...all.map((b) => b.minX), 0)
    const maxX = Math.max(...all.map((b) => b.maxX), 1)
    const minY = Math.min(...all.map((b) => b.minY), 0)
    const maxY = Math.max(...all.map((b) => b.maxY), 1)
    return { minX: minX - 0.2, maxX: maxX + 0.2, minY: minY - 0.2, maxY: maxY + 0.2 }
  }, [shapes])

  const map = (x, y) => {
    const sx = pad + ((x - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * (width - 2 * pad)
    const sy = height - pad - ((y - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * (height - 2 * pad)
    return { x: sx, y: sy }
  }

  const unmap = (sx, sy) => {
    const x = bounds.minX + ((sx - pad) / (width - 2 * pad || 1)) * (bounds.maxX - bounds.minX)
    const y = bounds.minY + ((height - pad - sy) / (height - 2 * pad || 1)) * (bounds.maxY - bounds.minY)
    return { x, y }
  }

  const updateShape = (index, patch) => {
    if (!onShapesChange) return
    const next = shapes.map((s, i) => (i === index ? { ...s, ...patch } : s))
    onShapesChange(next)
  }

  const onMove = (evt) => {
    if (!drag) return
    const p = toSvgCoords(evt)
    const world = unmap(p.x, p.y)
    const sh = shapes[drag.index]
    if (!sh) return

    if (sh.type === 'circle') {
      updateShape(drag.index, { x0: world.x.toFixed(3), y0: world.y.toFixed(3) })
      return
    }

    if (sh.type === 'semicircle') {
      updateShape(drag.index, { x0: world.x.toFixed(3), y0: world.y.toFixed(3) })
      return
    }

    if (sh.type === 'rectangle' || sh.type === 'triangle_right' || sh.type === 'triangle' || sh.type === 'quarter_circle') {
      updateShape(drag.index, { x0: world.x.toFixed(3), y0: world.y.toFixed(3) })
    }
  }

  const drawShape = (sh, i) => {
    const c = sh.hole ? '#FCA5A5' : '#93C5FD'
    const stroke = sh.hole ? '#8C1D18' : '#1D4ED8'
    const x0 = N(sh.x0)
    const y0 = N(sh.y0)
    const b = N(sh.dims?.b)
    const h = N(sh.dims?.h)
    const r = N(sh.dims?.r)

    if (sh.type === 'rectangle') {
      const p1 = map(x0, y0 + h)
      const p2 = map(x0 + b, y0)
      return <rect key={i} x={p1.x} y={p1.y} width={Math.max(2, p2.x - p1.x)} height={Math.max(2, p2.y - p1.y)} fill={c} stroke={stroke} strokeWidth="2" fillOpacity="0.55" />
    }

    if (sh.type === 'triangle_right' || sh.type === 'triangle') {
      const a = map(x0, y0)
      const bpt = map(x0 + b, y0)
      const cpt = map(x0, y0 + h)
      return <polygon key={i} points={`${a.x},${a.y} ${bpt.x},${bpt.y} ${cpt.x},${cpt.y}`} fill={c} stroke={stroke} strokeWidth="2" fillOpacity="0.55" />
    }

    if (sh.type === 'circle') {
      const ctr = map(x0, y0)
      const edge = map(x0 + r, y0)
      return <circle key={i} cx={ctr.x} cy={ctr.y} r={Math.max(2, Math.abs(edge.x - ctr.x))} fill={c} stroke={stroke} strokeWidth="2" fillOpacity="0.55" />
    }

    if (sh.type === 'semicircle') {
      const left = map(x0 - r, y0)
      const right = map(x0 + r, y0)
      const top = map(x0, y0 + r)
      const d = `M ${left.x} ${left.y} A ${Math.abs(right.x - top.x)} ${Math.abs(left.y - top.y)} 0 0 1 ${right.x} ${right.y} Z`
      return <path key={i} d={d} fill={c} stroke={stroke} strokeWidth="2" fillOpacity="0.55" />
    }

    if (sh.type === 'quarter_circle') {
      const o = map(x0, y0)
      const e1 = map(x0 + r, y0)
      const e2 = map(x0, y0 + r)
      const d = `M ${o.x} ${o.y} L ${e1.x} ${e1.y} A ${Math.abs(e1.x - o.x)} ${Math.abs(o.y - e2.y)} 0 0 1 ${e2.x} ${e2.y} Z`
      return <path key={i} d={d} fill={c} stroke={stroke} strokeWidth="2" fillOpacity="0.55" />
    }

    return null
  }

  return (
    <Panel title={title} subtitle="Drag the numbered handles to move each part in the global x-y reference frame.">
      <Box sx={{ overflowX: 'auto' }}>
        <svg
          width={width}
          height={height}
          onPointerMove={onMove}
          onPointerUp={() => setDrag(null)}
          onPointerLeave={() => setDrag(null)}
          style={{ touchAction: 'none', maxWidth: '100%', borderRadius: 12, background: 'linear-gradient(180deg,#FFFFFF,#F8FBFF)' }}
        >
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#CBD5E1" strokeWidth="1.5" />
          <line x1={pad} y1={height - pad} x2={pad} y2={pad} stroke="#CBD5E1" strokeWidth="1.5" />

          {shapes.map((s, i) => drawShape(s, i))}

          {shapes.map((s, i) => {
            const ctr = shapeCenter(s)
            const p = map(ctr.x, ctr.y)
            return (
              <g key={`h-${i}`}>
                <circle cx={p.x} cy={p.y} r="11" fill="#0F172A" onPointerDown={() => setDrag({ index: i })} style={{ cursor: 'grab' }} />
                <text x={p.x - 4} y={p.y + 4} fill="#FFFFFF" fontSize="10" fontWeight="700">{i + 1}</text>
              </g>
            )
          })}
        </svg>
      </Box>
    </Panel>
  )
}

export function FrictionVisualizer({ W, mu_s, mu_k, P, theta, onPChange, onThetaChange, inclined = false }) {
  const weight = Math.max(0, N(W))
  const p = N(P)
  const muS = Math.max(0, N(mu_s))
  const muK = Math.max(0, N(mu_k))
  const th = inclined ? clamp(N(theta), 0, 70) : 0

  const width = 560
  const height = 260
  const x0 = 130
  const y0 = 170
  const slopeLen = 260
  const t = (th * Math.PI) / 180
  const x1 = x0 + slopeLen * Math.cos(t)
  const y1 = y0 - slopeLen * Math.sin(t)

  const [dragging, setDragging] = useState(false)

  const onPointerMove = (evt) => {
    if (!dragging || !onPChange) return
    const svg = evt.currentTarget
    const rect = svg.getBoundingClientRect()
    const sx = evt.clientX - rect.left
    const sy = evt.clientY - rect.top
    const baseX = inclined ? x0 + 100 * Math.cos(t) : 250
    const baseY = inclined ? y0 - 100 * Math.sin(t) : 145

    if (!inclined) {
      const nextP = clamp((sx - baseX) * 6, -6000, 6000)
      onPChange(nextP.toFixed(2))
      return
    }

    const tx = Math.cos(t)
    const ty = -Math.sin(t)
    const proj = (sx - baseX) * tx + (sy - baseY) * ty
    onPChange(clamp(proj * 12, -6000, 6000).toFixed(2))

    if (onThetaChange) {
      const relx = clamp((sx - x0) / slopeLen, 0.15, 0.95)
      const rely = clamp((y0 - sy) / slopeLen, 0.05, 0.95)
      const nextTheta = clamp((Math.atan2(rely, relx) * 180) / Math.PI, 5, 65)
      onThetaChange(nextTheta.toFixed(2))
    }
  }

  const staticLimit = muS * weight
  const kinetic = muK * weight

  return (
    <Panel
      title={inclined ? 'Inclined Friction Diagram' : 'Horizontal Friction Diagram'}
      subtitle={inclined ? 'Drag the red force handle to modify P. You can also tilt the slope by dragging around the ramp.' : 'Drag the red force handle to modify P and immediately compare with static/kinetic friction limits.'}
    >
      <Box sx={{ overflowX: 'auto' }}>
        <svg
          width={width}
          height={height}
          onPointerMove={onPointerMove}
          onPointerUp={() => setDragging(false)}
          onPointerLeave={() => setDragging(false)}
          style={{ touchAction: 'none', maxWidth: '100%', borderRadius: 12, background: 'linear-gradient(180deg,#FFFFFF,#F8FAFF)' }}
        >
          <defs>
            <marker id="frArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 z" fill="#1E293B" />
            </marker>
          </defs>

          <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#475569" strokeWidth="5" strokeLinecap="round" />

          <rect
            x={inclined ? x0 + 78 * Math.cos(t) - 20 : 230}
            y={inclined ? y0 - 78 * Math.sin(t) - 20 : 125}
            width="40"
            height="40"
            fill="#93C5FD"
            stroke="#1D4ED8"
            transform={inclined ? `rotate(${-th} ${x0 + 78 * Math.cos(t)} ${y0 - 78 * Math.sin(t)})` : undefined}
          />

          <line x1={inclined ? x0 + 78 * Math.cos(t) : 250} y1={inclined ? y0 - 78 * Math.sin(t) : 145} x2={inclined ? x0 + 78 * Math.cos(t) : 250} y2={inclined ? y0 - 78 * Math.sin(t) + 72 : 215} stroke="#0054C8" strokeWidth="2.5" markerEnd="url(#frArrow)" />
          <text x={inclined ? x0 + 86 * Math.cos(t) : 258} y={inclined ? y0 - 78 * Math.sin(t) + 16 : 154} fill="#0054C8" fontSize="11">W={weight.toFixed(1)} N</text>

          {(() => {
            const bx = inclined ? x0 + 78 * Math.cos(t) : 250
            const by = inclined ? y0 - 78 * Math.sin(t) : 145
            const dirx = inclined ? Math.cos(t) : 1
            const diry = inclined ? -Math.sin(t) : 0
            const len = clamp(Math.abs(p) / 12, 18, 95)
            const sign = p >= 0 ? 1 : -1
            const tx = bx + sign * len * dirx
            const ty = by + sign * len * diry
            return (
              <g>
                <line x1={bx} y1={by} x2={tx} y2={ty} stroke="#8C1D18" strokeWidth="2.5" markerEnd="url(#frArrow)" />
                <circle cx={tx} cy={ty} r="6" fill="#8C1D18" onPointerDown={() => setDragging(true)} style={{ cursor: 'grab' }} />
                <text x={tx + 8} y={ty - 6} fill="#8C1D18" fontSize="11">P={p.toFixed(1)} N</text>
              </g>
            )
          })()}

          {inclined && <text x={x0 + 18} y={y0 - 14} fill="#475569" fontSize="12">theta={th.toFixed(1)}deg</text>}
        </svg>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.75 }}>
        <Chip size="small" label={`Fs,max = ${staticLimit.toFixed(2)} N`} sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 600 }} />
        <Chip size="small" label={`Fk = ${kinetic.toFixed(2)} N`} sx={{ bgcolor: '#FFE4E6', color: '#9F1239', fontWeight: 600 }} />
      </Box>
    </Panel>
  )
}
