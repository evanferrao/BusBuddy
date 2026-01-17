/**
 * Theme Context
 * 
 * Provides Material You / Monet dynamic theming support.
 * On Android 12+, colors are extracted from the user's wallpaper.
 * On other platforms, falls back to default app colors.
 */

import { BUS_COLORS } from '@/constants/bus-tracker';
import MaterialYou, { MaterialYouPalette } from 'react-native-material-you-colors';

// Define the shape of our dynamic theme
export interface DynamicTheme {
  // Core Material You colors
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  
  // Surface colors
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  
  // Utility colors
  outline: string;
  outlineVariant: string;
  
  // Status colors (keep consistent for UX)
  success: string;
  danger: string;
  warning: string;
  info: string;
  
  // Legacy colors for backward compatibility
  card: string;
  text: string;
  textSecondary: string;
  
  // Is using dynamic colors
  isDynamic: boolean;
}

// Map Material You palette to our theme format
// Palette shade indices: 0=lightest (0), 12=darkest (1000)
// Light theme uses lighter shades for backgrounds, darker for content
// Dark theme uses darker shades for backgrounds, lighter for content
const mapPaletteToTheme = (palette: MaterialYouPalette): { light: Record<string, unknown>; dark: Record<string, unknown>; } => {
  return {
    light: {
      // Primary colors - use accent1
      primary: palette.system_accent1[6],        // 500
      onPrimary: palette.system_accent1[0],      // 0 (white)
      primaryContainer: palette.system_accent1[2], // 100
      onPrimaryContainer: palette.system_accent1[9], // 700
      
      // Secondary colors - use accent2
      secondary: palette.system_accent2[6],       // 500
      onSecondary: palette.system_accent2[0],     // 0
      secondaryContainer: palette.system_accent2[2], // 100
      onSecondaryContainer: palette.system_accent2[9], // 700
      
      // Tertiary colors - use accent3
      tertiary: palette.system_accent3[6],        // 500
      onTertiary: palette.system_accent3[0],      // 0
      tertiaryContainer: palette.system_accent3[2], // 100
      onTertiaryContainer: palette.system_accent3[9], // 700
      
      // Surface colors - use neutral1
      background: palette.system_neutral1[1],     // 50
      onBackground: palette.system_neutral1[10],  // 800
      surface: palette.system_neutral1[0],        // 0 (white-ish)
      onSurface: palette.system_neutral1[10],     // 800
      
      // Surface variant - use neutral2
      surfaceVariant: palette.system_neutral2[2], // 100
      onSurfaceVariant: palette.system_neutral2[8], // 600
      
      // Outline
      outline: palette.system_neutral2[6],        // 500
      outlineVariant: palette.system_neutral2[3], // 200
      
      // Status colors (consistent across themes)
      success: BUS_COLORS.success,
      danger: BUS_COLORS.danger,
      warning: BUS_COLORS.warning,
      info: BUS_COLORS.info,
      
      // Legacy compatibility
      card: palette.system_neutral1[0],
      text: palette.system_neutral1[10],
      textSecondary: palette.system_neutral2[7],
      
      isDynamic: true,
    },
    dark: {
      // Primary colors - use accent1 (inverted for dark)
      primary: palette.system_accent1[4],         // 300
      onPrimary: palette.system_accent1[9],       // 700
      primaryContainer: palette.system_accent1[8], // 600
      onPrimaryContainer: palette.system_accent1[2], // 100
      
      // Secondary colors - use accent2
      secondary: palette.system_accent2[4],        // 300
      onSecondary: palette.system_accent2[9],      // 700
      secondaryContainer: palette.system_accent2[8], // 600
      onSecondaryContainer: palette.system_accent2[2], // 100
      
      // Tertiary colors - use accent3
      tertiary: palette.system_accent3[4],         // 300
      onTertiary: palette.system_accent3[9],       // 700
      tertiaryContainer: palette.system_accent3[8], // 600
      onTertiaryContainer: palette.system_accent3[2], // 100
      
      // Surface colors - use neutral1 (dark backgrounds)
      background: palette.system_neutral1[11],     // 900
      onBackground: palette.system_neutral1[2],    // 100
      surface: palette.system_neutral1[10],        // 800
      onSurface: palette.system_neutral1[2],       // 100
      
      // Surface variant - use neutral2
      surfaceVariant: palette.system_neutral2[9],  // 700
      onSurfaceVariant: palette.system_neutral2[3], // 200
      
      // Outline
      outline: palette.system_neutral2[5],         // 400
      outlineVariant: palette.system_neutral2[8],  // 600
      
      // Status colors (consistent across themes)
      success: BUS_COLORS.success,
      danger: BUS_COLORS.danger,
      warning: BUS_COLORS.warning,
      info: BUS_COLORS.info,
      
      // Legacy compatibility
      card: palette.system_neutral1[10],
      text: palette.system_neutral1[2],
      textSecondary: palette.system_neutral2[4],
      
      isDynamic: true,
    },
  };
};

