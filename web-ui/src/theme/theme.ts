import type { PaletteMode } from '@mui/material';
import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    primary: {
      main: '#004b87', // FH Wedel Blue
    },
    secondary: {
      main: '#82b93c', // FH Wedel Green
    },
    background: {
      default: mode === 'light' ? '#f5f5f5' : '#121212',
      paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

export const getTheme = (mode: PaletteMode) => createTheme(getDesignTokens(mode));
