import React, { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Modal,
  RefreshControl,
} from "react-native"
import { Card, Text, Button, Chip, Searchbar } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore"
import { FIRESTORE_DB } from "../../../FirebaseConfig"
import AdminSidebar from "../../components/AdminSidebar"
import { DriverAssignmentService, DriverAssignmentData } from "../../../services/DriverAssignmentService"
import ProtectedRoute from "../../components/ProtectedRoute"
import { useRequireAdmin } from "../../hooks/useRequireAuth"

interface Driver {
  id: string
  fullName: string
  email: string
  phoneNumber?: string
  contractorId?: string
  contractorName?: string
  isActive: boolean
  createdAt: Date
}

interface Contractor {
  id: string
  fullName: string
  email: string
  phoneNumber?: string
  assignedDrivers?: number
}

interface DriverWithAssignment extends Driver {
  assignmentStatus: 'assigned' | 'unassigned'
  assignedContractor?: Contractor
}

const DriverAssignmentScreen = ({ navigation }: any) => {
  const { hasAccess, userData } = useRequireAdmin(navigation)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [drivers, setDrivers] = useState<DriverWithAssignment[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [assignments, setAssignments] = useState<DriverAssignmentData[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState<"unassigned" | "assigned">("unassigned")
  const [selectedDriver, setSelectedDriver] = useState<DriverWithAssignment | null>(null)
  const [showContractorSelection, setShowContractorSelection] = useState(false)

  useEffect(() => {
    if (hasAccess) {
      fetchData()
    }
  }, [hasAccess])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchDrivers(),
        fetchContractors(),
        fetchAssignments()
      ])
    } catch (error) {
      console.error("❌ [DriverAssignment] Error fetching data:", error)
      Alert.alert("Error", "Failed to load data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const fetchDrivers = async () => {
    try {
      console.log("👨‍🚛 [DriverAssignment] Fetching drivers...")

      const driversRef = collection(FIRESTORE_DB, "users")
      const q = query(driversRef, where("role", "==", "driver"))
      const querySnapshot = await getDocs(q)

      const driversData: Driver[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()

        // Handle createdAt field safely
        let createdAt = new Date()
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            // Firestore Timestamp
            createdAt = data.createdAt.toDate()
          } else if (data.createdAt instanceof Date) {
            // Already a Date object
            createdAt = data.createdAt
          } else if (typeof data.createdAt === 'string') {
            // String date
            createdAt = new Date(data.createdAt)
          }
        }

        driversData.push({
          id: doc.id,
          fullName: data.fullName || "Unknown Driver",
          email: data.email || "",
          phoneNumber: data.phoneNumber,
          contractorId: data.contractorId,
          contractorName: data.contractorName,
          isActive: data.isActive !== false,
          createdAt: createdAt
        })
      })

      console.log("✅ [DriverAssignment] Fetched", driversData.length, "drivers")

      // Convert to DriverWithAssignment format
      const driversWithAssignment: DriverWithAssignment[] = driversData.map(driver => ({
        ...driver,
        assignmentStatus: driver.contractorId ? 'assigned' : 'unassigned'
      }))

      setDrivers(driversWithAssignment)

    } catch (error) {
      console.error("❌ [DriverAssignment] Error fetching drivers:", error)
      throw error
    }
  }

  const fetchContractors = async () => {
    try {
      console.log("🏢 [DriverAssignment] Fetching contractors...")

      const contractorsRef = collection(FIRESTORE_DB, "users")
      const q = query(contractorsRef, where("role", "==", "transport_contractor"))
      const querySnapshot = await getDocs(q)

      const contractorsData: Contractor[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        contractorsData.push({
          id: doc.id,
          fullName: data.fullName || "Unknown Contractor",
          email: data.email || "",
          phoneNumber: data.phoneNumber,
          assignedDrivers: 0 // Will be calculated
        })
      })

      // Calculate assigned drivers count
      const contractorsWithCounts = contractorsData.map(contractor => ({
        ...contractor,
        assignedDrivers: drivers.filter(driver => driver.contractorId === contractor.id).length
      }))

      console.log("✅ [DriverAssignment] Fetched", contractorsWithCounts.length, "contractors")
      setContractors(contractorsWithCounts)

    } catch (error) {
      console.error("❌ [DriverAssignment] Error fetching contractors:", error)
      throw error
    }
  }

  const fetchAssignments = async () => {
    try {
      console.log("📋 [DriverAssignment] Fetching assignments...")

      const assignments = await DriverAssignmentService.getAllDriverAssignments()
      setAssignments(assignments)

      console.log("✅ [DriverAssignment] Fetched", assignments.length, "assignments")

    } catch (error) {
      console.error("❌ [DriverAssignment] Error fetching assignments:", error)
      throw error
    }
  }

  const assignDriverToContractor = async (contractorId: string) => {
    if (!selectedDriver || !selectedDriver.id) return

    try {
      setLoading(true)
      console.log("🔄 [DriverAssignment] Assigning driver", selectedDriver.fullName, "to contractor", contractorId)

      await DriverAssignmentService.assignDriverToContractor({
        driverId: selectedDriver.id,
        contractorId: contractorId,
        assignedBy: userData?.uid || 'admin'
      })

      Alert.alert("Success", "Driver assigned successfully", [
        {
          text: "OK", onPress: () => {
            setShowContractorSelection(false)
            setSelectedDriver(null)
            fetchData()
          }
        }
      ])
    } catch (error) {
      console.error("❌ [DriverAssignment] Error assigning driver:", error)
      Alert.alert("Error", "Failed to assign driver")
    } finally {
      setLoading(false)
    }
  }

  const unassignDriver = async (driver: DriverWithAssignment) => {
    Alert.alert(
      "Unassign Driver",
      `Are you sure you want to unassign ${driver.fullName} from their contractor?`,
      [
        { text: "Cancel" },
        {
          text: "Unassign",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true)
              console.log("🔄 [DriverAssignment] Unassigning driver", driver.fullName)

              await DriverAssignmentService.unassignDriver(driver.id)

              Alert.alert("Success", "Driver unassigned successfully")
              fetchData()
            } catch (error) {
              console.error("❌ [DriverAssignment] Error unassigning driver:", error)
              Alert.alert("Error", "Failed to unassign driver")
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const handleAssignPress = async (driver: DriverWithAssignment) => {
    console.log("🎯 [DriverAssignment] Assign button pressed for:", driver.fullName)

    setSelectedDriver(driver)
    setShowContractorSelection(true)

    // Refresh contractors when modal opens
    console.log("🔄 [DriverAssignment] Auto-fetching contractors...")
    await fetchContractors()
    console.log("✅ [DriverAssignment] Modal opened and contractors fetched")
  }

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab = selectedTab === "assigned"
      ? driver.assignmentStatus === "assigned"
      : driver.assignmentStatus === "unassigned"

    return matchesSearch && matchesTab
  })

  const getAssignmentStats = () => {
    const total = drivers.length
    const assigned = drivers.filter(d => d.assignmentStatus === "assigned").length
    const unassigned = drivers.filter(d => d.assignmentStatus === "unassigned").length

    return { total, assigned, unassigned }
  }

  const stats = getAssignmentStats()

  if (!hasAccess) {
    return null
  }

  return (
    <ProtectedRoute requiredRole="admin" navigation={navigation}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1f2937" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuButton}>
            <MaterialIcons name="menu" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Driver Assignment</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <MaterialIcons name="refresh" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Statistics */}
          <Card style={styles.statsCard}>
            <Text style={styles.cardTitle}>Assignment Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialIcons name="people" size={24} color="#3b82f6" />
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Drivers</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="assignment-ind" size={24} color="#10b981" />
                <Text style={styles.statNumber}>{stats.assigned}</Text>
                <Text style={styles.statLabel}>Assigned</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="person-add" size={24} color="#f59e0b" />
                <Text style={styles.statNumber}>{stats.unassigned}</Text>
                <Text style={styles.statLabel}>Unassigned</Text>
              </View>
            </View>
          </Card>

          {/* Search and Filters */}
          <View style={styles.filtersSection}>
            <Searchbar
              placeholder="Search drivers..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
            />

            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, selectedTab === "unassigned" && styles.activeTab]}
                onPress={() => setSelectedTab("unassigned")}
              >
                <Text style={[styles.tabText, selectedTab === "unassigned" && styles.activeTabText]}>
                  Unassigned ({stats.unassigned})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, selectedTab === "assigned" && styles.activeTab]}
                onPress={() => setSelectedTab("assigned")}
              >
                <Text style={[styles.tabText, selectedTab === "assigned" && styles.activeTabText]}>
                  Assigned ({stats.assigned})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Drivers List */}
          <View style={styles.driversSection}>
            <Text style={styles.sectionTitle}>
              {selectedTab === "assigned" ? "Assigned Drivers" : "Unassigned Drivers"} ({filteredDrivers.length})
            </Text>

            {filteredDrivers.length > 0 ? (
              <View style={styles.driversList}>
                {filteredDrivers.map((driver) => (
                  <Card key={driver.id} style={styles.driverCard}>
                    <View style={styles.driverContent}>
                      <View style={styles.driverInfo}>
                        <View style={styles.driverHeader}>
                          <View style={styles.driverAvatar}>
                            <MaterialIcons name="person" size={24} color="#3b82f6" />
                          </View>
                          <View style={styles.driverDetails}>
                            <Text style={styles.driverName}>{driver.fullName}</Text>
                            <Text style={styles.driverEmail}>{driver.email}</Text>
                            {driver.phoneNumber && (
                              <Text style={styles.driverPhone}>📞 {driver.phoneNumber}</Text>
                            )}
                          </View>
                          <View style={styles.driverStatus}>
                            <Chip
                              mode="outlined"
                              style={[
                                styles.statusChip,
                                driver.assignmentStatus === 'assigned'
                                  ? styles.assignedChip
                                  : styles.unassignedChip
                              ]}
                            >
                              {driver.assignmentStatus === 'assigned' ? 'Assigned' : 'Unassigned'}
                            </Chip>
                          </View>
                        </View>

                        {driver.assignmentStatus === 'assigned' && driver.contractorName && (
                          <View style={styles.contractorInfo}>
                            <MaterialIcons name="business" size={16} color="#6b7280" />
                            <Text style={styles.contractorText}>
                              Assigned to: {driver.contractorName}
                            </Text>
                          </View>
                        )}

                        <View style={styles.driverMeta}>
                          <Text style={styles.metaText}>
                            Joined: {driver.createdAt.toLocaleDateString()}
                          </Text>
                          <Text style={[
                            styles.metaText,
                            driver.isActive ? styles.activeText : styles.inactiveText
                          ]}>
                            {driver.isActive ? '● Active' : '● Inactive'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.driverActions}>
                        {driver.assignmentStatus === 'unassigned' ? (
                          <Button
                            mode="contained"
                            onPress={() => handleAssignPress(driver)}
                            style={styles.assignButton}
                            icon="person-add"
                          >
                            Assign
                          </Button>
                        ) : (
                          <Button
                            mode="outlined"
                            onPress={() => unassignDriver(driver)}
                            style={styles.unassignButton}
                            icon="person-remove"
                          >
                            Unassign
                          </Button>
                        )}
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            ) : (
              <Card style={styles.emptyCard}>
                <MaterialIcons
                  name={selectedTab === "assigned" ? "assignment-ind" : "person-add"}
                  size={48}
                  color="#9ca3af"
                />
                <Text style={styles.emptyTitle}>
                  {selectedTab === "assigned" ? "No Assigned Drivers" : "No Unassigned Drivers"}
                </Text>
                <Text style={styles.emptyText}>
                  {selectedTab === "assigned"
                    ? "All drivers are currently unassigned."
                    : "All drivers have been assigned to contractors."
                  }
                </Text>
              </Card>
            )}
          </View>
        </ScrollView>

        {/* Contractor Selection Modal */}
        <Modal
          visible={showContractorSelection}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowContractorSelection(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Assign {selectedDriver?.fullName} to Contractor
                </Text>
                <TouchableOpacity
                  onPress={() => setShowContractorSelection(false)}
                  style={styles.closeButton}
                >
                  <MaterialIcons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.contractorList} showsVerticalScrollIndicator={false}>
                {contractors.map((contractor) => (
                  <TouchableOpacity
                    key={contractor.id}
                    style={styles.contractorItem}
                    onPress={() => assignDriverToContractor(contractor.id)}
                  >
                    <View style={styles.contractorInfo}>
                      <View style={styles.contractorAvatar}>
                        <MaterialIcons name="business" size={24} color="#3b82f6" />
                      </View>
                      <View style={styles.contractorDetails}>
                        <Text style={styles.contractorName}>{contractor.fullName}</Text>
                        <Text style={styles.contractorEmail}>{contractor.email}</Text>
                        <Text style={styles.contractorDrivers}>
                          {contractor.assignedDrivers} drivers assigned
                        </Text>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {contractors.length === 0 && (
                <View style={styles.emptyContractors}>
                  <MaterialIcons name="business" size={48} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>No Contractors Available</Text>
                  <Text style={styles.emptyText}>
                    Please add contractors before assigning drivers.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Admin Sidebar */}
        <AdminSidebar
          navigation={navigation}
          isVisible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          currentScreen="AdminDriverAssignment"
        />
      </SafeAreaView>
    </ProtectedRoute>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#1f2937",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 50 : 16,
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // Statistics styles
  statsCard: {
    marginBottom: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  // Filters styles
  filtersSection: {
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#3b82f6",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  activeTabText: {
    color: "#ffffff",
  },
  // Drivers section styles
  driversSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  driversList: {
    gap: 12,
  },
  driverCard: {
    marginBottom: 8,
  },
  driverContent: {
    padding: 16,
  },
  driverInfo: {
    marginBottom: 12,
  },
  driverHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  driverEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  driverPhone: {
    fontSize: 12,
    color: "#9ca3af",
  },
  driverStatus: {
    marginLeft: 8,
  },
  statusChip: {
    height: 28,
  },
  assignedChip: {
    backgroundColor: "#dcfce7",
    borderColor: "#10b981",
  },
  unassignedChip: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
  },
  contractorInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingLeft: 60,
  },
  contractorText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 4,
  },
  driverMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 60,
  },
  metaText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  activeText: {
    color: "#10b981",
  },
  inactiveText: {
    color: "#ef4444",
  },
  driverActions: {
    alignItems: "flex-start",
  },
  assignButton: {
    backgroundColor: "#3b82f6",
  },
  unassignButton: {
    borderColor: "#ef4444",
  },
  // Empty state styles
  emptyCard: {
    padding: 32,
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  contractorList: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  contractorItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  contractorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contractorDetails: {
    flex: 1,
  },
  contractorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  contractorEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  contractorDrivers: {
    fontSize: 12,
    color: "#9ca3af",
  },
  emptyContractors: {
    padding: 40,
    alignItems: "center",
  },
})

export default DriverAssignmentScreen
