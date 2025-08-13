import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import Login from './app/screens/auth/Login';
import Signup from './app/screens/auth/Signup';
import AdminDashboard from './app/screens/admin/AdminDashboard';
import ContractorDashboard from './app/screens/contractor/ContractorDashboard';
import DriverDashboard from './app/screens/driver/DriverDashboard';


import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Login'>
        <Stack.Screen name='Login' component={Login} options={{ headerShown: false }} />
        <Stack.Screen name='Signup' component={Signup} options={{ headerShown: false }} />
        <Stack.Screen name='AdminDashboard' component={AdminDashboard} options={{ headerShown: false }} />
        <Stack.Screen name='ContractorDashboard' component={ContractorDashboard} options={{ headerShown: false }} />
        <Stack.Screen name='DriverDashboard' component={DriverDashboard} options={{ headerShown: false }} />

      </Stack.Navigator>
    </NavigationContainer>
  )



}

