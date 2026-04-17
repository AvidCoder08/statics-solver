import { useState } from 'react'
import {
  Box, Tabs, Tab, Typography, TextField, Button, IconButton,
  Grid, Divider, Alert, Paper
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import CalculateIcon from '@mui/icons-material/Calculate'
import { StepDisplay, ResultRow } from '../components/StepDisplay.jsx'
import { ForceSystemVisualizer, CoupleVisualizer } from '../components/MechanicsVisuals.jsx'
import { solveForceResultant, solveMoment, solveCouple, solveResultant2D } from '../solvers/unit1.js'

const NUM = (v) => parseFloat(v)
const valid = (...vals) => vals.every((v) => v !== '' && !isNaN(NUM(v)))

// ── Shared input grid for forces ─────────────────────────────────────────────
function ForceRow({ f, i, onChange, onDelete, showPos = false }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
      <Typography sx={{ minWidth: 24, color: '#535F70', fontWeight: 600, fontSize: '0.8rem' }}>
        F{i + 1}
      </Typography>
      <TextField label="Magnitude (N)" value={f.F} size="small"
        onChange={(e) => onChange(i, 'F', e.target.value)} sx={{ flex: 1 }} />
      <TextField label="Angle θ (°)" value={f.angle} size="small"
        onChange={(e) => onChange(i, 'angle', e.target.value)} sx={{ flex: 1 }} />
      {showPos && <>
        <TextField label="rx (m)" value={f.rx ?? ''} size="small"
          onChange={(e) => onChange(i, 'rx', e.target.value)} sx={{ flex: 1 }} />
        <TextField label="ry (m)" value={f.ry ?? ''} size="small"
          onChange={(e) => onChange(i, 'ry', e.target.value)} sx={{ flex: 1 }} />
      </>}
      <IconButton size="small" onClick={() => onDelete(i)} disabled={i === 0}
        sx={{ color: '#BA1A1A' }}><DeleteIcon fontSize="small" /></IconButton>
    </Box>
  )
}

// ────────────────────────────────────────────────────────────────────────────
function ForceResultantTool() {
  const [forces, setForces] = useState([{ F: '100', angle: '0' }, { F: '80', angle: '60' }])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const update = (i, key, val) => setForces((f) => f.map((r, j) => j === i ? { ...r, [key]: val } : r))
  const add = () => setForces((f) => [...f, { F: '', angle: '' }])
  const del = (i) => setForces((f) => f.filter((_, j) => j !== i))

  const calc = () => {
    setError(null)
    const parsed = forces.map((f) => ({ F: NUM(f.F), angle: NUM(f.angle) }))
    if (parsed.some((f) => isNaN(f.F) || isNaN(f.angle))) { setError('Fill in all force values.'); return }
    setResult(solveForceResultant(parsed))
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#42474E', mb: 2 }}>
        Enter concurrent forces in 2D. Angle is measured from the +x axis (CCW positive).
      </Typography>
      <ForceSystemVisualizer
        title="Force Polygon"
        forces={forces}
        onChange={setForces}
      />
      {forces.map((f, i) => <ForceRow key={i} f={f} i={i} onChange={update} onDelete={del} />)}
      <Button size="small" startIcon={<AddIcon />} onClick={add} sx={{ mb: 2 }}>Add Force</Button>
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      <Button variant="contained" startIcon={<CalculateIcon />} onClick={calc}>Calculate</Button>

      {result && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 1.5, color: '#1A1C1E' }}>Results</Typography>
          <ResultRow label="Rx" value={result.result.Rx} unit="N" />
          <ResultRow label="Ry" value={result.result.Ry} unit="N" />
          <ResultRow label="R (Resultant)" value={result.result.R} unit="N" />
          <ResultRow label="θ (from +x axis)" value={result.result.theta} unit="°" />
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#42474E' }}>Step-by-step Solution</Typography>
          <StepDisplay steps={result.steps} />
        </Box>
      )}
    </Box>
  )
}

// ────────────────────────────────────────────────────────────────────────────
function MomentTool() {
  const [entries, setEntries] = useState([{ F: '200', angle: '90', rx: '3', ry: '0' }])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const update = (i, key, val) => setEntries((e) => e.map((r, j) => j === i ? { ...r, [key]: val } : r))
  const add = () => setEntries((e) => [...e, { F: '', angle: '', rx: '', ry: '' }])
  const del = (i) => setEntries((e) => e.filter((_, j) => j !== i))

  const calc = () => {
    setError(null)
    const parsed = entries.map((e) => ({ F: NUM(e.F), angle: NUM(e.angle), rx: NUM(e.rx), ry: NUM(e.ry) }))
    if (parsed.some((e) => [e.F, e.angle, e.rx, e.ry].some(isNaN))) { setError('Fill in all values.'); return }
    setResult(solveMoment(parsed))
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#42474E', mb: 2 }}>
        Compute the moment of forces about the origin. rx and ry are the position vector components from the moment point to the force's point of application.
      </Typography>
      <ForceSystemVisualizer
        title="Moment Workspace"
        forces={entries}
        onChange={setEntries}
        showPosition
      />
      {entries.map((e, i) => <ForceRow key={i} f={e} i={i} onChange={update} onDelete={del} showPos />)}
      <Button size="small" startIcon={<AddIcon />} onClick={add} sx={{ mb: 2 }}>Add Force</Button>
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      <Button variant="contained" startIcon={<CalculateIcon />} onClick={calc}>Calculate</Button>

      {result && (
        <Box sx={{ mt: 3 }}>
          <ResultRow label="Total Moment" value={result.result.M} unit="N·m" />
          <ResultRow label="Direction" value={result.result.direction} />
          <Divider sx={{ my: 2 }} />
          <StepDisplay steps={result.steps} />
        </Box>
      )}
    </Box>
  )
}

