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
  FlatList,
} from "react-native"
import { Card, Text, Button, Chip, Searchbar } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { collection, getDocs, query, where, addDoc } from "firebase/firestore"
import { FIRESTORE_DB } from "../../../FirebaseConfig"
import AdminSidebar from "../../components/AdminSidebar"
import { FeederPointService, FeederPoint, FeederPointAssignment as AssignmentData } from "../../../services/FeederPointService"
import ProtectedRoute from "../../components/ProtectedRoute"
import { useRequireAdmin } from "../../hooks/useRequireAuth"

interface FeederPointWithAssignment extends FeederPoint {
  isAssigned?: boolean
  assignedTo?: string
  assignedContractorName?: string
}

interface Contractor {
  id: string
  fullName: string
  email: string
  role: string
  isActive: boolean
}

const FeederPointAssignmentScreen = ({ navigation }: any) => {
  const { hasAccess, userData } = useRequireAdmin(navigation)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feederPoints, setFeederPoints] = useState<FeederPointWithAssignment[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [assignments, setAssignments] = useState<AssignmentData[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState<"unassigned" | "assigned">("unassigned")
  const [selectedFeederPoint, setSelectedFeederPoint] = useState<FeederPointWithAssignment | null>(null)
  const [showContractorSelection, setShowContractorSelection] = useState(false)

  useEffect(() => {
    fetchData()
    // Also fetch contractors on component mount
    fetchContractors()
  }, [])

  useEffect(() => {
    console.log("Modal state changed:", showContractorSelection)
    console.log("Selected feeder point:", selectedFeederPoint?.feederPointName)
    console.log("Available contractors:", contractors.length)
  }, [showContractorSelection, selectedFeederPoint, contractors.length])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchFeederPoints(),
        fetchContractors(),
        fetchAssignments()
      ])
    } catch (error) {
      console.error("Error fetching data:", error)
      Alert.alert("Error", "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const fetchFeederPoints = async () => {
    try {
      const points = await FeederPointService.getAllFeederPoints()
      setFeederPoints(points as FeederPointWithAssignment[])
    } catch (error) {
      console.error("Error fetching feeder points:", error)
    }
  }

  const createTestContractor = async () => {
    try {
      console.log("🏗️ Creating test contractor...")

      // Generate unique contractor data
      const timestamp = Date.now()
      const testContractor = {
        uid: `test-contractor-${timestamp}`,
        fullName: `Test Contractor ${timestamp}`,
        email: `contractor${timestamp}@swachh-netra.com`,
        role: "transport_contractor",
        phoneNumber: "+91-9876543210",
        isActive: true,
        companyName: "Test Waste Management Co.",
        licenseNumber: `LIC${timestamp}`,
        serviceAreas: ["Ward 1", "Ward 2"],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      console.log("📝 Creating contractor with data:", testContractor)
      const docRef = await addDoc(collection(FIRESTORE_DB, "users"), testContractor)
      console.log("✅ Test contractor created with ID:", docRef.id)

      Alert.alert(
        "Success",
        `Test contractor "${testContractor.fullName}" created successfully!\n\nEmail: ${testContractor.email}`,
        [
          { text: "OK", onPress: () => fetchContractors() }
        ]
      )
    } catch (error) {
      console.error("❌ Error creating test contractor:", error)
      Alert.alert(
        "Error",
        `Failed to create test contractor: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [
          { text: "OK" },
          { text: "Retry", onPress: createTestContractor }
        ]
      )
    }
  }

  const checkDatabaseStatus = async () => {
    try {
      console.log("🔍 Checking database status...")
      const usersRef = collection(FIRESTORE_DB, "users")
      const querySnapshot = await getDocs(usersRef)

      console.log(`📊 Total users in database: ${querySnapshot.size}`)

      const allUsers: any[] = []
      const usersByRole: { [key: string]: number } = {}

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        allUsers.push({ id: doc.id, ...data })

        const role = data.role || "unknown"
        usersByRole[role] = (usersByRole[role] || 0) + 1
        console.log(`👤 User: ${data.fullName || "No Name"} (${data.email || "No Email"}) - Role: ${role} - Active: ${data.isActive}`)
      })

      console.log("📈 Users by role:", usersByRole)
      console.log("📋 All users:", allUsers)

      const contractorUsers = allUsers.filter(user => user.role === "contractor")
      console.log(`🏢 Found ${contractorUsers.length} contractor(s):`, contractorUsers.map(c => c.fullName))

      if (querySnapshot.size === 0) {
        Alert.alert(
          "Empty Database",
          "No users found in the database. This might be a new installation or there could be a connection issue.",
          [
            { text: "OK" },
            { text: "Create Test Contractor", onPress: createTestContractor }
          ]
        )
      } else if (contractorUsers.length === 0) {
        Alert.alert(
          "No Contractors Found",
          `Found ${querySnapshot.size} users in database, but none have the 'contractor' role. Would you like to create a test contractor?`,
          [
            { text: "OK" },
            { text: "Create Test Contractor", onPress: createTestContractor }
          ]
        )
      }
    } catch (error) {
      console.error("❌ Error checking database status:", error)
      Alert.alert("Database Error", `Could not connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const fetchContractors = async () => {
    try {
      console.log("🔍 Fetching contractors from Firebase...")

      const usersRef = collection(FIRESTORE_DB, "users")

      // First, try to get all transport contractors (both active and inactive)
      console.log("📋 Querying users collection for role='transport_contractor'...")
      const q = query(usersRef, where("role", "==", "transport_contractor"))
      const querySnapshot = await getDocs(q)

      console.log(`📊 Query returned ${querySnapshot.size} documents`)

      const contractorList: Contractor[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        console.log(`👤 Found transport contractor: ${data.fullName} (${data.email}) - Active: ${data.isActive}`)

        contractorList.push({
          id: doc.id,
          fullName: data.fullName || "Unknown Name",
          email: data.email || "No Email",
          role: data.role,
          isActive: data.isActive !== false // Default to true if not specified
        } as Contractor)
      })

      console.log(`✅ Successfully fetched ${contractorList.length} transport contractors`)
      console.log("📋 Transport contractor list:", contractorList.map(c => `${c.fullName} (${c.email})`))

      setContractors(contractorList)

      // Show success message if contractors found
      if (contractorList.length > 0) {
        console.log(`🎉 Found ${contractorList.length} transport contractor(s) ready for assignment`)
      } else {
        console.log("⚠️ No transport contractors found in database")
        Alert.alert(
          "No Transport Contractors Found",
          "No transport contractors are registered in the system. Please ensure contractors have signed up with the 'transport_contractor' role.",
          [
            { text: "OK" },
            {
              text: "Create Test Contractor",
              onPress: createTestContractor
            }
          ]
        )
      }
    } catch (error) {
      console.error("❌ Error fetching contractors:", error)
      Alert.alert(
        "Error",
        `Failed to fetch contractors: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your connection and try again.`,
        [
          { text: "OK" },
          { text: "Retry", onPress: fetchContractors }
        ]
      )
    }
  }

  const fetchAssignments = async () => {
    try {
      const assignmentList = await FeederPointService.getActiveAssignments()
      setAssignments(assignmentList)
    } catch (error) {
      console.error("Error fetching assignments:", error)
    }
  }

  const getAssignedFeederPoints = () => {
    return feederPoints.filter(point => {
      const assignment = assignments.find(a => a.feederPointId === point.id)
      if (assignment) {
        const contractor = contractors.find(c => c.id === assignment.contractorId)
        point.isAssigned = true
        point.assignedTo = assignment.contractorId
        point.assignedContractorName = contractor?.fullName || "Unknown"
        return true
      }
      return false
    })
  }

  const getUnassignedFeederPoints = () => {
    return feederPoints.filter(point => {
      const assignment = assignments.find(a => a.feederPointId === point.id)
      return !assignment
    })
  }

  const filteredFeederPoints = () => {
    const points = selectedTab === "assigned" ? getAssignedFeederPoints() : getUnassignedFeederPoints()

    if (!searchQuery) return points

    return points.filter(point =>
      point.feederPointName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.areaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.wardNumber.includes(searchQuery) ||
      (point.assignedContractorName && point.assignedContractorName.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }

  const assignFeederPoint = async (contractorId: string) => {
    if (!selectedFeederPoint || !selectedFeederPoint.id) return

    try {
      setLoading(true)

      const assignmentData = {
        feederPointId: selectedFeederPoint.id,
        contractorId: contractorId,
        assignedBy: "admin",
        status: "active" as const
      }

      await FeederPointService.createAssignment(assignmentData)

      Alert.alert("Success", "Feeder point assigned successfully", [
        {
          text: "OK", onPress: () => {
            setShowContractorSelection(false)
            setSelectedFeederPoint(null)
            fetchAssignments()
          }
        }
      ])
    } catch (error) {
      console.error("Error assigning feeder point:", error)
      Alert.alert("Error", "Failed to assign feeder point")
    } finally {
      setLoading(false)
    }
  }

  const unassignFeederPoint = async (feederPointId: string) => {
    try {
      setLoading(true)

      const assignment = assignments.find(a => a.feederPointId === feederPointId)
      if (assignment && assignment.id) {
        await FeederPointService.deleteAssignment(assignment.id)

        Alert.alert("Success", "Feeder point unassigned successfully")
        fetchAssignments()
      }
    } catch (error) {
      console.error("Error unassigning feeder point:", error)
      Alert.alert("Error", "Failed to unassign feeder point")
    } finally {
      setLoading(false)
    }
  }

  const handleAssignPress = async (feederPoint: FeederPointWithAssignment) => {
    console.log("🎯 Assign button pressed for:", feederPoint.feederPointName)
    console.log("📋 Current contractors in state:", contractors.length)

    setSelectedFeederPoint(feederPoint)
    setShowContractorSelection(true)

    // Automatically fetch contractors when modal opens
    console.log("🔄 Auto-fetching contractors...")
    await fetchContractors()
    console.log("✅ Modal opened and contractors fetched")
  }

  const handleUnassignPress = (feederPoint: FeederPointWithAssignment) => {
    Alert.alert(
      "Unassign Feeder Point",
      `Are you sure you want to unassign "${feederPoint.feederPointName}" from ${feederPoint.assignedContractorName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Unassign", style: "destructive", onPress: () => feederPoint.id && unassignFeederPoint(feederPoint.id) }
      ]
    )
  }

  const renderFeederPointCard = ({ item }: { item: FeederPointWithAssignment }) => (
    <Card style={styles.pointCard}>
      <View style={styles.pointContent}>
        <View style={styles.pointHeader}>
          <Text style={styles.pointName}>{item.feederPointName}</Text>
          <View style={styles.pointBadges}>
            <Chip style={styles.wardChip} textStyle={styles.wardChipText}>
              Ward {item.wardNumber}
            </Chip>
            {item.isAssigned && (
              <Chip style={styles.assignedChip} textStyle={styles.assignedChipText}>
                Assigned
              </Chip>
            )}
          </View>
        </View>

        <Text style={styles.pointArea}>{item.areaName}</Text>
        <Text style={styles.pointLandmark}>{item.nearestLandmark}</Text>
        <Text style={styles.pointKothi}>Kothi: {item.kothiName}</Text>

        <View style={styles.pointDetails}>
          <Text style={styles.pointHouseholds}>{item.approximateHouseholds} households</Text>
          <Text style={styles.pointVehicles}>{item.vehicleTypes}</Text>
        </View>

        {item.isAssigned && (
          <View style={styles.assignmentInfo}>
            <Text style={styles.assignedToLabel}>Assigned to:</Text>
            <Text style={styles.assignedToName}>{item.assignedContractorName}</Text>
          </View>
        )}

        <View style={styles.pointActions}>
          {item.isAssigned ? (
            <Button
              mode="outlined"
              onPress={() => handleUnassignPress(item)}
              style={styles.unassignButton}
              textColor="#ef4444"
              icon="person-remove"
            >
              Unassign
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={() => handleAssignPress(item)}
              style={styles.assignButton}
              icon="person-add"
            >
              Assign to Contractor
            </Button>
          )}
        </View>
      </View>
    </Card>
  )

  return (
    <ProtectedRoute requiredRole="admin" navigation={navigation}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => setSidebarVisible(true)}
              style={styles.menuButton}
            >
              <MaterialIcons name="menu" size={24} color="#374151" />
            </TouchableOpacity>

            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <MaterialIcons name="arrow-back" size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Feeder Point Assignment</Text>
            </View>
          </View>
        </View>

        {/* Search and Tabs */}
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Search feeder points..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === "unassigned" && styles.activeTab]}
              onPress={() => setSelectedTab("unassigned")}
            >
              <Text style={[styles.tabText, selectedTab === "unassigned" && styles.activeTabText]}>
                Unassigned ({getUnassignedFeederPoints().length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, selectedTab === "assigned" && styles.activeTab]}
              onPress={() => setSelectedTab("assigned")}
            >
              <Text style={[styles.tabText, selectedTab === "assigned" && styles.activeTabText]}>
                Assigned ({getAssignedFeederPoints().length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feeder Points List */}
        <FlatList
          data={filteredFeederPoints()}
          renderItem={renderFeederPointCard}
          keyExtractor={(item) => item.id || ""}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchData}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <MaterialIcons
                  name={selectedTab === "assigned" ? "assignment-turned-in" : "assignment"}
                  size={48}
                  color="#9ca3af"
                />
                <Text style={styles.emptyText}>
                  {selectedTab === "assigned" ? "No assigned feeder points" : "No unassigned feeder points"}
                </Text>
                <Text style={styles.emptySubtext}>
                  {selectedTab === "assigned"
                    ? "All feeder points are currently unassigned"
                    : "All feeder points have been assigned to contractors"
                  }
                </Text>
              </View>
            </Card>
          }
        />

        {/* Contractor Selection Modal */}
        {showContractorSelection && selectedFeederPoint && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Contractor</Text>
                <TouchableOpacity
                  onPress={() => setShowContractorSelection(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialIcons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Assign "{selectedFeederPoint.feederPointName}" to a contractor
              </Text>

              {/* Contractor Status Info */}
              <View style={styles.statusInfo}>
                <View style={styles.statusRow}>
                  <MaterialIcons name="people" size={16} color="#3b82f6" />
                  <Text style={styles.statusText}>
                    {contractors.length} contractor{contractors.length !== 1 ? 's' : ''} available
                  </Text>
                </View>
                {contractors.length === 0 && (
                  <View style={styles.statusRow}>
                    <MaterialIcons name="info" size={16} color="#f59e0b" />
                    <Text style={styles.statusWarning}>
                      No contractors found. Create one below or ensure contractors have registered.
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  onPress={fetchContractors}
                  style={styles.actionButton}
                  icon="refresh"
                >
                  Refresh List
                </Button>
                <Button
                  mode="outlined"
                  onPress={checkDatabaseStatus}
                  style={styles.actionButton}
                  icon="database"
                >
                  Check Database
                </Button>
              </View>

              {contractors.length === 0 && (
                <View style={styles.actionButtons}>
                  <Button
                    mode="contained"
                    onPress={createTestContractor}
                    style={[styles.actionButton, { marginHorizontal: 20 }]}
                    icon="add"
                  >
                    Create Test Contractor
                  </Button>
                </View>
              )}

              <ScrollView style={styles.contractorList} showsVerticalScrollIndicator={false}>
                {contractors.map((contractor) => (
                  <TouchableOpacity
                    key={contractor.id}
                    style={styles.contractorItem}
                    onPress={() => assignFeederPoint(contractor.id)}
                  >
                    <View style={styles.contractorInfo}>
                      <View style={styles.contractorAvatar}>
                        <MaterialIcons name="business" size={24} color="#3b82f6" />
                      </View>
                      <View style={styles.contractorDetails}>
                        <Text style={styles.contractorName}>{contractor.fullName}</Text>
                        <Text style={styles.contractorEmail}>{contractor.email}</Text>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                ))}

                {contractors.length === 0 && (
                  <View style={styles.noContractors}>
                    <MaterialIcons name="business" size={48} color="#9ca3af" />
                    <Text style={styles.noContractorsText}>No active contractors found</Text>
                    <Text style={styles.noContractorsSubtext}>
                      Please ensure contractors are registered and active
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Admin Sidebar */}
        <AdminSidebar
          navigation={navigation}
          isVisible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          currentScreen="FeederPointAssignment"
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
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  searchSection: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  searchBar: {
    backgroundColor: "#f9fafb",
    elevation: 0,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#ffffff",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  activeTabText: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  listContainer: {
    padding: 20,
  },
  pointCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 16,
  },
  pointContent: {
    padding: 16,
  },
  pointHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  pointName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  pointBadges: {
    flexDirection: "row",
    gap: 8,
  },
  wardChip: {
    backgroundColor: "#eff6ff",
    height: 28,
  },
  wardChipText: {
    fontSize: 12,
    color: "#3b82f6",
  },
  assignedChip: {
    backgroundColor: "#f0fdf4",
    height: 28,
  },
  assignedChipText: {
    fontSize: 12,
    color: "#10b981",
  },
  pointArea: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  pointLandmark: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 4,
  },
  pointKothi: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 12,
  },
  pointDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pointHouseholds: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "500",
  },
  pointVehicles: {
    fontSize: 12,
    color: "#f59e0b",
    fontWeight: "500",
  },
  assignmentInfo: {
    backgroundColor: "#f0fdf4",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  assignedToLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  assignedToName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
  },
  pointActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  assignButton: {
    flex: 1,
  },
  unassignButton: {
    flex: 1,
    borderColor: "#ef4444",
  },
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
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
    textAlign: "center",
  },
  // Modal styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    margin: 20,
    maxHeight: "80%",
    width: "90%",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    padding: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  contractorList: {
    maxHeight: 300,
  },
  contractorItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  contractorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  contractorAvatar: {
    backgroundColor: "#eff6ff",
    borderRadius: 20,
    width: 40,
    height: 40,
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
  },
  noContractors: {
    padding: 40,
    alignItems: "center",
  },
  noContractorsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 16,
    textAlign: "center",
  },
  noContractorsSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
    textAlign: "center",
  },
  // New styles for improved UI
  statusInfo: {
    backgroundColor: "#f8fafc",
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
    fontWeight: "500",
  },
  statusWarning: {
    fontSize: 12,
    color: "#d97706",
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
})

export default FeederPointAssignmentScreen
