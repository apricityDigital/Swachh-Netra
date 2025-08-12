import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { SignupService } from '../services/signupService';

interface AllAdminDashboardProps {
  navigation: any;
}

const AllAdminDashboard: React.FC<AllAdminDashboardProps> = ({ navigation }) => {
  const { logout } = useAuth();
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const loadPendingRequestsCount = async () => {
    try {
      const requests = await SignupService.getPendingSignupRequests();
      setPendingRequestsCount(requests.length);
    } catch (error: any) {
      console.error('Error loading signup requests count:', error);
      setPendingRequestsCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingRequestsCount();
  }, []);

  const navigateToSignupRequests = () => {
    navigation.navigate('SignupRequests');
  };

  const navigateToApprovedUsers = () => {
    navigation.navigate('ApprovedUsers');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="white" />
          <Text style={styles.backButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>All Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>System Management</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="settings" size={60} color="#7B1FA2" />
          </View>
          <Text style={styles.welcomeText}>Welcome, All Admin</Text>
          <Text style={styles.description}>
            Manage system access and user requests
          </Text>
        </View>

        <ScrollView style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuCard}
            onPress={navigateToSignupRequests}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="person-add" size={32} color="#7B1FA2" />
              {pendingRequestsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingRequestsCount}</Text>
                </View>
              )}
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Signup Requests</Text>
              <Text style={styles.menuSubtitle}>
                {pendingRequestsCount > 0
                  ? `${pendingRequestsCount} pending requests`
                  : 'No pending requests'
                }
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={navigateToApprovedUsers}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="people" size={32} color="#2E7D32" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Approved Users</Text>
              <Text style={styles.menuSubtitle}>View all approved users</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuCard, styles.disabledCard]}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="people" size={32} color="#ccc" />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, styles.disabledText]}>User Management</Text>
              <Text style={[styles.menuSubtitle, styles.disabledText]}>Coming soon</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuCard, styles.disabledCard]}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="analytics" size={32} color="#ccc" />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, styles.disabledText]}>System Analytics</Text>
              <Text style={[styles.menuSubtitle, styles.disabledText]}>Coming soon</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuCard, styles.disabledCard]}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="cog" size={32} color="#ccc" />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, styles.disabledText]}>System Settings</Text>
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
    backgroundColor: '#7B1FA2',
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
    backgroundColor: '#f3e5f5',
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
    borderLeftColor: '#7B1FA2',
  },
  disabledCard: {
    borderLeftColor: '#ccc',
    opacity: 0.6,
  },
  menuIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#d32f2f',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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

export default AllAdminDashboard;
