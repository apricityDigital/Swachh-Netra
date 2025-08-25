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
  TextInput,
} from "react-native"
import { Card, Text, Button, FAB, Modal, Portal, Searchbar, Chip, Divider } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { FIREBASE_AUTH } from "../../../FirebaseConfig"
import { WorkerService, WorkerData } from "../../../services/WorkerService"

const { width } = Dimensions.get("window")

const WorkerManagement = ({ navigation }: any) => {
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [workers, setWorkers] = useState<WorkerData[]>([])
  const [filteredWorkers, setFilteredWorkers] = useState<WorkerData[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<WorkerData | null>(null)
  const [operationLoading, setOperationLoading] = useState(false)

  // Form state for add/edit worker
  const [formData, setFormData] = useState({
    fullName: "",
    zone: "",
    ward: "",
    kothi: "",
    feederPoint: "",
    shiftTiming: "",
    employeeId: "",
    aadhaarNumber: "",
  })

  const [stats, setStats] = useState({
    totalWorkers: 0,
    activeWorkers: 0,
    inactiveWorkers: 0,
    pendingApprovals: 0,
  })

  useEffect(() => {
    fetchWorkers()
  }, [])

  useEffect(() => {
    filterWorkers()
  }, [workers, searchQuery])

  const fetchWorkers = useCallback(async () => {
    setLoading(true)
    try {
      const allWorkers = await WorkerService.getAllWorkers()
      setWorkers(allWorkers)

      // Calculate stats
      const activeCount = allWorkers.filter(w => w.isActive).length
      setStats({
        totalWorkers: allWorkers.length,
        activeWorkers: activeCount,
        inactiveWorkers: allWorkers.length - activeCount,
        pendingApprovals: 0, // Will be updated when we fetch pending requests
      })
    } catch (error) {
      console.error("Error fetching workers:", error)
      Alert.alert("Error", "Failed to fetch workers")
    } finally {
      setLoading(false)
    }
  }, [])

  const filterWorkers = () => {
    if (!searchQuery.trim()) {
      setFilteredWorkers(workers)
    } else {
      const filtered = workers.filter(worker =>
        worker.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.kothi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.feederPoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredWorkers(filtered)
    }
  }

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    await fetchWorkers()
    setRefreshing(false)
  }, [fetchWorkers])

  const resetForm = () => {
    setFormData({
      fullName: "",
      zone: "",
      ward: "",
      kothi: "",
      feederPoint: "",
      shiftTiming: "",
      employeeId: "",
      aadhaarNumber: "",
    })
  }

  const handleAddWorker = async () => {
    if (!formData.fullName.trim() || !formData.zone.trim() || !formData.ward.trim() || !formData.aadhaarNumber.trim()) {
      Alert.alert("Error", "Please fill in all required fields including Aadhaar number")
      return
    }

    if (formData.aadhaarNumber.length !== 12) {
      Alert.alert("Error", "Aadhaar number must be exactly 12 digits")
      return
    }

    setOperationLoading(true)
    try {
      const currentUser = FIREBASE_AUTH.currentUser
      if (!currentUser) {
        Alert.alert("Error", "You must be logged in to add workers")
        return
      }

      const workerData: Omit<WorkerData, 'id'> = {
        ...formData,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid,
      }

      await WorkerService.createWorkerApprovalRequest('worker_add', currentUser.uid, workerData)

      Alert.alert(
        "Request Submitted",
        "Worker addition request has been sent to admin for approval.",
        [{ text: "OK", onPress: () => {
          setShowAddModal(false)
          resetForm()
        }}]
      )
    } catch (error) {
      console.error("Error adding worker:", error)
      Alert.alert("Error", "Failed to submit worker addition request")
    } finally {
      setOperationLoading(false)
    }
  }

  const handleEditWorker = (worker: WorkerData) => {
    setSelectedWorker(worker)
    setFormData({
      fullName: worker.fullName,
      zone: worker.zone,
      ward: worker.ward,
      kothi: worker.kothi,
      feederPoint: worker.feederPoint,
      shiftTiming: worker.shiftTiming,
      employeeId: worker.employeeId || "",
      aadhaarNumber: worker.aadhaarNumber,
    })
    setShowEditModal(true)
  }

  const handleUpdateWorker = async () => {
    if (!selectedWorker || !formData.fullName.trim() || !formData.zone.trim() || !formData.aadhaarNumber.trim()) {
      Alert.alert("Error", "Please fill in all required fields including Aadhaar number")
      return
    }

    if (formData.aadhaarNumber.length !== 12) {
      Alert.alert("Error", "Aadhaar number must be exactly 12 digits")
      return
    }

    setOperationLoading(true)
    try {
      const currentUser = FIREBASE_AUTH.currentUser
      if (!currentUser) {
        Alert.alert("Error", "You must be logged in to edit workers")
        return
      }

      const updatedWorkerData: WorkerData = {
        ...selectedWorker,
        ...formData,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid,
      }

      await WorkerService.createWorkerApprovalRequest(
        'worker_edit',
        currentUser.uid,
        updatedWorkerData,
        selectedWorker.id,
        selectedWorker
      )

      Alert.alert(
        "Request Submitted",
        "Worker update request has been sent to admin for approval.",
        [{ text: "OK", onPress: () => {
          setShowEditModal(false)
          setSelectedWorker(null)
          resetForm()
        }}]
      )
    } catch (error) {
      console.error("Error updating worker:", error)
      Alert.alert("Error", "Failed to submit worker update request")
    } finally {
      setOperationLoading(false)
    }
  }

  const handleDeleteWorker = (worker: WorkerData) => {
    Alert.alert(
      "Delete Worker",
      `Are you sure you want to delete ${worker.fullName}? This action requires admin approval.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setOperationLoading(true)
            try {
              const currentUser = FIREBASE_AUTH.currentUser
              if (!currentUser) {
                Alert.alert("Error", "You must be logged in to delete workers")
                return
              }

              await WorkerService.createWorkerApprovalRequest(
                'worker_delete', 
                currentUser.uid, 
                undefined, 
                worker.id,
                worker
              )
              
              Alert.alert("Request Submitted", "Worker deletion request has been sent to admin for approval.")
            } catch (error) {
              console.error("Error deleting worker:", error)
              Alert.alert("Error", "Failed to submit worker deletion request")
            } finally {
              setOperationLoading(false)
            }
          }
        }
      ]
    )
  }

  const renderWorkerCard = ({ item }: { item: WorkerData }) => (
    <Card style={styles.workerCard}>
      <View style={styles.workerHeader}>
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{item.fullName}</Text>
          {item.employeeId && <Text style={styles.workerDesignation}>ID: {item.employeeId}</Text>}
          <Text style={styles.workerDepartment}>{item.zone} • Ward {item.ward}</Text>
          <Text style={styles.workerContact}>{item.kothi} • {item.feederPoint}</Text>
        </View>
        <View style={styles.workerActions}>
          <View style={[
            styles.statusBadge,
            item.isActive ? styles.activeBadge : styles.inactiveBadge
          ]}>
            <Text style={[
              styles.statusText,
              item.isActive ? styles.activeText : styles.inactiveText
            ]}>
              {item.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => handleEditWorker(item)}
              style={styles.actionButton}
            >
              <MaterialIcons name="edit" size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteWorker(item)}
              style={styles.actionButton}
            >
              <MaterialIcons name="delete" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.workerDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Shift Timing:</Text>
          <Text style={styles.detailValue}>{item.shiftTiming}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Aadhaar Number:</Text>
          <Text style={styles.detailValue}>****-****-{item.aadhaarNumber.slice(-4)}</Text>
        </View>
        {item.employeeId && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Employee ID:</Text>
            <Text style={styles.detailValue}>{item.employeeId}</Text>
          </View>
        )}
      </View>
    </Card>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="people" size={48} color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Workers...</Text>
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
            <Text style={styles.headerTitle}>Worker Management</Text>
            <Text style={styles.headerSubtitle}>Manage workforce and assignments</Text>
          </View>
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
                <View style={[styles.statIcon, { backgroundColor: '#eff6ff' }]}>
                  <MaterialIcons name="people" size={24} color="#3b82f6" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{stats.totalWorkers}</Text>
                  <Text style={styles.statLabel}>Total Workers</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#f0fdf4' }]}>
                  <MaterialIcons name="check-circle" size={24} color="#10b981" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{stats.activeWorkers}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
              </View>
            </Card>
          </View>
        </View>

        {/* Search */}
        <View style={styles.section}>
          <Searchbar
            placeholder="Search workers..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>

        {/* Workers List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workers ({filteredWorkers.length})</Text>
          {filteredWorkers.length > 0 ? (
            <FlatList
              data={filteredWorkers}
              renderItem={renderWorkerCard}
              keyExtractor={(item) => item.id || ""}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <MaterialIcons name="people" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No workers found</Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery ? "Try adjusting your search" : "Add your first worker to get started"}
                </Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setShowAddModal(true)}
        label="Add Worker"
      />

      {/* Add Worker Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Add New Worker</Text>
            <Text style={styles.modalSubtitle}>All fields are required. Request will be sent to admin for approval.</Text>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Worker Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({...formData, fullName: text})}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Employee ID (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.employeeId}
                  onChangeText={(text) => setFormData({...formData, employeeId: text})}
                  placeholder="Enter employee ID (optional)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Zone *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.zone}
                  onChangeText={(text) => setFormData({...formData, zone: text})}
                  placeholder="Enter zone"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ward *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.ward}
                  onChangeText={(text) => setFormData({...formData, ward: text})}
                  placeholder="Enter ward number"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kothi *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.kothi}
                  onChangeText={(text) => setFormData({...formData, kothi: text})}
                  placeholder="Enter kothi"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Feeder Point *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.feederPoint}
                  onChangeText={(text) => setFormData({...formData, feederPoint: text})}
                  placeholder="Enter feeder point"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Shift Timing *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.shiftTiming}
                  onChangeText={(text) => setFormData({...formData, shiftTiming: text})}
                  placeholder="e.g., 6:00 AM - 2:00 PM"
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Aadhaar Card Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Aadhaar Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.aadhaarNumber}
                  onChangeText={(text) => setFormData({...formData, aadhaarNumber: text})}
                  placeholder="Enter 12-digit Aadhaar number"
                  keyboardType="numeric"
                  maxLength={12}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  setShowAddModal(false)
                  resetForm()
                }}
                style={styles.cancelButton}
                disabled={operationLoading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleAddWorker}
                style={styles.submitButton}
                loading={operationLoading}
                disabled={operationLoading}
              >
                Submit
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Edit Worker Modal */}
      <Portal>
        <Modal
          visible={showEditModal}
          onDismiss={() => setShowEditModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Edit Worker</Text>
            <Text style={styles.modalSubtitle}>Changes will be sent to admin for approval.</Text>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Worker Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({...formData, fullName: text})}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Employee ID (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.employeeId}
                  onChangeText={(text) => setFormData({...formData, employeeId: text})}
                  placeholder="Enter employee ID (optional)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Zone *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.zone}
                  onChangeText={(text) => setFormData({...formData, zone: text})}
                  placeholder="Enter zone"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ward *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.ward}
                  onChangeText={(text) => setFormData({...formData, ward: text})}
                  placeholder="Enter ward number"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kothi *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.kothi}
                  onChangeText={(text) => setFormData({...formData, kothi: text})}
                  placeholder="Enter kothi"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Feeder Point *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.feederPoint}
                  onChangeText={(text) => setFormData({...formData, feederPoint: text})}
                  placeholder="Enter feeder point"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Shift Timing *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.shiftTiming}
                  onChangeText={(text) => setFormData({...formData, shiftTiming: text})}
                  placeholder="e.g., 6:00 AM - 2:00 PM"
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Aadhaar Card Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Aadhaar Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.aadhaarNumber}
                  onChangeText={(text) => setFormData({...formData, aadhaarNumber: text})}
                  placeholder="Enter 12-digit Aadhaar number"
                  keyboardType="numeric"
                  maxLength={12}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  setShowEditModal(false)
                  setSelectedWorker(null)
                  resetForm()
                }}
                style={styles.cancelButton}
                disabled={operationLoading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleUpdateWorker}
                style={styles.submitButton}
                loading={operationLoading}
                disabled={operationLoading}
              >
                Submit Changes
              </Button>
            </View>
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
  // Search styles
  searchBar: {
    backgroundColor: "#ffffff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  // Worker card styles
  workerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  workerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
  },
  workerInfo: {
    flex: 1,
    marginRight: 16,
  },
  workerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  workerDesignation: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
    marginBottom: 2,
  },
  workerDepartment: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  workerContact: {
    fontSize: 12,
    color: "#9ca3af",
  },
  workerActions: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  activeBadge: {
    backgroundColor: "#dcfce7",
  },
  inactiveBadge: {
    backgroundColor: "#fef2f2",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  activeText: {
    color: "#166534",
  },
  inactiveText: {
    color: "#dc2626",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f9fafb",
  },
  divider: {
    marginHorizontal: 16,
  },
  workerDetails: {
    padding: 16,
    paddingTop: 12,
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
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
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
  // FAB styles
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#3b82f6",
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
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
        // Add: margin from the bottom in both buttons 
        marginBottom: 24,
       


  },
  cancelButton: {
    flex: 1,
    borderColor: "#d1d5db",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#3b82f6",
  },
  // Checkbox styles
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 4,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#374151",
  },
})

export default WorkerManagement
