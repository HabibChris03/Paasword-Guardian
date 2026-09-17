// ─── Password Guardian Design System ─────────────────────────────────────────
// Spec colors: premium cybersecurity aesthetic, banking + security inspired.

export const Colors = {
  light: {
    // Backgrounds
    background: '#F5F7F5',
    surface: '#FFFFFF',
    surfaceSecondary: '#EFF3EF',
    overlay: 'rgba(23, 32, 25, 0.5)',

    // Text
    text: '#172019',
    textSecondary: '#68716A',
    textTertiary: '#9EA89F',
    textInverse: '#FFFFFF',

    // Brand / Primary
    primary: '#6F8F68',
    primaryDark: '#4F7D57',
    primaryLight: '#8FAD88',
    primaryMuted: '#E8F1E7',
    primarySurface: '#F0F5EF',

    // Borders
    border: '#DDE3DD',
    borderStrong: '#C4CEC4',
    divider: '#EDF1ED',

    // Status
    success: '#4F7D57',
    successLight: '#E8F4EA',
    warning: '#D89B3D',
    warningLight: '#FBF3E3',
    danger: '#C95C5C',
    dangerLight: '#FBEAEA',
    info: '#4A7FA5',
    infoLight: '#E5F0F8',

    // Security strength colors
    strengthVeryWeak: '#C95C5C',
    strengthWeak: '#E07C4A',
    strengthFair: '#D89B3D',
    strengthGood: '#6F8F68',
    strengthStrong: '#4F7D57',

    // Tab bar
    tabActive: '#4F7D57',
    tabInactive: '#9EA89F',
    tabBarBg: '#FFFFFF',

    // Score colors
    scoreHigh: '#4F7D57',
    scoreMed: '#D89B3D',
    scoreLow: '#C95C5C',

    // Shadows
    shadow: '#172019',

    // Icon
    icon: '#68716A',
  },
  dark: {
    background: '#131A14',
    surface: '#1E2820',
    surfaceSecondary: '#253027',
    overlay: 'rgba(0, 0, 0, 0.7)',

    text: '#E8EEE8',
    textSecondary: '#9DB09E',
    textTertiary: '#6A7D6B',
    textInverse: '#172019',

    primary: '#7AAD72',
    primaryDark: '#5A9262',
    primaryLight: '#9EC498',
    primaryMuted: '#2A3D29',
    primarySurface: '#1E2D1E',

    border: '#2E3D2F',
    borderStrong: '#3E523F',
    divider: '#253027',

    success: '#5A9262',
    successLight: '#1E2D1E',
    warning: '#E0A84A',
    warningLight: '#2D2515',
    danger: '#D46B6B',
    dangerLight: '#2D1E1E',
    info: '#5A90BE',
    infoLight: '#1A2535',

    strengthVeryWeak: '#D46B6B',
    strengthWeak: '#E08A5A',
    strengthFair: '#E0A84A',
    strengthGood: '#7AAD72',
    strengthStrong: '#5A9262',

    tabActive: '#7AAD72',
    tabInactive: '#6A7D6B',
    tabBarBg: '#1E2820',

    scoreHigh: '#5A9262',
    scoreMed: '#E0A84A',
    scoreLow: '#D46B6B',

    shadow: '#000000',

    // Icon
    icon: '#9DB09E',
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  section: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  card: 20,
  button: 14,
  full: 9999,
} as const;

export const FontFamilies = {
  regular: 'CocomatPro-Regular',
  medium: 'CocomatPro-Medium',
  bold: 'CocomatPro-Bold',
  light: 'CocomatPro-Light',
  input: 'Poppins_400Regular',
  inputMedium: 'Poppins_500Medium',
  inputSemiBold: 'Poppins_600SemiBold',
  inputBold: 'Poppins_700Bold',
} as const;

export const Typography = {
  fontFamily: 'CocomatPro-Regular',
  fontFamilyMedium: 'CocomatPro-Medium',
  fontFamilyBold: 'CocomatPro-Bold',
  fontFamilyLight: 'CocomatPro-Light',
  fontFamilyInput: 'Poppins_400Regular',
  fontFamilyInputMedium: 'Poppins_500Medium',
  fontFamilyInputSemiBold: 'Poppins_600SemiBold',
  fontFamilyInputBold: 'Poppins_700Bold',
  family: FontFamilies,
  size: {
    xs: 11,
    sm: 12,
    base: 13,
    md: 14,
    body: 15,
    bodyLg: 16,
    subtitle: 17,
    title: 18,
    titleLg: 20,
    heading: 22,
    headingLg: 24,
    display: 28,
    displayLg: 32,
    hero: 40,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#172019',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#172019',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#172019',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#172019',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

// Category color map
export const CategoryColors: Record<string, string> = {
  social: '#7B5EA7',
  banking: '#4A7FA5',
  work: '#6F8F68',
  email: '#D89B3D',
  shopping: '#C95C5C',
  entertainment: '#E07C4A',
  development: '#5A7A8A',
  education: '#7BA05B',
  other: '#9EA89F',
};

// Category icon map (Ionicons names)
export const CategoryIcons: Record<string, string> = {
  social: 'people-outline',
  banking: 'card-outline',
  work: 'briefcase-outline',
  email: 'mail-outline',
  shopping: 'bag-outline',
  entertainment: 'play-circle-outline',
  development: 'code-slash-outline',
  education: 'school-outline',
  other: 'ellipsis-horizontal-circle-outline',
};

// Strength color helper
export function getStrengthColor(strength: string, scheme: 'light' | 'dark' = 'light'): string {
  const c = Colors[scheme];
  switch (strength) {
    case 'very-weak': return c.strengthVeryWeak;
    case 'weak':      return c.strengthWeak;
    case 'fair':      return c.strengthFair;
    case 'good':      return c.strengthGood;
    case 'strong':    return c.strengthStrong;
    default:          return c.textTertiary;
  }
}

export function getStrengthLabel(strength: string): string {
  switch (strength) {
    case 'very-weak': return 'Very Weak';
    case 'weak':      return 'Weak';
    case 'fair':      return 'Fair';
    case 'good':      return 'Good';
    case 'strong':    return 'Strong';
    default:          return 'Unknown';
  }
}

export function getScoreGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}
