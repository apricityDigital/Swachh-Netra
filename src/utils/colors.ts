// SwatchSetu Color Palette
export const Colors = {
  // Primary Colors (Role-based)
  vehicleOwner: '#2E7D32',    // Green - Nature, Growth
  driver: '#1976D2',          // Blue - Trust, Reliability
  swatchAdmin: '#FF6F00',     // Orange - Energy, Enthusiasm
  allAdmin: '#7B1FA2',        // Purple - Authority, Wisdom
  
  // Secondary Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Neutral Colors
  primary: '#2E7D32',
  secondary: '#1976D2',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  
  // Text Colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',
  
  // Border Colors
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  borderDark: '#BDBDBD',
  
  // Shadow Colors
  shadow: '#000000',
  shadowLight: 'rgba(0, 0, 0, 0.1)',
  shadowMedium: 'rgba(0, 0, 0, 0.2)',
  shadowDark: 'rgba(0, 0, 0, 0.3)',
  
  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Status Colors
  online: '#4CAF50',
  offline: '#9E9E9E',
  busy: '#FF5722',
  away: '#FF9800',
};

// Role-based color schemes
export const RoleColors = {
  vehicle_owner: {
    primary: Colors.vehicleOwner,
    light: '#E8F5E8',
    dark: '#1B5E20',
    gradient: ['#2E7D32', '#4CAF50'],
  },
  driver: {
    primary: Colors.driver,
    light: '#E3F2FD',
    dark: '#0D47A1',
    gradient: ['#1976D2', '#42A5F5'],
  },
  swatch_admin: {
    primary: Colors.swatchAdmin,
    light: '#FFF3E0',
    dark: '#E65100',
    gradient: ['#FF6F00', '#FF9800'],
  },
  all_admin: {
    primary: Colors.allAdmin,
    light: '#F3E5F5',
    dark: '#4A148C',
    gradient: ['#7B1FA2', '#AB47BC'],
  },
};

// Common spacing values
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Common border radius values
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 50,
};

// Typography
export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body1: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

// Shadow presets
export const Shadows = {
  small: {
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};
