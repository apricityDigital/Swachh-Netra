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
import { doc, getDoc } from "firebase/firestore"
import { FIRESTORE_DB } from "../../../FirebaseConfig"

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
  const { contractorId } = route.params || {}

  console.log("🔄 [DriverAssignment] Component initialized with contractorId:", contractorId)

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

  // Team Planning states - Simple 3-step flow
  const [viewMode, setViewMode] = useState<'individual' | 'planning'>('individual')
  const [planningStep, setPlanningStep] = useState<'routes' | 'vehicles' | 'drivers'>('routes')
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([])
  const [selectedVehiclesForTeam, setSelectedVehiclesForTeam] = useState<string[]>([])
  const [teamPlanModalVisible, setTeamPlanModalVisible] = useState(false)

  useEffect(() => {
    if (contractorId) {
      fetchData()
    } else {
      console.error("❌ [DriverAssignment] No contractorId provided")
      Alert.alert("Error", "Contractor ID is required", [
        { text: "Go Back", onPress: () => navigation.goBack() }
      ])
    }
  }, [contractorId])

  const fetchData = async () => {
    if (!contractorId) {
      console.error("❌ [DriverAssignment] Cannot fetch data without contractorId")
      setLoading(false)
      setRefreshing(false)
      return
    }

    setLoading(true)
    try {
      console.log("🔄 [DriverAssignment] Fetching data for contractor:", contractorId)

      const [driversData, vehiclesData, feederPointsData] = await Promise.all([
        ContractorService.getContractorDrivers(contractorId),
        ContractorService.getContractorVehicles(contractorId),
        ContractorService.getContractorFeederPoints(contractorId),
      ])

      console.log("✅ [DriverAssignment] Data fetched successfully:", {
        drivers: driversData.length,
        vehicles: vehiclesData.length,
        feederPoints: feederPointsData.length
      })

      setDrivers(driversData || [])
      setVehicles(vehiclesData || [])
      setFeederPoints(feederPointsData || [])
    } catch (error) {
      console.error("❌ [DriverAssignment] Error fetching data:", error)
      Alert.alert("Error", "Failed to load assignment data. Please try again.")
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
    setSelectedFeederPoints(prev => {
      const newSelection = prev.includes(feederPointId)
        ? prev.filter(id => id !== feederPointId)
        : [...prev, feederPointId]

      console.log("🔄 [DriverAssignment] Feeder point selection changed:", {
        feederPointId,
        wasSelected: prev.includes(feederPointId),
        newSelection,
        totalSelected: newSelection.length
      })

      return newSelection
    })
  }

  // Simple Team Planning functions
  const startTeamPlanning = () => {
    setViewMode('planning')
    setPlanningStep('routes')
    setSelectedRoutes([])
    setSelectedVehiclesForTeam([])
    setTeamPlanModalVisible(true)
  }

  const handleRouteSelection = (routeId: string) => {
    setSelectedRoutes(prev =>
      prev.includes(routeId)
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    )
  }

  const handleVehicleSelectionForTeam = (vehicleId: string) => {
    setSelectedVehiclesForTeam(prev =>
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    )
  }

  const goToNextStep = () => {
    if (planningStep === 'routes' && selectedRoutes.length > 0) {
      setPlanningStep('vehicles')
    } else if (planningStep === 'vehicles' && selectedVehiclesForTeam.length > 0) {
      setPlanningStep('drivers')
    }
  }

  const goToPreviousStep = () => {
    if (planningStep === 'vehicles') {
      setPlanningStep('routes')
    } else if (planningStep === 'drivers') {
      setPlanningStep('vehicles')
    }
  }

  const confirmAssignment = async () => {
    console.log("🔄 [DriverAssignment] confirmAssignment called with:", {
      selectedDriver: selectedDriver?.id,
      selectedVehicle: selectedVehicle?.id,
      selectedFeederPoints: selectedFeederPoints.length,
      contractorId
    })

    if (!selectedDriver || !selectedVehicle || selectedFeederPoints.length === 0) {
      console.log("❌ [DriverAssignment] Incomplete assignment:", {
        hasDriver: !!selectedDriver,
        hasVehicle: !!selectedVehicle,
        feederPointsCount: selectedFeederPoints.length
      })
      Alert.alert("Incomplete Assignment", "Please select a vehicle and at least one feeder point")
      return
    }

    if (!selectedDriver.id || !selectedVehicle.id) {
      console.log("❌ [DriverAssignment] Invalid selection - missing IDs")
      Alert.alert("Invalid Selection", "Selected driver or vehicle is missing required information")
      return
    }

    try {
      setLoading(true)
      console.log("🔄 [DriverAssignment] Starting assignment process:", {
        contractorId,
        vehicleId: selectedVehicle.id,
        driverId: selectedDriver.id,
        feederPointIds: selectedFeederPoints,
        feederPointsCount: selectedFeederPoints.length
      })

      // First, check if driver is already assigned to this contractor
      const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", selectedDriver.id))
      if (driverDoc.exists()) {
        const driverData = driverDoc.data()
        console.log("👤 [DriverAssignment] Current driver data:", {
          contractorId: driverData.contractorId,
          assignedVehicleId: driverData.assignedVehicleId,
          assignedFeederPointIds: driverData.assignedFeederPointIds
        })
      }

      await ContractorService.assignVehicleToDriver(
        contractorId,
        selectedVehicle.id,
        selectedDriver.id,
        selectedFeederPoints
      )

      console.log("✅ [DriverAssignment] Assignment completed successfully")

      // Verify the assignment was saved
      console.log("🔍 [DriverAssignment] Verifying assignment was saved...")
      setTimeout(async () => {
        try {
          const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", selectedDriver.id))
          if (driverDoc.exists()) {
            const driverData = driverDoc.data()
            console.log("📋 [DriverAssignment] Driver data after assignment:", {
              assignedVehicleId: driverData.assignedVehicleId,
              assignedFeederPointIds: driverData.assignedFeederPointIds,
              contractorId: driverData.contractorId
            })
          }
        } catch (error) {
          console.error("❌ [DriverAssignment] Error verifying assignment:", error)
        }
      }, 2000)
      Alert.alert("Success", "Driver assignment completed successfully", [
        {
          text: "OK",
          onPress: () => {
            setAssignModalVisible(false)
            setSelectedDriver(null)
            setSelectedVehicle(null)
            setSelectedFeederPoints([])
            fetchData()
          }
        }
      ])
    } catch (error) {
      console.error("❌ [DriverAssignment] Error assigning driver:", error)
      Alert.alert("Error", `Failed to assign driver: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAssignment = async (assignments: Array<{driverId: string, vehicleId: string, feederPointIds: string[]}>) => {
    try {
      setLoading(true)
      console.log("🔄 [DriverAssignment] Starting bulk assignment:", assignments.length, "assignments")

      for (const assignment of assignments) {
        await ContractorService.assignVehicleToDriver(
          contractorId,
          assignment.vehicleId,
          assignment.driverId,
          assignment.feederPointIds
        )
        console.log("✅ [DriverAssignment] Assigned driver:", assignment.driverId)
      }

      Alert.alert("Success", `Successfully assigned ${assignments.length} drivers`, [
        {
          text: "OK",
          onPress: () => {
            setBulkAssignModalVisible(false)
            setSelectedDrivers([])
            fetchData()
          }
        }
      ])
    } catch (error) {
      console.error("❌ [DriverAssignment] Error in bulk assignment:", error)
      Alert.alert("Error", "Failed to complete bulk assignment")
    } finally {
      setLoading(false)
    }
  }

  const filteredDrivers = drivers.filter(driver => {
    const fullName = driver.fullName || ""
    const email = driver.email || ""
    const query = searchQuery.toLowerCase()

    return fullName.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query)
  })

  const availableVehicles = vehicles.filter(v => !v.driverId || v.driverId === selectedDriver?.id)

  const renderDriverCard = ({ item }: { item: Driver }) => (
    <Card style={styles.driverCard}>
      <View style={styles.driverContent}>
        <View style={styles.driverHeader}>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{item.fullName || item.displayName || item.name || "Unknown Driver"}</Text>
            <Text style={styles.driverEmail}>{item.email || "No email"}</Text>
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
            <MaterialIcons name="person-add" size={20} color="#2563eb" />
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
        <MaterialIcons name="person-add" size={48} color="#2563eb" />
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
        {/* Simple Action Header */}
        <View style={styles.actionHeader}>
          <Text style={styles.pageTitle}>Driver Assignment</Text>
          <Button
            mode="contained"
            onPress={startTeamPlanning}
            style={styles.teamPlanButton}
            icon="route"
          >
            Plan Team Routes
          </Button>
        </View>

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
                  <Text style={styles.driverSummaryName}>{selectedDriver.fullName || selectedDriver.displayName || selectedDriver.name || "Unknown Driver"}</Text>
                  <Text style={styles.driverSummaryEmail}>{selectedDriver.email || "No email"}</Text>
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
                  onPress={() => {
                    console.log("🔘 [DriverAssignment] Assign button pressed:", {
                      hasVehicle: !!selectedVehicle,
                      vehicleId: selectedVehicle?.id,
                      feederPointsCount: selectedFeederPoints.length,
                      feederPointIds: selectedFeederPoints,
                      loading
                    })
                    confirmAssignment()
                  }}
                  style={styles.modalButton}
                  loading={loading}
                  disabled={!selectedVehicle || selectedFeederPoints.length === 0 || loading}
                >
                  {loading ? "Assigning..." : "Assign"}
                </Button>
              </View>
            </View>
          </ScrollView>
        </Modal>

        {/* Simple Team Planning Modal */}
        <Modal
          visible={teamPlanModalVisible}
          onDismiss={() => setTeamPlanModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <MaterialIcons name="route" size={24} color="#2563eb" />
                <Text style={styles.modalTitle}>Plan Team Routes</Text>
              </View>

              {/* Step Indicator */}
              <View style={styles.stepIndicator}>
                <View style={[styles.step, planningStep === 'routes' && styles.activeStep]}>
                  <Text style={[styles.stepNumber, planningStep === 'routes' && styles.activeStepText]}>1</Text>
                  <Text style={[styles.stepLabel, planningStep === 'routes' && styles.activeStepText]}>Routes</Text>
                </View>
                <View style={styles.stepConnector} />
                <View style={[styles.step, planningStep === 'vehicles' && styles.activeStep]}>
                  <Text style={[styles.stepNumber, planningStep === 'vehicles' && styles.activeStepText]}>2</Text>
                  <Text style={[styles.stepLabel, planningStep === 'vehicles' && styles.activeStepText]}>Vehicles</Text>
                </View>
                <View style={styles.stepConnector} />
                <View style={[styles.step, planningStep === 'drivers' && styles.activeStep]}>
                  <Text style={[styles.stepNumber, planningStep === 'drivers' && styles.activeStepText]}>3</Text>
                  <Text style={[styles.stepLabel, planningStep === 'drivers' && styles.activeStepText]}>Drivers</Text>
                </View>
              </View>

              {/* Step 1: Select Routes */}
              {planningStep === 'routes' && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Select Feeder Points (Routes)</Text>
                  <Text style={styles.stepDescription}>Choose the routes that need to be covered</Text>

                  {feederPoints.map((point) => (
                    <TouchableOpacity
                      key={point.id}
                      style={[
                        styles.selectionItem,
                        selectedRoutes.includes(point.id!) && styles.selectedItem
                      ]}
                      onPress={() => handleRouteSelection(point.id!)}
                    >
                      <View style={styles.feederPointInfo}>
                        <Text style={styles.feederPointName}>{point.feederPointName}</Text>
                        <Text style={styles.feederPointArea}>{point.areaName}</Text>
                      </View>
                      {selectedRoutes.includes(point.id!) && (
                        <MaterialIcons name="check-circle" size={24} color="#059669" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Step 2: Select Vehicles */}
              {planningStep === 'vehicles' && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Select Vehicles</Text>
                  <Text style={styles.stepDescription}>Choose vehicles for the selected routes</Text>

                  {vehicles.filter(v => !v.driverId).map((vehicle) => (
                    <TouchableOpacity
                      key={vehicle.id}
                      style={[
                        styles.selectionItem,
                        selectedVehiclesForTeam.includes(vehicle.id) && styles.selectedItem
                      ]}
                      onPress={() => handleVehicleSelectionForTeam(vehicle.id)}
                    >
                      <View style={styles.vehicleInfo}>
                        <Text style={styles.vehicleNumber}>{vehicle.vehicleNumber}</Text>
                        <Text style={styles.vehicleType}>{vehicle.type} - {vehicle.capacity}kg</Text>
                      </View>
                      {selectedVehiclesForTeam.includes(vehicle.id) && (
                        <MaterialIcons name="check-circle" size={24} color="#059669" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Step 3: Assign Drivers */}
              {planningStep === 'drivers' && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Assign Drivers</Text>
                  <Text style={styles.stepDescription}>
                    Routes: {selectedRoutes.length} | Vehicles: {selectedVehiclesForTeam.length}
                  </Text>

                  <View style={styles.assignmentSummary}>
                    <Text style={styles.summaryText}>
                      Ready to assign {Math.min(selectedRoutes.length, selectedVehiclesForTeam.length)} teams
                    </Text>
                  </View>

                  <Button
                    mode="contained"
                    onPress={() => {
                      // Create assignments
                      const availableDrivers = drivers.filter(d => !d.assignedVehicleId)
                      const numTeams = Math.min(selectedRoutes.length, selectedVehiclesForTeam.length, availableDrivers.length)

                      const assignments = []
                      for (let i = 0; i < numTeams; i++) {
                        assignments.push({
                          driverId: availableDrivers[i].id,
                          vehicleId: selectedVehiclesForTeam[i],
                          feederPointIds: [selectedRoutes[i]]
                        })
                      }

                      if (assignments.length > 0) {
                        handleBulkAssignment(assignments)
                      }
                    }}
                    style={styles.createTeamsButton}
                    disabled={selectedRoutes.length === 0 || selectedVehiclesForTeam.length === 0}
                  >
                    Create {Math.min(selectedRoutes.length, selectedVehiclesForTeam.length)} Teams
                  </Button>
                </View>
              )}

              {/* Navigation Buttons */}
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    if (planningStep === 'routes') {
                      setTeamPlanModalVisible(false)
                    } else {
                      goToPreviousStep()
                    }
                  }}
                  style={styles.modalButton}
                >
                  {planningStep === 'routes' ? 'Cancel' : 'Previous'}
                </Button>

                {planningStep !== 'drivers' && (
                  <Button
                    mode="contained"
                    onPress={goToNextStep}
                    style={styles.modalButton}
                    disabled={
                      (planningStep === 'routes' && selectedRoutes.length === 0) ||
                      (planningStep === 'vehicles' && selectedVehiclesForTeam.length === 0)
                    }
                  >
                    Next
                  </Button>
                )}
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
  // Simple Team Planning styles
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  teamPlanButton: {
    backgroundColor: '#2563eb',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  step: {
    alignItems: 'center',
    padding: 8,
  },
  activeStep: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 32,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activeStepText: {
    backgroundColor: '#2563eb',
    color: '#fff',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  stepConnector: {
    width: 40,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  stepContent: {
    marginVertical: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  assignmentSummary: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '500',
    textAlign: 'center',
  },
  createTeamsButton: {
    backgroundColor: '#059669',
  },
})

export default DriverAssignment
