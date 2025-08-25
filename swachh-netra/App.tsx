import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './contexts/AuthContext';
import Login from './app/screens/auth/Login';
import Signup from './app/screens/auth/Signup';
import AdminDashboard from './app/screens/admin/AdminDashboard';
import UserManagement from './app/screens/admin/UserManagement';
import FeederPointManagement from './app/screens/admin/FeederPointManagement';
import FeederPointAssignmentScreen from './app/screens/admin/FeederPointAssignment';
import VehicleManagement from './app/screens/admin/VehicleManagement';
import VehicleAssignmentScreen from './app/screens/admin/VehicleAssignment';
import ContractorManagement from './app/screens/admin/ContractorManagement';
import DriverManagement from './app/screens/admin/DriverManagement';
import AdminReports from './app/screens/admin/AdminReports';
import AdminSettings from './app/screens/admin/AdminSettings';
import SwachhHRManagement from './app/screens/admin/SwachhHRManagement';
import ContractorDashboard from './app/screens/contractor/ContractorDashboard';
import DriverApprovals from './app/screens/contractor/DriverApprovals';
import DriverAssignment from './app/screens/contractor/DriverAssignment';
import ContractorFeederPoints from './app/screens/contractor/ContractorFeederPoints';
import DriverDashboard from './app/screens/driver/DriverDashboard';
import WorkerAttendance from './app/screens/driver/WorkerAttendance';
import TripRecording from './app/screens/driver/TripRecording';
import SwachhHRDashboard from './app/screens/swachh_hr/SwachhHRDashboard';
import WorkerManagement from './app/screens/swachh_hr/WorkerManagement';
import WorkerApprovals from './app/screens/admin/WorkerApprovals';




import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName='Login'>
            <Stack.Screen name='Login' component={Login} options={{ headerShown: false }} />
            <Stack.Screen name='Signup' component={Signup} options={{ headerShown: false }} />
            <Stack.Screen name='AdminDashboard' component={AdminDashboard} options={{ headerShown: false }} />
            <Stack.Screen name='UserManagement' component={UserManagement} options={{ headerShown: false }} />
            <Stack.Screen name='FeederPointManagement' component={FeederPointManagement} options={{ headerShown: false }} />
            <Stack.Screen name='FeederPointAssignment' component={FeederPointAssignmentScreen} options={{ headerShown: false }} />
            <Stack.Screen name='VehicleManagement' component={VehicleManagement} options={{ headerShown: false }} />
            <Stack.Screen name='VehicleAssignment' component={VehicleAssignmentScreen} options={{ headerShown: false }} />
            <Stack.Screen name='ContractorManagement' component={ContractorManagement} options={{ headerShown: false }} />
            <Stack.Screen name='DriverManagement' component={DriverManagement} options={{ headerShown: false }} />
            <Stack.Screen name='AdminReports' component={AdminReports} options={{ headerShown: false }} />
            <Stack.Screen name='AdminSettings' component={AdminSettings} options={{ headerShown: false }} />
            <Stack.Screen name='SwachhHRManagement' component={SwachhHRManagement} options={{ headerShown: false }} />
            <Stack.Screen name='ContractorDashboard' component={ContractorDashboard} options={{ headerShown: false }} />
            <Stack.Screen name='DriverApprovals' component={DriverApprovals} options={{ headerShown: false }} />
            <Stack.Screen name='DriverAssignment' component={DriverAssignment} options={{ headerShown: false }} />
            <Stack.Screen name='ContractorFeederPoints' component={ContractorFeederPoints} options={{ headerShown: false }} />
            <Stack.Screen name='DriverDashboard' component={DriverDashboard} options={{ headerShown: false }} />
            <Stack.Screen name='WorkerAttendance' component={WorkerAttendance} options={{ headerShown: false }} />
            <Stack.Screen name='TripRecording' component={TripRecording} options={{ headerShown: false }} />
            <Stack.Screen name='SwachhHRDashboard' component={SwachhHRDashboard} options={{ headerShown: false }} />
            <Stack.Screen name='WorkerManagement' component={WorkerManagement} options={{ headerShown: false }} />
            <Stack.Screen name='WorkerApprovals' component={WorkerApprovals} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  )



}

