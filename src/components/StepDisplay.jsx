import { Box, Typography, Paper, Divider, Alert } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

// Renders an array of step objects from solver functions
export function StepDisplay({ steps }) {
  if (!steps || steps.length === 0) return null

  return (
    <Box sx={{ mt: 0 }}>
      {steps.map((step, i) => {
        if (step.type === 'header') {
          return (
            <Box key={i} sx={{ mt: i === 0 ? 0 : 2.5, mb: 1 }}>
              <Typography variant="subtitle2" sx={{
                color: '#0054C8', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.72rem',
              }}>
                {step.text}
              </Typography>
              <Divider sx={{ mt: 0.5, borderColor: '#D7E3FF' }} />
            </Box>
          )
        }
        if (step.type === 'note') {
          return (
            <Typography key={i} variant="body2" sx={{
              color: '#42474E', mb: 0.75, fontStyle: 'italic',
              pl: 1, borderLeft: '3px solid #D7E3FF',
            }}>
              {step.text}
            </Typography>
          )
        }
        if (step.type === 'ok') {
          return (
            <Alert key={i} icon={<CheckCircleIcon />} severity="success" sx={{ mb: 1, borderRadius: 2, '& .MuiAlert-message': { fontFamily: '"Roboto Mono", monospace', fontSize: '0.82rem' } }}>
              {step.lines.map((l, j) => <div key={j}>{l}</div>)}
            </Alert>
          )
        }
        if (step.type === 'warn') {
          return (
            <Alert key={i} icon={<WarningAmberIcon />} severity="warning" sx={{ mb: 1, borderRadius: 2, '& .MuiAlert-message': { fontFamily: '"Roboto Mono", monospace', fontSize: '0.82rem' } }}>
              {step.lines.map((l, j) => <div key={j}>{l}</div>)}
            </Alert>
          )
        }
        if (step.type === 'result') {
          return (
            <Paper key={i} variant="outlined" sx={{
              p: 1.5, mb: 1.5, borderRadius: 2,
              borderColor: '#0054C8', bgcolor: '#F0F5FF',
            }}>
              {step.lines.map((l, j) => (
                <Typography key={j} sx={{
                  fontFamily: '"Roboto Mono", monospace',
                  fontSize: '0.875rem', fontWeight: 600, color: '#003E9C', lineHeight: 1.8,
                }}>
                  {l}
                </Typography>
              ))}
            </Paper>
          )
        }
        // default: type === 'calc'
        return (
          <Box key={i} sx={{ mb: 1.25 }}>
            {step.label && (
              <Typography variant="caption" sx={{
                color: '#535F70', fontWeight: 600, display: 'block', mb: 0.25,
                fontFamily: '"Google Sans", sans-serif',
              }}>
                {step.label}
              </Typography>
            )}
            <Paper variant="outlined" sx={{ px: 1.5, py: 1, borderRadius: 2, bgcolor: '#FAFCFF', borderColor: '#E0E3EA' }}>
              {step.lines?.map((l, j) => (
                <Typography key={j} sx={{
                  fontFamily: '"Roboto Mono", monospace',
                  fontSize: '0.8125rem', color: '#1A1C1E', lineHeight: 1.9,
                  whiteSpace: 'pre-wrap',
                }}>
                  {l}
                </Typography>
              ))}
            </Paper>
          </Box>
        )
      })}
    </Box>
  )
}

// ── Result Chip row ──────────────────────────────────────────────────────────
export function ResultRow({ label, value, unit = '' }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      px: 2, py: 1, bgcolor: '#F0F5FF', borderRadius: 2, mb: 0.75,
      border: '1px solid #C5D5E8',
    }}>
      <Typography variant="body2" sx={{ fontWeight: 500, color: '#42474E' }}>{label}</Typography>
      <Typography sx={{
        fontFamily: '"Roboto Mono", monospace', fontWeight: 700,
        color: '#003E9C', fontSize: '0.9rem',
      }}>
        {value} <span style={{ fontWeight: 400, color: '#535F70', fontSize: '0.8rem' }}>{unit}</span>
      </Typography>
    </Box>
  )
}
