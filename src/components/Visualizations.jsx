import { useMemo, useRef, useState } from 'react'
import { Box, Paper, Typography } from '@mui/material'

const toNum = (v, fallback = 0) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : fallback
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

const arrowHead = {
  markerWidth: 8,
  markerHeight: 8,
  refX: 7,
  refY: 4,
  orient: 'auto',
}

function VizCard({ title, subtitle, children }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        borderColor: '#D7E3FF',
        bgcolor: '#FBFCFF',
      }}
    >
      <Typography variant="subtitle2" sx={{ color: '#0054C8', mb: 0.25 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: '#535F70', display: 'block', mb: 1.25 }}>
          {subtitle}
        </Typography>
      )}
      {children}
    </Paper>
  )
}

export function ForceSystemVisualizer({
  forces = [],
  resultant = null,
  showPositions = false,
  title = 'Force Diagram',
}) {
  const width = 520
  const height = 320
  const cx = width / 2
  const cy = height / 2

  const parsed = useMemo(() => {
    return forces.map((f, i) => {
      const F = toNum(f.F)
      const angle = toNum(f.angle)
      const a = (angle * Math.PI) / 180
      const fx = F * Math.cos(a)
      const fy = F * Math.sin(a)
      return {
        i,
        F,
        angle,
        fx,
        fy,
        rx: toNum(f.rx),
        ry: toNum(f.ry),
      }
    })
  }, [forces])

  const maxForce = Math.max(1, ...parsed.map((p) => Math.hypot(p.fx, p.fy)))
  const maxPos = Math.max(1, ...parsed.map((p) => Math.max(Math.abs(p.rx), Math.abs(p.ry))))
  const forceScale = 95 / maxForce
  const posScale = showPositions ? 95 / maxPos : 0

  const R = resultant
    ? {
      Rx: toNum(resultant.Rx),
      Ry: toNum(resultant.Ry),
    }
    : null

  return (
    <VizCard
      title={title}
      subtitle={showPositions ? 'Forces are drawn at their points of application around the origin.' : 'All forces are concurrent at the origin.'}
    >
      <Box sx={{ overflowX: 'auto' }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Force system diagram">
          <defs>
            <marker id="arr-force" {...arrowHead}>
              <path d="M0,0 L8,4 L0,8 Z" fill="#0054C8" />
            </marker>
            <marker id="arr-res" {...arrowHead}>
              <path d="M0,0 L8,4 L0,8 Z" fill="#8C1D18" />
            </marker>
          </defs>

          <rect x="0" y="0" width={width} height={height} fill="#F8FAFF" rx="12" />
          <line x1="16" y1={cy} x2={width - 16} y2={cy} stroke="#BAC8E6" strokeWidth="1.5" />
          <line x1={cx} y1="16" x2={cx} y2={height - 16} stroke="#BAC8E6" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="4" fill="#1A1C1E" />
          <text x={width - 26} y={cy - 8} fontSize="11" fill="#535F70">+x</text>
          <text x={cx + 6} y="24" fontSize="11" fill="#535F70">+y</text>

          {parsed.map((p) => {
            const px = cx + p.rx * posScale
            const py = cy - p.ry * posScale
            const ex = px + p.fx * forceScale
            const ey = py - p.fy * forceScale
            return (
              <g key={p.i}>
                {showPositions && (
                  <circle cx={px} cy={py} r="3" fill="#0054C8" />
                )}
                <line x1={px} y1={py} x2={ex} y2={ey} stroke="#0054C8" strokeWidth="2.2" markerEnd="url(#arr-force)" />
                <text x={ex + 4} y={ey - 4} fontSize="11" fill="#003E9C">F{p.i + 1}</text>
              </g>
            )
          })}

          {R && (
            <g>
              <line
                x1={cx}
                y1={cy}
                x2={cx + R.Rx * forceScale}
                y2={cy - R.Ry * forceScale}
                stroke="#8C1D18"
                strokeWidth="2.8"
                markerEnd="url(#arr-res)"
              />
              <text x={cx + R.Rx * forceScale + 4} y={cy - R.Ry * forceScale - 4} fontSize="12" fill="#8C1D18">R</text>
            </g>
          )}
        </svg>
      </Box>
    </VizCard>
  )
}

export function CoupleVisualizer({ F, d }) {
  const force = Math.abs(toNum(F))
  const gap = Math.abs(toNum(d))
  const span = clamp(80 + gap * 120, 80, 260)
  const arrowSize = clamp(28 + force / 40, 28, 70)

  return (
    <VizCard title="Couple Diagram" subtitle="Equal and opposite parallel forces separated by distance d.">
      <svg width="520" height="220" viewBox="0 0 520 220" role="img" aria-label="Couple diagram">
        <defs>
          <marker id="arr-couple" {...arrowHead}>
            <path d="M0,0 L8,4 L0,8 Z" fill="#0054C8" />
          </marker>
        </defs>

        <rect x="0" y="0" width="520" height="220" fill="#F8FAFF" rx="12" />
        <line x1={260 - span / 2} y1="110" x2={260 + span / 2} y2="110" stroke="#8EA2D4" strokeWidth="2" strokeDasharray="5 5" />

        <line x1={260 - span / 2} y1={110 + arrowSize} x2={260 - span / 2} y2={110 - arrowSize} stroke="#0054C8" strokeWidth="2.5" markerEnd="url(#arr-couple)" />
        <line x1={260 + span / 2} y1={110 - arrowSize} x2={260 + span / 2} y2={110 + arrowSize} stroke="#0054C8" strokeWidth="2.5" markerEnd="url(#arr-couple)" />

        <text x={260 - span / 2 - 24} y={110 - arrowSize - 6} fontSize="12" fill="#003E9C">F</text>
        <text x={260 + span / 2 + 8} y={110 + arrowSize + 14} fontSize="12" fill="#003E9C">F</text>

        <line x1={260 - span / 2} y1="168" x2={260 + span / 2} y2="168" stroke="#7D3B00" strokeWidth="1.8" markerStart="url(#arr-couple)" markerEnd="url(#arr-couple)" />
        <text x="255" y="186" fontSize="12" fill="#7D3B00">d</text>
        <text x="202" y="34" fontSize="12" fill="#535F70">C = F x d</text>
      </svg>
    </VizCard>
  )
}

export function BeamVisualizer({
  L,
  pointLoads = [],
  udls = [],
  moments = [],
  reactions = null,
  title = 'Beam Diagram',
  onPointLoadMove,
  onMomentMove,
}) {
  const svgRef = useRef(null)
  const [drag, setDrag] = useState(null)

  const length = Math.max(1, toNum(L, 1))
  const width = 620
  const height = 250
  const left = 52
  const right = width - 52
  const top = 46
  const beamY = 130
  const beamW = right - left

  const xToPx = (x) => left + (clamp(x, 0, length) / length) * beamW
  const pxToX = (px) => ((clamp(px, left, right) - left) / beamW) * length

  const loadMax = Math.max(1, ...pointLoads.map((p) => Math.abs(toNum(p.P))), ...udls.map((u) => Math.abs(toNum(u.w) * (toNum(u.x2) - toNum(u.x1)))))

  const pointerX = (event) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return null
    return event.clientX - rect.left
  }

  const onPointerMove = (event) => {
    if (!drag) return
    const px = pointerX(event)
    if (px == null) return
    const x = pxToX(px)
    if (drag.kind === 'point' && onPointLoadMove) onPointLoadMove(drag.index, x)
    if (drag.kind === 'moment' && onMomentMove) onMomentMove(drag.index, x)
  }

  return (
    <VizCard title={title} subtitle="Drag point-load and moment handles left/right to reposition them.">
      <Box sx={{ overflowX: 'auto' }}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Beam diagram"
          onPointerMove={onPointerMove}
          onPointerUp={() => setDrag(null)}
          onPointerLeave={() => setDrag(null)}
        >
          <defs>
            <marker id="arr-beam" {...arrowHead}>
              <path d="M0,0 L8,4 L0,8 Z" fill="#8C1D18" />
            </marker>
            <marker id="arr-react" {...arrowHead}>
              <path d="M0,0 L8,4 L0,8 Z" fill="#006E2C" />
            </marker>
          </defs>

          <rect x="0" y="0" width={width} height={height} fill="#F8FAFF" rx="12" />
          <line x1={left} y1={beamY} x2={right} y2={beamY} stroke="#1A1C1E" strokeWidth="5" strokeLinecap="round" />

          <polygon points={`${left - 14},${beamY + 24} ${left + 14},${beamY + 24} ${left},${beamY + 8}`} fill="#ADC6FF" stroke="#3D5EA8" />
          <circle cx={right} cy={beamY + 20} r="7" fill="#ADC6FF" stroke="#3D5EA8" />

          <text x={left - 4} y={beamY + 42} fontSize="11" fill="#42474E">A</text>
          <text x={right - 4} y={beamY + 42} fontSize="11" fill="#42474E">B</text>
          <text x={left - 4} y={top - 14} fontSize="11" fill="#42474E">x = 0</text>
          <text x={right - 42} y={top - 14} fontSize="11" fill="#42474E">x = L</text>

          {udls.map((u, i) => {
            const x1 = xToPx(toNum(u.x1))
            const x2 = xToPx(toNum(u.x2))
            const span = Math.max(0, x2 - x1)
            const nArrows = Math.max(2, Math.round(span / 35))
            return (
              <g key={`udl-${i}`}>
                <rect x={x1} y={top} width={span} height="12" fill="#F7DCC8" stroke="#B46A2A" />
                {Array.from({ length: nArrows }).map((_, j) => {
                  const x = x1 + (j / (nArrows - 1 || 1)) * span
                  return <line key={j} x1={x} y1={top + 12} x2={x} y2={beamY - 4} stroke="#B46A2A" markerEnd="url(#arr-beam)" />
                })}
                <text x={(x1 + x2) / 2 - 18} y={top - 4} fontSize="11" fill="#7D3B00">w{i + 1}</text>
              </g>
            )
          })}

          {pointLoads.map((p, i) => {
            const x = xToPx(toNum(p.x))
            const ang = toNum(p.angle, 270)
            const vy = toNum(p.P) * Math.sin((ang * Math.PI) / 180)
            const len = clamp((Math.abs(vy) / loadMax) * 60, 20, 60)
            const y1 = vy <= 0 ? top + 4 : beamY - 6
            const y2 = vy <= 0 ? beamY - 6 : top + 4
            return (
              <g key={`pl-${i}`}>
                <line x1={x} y1={y1} x2={x} y2={y2} stroke="#8C1D18" strokeWidth="2.2" markerEnd="url(#arr-beam)" />
                <circle
                  cx={x}
                  cy={vy <= 0 ? top + 2 : beamY - 4}
                  r="7"
                  fill="#FFDAD6"
                  stroke="#8C1D18"
                  style={{ cursor: onPointLoadMove ? 'ew-resize' : 'default' }}
                  onPointerDown={() => setDrag({ kind: 'point', index: i })}
                />
                <text x={x + 7} y={top - 6 + (i % 2) * 11} fontSize="11" fill="#8C1D18">P{i + 1}</text>
                <line x1={x} y1={beamY + 8} x2={x} y2={beamY + 18} stroke="#7B8898" />
                <text x={x - 8} y={beamY + 32} fontSize="10" fill="#535F70">{toNum(p.x).toFixed(2)}</text>
              </g>
            )
          })}

          {moments.map((m, i) => {
            const x = xToPx(toNum(m.x))
            const ccw = toNum(m.M) >= 0
            return (
              <g key={`m-${i}`}>
                <path
                  d={ccw ? `M ${x - 20} ${beamY - 30} A 18 18 0 1 1 ${x + 20} ${beamY - 30}` : `M ${x + 20} ${beamY - 30} A 18 18 0 1 0 ${x - 20} ${beamY - 30}`}
                  fill="none"
                  stroke="#7D3B00"
                  strokeWidth="2"
                  markerEnd="url(#arr-beam)"
                />
                <circle
                  cx={x}
                  cy={beamY - 30}
                  r="7"
                  fill="#F7DCC8"
                  stroke="#7D3B00"
                  style={{ cursor: onMomentMove ? 'ew-resize' : 'default' }}
                  onPointerDown={() => setDrag({ kind: 'moment', index: i })}
                />
                <text x={x + 8} y={beamY - 36} fontSize="11" fill="#7D3B00">M{i + 1}</text>
              </g>
            )
          })}

          {reactions && (
            <g>
              <line x1={left} y1={beamY + 22} x2={left} y2={beamY - 22} stroke="#006E2C" strokeWidth="2.2" markerEnd="url(#arr-react)" />
              <line x1={right} y1={beamY + 22} x2={right} y2={beamY - 22} stroke="#006E2C" strokeWidth="2.2" markerEnd="url(#arr-react)" />
              <text x={left + 6} y={beamY - 24} fontSize="11" fill="#006E2C">RAy {toNum(reactions.RAy).toFixed(2)}</text>
              <text x={right - 72} y={beamY - 24} fontSize="11" fill="#006E2C">RB {toNum(reactions.RB).toFixed(2)}</text>
            </g>
          )}
        </svg>
      </Box>
    </VizCard>
  )
}

