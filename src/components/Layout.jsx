import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton,
  Divider, useMediaQuery, useTheme, Tooltip
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import HomeIcon from '@mui/icons-material/Home'
import BoltIcon from '@mui/icons-material/Bolt'
import BalanceIcon from '@mui/icons-material/Balance'
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto'

const DRAWER_WIDTH = 264

const NAV_ITEMS = [
  { label: 'Home', path: '/', icon: <HomeIcon /> },
  {
    label: 'Unit 1', path: '/unit1', icon: <BoltIcon />,
    subtitle: 'Force Systems',
    colorLight: '#1B4F9A',
    colorDark: '#ADC6FF',
    bgLight: '#D7E3FF',
    bgDark: 'rgba(74,143,255,0.22)',
  },
  {
    label: 'Unit 2', path: '/unit2', icon: <BalanceIcon />,
    subtitle: 'Equilibrium & Trusses',
    colorLight: '#1B6E4A',
    colorDark: '#7FDB9A',
    bgLight: '#C6F0D8',
    bgDark: 'rgba(126,230,170,0.2)',
  },
  {
    label: 'Unit 3', path: '/unit3', icon: <CenterFocusStrongIcon />,
    subtitle: 'Distributed Forces',
    colorLight: '#7D3B00',
    colorDark: '#FFD39A',
    bgLight: '#FFDDB8',
    bgDark: 'rgba(249,189,103,0.2)',
  },
  {
    label: 'Unit 4', path: '/unit4', icon: <FitnessCenterIcon />,
    subtitle: 'MOI & Friction',
    colorLight: '#6B1B1B',
    colorDark: '#FFB4AB',
    bgLight: '#FFDAD6',
    bgDark: 'rgba(255,180,171,0.18)',
  },
]

function getThemeMeta(themePreference) {
  if (themePreference === 'light') {
    return { icon: <LightModeIcon fontSize="small" />, label: 'Light mode' }
  }
  if (themePreference === 'dark') {
    return { icon: <DarkModeIcon fontSize="small" />, label: 'Dark mode' }
  }
  return { icon: <BrightnessAutoIcon fontSize="small" />, label: 'Auto (browser)' }
}

export default function Layout({ themeMode, themePreference, onThemePreferenceChange }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isDark = theme.palette.mode === 'dark'

  const cycleThemePreference = () => {
    const next = themePreference === 'system'
      ? 'light'
      : themePreference === 'light'
        ? 'dark'
        : 'system'
    onThemePreferenceChange(next)
  }

  const themeMeta = getThemeMeta(themePreference)

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ px: 2.5, py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '-0.01em' }}>
            Help Me Newton!
          </Typography>
          <Tooltip title={`${themeMeta.label} · Click to change`}>
            <IconButton size="small" onClick={cycleThemePreference} sx={{ color: 'text.secondary' }}>
              {themeMeta.icon}
            </IconButton>
          </Tooltip>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
          Engineering Mechanics
        </Typography>
      </Box>
      <Divider sx={{ mx: 2, borderColor: 'divider' }} />
      <List sx={{ px: 1, pt: 1, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))
          const activeBg = isDark ? item.bgDark : item.bgLight
          const activeColor = isDark ? item.colorDark : item.colorLight
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { navigate(item.path); setMobileOpen(false) }}
                sx={{
                  borderRadius: 3,
                  bgcolor: active ? (activeBg || 'primaryContainer') : 'transparent',
                  '&:hover': { bgcolor: active ? (activeBg || 'primaryContainer') : 'action.hover' },
                  py: item.subtitle ? 1.25 : 1,
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 40,
                  color: active ? (activeColor || 'primary.main') : 'text.secondary',
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{
                      fontWeight: active ? 700 : 500,
                      color: active ? (activeColor || 'primary.main') : 'text.primary',
                      fontFamily: '"Google Sans", sans-serif',
                    }}>
                      {item.label}
                    </Typography>
                  }
                  secondary={item.subtitle ? (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {item.subtitle}
                    </Typography>
                  ) : null}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      <Box sx={{ p: 2 }}>
        <Box sx={{ bgcolor: 'surfaceVariant', borderRadius: 3, p: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.5 }}>
            Enter values, hit <strong>Calculate</strong>, and compare with your manual solution.
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
          Theme: {themeMeta.label} ({themeMode})
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar - Mobile only */}
      {isMobile && (
        <AppBar position="fixed" elevation={0} sx={{
          bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider',
          color: 'text.primary', zIndex: (t) => t.zIndex.drawer + 1,
        }}>
          <Toolbar>
            <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 1.5, color: 'text.secondary' }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', flexGrow: 1 }}>
              Help Me Newton!
            </Typography>
            <Tooltip title={`${themeMeta.label} · Click to change`}>
              <IconButton onClick={cycleThemePreference} sx={{ color: 'text.secondary' }}>
                {themeMeta.icon}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer */}
      {isMobile ? (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', bgcolor: 'background.paper' } }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              border: 'none',
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box component="main" sx={{
        flexGrow: 1,
        p: { xs: 2, md: 3 },
        mt: isMobile ? 7 : 0,
        maxWidth: '100%',
        overflow: 'hidden',
      }}>
        <Outlet />
      </Box>
    </Box>
  )
}
