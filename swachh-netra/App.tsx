import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import Login from './app/screens/Login';
import Home from './app/screens/Home';
import Admin from './app/screens/admin/Admin';
import { StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Signup from './app/screens/Signup';
const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Login'>
        <Stack.Screen name='Login' component={Login} options={{ headerShown: false }} />
        <Stack.Screen name='Signup' component={Signup} options={{ headerShown: false }} />
        <Stack.Screen name='Home' component={Home} options={{ headerShown: false }} />
        <Stack.Screen name='Admin' component={Admin} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  )



}

