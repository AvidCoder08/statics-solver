import { useNavigate } from 'react-router-dom'
import { Box, Typography, Grid, Card, CardActionArea, CardContent, Chip, Stack, Link } from '@mui/material'
import BoltIcon from '@mui/icons-material/Bolt'
import BalanceIcon from '@mui/icons-material/Balance'
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import InstagramIcon from '@mui/icons-material/Instagram'
import GitHubIcon from '@mui/icons-material/GitHub'
import LinkedInIcon from '@mui/icons-material/LinkedIn'

const UNITS = [
  {
    label: 'Unit 1', path: '/unit1', icon: <BoltIcon sx={{ fontSize: 28 }} />,
    title: 'Force Systems',
    desc: 'Resolve forces, compute resultants, calculate moments and couples.',
    tools: ['Force Resultant', 'Moment Calculator', 'Couple', 'Resultants 2D'],
    color: '#0054C8', bg: '#D7E3FF', iconBg: '#0054C8',
  },
  {
    label: 'Unit 2', path: '/unit2', icon: <BalanceIcon sx={{ fontSize: 28 }} />,
    title: 'Equilibrium & Structures',
    desc: 'Check equilibrium conditions and analyse plane trusses by method of joints.',
    tools: ['2D Equilibrium', 'Method of Joints', 'Truss Solver'],
    color: '#006E2C', bg: '#C6F0D8', iconBg: '#006E2C',
  },
  {
    label: 'Unit 3', path: '/unit3', icon: <CenterFocusStrongIcon sx={{ fontSize: 28 }} />,
    title: 'Distributed Forces',
    desc: 'Find centroids of composite areas and compute beam reactions.',
    tools: ['Centroid (Composite)', 'Beam Reactions', 'SFD/BMD (basic)'],
    color: '#7D3B00', bg: '#FFDDB8', iconBg: '#7D3B00',
  },
  {
    label: 'Unit 4', path: '/unit4', icon: <FitnessCenterIcon sx={{ fontSize: 28 }} />,
    title: 'Area MOI & Friction',
    desc: 'Compute area moments of inertia for composite sections and solve friction problems.',
    tools: ['Area MOI', 'Friction (Horizontal)', 'Friction (Inclined)'],
    color: '#8C1D18', bg: '#FFDAD6', iconBg: '#8C1D18',
  },
]

export default function Home() {
  const navigate = useNavigate()
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.75 }}>
          Engineering Mechanics
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 520 }}>
          Solve problems, verify manual answers step-by-step.
          Covers all 4 units of your statics syllabus.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {UNITS.map((u) => (
          <Grid item xs={12} sm={6} key={u.path}>
            <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardActionArea onClick={() => navigate(u.path)} sx={{ height: '100%', p: 0.5 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: 3,
                      bgcolor: u.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', flexShrink: 0,
                    }}>
                      {u.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: u.color, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {u.label}
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'text.primary', lineHeight: 1.2 }}>
                        {u.title}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.6 }}>
                    {u.desc}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {u.tools.map((t) => (
                      <Chip key={t} label={t} size="small"
                        sx={{ bgcolor: u.bg, color: u.color, fontWeight: 600, fontSize: '0.72rem', borderRadius: 2 }} />
                    ))}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, p: 2.5, bgcolor: 'surfaceVariant', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ color: 'primary.main', mb: 0.5 }}>How to use</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
          Pick a unit → select a tool → enter your values → click <strong>Calculate</strong>.
          Each solution is broken down step-by-step so you can check every line of your manual work.
        </Typography>
      </Box>

      <Box sx={{ mt: 2, p: 2.5, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(249,189,103,0.12)' : '#FFF7EA', borderRadius: 3, border: '1px solid', borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(249,189,103,0.35)' : '#F0D8AE' }}>
        <Typography variant="subtitle2" sx={{ color: (t) => t.palette.mode === 'dark' ? '#F9BD67' : '#7D3B00', mb: 0.5 }}>About</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
          Made with {'💙'} by Shashank Munnangi (notacoder08)
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1.5 }}>
          <Link
            href="https://instagram.com/notacoder08"
            target="_blank"
            rel="noopener noreferrer"
            underline="none"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, color: (t) => t.palette.mode === 'dark' ? '#F9BD67' : '#7D3B00', fontWeight: 600 }}
          >
            <InstagramIcon fontSize="small" /> Instagram
          </Link>
          <Link
            href="https://github.com/AvidCoder08"
            target="_blank"
            rel="noopener noreferrer"
            underline="none"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, color: (t) => t.palette.mode === 'dark' ? '#F9BD67' : '#7D3B00', fontWeight: 600 }}
          >
            <GitHubIcon fontSize="small" /> GitHub
          </Link>
          <Link
            href="https://www.linkedin.com/in/shashankmunnangi/"
            target="_blank"
            rel="noopener noreferrer"
            underline="none"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, color: (t) => t.palette.mode === 'dark' ? '#F9BD67' : '#7D3B00', fontWeight: 600 }}
          >
            <LinkedInIcon fontSize="small" /> LinkedIn
          </Link>
        </Stack>
      </Box>
    </Box>
  )
}
