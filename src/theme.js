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

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0054C8',
      light: '#4A8FFF',
      dark: '#003E9C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#535F70',
      light: '#7B8898',
      dark: '#2E3848',
      contrastText: '#FFFFFF',
    },
    error: { main: '#BA1A1A' },
    warning: { main: '#7D5700' },
    success: { main: '#006E2C' },
    background: {
      default: '#F5F6FB',
      paper: '#FFFFFF',
    },
    primaryContainer: '#D7E3FF',
    onPrimaryContainer: '#001D36',
    surfaceVariant: '#DFE2EB',
    outline: '#72787E',
    text: {
      primary: '#1A1C1E',
      secondary: '#42474E',
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
    body2: { fontSize: '0.875rem', color: '#42474E' },
    button: { textTransform: 'none', fontWeight: 600, fontFamily: '"Google Sans", sans-serif' },
    mono: { fontFamily: '"Roboto Mono", monospace', fontSize: '0.875rem' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
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
        root: {
          borderRadius: 16,
          boxShadow: 'none',
          border: '1px solid #E0E3EA',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation1: { boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)' },
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
        head: {
          fontWeight: 600,
          fontFamily: '"Google Sans", sans-serif',
          fontSize: '0.8125rem',
          color: '#42474E',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
});

export default theme;
