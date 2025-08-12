import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { SignupService } from '../services/signupService';
import { SignupRequest, UserRole, ROLE_OPTIONS } from '../types/auth';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface SignupRequestsScreenProps {
  navigation: any;
}

const SignupRequestsScreen: React.FC<SignupRequestsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [signupRequests, setSignupRequests] = useState<SignupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SignupRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewComments, setReviewComments] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadSignupRequests = async () => {
    try {
      const requests = await SignupService.getPendingSignupRequests();
      setSignupRequests(requests);
    } catch (error: any) {
      console.error('Error loading signup requests:', error);
      Alert.alert('Error', 'Failed to load signup requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSignupRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadSignupRequests();
  };

  const handleRequestPress = (request: SignupRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
    setReviewComments('');
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      await SignupService.approveSignupRequest(
        selectedRequest.id,
        user?.displayName || 'All Admin',
        reviewComments || 'Request approved'
      );

      // Show success message and close modal
      const passwordUsed = selectedRequest.password || 'qwerty';
      Alert.alert(
        'Success',
        `User account created successfully!\n\nEmail: ${selectedRequest.email}\nPassword: ${passwordUsed}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowModal(false);
              setSelectedRequest(null);
              setReviewComments('');
            }
          }
        ]
      );

      // Refresh the list but stay on the same page
      await loadSignupRequests();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!reviewComments.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      await SignupService.rejectSignupRequest(
        selectedRequest.id,
        user?.displayName || 'All Admin',
        reviewComments
      );

      // Show success message and close modal
      Alert.alert(
        'Request Rejected',
        `The signup request has been rejected.\n\nReason: ${reviewComments}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowModal(false);
              setSelectedRequest(null);
              setReviewComments('');
            }
          }
        ]
      );

      // Refresh the list but stay on the same page
      await loadSignupRequests();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject request');
    } finally {
      setProcessing(false);
    }
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
    return <LoadingSpinner message="Loading signup requests..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Signup Requests</Text>
          <Text style={styles.headerSubtitle}>{signupRequests.length} pending</Text>
        </View>
        
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <FlatList
          data={signupRequests}
          keyExtractor={(item) => item.id}
          style={styles.requestsList}
          contentContainerStyle={styles.requestsListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No pending signup requests</Text>
              <Text style={styles.emptySubtext}>All requests have been processed</Text>
            </View>
          )}
          renderItem={({ item: request }) => {
            const roleInfo = getRoleInfo(request.requestedRole);
            return (
              <TouchableOpacity
                style={styles.requestCard}
                onPress={() => handleRequestPress(request)}
                activeOpacity={0.7}
              >
                <View style={styles.requestHeader}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>{request.name}</Text>
                    <Text style={styles.requestEmail}>{request.email}</Text>
                  </View>
                  <View style={[styles.roleTag, { backgroundColor: roleInfo?.color || '#666' }]}>
                    <Text style={styles.roleTagText}>{roleInfo?.label || request.requestedRole}</Text>
                  </View>
                </View>

                <View style={styles.requestDetails}>
                  <Text style={styles.requestOrg}>{request.organization} - {request.department}</Text>
                  <Text style={styles.requestDate}>
                    Submitted: {formatDate(request.submittedAt)}
                  </Text>
                </View>

                <View style={styles.requestFooter}>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Review Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Signup Request</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.requestDetailSection}>
                  <Text style={styles.detailLabel}>Name</Text>
                  <Text style={styles.detailValue}>{selectedRequest.name}</Text>
                </View>

                <View style={styles.requestDetailSection}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{selectedRequest.email}</Text>
                </View>

                <View style={styles.requestDetailSection}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{selectedRequest.phone}</Text>
                </View>

                <View style={styles.requestDetailSection}>
                  <Text style={styles.detailLabel}>Requested Role</Text>
                  <View style={styles.roleDetailContainer}>
                    <View style={[
                      styles.roleDetailTag, 
                      { backgroundColor: getRoleInfo(selectedRequest.requestedRole)?.color || '#666' }
                    ]}>
                      <Text style={styles.roleDetailText}>
                        {getRoleInfo(selectedRequest.requestedRole)?.label || selectedRequest.requestedRole}
                      </Text>
                    </View>
                    <Text style={styles.roleDetailDescription}>
                      {getRoleInfo(selectedRequest.requestedRole)?.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.requestDetailSection}>
                  <Text style={styles.detailLabel}>Organization</Text>
                  <Text style={styles.detailValue}>{selectedRequest.organization}</Text>
                </View>

                <View style={styles.requestDetailSection}>
                  <Text style={styles.detailLabel}>Department</Text>
                  <Text style={styles.detailValue}>{selectedRequest.department}</Text>
                </View>

                <View style={styles.requestDetailSection}>
                  <Text style={styles.detailLabel}>Reason for Access</Text>
                  <Text style={styles.detailValue}>{selectedRequest.reason}</Text>
                </View>

                <View style={styles.requestDetailSection}>
                  <Text style={styles.detailLabel}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <Text style={styles.passwordValue}>
                      {selectedRequest.password ? '•'.repeat(selectedRequest.password.length) : 'Not provided'}
                    </Text>
                    <Text style={styles.passwordHint}>
                      {selectedRequest.password ? `(${selectedRequest.password.length} characters)` : '(Legacy request)'}
                    </Text>
                  </View>
                </View>

                <View style={styles.requestDetailSection}>
                  <Text style={styles.detailLabel}>Submitted</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedRequest.submittedAt)}</Text>
                </View>

                <View style={styles.commentsSection}>
                  <Text style={styles.detailLabel}>Review Comments</Text>
                  <TextInput
                    style={styles.commentsInput}
                    placeholder="Add comments for your decision..."
                    value={reviewComments}
                    onChangeText={setReviewComments}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleReject}
                disabled={processing}
              >
                {processing ? (
                  <LoadingSpinner size="small" color="white" message="" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.approveButton]}
                onPress={handleApprove}
                disabled={processing}
              >
                {processing ? (
                  <LoadingSpinner size="small" color="white" message="" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  requestsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  requestsListContent: {
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
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  requestEmail: {
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
  requestDetails: {
    marginBottom: 8,
  },
  requestOrg: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
  },
  requestFooter: {
    alignItems: 'flex-end',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  requestDetailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordValue: {
    fontSize: 16,
    color: '#333',
    letterSpacing: 2,
    marginRight: 8,
  },
  passwordHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  roleDetailContainer: {
    marginTop: 4,
  },
  roleDetailTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  roleDetailText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  roleDetailDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  commentsSection: {
    marginTop: 8,
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  rejectButton: {
    backgroundColor: '#d32f2f',
  },
  approveButton: {
    backgroundColor: '#2E7D32',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SignupRequestsScreen;
