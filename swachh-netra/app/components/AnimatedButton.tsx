import React, { useState } from "react"
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Animated,
  StyleSheet,
  ViewStyle,
} from "react-native"
import { animateButtonPress, ANIMATION_DURATION } from "../utils/animations"

// Local style constants to avoid import issues
const COLORS = {
  primary: "#2563eb",
  secondary: "#059669",
  error: "#dc2626",
  gray300: "#d1d5db",
  black: "#000000",
}

const SPACING = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
}

const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
}

const SHADOWS = {
  sm: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
}

interface AnimatedButtonProps extends TouchableOpacityProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "small" | "medium" | "large"
  fullWidth?: boolean
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  style?: ViewStyle
  animationType?: "scale" | "opacity" | "both"
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = "primary",
  size = "medium",
  fullWidth = false,
  loading = false,
  disabled = false,
  children,
  style,
  animationType = "scale",
  onPress,
  ...props
}) => {
  const [scaleAnim] = useState(new Animated.Value(1))
  const [opacityAnim] = useState(new Animated.Value(1))

  const handlePress = () => {
    if (disabled || loading) return

    if (animationType === "scale" || animationType === "both") {
      animateButtonPress(scaleAnim, onPress)
    } else if (animationType === "opacity") {
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: ANIMATION_DURATION.fast,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION.fast,
          useNativeDriver: true,
        }),
      ]).start(() => onPress && onPress())
    } else {
      onPress && onPress()
    }
  }

  const getVariantStyle = () => {
    switch (variant) {
      case "primary":
        return styles.primaryButton
      case "secondary":
        return styles.secondaryButton
      case "outline":
        return styles.outlineButton
      case "ghost":
        return styles.ghostButton
      case "danger":
        return styles.dangerButton
      default:
        return styles.primaryButton
    }
  }

  const getSizeStyle = () => {
    switch (size) {
      case "small":
        return styles.smallButton
      case "medium":
        return styles.mediumButton
      case "large":
        return styles.largeButton
      default:
        return styles.mediumButton
    }
  }

  const getAnimatedStyle = () => {
    const baseStyle: any = {}

    if (animationType === "scale" || animationType === "both") {
      baseStyle.transform = [{ scale: scaleAnim }]
    }

    if (animationType === "opacity" || animationType === "both") {
      baseStyle.opacity = opacityAnim
    }

    return baseStyle
  }

  return (
    <TouchableOpacity
      {...props}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.baseButton,
          getVariantStyle(),
          getSizeStyle(),
          fullWidth && styles.fullWidth,
          disabled && styles.disabledButton,
          loading && styles.loadingButton,
          getAnimatedStyle(),
          style,
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    ...SHADOWS.sm,
  },

  // Variant styles
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  ghostButton: {
    backgroundColor: "transparent",
  },
  dangerButton: {
    backgroundColor: COLORS.error,
  },

  // Size styles
  smallButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 32,
  },
  mediumButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 44,
  },
  largeButton: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    minHeight: 52,
  },

  // State styles
  fullWidth: {
    width: "100%",
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: COLORS.gray300,
  },
  loadingButton: {
    opacity: 0.7,
  },
})

export default AnimatedButton

// Convenience components for common button types
export const PrimaryButton: React.FC<Omit<AnimatedButtonProps, "variant">> = (props) => (
  <AnimatedButton variant="primary" {...props} />
)

export const SecondaryButton: React.FC<Omit<AnimatedButtonProps, "variant">> = (props) => (
  <AnimatedButton variant="secondary" {...props} />
)

export const OutlineButton: React.FC<Omit<AnimatedButtonProps, "variant">> = (props) => (
  <AnimatedButton variant="outline" {...props} />
)

export const GhostButton: React.FC<Omit<AnimatedButtonProps, "variant">> = (props) => (
  <AnimatedButton variant="ghost" {...props} />
)

export const DangerButton: React.FC<Omit<AnimatedButtonProps, "variant">> = (props) => (
  <AnimatedButton variant="danger" {...props} />
)

// Icon button component
interface AnimatedIconButtonProps extends Omit<AnimatedButtonProps, "children"> {
  icon: React.ReactNode
  size?: "small" | "medium" | "large"
}

export const AnimatedIconButton: React.FC<AnimatedIconButtonProps> = ({
  icon,
  size = "medium",
  ...props
}) => {
  const getIconButtonStyle = () => {
    switch (size) {
      case "small":
        return { width: 32, height: 32, borderRadius: BORDER_RADIUS.sm }
      case "medium":
        return { width: 44, height: 44, borderRadius: BORDER_RADIUS.md }
      case "large":
        return { width: 52, height: 52, borderRadius: BORDER_RADIUS.lg }
      default:
        return { width: 44, height: 44, borderRadius: BORDER_RADIUS.md }
    }
  }

  return (
    <AnimatedButton
      {...props}
      size={size}
      style={[getIconButtonStyle(), props.style]}
    >
      {icon}
    </AnimatedButton>
  )
}

// Floating Action Button component
interface AnimatedFABProps extends Omit<AnimatedButtonProps, "variant" | "size"> {
  icon: React.ReactNode
  size?: "normal" | "small" | "large"
}

export const AnimatedFAB: React.FC<AnimatedFABProps> = ({
  icon,
  size = "normal",
  style,
  ...props
}) => {
  const getFABStyle = () => {
    switch (size) {
      case "small":
        return { width: 40, height: 40, borderRadius: 20 }
      case "normal":
        return { width: 56, height: 56, borderRadius: 28 }
      case "large":
        return { width: 72, height: 72, borderRadius: 36 }
      default:
        return { width: 56, height: 56, borderRadius: 28 }
    }
  }

  return (
    <AnimatedButton
      {...props}
      variant="primary"
      style={[
        getFABStyle(),
        {
          position: "absolute",
          bottom: SPACING.xl,
          right: SPACING.xl,
          elevation: 8,
          shadowColor: COLORS.black,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        style,
      ]}
    >
      {icon}
    </AnimatedButton>
  )
}
