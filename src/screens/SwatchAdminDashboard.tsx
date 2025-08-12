import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface SwatchAdminDashboardProps {
  navigation: any;
}

const SwatchAdminDashboard: React.FC<SwatchAdminDashboardProps> = ({ navigation }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigateToWorkerManagement = () => {
    navigation.navigate('WorkerManagement');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="white" />
          <Text style={styles.backButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Swatch Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Worker Management System</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={60} color="#FF6F00" />
          </View>
          <Text style={styles.welcomeText}>Welcome, Swatch Admin</Text>
          <Text style={styles.description}>
            Manage Swachh workers and oversee operations
          </Text>
        </View>

        <ScrollView style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuCard}
            onPress={navigateToWorkerManagement}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="people" size={32} color="#FF6F00" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Worker Management</Text>
              <Text style={styles.menuSubtitle}>
                Add, update, and manage Swachh workers
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuCard, styles.disabledCard]}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="analytics" size={32} color="#ccc" />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, styles.disabledText]}>Performance Reports</Text>
              <Text style={[styles.menuSubtitle, styles.disabledText]}>Coming soon</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuCard, styles.disabledCard]}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="location" size={32} color="#ccc" />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, styles.disabledText]}>Area Management</Text>
              <Text style={[styles.menuSubtitle, styles.disabledText]}>Coming soon</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6F00',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#fff3e0',
    borderRadius: 50,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6F00',
  },
  disabledCard: {
    borderLeftColor: '#ccc',
    opacity: 0.6,
  },
  menuIconContainer: {
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  disabledText: {
    color: '#ccc',
  },
});

export default SwatchAdminDashboard;
