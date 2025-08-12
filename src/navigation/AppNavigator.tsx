import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import SignupRequestsScreen from '../screens/SignupRequestsScreen';
import ApprovedUsersScreen from '../screens/ApprovedUsersScreen';
import WorkerManagementScreen from '../screens/WorkerManagementScreen';
import AddWorkerScreen from '../screens/AddWorkerScreen';
import WorkerDetailsScreen from '../screens/WorkerDetailsScreen';
import VehicleOwnerDashboard from '../screens/VehicleOwnerDashboard';
import DriverDashboard from '../screens/DriverDashboard';
import SwatchAdminDashboard from '../screens/SwatchAdminDashboard';
import AllAdminDashboard from '../screens/AllAdminDashboard';
import DebugScreen from '../screens/DebugScreen';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  SignupRequests: undefined;
  ApprovedUsers: undefined;
  WorkerManagement: undefined;
  AddWorker: undefined;
  WorkerDetails: { workerId: string };
  VehicleOwnerDashboard: undefined;
  DriverDashboard: undefined;
  SwatchAdminDashboard: undefined;
  AllAdminDashboard: undefined;
  Debug: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  console.log('🧭 AppNavigator - User:', user?.email, 'Role:', user?.role, 'Loading:', loading);

  // TEMPORARY: Test with hardcoded user (disabled)
  // const testUser = {
  //   uid: 'test',
  //   email: 'vehicle@gmail.com',
  //   role: UserRole.VEHICLE_OWNER,
  //   displayName: 'Test Vehicle Admin',
  //   createdAt: new Date()
  // };

  // Show loading spinner while checking authentication state
  if (loading) {
    return <LoadingSpinner message="Initializing SwatchSetu..." />;
  }

  // Get the appropriate dashboard screen based on user role
  const getDashboardScreen = () => {
    if (!user) {
      console.log('❌ getDashboardScreen: No user');
      return null;
    }

    console.log('🔍 getDashboardScreen: User role is:', user.role);

    switch (user.role) {
      case UserRole.VEHICLE_OWNER:
        console.log('✅ Showing VehicleOwnerDashboard');
        return (
          <Stack.Screen
            name="VehicleOwnerDashboard"
            component={VehicleOwnerDashboard}
            options={{
              title: 'Vehicle Owner Dashboard',
              headerShown: false
            }}
          />
        );
      case UserRole.DRIVER:
        console.log('✅ Showing DriverDashboard');
        return (
          <Stack.Screen
            name="DriverDashboard"
            component={DriverDashboard}
            options={{
              title: 'Driver Dashboard',
              headerShown: false
            }}
          />
        );
      case UserRole.SWATCH_ADMIN:
        console.log('✅ Showing SwatchAdminDashboard');
        return (
          <>
            <Stack.Screen
              name="SwatchAdminDashboard"
              component={SwatchAdminDashboard}
              options={{
                title: 'Swatch Admin Dashboard',
                headerShown: false
              }}
            />
            <Stack.Screen
              name="WorkerManagement"
              component={WorkerManagementScreen}
              options={{
                title: 'Worker Management',
                headerShown: false
              }}
            />
            <Stack.Screen
              name="AddWorker"
              component={AddWorkerScreen}
              options={{
                title: 'Add Worker',
                headerShown: false
              }}
            />
            <Stack.Screen
              name="WorkerDetails"
              component={WorkerDetailsScreen}
              options={{
                title: 'Worker Details',
                headerShown: false
              }}
            />
          </>
        );
      case UserRole.ALL_ADMIN:
        console.log('✅ Showing AllAdminDashboard');
        return (
          <>
            <Stack.Screen
              name="AllAdminDashboard"
              component={AllAdminDashboard}
              options={{
                title: 'All Admin Dashboard',
                headerShown: false
              }}
            />
            <Stack.Screen
              name="SignupRequests"
              component={SignupRequestsScreen}
              options={{
                title: 'Signup Requests',
                headerShown: false
              }}
            />
            <Stack.Screen
              name="ApprovedUsers"
              component={ApprovedUsersScreen}
              options={{
                title: 'Approved Users',
                headerShown: false
              }}
            />
          </>
        );
      default:
        console.log('❌ Unknown user role:', user.role);
        // Show debug screen if role is unknown
        return (
          <Stack.Screen
            name="Debug"
            component={DebugScreen}
            options={{
              title: 'Debug - Unknown Role',
              headerShown: true,
            }}
          />
        );
    }
  };

  // Debug: Show user info on screen temporarily
  if (user) {
    console.log('🎯 User authenticated, showing dashboard for role:', user.role);
  } else {
    console.log('🚫 No user, showing login screen');
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false, // Disable swipe back gesture for security
        }}
      >
        {!user ? (
          // User is not authenticated, show auth screens
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                title: 'SwatchSetu Login',
                animationTypeForReplace: 'pop', // Smooth transition
              }}
            />
            <Stack.Screen
              name="Signup"
              component={SignupScreen}
              options={{
                title: 'Request Access',
                headerShown: false,
              }}
            />
          </>
        ) : (
          // User is authenticated, show appropriate dashboard
          getDashboardScreen() || (
            <Stack.Screen
              name="Debug"
              component={DebugScreen}
              options={{
                title: 'Debug Screen',
                headerShown: true,
              }}
            />
          )
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