export function TrussVisualizer({
  nodes = [],
  members = [],
  loads = [],
  memberResults = null,
  title = 'Truss Diagram',
  onLoadMove,
}) {
  const svgRef = useRef(null)
  const [dragLoad, setDragLoad] = useState(null)

  const width = 620
  const height = 340
  const pad = 30

  const nodeMap = useMemo(() => {
    const m = {}
    nodes.forEach((n) => { m[n.id] = { x: toNum(n.x), y: toNum(n.y) } })
    return m
  }, [nodes])

  const xs = nodes.map((n) => toNum(n.x))
  const ys = nodes.map((n) => toNum(n.y))
  const minX = Math.min(0, ...xs)
  const maxX = Math.max(1, ...xs)
  const minY = Math.min(0, ...ys)
  const maxY = Math.max(1, ...ys)

  const spanX = Math.max(1, maxX - minX)
  const spanY = Math.max(1, maxY - minY)
  const scale = Math.min((width - 2 * pad) / spanX, (height - 2 * pad) / spanY)

  const worldToScreen = (x, y) => ({
    x: pad + (x - minX) * scale,
    y: height - pad - (y - minY) * scale,
  })

  const forceMax = Math.max(1, ...loads.map((l) => Math.hypot(toNum(l.Fx), toNum(l.Fy))))
  const forceScale = 75 / forceMax

  const memberMap = useMemo(() => {
    const m = {}
    if (memberResults?.members) {
      memberResults.members.forEach((r) => { m[r.id] = r })
    }
    return m
  }, [memberResults])

  const pointerPos = (event) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return null
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const onPointerMove = (event) => {
    if (!dragLoad || !onLoadMove) return
    const p = pointerPos(event)
    if (!p) return
    const origin = worldToScreen(dragLoad.node.x, dragLoad.node.y)
    const Fx = (p.x - origin.x) / forceScale
    const Fy = -(p.y - origin.y) / forceScale
    onLoadMove(dragLoad.index, Fx, Fy)
  }

  return (
    <VizCard
      title={title}
      subtitle="Drag the red handle at each load arrow tip to change Fx/Fy interactively."
    >
      <Box sx={{ overflowX: 'auto' }}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Truss diagram"
          onPointerMove={onPointerMove}
          onPointerUp={() => setDragLoad(null)}
          onPointerLeave={() => setDragLoad(null)}
        >
          <defs>
            <marker id="arr-truss-load" {...arrowHead}>
              <path d="M0,0 L8,4 L0,8 Z" fill="#8C1D18" />
            </marker>
          </defs>

          <rect x="0" y="0" width={width} height={height} fill="#F8FAFF" rx="12" />

          {members.map((m) => {
            const a = nodeMap[m.nodeA]
            const b = nodeMap[m.nodeB]
            if (!a || !b) return null
            const pa = worldToScreen(a.x, a.y)
            const pb = worldToScreen(b.x, b.y)
            const mr = memberMap[m.id]
            let stroke = '#42474E'
            if (mr?.type === 'Tension') stroke = '#006E2C'
            if (mr?.type === 'Compression') stroke = '#8C1D18'
            return (
              <g key={m.id}>
                <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={stroke} strokeWidth="3" />
                <text x={(pa.x + pb.x) / 2 + 3} y={(pa.y + pb.y) / 2 - 4} fontSize="11" fill="#535F70">{m.id}</text>
              </g>
            )
          })}

          {nodes.map((n) => {
            const p = worldToScreen(toNum(n.x), toNum(n.y))
            return (
              <g key={n.id}>
                <circle cx={p.x} cy={p.y} r="5" fill="#0054C8" />
                <text x={p.x + 8} y={p.y - 8} fontSize="12" fill="#003E9C">{n.id}</text>
              </g>
            )
          })}

          {loads.map((l, i) => {
            const node = nodeMap[l.nodeId]
            if (!node) return null
            const o = worldToScreen(node.x, node.y)
            const Fx = toNum(l.Fx)
            const Fy = toNum(l.Fy)
            const tip = { x: o.x + Fx * forceScale, y: o.y - Fy * forceScale }
            return (
              <g key={`load-${i}`}>
                <line x1={o.x} y1={o.y} x2={tip.x} y2={tip.y} stroke="#8C1D18" strokeWidth="2.4" markerEnd="url(#arr-truss-load)" />
                <circle
                  cx={tip.x}
                  cy={tip.y}
                  r="7"
                  fill="#FFDAD6"
                  stroke="#8C1D18"
                  style={{ cursor: onLoadMove ? 'grab' : 'default' }}
                  onPointerDown={() => setDragLoad({ index: i, node })}
                />
                <text x={tip.x + 6} y={tip.y - 6} fontSize="11" fill="#8C1D18">{l.nodeId}: ({Fx.toFixed(0)}, {Fy.toFixed(0)})</text>
              </g>
            )
          })}
        </svg>
      </Box>
    </VizCard>
  )
}

