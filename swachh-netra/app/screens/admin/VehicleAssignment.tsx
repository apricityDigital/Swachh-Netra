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
import { VehicleService, Vehicle, VehicleAssignment as VehicleAssignmentData } from "../../../services/VehicleService"
import ProtectedRoute from "../../components/ProtectedRoute"
import { useRequireAdmin } from "../../hooks/useRequireAuth"

interface VehicleWithAssignment extends Vehicle {
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

const VehicleAssignmentScreen = ({ navigation }: any) => {
  const { hasAccess, userData } = useRequireAdmin(navigation)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState<VehicleWithAssignment[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [assignments, setAssignments] = useState<VehicleAssignmentData[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState<"unassigned" | "assigned">("unassigned")
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithAssignment | null>(null)
  const [showContractorSelection, setShowContractorSelection] = useState(false)

  useEffect(() => {
    fetchData()
    // Also fetch contractors on component mount
    fetchContractors()
  }, [])

  useEffect(() => {
    console.log("[VehicleAssignment] Modal state changed:", showContractorSelection)
    console.log("[VehicleAssignment] Selected vehicle:", selectedVehicle?.vehicleNumber)
    console.log("[VehicleAssignment] Available contractors:", contractors.length)
  }, [showContractorSelection, selectedVehicle, contractors.length])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchVehicles(),
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

  const fetchVehicles = async () => {
    try {
      const vehicleList = await VehicleService.getAllVehicles()
      setVehicles(vehicleList as VehicleWithAssignment[])
    } catch (error) {
      console.error("Error fetching vehicles:", error)
    }
  }

  const fetchContractors = async () => {
    try {
      console.log("🔍 [VehicleAssignment] Fetching contractors from Firebase...")

      const usersRef = collection(FIRESTORE_DB, "users")

      // First, let's see ALL users to debug the issue
      console.log("🔍 [VehicleAssignment] First, fetching ALL users to debug...")
      const allUsersSnapshot = await getDocs(usersRef)
      console.log(`📊 [VehicleAssignment] Total users in database: ${allUsersSnapshot.size}`)

      const allUsers: any[] = []
      allUsersSnapshot.forEach((doc) => {
        const data = doc.data()
        allUsers.push({ id: doc.id, ...data })
        console.log(`👥 [VehicleAssignment] User: ${data.fullName || data.name || 'No Name'} | Email: ${data.email || 'No Email'} | Role: ${data.role || 'No Role'} | ContractorId: ${data.contractorId || 'None'}`)
      })

      // Now filter for transport contractors - try multiple approaches
      console.log("📋 [VehicleAssignment] Filtering for transport contractors...")

      // Method 1: Users with role='transport_contractor'
      const contractorsByRole = allUsers.filter(user => user.role === "transport_contractor")
      console.log(`🏢 [VehicleAssignment] Method 1 - Users with role='transport_contractor': ${contractorsByRole.length}`)

      // Method 2: Users with contractorId field (might be drivers assigned to contractors)
      const usersWithContractorId = allUsers.filter(user => user.contractorId)
      console.log(`🚛 [VehicleAssignment] Method 2 - Users with contractorId field: ${usersWithContractorId.length}`)

      // Method 3: Check for different role field variations
      const contractorVariations = allUsers.filter(user =>
        user.role === "transport_contractor" ||
        user.userRole === "transport_contractor" ||
        user.type === "transport_contractor" ||
        user.accountType === "transport_contractor" ||
        user.role === "contractor" // Also check for old contractor role
      )
      console.log(`🔄 [VehicleAssignment] Method 3 - Role variations: ${contractorVariations.length}`)

      // Use the contractors found by role
      const contractorList: Contractor[] = []
      contractorsByRole.forEach((user, index) => {
        console.log(`👤 [VehicleAssignment] Processing contractor ${index + 1}:`, {
          id: user.id,
          fullName: user.fullName || user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          uid: user.uid
        })

        contractorList.push({
          id: user.id,
          fullName: user.fullName || user.name || `Contractor ${index + 1}`,
          email: user.email || `contractor${index + 1}@unknown.com`,
          role: user.role,
          isActive: user.isActive !== false
        } as Contractor)
      })

      console.log(`✅ [VehicleAssignment] Final transport contractor list: ${contractorList.length} contractors`)
      contractorList.forEach((contractor, index) => {
        console.log(`📋 [VehicleAssignment] Transport Contractor ${index + 1}: ${contractor.fullName} (${contractor.email}) - ID: ${contractor.id}`)
      })

      setContractors(contractorList)

      // Show detailed results
      if (contractorList.length > 0) {
        console.log(`🎉 [VehicleAssignment] Found ${contractorList.length} transport contractor(s) ready for vehicle assignment`)
        if (contractorList.length < 3) {
          console.log(`⚠️ [VehicleAssignment] Expected 3 transport contractors but found ${contractorList.length}. Check the debug logs above.`)
        }
      } else {
        console.log("⚠️ [VehicleAssignment] No contractors found in database")
        console.log("🔍 [VehicleAssignment] Debug info:")
        console.log(`- Total users: ${allUsers.length}`)
        console.log(`- Users by role breakdown:`, allUsers.reduce((acc, user) => {
          const role = user.role || 'no-role'
          acc[role] = (acc[role] || 0) + 1
          return acc
        }, {}))
      }
    } catch (error) {
      console.error("❌ [VehicleAssignment] Error fetching contractors:", error)
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

  const createTestContractor = async () => {
    try {
      console.log("🏗️ [VehicleAssignment] Creating test contractor...")

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

      console.log("📝 [VehicleAssignment] Creating contractor with data:", testContractor)
      const docRef = await addDoc(collection(FIRESTORE_DB, "users"), testContractor)
      console.log("✅ [VehicleAssignment] Test contractor created with ID:", docRef.id)

      Alert.alert(
        "Success",
        `Test contractor "${testContractor.fullName}" created successfully!\n\nEmail: ${testContractor.email}`,
        [
          { text: "OK", onPress: () => fetchContractors() }
        ]
      )
    } catch (error) {
      console.error("❌ [VehicleAssignment] Error creating test contractor:", error)
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
      console.log("🔍 [VehicleAssignment] Detailed database status check...")
      const usersRef = collection(FIRESTORE_DB, "users")
      const querySnapshot = await getDocs(usersRef)

      console.log(`📊 [VehicleAssignment] Total users in database: ${querySnapshot.size}`)

      const allUsers: any[] = []
      const usersByRole: { [key: string]: number } = {}

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        allUsers.push({ id: doc.id, ...data })

        const role = data.role || "unknown"
        usersByRole[role] = (usersByRole[role] || 0) + 1

        // Detailed logging for each user
        console.log(`👤 [VehicleAssignment] User Details:`, {
          id: doc.id,
          fullName: data.fullName || data.name || "No Name",
          email: data.email || "No Email",
          role: data.role || "No Role",
          isActive: data.isActive,
          uid: data.uid,
          contractorId: data.contractorId,
          createdAt: data.createdAt?.toDate?.() || data.createdAt
        })
      })

      console.log("📈 [VehicleAssignment] Users by role breakdown:", usersByRole)

      const contractorUsers = allUsers.filter(user => user.role === "transport_contractor")
      console.log(`🏢 [VehicleAssignment] Contractor analysis:`)
      console.log(`- Total contractors found: ${contractorUsers.length}`)
      console.log(`- Expected contractors: 3`)
      console.log(`- Missing contractors: ${Math.max(0, 3 - contractorUsers.length)}`)

      contractorUsers.forEach((contractor, index) => {
        console.log(`🏢 [VehicleAssignment] Contractor ${index + 1}:`, {
          id: contractor.id,
          name: contractor.fullName || contractor.name,
          email: contractor.email,
          active: contractor.isActive,
          uid: contractor.uid
        })
      })

      // Create detailed alert message
      let alertMessage = `Database Analysis:\n\n`
      alertMessage += `📊 Total Users: ${querySnapshot.size}\n`
      alertMessage += `🏢 Contractors Found: ${contractorUsers.length}\n`
      alertMessage += `🎯 Expected: 3 contractors\n\n`

      if (contractorUsers.length > 0) {
        alertMessage += `Contractor Details:\n`
        contractorUsers.forEach((c, i) => {
          alertMessage += `${i + 1}. ${c.fullName || c.name || 'No Name'}\n`
          alertMessage += `   📧 ${c.email || 'No Email'}\n`
          alertMessage += `   🆔 ${c.id}\n\n`
        })
      }

      alertMessage += `\nRole Breakdown:\n`
      Object.entries(usersByRole).forEach(([role, count]) => {
        alertMessage += `• ${role}: ${count}\n`
      })

      if (contractorUsers.length < 3) {
        alertMessage += `\n⚠️ Missing ${3 - contractorUsers.length} contractor(s)`
        alertMessage += `\nCheck console logs for detailed user analysis.`
      }

      Alert.alert("Detailed Database Status", alertMessage, [
        { text: "OK" },
        { text: "Refresh Contractors", onPress: fetchContractors }
      ])

    } catch (error) {
      console.error("❌ [VehicleAssignment] Error checking database status:", error)
      Alert.alert("Database Error", `Could not connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const fetchAssignments = async () => {
    try {
      const assignmentList = await VehicleService.getActiveVehicleAssignments()
      const adminToContractorAssignments = assignmentList.filter(
        assignment => assignment.assignmentType === "admin_to_contractor"
      )
      setAssignments(adminToContractorAssignments)
    } catch (error) {
      console.error("Error fetching assignments:", error)
    }
  }

  const getAssignedVehicles = () => {
    return vehicles.filter(vehicle => {
      const assignment = assignments.find(a => a.vehicleId === vehicle.id)
      if (assignment) {
        const contractor = contractors.find(c => c.id === assignment.assignedTo)
        vehicle.isAssigned = true
        vehicle.assignedTo = assignment.assignedTo
        vehicle.assignedContractorName = contractor?.fullName || "Unknown"
        return true
      }
      return false
    })
  }

  const getUnassignedVehicles = () => {
    return vehicles.filter(vehicle => {
      const assignment = assignments.find(a => a.vehicleId === vehicle.id)
      return !assignment
    })
  }

  const filteredVehicles = () => {
    const vehicleList = selectedTab === "assigned" ? getAssignedVehicles() : getUnassignedVehicles()

    if (!searchQuery) return vehicleList

    return vehicleList.filter(vehicle =>
      vehicle.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.vehicleType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle.assignedContractorName && vehicle.assignedContractorName.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }

  const assignVehicle = async (contractorId: string) => {
    if (!selectedVehicle || !selectedVehicle.id) return

    try {
      setLoading(true)

      const assignmentData = {
        vehicleId: selectedVehicle.id,
        assignedTo: contractorId,
        assignedBy: "admin",
        assignmentType: "admin_to_contractor" as const,
        status: "active" as const
      }

      await VehicleService.createVehicleAssignment(assignmentData)

      Alert.alert("Success", "Vehicle assigned successfully", [
        {
          text: "OK", onPress: () => {
            setShowContractorSelection(false)
            setSelectedVehicle(null)
            fetchAssignments()
          }
        }
      ])
    } catch (error) {
      console.error("Error assigning vehicle:", error)
      Alert.alert("Error", "Failed to assign vehicle")
    } finally {
      setLoading(false)
    }
  }

  const unassignVehicle = async (vehicleId: string) => {
    try {
      setLoading(true)

      const assignment = assignments.find(a => a.vehicleId === vehicleId)
      if (assignment && assignment.id) {
        await VehicleService.deleteVehicleAssignment(assignment.id)

        Alert.alert("Success", "Vehicle unassigned successfully")
        fetchAssignments()
      }
    } catch (error) {
      console.error("Error unassigning vehicle:", error)
      Alert.alert("Error", "Failed to unassign vehicle")
    } finally {
      setLoading(false)
    }
  }

  const handleAssignPress = async (vehicle: VehicleWithAssignment) => {
    console.log("🎯 [VehicleAssignment] Assign button pressed for:", vehicle.vehicleNumber)
    console.log("📋 [VehicleAssignment] Current contractors in state:", contractors.length)

    setSelectedVehicle(vehicle)
    setShowContractorSelection(true)

    // Automatically fetch contractors when modal opens
    console.log("🔄 [VehicleAssignment] Auto-fetching contractors...")
    await fetchContractors()
    console.log("✅ [VehicleAssignment] Modal opened and contractors fetched")
  }

  const handleUnassignPress = (vehicle: VehicleWithAssignment) => {
    Alert.alert(
      "Unassign Vehicle",
      `Are you sure you want to unassign "${vehicle.vehicleNumber}" from ${vehicle.assignedContractorName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Unassign", style: "destructive", onPress: () => vehicle.id && unassignVehicle(vehicle.id) }
      ]
    )
  }

  const getStatusColor = (status: Vehicle["status"]) => {
    switch (status) {
      case "active": return "#10b981"
      case "maintenance": return "#f59e0b"
      case "inactive": return "#ef4444"
      default: return "#6b7280"
    }
  }

  const renderVehicleCard = ({ item }: { item: VehicleWithAssignment }) => (
    <Card style={styles.vehicleCard}>
      <View style={styles.vehicleContent}>
        <View style={styles.vehicleHeader}>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleNumber}>{item.vehicleNumber}</Text>
            <Text style={styles.vehicleType}>{item.vehicleType}</Text>
          </View>
          <View style={styles.vehicleBadges}>
            <Chip
              style={[styles.statusChip, { backgroundColor: `${getStatusColor(item.status)}20` }]}
              textStyle={[styles.statusChipText, { color: getStatusColor(item.status) }]}
            >
              {item.status.toUpperCase()}
            </Chip>
            {item.isAssigned && (
              <Chip style={styles.assignedChip} textStyle={styles.assignedChipText}>
                Assigned
              </Chip>
            )}
          </View>
        </View>

        <View style={styles.vehicleDetails}>
          <View style={styles.detailItem}>
            <MaterialIcons name="local-shipping" size={16} color="#6b7280" />
            <Text style={styles.detailText}>Capacity: {item.capacity} tons</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="calendar-today" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              Registered: {new Date(item.registrationDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {item.isAssigned && (
          <View style={styles.assignmentInfo}>
            <Text style={styles.assignedToLabel}>Assigned to:</Text>
            <Text style={styles.assignedToName}>{item.assignedContractorName}</Text>
          </View>
        )}

        <View style={styles.vehicleActions}>
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
              icon="person-plus"
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
              <Text style={styles.headerTitle}>Vehicle Assignment</Text>
            </View>
          </View>
        </View>

        {/* Search and Tabs */}
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Search vehicles..."
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
                Unassigned ({getUnassignedVehicles().length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, selectedTab === "assigned" && styles.activeTab]}
              onPress={() => setSelectedTab("assigned")}
            >
              <Text style={[styles.tabText, selectedTab === "assigned" && styles.activeTabText]}>
                Assigned ({getAssignedVehicles().length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicles List */}
        <FlatList
          data={filteredVehicles()}
          renderItem={renderVehicleCard}
          keyExtractor={(item) => item.id || ""}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchData}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <MaterialIcons
                  name={selectedTab === "assigned" ? "assignment-turned-in" : "local-shipping"}
                  size={48}
                  color="#9ca3af"
                />
                <Text style={styles.emptyText}>
                  {selectedTab === "assigned" ? "No assigned vehicles" : "No unassigned vehicles"}
                </Text>
                <Text style={styles.emptySubtext}>
                  {selectedTab === "assigned"
                    ? "All vehicles are currently unassigned"
                    : "All vehicles have been assigned to contractors"
                  }
                </Text>
              </View>
            </Card>
          }
        />

        {/* Contractor Selection Modal */}
        {showContractorSelection && selectedVehicle && (
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
                Assign "{selectedVehicle.vehicleNumber}" to a contractor
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
                {contractors.map((contractor, index) => {
                  console.log(`🏢 [VehicleAssignment] Rendering contractor ${index + 1}:`, contractor.fullName, contractor.email)
                  return (
                    <TouchableOpacity
                      key={contractor.id}
                      style={styles.contractorItem}
                      onPress={() => assignVehicle(contractor.id)}
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
                  )
                })}

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
          currentScreen="VehicleAssignment"
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
  vehicleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 16,
  },
  vehicleContent: {
    padding: 16,
  },
  vehicleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
    marginRight: 12,
  },
  vehicleNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  vehicleType: {
    fontSize: 14,
    color: "#6b7280",
  },
  vehicleBadges: {
    flexDirection: "row",
    gap: 8,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  assignedChip: {
    backgroundColor: "#f0fdf4",
    height: 28,
  },
  assignedChipText: {
    fontSize: 12,
    color: "#10b981",
  },
  vehicleDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
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
  vehicleActions: {
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

export default VehicleAssignmentScreen
