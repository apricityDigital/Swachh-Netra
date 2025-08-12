import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { WorkerService } from '../services/workerService';
import { SwachhWorker, WORKER_STATUS_OPTIONS } from '../types/worker';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface WorkerDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      workerId: string;
    };
  };
}

const WorkerDetailsScreen: React.FC<WorkerDetailsScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { workerId } = route.params;
  const [worker, setWorker] = useState<SwachhWorker | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWorkerDetails = async () => {
    try {
      const workerData = await WorkerService.getWorkerById(workerId);
      setWorker(workerData);
    } catch (error: any) {
      console.error('Error loading worker details:', error);
      Alert.alert('Error', 'Failed to load worker details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkerDetails();
  }, [workerId]);

  const handleToggleStatus = async () => {
    if (!worker || !user?.uid) return;

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
              setWorker(prev => prev ? { ...prev, isActive: newStatus } : null);
              Alert.alert('Success', `Worker ${statusText}d successfully`);
            } catch (error: any) {
              Alert.alert('Error', error.message || `Failed to ${statusText} worker`);
            }
          }
        }
      ]
    );
  };

  const handleDeleteWorker = async () => {
    if (!worker) return;

    Alert.alert(
      'Delete Worker',
      `Are you sure you want to delete ${worker.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await WorkerService.deleteWorker(worker.id);
              Alert.alert('Success', 'Worker deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack()
                }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete worker');
            }
          }
        }
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusInfo = (isActive: boolean) => {
    return WORKER_STATUS_OPTIONS.find(option => option.value === isActive);
  };

  if (loading) {
    return <LoadingSpinner message="Loading worker details..." />;
  }

  if (!worker) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#FF6F00" translucent={false} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
          <Text style={styles.errorText}>Worker not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(worker.isActive);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6F00" translucent={false} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Worker Details</Text>
          <Text style={styles.headerSubtitle}>{worker.employeeId}</Text>
        </View>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[styles.statusCard, { borderLeftColor: statusInfo?.color || '#666' }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo?.color || '#666' }]}>
              <Ionicons 
                name={worker.isActive ? 'checkmark-circle' : 'pause-circle'} 
                size={20} 
                color="white" 
              />
              <Text style={styles.statusBadgeText}>{statusInfo?.label || 'Unknown'}</Text>
            </View>
          </View>
          <Text style={styles.workerName}>{worker.name}</Text>
          <Text style={styles.workerDesignation}>{worker.designation} - {worker.department}</Text>
        </View>

        {/* Details Cards */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Ionicons name="person-outline" size={24} color="#FF6F00" />
              <Text style={styles.detailTitle}>Personal Information</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Full Name:</Text>
              <Text style={styles.detailValue}>{worker.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Employee ID:</Text>
              <Text style={styles.detailValue}>{worker.employeeId}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{worker.phone}</Text>
            </View>
            {worker.email && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{worker.email}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>{worker.address}</Text>
            </View>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Ionicons name="briefcase-outline" size={24} color="#FF6F00" />
              <Text style={styles.detailTitle}>Work Information</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Designation:</Text>
              <Text style={styles.detailValue}>{worker.designation}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Department:</Text>
              <Text style={styles.detailValue}>{worker.department}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Joining Date:</Text>
              <Text style={styles.detailValue}>{formatDate(worker.joiningDate)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, { color: statusInfo?.color || '#666' }]}>
                {statusInfo?.label || 'Unknown'}
              </Text>
            </View>
          </View>

          {worker.replacementDetails && (
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Ionicons name="swap-horizontal-outline" size={24} color="#FF6F00" />
                <Text style={styles.detailTitle}>Replacement Information</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Replacement Reason:</Text>
                <Text style={styles.detailValue}>{worker.replacementDetails.replacementReason}</Text>
              </View>
              {worker.replacementDetails.previousWorkerName && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Previous Worker:</Text>
                  <Text style={styles.detailValue}>{worker.replacementDetails.previousWorkerName}</Text>
                </View>
              )}
              {worker.replacementDetails.notes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notes:</Text>
                  <Text style={styles.detailValue}>{worker.replacementDetails.notes}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.statusButton,
              { backgroundColor: worker.isActive ? '#e74c3c' : '#2E7D32' }
            ]}
            onPress={handleToggleStatus}
          >
            <Ionicons 
              name={worker.isActive ? 'pause' : 'play'} 
              size={20} 
              color="white" 
            />
            <Text style={styles.actionButtonText}>
              {worker.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteWorker}
          >
            <Ionicons name="trash-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Delete Worker</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 25,
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
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -10,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  statusHeader: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  workerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  workerDesignation: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  detailsContainer: {
    paddingHorizontal: 20,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  actionsContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statusButton: {
    // Color set dynamically
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default WorkerDetailsScreen;
