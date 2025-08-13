"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Card, Title, Text, Button, List, Chip, FAB, Portal, Modal } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"

interface Worker {
  id: string
  name: string
  employeeId: string
  status: "assigned" | "unassigned"
  currentFeederPoint?: string
}

interface FeederPoint {
  id: string
  name: string
  location: string
  zone: string
  ward: string
  assignedWorkers: string[]
  shifts: ("morning" | "evening")[]
}

export default function FeederAssignment() {
  const [workers] = useState<Worker[]>([
    { id: "1", name: "Rajesh Kumar", employeeId: "SW001", status: "assigned", currentFeederPoint: "FP-A12" },
    { id: "2", name: "Priya Sharma", employeeId: "SW002", status: "assigned", currentFeederPoint: "FP-B08" },
    { id: "3", name: "Amit Singh", employeeId: "SW003", status: "unassigned" },
    { id: "4", name: "Sunita Devi", employeeId: "SW004", status: "unassigned" },
  ])

  const [feederPoints] = useState<FeederPoint[]>([
    {
      id: "1",
      name: "FP-A12",
      location: "Main Market Area",
      zone: "Zone A",
      ward: "Ward 1",
      assignedWorkers: ["1"],
      shifts: ["morning", "evening"],
    },
    {
      id: "2",
      name: "FP-B08",
      location: "Residential Complex",
      zone: "Zone B",
      ward: "Ward 2",
      assignedWorkers: ["2"],
      shifts: ["morning"],
    },
    {
      id: "3",
      name: "FP-C15",
      location: "Commercial Street",
      zone: "Zone C",
      ward: "Ward 3",
      assignedWorkers: [],
      shifts: [],
    },
  ])

  const [modalVisible, setModalVisible] = useState(false)
  const [selectedFeederPoint, setSelectedFeederPoint] = useState<FeederPoint | null>(null)
  const [selectedWorker, setSelectedWorker] = useState<string>("")
  const [selectedShift, setSelectedShift] = useState<"morning" | "evening">("morning")

  const unassignedWorkers = workers.filter((worker) => worker.status === "unassigned")

  const handleAssignment = () => {
    if (!selectedWorker || !selectedFeederPoint) {
      Alert.alert("Error", "Please select both worker and feeder point")
      return
    }

    Alert.alert("Success", `Worker assigned to ${selectedFeederPoint.name} for ${selectedShift} shift`)
    setModalVisible(false)
    setSelectedWorker("")
    setSelectedFeederPoint(null)
  }

  const openAssignmentModal = (feederPoint: FeederPoint) => {
    setSelectedFeederPoint(feederPoint)
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
                <Text style={styles.summaryNumber}>{workers.filter((w) => w.status === "assigned").length}</Text>
                <Text style={styles.summaryLabel}>Assigned Workers</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{unassignedWorkers.length}</Text>
                <Text style={styles.summaryLabel}>Unassigned Workers</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>
                  {feederPoints.filter((fp) => fp.assignedWorkers.length > 0).length}
                </Text>
                <Text style={styles.summaryLabel}>Active Points</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Unassigned Workers</Title>
            {unassignedWorkers.length === 0 ? (
              <Text style={styles.emptyText}>All workers are assigned</Text>
            ) : (
              unassignedWorkers.map((worker) => (
                <List.Item
                  key={worker.id}
                  title={worker.name}
                  description={`ID: ${worker.employeeId}`}
                  left={(props) => <MaterialCommunityIcons {...props} name="account" size={24} color="#FF9800" />}
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
            <Title>Feeder Points</Title>
            {feederPoints.map((point) => (
              <Card key={point.id} style={styles.feederCard}>
                <Card.Content>
                  <View style={styles.feederHeader}>
                    <View style={styles.feederInfo}>
                      <Text style={styles.feederName}>{point.name}</Text>
                      <Text style={styles.feederLocation}>{point.location}</Text>
                      <Text style={styles.feederZone}>
                        {point.zone} • {point.ward}
                      </Text>
                    </View>
                    <Chip
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor: point.assignedWorkers.length > 0 ? "#4CAF50" : "#F44336",
                        },
                      ]}
                      textStyle={{ color: "#fff", fontSize: 12 }}
                    >
                      {point.assignedWorkers.length > 0 ? "ASSIGNED" : "VACANT"}
                    </Chip>
                  </View>

                  {point.assignedWorkers.length > 0 && (
                    <View style={styles.assignedWorkers}>
                      <Text style={styles.assignedTitle}>Assigned Workers:</Text>
                      {point.assignedWorkers.map((workerId) => {
                        const worker = workers.find((w) => w.id === workerId)
                        return (
                          <Chip key={workerId} style={styles.workerChip}>
                            {worker?.name}
                          </Chip>
                        )
                      })}
                    </View>
                  )}

                  <View style={styles.shiftsContainer}>
                    <Text style={styles.shiftsTitle}>Shifts:</Text>
                    <View style={styles.shifts}>
                      {["morning", "evening"].map((shift) => (
                        <Chip
                          key={shift}
                          style={[
                            styles.shiftChip,
                            {
                              backgroundColor: point.shifts.includes(shift as any) ? "#E3F2FD" : "#F5F5F5",
                            },
                          ]}
                        >
                          {shift.charAt(0).toUpperCase() + shift.slice(1)}
                        </Chip>
                      ))}
                    </View>
                  </View>

                  <Button mode="outlined" icon="account-plus" onPress={() => openAssignmentModal(point)} compact>
                    Manage Assignment
                  </Button>
                </Card.Content>
              </Card>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB icon="account-multiple-plus" style={styles.fab} onPress={() => {}} label="Bulk Assign" />

      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
          <Title style={styles.modalTitle}>Assign Worker to {selectedFeederPoint?.name}</Title>

          <Text style={styles.sectionTitle}>Select Worker</Text>
          {unassignedWorkers.map((worker) => (
            <List.Item
              key={worker.id}
              title={worker.name}
              description={worker.employeeId}
              onPress={() => setSelectedWorker(worker.id)}
              left={(props) => (
                <MaterialCommunityIcons
                  {...props}
                  name={selectedWorker === worker.id ? "radiobox-marked" : "radiobox-blank"}
                  size={24}
                  color="#2196F3"
                />
              )}
            />
          ))}

          <Text style={styles.sectionTitle}>Select Shift</Text>
          <View style={styles.shiftSelection}>
            {["morning", "evening"].map((shift) => (
              <Chip
                key={shift}
                selected={selectedShift === shift}
                onPress={() => setSelectedShift(shift as any)}
                style={styles.shiftSelectChip}
              >
                {shift.charAt(0).toUpperCase() + shift.slice(1)}
              </Chip>
            ))}
          </View>

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
    color: "#2196F3",
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
  feederCard: {
    marginBottom: 12,
    backgroundColor: "#f8f9fa",
  },
  feederHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  feederInfo: {
    flex: 1,
  },
  feederName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  feederLocation: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 2,
  },
  feederZone: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  statusChip: {
    height: 24,
  },
  assignedWorkers: {
    marginBottom: 12,
  },
  assignedTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  workerChip: {
    backgroundColor: "#E3F2FD",
    marginRight: 8,
    marginBottom: 4,
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
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#2196F3",
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
  shiftSelection: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  shiftSelectChip: {
    backgroundColor: "#E3F2FD",
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