function drawShape(defKey, dims, x0, y0, scale, minX, maxY) {
  const sx = (x) => (x - minX) * scale
  const sy = (y) => (maxY - y) * scale

  if (defKey === 'rectangle') {
    const b = toNum(dims.b)
    const h = toNum(dims.h)
    return <rect x={sx(x0)} y={sy(y0 + h)} width={Math.abs(b) * scale} height={Math.abs(h) * scale} />
  }
  if (defKey === 'triangle_right' || defKey === 'triangle') {
    const b = toNum(dims.b)
    const h = toNum(dims.h)
    const p1 = `${sx(x0)},${sy(y0)}`
    const p2 = `${sx(x0 + b)},${sy(y0)}`
    const p3 = `${sx(x0)},${sy(y0 + h)}`
    return <polygon points={`${p1} ${p2} ${p3}`} />
  }
  if (defKey === 'circle') {
    const r = Math.abs(toNum(dims.r))
    return <circle cx={sx(x0)} cy={sy(y0)} r={r * scale} />
  }
  if (defKey === 'semicircle') {
    const r = Math.abs(toNum(dims.r))
    const xL = sx(x0 - r)
    const xR = sx(x0 + r)
    const yB = sy(y0)
    const yTop = sy(y0 + r)
    const d = `M ${xL} ${yB} A ${r * scale} ${r * scale} 0 0 1 ${xR} ${yB} L ${xL} ${yB} Z`
    return <path d={d} />
  }
  if (defKey === 'quarter_circle') {
    const r = Math.abs(toNum(dims.r))
    const d = `M ${sx(x0)} ${sy(y0)} L ${sx(x0 + r)} ${sy(y0)} A ${r * scale} ${r * scale} 0 0 1 ${sx(x0)} ${sy(y0 + r)} Z`
    return <path d={d} />
  }
  return null
}

