// تكوين الخطوط للتطبيق
export const typography = {
  fontFamily: [
    'Tajawal',
    'Roboto',
    'Arial',
    'sans-serif',
  ].join(','),

  // أحجام الخطوط
  fontSize: 14,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,

  // أنماط العناوين
  h1: {
    fontWeight: 700,
    fontSize: '2.5rem',
    lineHeight: 1.2,
    letterSpacing: '-0.01562em',
  },
  h2: {
    fontWeight: 700,
    fontSize: '2rem',
    lineHeight: 1.2,
    letterSpacing: '-0.00833em',
  },
  h3: {
    fontWeight: 600,
    fontSize: '1.75rem',
    lineHeight: 1.2,
    letterSpacing: '0em',
  },
  h4: {
    fontWeight: 600,
    fontSize: '1.5rem',
    lineHeight: 1.2,
    letterSpacing: '0.00735em',
  },
  h5: {
    fontWeight: 600,
    fontSize: '1.25rem',
    lineHeight: 1.2,
    letterSpacing: '0em',
  },
  h6: {
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: 1.2,
    letterSpacing: '0.0075em',
  },

  // أنماط النصوص
  subtitle1: {
    fontWeight: 500,
    fontSize: '1rem',
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
  },
  subtitle2: {
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: 1.5,
    letterSpacing: '0.00714em',
  },
  body1: {
    fontWeight: 400,
    fontSize: '1rem',
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
  },
  body2: {
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: 1.5,
    letterSpacing: '0.01071em',
  },
  button: {
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
  },
  caption: {
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: 1.66,
    letterSpacing: '0.03333em',
  },
  overline: {
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: 2.66,
    letterSpacing: '0.08333em',
  },
};

// تكوين الظلال
export const shadows = [
  'none',
  '0px 2px 1px -1px rgba(0,0,0,0.05), 0px 1px 1px 0px rgba(0,0,0,0.03), 0px 1px 3px 0px rgba(0,0,0,0.02)',
  '0px 3px 1px -2px rgba(0,0,0,0.05), 0px 2px 2px 0px rgba(0,0,0,0.03), 0px 1px 5px 0px rgba(0,0,0,0.02)',
  '0px 3px 3px -2px rgba(0,0,0,0.05), 0px 3px 4px 0px rgba(0,0,0,0.03), 0px 1px 8px 0px rgba(0,0,0,0.02)',
  '0px 2px 4px -1px rgba(0,0,0,0.05), 0px 4px 5px 0px rgba(0,0,0,0.03), 0px 1px 10px 0px rgba(0,0,0,0.02)',
  '0px 3px 5px -1px rgba(0,0,0,0.05), 0px 5px 8px 0px rgba(0,0,0,0.03), 0px 1px 14px 0px rgba(0,0,0,0.02)',
  '0px 3px 5px -1px rgba(0,0,0,0.05), 0px 6px 10px 0px rgba(0,0,0,0.03), 0px 1px 18px 0px rgba(0,0,0,0.02)',
  '0px 4px 5px -2px rgba(0,0,0,0.05), 0px 7px 10px 1px rgba(0,0,0,0.03), 0px 2px 16px 1px rgba(0,0,0,0.02)',
  '0px 5px 5px -3px rgba(0,0,0,0.05), 0px 8px 10px 1px rgba(0,0,0,0.03), 0px 3px 14px 2px rgba(0,0,0,0.02)',
  '0px 5px 6px -3px rgba(0,0,0,0.05), 0px 9px 12px 1px rgba(0,0,0,0.03), 0px 3px 16px 2px rgba(0,0,0,0.02)',
  '0px 6px 6px -3px rgba(0,0,0,0.05), 0px 10px 14px 1px rgba(0,0,0,0.03), 0px 4px 18px 3px rgba(0,0,0,0.02)',
  '0px 6px 7px -4px rgba(0,0,0,0.05), 0px 11px 15px 1px rgba(0,0,0,0.03), 0px 4px 20px 3px rgba(0,0,0,0.02)',
  '0px 7px 8px -4px rgba(0,0,0,0.05), 0px 12px 17px 2px rgba(0,0,0,0.03), 0px 5px 22px 4px rgba(0,0,0,0.02)',
  '0px 7px 8px -4px rgba(0,0,0,0.05), 0px 13px 19px 2px rgba(0,0,0,0.03), 0px 5px 24px 4px rgba(0,0,0,0.02)',
  '0px 7px 9px -4px rgba(0,0,0,0.05), 0px 14px 21px 2px rgba(0,0,0,0.03), 0px 5px 26px 4px rgba(0,0,0,0.02)',
  '0px 8px 9px -5px rgba(0,0,0,0.05), 0px 15px 22px 2px rgba(0,0,0,0.03), 0px 6px 28px 5px rgba(0,0,0,0.02)',
  '0px 8px 10px -5px rgba(0,0,0,0.05), 0px 16px 24px 2px rgba(0,0,0,0.03), 0px 6px 30px 5px rgba(0,0,0,0.02)',
  '0px 8px 11px -5px rgba(0,0,0,0.05), 0px 17px 26px 2px rgba(0,0,0,0.03), 0px 6px 32px 5px rgba(0,0,0,0.02)',
  '0px 9px 11px -5px rgba(0,0,0,0.05), 0px 18px 28px 2px rgba(0,0,0,0.03), 0px 7px 34px 6px rgba(0,0,0,0.02)',
  '0px 9px 12px -6px rgba(0,0,0,0.05), 0px 19px 29px 2px rgba(0,0,0,0.03), 0px 7px 36px 6px rgba(0,0,0,0.02)',
  '0px 10px 13px -6px rgba(0,0,0,0.05), 0px 20px 31px 3px rgba(0,0,0,0.03), 0px 8px 38px 7px rgba(0,0,0,0.02)',
  '0px 10px 13px -6px rgba(0,0,0,0.05), 0px 21px 33px 3px rgba(0,0,0,0.03), 0px 8px 40px 7px rgba(0,0,0,0.02)',
  '0px 10px 14px -6px rgba(0,0,0,0.05), 0px 22px 35px 3px rgba(0,0,0,0.03), 0px 8px 42px 7px rgba(0,0,0,0.02)',
  '0px 11px 14px -7px rgba(0,0,0,0.05), 0px 23px 36px 3px rgba(0,0,0,0.03), 0px 9px 44px 8px rgba(0,0,0,0.02)',
  '0px 11px 15px -7px rgba(0,0,0,0.05), 0px 24px 38px 3px rgba(0,0,0,0.03), 0px 9px 46px 8px rgba(0,0,0,0.02)',
];

// تكوين الزوايا المدورة
export const shape = {
  borderRadius: 10,
  cardBorderRadius: 16,
  buttonBorderRadius: 8,
  avatarBorderRadius: 8,
  chipBorderRadius: 16,
};
