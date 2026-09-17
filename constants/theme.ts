/**
 * Re-export from the new theme location.
 * This preserves backward compatibility with any existing imports from 'constants/theme'.
 */
export * from '../src/constants/theme';

// Legacy Colors export (used by hooks/use-theme-color.ts)
import { Colors } from '../src/constants/theme';
export { Colors };

// Keep Fonts for any existing consumers
import { Platform } from 'react-native';
export const Fonts = Platform.select({
  ios: {
    sans: 'CocomatPro-Regular',
    serif: 'ui-serif',
    rounded: 'CocomatPro-Regular',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'CocomatPro-Regular',
    serif: 'serif',
    rounded: 'CocomatPro-Regular',
    mono: 'monospace',
  },
  web: {
    sans: "CocomatPro-Regular, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "CocomatPro-Regular, 'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
