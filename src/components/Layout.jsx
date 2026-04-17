import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton,
  Divider, useMediaQuery, useTheme, Chip
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import HomeIcon from '@mui/icons-material/Home'
import BoltIcon from '@mui/icons-material/Bolt'
import BalanceIcon from '@mui/icons-material/Balance'
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'

const DRAWER_WIDTH = 264

const NAV_ITEMS = [
  { label: 'Home', path: '/', icon: <HomeIcon /> },
  {
    label: 'Unit 1', path: '/unit1', icon: <BoltIcon />,
    subtitle: 'Force Systems',
    color: '#1B4F9A',
    bg: '#D7E3FF',
  },
  {
    label: 'Unit 2', path: '/unit2', icon: <BalanceIcon />,
    subtitle: 'Equilibrium & Trusses',
    color: '#1B6E4A',
    bg: '#C6F0D8',
  },
  {
    label: 'Unit 3', path: '/unit3', icon: <CenterFocusStrongIcon />,
    subtitle: 'Distributed Forces',
    color: '#7D3B00',
    bg: '#FFDDB8',
  },
  {
    label: 'Unit 4', path: '/unit4', icon: <FitnessCenterIcon />,
    subtitle: 'MOI & Friction',
    color: '#6B1B1B',
    bg: '#FFDAD6',
  },
]

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#F0F3FB' }}>
      <Box sx={{ px: 2.5, py: 3 }}>
        <Typography variant="h6" sx={{ color: '#0054C8', fontWeight: 700, letterSpacing: '-0.01em' }}>
          Help me newton
        </Typography>
        <Typography variant="caption" sx={{ color: '#42474E', display: 'block', mt: 0.25 }}>
          Engineering Mechanics · PES University
        </Typography>
      </Box>
      <Divider sx={{ mx: 2 }} />
      <List sx={{ px: 1, pt: 1, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { navigate(item.path); setMobileOpen(false) }}
                sx={{
                  borderRadius: 3,
                  bgcolor: active ? (item.bg || '#D7E3FF') : 'transparent',
                  '&:hover': { bgcolor: active ? (item.bg || '#D7E3FF') : 'rgba(0,84,200,0.06)' },
                  py: item.subtitle ? 1.25 : 1,
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 40,
                  color: active ? (item.color || '#0054C8') : '#42474E',
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{
                      fontWeight: active ? 700 : 500,
                      color: active ? (item.color || '#0054C8') : '#1A1C1E',
                      fontFamily: '"Google Sans", sans-serif',
                    }}>
                      {item.label}
                    </Typography>
                  }
                  secondary={item.subtitle ? (
                    <Typography variant="caption" sx={{ color: '#6B7280' }}>
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
        <Box sx={{ bgcolor: '#E8EAF6', borderRadius: 3, p: 1.5 }}>
          <Typography variant="caption" sx={{ color: '#42474E', display: 'block', lineHeight: 1.5 }}>
            Enter values, hit <strong>Calculate</strong>, and compare with your manual solution.
          </Typography>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F5F6FB' }}>
      {/* App Bar - Mobile only */}
      {isMobile && (
        <AppBar position="fixed" elevation={0} sx={{
          bgcolor: '#FFFFFF', borderBottom: '1px solid #E0E3EA',
          color: '#1A1C1E', zIndex: (t) => t.zIndex.drawer + 1,
        }}>
          <Toolbar>
            <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 1.5, color: '#42474E' }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0054C8' }}>
              Help me newton
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer */}
      {isMobile ? (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
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
              borderRight: '1px solid #E0E3EA',
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
