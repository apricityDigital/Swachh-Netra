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
} from "react-native"
import { Card, Text, Chip, Searchbar } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { FIREBASE_AUTH } from "../../../FirebaseConfig"
import { VehicleService, Vehicle } from "../../../services/VehicleService"
import { ContractorService } from "../../../services/ContractorService"

interface ContractorVehicleManagementProps {
  navigation: any
  route: {
    params: {
      contractorId: string
    }
  }
}

const ContractorVehicleManagement = ({ navigation, route }: ContractorVehicleManagementProps) => {
  const { contractorId } = route.params
  console.log(`🚗 ContractorVehicleManagement loaded with contractorId: ${contractorId}`)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<"all" | "active" | "inactive">("all")

  useEffect(() => {
    fetchVehicles()
  }, [contractorId])

  useEffect(() => {
    filterVehicles()
  }, [vehicles, searchQuery, selectedFilter])

  const fetchVehicles = async () => {
    try {
      console.log(`🔄 Fetching vehicles for contractor: ${contractorId}`)
      setLoading(true)
      const contractorVehicles = await ContractorService.getContractorVehicles(contractorId)
      console.log(`✅ Received ${contractorVehicles.length} vehicles:`, contractorVehicles)
      setVehicles(contractorVehicles)
    } catch (error) {
      console.error("Error fetching contractor vehicles:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchVehicles()
    setRefreshing(false)
  }

  const filterVehicles = () => {
    let filtered = vehicles

    // Filter by status
    if (selectedFilter === "active") {
      filtered = filtered.filter(vehicle => vehicle.status === "active" && vehicle.isActive)
    } else if (selectedFilter === "inactive") {
      filtered = filtered.filter(vehicle => vehicle.status !== "active" || !vehicle.isActive)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(vehicle =>
        vehicle.vehicleNumber.toLowerCase().includes(query) ||
        (vehicle.vehicleName && vehicle.vehicleName.toLowerCase().includes(query)) ||
        vehicle.vehicleType.toLowerCase().includes(query)
      )
    }

    setFilteredVehicles(filtered)
  }

  const getStatusColor = (status: Vehicle["status"]) => {
    switch (status) {
      case "active": return "#10b981"
      case "maintenance": return "#f59e0b"
      case "inactive": return "#ef4444"
      default: return "#6b7280"
    }
  }

  const getStatusIcon = (status: Vehicle["status"]) => {
    switch (status) {
      case "active": return "check-circle"
      case "maintenance": return "build"
      case "inactive": return "cancel"
      default: return "help"
    }
  }

  const renderVehicleCard = ({ item }: { item: Vehicle }) => (
    <Card style={styles.vehicleCard}>
      <View style={styles.vehicleContent}>
        <View style={styles.vehicleHeader}>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleNumber}>{item.vehicleNumber}</Text>
            {item.vehicleName && <Text style={styles.vehicleName}>{item.vehicleName}</Text>}
            <Text style={styles.vehicleType}>{item.vehicleType}</Text>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: `${getStatusColor(item.status)}20` }]}
            textStyle={[styles.statusChipText, { color: getStatusColor(item.status) }]}
            icon={getStatusIcon(item.status)}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <View style={styles.vehicleDetails}>
          <View style={styles.detailItem}>
            <MaterialIcons name="local-shipping" size={16} color="#6b7280" />
            <Text style={styles.detailText}>Capacity: {item.capacity} tons</Text>
          </View>
          {item.manufacturer && (
            <View style={styles.detailItem}>
              <MaterialIcons name="business" size={16} color="#6b7280" />
              <Text style={styles.detailText}>
                {item.manufacturer} {item.model && `- ${item.model}`}
              </Text>
            </View>
          )}
          {item.fuelType && (
            <View style={styles.detailItem}>
              <MaterialIcons name="local-gas-station" size={16} color="#6b7280" />
              <Text style={styles.detailText}>Fuel: {item.fuelType.toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.detailItem}>
            <MaterialIcons name="calendar-today" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              Registered: {new Date(item.registrationDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  )

  const renderFilterChip = (filter: "all" | "active" | "inactive", label: string, count: number) => (
    <Chip
      key={filter}
      selected={selectedFilter === filter}
      onPress={() => setSelectedFilter(filter)}
      style={[
        styles.filterChip,
        selectedFilter === filter && styles.filterChipSelected
      ]}
      textStyle={[
        styles.filterChipText,
        selectedFilter === filter && styles.filterChipTextSelected
      ]}
    >
      {label} ({count})
    </Chip>
  )

  const activeVehicles = vehicles.filter(v => v.status === "active" && v.isActive)
  const inactiveVehicles = vehicles.filter(v => v.status !== "active" || !v.isActive)

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
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack()
              } else {
                navigation.navigate('ContractorDashboard')
              }
            }}
          />
          <Text style={styles.headerTitle}>My Vehicles</Text>
        </View>
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
              <MaterialIcons name="local-shipping" size={32} color="#3b82f6" />
              <Text style={styles.statsNumber}>{vehicles.length}</Text>
              <Text style={styles.statsLabel}>Total Vehicles</Text>
            </View>
          </Card>

          <Card style={styles.statsCard}>
            <View style={styles.statsContent}>
              <MaterialIcons name="check-circle" size={32} color="#10b981" />
              <Text style={styles.statsNumber}>{activeVehicles.length}</Text>
              <Text style={styles.statsLabel}>Active</Text>
            </View>
          </Card>

          <Card style={styles.statsCard}>
            <View style={styles.statsContent}>
              <MaterialIcons name="cancel" size={32} color="#ef4444" />
              <Text style={styles.statsNumber}>{inactiveVehicles.length}</Text>
              <Text style={styles.statsLabel}>Inactive</Text>
            </View>
          </Card>
        </View>

        {/* Search */}
        <Searchbar
          placeholder="Search vehicles..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          icon="magnify"
          clearIcon="close"
        />

        {/* Filter Chips */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterChips}>
              {renderFilterChip("all", "All", vehicles.length)}
              {renderFilterChip("active", "Active", activeVehicles.length)}
              {renderFilterChip("inactive", "Inactive", inactiveVehicles.length)}
            </View>
          </ScrollView>
        </View>

        {/* Vehicles List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedFilter === "all" ? "All Vehicles" : 
             selectedFilter === "active" ? "Active Vehicles" : "Inactive Vehicles"}
          </Text>

          {filteredVehicles.length > 0 ? (
            <FlatList
              data={filteredVehicles}
              renderItem={renderVehicleCard}
              keyExtractor={(item, index) => item.id || `vehicle-${item.vehicleNumber}-${index}`}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <MaterialIcons name="local-shipping" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>
                  {searchQuery ? "No vehicles found" : "No vehicles assigned"}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery ? "Try adjusting your search" : "Contact admin for vehicle assignments"}
                </Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
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
  vehicleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 12,
  },
  vehicleContent: {
    padding: 16,
  },
  vehicleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  vehicleType: {
    fontSize: 14,
    color: "#6b7280",
  },
  statusChip: {
    height: 32,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  vehicleDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
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
})

export default ContractorVehicleManagement
