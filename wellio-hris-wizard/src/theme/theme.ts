import { createTheme } from '@mui/material/styles';
import { WELLIO_COLORS } from './colors';

export const theme = createTheme({
  palette: {
    primary: {
      light: WELLIO_COLORS.primary.light,
      main: WELLIO_COLORS.primary.main,
      dark: WELLIO_COLORS.primary.dark,
      contrastText: WELLIO_COLORS.primary.contrastText,
    },
    secondary: {
      light: WELLIO_COLORS.secondary.light,
      main: WELLIO_COLORS.secondary.main,
      dark: WELLIO_COLORS.secondary.dark,
      contrastText: WELLIO_COLORS.secondary.contrastText,
    },
    success: {
      light: WELLIO_COLORS.success.light,
      main: WELLIO_COLORS.success.main,
      dark: WELLIO_COLORS.success.dark,
      contrastText: WELLIO_COLORS.success.contrastText,
    },
    error: {
      light: WELLIO_COLORS.error.light,
      main: WELLIO_COLORS.error.main,
      dark: WELLIO_COLORS.error.dark,
      contrastText: WELLIO_COLORS.error.contrastText,
    },
    warning: {
      light: WELLIO_COLORS.warning.light,
      main: WELLIO_COLORS.warning.main,
      dark: WELLIO_COLORS.warning.dark,
      contrastText: WELLIO_COLORS.warning.contrastText,
    },
    info: {
      light: WELLIO_COLORS.info.light,
      main: WELLIO_COLORS.info.main,
      dark: WELLIO_COLORS.info.dark,
      contrastText: WELLIO_COLORS.info.contrastText,
    },
    background: {
      default: WELLIO_COLORS.background,
      paper: WELLIO_COLORS.surface,
    },
    divider: WELLIO_COLORS.border,
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: { fontSize: '96px', fontWeight: 800, lineHeight: 1.1 },
    h2: { fontSize: '60px', fontWeight: 800, lineHeight: 1.2 },
    h3: { fontSize: '48px', fontWeight: 700, lineHeight: 1.2 },
    h4: { fontSize: '34px', fontWeight: 700, lineHeight: 1.2 },
    h5: { fontSize: '24px', fontWeight: 700, lineHeight: 1.3 },
    h6: { fontSize: '20px', fontWeight: 700, lineHeight: 1.4 },
    body1: { fontSize: '16px', lineHeight: 1.5 },
    body2: { fontSize: '14px', lineHeight: 1.45 },
    subtitle1: { fontSize: '18px', lineHeight: 1.5 },
    subtitle2: { fontSize: '16px', fontWeight: 600, lineHeight: 1.5 },
    caption: { fontSize: '12px', lineHeight: 1.4 },
    overline: { fontSize: '10px' },
  },
  spacing: 4,
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 14,
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '14px',
          padding: '10px 16px',
          transition: 'background-color 150ms ease, box-shadow 150ms ease',
        },
        sizeSmall: { padding: '6px 12px', fontSize: '13px' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: WELLIO_COLORS.background,
          '& fieldset': { borderColor: '#CBD5E1' },
          '&:hover fieldset': { borderColor: '#94A3B8' },
          '&.Mui-focused fieldset': {
            borderColor: WELLIO_COLORS.primary.main,
            boxShadow: `0 0 0 3px ${WELLIO_COLORS.primary.light}`,
          },
        },
        input: { fontSize: '14px', padding: '10px 12px' },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: '14px' },
      },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        select: { fontSize: '14px' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 22,
          border: `1px solid ${WELLIO_COLORS.border}`,
          boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 16 },
        elevation1: { boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' },
        elevation2: { boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
        elevation3: { boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontSize: '12px',
          fontWeight: 700,
          height: 28,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 22 },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 800, fontSize: '20px', padding: '18px 20px' },
      },
    },
    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { borderRadius: 8, fontSize: '12px' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 18 },
      },
    },
  },
});
