import { useColorScheme } from 'react-native';
import { Colors } from '../src/constants/theme';

export type ThemeColors = {
  [K in keyof typeof Colors.light]: string;
};

export function useTheme(): { C: ThemeColors; scheme: 'light' | 'dark' } {
  const scheme: 'light' | 'dark' = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { C: Colors[scheme] as ThemeColors, scheme };
}

export default useTheme;
