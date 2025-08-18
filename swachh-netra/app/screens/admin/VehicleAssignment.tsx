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
import { collection, getDocs, query, where } from "firebase/firestore"
import { FIRESTORE_DB } from "../../../FirebaseConfig"
import AdminSidebar from "../../components/AdminSidebar"
import { VehicleService, Vehicle, VehicleAssignment as VehicleAssignmentData } from "../../../services/VehicleService"

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
  }, [])

  useEffect(() => {
    console.log("Modal state changed:", showContractorSelection)
    console.log("Selected vehicle:", selectedVehicle?.vehicleNumber)
  }, [showContractorSelection, selectedVehicle])

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
      console.log("Fetching contractors...")
      const usersRef = collection(FIRESTORE_DB, "users")
      
      // First, try to get contractors with isActive: true
      let q = query(
        usersRef, 
        where("role", "==", "contractor"),
        where("isActive", "==", true)
      )
      let querySnapshot = await getDocs(q)
      
      let contractorList: Contractor[] = []
      querySnapshot.forEach((doc) => {
        contractorList.push({ id: doc.id, ...doc.data() } as Contractor)
      })
      
      // If no active contractors found, try to get all contractors
      if (contractorList.length === 0) {
        console.log("No active contractors found, fetching all contractors...")
        q = query(usersRef, where("role", "==", "contractor"))
        querySnapshot = await getDocs(q)
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          contractorList.push({ 
            id: doc.id, 
            ...data,
            isActive: data.isActive !== false
          } as Contractor)
        })
      }
      
      console.log("Found contractors:", contractorList.length)
      setContractors(contractorList)
    } catch (error) {
      console.error("Error fetching contractors:", error)
      Alert.alert("Error", "Failed to fetch contractors. Please check your connection.")
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
        { text: "OK", onPress: () => {
          setShowContractorSelection(false)
          setSelectedVehicle(null)
          fetchAssignments()
        }}
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

  const handleAssignPress = (vehicle: VehicleWithAssignment) => {
    console.log("Assign button pressed for:", vehicle.vehicleNumber)
    console.log("Available contractors:", contractors.length)
    console.log("Setting modal visible...")
    setSelectedVehicle(vehicle)
    setShowContractorSelection(true)
    console.log("Modal should now be visible")
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

            <ScrollView style={styles.contractorList} showsVerticalScrollIndicator={false}>
              {contractors.map((contractor) => (
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
        currentScreen="VehicleAssignment"
      />
    </SafeAreaView>
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
})

export default VehicleAssignmentScreen
