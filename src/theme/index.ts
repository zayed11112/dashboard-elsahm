import { createTheme, responsiveFontSizes, Theme, ThemeOptions } from '@mui/material/styles';
import { palette } from './palette';
import { typography, shape, shadows } from './typography';

// إنشاء سمة للوضع النهاري
const createLightTheme = (): ThemeOptions => {
  return {
    direction: 'rtl',
    palette: {
      mode: 'light',
      primary: {
        main: palette.primary.main,
        light: palette.primary.light,
        dark: palette.primary.dark,
        contrastText: palette.primary.contrastText,
      },
      secondary: {
        main: palette.secondary.main,
        light: palette.secondary.light,
        dark: palette.secondary.dark,
        contrastText: palette.secondary.contrastText,
      },
      success: {
        main: palette.success.main,
        light: palette.success.light,
        dark: palette.success.dark,
        contrastText: palette.success.contrastText,
      },
      info: {
        main: palette.info.main,
        light: palette.info.light,
        dark: palette.info.dark,
        contrastText: palette.info.contrastText,
      },
      warning: {
        main: palette.warning.main,
        light: palette.warning.light,
        dark: palette.warning.dark,
        contrastText: palette.warning.contrastText,
      },
      error: {
        main: palette.error.main,
        light: palette.error.light,
        dark: palette.error.dark,
        contrastText: palette.error.contrastText,
      },
      background: {
        default: palette.background.default,
        paper: palette.background.paper,
      },
      text: {
        primary: palette.text.primary,
        secondary: palette.text.secondary,
        disabled: palette.text.disabled,
      },
      divider: palette.divider,
      action: {
        active: palette.action.active,
        hover: palette.action.hover,
        selected: palette.action.selected,
        disabled: palette.action.disabled,
        disabledBackground: palette.action.disabledBackground,
      },
    },
    typography,
    shape,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': {
            boxSizing: 'border-box',
            margin: 0,
            padding: 0,
          },
          html: {
            MozOsxFontSmoothing: 'grayscale',
            WebkitFontSmoothing: 'antialiased',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            width: '100%',
          },
          body: {
            display: 'flex',
            flex: '1 1 auto',
            flexDirection: 'column',
            minHeight: '100%',
            width: '100%',
            overflowY: 'auto',
          },
          '#root': {
            display: 'flex',
            flex: '1 1 auto',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
          },
          'input[type=number]': {
            MozAppearance: 'textfield',
            '&::-webkit-outer-spin-button': {
              margin: 0,
              WebkitAppearance: 'none',
            },
            '&::-webkit-inner-spin-button': {
              margin: 0,
              WebkitAppearance: 'none',
            },
          },
          img: {
            maxWidth: '100%',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: shadows[3],
            backgroundImage: palette.gradients.primary,
          },
        },
        defaultProps: {
          color: 'primary',
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            fontSize: typography.body1.fontSize,
            fontWeight: typography.fontWeightMedium,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: shape.buttonBorderRadius,
            textTransform: 'none',
            fontWeight: typography.fontWeightMedium,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: shadows[2],
            },
          },
          contained: {
            boxShadow: shadows[1],
            '&:hover': {
              boxShadow: shadows[4],
            },
          },
          containedPrimary: {
            backgroundImage: palette.gradients.primary,
            '&:hover': {
              backgroundImage: palette.gradients.primary,
              boxShadow: shadows[4],
            },
          },
          containedSecondary: {
            backgroundImage: palette.gradients.secondary,
            '&:hover': {
              backgroundImage: palette.gradients.secondary,
              boxShadow: shadows[4],
            },
          },
          outlined: {
            borderWidth: 1.5,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: shape.cardBorderRadius,
            boxShadow: shadows[3],
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: shadows[6],
              transform: 'translateY(-4px)',
            },
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: 24,
            '&:last-child': {
              paddingBottom: 24,
            },
          },
        },
      },
      MuiCardHeader: {
        styleOverrides: {
          root: {
            padding: '24px 24px 0',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: shape.chipBorderRadius,
            fontWeight: typography.fontWeightMedium,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: palette.gradients.sidebar,
            color: '#FFFFFF',
            boxShadow: shadows[8],
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            paddingTop: 8,
            paddingBottom: 8,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&.Mui-selected': {
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
              },
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            color: 'inherit',
            minWidth: 40,
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            fontWeight: typography.fontWeightMedium,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: shadows[3],
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: '16px 24px',
            borderBottom: `1px solid ${palette.divider}`,
          },
          head: {
            color: palette.text.primary,
            fontWeight: typography.fontWeightMedium,
            backgroundColor: palette.background.default,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:last-child td': {
              borderBottom: 0,
            },
            '&:hover': {
              backgroundColor: palette.action.hover,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${palette.divider}`,
          },
          indicator: {
            height: 3,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: typography.fontWeightMedium,
            fontSize: typography.body1.fontSize,
            minWidth: 'auto',
            padding: '12px 16px',
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 3,
            overflow: 'hidden',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: shape.borderRadius,
          },
          standardSuccess: {
            backgroundColor: 'rgba(76, 175, 80, 0.12)',
            color: palette.success.main,
          },
          standardInfo: {
            backgroundColor: 'rgba(3, 169, 244, 0.12)',
            color: palette.info.main,
          },
          standardWarning: {
            backgroundColor: 'rgba(255, 152, 0, 0.12)',
            color: palette.warning.main,
          },
          standardError: {
            backgroundColor: 'rgba(244, 67, 54, 0.12)',
            color: palette.error.main,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: palette.text.primary,
            borderRadius: shape.borderRadius,
            fontSize: '0.75rem',
            padding: '8px 12px',
          },
        },
      },
    },
  };
};

// No dark theme implementation

// إنشاء السمة النهائية - دائمًا استخدام الوضع الفاتح
export const createCustomTheme = (mode: 'light' | 'dark'): Theme => {
  // Always use light theme regardless of the mode parameter
  const themeOptions = createLightTheme();
  let theme = createTheme(themeOptions);
  theme = responsiveFontSizes(theme);
  return theme;
};
