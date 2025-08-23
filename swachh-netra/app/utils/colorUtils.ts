import { COLORS } from "../styles/commonStyles"

/**
 * Convert hex color to RGB values
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Calculate relative luminance of a color
 */
export const getLuminance = (hex: string): number => {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0

  const { r, g, b } = rgb
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return (brightest + 0.05) / (darkest + 0.05)
}

/**
 * Check if contrast ratio meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
 */
export const meetsContrastStandard = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background)
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * Check if contrast ratio meets WCAG AAA standards (7:1 for normal text, 4.5:1 for large text)
 */
export const meetsContrastStandardAAA = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background)
  return isLargeText ? ratio >= 4.5 : ratio >= 7
}

/**
 * Get accessible text color for a given background
 */
export const getAccessibleTextColor = (backgroundColor: string): string => {
  const whiteContrast = getContrastRatio(COLORS.white, backgroundColor)
  const blackContrast = getContrastRatio(COLORS.black, backgroundColor)
  
  return whiteContrast > blackContrast ? COLORS.white : COLORS.black
}

/**
 * Predefined accessible color combinations
 */
export const ACCESSIBLE_COMBINATIONS = {
  // Primary combinations
  primaryOnWhite: {
    background: COLORS.white,
    text: COLORS.primary,
    contrast: getContrastRatio(COLORS.primary, COLORS.white),
  },
  whiteOnPrimary: {
    background: COLORS.primary,
    text: COLORS.white,
    contrast: getContrastRatio(COLORS.white, COLORS.primary),
  },
  
  // Success combinations
  successOnWhite: {
    background: COLORS.white,
    text: COLORS.success,
    contrast: getContrastRatio(COLORS.success, COLORS.white),
  },
  whiteOnSuccess: {
    background: COLORS.success,
    text: COLORS.white,
    contrast: getContrastRatio(COLORS.white, COLORS.success),
  },
  
  // Warning combinations
  warningOnWhite: {
    background: COLORS.white,
    text: COLORS.warning,
    contrast: getContrastRatio(COLORS.warning, COLORS.white),
  },
  blackOnWarning: {
    background: COLORS.warning,
    text: COLORS.black,
    contrast: getContrastRatio(COLORS.black, COLORS.warning),
  },
  
  // Error combinations
  errorOnWhite: {
    background: COLORS.white,
    text: COLORS.error,
    contrast: getContrastRatio(COLORS.error, COLORS.white),
  },
  whiteOnError: {
    background: COLORS.error,
    text: COLORS.white,
    contrast: getContrastRatio(COLORS.white, COLORS.error),
  },
  
  // Text combinations
  primaryTextOnBackground: {
    background: COLORS.background,
    text: COLORS.textPrimary,
    contrast: getContrastRatio(COLORS.textPrimary, COLORS.background),
  },
  secondaryTextOnBackground: {
    background: COLORS.background,
    text: COLORS.textSecondary,
    contrast: getContrastRatio(COLORS.textSecondary, COLORS.background),
  },
  tertiaryTextOnBackground: {
    background: COLORS.background,
    text: COLORS.textTertiary,
    contrast: getContrastRatio(COLORS.textTertiary, COLORS.background),
  },
}

/**
 * Validate all color combinations and log warnings for poor contrast
 */
export const validateColorCombinations = (): void => {
  console.log("🎨 Validating color combinations for accessibility...")
  
  Object.entries(ACCESSIBLE_COMBINATIONS).forEach(([name, combination]) => {
    const { background, text, contrast } = combination
    const meetsAA = meetsContrastStandard(text, background)
    const meetsAAA = meetsContrastStandardAAA(text, background)
    
    if (!meetsAA) {
      console.warn(`⚠️  ${name}: Poor contrast ratio ${contrast.toFixed(2)}:1 (needs 4.5:1)`)
    } else if (!meetsAAA) {
      console.log(`✅ ${name}: Good contrast ratio ${contrast.toFixed(2)}:1 (AA compliant)`)
    } else {
      console.log(`🌟 ${name}: Excellent contrast ratio ${contrast.toFixed(2)}:1 (AAA compliant)`)
    }
  })
}

/**
 * Get status color with proper contrast
 */
export const getStatusColor = (
  status: "success" | "warning" | "error" | "info",
  variant: "background" | "text" | "light" = "text"
): string => {
  switch (status) {
    case "success":
      return variant === "background" 
        ? COLORS.success 
        : variant === "light" 
        ? COLORS.successLight 
        : COLORS.success
    case "warning":
      return variant === "background" 
        ? COLORS.warning 
        : variant === "light" 
        ? COLORS.warningLight 
        : COLORS.warning
    case "error":
      return variant === "background" 
        ? COLORS.error 
        : variant === "light" 
        ? COLORS.errorLight 
        : COLORS.error
    case "info":
      return variant === "background" 
        ? COLORS.info 
        : variant === "light" 
        ? COLORS.infoLight 
        : COLORS.info
    default:
      return COLORS.gray500
  }
}

/**
 * Generate theme-aware colors for different UI states
 */
export const getThemeColors = (isDarkMode: boolean = false) => {
  if (isDarkMode) {
    // Dark theme colors (for future implementation)
    return {
      background: COLORS.gray900,
      surface: COLORS.gray800,
      textPrimary: COLORS.white,
      textSecondary: COLORS.gray300,
      textTertiary: COLORS.gray400,
      border: COLORS.gray700,
    }
  }
  
  // Light theme colors (current)
  return {
    background: COLORS.background,
    surface: COLORS.surface,
    textPrimary: COLORS.textPrimary,
    textSecondary: COLORS.textSecondary,
    textTertiary: COLORS.textTertiary,
    border: COLORS.gray200,
  }
}
