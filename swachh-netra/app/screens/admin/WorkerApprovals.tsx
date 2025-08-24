import React, { useState, useEffect, useCallback } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
  FlatList,
} from "react-native"
import { Card, Text, Button, Chip, Divider, Modal, Portal } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { FIREBASE_AUTH } from "../../../FirebaseConfig"
import { WorkerService, WorkerApprovalRequest, WorkerData } from "../../../services/WorkerService"

const { width } = Dimensions.get("window")

const WorkerApprovals = ({ navigation }: any) => {
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [approvalRequests, setApprovalRequests] = useState<WorkerApprovalRequest[]>([])
  const [operationLoading, setOperationLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<WorkerApprovalRequest | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    addRequests: 0,
    editRequests: 0,
    deleteRequests: 0,
  })

  useEffect(() => {
    fetchApprovalRequests()
  }, [])

  const fetchApprovalRequests = useCallback(async () => {
    setLoading(true)
    try {
      const requests = await WorkerService.getWorkerApprovalRequests()
      setApprovalRequests(requests)

      // Calculate stats
      const pending = requests.filter(r => r.status === 'pending')
      setStats({
        totalRequests: requests.length,
        pendingRequests: pending.length,
        addRequests: pending.filter(r => r.type === 'worker_add').length,
        editRequests: pending.filter(r => r.type === 'worker_edit').length,
        deleteRequests: pending.filter(r => r.type === 'worker_delete').length,
      })
    } catch (error) {
      console.error("Error fetching approval requests:", error)
      Alert.alert("Error", "Failed to fetch approval requests")
    } finally {
      setLoading(false)
    }
  }, [])

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    await fetchApprovalRequests()
    setRefreshing(false)
  }, [fetchApprovalRequests])

  const handleApproveRequest = async (request: WorkerApprovalRequest) => {
    setOperationLoading(true)
    try {
      const currentUser = FIREBASE_AUTH.currentUser
      if (!currentUser) {
        Alert.alert("Error", "You must be logged in to approve requests")
        return
      }

      await WorkerService.approveWorkerRequest(request.id!, currentUser.uid)
      Alert.alert("Success", "Request approved successfully")
      await fetchApprovalRequests()
    } catch (error) {
      console.error("Error approving request:", error)
      Alert.alert("Error", "Failed to approve request")
    } finally {
      setOperationLoading(false)
    }
  }

  const handleRejectRequest = async (request: WorkerApprovalRequest) => {
    Alert.alert(
      "Reject Request",
      "Are you sure you want to reject this request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            setOperationLoading(true)
            try {
              const currentUser = FIREBASE_AUTH.currentUser
              if (!currentUser) {
                Alert.alert("Error", "You must be logged in to reject requests")
                return
              }

              await WorkerService.rejectWorkerRequest(request.id!, currentUser.uid, "Rejected by admin")
              Alert.alert("Success", "Request rejected successfully")
              await fetchApprovalRequests()
            } catch (error) {
              console.error("Error rejecting request:", error)
              Alert.alert("Error", "Failed to reject request")
            } finally {
              setOperationLoading(false)
            }
          }
        }
      ]
    )
  }

  const handleBulkApprove = async () => {
    const pendingRequests = approvalRequests.filter(r => r.status === 'pending')
    if (pendingRequests.length === 0) {
      Alert.alert("Info", "No pending requests to approve")
      return
    }

    Alert.alert(
      "Bulk Approve",
      `Are you sure you want to approve all ${pendingRequests.length} pending requests?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve All",
          onPress: async () => {
            setOperationLoading(true)
            try {
              const currentUser = FIREBASE_AUTH.currentUser
              if (!currentUser) {
                Alert.alert("Error", "You must be logged in to approve requests")
                return
              }

              await WorkerService.bulkApproveAllRequests(currentUser.uid)
              Alert.alert("Success", "All pending requests approved successfully")
              await fetchApprovalRequests()
            } catch (error) {
              console.error("Error bulk approving requests:", error)
              Alert.alert("Error", "Failed to approve all requests")
            } finally {
              setOperationLoading(false)
            }
          }
        }
      ]
    )
  }

  const showRequestDetails = (request: WorkerApprovalRequest) => {
    setSelectedRequest(request)
    setShowDetailsModal(true)
  }

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'worker_add': return '#10b981'
      case 'worker_edit': return '#f59e0b'
      case 'worker_delete': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'worker_add': return 'person-add'
      case 'worker_edit': return 'edit'
      case 'worker_delete': return 'person-remove'
      default: return 'help'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b'
      case 'approved': return '#10b981'
      case 'rejected': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const renderRequestCard = ({ item }: { item: WorkerApprovalRequest }) => (
    <Card style={styles.requestCard}>
      <TouchableOpacity onPress={() => showRequestDetails(item)}>
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <View style={styles.requestTitleRow}>
              <MaterialIcons 
                name={getRequestTypeIcon(item.type) as any} 
                size={20} 
                color={getRequestTypeColor(item.type)} 
              />
              <Text style={styles.requestTitle}>
                {item.type === 'worker_add' ? 'Add Worker' : 
                 item.type === 'worker_edit' ? 'Edit Worker' : 'Delete Worker'}
              </Text>
              <Chip 
                style={[styles.statusChip, { backgroundColor: `${getStatusColor(item.status)}20` }]}
                textStyle={[styles.statusText, { color: getStatusColor(item.status) }]}
              >
                {item.status.toUpperCase()}
              </Chip>
            </View>
            
            <Text style={styles.workerName}>
              {item.workerData?.fullName || item.originalData?.fullName || 'Unknown Worker'}
            </Text>
            
            <Text style={styles.requestDate}>
              Requested on {new Date(item.requestedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {item.status === 'pending' && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.requestActions}>
              <Button
                mode="outlined"
                onPress={() => handleRejectRequest(item)}
                style={styles.rejectButton}
                textColor="#ef4444"
                disabled={operationLoading}
              >
                Reject
              </Button>
              <Button
                mode="contained"
                onPress={() => handleApproveRequest(item)}
                style={styles.approveButton}
                disabled={operationLoading}
              >
                Approve
              </Button>
            </View>
          </>
        )}
      </TouchableOpacity>
    </Card>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="approval" size={48} color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Approval Requests...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Worker Approvals</Text>
            <Text style={styles.headerSubtitle}>Manage worker requests</Text>
          </View>
          {stats.pendingRequests > 0 && (
            <TouchableOpacity onPress={handleBulkApprove} style={styles.bulkApproveButton}>
              <Text style={styles.bulkApproveText}>Approve All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                  <MaterialIcons name="pending-actions" size={24} color="#f59e0b" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{stats.pendingRequests}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#eff6ff' }]}>
                  <MaterialIcons name="assignment" size={24} color="#3b82f6" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{stats.totalRequests}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              </View>
            </Card>
          </View>

          <View style={styles.typeStats}>
            <View style={styles.typeStat}>
              <MaterialIcons name="person-add" size={16} color="#10b981" />
              <Text style={styles.typeStatText}>{stats.addRequests} Add</Text>
            </View>
            <View style={styles.typeStat}>
              <MaterialIcons name="edit" size={16} color="#f59e0b" />
              <Text style={styles.typeStatText}>{stats.editRequests} Edit</Text>
            </View>
            <View style={styles.typeStat}>
              <MaterialIcons name="person-remove" size={16} color="#ef4444" />
              <Text style={styles.typeStatText}>{stats.deleteRequests} Delete</Text>
            </View>
          </View>
        </View>

        {/* Requests List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Approval Requests ({approvalRequests.length})</Text>
          {approvalRequests.length > 0 ? (
            <FlatList
              data={approvalRequests}
              renderItem={renderRequestCard}
              keyExtractor={(item) => item.id || ""}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <MaterialIcons name="approval" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No approval requests</Text>
                <Text style={styles.emptySubtext}>All worker requests have been processed</Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Request Details Modal */}
      <Portal>
        <Modal
          visible={showDetailsModal}
          onDismiss={() => setShowDetailsModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedRequest && (
              <>
                <Text style={styles.modalTitle}>Request Details</Text>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Request Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue}>
                      {selectedRequest.type === 'worker_add' ? 'Add Worker' :
                       selectedRequest.type === 'worker_edit' ? 'Edit Worker' : 'Delete Worker'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[styles.detailValue, { color: getStatusColor(selectedRequest.status) }]}>
                      {selectedRequest.status.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Requested:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedRequest.requestedAt).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {selectedRequest.workerData && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>
                      {selectedRequest.type === 'worker_edit' ? 'New' : ''} Worker Information
                    </Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Name:</Text>
                      <Text style={styles.detailValue}>{selectedRequest.workerData.fullName}</Text>
                    </View>
                    {selectedRequest.workerData.employeeId && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Employee ID:</Text>
                        <Text style={styles.detailValue}>{selectedRequest.workerData.employeeId}</Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Zone:</Text>
                      <Text style={styles.detailValue}>{selectedRequest.workerData.zone}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Ward:</Text>
                      <Text style={styles.detailValue}>{selectedRequest.workerData.ward}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Kothi:</Text>
                      <Text style={styles.detailValue}>{selectedRequest.workerData.kothi}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Feeder Point:</Text>
                      <Text style={styles.detailValue}>{selectedRequest.workerData.feederPoint}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Shift Timing:</Text>
                      <Text style={styles.detailValue}>{selectedRequest.workerData.shiftTiming}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Aadhaar Number:</Text>
                      <Text style={styles.detailValue}>{selectedRequest.workerData.aadhaarNumber}</Text>
                    </View>
                  </View>
                )}

                {selectedRequest.originalData && selectedRequest.type === 'worker_edit' && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Original Worker Information</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Name:</Text>
                      <Text style={styles.detailValue}>{selectedRequest.originalData.fullName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Zone:</Text>
                      <Text style={styles.detailValue}>{selectedRequest.originalData.zone}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Ward:</Text>
                      <Text style={styles.detailValue}>{selectedRequest.originalData.ward}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Shift Timing:</Text>
                      <Text style={styles.detailValue}>{selectedRequest.originalData.shiftTiming}</Text>
                    </View>
                  </View>
                )}

                {selectedRequest.status === 'pending' && (
                  <View style={styles.modalActions}>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setShowDetailsModal(false)
                        handleRejectRequest(selectedRequest)
                      }}
                      style={styles.rejectButton}
                      textColor="#ef4444"
                      disabled={operationLoading}
                    >
                      Reject
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => {
                        setShowDetailsModal(false)
                        handleApproveRequest(selectedRequest)
                      }}
                      style={styles.approveButton}
                      disabled={operationLoading}
                    >
                      Approve
                    </Button>
                  </View>
                )}

                <Button
                  mode="outlined"
                  onPress={() => setShowDetailsModal(false)}
                  style={styles.closeButton}
                >
                  Close
                </Button>
              </>
            )}
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 16,
  },
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  bulkApproveButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bulkApproveText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  // Statistics styles
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    width: (width - 60) / 2,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  typeStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  typeStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeStatText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  // Request card styles
  requestCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  requestHeader: {
    padding: 16,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  statusChip: {
    height: 24,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  workerName: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  divider: {
    marginHorizontal: 16,
  },
  requestActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    borderColor: "#ef4444",
  },
  approveButton: {
    flex: 1,
    backgroundColor: "#10b981",
  },
  // Empty state styles
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  emptyContent: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  // Modal styles
  modalContainer: {
    backgroundColor: "#ffffff",
    margin: 20,
    borderRadius: 12,
    maxHeight: "90%",
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 24,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  closeButton: {
    borderColor: "#d1d5db",
  },
})

export default WorkerApprovals
