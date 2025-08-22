import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
  navigation: any;
  fallbackScreen?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  navigation,
  fallbackScreen = 'Login'
}) => {
  const { userData, isAuthenticated, loading, hasRole, hasPermission } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please log in to access this feature.',
        [{ text: 'OK', onPress: () => navigation.replace('Login') }]
      );
      return;
    }

    if (requiredRole && !hasRole(requiredRole)) {
      Alert.alert(
        'Access Denied',
        `This feature requires ${requiredRole} privileges.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      Alert.alert(
        'Permission Denied',
        'You do not have permission to access this feature.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
  }, [isAuthenticated, userData, loading, requiredRole, requiredPermission]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="security" size={48} color="#3b82f6" />
        <Text style={styles.loadingText}>Verifying access...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="lock" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Authentication Required</Text>
        <Text style={styles.errorMessage}>Please log in to continue</Text>
      </View>
    );
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="admin-panel-settings" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorMessage}>
          This feature requires {requiredRole} privileges
        </Text>
      </View>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="block" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Permission Denied</Text>
        <Text style={styles.errorMessage}>
          You do not have permission to access this feature
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 32,
  },
  errorTitle: {
    marginTop: 24,
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ProtectedRoute;
