/**
 * Theme Colors Hook
 * 
 * Provides theme-aware colors for consistent styling across the app.
 * Eliminates the need to repeat color extraction logic in every component.
 */

import { BUS_COLORS } from '@/constants/bus-tracker';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface ThemeColors {
  /** Main background color */
  backgroundColor: string;
  /** Card/surface background color */
  cardColor: string;
  /** Primary text color */
  textColor: string;
  /** Secondary/muted text color */
  secondaryTextColor: string;
  /** Whether dark mode is active */
  isDark: boolean;
}

/**
 * Hook that returns theme-aware colors based on the current color scheme.
 * 
 * @example
 * const { backgroundColor, cardColor, textColor, secondaryTextColor } = useThemeColors();
 * 
 * return (
 *   <View style={{ backgroundColor }}>
 *     <Text style={{ color: textColor }}>Hello</Text>
 *   </View>
 * );
 */
export function useThemeColors(): ThemeColors {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    backgroundColor: isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light,
    cardColor: isDark ? BUS_COLORS.card.dark : BUS_COLORS.card.light,
    textColor: isDark ? BUS_COLORS.text.dark : BUS_COLORS.text.light,
    secondaryTextColor: isDark ? BUS_COLORS.textSecondary.dark : BUS_COLORS.textSecondary.light,
    isDark,
  };
}
