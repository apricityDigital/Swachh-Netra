"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Card, Title, Text, Button, List, Chip, FAB, Portal, Modal } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"

interface Driver {
  id: string
  name: string
  employeeId: string
  status: "assigned" | "unassigned"
  currentRoute?: string
  vehicle?: string
}

interface Route {
  id: string
  name: string
  feederPoints: string[]
  zone: string
  estimatedTime: string
  assignedDriver?: string
  assignedVehicle?: string
  shifts: ("morning" | "afternoon" | "evening")[]
  status: "active" | "inactive"
}

export default function RouteAssignment() {
  const [drivers] = useState<Driver[]>([
    {
      id: "1",
      name: "Ramesh Kumar",
      employeeId: "D001",
      status: "assigned",
      currentRoute: "Route A-1",
      vehicle: "V-003",
    },
    {
      id: "2",
      name: "Suresh Patel",
      employeeId: "D002",
      status: "assigned",
      currentRoute: "Route B-2",
      vehicle: "V-007",
    },
    { id: "3", name: "Vikash Singh", employeeId: "D003", status: "unassigned" },
    { id: "4", name: "Mohan Lal", employeeId: "D004", status: "unassigned" },
  ])

  const [routes] = useState<Route[]>([
    {
      id: "1",
      name: "Route A-1",
      feederPoints: ["FP-A12", "FP-A15", "FP-A18"],
      zone: "Zone A",
      estimatedTime: "4 hours",
      assignedDriver: "Ramesh Kumar",
      assignedVehicle: "V-003",
      shifts: ["morning", "evening"],
      status: "active",
    },
    {
      id: "2",
      name: "Route B-2",
      feederPoints: ["FP-B08", "FP-B11", "FP-B14"],
      zone: "Zone B",
      estimatedTime: "3.5 hours",
      assignedDriver: "Suresh Patel",
      assignedVehicle: "V-007",
      shifts: ["morning", "afternoon"],
      status: "active",
    },
    {
      id: "3",
      name: "Route C-3",
      feederPoints: ["FP-C15", "FP-C18", "FP-C21", "FP-C24"],
      zone: "Zone C",
      estimatedTime: "5 hours",
      shifts: ["morning"],
      status: "inactive",
    },
  ])

  const [modalVisible, setModalVisible] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<string>("")
  const [selectedVehicle, setSelectedVehicle] = useState<string>("")

  const unassignedDrivers = drivers.filter((driver) => driver.status === "unassigned")
  const availableVehicles = ["V-012", "V-015", "V-018"] // Mock available vehicles

  const handleAssignment = () => {
    if (!selectedDriver || !selectedRoute) {
      Alert.alert("Error", "Please select both driver and route")
      return
    }

    Alert.alert("Success", `Driver assigned to ${selectedRoute.name}`)
    setModalVisible(false)
    setSelectedDriver("")
    setSelectedVehicle("")
    setSelectedRoute(null)
  }

  const openAssignmentModal = (route: Route) => {
    setSelectedRoute(route)
    setModalVisible(true)
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Assignment Summary</Title>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{drivers.filter((d) => d.status === "assigned").length}</Text>
                <Text style={styles.summaryLabel}>Assigned Drivers</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{unassignedDrivers.length}</Text>
                <Text style={styles.summaryLabel}>Unassigned Drivers</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{routes.filter((r) => r.status === "active").length}</Text>
                <Text style={styles.summaryLabel}>Active Routes</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Unassigned Drivers</Title>
            {unassignedDrivers.length === 0 ? (
              <Text style={styles.emptyText}>All drivers are assigned</Text>
            ) : (
              unassignedDrivers.map((driver) => (
                <List.Item
                  key={driver.id}
                  title={driver.name}
                  description={`ID: ${driver.employeeId}`}
                  left={(props) => (
                    <MaterialCommunityIcons {...props} name="account-hard-hat" size={24} color="#FF9800" />
                  )}
                  right={(props) => (
                    <Chip {...props} icon="plus" onPress={() => {}}>
                      Assign
                    </Chip>
                  )}
                  style={styles.listItem}
                />
              ))
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Routes</Title>
            {routes.map((route) => (
              <Card key={route.id} style={styles.routeCard}>
                <Card.Content>
                  <View style={styles.routeHeader}>
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeName}>{route.name}</Text>
                      <Text style={styles.routeZone}>{route.zone}</Text>
                      <Text style={styles.routeTime}>⏱️ {route.estimatedTime}</Text>
                    </View>
                    <Chip
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor: route.status === "active" ? "#4CAF50" : "#F44336",
                        },
                      ]}
                      textStyle={{ color: "#fff", fontSize: 12 }}
                    >
                      {route.status.toUpperCase()}
                    </Chip>
                  </View>

                  <View style={styles.feederPoints}>
                    <Text style={styles.feederTitle}>Feeder Points:</Text>
                    <View style={styles.feederChips}>
                      {route.feederPoints.map((point) => (
                        <Chip key={point} style={styles.feederChip}>
                          {point}
                        </Chip>
                      ))}
                    </View>
                  </View>

                  <View style={styles.shiftsContainer}>
                    <Text style={styles.shiftsTitle}>Shifts:</Text>
                    <View style={styles.shifts}>
                      {["morning", "afternoon", "evening"].map((shift) => (
                        <Chip
                          key={shift}
                          style={[
                            styles.shiftChip,
                            {
                              backgroundColor: route.shifts.includes(shift as any) ? "#E3F2FD" : "#F5F5F5",
                            },
                          ]}
                        >
                          {shift.charAt(0).toUpperCase() + shift.slice(1)}
                        </Chip>
                      ))}
                    </View>
                  </View>

                  {route.assignedDriver && (
                    <View style={styles.assignmentInfo}>
                      <View style={styles.assignmentItem}>
                        <MaterialCommunityIcons name="account-hard-hat" size={16} color="#4CAF50" />
                        <Text style={styles.assignmentText}>Driver: {route.assignedDriver}</Text>
                      </View>
                      {route.assignedVehicle && (
                        <View style={styles.assignmentItem}>
                          <MaterialCommunityIcons name="truck" size={16} color="#2196F3" />
                          <Text style={styles.assignmentText}>Vehicle: {route.assignedVehicle}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  <Button mode="outlined" icon="account-plus" onPress={() => openAssignmentModal(route)} compact>
                    {route.assignedDriver ? "Reassign" : "Assign Driver"}
                  </Button>
                </Card.Content>
              </Card>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={() => {}} label="New Route" />

      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
          <Title style={styles.modalTitle}>Assign Driver to {selectedRoute?.name}</Title>

          <Text style={styles.sectionTitle}>Select Driver</Text>
          {unassignedDrivers.map((driver) => (
            <List.Item
              key={driver.id}
              title={driver.name}
              description={driver.employeeId}
              onPress={() => setSelectedDriver(driver.id)}
              left={(props) => (
                <MaterialCommunityIcons
                  {...props}
                  name={selectedDriver === driver.id ? "radiobox-marked" : "radiobox-blank"}
                  size={24}
                  color="#FF9800"
                />
              )}
            />
          ))}

          <Text style={styles.sectionTitle}>Select Vehicle (Optional)</Text>
          {availableVehicles.map((vehicle) => (
            <List.Item
              key={vehicle}
              title={vehicle}
              description="Available"
              onPress={() => setSelectedVehicle(vehicle)}
              left={(props) => (
                <MaterialCommunityIcons
                  {...props}
                  name={selectedVehicle === vehicle ? "radiobox-marked" : "radiobox-blank"}
                  size={24}
                  color="#2196F3"
                />
              )}
            />
          ))}

          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleAssignment} style={styles.modalButton}>
              Assign
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
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    marginBottom: 16,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF9800",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  emptyText: {
    textAlign: "center",
    color: "#757575",
    fontStyle: "italic",
    paddingVertical: 16,
  },
  listItem: {
    backgroundColor: "#f8f9fa",
    marginBottom: 8,
    borderRadius: 8,
  },
  routeCard: {
    marginBottom: 12,
    backgroundColor: "#f8f9fa",
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  routeZone: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 2,
  },
  routeTime: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  statusChip: {
    height: 24,
  },
  feederPoints: {
    marginBottom: 12,
  },
  feederTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  feederChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  feederChip: {
    backgroundColor: "#E8F5E8",
    height: 24,
  },
  shiftsContainer: {
    marginBottom: 12,
  },
  shiftsTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  shifts: {
    flexDirection: "row",
    gap: 8,
  },
  shiftChip: {
    height: 28,
  },
  assignmentInfo: {
    marginBottom: 12,
    gap: 4,
  },
  assignmentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  assignmentText: {
    fontSize: 12,
    color: "#757575",
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
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    color: "#333",
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
