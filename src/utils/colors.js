// Master Color Palette

// Primary App Colors - Blue Theme
export const PRIMARY = {
  DEEP: '#003285',      // rgb(0, 50, 133)
  DARK: '#191D88',      // rgb(25, 29, 136)
  MEDIUM: '#1450A3',    // rgb(20, 80, 163)
  LIGHT: '#337CCF',     // rgb(51, 124, 207)
  ACCENT: '#FFC436',    // rgb(255, 196, 54)
};

// Red Colors - For errors, weekends, holidays
export const RED = {
  DARK: '#DC143C',      // rgb(220, 20, 60)
  MEDIUM: '#F75270',    // rgb(247, 82, 112)
  LIGHT: '#F7CAC9',     // rgb(247, 202, 201)
  PALE: '#FDEBD0',      // rgb(253, 235, 208)
};

// Green Colors - For success, complete status
export const GREEN = {
  DARK: '#3E5F44',      // rgb(62, 95, 68)
  MEDIUM: '#5E936C',    // rgb(94, 147, 108)
  LIGHT: '#93DA97',     // rgb(147, 218, 151)
  PALE: '#E8FFD7',      // rgb(232, 255, 215)
};

// Yellow Colors - For warnings, partial status
export const YELLOW = {
  BRIGHT: '#FFD41D',    // rgb(255, 212, 29)
  MEDIUM: '#FFA240',    // rgb(255, 162, 64)
  DARK: '#D73535',      // rgb(215, 53, 53)
  ACCENT: '#FF4646',    // rgb(255, 70, 70)
};

// Neutral Colors
export const NEUTRAL = {
  BLACK: '#1A1A1A',
  GRAY_900: '#1F2937',
  GRAY_700: '#374151',
  GRAY_600: '#6B7280',
  GRAY_500: '#9CA3AF',
  GRAY_400: '#D1D5DB',
  GRAY_300: '#E5E7EB',
  GRAY_200: '#F3F4F6',
  GRAY_100: '#F9FAFB',
  GRAY_50: '#F5F7FA',
  WHITE: '#FFFFFF',
};

// Semantic Colors
export const STATUS = {
  SUCCESS: GREEN.MEDIUM,
  ERROR: RED.MEDIUM,
  WARNING: YELLOW.MEDIUM,
  INFO: PRIMARY.LIGHT,
};

// Background Colors
export const BACKGROUND = {
  SUCCESS: GREEN.PALE,
  ERROR: RED.PALE,
  WARNING: YELLOW.BRIGHT,
  INFO: PRIMARY.LIGHT,
};

// Gradient Combinations
export const GRADIENTS = {
  PRIMARY: [PRIMARY.DARK, PRIMARY.MEDIUM, PRIMARY.LIGHT],
  SUCCESS: [GREEN.DARK, GREEN.MEDIUM, GREEN.LIGHT],
  ERROR: [RED.DARK, RED.MEDIUM, RED.LIGHT],
  WARNING: [YELLOW.DARK, YELLOW.MEDIUM, YELLOW.BRIGHT],
};

export default {
  PRIMARY,
  RED,
  GREEN,
  YELLOW,
  NEUTRAL,
  STATUS,
  BACKGROUND,
  GRADIENTS,
};