// Create the theme context using Material You
const { useMaterialYouTheme, ThemeProvider } = MaterialYou.createThemeContext(mapPaletteToTheme);

// Re-export with our naming
export { ThemeProvider };

// Custom hook to get theme with proper typing
export function useTheme() {
  const themeContext = useMaterialYouTheme();
  // Extract the theme properties, casting to our DynamicTheme
  const theme: DynamicTheme = {
    primary: themeContext.primary as string,
    onPrimary: themeContext.onPrimary as string,
    primaryContainer: themeContext.primaryContainer as string,
    onPrimaryContainer: themeContext.onPrimaryContainer as string,
    secondary: themeContext.secondary as string,
    onSecondary: themeContext.onSecondary as string,
    secondaryContainer: themeContext.secondaryContainer as string,
    onSecondaryContainer: themeContext.onSecondaryContainer as string,
    tertiary: themeContext.tertiary as string,
    onTertiary: themeContext.onTertiary as string,
    tertiaryContainer: themeContext.tertiaryContainer as string,
    onTertiaryContainer: themeContext.onTertiaryContainer as string,
    background: themeContext.background as string,
    onBackground: themeContext.onBackground as string,
    surface: themeContext.surface as string,
    onSurface: themeContext.onSurface as string,
    surfaceVariant: themeContext.surfaceVariant as string,
    onSurfaceVariant: themeContext.onSurfaceVariant as string,
    outline: themeContext.outline as string,
    outlineVariant: themeContext.outlineVariant as string,
    success: themeContext.success as string,
    danger: themeContext.danger as string,
    warning: themeContext.warning as string,
    info: themeContext.info as string,
    card: themeContext.card as string,
    text: themeContext.text as string,
    textSecondary: themeContext.textSecondary as string,
    isDynamic: themeContext.isDynamic as boolean,
  };

  return {
    theme,
    setColorScheme: themeContext.setColorScheme,
    setMaterialYouColor: themeContext.setMaterialYouColor,
    setPaletteStyle: themeContext.setPaletteStyle,
    seedColor: themeContext.seedColor,
    palette: themeContext.palette,
  };
}

// Hook to get just the theme colors (convenience)
export function useThemeColors(): DynamicTheme {
  const { theme } = useTheme();
  return theme;
}

// Default fallback colors when Material You is not available (for reference)
export const getDefaultTheme = (isDark: boolean): DynamicTheme => ({
  primary: BUS_COLORS.primary,
  onPrimary: '#FFFFFF',
  primaryContainer: isDark ? '#5C3D00' : '#FFE0B2',
  onPrimaryContainer: isDark ? '#FFE0B2' : '#3E2723',
  secondary: BUS_COLORS.secondary,
  onSecondary: '#FFFFFF',
  secondaryContainer: isDark ? '#004A77' : '#D1E4FF',
  onSecondaryContainer: isDark ? '#D1E4FF' : '#001D36',
  tertiary: BUS_COLORS.info,
  onTertiary: '#FFFFFF',
  tertiaryContainer: isDark ? '#3D3580' : '#E8DDFF',
  onTertiaryContainer: isDark ? '#E8DDFF' : '#1D1148',
  
  background: isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light,
  onBackground: isDark ? '#FFFFFF' : '#000000',
  surface: isDark ? BUS_COLORS.card.dark : BUS_COLORS.card.light,
  onSurface: isDark ? '#FFFFFF' : '#000000',
  surfaceVariant: isDark ? '#49454F' : '#E7E0EC',
  onSurfaceVariant: isDark ? '#CAC4D0' : '#49454F',
  
  outline: isDark ? '#938F99' : '#79747E',
  outlineVariant: isDark ? '#49454F' : '#CAC4D0',
  
  success: BUS_COLORS.success,
  danger: BUS_COLORS.danger,
  warning: BUS_COLORS.warning,
  info: BUS_COLORS.info,
  
  card: isDark ? BUS_COLORS.card.dark : BUS_COLORS.card.light,
  text: isDark ? BUS_COLORS.text.dark : BUS_COLORS.text.light,
  textSecondary: isDark ? BUS_COLORS.textSecondary.dark : BUS_COLORS.textSecondary.light,
  
  isDynamic: false,
});
