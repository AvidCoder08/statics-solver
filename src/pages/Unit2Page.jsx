import { useState } from 'react'
import {
  Box, Tabs, Tab, Typography, TextField, Button, IconButton,
  Divider, Alert, Paper, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableBody, TableRow, TableCell, Chip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import CalculateIcon from '@mui/icons-material/Calculate'
import { StepDisplay, ResultRow } from '../components/StepDisplay.jsx'
import { BeamVisualizer, TrussVisualizer } from '../components/Visualizations.jsx'
import { solveBeamEquilibrium, solveTruss } from '../solvers/unit2.js'

const N = (v) => parseFloat(v)
const ok = (...vs) => vs.every((v) => v !== '' && !isNaN(parseFloat(v)))

// ── Beam Equilibrium ─────────────────────────────────────────────────────────
function BeamEquilibriumTool() {
  const [L, setL] = useState('6')
  const [pointLoads, setPointLoads] = useState([
    { P: '20', x: '2', angle: '270' },
    { P: '40', x: '4', angle: '270' },
  ])
  const [udls, setUdls] = useState([])
  const [moments, setMoments] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const updPL = (i, k, v) => setPointLoads((p) => p.map((r, j) => j === i ? { ...r, [k]: v } : r))
  const updUDL = (i, k, v) => setUdls((u) => u.map((r, j) => j === i ? { ...r, [k]: v } : r))
  const updMom = (i, k, v) => setMoments((m) => m.map((r, j) => j === i ? { ...r, [k]: v } : r))

  const calc = () => {
    setError(null)
    if (!ok(L)) { setError('Enter beam length.'); return }
    const pl = pointLoads.map((p) => ({ P: N(p.P), x: N(p.x), angle: N(p.angle ?? 270) }))
    if (pl.some((p) => isNaN(p.P) || isNaN(p.x))) { setError('Check point load values.'); return }
    const ud = udls.map((u) => ({ w: N(u.w), x1: N(u.x1), x2: N(u.x2) }))
    if (ud.some((u) => isNaN(u.w) || isNaN(u.x1) || isNaN(u.x2))) { setError('Check UDL values.'); return }
    const mo = moments.map((m) => ({ M: N(m.M), x: N(m.x) }))
    setResult(solveBeamEquilibrium({ L: N(L), pointLoads: pl, udls: ud, moments: mo }))
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#42474E', mb: 2 }}>
        Simply supported beam — pin at A (x=0), roller at B (x=L). Downward angle = 270°.
      </Typography>

      <BeamVisualizer
        L={L}
        pointLoads={pointLoads}
        udls={udls}
        moments={moments}
        reactions={result?.result ?? null}
        title="Interactive Beam FBD"
        onPointLoadMove={(i, x) => updPL(i, 'x', x.toFixed(3))}
        onMomentMove={(i, x) => updMom(i, 'x', x.toFixed(3))}
      />

      <TextField label="Beam length L (m)" value={L} onChange={(e) => setL(e.target.value)} sx={{ mb: 2, width: 200 }} />

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Point Loads</Typography>
      {pointLoads.map((p, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField label="Load P (N)" value={p.P} size="small" onChange={(e) => updPL(i, 'P', e.target.value)} sx={{ width: 130 }} />
          <TextField label="x from A (m)" value={p.x} size="small" onChange={(e) => updPL(i, 'x', e.target.value)} sx={{ width: 140 }} />
          <TextField label="Angle (°)" value={p.angle ?? '270'} size="small" onChange={(e) => updPL(i, 'angle', e.target.value)} sx={{ width: 110 }} />
          <IconButton size="small" onClick={() => setPointLoads((pl) => pl.filter((_, j) => j !== i))} sx={{ color: '#BA1A1A' }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setPointLoads((pl) => [...pl, { P: '', x: '', angle: '270' }])} sx={{ mb: 2 }}>Add Load</Button>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Uniform Distributed Loads (UDL)</Typography>
      {udls.map((u, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField label="w (N/m)" value={u.w} size="small" onChange={(e) => updUDL(i, 'w', e.target.value)} sx={{ width: 120 }} />
          <TextField label="From x1 (m)" value={u.x1} size="small" onChange={(e) => updUDL(i, 'x1', e.target.value)} sx={{ width: 130 }} />
          <TextField label="To x2 (m)" value={u.x2} size="small" onChange={(e) => updUDL(i, 'x2', e.target.value)} sx={{ width: 130 }} />
          <IconButton size="small" onClick={() => setUdls((ud) => ud.filter((_, j) => j !== i))} sx={{ color: '#BA1A1A' }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setUdls((u) => [...u, { w: '', x1: '', x2: '' }])} sx={{ mb: 2 }}>Add UDL</Button>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Applied Moments (CCW +)</Typography>
      {moments.map((m, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
          <TextField label="M (N·m)" value={m.M} size="small" onChange={(e) => updMom(i, 'M', e.target.value)} sx={{ width: 130 }} />
          <TextField label="x from A (m)" value={m.x} size="small" onChange={(e) => updMom(i, 'x', e.target.value)} sx={{ width: 140 }} />
          <IconButton size="small" onClick={() => setMoments((ms) => ms.filter((_, j) => j !== i))} sx={{ color: '#BA1A1A' }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setMoments((m) => [...m, { M: '', x: '' }])} sx={{ mb: 2 }}>Add Moment</Button>

      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      <Button variant="contained" startIcon={<CalculateIcon />} onClick={calc}>Calculate Reactions</Button>

      {result && (
        <Box sx={{ mt: 3 }}>
          <ResultRow label="RAx (horizontal at A)" value={result.result.RAx} unit="N" />
          <ResultRow label="RAy (vertical at A)" value={result.result.RAy} unit="N" />
          <ResultRow label="RB (vertical at B)" value={result.result.RB} unit="N" />
          <Divider sx={{ my: 2 }} />
          <StepDisplay steps={result.steps} />
        </Box>
      )}
    </Box>
  )
}

// ── Truss — Method of Joints ─────────────────────────────────────────────────
const DEFAULT_NODES = [
  { id: 'A', x: '0', y: '0' },
  { id: 'B', x: '3', y: '0' },
  { id: 'C', x: '6', y: '0' },
  { id: 'D', x: '3', y: '3' },
]
const DEFAULT_MEMBERS = [
  { id: 'AB', nodeA: 'A', nodeB: 'B' },
  { id: 'BC', nodeA: 'B', nodeB: 'C' },
  { id: 'AD', nodeA: 'A', nodeB: 'D' },
  { id: 'BD', nodeA: 'B', nodeB: 'D' },
  { id: 'CD', nodeA: 'C', nodeB: 'D' },
]
const DEFAULT_SUPPORTS = [
  { nodeId: 'A', type: 'pin' },
  { nodeId: 'C', type: 'rollerY' },
]
const DEFAULT_LOADS = [{ nodeId: 'D', Fx: '0', Fy: '-30000' }]

function TrussJointsTool() {
  const [nodes, setNodes] = useState(DEFAULT_NODES)
  const [members, setMembers] = useState(DEFAULT_MEMBERS)
  const [supports, setSupports] = useState(DEFAULT_SUPPORTS)
  const [loads, setLoads] = useState(DEFAULT_LOADS)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const nodeIds = nodes.map((n) => n.id)

  const updNode = (i, k, v) => setNodes((n) => n.map((r, j) => j === i ? { ...r, [k]: v } : r))
  const updMem = (i, k, v) => setMembers((m) => m.map((r, j) => j === i ? { ...r, [k]: v } : r))
  const updSup = (i, k, v) => setSupports((s) => s.map((r, j) => j === i ? { ...r, [k]: v } : r))
  const updLoad = (i, k, v) => setLoads((l) => l.map((r, j) => j === i ? { ...r, [k]: v } : r))

  const calc = () => {
    setError(null)
    const n = nodes.map((nd) => ({ id: nd.id, x: N(nd.x), y: N(nd.y) }))
    const m = members.map((mb) => ({ id: mb.id, nodeA: mb.nodeA, nodeB: mb.nodeB }))
    const s = supports.map((sp) => ({ nodeId: sp.nodeId, type: sp.type }))
    const l = loads.map((ld) => ({ nodeId: ld.nodeId, Fx: N(ld.Fx || '0'), Fy: N(ld.Fy || '0') }))
    if (n.some((nd) => isNaN(nd.x) || isNaN(nd.y))) { setError('Check node coordinates.'); return }
    const res = solveTruss({ nodes: n, members: m, supports: s, loads: l })
    if (res.error) setError(res.error)
    setResult(res)
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#42474E', mb: 2 }}>
        Define your truss geometry, members, supports, and loads. A sample triangular truss is pre-loaded.
        For sign convention: <strong>positive force = Tension, negative = Compression</strong>. Loads: Fy negative = downward.
      </Typography>

      <TrussVisualizer
        nodes={nodes}
        members={members}
        loads={loads}
        memberResults={result?.result ?? null}
        title="Interactive Truss Diagram"
        onLoadMove={(i, fx, fy) => {
          updLoad(i, 'Fx', fx.toFixed(0))
          updLoad(i, 'Fy', fy.toFixed(0))
        }}
      />

      {/* Nodes */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Nodes</Typography>
      {nodes.map((n, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
          <TextField label="Node ID" value={n.id} size="small" onChange={(e) => updNode(i, 'id', e.target.value)} sx={{ width: 90 }} />
          <TextField label="x (m)" value={n.x} size="small" onChange={(e) => updNode(i, 'x', e.target.value)} sx={{ width: 110 }} />
          <TextField label="y (m)" value={n.y} size="small" onChange={(e) => updNode(i, 'y', e.target.value)} sx={{ width: 110 }} />
          <IconButton size="small" onClick={() => setNodes((ns) => ns.filter((_, j) => j !== i))} disabled={nodes.length <= 2} sx={{ color: '#BA1A1A' }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setNodes((ns) => [...ns, { id: '', x: '', y: '' }])} sx={{ mb: 2 }}>Add Node</Button>

      {/* Members */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Members</Typography>
      {members.map((m, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
          <TextField label="Member ID" value={m.id} size="small" onChange={(e) => updMem(i, 'id', e.target.value)} sx={{ width: 100 }} />
          <FormControl size="small" sx={{ width: 120 }}>
            <InputLabel>Node A</InputLabel>
            <Select value={m.nodeA} label="Node A" onChange={(e) => updMem(i, 'nodeA', e.target.value)}>
              {nodeIds.map((id) => <MenuItem key={id} value={id}>{id}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: 120 }}>
            <InputLabel>Node B</InputLabel>
            <Select value={m.nodeB} label="Node B" onChange={(e) => updMem(i, 'nodeB', e.target.value)}>
              {nodeIds.map((id) => <MenuItem key={id} value={id}>{id}</MenuItem>)}
            </Select>
          </FormControl>
          <IconButton size="small" onClick={() => setMembers((ms) => ms.filter((_, j) => j !== i))} sx={{ color: '#BA1A1A' }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setMembers((ms) => [...ms, { id: '', nodeA: nodeIds[0] ?? '', nodeB: nodeIds[1] ?? '' }])} sx={{ mb: 2 }}>Add Member</Button>

      {/* Supports */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Supports</Typography>
      {supports.map((s, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ width: 130 }}>
            <InputLabel>Node</InputLabel>
            <Select value={s.nodeId} label="Node" onChange={(e) => updSup(i, 'nodeId', e.target.value)}>
              {nodeIds.map((id) => <MenuItem key={id} value={id}>{id}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: 160 }}>
            <InputLabel>Type</InputLabel>
            <Select value={s.type} label="Type" onChange={(e) => updSup(i, 'type', e.target.value)}>
              <MenuItem value="pin">Pin (Rx + Ry)</MenuItem>
              <MenuItem value="rollerY">Roller ↕ (Ry only)</MenuItem>
              <MenuItem value="rollerX">Roller ↔ (Rx only)</MenuItem>
            </Select>
          </FormControl>
          <IconButton size="small" onClick={() => setSupports((ss) => ss.filter((_, j) => j !== i))} disabled={supports.length <= 1} sx={{ color: '#BA1A1A' }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setSupports((ss) => [...ss, { nodeId: nodeIds[0] ?? '', type: 'rollerY' }])} sx={{ mb: 2 }}>Add Support</Button>

      {/* Loads */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>External Loads at Joints</Typography>
      {loads.map((l, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ width: 130 }}>
            <InputLabel>At Node</InputLabel>
            <Select value={l.nodeId} label="At Node" onChange={(e) => updLoad(i, 'nodeId', e.target.value)}>
              {nodeIds.map((id) => <MenuItem key={id} value={id}>{id}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Fx (N)" value={l.Fx} size="small" onChange={(e) => updLoad(i, 'Fx', e.target.value)} sx={{ width: 120 }} />
          <TextField label="Fy (N, neg=↓)" value={l.Fy} size="small" onChange={(e) => updLoad(i, 'Fy', e.target.value)} sx={{ width: 140 }} />
          <IconButton size="small" onClick={() => setLoads((ls) => ls.filter((_, j) => j !== i))} sx={{ color: '#BA1A1A' }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setLoads((ls) => [...ls, { nodeId: nodeIds[0] ?? '', Fx: '0', Fy: '0' }])} sx={{ mb: 2 }}>Add Load</Button>

      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      <Button variant="contained" startIcon={<CalculateIcon />} onClick={calc}>Solve Truss</Button>

      {result?.result && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Member Forces</Typography>
          <Table size="small" sx={{ mb: 3 }}>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#F0F5FF' } }}>
                <TableCell>Member</TableCell>
                <TableCell>Nodes</TableCell>
                <TableCell align="right">Force (N)</TableCell>
                <TableCell align="center">Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.result.members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{m.id}</TableCell>
                  <TableCell sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.8rem' }}>{m.nodeA}–{m.nodeB}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 600 }}>
                    {Number(m.force).toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={m.type} size="small"
                      sx={{
                        bgcolor: m.type === 'Tension' ? '#C6F0D8' : m.type === 'Compression' ? '#FFDAD6' : '#E0E3EA',
                        color: m.type === 'Tension' ? '#006E2C' : m.type === 'Compression' ? '#8C1D18' : '#42474E',
                        fontWeight: 700, fontSize: '0.72rem', borderRadius: 1.5,
                      }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>Support Reactions</Typography>
          {Object.entries(result.result.reactions).map(([nodeId, r]) => (
            <Box key={nodeId}>
              <ResultRow label={`Node ${nodeId} — Rx`} value={Number(r.Rx).toFixed(4)} unit="N" />
              <ResultRow label={`Node ${nodeId} — Ry`} value={Number(r.Ry).toFixed(4)} unit="N" />
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />
          <StepDisplay steps={result.steps} />
        </Box>
      )}
    </Box>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
const TOOLS = [
  { label: 'Beam Equilibrium', component: <BeamEquilibriumTool /> },
  { label: 'Method of Joints', component: <TrussJointsTool /> },
]

export default function Unit2Page() {
  const [tab, setTab] = useState(0)
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" sx={{ color: '#006E2C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Unit 2</Typography>
        <Typography variant="h4" sx={{ color: '#1A1C1E', fontWeight: 700 }}>Equilibrium & Structures</Typography>
        <Typography variant="body2" sx={{ color: '#42474E', mt: 0.5 }}>Simply supported beams · Plane trusses · Method of Joints</Typography>
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
