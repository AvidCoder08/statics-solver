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
import { MOI_SHAPES, solveAreaMOI, solveFrictionHorizontal, solveFrictionInclined } from '../solvers/unit4.js'

const N = (v) => parseFloat(v)

// ── Area MOI ─────────────────────────────────────────────────────────────────
function AreaMOITool() {
  const [shapes, setShapes] = useState([
    { type: 'rectangle', dims: { b: '0.2', h: '0.3' }, x0: '0', y0: '0', hole: false },
    { type: 'circle', dims: { r: '0.04' }, x0: '0.1', y0: '0.15', hole: true },
  ])
  const [refX, setRefX] = useState('0')
  const [refY, setRefY] = useState('0')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const updShape = (i, key, val) => setShapes((s) => s.map((r, j) => j === i ? { ...r, [key]: val } : r))
  const updDim = (i, key, val) => setShapes((s) => s.map((r, j) => j === i ? { ...r, dims: { ...r.dims, [key]: val } } : r))

  const calc = () => {
    setError(null)
    const parsed = shapes.map((s) => {
      const def = MOI_SHAPES[s.type]
      const dims = {}
      def.params.forEach((p) => { dims[p.key] = N(s.dims[p.key]) })
      return { type: s.type, dims, x0: N(s.x0), y0: N(s.y0), hole: s.hole }
    })
    if (parsed.some((s) => Object.values(s.dims).some(isNaN) || isNaN(s.x0) || isNaN(s.y0))) {
      setError('Fill in all shape values.'); return
    }
    setResult(solveAreaMOI(parsed, { x: N(refX) || 0, y: N(refY) || 0 }))
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#42474E', mb: 2 }}>
        Compute area second moments of inertia for composite sections using the parallel axis theorem.
        Set the reference axes (default = x=0, y=0).
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
        <TextField label="Reference x-axis (y = ?)" value={refY} onChange={(e) => setRefY(e.target.value)} sx={{ width: 200 }} helperText="Ix computed about y = this value" />
        <TextField label="Reference y-axis (x = ?)" value={refX} onChange={(e) => setRefX(e.target.value)} sx={{ width: 200 }} helperText="Iy computed about x = this value" />
      </Box>

      {shapes.map((s, i) => {
        const def = MOI_SHAPES[s.type]
        return (
          <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, borderColor: s.hole ? '#FFDAD6' : '#E0E3EA', bgcolor: s.hole ? '#FFF8F7' : '#FAFCFF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ color: s.hole ? '#8C1D18' : '#0054C8' }}>
                Part {i + 1}{s.hole ? ' — HOLE' : ''}
              </Typography>
              <IconButton size="small" onClick={() => setShapes((sh) => sh.filter((_, j) => j !== i))} disabled={shapes.length <= 1} sx={{ color: '#BA1A1A' }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <FormControl size="small" sx={{ minWidth: 260 }}>
                <InputLabel>Shape</InputLabel>
                <Select value={s.type} label="Shape" onChange={(e) => updShape(i, 'type', e.target.value)}>
                  {Object.entries(MOI_SHAPES).map(([k, d]) => <MenuItem key={k} value={k}>{d.label}</MenuItem>)}
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

      <Button startIcon={<AddIcon />} onClick={() => setShapes((s) => [...s, { type: 'rectangle', dims: { b: '', h: '' }, x0: '', y0: '', hole: false }])} sx={{ mb: 2 }}>
        Add Shape
      </Button>

      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      <Button variant="contained" startIcon={<CalculateIcon />} onClick={calc}>Calculate MOI</Button>

      {result && (
        <Box sx={{ mt: 3 }}>
          <ResultRow label="Ix (about reference x-axis)" value={result.result.Ix} unit="m⁴" />
          <ResultRow label="Iy (about reference y-axis)" value={result.result.Iy} unit="m⁴" />

          <Typography variant="subtitle2" sx={{ mt: 2.5, mb: 1 }}>Summary Table</Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: '#F0F5FF' } }}>
                  <TableCell>#</TableCell>
                  <TableCell>Shape</TableCell>
                  <TableCell align="right">A (m²)</TableCell>
                  <TableCell align="right">ycg</TableCell>
                  <TableCell align="right">Ix_cg</TableCell>
                  <TableCell align="right">dy</TableCell>
                  <TableCell align="right">Ix (ref)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.result.table.map((row) => (
                  <TableRow key={row.i}>
                    <TableCell>{row.i}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{row.label}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.75rem' }}>{row.A}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.75rem' }}>{row.ycg}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.75rem' }}>{row.Ix_cg}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.75rem' }}>{row.dy}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.75rem', fontWeight: 700 }}>{row.Ix_ref}</TableCell>
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

// ── Friction — Horizontal ────────────────────────────────────────────────────
function FrictionHorizontalTool() {
  const [W, setW] = useState('500')
  const [mu_s, setMuS] = useState('0.4')
  const [mu_k, setMuK] = useState('0.3')
  const [P, setP] = useState('180')
  const [result, setResult] = useState(null)

  const calc = () => {
    if ([W, mu_s, mu_k, P].some((v) => isNaN(N(v)))) return
    setResult(solveFrictionHorizontal({ W: N(W), mu_s: N(mu_s), mu_k: N(mu_k), P: N(P) }))
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#42474E', mb: 2 }}>
        Block on a flat horizontal surface. Enter weight, friction coefficients, and applied horizontal force P.
      </Typography>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        <TextField label="Weight W (N)" value={W} onChange={(e) => setW(e.target.value)} sx={{ width: 160 }} />
        <TextField label="μs (static)" value={mu_s} onChange={(e) => setMuS(e.target.value)} sx={{ width: 140 }} />
        <TextField label="μk (kinetic)" value={mu_k} onChange={(e) => setMuK(e.target.value)} sx={{ width: 140 }} />
        <TextField label="Applied force P (N)" value={P} onChange={(e) => setP(e.target.value)} sx={{ width: 175 }} />
      </Box>

      <Button variant="contained" startIcon={<CalculateIcon />} onClick={calc}>Solve</Button>

      {result && (
        <Box sx={{ mt: 3 }}>
          <ResultRow label="Normal force N" value={result.result.N} unit="N" />
          <ResultRow label="Max static friction F_s,max" value={result.result.F_s_max} unit="N" />
          <ResultRow label="Kinetic friction F_k" value={result.result.F_k} unit="N" />
          <ResultRow label="Actual friction force" value={result.result.friction} unit="N" />
          <ResultRow label="Status" value={result.result.status} />
          <Divider sx={{ my: 2 }} />
          <StepDisplay steps={result.steps} />
        </Box>
      )}
    </Box>
  )
}

// ── Friction — Inclined ──────────────────────────────────────────────────────
function FrictionInclinedTool() {
  const [W, setW] = useState('500')
  const [theta, setTheta] = useState('30')
  const [mu_s, setMuS] = useState('0.4')
  const [mu_k, setMuK] = useState('0.3')
  const [P, setP] = useState('0')
  const [result, setResult] = useState(null)

  const calc = () => {
    if ([W, theta, mu_s, mu_k, P].some((v) => isNaN(N(v)))) return
    setResult(solveFrictionInclined({ W: N(W), theta: N(theta), mu_s: N(mu_s), mu_k: N(mu_k), P: N(P) }))
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#42474E', mb: 2 }}>
        Block on an inclined plane. P is the force along the slope (positive = up the slope, 0 = no external force along slope).
      </Typography>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        <TextField label="Weight W (N)" value={W} onChange={(e) => setW(e.target.value)} sx={{ width: 160 }} />
        <TextField label="Incline θ (°)" value={theta} onChange={(e) => setTheta(e.target.value)} sx={{ width: 140 }} />
        <TextField label="μs (static)" value={mu_s} onChange={(e) => setMuS(e.target.value)} sx={{ width: 140 }} />
        <TextField label="μk (kinetic)" value={mu_k} onChange={(e) => setMuK(e.target.value)} sx={{ width: 140 }} />
        <TextField label="P along slope (N, ↑+)" value={P} onChange={(e) => setP(e.target.value)} sx={{ width: 195 }} />
      </Box>

      <Button variant="contained" startIcon={<CalculateIcon />} onClick={calc}>Solve</Button>

      {result && (
        <Box sx={{ mt: 3 }}>
          <ResultRow label="Normal force N" value={result.result.N} unit="N" />
          <ResultRow label="Weight component ∥ slope" value={result.result.Wslope} unit="N ↓slope" />
          <ResultRow label="Max static friction" value={result.result.F_s_max} unit="N" />
          <ResultRow label="Angle of friction φ" value={result.result.phi} unit="°" />
          <ResultRow label="Min P for equilibrium (P_min)" value={result.result.P_min} unit="N" />
          <ResultRow label="Max P for equilibrium (P_max)" value={result.result.P_max} unit="N" />
          <ResultRow label="Status" value={result.result.status} />
          <ResultRow label="Friction force f" value={result.result.friction} unit="N (+ = up slope)" />
          <Divider sx={{ my: 2 }} />
          <StepDisplay steps={result.steps} />
        </Box>
      )}
    </Box>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
const TOOLS = [
  { label: 'Area MOI (Composite)', component: <AreaMOITool /> },
  { label: 'Friction — Horizontal', component: <FrictionHorizontalTool /> },
  { label: 'Friction — Inclined', component: <FrictionInclinedTool /> },
]

export default function Unit4Page() {
  const [tab, setTab] = useState(0)
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" sx={{ color: '#8C1D18', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Unit 4</Typography>
        <Typography variant="h4" sx={{ color: '#1A1C1E', fontWeight: 700 }}>Area MOI & Friction</Typography>
        <Typography variant="body2" sx={{ color: '#42474E', mt: 0.5 }}>Second moments of area · Parallel axis theorem · Dry friction</Typography>
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
