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
import { BeamLoadVisualizer, ShearMomentChart, TrussVisualizer } from '../components/MechanicsVisuals.jsx'
import { buildShearBendingDiagram, solveBeamEquilibrium, solveTruss } from '../solvers/unit2.js'

const N = (v) => parseFloat(v)
const ok = (...vs) => vs.every((v) => v !== '' && !isNaN(parseFloat(v)))

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

// ── Beam Equilibrium ─────────────────────────────────────────────────────────
function BeamEquilibriumTool() {
  const [L, setL] = useState('6')
  const [beamType, setBeamType] = useState('simply_supported')
  const [supports, setSupports] = useState(supportPreset('simply_supported', 6))
  const [pointLoads, setPointLoads] = useState([
    { P: '20', x: '2', angle: '270' },
    { P: '40', x: '4', angle: '270' },
  ])
  const [udls, setUdls] = useState([])
  const [uvls, setUvls] = useState([])
  const [moments, setMoments] = useState([])
  const [xQuery, setXQuery] = useState('3')
  const [diagram, setDiagram] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const updPL = (i, k, v) => setPointLoads((p) => p.map((r, j) => j === i ? { ...r, [k]: v } : r))
  const updUDL = (i, k, v) => setUdls((u) => u.map((r, j) => j === i ? { ...r, [k]: v } : r))
  const updUVL = (i, k, v) => setUvls((u) => u.map((r, j) => j === i ? { ...r, [k]: v } : r))
  const updMom = (i, k, v) => setMoments((m) => m.map((r, j) => j === i ? { ...r, [k]: v } : r))
  const updSup = (i, k, v) => setSupports((s) => s.map((r, j) => j === i ? { ...r, [k]: v } : r))

  const calc = () => {
    setError(null)
    if (!ok(L)) { setError('Enter beam length.'); return }
    const pl = pointLoads.map((p) => ({ P: N(p.P), x: N(p.x), angle: N(p.angle ?? 270) }))
    if (pl.some((p) => isNaN(p.P) || isNaN(p.x))) { setError('Check point load values.'); return }
    const ud = udls.map((u) => ({ w: N(u.w), x1: N(u.x1), x2: N(u.x2) }))
    if (ud.some((u) => isNaN(u.w) || isNaN(u.x1) || isNaN(u.x2))) { setError('Check UDL values.'); return }
    const uv = uvls.map((u) => ({ w1: N(u.w1), w2: N(u.w2), x1: N(u.x1), x2: N(u.x2) }))
    if (uv.some((u) => isNaN(u.w1) || isNaN(u.w2) || isNaN(u.x1) || isNaN(u.x2))) { setError('Check UVL values.'); return }
    const mo = moments.map((m) => ({ M: N(m.M), x: N(m.x) }))
    const sups = supports.map((s, i) => ({
      id: (s.id || `S${i + 1}`).trim(),
      x: N(s.x),
      type: s.type,
    }))
    if (sups.some((s) => !s.id || isNaN(s.x))) { setError('Check support IDs and positions.'); return }
    const res = solveBeamEquilibrium({ L: N(L), pointLoads: pl, udls: ud, uvls: uv, moments: mo, supports: sups })
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
      moments: mo,
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
    const mo = moments.map((m) => ({ M: N(m.M), x: N(m.x) }))
    const sups = supports.map((s, i) => ({ id: (s.id || `S${i + 1}`).trim(), x: N(s.x), type: s.type }))
    setDiagram(buildShearBendingDiagram({
      L: N(L),
      pointLoads: pl,
      udls: ud,
      uvls: uv,
      moments: mo,
      supports: sups,
      reactions: result.result,
      xQuery: N(xQuery) || 0,
    }))
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Simply supported beam — pin at A (x=0), roller at B (x=L). Downward angle = 270°.
      </Typography>

      <BeamLoadVisualizer
        L={L}
        pointLoads={pointLoads}
        onPointLoadsChange={setPointLoads}
        supports={supports}
        onSupportsChange={setSupports}
        udls={udls}
        uvls={uvls}
        moments={moments}
        onMomentsChange={setMoments}
      />

      <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ width: 260 }}>
          <InputLabel>Beam Type Preset</InputLabel>
          <Select
            value={beamType}
            label="Beam Type Preset"
            onChange={(e) => {
              const type = e.target.value
              const len = N(L) || 6
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
          <IconButton size="small" onClick={() => setSupports((sp) => sp.filter((_, j) => j !== i))} disabled={supports.length <= 1} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setSupports((sp) => [...sp, { id: `S${sp.length + 1}`, x: '', type: 'rollerY' }])} sx={{ mb: 2 }}>Add Support</Button>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Point Loads</Typography>
      {pointLoads.map((p, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField label="Load P (N)" value={p.P} size="small" onChange={(e) => updPL(i, 'P', e.target.value)} sx={{ width: 130 }} />
          <TextField label="x from A (m)" value={p.x} size="small" onChange={(e) => updPL(i, 'x', e.target.value)} sx={{ width: 140 }} />
          <TextField label="Angle (°)" value={p.angle ?? '270'} size="small" onChange={(e) => updPL(i, 'angle', e.target.value)} sx={{ width: 110 }} />
          <IconButton size="small" onClick={() => setPointLoads((pl) => pl.filter((_, j) => j !== i))} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setPointLoads((pl) => [...pl, { P: '', x: '', angle: '270' }])} sx={{ mb: 2 }}>Add Load</Button>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Uniform Distributed Loads (UDL)</Typography>
      {udls.map((u, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField label="w (N/m)" value={u.w} size="small" onChange={(e) => updUDL(i, 'w', e.target.value)} sx={{ width: 120 }} />
          <TextField label="From x1 (m)" value={u.x1} size="small" onChange={(e) => updUDL(i, 'x1', e.target.value)} sx={{ width: 130 }} />
          <TextField label="To x2 (m)" value={u.x2} size="small" onChange={(e) => updUDL(i, 'x2', e.target.value)} sx={{ width: 130 }} />
          <IconButton size="small" onClick={() => setUdls((ud) => ud.filter((_, j) => j !== i))} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setUdls((u) => [...u, { w: '', x1: '', x2: '' }])} sx={{ mb: 2 }}>Add UDL</Button>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Uniformly Varying Loads (UVL)</Typography>
      {uvls.map((u, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField label="w1 (N/m)" value={u.w1} size="small" onChange={(e) => updUVL(i, 'w1', e.target.value)} sx={{ width: 120 }} />
          <TextField label="w2 (N/m)" value={u.w2} size="small" onChange={(e) => updUVL(i, 'w2', e.target.value)} sx={{ width: 120 }} />
          <TextField label="From x1 (m)" value={u.x1} size="small" onChange={(e) => updUVL(i, 'x1', e.target.value)} sx={{ width: 130 }} />
          <TextField label="To x2 (m)" value={u.x2} size="small" onChange={(e) => updUVL(i, 'x2', e.target.value)} sx={{ width: 130 }} />
          <IconButton size="small" onClick={() => setUvls((ul) => ul.filter((_, j) => j !== i))} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setUvls((u) => [...u, { w1: '', w2: '', x1: '', x2: '' }])} sx={{ mb: 2 }}>Add UVL</Button>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Applied Moments (CCW +)</Typography>
      {moments.map((m, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
          <TextField label="M (N·m)" value={m.M} size="small" onChange={(e) => updMom(i, 'M', e.target.value)} sx={{ width: 130 }} />
          <TextField label="x from A (m)" value={m.x} size="small" onChange={(e) => updMom(i, 'x', e.target.value)} sx={{ width: 140 }} />
          <IconButton size="small" onClick={() => setMoments((ms) => ms.filter((_, j) => j !== i))} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => setMoments((m) => [...m, { M: '', x: '' }])} sx={{ mb: 2 }}>Add Moment</Button>

      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      <Button variant="contained" startIcon={<CalculateIcon />} onClick={calc}>Calculate Reactions</Button>

      {result && (
        <Box sx={{ mt: 3 }}>
          {Object.entries(result.result)
            .filter(([k]) => /^(R|M)/.test(k) && !['RAx', 'RAy', 'RB'].includes(k))
            .map(([k, v]) => <ResultRow key={k} label={k} value={v} unit={k.startsWith('M') ? 'N·m' : 'N'} />)}

          {(!result.result || Object.entries(result.result).filter(([k]) => /^(R|M)/.test(k) && !['RAx', 'RAy', 'RB'].includes(k)).length === 0) && (
            <>
              <ResultRow label="RAx (horizontal at A)" value={result.result.RAx} unit="N" />
              <ResultRow label="RAy (vertical at A)" value={result.result.RAy} unit="N" />
              <ResultRow label="RB (vertical at B)" value={result.result.RB} unit="N" />
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
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Define your truss geometry, members, supports, and loads. A sample triangular truss is pre-loaded.
        For sign convention: <strong>positive force = Tension, negative = Compression</strong>. Loads: Fy negative = downward.
      </Typography>

      <TrussVisualizer
        nodes={nodes}
        onNodesChange={setNodes}
        members={members}
        loads={loads}
        onLoadsChange={setLoads}
      />

      {/* Nodes */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Nodes</Typography>
      {nodes.map((n, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
          <TextField label="Node ID" value={n.id} size="small" onChange={(e) => updNode(i, 'id', e.target.value)} sx={{ width: 90 }} />
          <TextField label="x (m)" value={n.x} size="small" onChange={(e) => updNode(i, 'x', e.target.value)} sx={{ width: 110 }} />
          <TextField label="y (m)" value={n.y} size="small" onChange={(e) => updNode(i, 'y', e.target.value)} sx={{ width: 110 }} />
          <IconButton size="small" onClick={() => setNodes((ns) => ns.filter((_, j) => j !== i))} disabled={nodes.length <= 2} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></IconButton>
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
          <IconButton size="small" onClick={() => setMembers((ms) => ms.filter((_, j) => j !== i))} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></IconButton>
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
          <IconButton size="small" onClick={() => setSupports((ss) => ss.filter((_, j) => j !== i))} disabled={supports.length <= 1} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></IconButton>
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
          <IconButton size="small" onClick={() => setLoads((ls) => ls.filter((_, j) => j !== i))} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></IconButton>
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
              <TableRow sx={{ '& th': { bgcolor: 'surfaceVariant' } }}>
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
                        bgcolor: m.type === 'Tension' ? '#C6F0D8' : m.type === 'Compression' ? '#FFDAD6' : 'surfaceVariant',
                        color: m.type === 'Tension' ? '#006E2C' : m.type === 'Compression' ? '#8C1D18' : 'text.secondary',
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
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>Equilibrium & Structures</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Simply supported beams · Plane trusses · Method of Joints</Typography>
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          {TOOLS.map((t) => <Tab key={t.label} label={t.label} />)}
        </Tabs>
      </Box>
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', maxWidth: 820 }}>
        {TOOLS[tab].component}
      </Paper>
    </Box>
  )
}
