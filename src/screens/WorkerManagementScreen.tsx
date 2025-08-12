import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { WorkerService } from '../services/workerService';
import { SwachhWorker, WORKER_STATUS_OPTIONS } from '../types/worker';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface WorkerManagementScreenProps {
  navigation: any;
}

const WorkerManagementScreen: React.FC<WorkerManagementScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<SwachhWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWorkers = async () => {
    if (!user?.uid) return;
    
    try {
      const workersList = await WorkerService.getWorkersByAdmin(user.uid);
      setWorkers(workersList);
    } catch (error: any) {
      console.error('Error loading workers:', error);
      Alert.alert('Error', 'Failed to load workers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, [user?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWorkers();
  };

  const handleAddWorker = () => {
    navigation.navigate('AddWorker');
  };

  const handleWorkerPress = (worker: SwachhWorker) => {
    navigation.navigate('WorkerDetails', { workerId: worker.id });
  };

  const handleToggleStatus = async (worker: SwachhWorker) => {
    if (!user?.uid) return;

    const newStatus = !worker.isActive;
    const statusText = newStatus ? 'activate' : 'deactivate';
    
    Alert.alert(
      'Confirm Status Change',
      `Are you sure you want to ${statusText} ${worker.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await WorkerService.toggleWorkerStatus(worker.id, newStatus, user.uid);
              await loadWorkers(); // Refresh the list
              Alert.alert('Success', `Worker ${statusText}d successfully`);
            } catch (error: any) {
              Alert.alert('Error', error.message || `Failed to ${statusText} worker`);
            }
          }
        }
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const getStatusInfo = (isActive: boolean) => {
    return WORKER_STATUS_OPTIONS.find(option => option.value === isActive);
  };

  if (loading) {
    return <LoadingSpinner message="Loading workers..." />;
  }

  const activeWorkers = workers.filter(w => w.isActive);
  const inactiveWorkers = workers.filter(w => !w.isActive);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#FF6F00"
        translucent={false}
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Worker Management</Text>
          <Text style={styles.headerSubtitle}>{workers.length} total workers</Text>
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={handleAddWorker}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.activeCard]}>
            <Text style={styles.statNumber}>{activeWorkers.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statCard, styles.inactiveCard]}>
            <Text style={styles.statNumber}>{inactiveWorkers.length}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>

        <FlatList
          data={workers}
          keyExtractor={(item) => item.id}
          style={styles.workersList}
          contentContainerStyle={styles.workersListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No workers added yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button to add your first worker</Text>
            </View>
          )}
          renderItem={({ item: worker }) => {
            const statusInfo = getStatusInfo(worker.isActive);
            return (
              <TouchableOpacity
                style={[
                  styles.workerCard,
                  { borderLeftColor: statusInfo?.color || '#666' }
                ]}
                onPress={() => handleWorkerPress(worker)}
                activeOpacity={0.7}
              >
                <View style={styles.workerHeader}>
                  <View style={styles.workerInfo}>
                    <Text style={styles.workerName}>{worker.name}</Text>
                    <Text style={styles.workerEmployeeId}>ID: {worker.employeeId}</Text>
                  </View>
                  <View style={[styles.statusTag, { backgroundColor: statusInfo?.color || '#666' }]}>
                    <Text style={styles.statusTagText}>{statusInfo?.label || 'Unknown'}</Text>
                  </View>
                </View>
                
                <View style={styles.workerDetails}>
                  <Text style={styles.workerDesignation}>{worker.designation} - {worker.department}</Text>
                  <Text style={styles.workerPhone}>{worker.phone}</Text>
                  <Text style={styles.workerDate}>
                    Joined: {formatDate(worker.joiningDate)}
                  </Text>
                </View>
                
                <View style={styles.workerActions}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      { backgroundColor: worker.isActive ? '#d32f2f' : '#2E7D32' }
                    ]}
                    onPress={() => handleToggleStatus(worker)}
                  >
                    <Ionicons 
                      name={worker.isActive ? 'pause' : 'play'} 
                      size={16} 
                      color="white" 
                    />
                    <Text style={styles.statusButtonText}>
                      {worker.isActive ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.detailsButton}>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
    backgroundColor: '#FF6F00',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -10,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 6,
    borderTopWidth: 4,
  },
  activeCard: {
    borderTopColor: '#2E7D32',
  },
  inactiveCard: {
    borderTopColor: '#e74c3c',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  workersListContent: {
    paddingTop: 10,
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
    textAlign: 'center',
  },
  workerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
    borderLeftWidth: 5,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  workerEmployeeId: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  statusTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  workerDetails: {
    marginBottom: 12,
  },
  workerDesignation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  workerPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  workerDate: {
    fontSize: 12,
    color: '#999',
  },
  workerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailsButton: {
    padding: 4,
  },
});

export default WorkerManagementScreen;
