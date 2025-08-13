"use client"

import { useState } from "react"
import { View, StyleSheet, FlatList, RefreshControl } from "react-native"
import { Card, Text, Button, Searchbar, Chip, FAB, Avatar, Portal, Modal, TextInput } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"

interface Driver {
  id: string
  name: string
  employeeId: string
  status: "active" | "inactive" | "pending"
  assignedVehicle?: string
  assignedRoute?: string
  attendanceRate: number
  phone: string
  licenseNumber: string
  zone: string
  joiningDate: string
}

export default function DriversManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [newDriverModal, setNewDriverModal] = useState(false)
  const [newDriver, setNewDriver] = useState({
    name: "",
    phone: "",
    licenseNumber: "",
    zone: "",
  })

  const [drivers] = useState<Driver[]>([
    {
      id: "1",
      name: "Ramesh Kumar",
      employeeId: "D001",
      status: "active",
      assignedVehicle: "V-003",
      assignedRoute: "Route A-1",
      attendanceRate: 95,
      phone: "+91 9876543210",
      licenseNumber: "DL1420110012345",
      zone: "Zone A",
      joiningDate: "2023-06-15",
    },
    {
      id: "2",
      name: "Suresh Patel",
      employeeId: "D002",
      status: "active",
      assignedVehicle: "V-007",
      assignedRoute: "Route B-2",
      attendanceRate: 88,
      phone: "+91 9876543211",
      licenseNumber: "DL1420110012346",
      zone: "Zone B",
      joiningDate: "2023-08-20",
    },
    {
      id: "3",
      name: "Vikash Singh",
      employeeId: "D003",
      status: "pending",
      attendanceRate: 0,
      phone: "+91 9876543212",
      licenseNumber: "DL1420110012347",
      zone: "Zone A",
      joiningDate: "2024-01-10",
    },
  ])

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === "all" || driver.status === selectedFilter
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#4CAF50"
      case "inactive":
        return "#F44336"
      case "pending":
        return "#FF9800"
      default:
        return "#757575"
    }
  }

  const handleCreateDriver = () => {
    if (!newDriver.name || !newDriver.phone || !newDriver.licenseNumber) {
      return
    }

    console.log("Creating driver request:", newDriver)
    setNewDriver({ name: "", phone: "", licenseNumber: "", zone: "" })
    setNewDriverModal(false)
  }

  const renderDriver = ({ item }: { item: Driver }) => (
    <Card style={styles.driverCard}>
      <Card.Content>
        <View style={styles.driverHeader}>
          <View style={styles.driverInfo}>
            <Avatar.Text
              size={40}
              label={item.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
              style={{ backgroundColor: "#FF9800" }}
            />
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{item.name}</Text>
              <Text style={styles.driverId}>ID: {item.employeeId}</Text>
              <Text style={styles.driverZone}>{item.zone}</Text>
            </View>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={{ color: "#fff", fontSize: 12 }}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        {item.status === "active" && (
          <View style={styles.assignmentContainer}>
            {item.assignedVehicle && (
              <View style={styles.assignment}>
                <MaterialCommunityIcons name="truck" size={16} color="#2196F3" />
                <Text style={styles.assignmentText}>{item.assignedVehicle}</Text>
              </View>
            )}
            {item.assignedRoute && (
              <View style={styles.assignment}>
                <MaterialCommunityIcons name="map-marker-path" size={16} color="#4CAF50" />
                <Text style={styles.assignmentText}>{item.assignedRoute}</Text>
              </View>
            )}
            <View style={styles.assignment}>
              <MaterialCommunityIcons name="calendar-check" size={16} color="#FF9800" />
              <Text style={styles.assignmentText}>{item.attendanceRate}% Attendance</Text>
            </View>
          </View>
        )}

        <View style={styles.driverContact}>
          <MaterialCommunityIcons name="phone" size={16} color="#757575" />
          <Text style={styles.contactText}>{item.phone}</Text>
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            icon="eye"
            compact
            onPress={() => {
              setSelectedDriver(item)
              setModalVisible(true)
            }}
          >
            View Details
          </Button>
          <Button mode="text" icon="pencil" compact onPress={() => {}}>
            Edit Request
          </Button>
        </View>
      </Card.Content>
    </Card>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search drivers..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <View style={styles.filterContainer}>
          {["all", "active", "inactive", "pending"].map((filter) => (
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
        data={filteredDrivers}
        renderItem={renderDriver}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />

      <FAB icon="plus" style={styles.fab} onPress={() => setNewDriverModal(true)} label="Add Driver" />

      {/* Driver Details Modal */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
          {selectedDriver && (
            <View>
              <Text style={styles.modalTitle}>{selectedDriver.name}</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Employee ID:</Text>
                <Text style={styles.detailValue}>{selectedDriver.employeeId}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{selectedDriver.phone}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>License:</Text>
                <Text style={styles.detailValue}>{selectedDriver.licenseNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Zone:</Text>
                <Text style={styles.detailValue}>{selectedDriver.zone}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Joining Date:</Text>
                <Text style={styles.detailValue}>{new Date(selectedDriver.joiningDate).toLocaleDateString()}</Text>
              </View>
              {selectedDriver.assignedVehicle && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Assigned Vehicle:</Text>
                  <Text style={styles.detailValue}>{selectedDriver.assignedVehicle}</Text>
                </View>
              )}
              <Button mode="contained" onPress={() => setModalVisible(false)} style={styles.closeButton}>
                Close
              </Button>
            </View>
          )}
        </Modal>

        {/* New Driver Modal */}
        <Modal visible={newDriverModal} onDismiss={() => setNewDriverModal(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>Request New Driver</Text>
          <TextInput
            label="Full Name *"
            value={newDriver.name}
            onChangeText={(text) => setNewDriver({ ...newDriver, name: text })}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Phone Number *"
            value={newDriver.phone}
            onChangeText={(text) => setNewDriver({ ...newDriver, phone: text })}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
          />
          <TextInput
            label="License Number *"
            value={newDriver.licenseNumber}
            onChangeText={(text) => setNewDriver({ ...newDriver, licenseNumber: text })}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Zone"
            value={newDriver.zone}
            onChangeText={(text) => setNewDriver({ ...newDriver, zone: text })}
            style={styles.input}
            mode="outlined"
          />
          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setNewDriverModal(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreateDriver} style={styles.modalButton}>
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
  driverCard: {
    marginBottom: 12,
    elevation: 2,
  },
  driverHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  driverInfo: {
    flexDirection: "row",
    flex: 1,
  },
  driverDetails: {
    marginLeft: 12,
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  driverId: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  driverZone: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  statusChip: {
    height: 24,
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
  driverContact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
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
