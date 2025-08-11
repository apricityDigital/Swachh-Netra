import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@context/AuthContext';
import LoadingSpinner from '@components/common/LoadingSpinner';

import LoginScreen from '@screens/auth/LoginScreen';
import SignUpScreen from '@screens/auth/SignUpScreen';
import DriverDashboard from '@screens/dashboard/DriverDashboard';
import ContractorDashboard from '@screens/dashboard/ContractorDashboard';
import SwachhHRDashboard from '@screens/dashboard/SwachhHRDashboard';
import AdminDashboard from '@screens/dashboard/AdminDashboard';

import { RootStackParamList, AuthStackParamList } from '../types/navigation';
import { UserRole } from '../types/user';

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const AppNavigator: React.FC = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Initializing Swach Netra..." />;
  }

  const getDashboardComponent = (role: UserRole | null) => {
    switch (role) {
      case 'Driver':
        return DriverDashboard;
      case 'Contractor':
        return ContractorDashboard;
      case 'Swachh_HR':
        return SwachhHRDashboard;
      case 'Admin':
        return AdminDashboard;
      default:
        return DriverDashboard;
    }
  };

  const AuthNavigator = () => (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen
            name="Dashboard"
            component={getDashboardComponent(userRole)}
          />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
