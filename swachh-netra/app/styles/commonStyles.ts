import { StyleSheet, Dimensions, Platform } from "react-native"

const { width, height } = Dimensions.get("window")

// Responsive breakpoints
export const BREAKPOINTS = {
  small: 320,
  medium: 768,
  large: 1024,
}

// Standardized spacing scale
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
}

// Standardized border radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 50,
}

// Standardized font sizes
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  xxxxl: 28,
  xxxxxl: 32,
}

// Standardized font weights
export const FONT_WEIGHTS = {
  light: "300" as const,
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
}

// Color palette - Optimized for accessibility and contrast
export const COLORS = {
  // Primary colors - Blue palette with good contrast
  primary: "#2563eb", // Darker blue for better contrast (was #3b82f6)
  primaryLight: "#eff6ff",
  primaryDark: "#1d4ed8",
  primaryHover: "#1e40af",

  // Secondary colors - Green palette
  secondary: "#059669", // Darker green for better contrast (was #10b981)
  secondaryLight: "#f0fdf4",
  secondaryDark: "#047857",
  secondaryHover: "#065f46",

  // Accent colors - Amber palette
  accent: "#d97706", // Darker amber for better contrast (was #f59e0b)
  accentLight: "#fffbeb",
  accentDark: "#b45309",
  accentHover: "#92400e",

  // Status colors - Enhanced for better visibility
  success: "#059669", // Consistent with secondary
  successLight: "#f0fdf4",
  successDark: "#047857",
  warning: "#d97706", // Consistent with accent
  warningLight: "#fffbeb",
  warningDark: "#b45309",
  error: "#dc2626", // Darker red for better contrast (was #ef4444)
  errorLight: "#fef2f2",
  errorDark: "#b91c1c",
  info: "#2563eb", // Consistent with primary
  infoLight: "#eff6ff",
  infoDark: "#1d4ed8",

  // Neutral colors
  white: "#ffffff",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",
  black: "#000000",

  // Background colors
  background: "#f9fafb",
  surface: "#ffffff",

  // Text colors
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textTertiary: "#9ca3af",
  textInverse: "#ffffff",
}

// Shadow styles
export const SHADOWS = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
}

// Common layout styles
export const commonStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === "ios" ? 0 : SPACING.lg,
  },

  // Content styles
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  contentCentered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },

  // Section styles
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionWithPadding: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
  },

  // Card styles
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardElevated: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },

  // Grid styles
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem2: {
    width: (width - SPACING.xl * 3) / 2,
    marginBottom: SPACING.lg,
  },
  gridItem3: {
    width: (width - SPACING.xl * 4) / 3,
    marginBottom: SPACING.lg,
  },

  // Text styles
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  bodyText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.normal,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.md * 1.5,
  },
  captionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textTertiary,
  },

  // Button styles
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  buttonSecondary: {
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.white,
  },
  buttonTextSecondary: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },

  // Icon button styles
  iconButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonLarge: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  // Input styles
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },

  // Utility styles
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowSpaceBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  column: {
    flexDirection: "column",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  flex1: {
    flex: 1,
  },

  // Margin utilities
  mt: { marginTop: SPACING.md },
  mb: { marginBottom: SPACING.md },
  ml: { marginLeft: SPACING.md },
  mr: { marginRight: SPACING.md },
  mx: { marginHorizontal: SPACING.md },
  my: { marginVertical: SPACING.md },

  // Padding utilities
  pt: { paddingTop: SPACING.md },
  pb: { paddingBottom: SPACING.md },
  pl: { paddingLeft: SPACING.md },
  pr: { paddingRight: SPACING.md },
  px: { paddingHorizontal: SPACING.md },
  py: { paddingVertical: SPACING.md },
})

// Responsive helper functions
export const isSmallScreen = () => width < BREAKPOINTS.medium
export const isMediumScreen = () => width >= BREAKPOINTS.medium && width < BREAKPOINTS.large
export const isLargeScreen = () => width >= BREAKPOINTS.large

export const getResponsiveValue = (small: number, medium: number, large: number) => {
  if (isLargeScreen()) return large
  if (isMediumScreen()) return medium
  return small
}

export const getResponsiveSpacing = (multiplier: number = 1) => {
  return getResponsiveValue(
    SPACING.md * multiplier,
    SPACING.lg * multiplier,
    SPACING.xl * multiplier
  )
}
