export const Colors = {
  light: {
    primary: '#6C63FF',
    primaryLight: '#8B83FF',
    secondary: '#FF6584',
    secondaryLight: '#FF8BA7',
    success: '#00C48C',
    successLight: '#00E5A0',
    warning: '#FFAA00',
    warningLight: '#FFCC44',
    background: '#F8F9FE',
    surface: '#FFFFFF',
    surfaceElevated: '#F0F1FA',
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    error: '#EF4444',
    overlay: 'rgba(0,0,0,0.5)',
  },
  dark: {
    primary: '#8B83FF',
    primaryLight: '#A5A0FF',
    secondary: '#FF8BA7',
    secondaryLight: '#FFAAC0',
    success: '#00E5A0',
    successLight: '#33ECBA',
    warning: '#FFCC44',
    warningLight: '#FFDD77',
    background: '#0D0D1A',
    surface: '#1A1A2E',
    surfaceElevated: '#252542',
    text: '#E8E8F0',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    border: '#2D2D4A',
    error: '#F87171',
    overlay: 'rgba(0,0,0,0.7)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 999,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  hero: 40,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const GroupIcons: Record<string, string> = {
  trip: '✈️',
  roommates: '🏠',
  dinner: '🍽️',
  custom: '⚙️',
  party: '🎉',
  shopping: '🛒',
  office: '💼',
};

export const ExpenseCategories = [
  { key: 'food', label: 'Food', icon: 'food', color: '#FF6584' },
  { key: 'transport', label: 'Transport', icon: 'car', color: '#6C63FF' },
  { key: 'stay', label: 'Stay', icon: 'home', color: '#00C48C' },
  { key: 'entertainment', label: 'Fun', icon: 'gamepad-variant', color: '#FFAA00' },
  { key: 'shopping', label: 'Shopping', icon: 'shopping', color: '#8B5CF6' },
  { key: 'bills', label: 'Bills', icon: 'receipt', color: '#EC4899' },
  { key: 'other', label: 'Other', icon: 'dots-horizontal', color: '#6B7280' },
];
