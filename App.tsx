import React from 'react';
import { StatusBar } from 'react-native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { AuthProvider } from '@context/AuthContext';
import AppNavigator from '@navigation/AppNavigator';

// Custom theme for Swach Netra
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4caf50',
    accent: '#2e7d32',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
  },
};

const App: React.FC = () => {
  return (
    <PaperProvider theme={theme}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
};

export default App;
