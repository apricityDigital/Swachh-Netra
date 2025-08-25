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
import { ContractorService } from "../../../services/ContractorService"
import { FeederPointService, FeederPoint } from "../../../services/FeederPointService"
import FirebaseService from "../../../services/FirebaseService"

interface Driver {
  id: string
  fullName: string
  email: string
  phoneNumber?: string
  isActive: boolean
  assignedVehicleId?: string
  assignedFeederPointIds?: string[]
}

interface Vehicle {
  id: string
  vehicleNumber: string
  type: string
  capacity: number
  status: string
  driverId?: string
}

const DriverAssignment = ({ route, navigation }: any) => {
  const { contractorId } = route.params
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [feederPoints, setFeederPoints] = useState<FeederPoint[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  
  // Modal states
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedFeederPoints, setSelectedFeederPoints] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [driversData, vehiclesData, feederPointsData] = await Promise.all([
        ContractorService.getContractorDrivers(contractorId),
        ContractorService.getContractorVehicles(contractorId),
        ContractorService.getContractorFeederPoints(contractorId),
      ])
      
      setDrivers(driversData)
      setVehicles(vehiclesData)
      setFeederPoints(feederPointsData)
    } catch (error) {
      console.error("Error fetching data:", error)
      Alert.alert("Error", "Failed to load assignment data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleAssignDriver = (driver: Driver) => {
    setSelectedDriver(driver)
    setSelectedVehicle(null)
    setSelectedFeederPoints(driver.assignedFeederPointIds || [])
    setAssignModalVisible(true)
  }

  const handleVehicleSelection = (vehicle: Vehicle) => {
    if (vehicle.driverId && vehicle.driverId !== selectedDriver?.id) {
      Alert.alert("Vehicle Unavailable", "This vehicle is already assigned to another driver")
      return
    }
    setSelectedVehicle(vehicle)
  }

  const handleFeederPointToggle = (feederPointId: string) => {
    setSelectedFeederPoints(prev => 
      prev.includes(feederPointId)
        ? prev.filter(id => id !== feederPointId)
        : [...prev, feederPointId]
    )
  }

  const confirmAssignment = async () => {
    if (!selectedDriver || !selectedVehicle || selectedFeederPoints.length === 0) {
      Alert.alert("Incomplete Assignment", "Please select a vehicle and at least one feeder point")
      return
    }

    try {
      setLoading(true)
      await ContractorService.assignVehicleToDriver(
        contractorId,
        selectedVehicle.id,
        selectedDriver.id,
        selectedFeederPoints
      )
      
      Alert.alert("Success", "Driver assignment completed successfully")
      setAssignModalVisible(false)
      fetchData()
    } catch (error) {
      console.error("Error assigning driver:", error)
      Alert.alert("Error", "Failed to assign driver. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const filteredDrivers = drivers.filter(driver =>
    driver.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const availableVehicles = vehicles.filter(v => !v.driverId || v.driverId === selectedDriver?.id)

  const renderDriverCard = ({ item }: { item: Driver }) => (
    <Card style={styles.driverCard}>
      <View style={styles.driverContent}>
        <View style={styles.driverHeader}>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{item.fullName}</Text>
            <Text style={styles.driverEmail}>{item.email}</Text>
            {item.phoneNumber && (
              <Text style={styles.driverPhone}>{item.phoneNumber}</Text>
            )}
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
            <MaterialIcons name="local-shipping" size={16} color="#6b7280" />
            <Text style={styles.assignmentText}>
              Vehicle: {item.assignedVehicleId ? 
                vehicles.find(v => v.id === item.assignedVehicleId)?.vehicleNumber || "Unknown" 
                : "Not assigned"}
            </Text>
          </View>
          <View style={styles.assignmentRow}>
            <MaterialIcons name="location-on" size={16} color="#6b7280" />
            <Text style={styles.assignmentText}>
              Feeder Points: {item.assignedFeederPointIds?.length || 0}
            </Text>
          </View>
        </View>

        <View style={styles.driverActions}>
          <TouchableOpacity
            style={styles.assignButton}
            onPress={() => handleAssignDriver(item)}
          >
            <MaterialIcons name="assignment-ind" size={20} color="#2563eb" />
            <Text style={styles.assignButtonText}>
              {item.assignedVehicleId ? "Reassign" : "Assign"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  )

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="assignment-ind" size={48} color="#2563eb" />
        <Text style={styles.loadingText}>Loading Driver Assignments...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Driver Assignment</Text>
          <Text style={styles.headerSubtitle}>Assign vehicles and routes to drivers</Text>
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
            placeholder="Search drivers..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{drivers.length}</Text>
            <Text style={styles.statLabel}>Total Drivers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{drivers.filter(d => d.assignedVehicleId).length}</Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{vehicles.filter(v => !v.driverId).length}</Text>
            <Text style={styles.statLabel}>Available Vehicles</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{feederPoints.length}</Text>
            <Text style={styles.statLabel}>Feeder Points</Text>
          </View>
        </View>

        {/* Drivers List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Drivers</Text>
          {filteredDrivers.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="people-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyStateText}>No drivers found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredDrivers}
              renderItem={renderDriverCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
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
                <MaterialIcons name="assignment-ind" size={24} color="#2563eb" />
                <Text style={styles.modalTitle}>Assign Driver</Text>
              </View>

              {selectedDriver && (
                <View style={styles.driverSummary}>
                  <Text style={styles.driverSummaryName}>{selectedDriver.fullName}</Text>
                  <Text style={styles.driverSummaryEmail}>{selectedDriver.email}</Text>
                </View>
              )}

              {/* Vehicle Selection */}
              <View style={styles.selectionSection}>
                <Text style={styles.selectionTitle}>Select Vehicle</Text>
                {availableVehicles.map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={[
                      styles.selectionItem,
                      selectedVehicle?.id === vehicle.id && styles.selectedItem
                    ]}
                    onPress={() => handleVehicleSelection(vehicle)}
                  >
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehicleNumber}>{vehicle.vehicleNumber}</Text>
                      <Text style={styles.vehicleType}>{vehicle.type} - {vehicle.capacity}kg</Text>
                    </View>
                    {selectedVehicle?.id === vehicle.id && (
                      <MaterialIcons name="check-circle" size={24} color="#059669" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Feeder Points Selection */}
              <View style={styles.selectionSection}>
                <Text style={styles.selectionTitle}>Select Feeder Points</Text>
                {feederPoints.map((point) => (
                  <TouchableOpacity
                    key={point.id}
                    style={[
                      styles.selectionItem,
                      selectedFeederPoints.includes(point.id!) && styles.selectedItem
                    ]}
                    onPress={() => handleFeederPointToggle(point.id!)}
                  >
                    <View style={styles.feederPointInfo}>
                      <Text style={styles.feederPointName}>{point.feederPointName}</Text>
                      <Text style={styles.feederPointArea}>{point.areaName}</Text>
                    </View>
                    {selectedFeederPoints.includes(point.id!) && (
                      <MaterialIcons name="check-circle" size={24} color="#059669" />
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
                  onPress={confirmAssignment}
                  style={styles.modalButton}
                  loading={loading}
                  disabled={!selectedVehicle || selectedFeederPoints.length === 0}
                >
                  Assign
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
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitleContainer: {
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    backgroundColor: "#ffffff",
    elevation: 2,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  driverCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
  },
  driverContent: {
    padding: 16,
  },
  driverHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  driverEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  driverPhone: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  assignmentInfo: {
    marginBottom: 16,
  },
  assignmentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  assignmentText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
  },
  driverActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  assignButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  assignButtonText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9ca3af",
    marginTop: 16,
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginVertical: 40,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 12,
  },
  driverSummary: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  driverSummaryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  driverSummaryEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  selectionSection: {
    marginBottom: 20,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  selectionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedItem: {
    borderColor: "#059669",
    backgroundColor: "#f0fdf4",
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  vehicleType: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  feederPointInfo: {
    flex: 1,
  },
  feederPointName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  feederPointArea: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
})

export default DriverAssignment
