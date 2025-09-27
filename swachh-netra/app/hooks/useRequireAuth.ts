import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

interface UseRequireAuthOptions {
  requiredRole?: string;
  requiredPermission?: string;
  redirectTo?: string;
  showAlert?: boolean;
}

export const useRequireAuth = (
  navigation: any,
  options: UseRequireAuthOptions = {}
) => {
  const {
    requiredRole,
    requiredPermission,
    redirectTo = 'Login',
    showAlert = true
  } = options;

  const {
    userData,
    isAuthenticated,
    loading,
    hasRole,
    hasPermission
  } = useAuth();

  // Redirect to login page if user is not authenticated

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      if (showAlert) {
        Alert.alert(
          'Authentication Required',
          'Please log in to access this feature.',
          [{ text: 'OK', onPress: () => navigation.replace(redirectTo) }]
        );
      } else {
        navigation.replace(redirectTo);

      }
      return;
    }

    if (requiredRole && !hasRole(requiredRole)) {
      if (showAlert) {
        Alert.alert(
          'Access Denied',
          `This feature requires ${requiredRole} privileges.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        navigation.goBack();
      }
      return;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      if (showAlert) {
        Alert.alert(
          'Permission Denied',
          'You do not have permission to access this feature.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        navigation.goBack();
      }
      return;
    }
  }, [isAuthenticated, userData, loading, requiredRole, requiredPermission]);

  return {
    isAuthenticated,
    userData,
    loading,
    hasRole,
    hasPermission,
    hasAccess: isAuthenticated &&
      (!requiredRole || hasRole(requiredRole)) &&
      (!requiredPermission || hasPermission(requiredPermission))
  };
};

export const useRequireAdmin = (navigation: any) => {
  return useRequireAuth(navigation, { requiredRole: 'admin' });
};

export const useRequireContractor = (navigation: any) => {
  return useRequireAuth(navigation, { requiredRole: 'transport_contractor' });
};

export const useRequireDriver = (navigation: any) => {
  return useRequireAuth(navigation, { requiredRole: 'driver' });
};

export const useRequireSwachhHR = (navigation: any) => {
  return useRequireAuth(navigation, { requiredRole: 'swachh_hr' });
};
