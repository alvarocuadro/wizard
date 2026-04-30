import { createTheme } from '@mui/material/styles';
import { WELLIO_COLORS } from './colors';
import { wellioTokens } from './wellioTokens';

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
    text: {
      primary: WELLIO_COLORS.text.primary,
      secondary: WELLIO_COLORS.text.secondary,
      disabled: WELLIO_COLORS.text.disabled,
    },
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
  shape: { borderRadius: wellioTokens.borderRadius.medium },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 16,
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '14px',
          padding: '10px 18px',
          transition: 'background-color 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
        },
        sizeSmall: { padding: '6px 12px', fontSize: '13px' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: WELLIO_COLORS.surface,
          transition:
            'background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
          '& fieldset': { borderColor: WELLIO_COLORS.border },
          '&:hover fieldset': { borderColor: WELLIO_COLORS.neutral.dark },
          '&.Mui-focused fieldset': {
            borderColor: WELLIO_COLORS.primary.main,
          },
          '&.Mui-focused': {
            boxShadow: `0 0 0 4px ${WELLIO_COLORS.primary.light}`,
          },
        },
        input: { fontSize: '14px', padding: '12px 14px' },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: '14px', color: WELLIO_COLORS.text.secondary },
      },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        select: { fontSize: '14px', paddingTop: 12, paddingBottom: 12 },
        icon: { color: WELLIO_COLORS.text.secondary },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiFormControl: {
      defaultProps: {
        margin: 'none',
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          border: `1px solid ${WELLIO_COLORS.border}`,
          backgroundColor: WELLIO_COLORS.surface,
          boxShadow: '0 12px 32px rgba(15,23,42,0.06)',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px 22px',
          '&:last-child': {
            paddingBottom: '20px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 18, backgroundImage: 'none' },
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
          height: 30,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: '20px !important',
          border: `1px solid ${WELLIO_COLORS.border}`,
          backgroundColor: WELLIO_COLORS.surface,
          boxShadow: '0 8px 24px rgba(15,23,42,0.04)',
          '&:before': { display: 'none' },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          minHeight: 72,
          padding: '0 22px',
          '&.Mui-expanded': { minHeight: 72 },
        },
        content: {
          margin: '18px 0',
          '&.Mui-expanded': { margin: '18px 0' },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '0 22px 22px',
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
      variants: [
        {
          props: { severity: 'success', variant: 'standard' },
          style: {
            backgroundColor: WELLIO_COLORS.state.successSurface,
            color: WELLIO_COLORS.success.dark,
            borderColor: WELLIO_COLORS.state.successBorder,
          },
        },
      ],
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: `1px solid ${WELLIO_COLORS.border}`,
          alignItems: 'center',
        },
      },
    },
  },
});
