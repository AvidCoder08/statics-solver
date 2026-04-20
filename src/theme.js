import { createTheme } from '@mui/material/styles';

const M3_BLUE = {
  50: '#EEF2FF',
  100: '#D7E3FF',
  200: '#ADC6FF',
  300: '#7AABFF',
  400: '#4A8FFF',
  500: '#1B6EF3',
  600: '#0054C8',
  700: '#003E9C',
  800: '#002A70',
  900: '#001847',
};

export function getAppTheme(mode = 'light') {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#7AABFF' : '#0054C8',
        light: isDark ? '#ADC6FF' : '#4A8FFF',
        dark: isDark ? '#4A8FFF' : '#003E9C',
        contrastText: isDark ? '#001847' : '#FFFFFF',
      },
      secondary: {
        main: isDark ? '#B3C5DB' : '#535F70',
        light: isDark ? '#D2E4FB' : '#7B8898',
        dark: isDark ? '#7B8898' : '#2E3848',
        contrastText: isDark ? '#0F1720' : '#FFFFFF',
      },
      error: { main: isDark ? '#FFB4AB' : '#BA1A1A' },
      warning: { main: isDark ? '#F9BD67' : '#7D5700' },
      success: { main: isDark ? '#7FDB9A' : '#006E2C' },
      background: {
        default: isDark ? '#10131A' : '#F5F6FB',
        paper: isDark ? '#171B24' : '#FFFFFF',
      },
      primaryContainer: isDark ? '#153B71' : '#D7E3FF',
      onPrimaryContainer: isDark ? '#D7E3FF' : '#001D36',
      surfaceVariant: isDark ? '#222936' : '#DFE2EB',
      outline: isDark ? '#8B93A1' : '#72787E',
      text: {
        primary: isDark ? '#E8EBF1' : '#1A1C1E',
        secondary: isDark ? '#C1C8D4' : '#42474E',
      },
    },
    typography: {
      fontFamily: '"Google Sans", "Roboto", sans-serif',
      h1: { fontFamily: '"Google Sans Display", sans-serif', fontWeight: 700, fontSize: '3rem' },
      h2: { fontFamily: '"Google Sans Display", sans-serif', fontWeight: 700, fontSize: '2.25rem' },
      h3: { fontFamily: '"Google Sans Display", sans-serif', fontWeight: 600, fontSize: '1.75rem' },
      h4: { fontFamily: '"Google Sans", sans-serif', fontWeight: 600, fontSize: '1.4rem' },
      h5: { fontFamily: '"Google Sans", sans-serif', fontWeight: 600, fontSize: '1.15rem' },
      h6: { fontFamily: '"Google Sans", sans-serif', fontWeight: 600, fontSize: '1rem' },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500, fontSize: '0.8rem' },
      body1: { fontSize: '0.9375rem' },
      body2: { fontSize: '0.875rem' },
      button: { textTransform: 'none', fontWeight: 600, fontFamily: '"Google Sans", sans-serif' },
      mono: { fontFamily: '"Roboto Mono", monospace', fontSize: '0.875rem' },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 200ms ease, color 200ms ease',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 20,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 8,
            paddingBottom: 8,
            fontSize: '0.875rem',
          },
          contained: {
            '&:hover': { boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': { borderWidth: '1.5px' },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 16,
            boxShadow: 'none',
            border: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          elevation1: {
            boxShadow: isDark
              ? '0 1px 3px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.35)'
              : '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined', size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              fontFamily: '"Roboto Mono", monospace',
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontFamily: '"Google Sans", sans-serif',
            fontWeight: 500,
            fontSize: '0.875rem',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: ({ theme }) => ({
            fontWeight: 600,
            fontFamily: '"Google Sans", sans-serif',
            fontSize: '0.8125rem',
            color: theme.palette.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }),
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
    },
  });
}

const theme = getAppTheme('light');

export default theme;
