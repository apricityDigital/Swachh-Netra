import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

const DebugScreen: React.FC = () => {
  const { user, loading, error } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🐛 Debug Information</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication State:</Text>
        <Text style={styles.text}>Loading: {loading ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Error: {error || 'None'}</Text>
        <Text style={styles.text}>User: {user ? 'Authenticated' : 'Not authenticated'}</Text>
      </View>

      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Details:</Text>
          <Text style={styles.text}>Email: {user.email}</Text>
          <Text style={styles.text}>UID: {user.uid}</Text>
          <Text style={styles.text}>Role: {user.role}</Text>
          <Text style={styles.text}>Display Name: {user.displayName}</Text>
          <Text style={styles.text}>Created At: {user.createdAt?.toString()}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expected Roles:</Text>
        <Text style={styles.text}>VEHICLE_OWNER: {UserRole.VEHICLE_OWNER}</Text>
        <Text style={styles.text}>DRIVER: {UserRole.DRIVER}</Text>
        <Text style={styles.text}>SWATCH_ADMIN: {UserRole.SWATCH_ADMIN}</Text>
        <Text style={styles.text}>ALL_ADMIN: {UserRole.ALL_ADMIN}</Text>
      </View>

      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Role Comparison:</Text>
          <Text style={styles.text}>
            User role matches VEHICLE_OWNER: {user.role === UserRole.VEHICLE_OWNER ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.text}>
            User role matches DRIVER: {user.role === UserRole.DRIVER ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.text}>
            User role matches SWATCH_ADMIN: {user.role === UserRole.SWATCH_ADMIN ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.text}>
            User role matches ALL_ADMIN: {user.role === UserRole.ALL_ADMIN ? 'Yes' : 'No'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  text: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
    fontFamily: 'monospace',
  },
});

export default DebugScreen;
