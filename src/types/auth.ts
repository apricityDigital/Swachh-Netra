export interface SignUpData {
  name: string;
  email: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

import { UserRole } from './user';
