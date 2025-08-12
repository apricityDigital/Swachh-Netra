export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  createdAt?: Date;
}

export enum UserRole {
  VEHICLE_OWNER = 'vehicle_owner',
  DRIVER = 'driver',
  SWATCH_ADMIN = 'swatch_admin',
  ALL_ADMIN = 'all_admin'
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

export interface PredefinedUser {
  role: UserRole;
  displayName: string;
  description: string;
  dashboardColor: string;
}

export const PREDEFINED_USERS: Record<string, PredefinedUser> = {
  'vehicle@gmail.com': {
    role: UserRole.VEHICLE_OWNER,
    displayName: 'Vehicle Admin',
    description: 'Manage fleet operations and vehicle assignments',
    dashboardColor: '#2E7D32'
  },
  'driver@gmail.com': {
    role: UserRole.DRIVER,
    displayName: 'Driver',
    description: 'Access route information and submit reports',
    dashboardColor: '#1976D2'
  },
  'sadmin@gmail.com': {
    role: UserRole.SWATCH_ADMIN,
    displayName: 'Swatch Admin',
    description: 'Oversee area management and compliance',
    dashboardColor: '#FF6F00'
  },
  'admin@gmail.com': {
    role: UserRole.ALL_ADMIN,
    displayName: 'All Admin',
    description: 'Full system access and management',
    dashboardColor: '#7B1FA2'
  }
};

export const COMMON_PASSWORD = 'qwerty';

// Signup Request interfaces
export interface SignupRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  requestedRole: UserRole;
  organization?: string;
  department?: string;
  reason: string;
  password?: string; // Optional for backward compatibility
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewComments?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SignupFormData {
  name: string;
  email: string;
  phone: string;
  requestedRole: UserRole;
  organization: string;
  department: string;
  reason: string;
  password: string;
}

export interface RoleOption {
  label: string;
  value: UserRole;
  description: string;
  color: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    label: 'Vehicle Owner',
    value: UserRole.VEHICLE_OWNER,
    description: 'Manage fleet operations and vehicle assignments',
    color: '#2E7D32'
  },
  {
    label: 'Driver',
    value: UserRole.DRIVER,
    description: 'Access route information and submit reports',
    color: '#1976D2'
  },
  {
    label: 'Swatch Admin',
    value: UserRole.SWATCH_ADMIN,
    description: 'Oversee area management and compliance',
    color: '#FF6F00'
  },
  {
    label: 'All Admin',
    value: UserRole.ALL_ADMIN,
    description: 'Full system access and management',
    color: '#7B1FA2'
  }
];
