import { useState } from 'react'
import {
  Box, Tabs, Tab, Typography, TextField, Button, IconButton,
  Select, MenuItem, FormControl, InputLabel, Checkbox,
  FormControlLabel, Divider, Alert, Paper,
  Table, TableHead, TableBody, TableRow, TableCell
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import CalculateIcon from '@mui/icons-material/Calculate'
import { StepDisplay, ResultRow } from '../components/StepDisplay.jsx'
import { CompositeAreaVisualizer, BeamLoadVisualizer, ShearMomentChart } from '../components/MechanicsVisuals.jsx'
import { SHAPE_DEFS, solveCentroid } from '../solvers/unit3.js'
import { buildShearBendingDiagram, solveBeamEquilibrium } from '../solvers/unit2.js'

const N = (v) => parseFloat(v)

const supportPreset = (type, L) => {
  if (type === 'cantilever_left') return [{ id: 'A', x: 0, type: 'fixed' }]
  if (type === 'cantilever_right') return [{ id: 'B', x: L, type: 'fixed' }]
  if (type === 'overhanging') return [
    { id: 'A', x: 0.2 * L, type: 'pin' },
    { id: 'B', x: 0.75 * L, type: 'rollerY' },
  ]
  if (type === 'fixed_fixed') return [
    { id: 'A', x: 0, type: 'fixed' },
    { id: 'B', x: L, type: 'fixed' },
  ]
  if (type === 'propped_cantilever') return [
    { id: 'A', x: 0, type: 'fixed' },
    { id: 'B', x: L, type: 'rollerY' },
  ]
  return [
    { id: 'A', x: 0, type: 'pin' },
    { id: 'B', x: L, type: 'rollerY' },
  ]
}

// ── Centroid Calculator ───────────────────────────────────────────────────────
function CentroidTool() {
  const [shapes, setShapes] = useState([
    { type: 'rectangle', dims: { b: '0.2', h: '0.3' }, x0: '0', y0: '0', hole: false },
    { type: 'circle', dims: { r: '0.05' }, x0: '0.1', y0: '0.15', hole: true },
  ])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const updShape = (i, key, val) => setShapes((s) => s.map((r, j) => j === i ? { ...r, [key]: val } : r))
  const updDim = (i, key, val) => setShapes((s) => s.map((r, j) => j === i ? { ...r, dims: { ...r.dims, [key]: val } } : r))
  const addShape = () => setShapes((s) => [...s, { type: 'rectangle', dims: { b: '', h: '' }, x0: '', y0: '', hole: false }])
  const delShape = (i) => setShapes((s) => s.filter((_, j) => j !== i))

  const calc = () => {
    setError(null)
    const parsed = shapes.map((s) => {
      const def = SHAPE_DEFS[s.type]
      const dims = {}
      def.params.forEach((p) => { dims[p.key] = N(s.dims[p.key]) })
      return { type: s.type, dims, x0: N(s.x0), y0: N(s.y0), hole: s.hole }
    })
    if (parsed.some((s) => Object.values(s.dims).some(isNaN) || isNaN(s.x0) || isNaN(s.y0))) {
      setError('Fill in all dimensions and positions.')
      return
    }
    const res = solveCentroid(parsed)
    if (res.error) setError(res.error)
    setResult(res)
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#42474E', mb: 2 }}>
        Build a composite area by adding shapes. Tick <strong>Hole</strong> to subtract that shape's area.
        x₀, y₀ is the reference corner/centre of each shape (see label below shape type).
      </Typography>

      <CompositeAreaVisualizer
        title="Composite Area Canvas"
        shapes={shapes}
        onShapesChange={setShapes}
      />

      {shapes.map((s, i) => {
        const def = SHAPE_DEFS[s.type]
        return (
          <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, borderColor: s.hole ? '#FFDAD6' : '#E0E3EA', bgcolor: s.hole ? '#FFF8F7' : '#FAFCFF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ color: s.hole ? '#8C1D18' : '#0054C8' }}>
                Part {i + 1}{s.hole ? ' — HOLE' : ''}
              </Typography>
              <IconButton size="small" onClick={() => delShape(i)} disabled={shapes.length <= 1} sx={{ color: '#BA1A1A' }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Shape</InputLabel>
                <Select value={s.type} label="Shape" onChange={(e) => updShape(i, 'type', e.target.value)}>
                  {Object.entries(SHAPE_DEFS).map(([k, d]) => <MenuItem key={k} value={k}>{d.label}</MenuItem>)}
                </Select>
              </FormControl>
              {def.params.map((p) => (
                <TextField key={p.key} label={p.label} value={s.dims[p.key] ?? ''} size="small"
                  onChange={(e) => updDim(i, p.key, e.target.value)} sx={{ width: 130 }} />
              ))}
            </Box>

            <Typography variant="caption" sx={{ color: '#535F70', display: 'block', mb: 1 }}>
              📍 {def.refLabel}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField label="x₀ (m)" value={s.x0} size="small" onChange={(e) => updShape(i, 'x0', e.target.value)} sx={{ width: 120 }} />
              <TextField label="y₀ (m)" value={s.y0} size="small" onChange={(e) => updShape(i, 'y0', e.target.value)} sx={{ width: 120 }} />
              <FormControlLabel
                control={<Checkbox checked={s.hole} size="small" onChange={(e) => updShape(i, 'hole', e.target.checked)} sx={{ color: '#BA1A1A', '&.Mui-checked': { color: '#BA1A1A' } }} />}
                label={<Typography variant="body2" sx={{ color: '#BA1A1A', fontWeight: 500 }}>Hole (subtract)</Typography>}
              />
            </Box>
          </Paper>
        )
      })}

      <Button startIcon={<AddIcon />} onClick={addShape} sx={{ mb: 2 }}>Add Shape</Button>
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button variant="contained" startIcon={<CalculateIcon />} onClick={calc}>Find Centroid</Button>
      </Box>

      {result && (
        <Box sx={{ mt: 3 }}>
          <ResultRow label="Total Area A" value={result.result.totalArea} unit="m²" />
          <ResultRow label="Centroid X̄" value={result.result.Xbar} unit="m" />
          <ResultRow label="Centroid Ȳ" value={result.result.Ybar} unit="m" />

          <Typography variant="subtitle2" sx={{ mt: 2.5, mb: 1 }}>Summary Table</Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: '#F0F5FF' } }}>
                  <TableCell>#</TableCell>
                  <TableCell>Shape</TableCell>
                  <TableCell align="right">A (m²)</TableCell>
                  <TableCell align="right">x̄ (m)</TableCell>
                  <TableCell align="right">ȳ (m)</TableCell>
                  <TableCell align="right">A·x̄</TableCell>
                  <TableCell align="right">A·ȳ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.result.table.map((row) => (
                  <TableRow key={row.i}>
                    <TableCell>{row.i}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{row.label}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.8rem' }}>{row.A}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.8rem' }}>{row.cx}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.8rem' }}>{row.cy}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.8rem' }}>{row.Ax}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.8rem' }}>{row.Ay}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Divider sx={{ my: 2 }} />
          <StepDisplay steps={result.steps} />
        </Box>
      )}
    </Box>
  )
}

