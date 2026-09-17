import { useTheme } from './useTheme';
import type { Colors } from '../src/constants/theme';

// This hook replaces the broken module-level `useColor()` pattern.
// Use `useTheme()` directly in new code.
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const { C, scheme } = useTheme();
  const colorFromProps = props[scheme];
  if (colorFromProps) return colorFromProps;
  return (C as any)[colorName] ?? C.text;
}

export default useThemeColor;