// ────────────────────────────────────────────────────────────────────────────
function CoupleTool() {
  const [F, setF] = useState('150')
  const [d, setD] = useState('0.4')
  const [result, setResult] = useState(null)

  const calc = () => {
    if (!valid(F, d)) return
    setResult(solveCouple(NUM(F), NUM(d)))
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#42474E', mb: 2 }}>
        A couple consists of two equal, opposite, parallel forces. Enter one force magnitude and the perpendicular distance between them.
      </Typography>
      <CoupleVisualizer F={F} d={d} />
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField label="Force F (N)" value={F} onChange={(e) => setF(e.target.value)} sx={{ width: 180 }} />
        <TextField label="Perpendicular distance d (m)" value={d} onChange={(e) => setD(e.target.value)} sx={{ width: 220 }} />
      </Box>
      <Button variant="contained" startIcon={<CalculateIcon />} onClick={calc}>Calculate</Button>
      {result && (
        <Box sx={{ mt: 3 }}>
          <ResultRow label="Couple Moment C" value={result.result.C} unit="N·m" />
          <Divider sx={{ my: 2 }} />
          <StepDisplay steps={result.steps} />
        </Box>
      )}
    </Box>
  )
}

// ────────────────────────────────────────────────────────────────────────────
function Resultant2DTool() {
  const [forces, setForces] = useState([
    { F: '100', angle: '0', rx: '0', ry: '0' },
    { F: '80', angle: '90', rx: '2', ry: '0' },
  ])
  const [couples, setCouples] = useState([{ M: '50' }])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const updF = (i, k, v) => setForces((f) => f.map((r, j) => j === i ? { ...r, [k]: v } : r))
  const updC = (i, v) => setCouples((c) => c.map((r, j) => j === i ? { M: v } : r))

  const calc = () => {
    setError(null)
    const pf = forces.map((f) => ({ F: NUM(f.F), angle: NUM(f.angle), rx: NUM(f.rx), ry: NUM(f.ry) }))
    if (pf.some((f) => [f.F, f.angle, f.rx, f.ry].some(isNaN))) { setError('Fill all force values.'); return }
    const pm = couples.map((c) => ({ M: NUM(c.M) })).filter((c) => !isNaN(c.M))
    setResult(solveResultant2D(pf, pm))
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#42474E', mb: 2 }}>
        Reduce a 2D force system to a single resultant. Provide forces (with their points of application) and any applied couples.
      </Typography>
      <ForceSystemVisualizer
        title="Equivalent Force-Moment Workspace"
        forces={forces}
        onChange={setForces}
        showPosition
      />

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Forces</Typography>
      {forces.map((f, i) => <ForceRow key={i} f={f} i={i} onChange={updF} onDelete={(j) => setForces((fs) => fs.filter((_, k) => k !== j))} showPos />)}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setForces((f) => [...f, { F: '', angle: '', rx: '', ry: '' }])} sx={{ mb: 2 }}>Add Force</Button>

      <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>Applied Couples / Moments (N·m, CCW +)</Typography>
      {couples.map((c, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
          <TextField label={`M${i + 1} (N·m)`} value={c.M} size="small"
            onChange={(e) => updC(i, e.target.value)} sx={{ width: 180 }} />
          <IconButton size="small" onClick={() => setCouples((cs) => cs.filter((_, j) => j !== i))}
            disabled={couples.length === 1} sx={{ color: '#BA1A1A' }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setCouples((c) => [...c, { M: '' }])} sx={{ mb: 2 }}>Add Couple</Button>

      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      <Button variant="contained" startIcon={<CalculateIcon />} onClick={calc}>Calculate</Button>

      {result && (
        <Box sx={{ mt: 3 }}>
          <ResultRow label="Rx" value={result.result.Rx} unit="N" />
          <ResultRow label="Ry" value={result.result.Ry} unit="N" />
          <ResultRow label="R" value={result.result.R} unit="N" />
          <ResultRow label="θ (from +x)" value={result.result.theta} unit="°" />
          <ResultRow label="M_O (about origin)" value={result.result.Mo} unit="N·m" />
          <Divider sx={{ my: 2 }} />
          <StepDisplay steps={result.steps} />
        </Box>
      )}
    </Box>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
const TOOLS = [
  { label: 'Force Resultant', component: <ForceResultantTool /> },
  { label: 'Moment of a Force', component: <MomentTool /> },
  { label: 'Couple', component: <CoupleTool /> },
  { label: 'Resultant 2D System', component: <Resultant2DTool /> },
]

export default function Unit1Page() {
  const [tab, setTab] = useState(0)
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" sx={{ color: '#0054C8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Unit 1</Typography>
        <Typography variant="h4" sx={{ color: '#1A1C1E', fontWeight: 700 }}>Force Systems</Typography>
        <Typography variant="body2" sx={{ color: '#42474E', mt: 0.5 }}>Rectangular components · Moments · Couples · Resultants</Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          {TOOLS.map((t) => <Tab key={t.label} label={t.label} />)}
        </Tabs>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E0E3EA', maxWidth: 760 }}>
        {TOOLS[tab].component}
      </Paper>
    </Box>
  )
}
