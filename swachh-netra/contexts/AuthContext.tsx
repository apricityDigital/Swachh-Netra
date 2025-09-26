import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { FIREBASE_AUTH } from '../FirebaseConfig';
import FirebaseService, { UserData } from '../services/FirebaseService';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<UserData>) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserData>) => Promise<void>;
  refreshUserData: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isContractor: () => boolean;
  isDriver: () => boolean;
  isSwachhHR: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Get device information
  const getDeviceInfo = async () => {
    try {
      return {
        deviceId: 'mobile-device',
        platform: Platform.OS,
        version: Platform.Version.toString(),
        model: 'unknown',
        brand: 'unknown',
        networkType: 'unknown',
        isConnected: true
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      return {
        deviceId: 'mobile-device',
        platform: Platform.OS,
        version: Platform.Version.toString(),
        model: 'unknown',
        brand: 'unknown',
        networkType: 'unknown',
        isConnected: true
      };
    }
  };

  // Get IP address (simplified for demo)
  const getIPAddress = async (): Promise<string> => {
    try {
      // In a real app, you'd call an API to get the public IP
      // For demo purposes, we'll use a placeholder
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (error) {
      console.error('Error getting IP address:', error);
      return 'unknown';
    }
  };

  // Store authentication data locally
  const storeAuthData = async (user: User, userData: UserData) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  };

  // Clear authentication data
  const clearAuthData = async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'userData']);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  // Load stored authentication data
  const loadStoredAuthData = async () => {
    try {
      const [storedUser, storedUserData] = await AsyncStorage.multiGet(['user', 'userData']);
      if (storedUser[1] && storedUserData[1]) {
        const parsedUser = JSON.parse(storedUser[1]);
        const parsedUserData = JSON.parse(storedUserData[1]);
        return { user: parsedUser, userData: parsedUserData };
      }
    } catch (error) {
      console.error('Error loading stored auth data:', error);
    }
    return null;
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const deviceInfo = await getDeviceInfo();
      const user = await FirebaseService.signIn(email, password, deviceInfo);

      // Get user data from Firestore
      const userData = await FirebaseService.getUserData(user.uid);
      if (userData) {
        // Update IP address
        const ipAddress = await getIPAddress();
        const updatedIpAddresses = userData.ipAddresses || [];
        if (!updatedIpAddresses.includes(ipAddress)) {
          updatedIpAddresses.push(ipAddress);
          await FirebaseService.updateUserData(user.uid, {
            ipAddresses: updatedIpAddresses
          });
          userData.ipAddresses = updatedIpAddresses;
        }

        setUser(user);
        setUserData(userData);
        setIsAuthenticated(true);
        await storeAuthData(user, userData);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, userDataInput: Partial<UserData>) => {
    try {
      setLoading(true);
      const deviceInfo = await getDeviceInfo();
      const ipAddress = await getIPAddress();

      const { user, userData } = await FirebaseService.signUp(email, password, {
        ...userDataInput,
        deviceInfo,
        ipAddresses: [ipAddress]
      });

      setUser(user);
      setUserData(userData);
      setIsAuthenticated(true);
      await storeAuthData(user, userData);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      await FirebaseService.signOut();
      setUser(null);
      setUserData(null);
      setIsAuthenticated(false);
      await clearAuthData();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      await FirebaseService.resetPassword(email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<UserData>) => {
    try {
      if (user && userData) {
        await FirebaseService.updateUserData(user.uid, data);
        const updatedUserData = { ...userData, ...data };
        setUserData(updatedUserData);
        await storeAuthData(user, updatedUserData);
      }
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  };

  // Refresh user data 
  const refreshUserData = async () => {
    try {
      if (user) {
        const freshUserData = await FirebaseService.getUserData(user.uid);
        if (freshUserData) {
          setUserData(freshUserData);
          await storeAuthData(user, freshUserData);
        }
      }
    } catch (error) {
      console.error('Refresh user data error:', error);
      throw error;
    }
  };

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
      try {
        if (user) {
          // User is signed in
          const userData = await FirebaseService.getUserData(user.uid);
          if (userData) {
            setUser(user);
            setUserData(userData);
            setIsAuthenticated(true);
            await storeAuthData(user, userData);
          }
        } else {
          // User is signed out
          setUser(null);
          setUserData(null);
          setIsAuthenticated(false);
          await clearAuthData();
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Load stored data on app start
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const storedData = await loadStoredAuthData();
        if (storedData && !user) {
          // Verify the stored data is still valid
          const freshUserData = await FirebaseService.getUserData(storedData.userData.uid);
          if (freshUserData) {
            setUser(storedData.user);
            setUserData(freshUserData);
            setIsAuthenticated(true);
          } else {
            await clearAuthData();
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        await clearAuthData();
      }
    };

    loadInitialData();
  }, []);

  // Role checking functions
  const hasRole = (role: string): boolean => {
    return userData?.role === role;
  };

  const hasPermission = (permission: string): boolean => {
    if (!userData?.role) return false;

    const permissions = getRolePermissions(userData.role);
    return permissions[permission] === true;
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isContractor = (): boolean => hasRole('transport_contractor');
  const isDriver = (): boolean => hasRole('driver');
  const isSwachhHR = (): boolean => hasRole('swachh_hr');

  // Get role permissions
  const getRolePermissions = (role: string): any => {
    switch (role) {
      case 'admin':
        return {
          canManageUsers: true,
          canViewAllReports: true,
          canAssignTasks: true,
          canGenerateReports: true,
          canManageSystem: true,
          canApproveRequests: true,
          canManageFeederPoints: true,
          canManageVehicles: true,
          canManageAssignments: true,
          canAssignDriversToContractors: true,
          canViewAllAttendance: true,
          canManageDriverAssignments: true,
          canEditAttendanceRecords: true,
          canBulkUpdateAttendance: true,
          canExportAttendanceData: true,
          canManageAttendancePolicies: true,
          canFilterAttendanceByEmployee: true
        };
      case 'transport_contractor':
        return {
          canManageDrivers: false, // Cannot assign drivers to themselves
          canViewDriverReports: true,
          canAssignRoutes: true,
          canManageVehicles: true,
          canApproveDrivers: false, // Cannot approve drivers
          canAssignVehiclesToDrivers: true, // Can assign vehicles to already assigned drivers
          canViewAssignedDriverAttendance: true
        };
      case 'swachh_hr':
        return {
          canManageWorkers: true,
          canViewReports: true,
          canAssignTasks: true,
          canGenerateReports: true,
          canViewAllAttendance: true,
          canFilterAttendanceByEmployee: true,
          canExportAttendanceData: true,
          canEditAttendanceRecords: true,
          canBulkUpdateAttendance: true,
          canManageAttendancePolicies: true
        };
      case 'driver':
      default:
        return {
          canSubmitReports: true,
          canViewAssignedRoutes: true,
          canUpdateStatus: true
        };
    }
  };

  const value: AuthContextType = {
    user,
    userData,
    loading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
    refreshUserData,
    hasRole,
    hasPermission,
    isAdmin,
    isContractor,
    isDriver,
    isSwachhHR
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
