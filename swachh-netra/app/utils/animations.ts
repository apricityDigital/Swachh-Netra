import { Animated, Easing } from "react-native"

// Standard animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
}

// Standard easing functions
export const EASING = {
  // Material Design easing curves
  standard: Easing.bezier(0.4, 0.0, 0.2, 1),
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),
  accelerate: Easing.bezier(0.4, 0.0, 1, 1),
  sharp: Easing.bezier(0.4, 0.0, 0.6, 1),
  
  // Common easing functions
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  
  // Bounce and spring effects
  bounce: Easing.bounce,
  elastic: Easing.elastic(1),
  
  // Linear
  linear: Easing.linear,
}

// Animation presets for common UI interactions
export const ANIMATION_PRESETS = {
  // Fade animations
  fadeIn: {
    duration: ANIMATION_DURATION.normal,
    easing: EASING.decelerate,
    useNativeDriver: true,
  },
  fadeOut: {
    duration: ANIMATION_DURATION.fast,
    easing: EASING.accelerate,
    useNativeDriver: true,
  },
  
  // Scale animations
  scaleIn: {
    duration: ANIMATION_DURATION.normal,
    easing: EASING.decelerate,
    useNativeDriver: true,
  },
  scaleOut: {
    duration: ANIMATION_DURATION.fast,
    easing: EASING.accelerate,
    useNativeDriver: true,
  },
  
  // Slide animations
  slideIn: {
    duration: ANIMATION_DURATION.normal,
    easing: EASING.decelerate,
    useNativeDriver: true,
  },
  slideOut: {
    duration: ANIMATION_DURATION.normal,
    easing: EASING.accelerate,
    useNativeDriver: true,
  },
  
  // Button press animations
  buttonPress: {
    duration: ANIMATION_DURATION.fast,
    easing: EASING.sharp,
    useNativeDriver: true,
  },
  
  // Modal animations
  modalIn: {
    duration: ANIMATION_DURATION.slow,
    easing: EASING.decelerate,
    useNativeDriver: true,
  },
  modalOut: {
    duration: ANIMATION_DURATION.normal,
    easing: EASING.accelerate,
    useNativeDriver: true,
  },
}

// Animation helper functions
export const createFadeAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = ANIMATION_DURATION.normal,
  easing: any = EASING.standard
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  })
}

export const createScaleAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = ANIMATION_DURATION.normal,
  easing: any = EASING.standard
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  })
}

export const createSlideAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = ANIMATION_DURATION.normal,
  easing: any = EASING.standard
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  })
}

export const createSpringAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  tension: number = 100,
  friction: number = 8
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue,
    tension,
    friction,
    useNativeDriver: true,
  })
}

// Sequence animations
export const createSequenceAnimation = (
  animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation => {
  return Animated.sequence(animations)
}

// Parallel animations
export const createParallelAnimation = (
  animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation => {
  return Animated.parallel(animations)
}

// Stagger animations
export const createStaggerAnimation = (
  animations: Animated.CompositeAnimation[],
  staggerTime: number = 100
): Animated.CompositeAnimation => {
  return Animated.stagger(staggerTime, animations)
}

// Loop animations
export const createLoopAnimation = (
  animation: Animated.CompositeAnimation,
  iterations: number = -1 // -1 for infinite
): Animated.CompositeAnimation => {
  return Animated.loop(animation, { iterations })
}

// Common animation combinations
export const animateFadeInUp = (
  fadeValue: Animated.Value,
  translateValue: Animated.Value,
  duration: number = ANIMATION_DURATION.normal
): Animated.CompositeAnimation => {
  return createParallelAnimation([
    createFadeAnimation(fadeValue, 1, duration, EASING.decelerate),
    createSlideAnimation(translateValue, 0, duration, EASING.decelerate),
  ])
}

export const animateFadeOutDown = (
  fadeValue: Animated.Value,
  translateValue: Animated.Value,
  duration: number = ANIMATION_DURATION.fast
): Animated.CompositeAnimation => {
  return createParallelAnimation([
    createFadeAnimation(fadeValue, 0, duration, EASING.accelerate),
    createSlideAnimation(translateValue, 50, duration, EASING.accelerate),
  ])
}

export const animateScaleInFade = (
  scaleValue: Animated.Value,
  fadeValue: Animated.Value,
  duration: number = ANIMATION_DURATION.normal
): Animated.CompositeAnimation => {
  return createParallelAnimation([
    createScaleAnimation(scaleValue, 1, duration, EASING.decelerate),
    createFadeAnimation(fadeValue, 1, duration, EASING.decelerate),
  ])
}

export const animateScaleOutFade = (
  scaleValue: Animated.Value,
  fadeValue: Animated.Value,
  duration: number = ANIMATION_DURATION.fast
): Animated.CompositeAnimation => {
  return createParallelAnimation([
    createScaleAnimation(scaleValue, 0.8, duration, EASING.accelerate),
    createFadeAnimation(fadeValue, 0, duration, EASING.accelerate),
  ])
}

// Button press animation helper
export const animateButtonPress = (
  scaleValue: Animated.Value,
  onComplete?: () => void
): void => {
  createSequenceAnimation([
    createScaleAnimation(scaleValue, 0.95, ANIMATION_DURATION.fast, EASING.sharp),
    createScaleAnimation(scaleValue, 1, ANIMATION_DURATION.fast, EASING.sharp),
  ]).start(onComplete)
}

// Sidebar slide animation
export const animateSidebarSlide = (
  translateValue: Animated.Value,
  isVisible: boolean,
  slideDistance: number,
  duration: number = ANIMATION_DURATION.normal
): Animated.CompositeAnimation => {
  return createSlideAnimation(
    translateValue,
    isVisible ? 0 : -slideDistance,
    duration,
    isVisible ? EASING.decelerate : EASING.accelerate
  )
}

// Modal backdrop animation
export const animateModalBackdrop = (
  opacityValue: Animated.Value,
  isVisible: boolean,
  duration: number = ANIMATION_DURATION.normal
): Animated.CompositeAnimation => {
  return createFadeAnimation(
    opacityValue,
    isVisible ? 1 : 0,
    duration,
    isVisible ? EASING.decelerate : EASING.accelerate
  )
}

// Card entrance animation
export const animateCardEntrance = (
  translateValue: Animated.Value,
  fadeValue: Animated.Value,
  index: number = 0,
  staggerDelay: number = 100
): void => {
  setTimeout(() => {
    animateFadeInUp(fadeValue, translateValue).start()
  }, index * staggerDelay)
}

// Ripple effect animation
export const createRippleAnimation = (
  scaleValue: Animated.Value,
  opacityValue: Animated.Value
): Animated.CompositeAnimation => {
  return createParallelAnimation([
    createScaleAnimation(scaleValue, 1, ANIMATION_DURATION.slow, EASING.linear),
    createSequenceAnimation([
      createFadeAnimation(opacityValue, 0.3, ANIMATION_DURATION.fast, EASING.linear),
      createFadeAnimation(opacityValue, 0, ANIMATION_DURATION.normal, EASING.linear),
    ]),
  ])
}
