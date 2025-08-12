import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  FlatList, 
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SignupService } from '../services/signupService';
import { SignupRequest, UserRole, ROLE_OPTIONS } from '../types/auth';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface ApprovedUsersScreenProps {
  navigation: any;
}

const ApprovedUsersScreen: React.FC<ApprovedUsersScreenProps> = ({ navigation }) => {
  const [approvedUsers, setApprovedUsers] = useState<SignupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadApprovedUsers = async () => {
    try {
      const users = await SignupService.getApprovedSignupRequests();
      setApprovedUsers(users);
    } catch (error: any) {
      console.error('Error loading approved users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadApprovedUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadApprovedUsers();
  };

  const getRoleInfo = (role: UserRole) => {
    return ROLE_OPTIONS.find(option => option.value === role);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  if (loading) {
    return <LoadingSpinner message="Loading approved users..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Approved Users</Text>
          <Text style={styles.headerSubtitle}>{approvedUsers.length} users</Text>
        </View>
        
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <FlatList
          data={approvedUsers}
          keyExtractor={(item) => item.id}
          style={styles.usersList}
          contentContainerStyle={styles.usersListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No approved users yet</Text>
              <Text style={styles.emptySubtext}>Approved users will appear here</Text>
            </View>
          )}
          renderItem={({ item: user }) => {
            const roleInfo = getRoleInfo(user.requestedRole);
            return (
              <View style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                  <View style={[styles.roleTag, { backgroundColor: roleInfo?.color || '#666' }]}>
                    <Text style={styles.roleTagText}>{roleInfo?.label || user.requestedRole}</Text>
                  </View>
                </View>
                
                <View style={styles.userDetails}>
                  <Text style={styles.userOrg}>{user.organization} - {user.department}</Text>
                  <Text style={styles.userDate}>
                    Approved: {formatDate(user.reviewedAt)}
                  </Text>
                  {user.reviewedBy && (
                    <Text style={styles.reviewedBy}>
                      By: {user.reviewedBy}
                    </Text>
                  )}
                </View>
                
                <View style={styles.statusContainer}>
                  <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                  <Text style={styles.statusText}>Active User</Text>
                </View>
              </View>
            );
          }}
        />
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
    justifyContent: 'space-between',
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
  refreshButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  usersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  usersListContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  userCard: {
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
    borderLeftColor: '#2E7D32',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  roleTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  userDetails: {
    marginBottom: 8,
  },
  userOrg: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  reviewedBy: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default ApprovedUsersScreen;
