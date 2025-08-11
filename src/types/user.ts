export type UserRole = 'Driver' | 'Contractor' | 'Swachh_HR' | 'Admin';

export interface User {
  uid: string;
  email: string;
  name: string;
  mobileNumber: string;
  role: UserRole;
  createdAt: any;
  emailVerified: boolean;
  projectId?: string;
}

export interface RoleOption {
  label: string;
  value: UserRole;
}

// Role options for Swach Netra (excluding Admin from signup)
export const ROLE_OPTIONS: RoleOption[] = [
  { label: 'Driver', value: 'Driver' },
  { label: 'Contractor', value: 'Contractor' },
  { label: 'Swachh HR', value: 'Swachh_HR' },
];