// ── Beam Reactions (re-uses Unit 2 solver, dedicated UI here) ────────────────
function BeamReactionsTool() {
  const [L, setL] = useState('8')
  const [beamType, setBeamType] = useState('simply_supported')
  const [supports, setSupports] = useState(supportPreset('simply_supported', 8))
  const [pointLoads, setPointLoads] = useState([
    { P: '15000', x: '2', angle: '270' },
    { P: '25000', x: '5', angle: '270' },
  ])
  const [udls, setUdls] = useState([{ w: '10000', x1: '4', x2: '8' }])
  const [uvls, setUvls] = useState([])
  const [xQuery, setXQuery] = useState('4')
  const [diagram, setDiagram] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const updPL = (i, k, v) => setPointLoads((p) => p.map((r, j) => j === i ? { ...r, [k]: v } : r))
  const updUDL = (i, k, v) => setUdls((u) => u.map((r, j) => j === i ? { ...r, [k]: v } : r))
  const updUVL = (i, k, v) => setUvls((u) => u.map((r, j) => j === i ? { ...r, [k]: v } : r))
  const updSup = (i, k, v) => setSupports((s) => s.map((r, j) => j === i ? { ...r, [k]: v } : r))

  const calc = () => {
    setError(null)
    if (!L || isNaN(N(L))) { setError('Enter beam length.'); return }
    const pl = pointLoads.map((p) => ({ P: N(p.P), x: N(p.x), angle: N(p.angle ?? 270) }))
    const ud = udls.map((u) => ({ w: N(u.w), x1: N(u.x1), x2: N(u.x2) }))
    const uv = uvls.map((u) => ({ w1: N(u.w1), w2: N(u.w2), x1: N(u.x1), x2: N(u.x2) }))
    const sups = supports.map((s, i) => ({ id: (s.id || `S${i + 1}`).trim(), x: N(s.x), type: s.type }))
    if (pl.some((p) => isNaN(p.P) || isNaN(p.x))) { setError('Check point load values.'); return }
    if (ud.some((u) => isNaN(u.w) || isNaN(u.x1) || isNaN(u.x2))) { setError('Check UDL values.'); return }
    if (uv.some((u) => isNaN(u.w1) || isNaN(u.w2) || isNaN(u.x1) || isNaN(u.x2))) { setError('Check UVL values.'); return }
    if (sups.some((s) => !s.id || isNaN(s.x))) { setError('Check support values.'); return }
    const res = solveBeamEquilibrium({ L: N(L), pointLoads: pl, udls: ud, uvls: uv, supports: sups })
    if (res.error) {
      setError(res.error)
      setDiagram(null)
      setResult(res)
      return
    }
    const dia = buildShearBendingDiagram({
      L: N(L),
      pointLoads: pl,
      udls: ud,
      uvls: uv,
      moments: [],
      supports: sups,
      reactions: res.result,
      xQuery: N(xQuery) || 0,
    })
    setDiagram(dia)
    setResult(res)
  }

  const updatePointQuery = () => {
    if (!result?.result || !diagram) return
    const pl = pointLoads.map((p) => ({ P: N(p.P), x: N(p.x), angle: N(p.angle ?? 270) }))
    const ud = udls.map((u) => ({ w: N(u.w), x1: N(u.x1), x2: N(u.x2) }))
    const uv = uvls.map((u) => ({ w1: N(u.w1), w2: N(u.w2), x1: N(u.x1), x2: N(u.x2) }))
    const sups = supports.map((s, i) => ({ id: (s.id || `S${i + 1}`).trim(), x: N(s.x), type: s.type }))
    setDiagram(buildShearBendingDiagram({
      L: N(L),
      pointLoads: pl,
      udls: ud,
      uvls: uv,
      moments: [],
      supports: sups,
      reactions: result.result,
      xQuery: N(xQuery) || 0,
    }))
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#42474E', mb: 2 }}>
        Find support reactions for a simply supported beam (pin at A, roller at B). Typically used with Unit 3 distributed load problems.
      </Typography>

      <BeamLoadVisualizer
        L={L}
        pointLoads={pointLoads}
        onPointLoadsChange={setPointLoads}
        supports={supports}
        onSupportsChange={setSupports}
        udls={udls}
        uvls={uvls}
        moments={[]}
      />

      <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ width: 260 }}>
          <InputLabel>Beam Type Preset</InputLabel>
          <Select
            value={beamType}
            label="Beam Type Preset"
            onChange={(e) => {
              const type = e.target.value
              const len = N(L) || 8
              setBeamType(type)
              setSupports(supportPreset(type, len))
            }}
          >
            <MenuItem value="simply_supported">Simply Supported</MenuItem>
            <MenuItem value="cantilever_left">Cantilever (fixed at left)</MenuItem>
            <MenuItem value="cantilever_right">Cantilever (fixed at right)</MenuItem>
            <MenuItem value="overhanging">Overhanging</MenuItem>
            <MenuItem value="fixed_fixed">Fixed-Fixed</MenuItem>
            <MenuItem value="propped_cantilever">Propped Cantilever</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TextField label="Beam length L (m)" value={L} onChange={(e) => setL(e.target.value)} sx={{ mb: 2, width: 200 }} />

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Supports (drag markers in diagram to move)</Typography>
      {supports.map((s, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField label="ID" value={s.id} size="small" onChange={(e) => updSup(i, 'id', e.target.value)} sx={{ width: 90 }} />
          <FormControl size="small" sx={{ width: 160 }}>
            <InputLabel>Type</InputLabel>
            <Select value={s.type} label="Type" onChange={(e) => updSup(i, 'type', e.target.value)}>
              <MenuItem value="pin">Pin</MenuItem>
              <MenuItem value="rollerY">Roller Y</MenuItem>
              <MenuItem value="rollerX">Roller X</MenuItem>
              <MenuItem value="fixed">Fixed</MenuItem>
            </Select>
          </FormControl>
          <TextField label="x (m)" value={s.x} size="small" onChange={(e) => updSup(i, 'x', e.target.value)} sx={{ width: 130 }} />
          <IconButton size="small" onClick={() => setSupports((sp) => sp.filter((_, j) => j !== i))} disabled={supports.length <= 1} sx={{ color: '#BA1A1A' }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setSupports((sp) => [...sp, { id: `S${sp.length + 1}`, x: '', type: 'rollerY' }])} sx={{ mb: 2 }}>Add Support</Button>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Point Loads (downward angle = 270°)</Typography>
      {pointLoads.map((p, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField label="P (N)" value={p.P} size="small" onChange={(e) => updPL(i, 'P', e.target.value)} sx={{ width: 130 }} />
          <TextField label="x from A (m)" value={p.x} size="small" onChange={(e) => updPL(i, 'x', e.target.value)} sx={{ width: 140 }} />
          <IconButton size="small" onClick={() => setPointLoads((pl) => pl.filter((_, j) => j !== i))} sx={{ color: '#BA1A1A' }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setPointLoads((pl) => [...pl, { P: '', x: '', angle: '270' }])} sx={{ mb: 2 }}>Add Point Load</Button>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>UDL (N/m, downward)</Typography>
      {udls.map((u, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
          <TextField label="w (N/m)" value={u.w} size="small" onChange={(e) => updUDL(i, 'w', e.target.value)} sx={{ width: 120 }} />
          <TextField label="x1 (m)" value={u.x1} size="small" onChange={(e) => updUDL(i, 'x1', e.target.value)} sx={{ width: 110 }} />
          <TextField label="x2 (m)" value={u.x2} size="small" onChange={(e) => updUDL(i, 'x2', e.target.value)} sx={{ width: 110 }} />
          <IconButton size="small" onClick={() => setUdls((ud) => ud.filter((_, j) => j !== i))} sx={{ color: '#BA1A1A' }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setUdls((u) => [...u, { w: '', x1: '', x2: '' }])} sx={{ mb: 2 }}>Add UDL</Button>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>UVL (N/m, downward linearly varying)</Typography>
      {uvls.map((u, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField label="w1 (N/m)" value={u.w1} size="small" onChange={(e) => updUVL(i, 'w1', e.target.value)} sx={{ width: 120 }} />
          <TextField label="w2 (N/m)" value={u.w2} size="small" onChange={(e) => updUVL(i, 'w2', e.target.value)} sx={{ width: 120 }} />
          <TextField label="x1 (m)" value={u.x1} size="small" onChange={(e) => updUVL(i, 'x1', e.target.value)} sx={{ width: 110 }} />
          <TextField label="x2 (m)" value={u.x2} size="small" onChange={(e) => updUVL(i, 'x2', e.target.value)} sx={{ width: 110 }} />
          <IconButton size="small" onClick={() => setUvls((ul) => ul.filter((_, j) => j !== i))} sx={{ color: '#BA1A1A' }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setUvls((u) => [...u, { w1: '', w2: '', x1: '', x2: '' }])} sx={{ mb: 2 }}>Add UVL</Button>

      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      <Button variant="contained" startIcon={<CalculateIcon />} onClick={calc}>Calculate Reactions</Button>

      {result && (
        <Box sx={{ mt: 3 }}>
          {Object.entries(result.result)
            .filter(([k]) => /^(R|M)/.test(k) && !['RAx', 'RAy', 'RB'].includes(k))
            .map(([k, v]) => <ResultRow key={k} label={k} value={v} unit={k.startsWith('M') ? 'N·m' : 'N'} />)}

          {(!result.result || Object.entries(result.result).filter(([k]) => /^(R|M)/.test(k) && !['RAx', 'RAy', 'RB'].includes(k)).length === 0) && (
            <>
              <ResultRow label="RAy (at A)" value={result.result.RAy} unit="N" />
              <ResultRow label="RB (at B)" value={result.result.RB} unit="N" />
            </>
          )}

          {diagram && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Shear/Bending at a Particular Point</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField label="x (m)" size="small" value={xQuery} onChange={(e) => setXQuery(e.target.value)} sx={{ width: 120 }} />
                <Button size="small" variant="outlined" onClick={updatePointQuery}>Evaluate at x</Button>
              </Box>
              <ResultRow label="V(x)" value={diagram.atQuery.V.toFixed(4)} unit="N" />
              <ResultRow label="M(x)" value={diagram.atQuery.M.toFixed(4)} unit="N·m" />
              <ShearMomentChart L={N(L)} diagram={diagram.data} query={diagram.atQuery} />
            </>
          )}

          <Divider sx={{ my: 2 }} />
          <StepDisplay steps={result.steps} />
        </Box>
      )}
    </Box>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
const TOOLS = [
  { label: 'Centroid (Composite)', component: <CentroidTool /> },
  { label: 'Beam Reactions', component: <BeamReactionsTool /> },
]

export default function Unit3Page() {
  const [tab, setTab] = useState(0)
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" sx={{ color: '#7D3B00', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Unit 3</Typography>
        <Typography variant="h4" sx={{ color: '#1A1C1E', fontWeight: 700 }}>Distributed Forces</Typography>
        <Typography variant="body2" sx={{ color: '#42474E', mt: 0.5 }}>Centroids · Composite areas · Beam reactions</Typography>
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          {TOOLS.map((t) => <Tab key={t.label} label={t.label} />)}
        </Tabs>
      </Box>
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E0E3EA', maxWidth: 820 }}>
        {TOOLS[tab].component}
      </Paper>
    </Box>
  )
}
