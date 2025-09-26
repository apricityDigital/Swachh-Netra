import React, { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  FlatList,
  RefreshControl,
} from "react-native"
import { Card, Text, Button, Chip, Modal, Portal, Searchbar } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { WorkerAssignmentService, Worker, FeederPoint } from "../../../services/WorkerAssignmentService"
import { useAuth } from "../../../contexts/AuthContext"

const WorkerAssignment = ({ navigation }: any) => {
  const { userData } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Data states
  const [workers, setWorkers] = useState<Worker[]>([])
  const [feederPoints, setFeederPoints] = useState<FeederPoint[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Assignment states
  const [selectedFeederPoint, setSelectedFeederPoint] = useState<FeederPoint | null>(null)
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [viewMode, setViewMode] = useState<'feederPoints' | 'workers'>('feederPoints')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log("🔄 [WorkerAssignment] Fetching data...")

      const [workersData, feederPointsData] = await Promise.all([
        WorkerAssignmentService.getAllWorkers(),
        WorkerAssignmentService.getAllFeederPoints(),
      ])

      console.log("✅ [WorkerAssignment] Data fetched successfully:", {
        workers: workersData.length,
        feederPoints: feederPointsData.length
      })

      setWorkers(workersData || [])
      setFeederPoints(feederPointsData || [])

      // Log results for debugging
      console.log("📊 [WorkerAssignment] Data loaded:", {
        workersCount: workersData?.length || 0,
        feederPointsCount: feederPointsData?.length || 0
      })

    } catch (error) {
      console.error("❌ [WorkerAssignment] Error fetching data:", error)
      console.error("❌ [WorkerAssignment] Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })

      // Set empty arrays instead of showing error to prevent app crashes
      setWorkers([])
      setFeederPoints([])

      // Only show alert for critical errors, not empty data
      if (error instanceof Error && !error.message.includes("Failed to fetch")) {
        Alert.alert("Error", "Failed to load assignment data. Please try again.")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleFeederPointSelect = (feederPoint: FeederPoint) => {
    setSelectedFeederPoint(feederPoint)
    setSelectedWorkers(feederPoint.assignedWorkerIds || [])
    setAssignModalVisible(true)
  }

  const handleWorkerToggle = (workerId: string) => {
    setSelectedWorkers(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    )
  }

  const handleSaveAssignment = async () => {
    if (!selectedFeederPoint || !userData?.uid) return

    try {
      setLoading(true)
      console.log("🔄 [WorkerAssignment] Saving assignment:", {
        feederPointId: selectedFeederPoint.id,
        workersCount: selectedWorkers.length
      })

      // Get current assignments to determine which workers to add/remove
      const currentWorkers = selectedFeederPoint.assignedWorkerIds || []
      const workersToAdd = selectedWorkers.filter(id => !currentWorkers.includes(id))
      const workersToRemove = currentWorkers.filter(id => !selectedWorkers.includes(id))

      // Add new workers
      if (workersToAdd.length > 0) {
        await WorkerAssignmentService.assignWorkersToFeederPoint(
          selectedFeederPoint.id,
          workersToAdd,
          userData.uid
        )
      }

      // Remove workers
      for (const workerId of workersToRemove) {
        await WorkerAssignmentService.removeWorkerFromFeederPoint(
          workerId,
          selectedFeederPoint.id
        )
      }

      Alert.alert("Success", "Worker assignments updated successfully", [
        {
          text: "OK",
          onPress: () => {
            setAssignModalVisible(false)
            setSelectedFeederPoint(null)
            setSelectedWorkers([])
            fetchData()
          }
        }
      ])
    } catch (error) {
      console.error("❌ [WorkerAssignment] Error saving assignment:", error)
      Alert.alert("Error", "Failed to save assignments. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const filteredFeederPoints = feederPoints.filter(fp => {
    const name = fp.feederPointName.toLowerCase()
    const area = fp.areaName.toLowerCase()
    const query = searchQuery.toLowerCase()
    return name.includes(query) || area.includes(query)
  })

  const filteredWorkers = workers.filter(worker => {
    const name = worker.fullName.toLowerCase()
    const email = worker.email.toLowerCase()
    const query = searchQuery.toLowerCase()
    return name.includes(query) || email.includes(query)
  })

  const renderFeederPointCard = ({ item }: { item: FeederPoint }) => {
    const assignedWorkers = workers.filter(w => item.assignedWorkerIds?.includes(w.id))

    return (
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.feederPointName}</Text>
              <Text style={styles.cardSubtitle}>{item.areaName}</Text>
              <Text style={styles.cardDetails}>Ward: {item.wardNumber}</Text>
            </View>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: item.isActive ? "#f0fdf4" : "#fef2f2" }
              ]}
              textStyle={[
                styles.statusText,
                { color: item.isActive ? "#059669" : "#dc2626" }
              ]}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Chip>
          </View>

          <View style={styles.assignmentInfo}>
            <View style={styles.assignmentRow}>
              <MaterialIcons name="people" size={16} color="#6b7280" />
              <Text style={styles.assignmentText}>
                Workers: {assignedWorkers.length}
              </Text>
            </View>
            {assignedWorkers.length > 0 ? (
              <View style={styles.workersList}>
                {assignedWorkers.slice(0, 3).map((worker) => (
                  <Chip key={worker.id} style={styles.workerChip} textStyle={styles.workerChipText}>
                    {worker.fullName || "Unknown Worker"}
                  </Chip>
                ))}
                {assignedWorkers.length > 3 && (
                  <Chip style={styles.moreChip} textStyle={styles.moreChipText}>
                    +{assignedWorkers.length - 3} more
                  </Chip>
                )}
              </View>
            ) : (
              <Text style={styles.noAssignmentText}>No workers assigned</Text>
            )}
          </View>

          <View style={styles.cardActions}>
            <Button
              mode="contained"
              onPress={() => handleFeederPointSelect(item)}
              style={styles.assignButton}
              icon="person-add"
            >
              {assignedWorkers.length > 0 ? "Manage Workers" : "Assign Workers"}
            </Button>
          </View>
        </View>
      </Card>
    )
  }

  const renderWorkerCard = ({ item }: { item: Worker }) => {
    const assignedFeederPoints = feederPoints.filter(fp => item.assignedFeederPointIds?.includes(fp.id))

    return (
      <Card style={styles.workerCard}>
        <View style={styles.workerCardContent}>
          <View style={styles.workerCardHeader}>
            <View style={styles.workerAvatarContainer}>
              <View style={styles.workerAvatar}>
                <MaterialIcons name="person" size={24} color="#3b82f6" />
              </View>
            </View>
            <View style={styles.workerCardInfo}>
              <Text style={styles.workerCardTitle}>{item.fullName}</Text>
              <Text style={styles.workerCardSubtitle}>{item.email}</Text>
              {item.phoneNumber && (
                <Text style={styles.workerCardDetails}>📞 {item.phoneNumber}</Text>
              )}
            </View>
            <View style={styles.workerStatusContainer}>
              <Chip
                style={[
                  styles.workerStatusChip,
                  { backgroundColor: item.isActive ? "#f0fdf4" : "#fef2f2" }
                ]}
                textStyle={[
                  styles.workerStatusText,
                  { color: item.isActive ? "#059669" : "#dc2626" }
                ]}
              >
                {item.isActive ? "Active" : "Inactive"}
              </Chip>
            </View>
          </View>

          <View style={styles.workerAssignmentInfo}>
            <View style={styles.workerAssignmentHeader}>
              <MaterialIcons name="location-on" size={18} color="#3b82f6" />
              <Text style={styles.workerAssignmentTitle}>
                Assigned Locations ({assignedFeederPoints.length})
              </Text>
            </View>

            {assignedFeederPoints.length > 0 ? (
              <View style={styles.workerFeederPointsList}>
                {assignedFeederPoints.slice(0, 3).map((fp) => (
                  <View key={fp.id} style={styles.feederPointItem}>
                    <View style={styles.feederPointIcon}>
                      <MaterialIcons name="place" size={14} color="#059669" />
                    </View>
                    <View style={styles.feederPointDetails}>
                      <Text style={styles.feederPointName}>{fp.feederPointName}</Text>
                      <Text style={styles.feederPointArea}>{fp.areaName}</Text>
                    </View>
                  </View>
                ))}
                {assignedFeederPoints.length > 3 && (
                  <View style={styles.moreFeederPoints}>
                    <MaterialIcons name="more-horiz" size={16} color="#6b7280" />
                    <Text style={styles.moreFeederPointsText}>
                      +{assignedFeederPoints.length - 3} more locations
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noAssignmentContainer}>
                <MaterialIcons name="location-off" size={20} color="#9ca3af" />
                <Text style={styles.noAssignmentText}>No locations assigned</Text>
                <Text style={styles.noAssignmentSubtext}>Worker is available for assignment</Text>
              </View>
            )}
          </View>

          <View style={styles.workerCardActions}>
            <View style={styles.workerStatsRow}>
              <View style={styles.workerStat}>
                <Text style={styles.workerStatNumber}>{assignedFeederPoints.length}</Text>
                <Text style={styles.workerStatLabel}>Locations</Text>
              </View>
              <View style={styles.workerStat}>
                <Text style={styles.workerStatNumber}>
                  {item.isActive ? "✓" : "✗"}
                </Text>
                <Text style={styles.workerStatLabel}>Status</Text>
              </View>
              <View style={styles.workerStat}>
                <Text style={styles.workerStatNumber}>
                  {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Text>
                <Text style={styles.workerStatLabel}>Joined</Text>
              </View>
            </View>
          </View>
        </View>
      </Card>
    )
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="person-add" size={48} color="#2563eb" />
        <Text style={styles.loadingText}>Loading Worker Assignments...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker Assignment</Text>
        <View style={styles.headerRight} />
      </View>

      {/* View Mode Toggle */}
      <View style={styles.viewModeContainer}>
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'feederPoints' && styles.activeToggle]}
            onPress={() => setViewMode('feederPoints')}
          >
            <MaterialIcons name="location-on" size={20} color={viewMode === 'feederPoints' ? '#fff' : '#2563eb'} />
            <Text style={[styles.toggleText, viewMode === 'feederPoints' && styles.activeToggleText]}>
              By Feeder Points
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'workers' && styles.activeToggle]}
            onPress={() => setViewMode('workers')}
          >
            <MaterialIcons name="people" size={20} color={viewMode === 'workers' ? '#fff' : '#2563eb'} />
            <Text style={[styles.toggleText, viewMode === 'workers' && styles.activeToggleText]}>
              By Workers
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={viewMode === 'feederPoints' ? "Search feeder points..." : "Search workers..."}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{feederPoints.length}</Text>
            <Text style={styles.statLabel}>Feeder Points</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{workers.length}</Text>
            <Text style={styles.statLabel}>Workers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {feederPoints.filter(fp => fp.assignedWorkerIds && fp.assignedWorkerIds.length > 0).length}
            </Text>
            <Text style={styles.statLabel}>Assigned Points</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {workers.filter(w => w.assignedFeederPointIds && w.assignedFeederPointIds.length > 0).length}
            </Text>
            <Text style={styles.statLabel}>Assigned Workers</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {viewMode === 'feederPoints' ? 'Feeder Points' : 'Workers'}
          </Text>

          {viewMode === 'feederPoints' ? (
            filteredFeederPoints.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="location-off" size={64} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No feeder points found</Text>
              </View>
            ) : (
              <FlatList
                data={filteredFeederPoints}
                renderItem={renderFeederPointCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              />
            )
          ) : (
            filteredWorkers.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="people-outline" size={64} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No workers found</Text>
              </View>
            ) : (
              <FlatList
                data={filteredWorkers}
                renderItem={renderWorkerCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              />
            )
          )}
        </View>
      </ScrollView>

      {/* Assignment Modal */}
      <Portal>
        <Modal
          visible={assignModalVisible}
          onDismiss={() => setAssignModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <MaterialIcons name="person-add" size={24} color="#2563eb" />
                <Text style={styles.modalTitle}>Assign Workers</Text>
              </View>

              {selectedFeederPoint && (
                <View style={styles.feederPointSummary}>
                  <Text style={styles.feederPointSummaryName}>{selectedFeederPoint.feederPointName}</Text>
                  <Text style={styles.feederPointSummaryArea}>{selectedFeederPoint.areaName}</Text>
                  <Text style={styles.feederPointSummaryDetails}>Ward: {selectedFeederPoint.wardNumber}</Text>
                </View>
              )}

              {/* Workers Selection */}
              <View style={styles.selectionSection}>
                <Text style={styles.selectionTitle}>Select Workers ({selectedWorkers.length} selected)</Text>

                <View style={styles.quickActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setSelectedWorkers(workers.filter(w => w.isActive).map(w => w.id))}
                    style={styles.quickActionButton}
                    compact
                  >
                    Select All
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => setSelectedWorkers([])}
                    style={styles.quickActionButton}
                    compact
                  >
                    Clear All
                  </Button>
                </View>

                {workers.map((worker) => (
                  <TouchableOpacity
                    key={worker.id}
                    style={[
                      styles.selectionItem,
                      selectedWorkers.includes(worker.id) && styles.selectedItem,
                      !worker.isActive && styles.inactiveItem
                    ]}
                    onPress={() => worker.isActive && handleWorkerToggle(worker.id)}
                    disabled={!worker.isActive}
                  >
                    <View style={styles.workerInfo}>
                      <Text style={[styles.workerName, !worker.isActive && styles.inactiveText]}>
                        {worker.fullName}
                      </Text>
                      <Text style={[styles.workerEmail, !worker.isActive && styles.inactiveText]}>
                        {worker.email}
                      </Text>
                      {worker.phoneNumber && (
                        <Text style={[styles.workerPhone, !worker.isActive && styles.inactiveText]}>
                          {worker.phoneNumber}
                        </Text>
                      )}
                      <Text style={styles.workerAssignments}>
                        Currently assigned to {worker.assignedFeederPointIds?.length || 0} feeder points
                      </Text>
                    </View>
                    {selectedWorkers.includes(worker.id) && (
                      <MaterialIcons name="check-circle" size={24} color="#059669" />
                    )}
                    {!worker.isActive && (
                      <MaterialIcons name="block" size={24} color="#dc2626" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setAssignModalVisible(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveAssignment}
                  style={styles.modalButton}
                  loading={loading}
                >
                  Save Assignment
                </Button>
              </View>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 16,
  },
  header: {
    backgroundColor: "#ffffff",
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
  },
  headerRight: {
    width: 40,
  },
  viewModeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: '#2563eb',
  },
  toggleText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  activeToggleText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    backgroundColor: "#ffffff",
    elevation: 2,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2563eb",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    marginBottom: 12,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  cardDetails: {
    fontSize: 12,
    color: "#9ca3af",
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  assignmentInfo: {
    marginBottom: 12,
  },
  assignmentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  assignmentText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
  },
  noAssignmentText: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
    marginLeft: 22,
  },
  workersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  workerChip: {
    backgroundColor: "#dbeafe",
    height: 30,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: "#93c5fd",
  },
  workerChipText: {
    fontSize: 13,
    color: "#1d4ed8",
    fontWeight: "600",
  },
  moreChip: {
    backgroundColor: "#f3f4f6",
    height: 24,
  },
  moreChipText: {
    fontSize: 11,
    color: "#6b7280",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  assignButton: {
    backgroundColor: "#2563eb",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9ca3af",
    marginTop: 16,
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    margin: 20,
    borderRadius: 12,
    maxHeight: "80%",
  },
  modalScrollView: {
    maxHeight: "100%",
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 12,
  },
  feederPointSummary: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  feederPointSummaryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  feederPointSummaryArea: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  feederPointSummaryDetails: {
    fontSize: 12,
    color: "#9ca3af",
  },
  selectionSection: {
    marginBottom: 20,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
  },
  selectionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  selectedItem: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  inactiveItem: {
    backgroundColor: "#f9fafb",
    borderColor: "#e5e7eb",
  },
  workerInfo: {
    flex: 1,
    marginRight: 12,
  },
  workerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  workerEmail: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 1,
  },
  workerPhone: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 2,
  },
  workerAssignments: {
    fontSize: 11,
    color: "#059669",
    fontStyle: "italic",
  },
  inactiveText: {
    color: "#9ca3af",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  // Enhanced Worker Card Styles
  workerCard: {
    backgroundColor: "#ffffff",
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  workerCardContent: {
    padding: 20,
  },
  workerCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  workerAvatarContainer: {
    marginRight: 16,
  },
  workerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#dbeafe",
  },
  workerCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  workerCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  workerCardSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  workerCardDetails: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "500",
  },
  workerStatusContainer: {
    alignItems: "flex-end",
  },
  workerStatusChip: {
    height: 32,
    borderRadius: 16,
  },
  workerStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  workerAssignmentInfo: {
    marginBottom: 16,
  },
  workerAssignmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  workerAssignmentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
  },
  workerFeederPointsList: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
  },
  feederPointItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  feederPointIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  feederPointDetails: {
    flex: 1,
  },
  feederPointName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  feederPointArea: {
    fontSize: 12,
    color: "#6b7280",
  },
  moreFeederPoints: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginTop: 4,
  },
  moreFeederPointsText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
    fontStyle: "italic",
  },
  noAssignmentContainer: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  noAssignmentText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 8,
  },
  noAssignmentSubtext: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  workerCardActions: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 16,
  },
  workerStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  workerStat: {
    alignItems: "center",
    flex: 1,
  },
  workerStatNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  workerStatLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
})

export default WorkerAssignment
