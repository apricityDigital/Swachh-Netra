import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';

// Import Firebase to ensure it's initialized
try {
  require('./src/config/firebase');
  console.log('Firebase imported successfully');
} catch (error) {
  console.error('Firebase import error:', error);
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}
