import { WELLIO_COLORS } from './colors';

export const wellioTokens = {
  colors: WELLIO_COLORS,
  typography: {
    fontFamily: 'Inter, sans-serif',
    sizes: {
      h1: '96px',
      h2: '60px',
      h3: '48px',
      h4: '34px',
      h5: '24px',
      h6: '20px',
      bodyXL: '20px',
      bodyL: '18px',
      bodyM: '16px',
      bodyS: '14px',
      caption: '12px',
      micro: '10px',
      textXS: '8px',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    full: 999,
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
    md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
    xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
  },
  transitions: {
    fast: '150ms ease',
    normal: '300ms ease',
    slow: '500ms ease',
  },
} as const;
