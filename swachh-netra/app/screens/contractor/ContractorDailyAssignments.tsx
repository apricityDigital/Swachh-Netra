import React, { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from "react-native"
import { Card, Text, Button, Chip, Modal, Portal, Searchbar, FAB } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { FIREBASE_AUTH } from "../../../FirebaseConfig"
import { ContractorService } from "../../../services/ContractorService"
import { FeederPointService, FeederPoint } from "../../../services/FeederPointService"
import { DailyAssignmentService } from "../../../services/DailyAssignmentService"
import FirebaseService from "../../../services/FirebaseService"

interface Driver {
  id: string
  fullName: string
  email: string
  phoneNumber?: string
  isActive: boolean
  assignedVehicleId?: string
}

interface DailyAssignment {
  id?: string
  driverId: string
  contractorId: string
  assignmentDate: string // YYYY-MM-DD format
  feederPointIds: string[]
  vehicleId?: string
  status: "active" | "completed" | "cancelled"
  createdAt: Date
  updatedAt: Date
}

interface ContractorDailyAssignmentsProps {
  navigation: any
  route: {
    params: {
      contractorId: string
    }
  }
}

const ContractorDailyAssignments = ({ navigation, route }: ContractorDailyAssignmentsProps) => {
  const { contractorId } = route.params
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  // Data states
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [feederPoints, setFeederPoints] = useState<FeederPoint[]>([])
  const [dailyAssignments, setDailyAssignments] = useState<DailyAssignment[]>([])
  
  // UI states
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [selectedFeederPoints, setSelectedFeederPoints] = useState<string[]>([])
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "assigned" | "unassigned">("all")

  useEffect(() => {
    fetchData()
  }, [contractorId, selectedDate])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log(`🔄 [ContractorDailyAssignments] Fetching data for contractor: ${contractorId}, date: ${selectedDate}`)

      // Fetch data with individual error handling
      console.log("📋 [ContractorDailyAssignments] Fetching drivers...")
      const driversData = await ContractorService.getContractorDrivers(contractorId)
      console.log(`✅ [ContractorDailyAssignments] Drivers loaded: ${driversData?.length || 0}`)

      console.log("📍 [ContractorDailyAssignments] Fetching feeder points...")
      const feederPointsData = await ContractorService.getContractorFeederPoints(contractorId)
      console.log(`✅ [ContractorDailyAssignments] Feeder points loaded: ${feederPointsData?.length || 0}`)

      console.log("📅 [ContractorDailyAssignments] Fetching daily assignments...")
      const assignmentsData = await DailyAssignmentService.getAssignmentsByDate(contractorId, selectedDate)
      console.log(`✅ [ContractorDailyAssignments] Assignments loaded: ${assignmentsData?.length || 0}`)

      setDrivers(driversData || [])
      setFeederPoints(feederPointsData || [])
      setDailyAssignments(assignmentsData || [])

      console.log(`🎯 [ContractorDailyAssignments] Final state:`, {
        drivers: driversData?.length || 0,
        feederPoints: feederPointsData?.length || 0,
        assignments: assignmentsData?.length || 0,
        contractorId,
        selectedDate
      })

      // Log assignment details for debugging
      if (assignmentsData && assignmentsData.length > 0) {
        console.log("📋 [ContractorDailyAssignments] Assignment details:")
        assignmentsData.forEach((assignment, index) => {
          console.log(`  ${index + 1}. Driver: ${assignment.driverId}, Routes: ${assignment.feederPointIds.length}, Status: ${assignment.status}`)
        })
      }

    } catch (error) {
      console.error("❌ [ContractorDailyAssignments] Error fetching data:", error)
      Alert.alert(
        "Error",
        `Failed to load assignment data: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again.`
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate)
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      currentDate.setDate(currentDate.getDate() + 1)
    }
    setSelectedDate(currentDate.toISOString().split('T')[0])
  }

  const getDriverAssignment = (driverId: string): DailyAssignment | undefined => {
    return dailyAssignments.find(assignment => assignment.driverId === driverId)
  }

  const getAssignedFeederPointsForDriver = (driverId: string): FeederPoint[] => {
    const assignment = getDriverAssignment(driverId)
    if (!assignment) return []
    
    return feederPoints.filter(fp => assignment.feederPointIds.includes(fp.id!))
  }

  const handleAssignDriver = (driver: Driver) => {
    const existingAssignment = getDriverAssignment(driver.id)
    setSelectedDriver(driver)
    setSelectedFeederPoints(existingAssignment?.feederPointIds || [])
    setAssignModalVisible(true)
  }

  const handleFeederPointToggle = (feederPointId: string) => {
    setSelectedFeederPoints(prev => {
      if (prev.includes(feederPointId)) {
        return prev.filter(id => id !== feederPointId)
      } else {
        return [...prev, feederPointId]
      }
    })
  }

  const handleSaveAssignment = async () => {
    if (!selectedDriver) {
      Alert.alert("Error", "No driver selected")
      return
    }

    if (selectedFeederPoints.length === 0) {
      Alert.alert("Error", "Please select at least one feeder point")
      return
    }

    try {
      setLoading(true)
      console.log("🔄 [ContractorDailyAssignments] Saving assignment:", {
        driverId: selectedDriver.id,
        driverName: selectedDriver.fullName,
        contractorId,
        date: selectedDate,
        feederPointsCount: selectedFeederPoints.length,
        feederPointIds: selectedFeederPoints
      })

      const assignmentId = await DailyAssignmentService.createOrUpdateAssignment({
        driverId: selectedDriver.id,
        contractorId,
        assignmentDate: selectedDate,
        feederPointIds: selectedFeederPoints,
        vehicleId: selectedDriver.assignedVehicleId,
        status: "active"
      })

      console.log("✅ [ContractorDailyAssignments] Assignment saved with ID:", assignmentId)

      Alert.alert(
        "Success",
        `Daily assignment saved successfully!\n\nDriver: ${selectedDriver.fullName}\nRoutes: ${selectedFeederPoints.length}\nDate: ${selectedDate}`,
        [
          {
            text: "OK",
            onPress: () => {
              setAssignModalVisible(false)
              fetchData()
            }
          }
        ]
      )
    } catch (error) {
      console.error("❌ [ContractorDailyAssignments] Error saving assignment:", error)
      Alert.alert(
        "Error",
        `Failed to save assignment: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again.`
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    const assignment = getDriverAssignment(driver.id)
    
    if (filterStatus === "assigned") {
      return matchesSearch && assignment && assignment.feederPointIds.length > 0
    } else if (filterStatus === "unassigned") {
      return matchesSearch && (!assignment || assignment.feederPointIds.length === 0)
    }
    return matchesSearch
  })

  const renderDriverCard = ({ item }: { item: Driver }) => {
    const assignment = getDriverAssignment(item.id)
    const assignedFeederPoints = getAssignedFeederPointsForDriver(item.id)
    const hasAssignment = assignment && assignment.feederPointIds.length > 0

    return (
      <Card style={styles.driverCard}>
        <View style={styles.driverContent}>
          <View style={styles.driverHeader}>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{item.fullName}</Text>
              <Text style={styles.driverEmail}>{item.email}</Text>
              {item.phoneNumber && (
                <Text style={styles.driverPhone}>📞 {item.phoneNumber}</Text>
              )}
            </View>
            <Chip
              style={[
                styles.assignmentChip,
                { backgroundColor: hasAssignment ? "#10b98120" : "#f59e0b20" }
              ]}
              textStyle={[
                styles.assignmentChipText,
                { color: hasAssignment ? "#10b981" : "#f59e0b" }
              ]}
              icon={hasAssignment ? "check-circle" : "schedule"}
            >
              {hasAssignment ? `${assignedFeederPoints.length} Points` : "Unassigned"}
            </Chip>
          </View>

          {hasAssignment && (
            <View style={styles.assignmentPreview}>
              <Text style={styles.previewTitle}>Today's Routes:</Text>
              <View style={styles.feederPointTags}>
                {assignedFeederPoints.slice(0, 3).map((fp, index) => (
                  <Chip key={fp.id} style={styles.feederPointTag} textStyle={styles.feederPointTagText}>
                    {fp.feederPointName}
                  </Chip>
                ))}
                {assignedFeederPoints.length > 3 && (
                  <Chip style={styles.moreTag} textStyle={styles.moreTagText}>
                    +{assignedFeederPoints.length - 3} more
                  </Chip>
                )}
              </View>
            </View>
          )}

          <View style={styles.driverActions}>
            <Button
              mode="contained"
              onPress={() => handleAssignDriver(item)}
              style={styles.assignButton}
              labelStyle={styles.assignButtonText}
            >
              {hasAssignment ? "Edit Assignment" : "Assign Routes"}
            </Button>
          </View>
        </View>
      </Card>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent={Platform.OS === "android"}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color="#111827"
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>Daily Assignments</Text>
          <TouchableOpacity
            onPress={() => {
              console.log("🐛 [DEBUG] Current state:", {
                contractorId,
                selectedDate,
                driversCount: drivers.length,
                feederPointsCount: feederPoints.length,
                assignmentsCount: dailyAssignments.length
              })
              Alert.alert(
                "Debug Info",
                `Contractor: ${contractorId}\nDate: ${selectedDate}\nDrivers: ${drivers.length}\nFeeder Points: ${feederPoints.length}\nAssignments: ${dailyAssignments.length}`,
                [
                  { text: "Refresh", onPress: fetchData },
                  { text: "OK" }
                ]
              )
            }}
            style={styles.debugButton}
          >
            <MaterialIcons name="bug-report" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity onPress={() => handleDateChange('prev')} style={styles.dateButton}>
          <MaterialIcons name="chevron-left" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.selectedDate}>
          {new Date(selectedDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
        <TouchableOpacity onPress={() => handleDateChange('next')} style={styles.dateButton}>
          <MaterialIcons name="chevron-right" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistics */}
        <View style={styles.statsContainer}>
          <Card style={styles.statsCard}>
            <View style={styles.statsContent}>
              <MaterialIcons name="people" size={32} color="#3b82f6" />
              <Text style={styles.statsNumber}>{drivers.length}</Text>
              <Text style={styles.statsLabel}>Total Drivers</Text>
            </View>
          </Card>

          <Card style={styles.statsCard}>
            <View style={styles.statsContent}>
              <MaterialIcons name="check-circle" size={32} color="#10b981" />
              <Text style={styles.statsNumber}>
                {dailyAssignments.filter(a => a.feederPointIds.length > 0).length}
              </Text>
              <Text style={styles.statsLabel}>Assigned</Text>
            </View>
          </Card>

          <Card style={styles.statsCard}>
            <View style={styles.statsContent}>
              <MaterialIcons name="location-on" size={32} color="#ef4444" />
              <Text style={styles.statsNumber}>
                {dailyAssignments.reduce((sum, a) => sum + a.feederPointIds.length, 0)}
              </Text>
              <Text style={styles.statsLabel}>Total Routes</Text>
            </View>
          </Card>
        </View>

        {/* Search and Filters */}
        <Searchbar
          placeholder="Search drivers..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterChips}>
              {["all", "assigned", "unassigned"].map((filter) => (
                <Chip
                  key={filter}
                  selected={filterStatus === filter}
                  onPress={() => setFilterStatus(filter as any)}
                  style={[
                    styles.filterChip,
                    filterStatus === filter && styles.filterChipSelected
                  ]}
                  textStyle={[
                    styles.filterChipText,
                    filterStatus === filter && styles.filterChipTextSelected
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Chip>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Drivers List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Drivers ({filteredDrivers.length})</Text>
          {filteredDrivers.length > 0 ? (
            <FlatList
              data={filteredDrivers}
              renderItem={renderDriverCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <MaterialIcons name="people" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No drivers found</Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery ? "Try adjusting your search" : "No drivers available for assignment"}
                </Text>
              </View>
            </Card>
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
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Assign Routes to {selectedDriver?.fullName}
              </Text>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Select feeder points for {new Date(selectedDate).toLocaleDateString()}
            </Text>

            {/* Selected Count */}
            <View style={styles.selectionSummary}>
              <MaterialIcons name="location-on" size={20} color="#3b82f6" />
              <Text style={styles.selectionText}>
                {selectedFeederPoints.length} routes selected
              </Text>
              {selectedFeederPoints.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSelectedFeederPoints([])}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Bulk Actions */}
            <View style={styles.bulkActions}>
              <Button
                mode="outlined"
                onPress={() => setSelectedFeederPoints(feederPoints.map(fp => fp.id!).filter(Boolean))}
                style={styles.bulkButton}
                labelStyle={styles.bulkButtonText}
              >
                Select All
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  // Select first 20 points for optimal daily load
                  const firstTwenty = feederPoints.slice(0, 20).map(fp => fp.id!).filter(Boolean)
                  setSelectedFeederPoints(firstTwenty)
                }}
                style={styles.bulkButton}
                labelStyle={styles.bulkButtonText}
              >
                Select 20
              </Button>
            </View>

            {/* Feeder Points List */}
            <View style={styles.feederPointsList}>
              {feederPoints.map((point) => {
                const isSelected = selectedFeederPoints.includes(point.id!)
                return (
                  <TouchableOpacity
                    key={point.id}
                    style={[
                      styles.feederPointItem,
                      isSelected && styles.selectedFeederPointItem
                    ]}
                    onPress={() => handleFeederPointToggle(point.id!)}
                  >
                    <View style={styles.feederPointItemContent}>
                      <View style={styles.feederPointItemInfo}>
                        <Text style={[
                          styles.feederPointItemName,
                          isSelected && styles.selectedFeederPointItemName
                        ]}>
                          {point.feederPointName}
                        </Text>
                        <Text style={styles.feederPointItemArea}>
                          {point.areaName}, Ward {point.wardNumber}
                        </Text>
                        <Text style={styles.feederPointItemLandmark}>
                          📍 {point.nearestLandmark}
                        </Text>
                        <Text style={styles.feederPointItemHouseholds}>
                          ~{point.approximateHouseholds} households
                        </Text>
                      </View>
                      <View style={styles.feederPointItemAction}>
                        {isSelected ? (
                          <MaterialIcons name="check-circle" size={24} color="#10b981" />
                        ) : (
                          <MaterialIcons name="radio-button-unchecked" size={24} color="#d1d5db" />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setAssignModalVisible(false)}
                style={styles.cancelButton}
                labelStyle={styles.cancelButtonText}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveAssignment}
                style={styles.saveButton}
                labelStyle={styles.saveButtonText}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Assignment"}
              </Button>
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
  header: {
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  debugButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  dateButton: {
    padding: 8,
  },
  selectedDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statsContent: {
    padding: 16,
    alignItems: "center",
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  statsLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  searchBar: {
    backgroundColor: "#ffffff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 16,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterChips: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    backgroundColor: "#ffffff",
    borderColor: "#d1d5db",
  },
  filterChipSelected: {
    backgroundColor: "#3b82f6",
  },
  filterChipText: {
    color: "#6b7280",
  },
  filterChipTextSelected: {
    color: "#ffffff",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  driverCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 12,
  },
  driverContent: {
    padding: 16,
  },
  driverHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  driverEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  driverPhone: {
    fontSize: 14,
    color: "#6b7280",
  },
  assignmentChip: {
    height: 32,
  },
  assignmentChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  assignmentPreview: {
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  feederPointTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  feederPointTag: {
    backgroundColor: "#dbeafe",
    height: 28,
  },
  feederPointTagText: {
    fontSize: 11,
    color: "#1e40af",
  },
  moreTag: {
    backgroundColor: "#f3f4f6",
    height: 28,
  },
  moreTagText: {
    fontSize: 11,
    color: "#6b7280",
  },
  driverActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  assignButton: {
    backgroundColor: "#3b82f6",
  },
  assignButtonText: {
    color: "#ffffff",
    fontSize: 14,
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
    padding: 32,
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
  modalContainer: {
    backgroundColor: "#ffffff",
    margin: 20,
    borderRadius: 16,
    maxHeight: "90%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  selectionSummary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
    flex: 1,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ef4444",
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
  },
  bulkActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  bulkButton: {
    flex: 1,
    borderColor: "#3b82f6",
  },
  bulkButtonText: {
    color: "#3b82f6",
    fontSize: 14,
  },
  feederPointsList: {
    marginBottom: 20,
  },
  feederPointItem: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  selectedFeederPointItem: {
    backgroundColor: "#dbeafe",
    borderColor: "#3b82f6",
  },
  feederPointItemContent: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },
  feederPointItemInfo: {
    flex: 1,
  },
  feederPointItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  selectedFeederPointItemName: {
    color: "#1e40af",
  },
  feederPointItemArea: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  feederPointItemLandmark: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 2,
  },
  feederPointItemHouseholds: {
    fontSize: 12,
    color: "#9ca3af",
  },
  feederPointItemAction: {
    marginLeft: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  cancelButton: {
    flex: 1,
    borderColor: "#6b7280",
  },
  cancelButtonText: {
    color: "#6b7280",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#3b82f6",
  },
  saveButtonText: {
    color: "#ffffff",
  },
})

export default ContractorDailyAssignments
