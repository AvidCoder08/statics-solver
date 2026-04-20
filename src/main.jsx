import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { getAppTheme } from './theme.js'

const THEME_PREF_KEY = 'statics-solver-theme-preference'

function getSystemThemeMode() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function Root() {
  const [themePreference, setThemePreference] = React.useState(() => {
    const stored = localStorage.getItem(THEME_PREF_KEY)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
  })
  const [systemThemeMode, setSystemThemeMode] = React.useState(getSystemThemeMode)

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event) => setSystemThemeMode(event.matches ? 'dark' : 'light')
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  React.useEffect(() => {
    localStorage.setItem(THEME_PREF_KEY, themePreference)
  }, [themePreference])

  const themeMode = themePreference === 'system' ? systemThemeMode : themePreference
  const theme = React.useMemo(() => getAppTheme(themeMode), [themeMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App
        themeMode={themeMode}
        themePreference={themePreference}
        onThemePreferenceChange={setThemePreference}
      />
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
