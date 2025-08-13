"use client"

import { useState } from "react"
import { View, StyleSheet, FlatList, RefreshControl } from "react-native"
import { Card, Text, Button, Searchbar, Chip, FAB, Portal, Modal, TextInput } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"

interface Vehicle {
  id: string
  vehicleNumber: string
  type: "truck" | "van" | "pickup"
  status: "active" | "maintenance" | "inactive"
  assignedDriver?: string
  assignedRoute?: string
  fuelLevel: number
  lastMaintenance: string
  nextMaintenance: string
  capacity: string
  registrationDate: string
}

export default function VehiclesManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [newVehicleModal, setNewVehicleModal] = useState(false)
  const [newVehicle, setNewVehicle] = useState({
    vehicleNumber: "",
    type: "truck" as "truck" | "van" | "pickup",
    capacity: "",
  })

  const [vehicles] = useState<Vehicle[]>([
    {
      id: "1",
      vehicleNumber: "V-003",
      type: "truck",
      status: "active",
      assignedDriver: "Ramesh Kumar",
      assignedRoute: "Route A-1",
      fuelLevel: 75,
      lastMaintenance: "2024-01-01",
      nextMaintenance: "2024-04-01",
      capacity: "5 tons",
      registrationDate: "2022-03-15",
    },
    {
      id: "2",
      vehicleNumber: "V-007",
      type: "van",
      status: "active",
      assignedDriver: "Suresh Patel",
      assignedRoute: "Route B-2",
      fuelLevel: 60,
      lastMaintenance: "2023-12-15",
      nextMaintenance: "2024-03-15",
      capacity: "3 tons",
      registrationDate: "2021-08-20",
    },
    {
      id: "3",
      vehicleNumber: "V-012",
      type: "pickup",
      status: "maintenance",
      fuelLevel: 30,
      lastMaintenance: "2024-01-10",
      nextMaintenance: "2024-04-10",
      capacity: "1.5 tons",
      registrationDate: "2023-06-10",
    },
  ])

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === "all" || vehicle.status === selectedFilter
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#4CAF50"
      case "maintenance":
        return "#FF9800"
      case "inactive":
        return "#F44336"
      default:
        return "#757575"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "truck":
        return "truck"
      case "van":
        return "van-utility"
      case "pickup":
        return "truck-outline"
      default:
        return "car"
    }
  }

  const getFuelColor = (level: number) => {
    if (level > 50) return "#4CAF50"
    if (level > 25) return "#FF9800"
    return "#F44336"
  }

  const handleCreateVehicle = () => {
    if (!newVehicle.vehicleNumber || !newVehicle.capacity) {
      return
    }

    console.log("Creating vehicle request:", newVehicle)
    setNewVehicle({ vehicleNumber: "", type: "truck", capacity: "" })
    setNewVehicleModal(false)
  }

  const renderVehicle = ({ item }: { item: Vehicle }) => (
    <Card style={styles.vehicleCard}>
      <Card.Content>
        <View style={styles.vehicleHeader}>
          <View style={styles.vehicleInfo}>
            <View style={styles.vehicleIcon}>
              <MaterialCommunityIcons name={getTypeIcon(item.type)} size={32} color="#FF9800" />
            </View>
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleNumber}>{item.vehicleNumber}</Text>
              <Text style={styles.vehicleType}>{item.type.toUpperCase()}</Text>
              <Text style={styles.vehicleCapacity}>{item.capacity}</Text>
            </View>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={{ color: "#fff", fontSize: 12 }}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <View style={styles.metricsContainer}>
          <View style={styles.metric}>
            <MaterialCommunityIcons name="fuel" size={20} color={getFuelColor(item.fuelLevel)} />
            <Text style={styles.metricLabel}>Fuel</Text>
            <Text style={[styles.metricValue, { color: getFuelColor(item.fuelLevel) }]}>{item.fuelLevel}%</Text>
          </View>
          <View style={styles.metric}>
            <MaterialCommunityIcons name="wrench" size={20} color="#2196F3" />
            <Text style={styles.metricLabel}>Next Service</Text>
            <Text style={styles.metricValue}>{new Date(item.nextMaintenance).toLocaleDateString()}</Text>
          </View>
        </View>

        {item.status === "active" && (
          <View style={styles.assignmentContainer}>
            {item.assignedDriver && (
              <View style={styles.assignment}>
                <MaterialCommunityIcons name="account-hard-hat" size={16} color="#4CAF50" />
                <Text style={styles.assignmentText}>{item.assignedDriver}</Text>
              </View>
            )}
            {item.assignedRoute && (
              <View style={styles.assignment}>
                <MaterialCommunityIcons name="map-marker-path" size={16} color="#2196F3" />
                <Text style={styles.assignmentText}>{item.assignedRoute}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            icon="eye"
            compact
            onPress={() => {
              setSelectedVehicle(item)
              setModalVisible(true)
            }}
          >
            View Details
          </Button>
          <Button mode="text" icon="wrench" compact onPress={() => {}}>
            Maintenance
          </Button>
        </View>
      </Card.Content>
    </Card>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search vehicles..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <View style={styles.filterContainer}>
          {["all", "active", "maintenance", "inactive"].map((filter) => (
            <Chip
              key={filter}
              selected={selectedFilter === filter}
              onPress={() => setSelectedFilter(filter)}
              style={styles.filterChip}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Chip>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredVehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />

      <FAB icon="plus" style={styles.fab} onPress={() => setNewVehicleModal(true)} label="Add Vehicle" />

      {/* Vehicle Details Modal */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
          {selectedVehicle && (
            <View>
              <Text style={styles.modalTitle}>{selectedVehicle.vehicleNumber}</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>{selectedVehicle.type.toUpperCase()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Capacity:</Text>
                <Text style={styles.detailValue}>{selectedVehicle.capacity}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={[styles.detailValue, { color: getStatusColor(selectedVehicle.status) }]}>
                  {selectedVehicle.status.toUpperCase()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fuel Level:</Text>
                <Text style={[styles.detailValue, { color: getFuelColor(selectedVehicle.fuelLevel) }]}>
                  {selectedVehicle.fuelLevel}%
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Registration:</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedVehicle.registrationDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Maintenance:</Text>
                <Text style={styles.detailValue}>{new Date(selectedVehicle.lastMaintenance).toLocaleDateString()}</Text>
              </View>
              {selectedVehicle.assignedDriver && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Assigned Driver:</Text>
                  <Text style={styles.detailValue}>{selectedVehicle.assignedDriver}</Text>
                </View>
              )}
              <Button mode="contained" onPress={() => setModalVisible(false)} style={styles.closeButton}>
                Close
              </Button>
            </View>
          )}
        </Modal>

        {/* New Vehicle Modal */}
        <Modal
          visible={newVehicleModal}
          onDismiss={() => setNewVehicleModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Request New Vehicle</Text>
          <TextInput
            label="Vehicle Number *"
            value={newVehicle.vehicleNumber}
            onChangeText={(text) => setNewVehicle({ ...newVehicle, vehicleNumber: text })}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., V-015"
          />
          <Text style={styles.sectionTitle}>Vehicle Type</Text>
          <View style={styles.typeSelection}>
            {["truck", "van", "pickup"].map((type) => (
              <Chip
                key={type}
                selected={newVehicle.type === type}
                onPress={() => setNewVehicle({ ...newVehicle, type: type as any })}
                style={styles.typeChip}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Chip>
            ))}
          </View>
          <TextInput
            label="Capacity *"
            value={newVehicle.capacity}
            onChangeText={(text) => setNewVehicle({ ...newVehicle, capacity: text })}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., 5 tons"
          />
          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setNewVehicleModal(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreateVehicle} style={styles.modalButton}>
              Submit Request
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    elevation: 2,
  },
  searchbar: {
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#FFF3E0",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  vehicleCard: {
    marginBottom: 12,
    elevation: 2,
  },
  vehicleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  vehicleInfo: {
    flexDirection: "row",
    flex: 1,
  },
  vehicleIcon: {
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleNumber: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  vehicleType: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  vehicleCapacity: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  statusChip: {
    height: 24,
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  metric: {
    alignItems: "center",
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: "#757575",
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  assignmentContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  assignment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  assignmentText: {
    fontSize: 12,
    color: "#757575",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#FF9800",
  },
  modal: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  detailValue: {
    fontSize: 14,
    color: "#757575",
  },
  closeButton: {
    marginTop: 16,
  },
  input: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  typeSelection: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    backgroundColor: "#FFF3E0",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
  },
})
