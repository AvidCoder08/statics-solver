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
import { CompositeAreaVisualizer, BeamLoadVisualizer } from '../components/MechanicsVisuals.jsx'
import { SHAPE_DEFS, solveCentroid } from '../solvers/unit3.js'
import { solveBeamEquilibrium } from '../solvers/unit2.js'

const N = (v) => parseFloat(v)

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
  const [pointLoads, setPointLoads] = useState([
    { P: '15000', x: '2', angle: '270' },
    { P: '25000', x: '5', angle: '270' },
  ])
  const [udls, setUdls] = useState([{ w: '10000', x1: '4', x2: '8' }])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const updPL = (i, k, v) => setPointLoads((p) => p.map((r, j) => j === i ? { ...r, [k]: v } : r))
  const updUDL = (i, k, v) => setUdls((u) => u.map((r, j) => j === i ? { ...r, [k]: v } : r))

  const calc = () => {
    setError(null)
    if (!L || isNaN(N(L))) { setError('Enter beam length.'); return }
    const pl = pointLoads.map((p) => ({ P: N(p.P), x: N(p.x), angle: N(p.angle ?? 270) }))
    const ud = udls.map((u) => ({ w: N(u.w), x1: N(u.x1), x2: N(u.x2) }))
    if (pl.some((p) => isNaN(p.P) || isNaN(p.x))) { setError('Check point load values.'); return }
    if (ud.some((u) => isNaN(u.w) || isNaN(u.x1) || isNaN(u.x2))) { setError('Check UDL values.'); return }
    setResult(solveBeamEquilibrium({ L: N(L), pointLoads: pl, udls: ud }))
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
        udls={udls}
        moments={[]}
      />

      <TextField label="Beam length L (m)" value={L} onChange={(e) => setL(e.target.value)} sx={{ mb: 2, width: 200 }} />

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

      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      <Button variant="contained" startIcon={<CalculateIcon />} onClick={calc}>Calculate Reactions</Button>

      {result && (
        <Box sx={{ mt: 3 }}>
          <ResultRow label="RAy (at A)" value={result.result.RAy} unit="N" />
          <ResultRow label="RB (at B)" value={result.result.RB} unit="N" />
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