export function CompositeShapeVisualizer({
  shapes = [],
  centroid = null,
  refAxis = null,
  title = 'Composite Section',
}) {
  const width = 520
  const height = 320
  const pad = 22

  const bounds = useMemo(() => {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    const addPoint = (x, y) => {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }

    shapes.forEach((s) => {
      const x0 = toNum(s.x0)
      const y0 = toNum(s.y0)
      if (s.type === 'rectangle') {
        addPoint(x0, y0)
        addPoint(x0 + toNum(s.dims?.b), y0 + toNum(s.dims?.h))
      } else if (s.type === 'triangle_right' || s.type === 'triangle') {
        addPoint(x0, y0)
        addPoint(x0 + toNum(s.dims?.b), y0 + toNum(s.dims?.h))
      } else if (s.type === 'circle') {
        const r = Math.abs(toNum(s.dims?.r))
        addPoint(x0 - r, y0 - r)
        addPoint(x0 + r, y0 + r)
      } else if (s.type === 'semicircle') {
        const r = Math.abs(toNum(s.dims?.r))
        addPoint(x0 - r, y0)
        addPoint(x0 + r, y0 + r)
      } else if (s.type === 'quarter_circle') {
        const r = Math.abs(toNum(s.dims?.r))
        addPoint(x0, y0)
        addPoint(x0 + r, y0 + r)
      }
    })

    if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 1, maxY: 1 }
    return { minX, minY, maxX, maxY }
  }, [shapes])

  const spanX = Math.max(0.5, bounds.maxX - bounds.minX)
  const spanY = Math.max(0.5, bounds.maxY - bounds.minY)
  const scale = Math.min((width - 2 * pad) / spanX, (height - 2 * pad) / spanY)

  const sx = (x) => pad + (x - bounds.minX) * scale
  const sy = (y) => height - pad - (y - bounds.minY) * scale

  return (
    <VizCard title={title} subtitle="Live section sketch from your dimensions and coordinates.">
      <Box sx={{ overflowX: 'auto' }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Composite section diagram">
          <rect x="0" y="0" width={width} height={height} fill="#F8FAFF" rx="12" />

          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#BAC8E6" />
          <line x1={pad} y1={height - pad} x2={pad} y2={pad} stroke="#BAC8E6" />

          {shapes.map((s, i) => (
            <g
              key={i}
              fill={s.hole ? '#FFF0EE' : '#D7E3FF'}
              stroke={s.hole ? '#BA1A1A' : '#0054C8'}
              strokeWidth="1.8"
              strokeDasharray={s.hole ? '5 4' : 'none'}
              opacity={s.hole ? 0.8 : 1}
            >
              {drawShape(s.type, s.dims ?? {}, toNum(s.x0), toNum(s.y0), scale, bounds.minX, bounds.maxY)}
            </g>
          ))}

          {refAxis && (
            <g>
              <line x1={pad} y1={sy(toNum(refAxis.y))} x2={width - pad} y2={sy(toNum(refAxis.y))} stroke="#7D3B00" strokeDasharray="4 4" />
              <line x1={sx(toNum(refAxis.x))} y1={pad} x2={sx(toNum(refAxis.x))} y2={height - pad} stroke="#7D3B00" strokeDasharray="4 4" />
              <text x={sx(toNum(refAxis.x)) + 6} y={pad + 14} fontSize="11" fill="#7D3B00">ref y-axis</text>
              <text x={width - 95} y={sy(toNum(refAxis.y)) - 6} fontSize="11" fill="#7D3B00">ref x-axis</text>
            </g>
          )}

          {centroid && (
            <g>
              <circle cx={sx(toNum(centroid.x))} cy={sy(toNum(centroid.y))} r="5" fill="#006E2C" />
              <line x1={sx(toNum(centroid.x)) - 10} y1={sy(toNum(centroid.y))} x2={sx(toNum(centroid.x)) + 10} y2={sy(toNum(centroid.y))} stroke="#006E2C" />
              <line x1={sx(toNum(centroid.x))} y1={sy(toNum(centroid.y)) - 10} x2={sx(toNum(centroid.x))} y2={sy(toNum(centroid.y)) + 10} stroke="#006E2C" />
              <text x={sx(toNum(centroid.x)) + 8} y={sy(toNum(centroid.y)) - 8} fontSize="11" fill="#006E2C">C</text>
            </g>
          )}
        </svg>
      </Box>
    </VizCard>
  )
}

