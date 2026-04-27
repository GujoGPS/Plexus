import { createTheme } from '@mui/material/styles';

export const createAppTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: {
      main: '#00473F',
      light: '#2d6b63',
      dark: '002621',
      contrastText: '#fff',
    },
    secondary: {
      main: '#34a853',
      light: '#4caf50',
      dark: '#2e7d32',
      contrastText: '#fff',
    },
    info: {
      main: '#4285f4',
      light: '#64b5f6',
      dark: '#2161c1',
      contrastText: '#fff',
    },
    success: {
      main: '#34a853',
      light: '#66bb6a',
      dark: '#2e7d32',
      contrastText: '#fff',
    },
    warning: {
      main: '#fbbc04',
      light: '#ffd166',
      dark: '#c89800',
      contrastText: '#000',
    },
    error: {
      main: '#ea4335',
      light: '#ef5350',
      dark: '#d32f2f',
      contrastText: '#fff',
    },
    background: {
      default: mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
      paper: mode === 'dark' ? '#2d2d2d' : '#ffffff',
    },
    text: {
      primary: mode === 'dark' ? '#e8eaed' : '#202124',
      secondary: mode === 'dark' ? '#9aa0a6' : '#5f6368',
      disabled: mode === 'dark' ? '#5f6368' : '#9e9e9e',
    },
    divider: mode === 'dark' ? '#3c4043' : '#e8eaed',
  },
  typography: {
    fontFamily: '"Google Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.1rem',
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '0.9375rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.8125rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.4,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 400,
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 24px',
          fontSize: '0.9375rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0,0,0,0.15)',
          },
          '&:active': {
            boxShadow: '0px 1px 2px rgba(0,0,0,0.15)',
          },
        },
        contained: {
          boxShadow: '0px 2px 4px rgba(0,0,0,0.15)',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0,0,0,0.2)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 16,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '2px 0 6px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
          backgroundColor: mode === 'dark' ? '#2d2d2d' : '#fff',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          padding: '0 24px',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          '&:hover': {
            backgroundColor: 'rgba(33, 150, 243, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(33, 150, 243, 0.16)',
            fontWeight: 500,
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? '#3c4043' : '#e8eaed',
          height: 1,
        },
      },
    },
  },
});