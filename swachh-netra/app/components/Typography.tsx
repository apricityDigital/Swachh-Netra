import React from "react"
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from "react-native"

// Local color and font definitions to avoid import issues
const COLORS = {
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textTertiary: "#9ca3af",
  textInverse: "#ffffff",
  success: "#059669",
  warning: "#d97706",
  error: "#dc2626",
}

const FONT_SIZES = {
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

const FONT_WEIGHTS = {
  light: "300" as const,
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
}

interface TypographyProps extends RNTextProps {
  variant?:
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "subtitle1"
  | "subtitle2"
  | "body1"
  | "body2"
  | "caption"
  | "overline"
  color?: "primary" | "secondary" | "tertiary" | "inverse" | "success" | "warning" | "error"
  align?: "left" | "center" | "right" | "justify"
  weight?: "light" | "normal" | "medium" | "semibold" | "bold" | "extrabold"
  children: React.ReactNode
}

const Typography: React.FC<TypographyProps> = ({
  variant = "body1",
  color = "primary",
  align = "left",
  weight,
  style,
  children,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "h1":
        return styles.h1
      case "h2":
        return styles.h2
      case "h3":
        return styles.h3
      case "h4":
        return styles.h4
      case "h5":
        return styles.h5
      case "h6":
        return styles.h6
      case "subtitle1":
        return styles.subtitle1
      case "subtitle2":
        return styles.subtitle2
      case "body1":
        return styles.body1
      case "body2":
        return styles.body2
      case "caption":
        return styles.caption
      case "overline":
        return styles.overline
      default:
        return styles.body1
    }
  }

  const getColorStyle = () => {
    switch (color) {
      case "primary":
        return { color: COLORS.textPrimary }
      case "secondary":
        return { color: COLORS.textSecondary }
      case "tertiary":
        return { color: COLORS.textTertiary }
      case "inverse":
        return { color: COLORS.textInverse }
      case "success":
        return { color: COLORS.success }
      case "warning":
        return { color: COLORS.warning }
      case "error":
        return { color: COLORS.error }
      default:
        return { color: COLORS.textPrimary }
    }
  }

  const getWeightStyle = () => {
    if (!weight) return {}
    return { fontWeight: FONT_WEIGHTS[weight] }
  }

  const getAlignStyle = () => {
    return { textAlign: align }
  }

  return (
    <RNText
      style={[
        getVariantStyle(),
        getColorStyle(),
        getWeightStyle(),
        getAlignStyle(),
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  )
}

const styles = StyleSheet.create({
  h1: {
    fontSize: FONT_SIZES.xxxxxl,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES.xxxxxl * 1.2,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: FONT_SIZES.xxxxl,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES.xxxxl * 1.2,
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES.xxxl * 1.3,
  },
  h4: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES.xxl * 1.3,
  },
  h5: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.xl * 1.4,
  },
  h6: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.lg * 1.4,
  },
  subtitle1: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: FONT_SIZES.lg * 1.5,
  },
  subtitle2: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: FONT_SIZES.md * 1.5,
  },
  body1: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.normal,
    lineHeight: FONT_SIZES.lg * 1.5,
  },
  body2: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.normal,
    lineHeight: FONT_SIZES.md * 1.5,
  },
  caption: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.normal,
    lineHeight: FONT_SIZES.sm * 1.4,
  },
  overline: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: FONT_SIZES.xs * 1.5,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
})

export default Typography

// Convenience components for common use cases
export const Heading1: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="h1" {...props} />
)

export const Heading2: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="h2" {...props} />
)

export const Heading3: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="h3" {...props} />
)

export const Heading4: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="h4" {...props} />
)

export const Heading5: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="h5" {...props} />
)

export const Heading6: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="h6" {...props} />
)

export const Subtitle: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="subtitle1" {...props} />
)

export const Body: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="body1" {...props} />
)

export const Caption: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="caption" {...props} />
)

export const Overline: React.FC<Omit<TypographyProps, "variant">> = (props) => (
  <Typography variant="overline" {...props} />
)
