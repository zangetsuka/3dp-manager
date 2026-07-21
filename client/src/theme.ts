import type { PaletteMode } from '@mui/material';

const colors = {
  blue: '#5E9FE8',
  blueHover: '#4A8BD4',
  green: '#72BC8F',
  orange: '#DE9255',
  red: '#E97366',
};

const lightPalette = {
  primary: { main: '#2783DE', light: '#5E9FE8', dark: '#1F6FBD' },
  secondary: { main: '#6F63D9' },
  success: { main: '#46A171' },
  warning: { main: '#D5803B' },
  error: { main: '#E56458' },
  background: { default: '#F6F7F9', paper: '#FFFFFF' },
  text: { primary: '#202124', secondary: '#696F78' },
  divider: '#E3E6EA',
};

const darkPalette = {
  primary: { main: colors.blue, light: '#78B2F0', dark: '#447FBE' },
  secondary: { main: '#9A8CF2' },
  success: { main: colors.green },
  warning: { main: colors.orange },
  error: { main: colors.red },
  background: { default: '#101217', paper: '#171A21' },
  text: { primary: '#F4F6F8', secondary: 'rgba(244, 246, 248, 0.68)' },
  divider: 'rgba(255,255,255,0.10)',
};

export const getDesignTokens = (mode: PaletteMode) => {
  const dark = mode === 'dark';
  const border = dark ? 'rgba(255,255,255,0.10)' : '#E3E6EA';
  const raised = dark ? '#1D212A' : '#FFFFFF';

  return {
    palette: {
      mode,
      ...(dark ? darkPalette : lightPalette),
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 14,
      h1: { fontWeight: 720, letterSpacing: '-0.035em' },
      h2: { fontWeight: 700, letterSpacing: '-0.025em' },
      h3: { fontWeight: 680, letterSpacing: '-0.02em' },
      h4: { fontWeight: 680, letterSpacing: '-0.018em' },
      h5: { fontWeight: 650, letterSpacing: '-0.012em' },
      h6: { fontWeight: 650 },
      body1: { lineHeight: 1.55 },
      body2: { lineHeight: 1.5 },
      button: { textTransform: 'none' as const, fontWeight: 650, letterSpacing: 0 },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            minWidth: 320,
            backgroundColor: dark ? '#101217' : '#F6F7F9',
            scrollbarColor: dark ? '#3A414E #171A21' : '#C9CED6 #F6F7F9',
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': { width: 10, height: 10 },
            '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              borderRadius: 10,
              backgroundColor: dark ? '#3A414E' : '#C9CED6',
              border: '3px solid transparent',
              backgroundClip: 'content-box',
            },
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            minHeight: 40,
            borderRadius: 8,
            paddingInline: 16,
            boxShadow: 'none',
            '&:focus-visible': { outline: `3px solid ${dark ? 'rgba(94,159,232,.35)' : 'rgba(39,131,222,.25)'}`, outlineOffset: 2 },
          },
          containedPrimary: { '&:hover': { backgroundColor: dark ? colors.blueHover : '#1F73C5' } },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            minWidth: 40,
            minHeight: 40,
            borderRadius: 8,
            '&:focus-visible': { outline: `3px solid ${dark ? 'rgba(94,159,232,.35)' : 'rgba(39,131,222,.25)'}` },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          elevation1: {
            backgroundColor: raised,
            border: `1px solid ${border}`,
            boxShadow: dark ? '0 10px 34px rgba(0,0,0,.22)' : '0 8px 28px rgba(26,34,48,.08)',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            border: `1px solid ${border}`,
            borderRadius: 12,
            boxShadow: dark ? '0 24px 80px rgba(0,0,0,.56)' : '0 24px 70px rgba(26,34,48,.18)',
          },
        },
      },
      MuiDialogTitle: { styleOverrides: { root: { padding: '22px 24px 14px', fontSize: 20, fontWeight: 680 } } },
      MuiDialogContent: { styleOverrides: { root: { padding: '12px 24px 24px' } } },
      MuiDialogActions: { styleOverrides: { root: { padding: '16px 24px 20px', gap: 8, borderTop: `1px solid ${border}` } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            minHeight: 42,
            borderRadius: 8,
            backgroundColor: dark ? '#13161C' : '#FFFFFF',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: border },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: dark ? 'rgba(255,255,255,.24)' : '#AAB2BD' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 1, borderColor: dark ? colors.blue : '#2783DE' },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: { height: 44, fontSize: 12, fontWeight: 650, color: dark ? 'rgba(244,246,248,.62)' : '#626A75', backgroundColor: dark ? '#14171D' : '#F6F7F9' },
          body: { height: 50, borderColor: border },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:last-child td': { borderBottom: 0 },
            '&:hover': { backgroundColor: dark ? 'rgba(94,159,232,.055)' : 'rgba(39,131,222,.045)' },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: dark ? 'rgba(16,18,23,.88)' : 'rgba(255,255,255,.88)',
            backdropFilter: 'blur(16px)',
            borderBottom: `1px solid ${border}`,
            boxShadow: 'none',
            color: dark ? '#F4F6F8' : '#202124',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { backgroundColor: dark ? '#13161C' : '#FFFFFF', borderRight: `1px solid ${border}` },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            minHeight: 44,
            margin: '3px 10px',
            borderRadius: 8,
            '&.Mui-selected': { backgroundColor: dark ? 'rgba(94,159,232,.14)' : 'rgba(39,131,222,.10)' },
            '&.Mui-selected:hover': { backgroundColor: dark ? 'rgba(94,159,232,.20)' : 'rgba(39,131,222,.15)' },
          },
        },
      },
      MuiChip: { styleOverrides: { root: { height: 28, borderRadius: 7, fontWeight: 600 } } },
      MuiTooltip: { styleOverrides: { tooltip: { fontSize: 12, borderRadius: 6, padding: '7px 9px' } } },
    },
  };
};