export function FrictionVisualizer({ mode = 'horizontal', values = {}, result = null }) {
  const W = toNum(values.W)
  const P = toNum(values.P)
  const theta = toNum(values.theta, 30)

  if (mode === 'horizontal') {
    return (
      <VizCard title="Friction FBD" subtitle="Block on horizontal plane.">
        <svg width="520" height="240" viewBox="0 0 520 240" role="img" aria-label="Horizontal friction diagram">
          <defs>
            <marker id="arr-fr" {...arrowHead}>
              <path d="M0,0 L8,4 L0,8 Z" fill="#8C1D18" />
            </marker>
            <marker id="arr-fr2" {...arrowHead}>
              <path d="M0,0 L8,4 L0,8 Z" fill="#006E2C" />
            </marker>
          </defs>
          <rect x="0" y="0" width="520" height="240" fill="#F8FAFF" rx="12" />
          <line x1="35" y1="176" x2="485" y2="176" stroke="#42474E" strokeWidth="3" />
          <rect x="220" y="126" width="82" height="50" rx="6" fill="#D7E3FF" stroke="#0054C8" />

          <line x1="261" y1="126" x2="261" y2="78" stroke="#006E2C" strokeWidth="2.2" markerEnd="url(#arr-fr2)" />
          <text x="268" y="82" fontSize="12" fill="#006E2C">N {result ? toNum(result.N).toFixed(1) : ''}</text>

          <line x1="261" y1="176" x2="261" y2="220" stroke="#8C1D18" strokeWidth="2.2" markerEnd="url(#arr-fr)" />
          <text x="268" y="214" fontSize="12" fill="#8C1D18">W {W.toFixed(1)}</text>

          <line x1="302" y1="151" x2="356" y2="151" stroke="#8C1D18" strokeWidth="2.2" markerEnd="url(#arr-fr)" />
          <text x="360" y="146" fontSize="12" fill="#8C1D18">P {P.toFixed(1)}</text>

          <line x1="220" y1="151" x2="174" y2="151" stroke="#7D3B00" strokeWidth="2.2" markerEnd="url(#arr-fr)" />
          <text x="128" y="146" fontSize="12" fill="#7D3B00">f {result ? toNum(result.friction).toFixed(1) : ''}</text>
        </svg>
      </VizCard>
    )
  }

  const t = (theta * Math.PI) / 180
  const x0 = 130
  const y0 = 190
  const len = 240
  const x1 = x0 + len * Math.cos(t)
  const y1 = y0 - len * Math.sin(t)
  const bx = x0 + 110 * Math.cos(t)
  const by = y0 - 110 * Math.sin(t)
  const nx = -Math.sin(t)
  const ny = -Math.cos(t)

  return (
    <VizCard title="Friction FBD" subtitle="Block on incline with force P along slope.">
      <svg width="520" height="260" viewBox="0 0 520 260" role="img" aria-label="Inclined friction diagram">
        <defs>
          <marker id="arr-in" {...arrowHead}>
            <path d="M0,0 L8,4 L0,8 Z" fill="#8C1D18" />
          </marker>
          <marker id="arr-in2" {...arrowHead}>
            <path d="M0,0 L8,4 L0,8 Z" fill="#006E2C" />
          </marker>
        </defs>
        <rect x="0" y="0" width="520" height="260" fill="#F8FAFF" rx="12" />

        <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#42474E" strokeWidth="3" />
        <polygon
          points={`${bx - 18},${by + 8} ${bx + 18},${by + 8} ${bx + 18},${by - 26} ${bx - 18},${by - 26}`}
          fill="#D7E3FF"
          stroke="#0054C8"
        />

        <line x1={bx} y1={by - 10} x2={bx + 48 * Math.cos(t)} y2={by - 10 - 48 * Math.sin(t)} stroke="#8C1D18" strokeWidth="2.2" markerEnd="url(#arr-in)" />
        <text x={bx + 54 * Math.cos(t)} y={by - 14 - 54 * Math.sin(t)} fontSize="12" fill="#8C1D18">P {P.toFixed(1)}</text>

        <line x1={bx} y1={by - 10} x2={bx + 42 * nx} y2={by - 10 + 42 * ny} stroke="#006E2C" strokeWidth="2.2" markerEnd="url(#arr-in2)" />
        <text x={bx + 44 * nx + 6} y={by - 10 + 44 * ny} fontSize="12" fill="#006E2C">N</text>

        <line x1={bx} y1={by - 10} x2={bx} y2={by + 44} stroke="#8C1D18" strokeWidth="2.2" markerEnd="url(#arr-in)" />
        <text x={bx + 6} y={by + 44} fontSize="12" fill="#8C1D18">W {W.toFixed(1)}</text>

        <line x1={bx} y1={by - 10} x2={bx - 40 * Math.cos(t)} y2={by - 10 + 40 * Math.sin(t)} stroke="#7D3B00" strokeWidth="2.2" markerEnd="url(#arr-in)" />
        <text x={bx - 48 * Math.cos(t) - 28} y={by + 40 * Math.sin(t) + 2} fontSize="12" fill="#7D3B00">f</text>

        <text x="60" y="210" fontSize="12" fill="#535F70">theta = {theta.toFixed(1)} degrees</text>
        {result && <text x="60" y="228" fontSize="12" fill="#535F70">status: {result.status}</text>}
      </svg>
    </VizCard>
  )
}
