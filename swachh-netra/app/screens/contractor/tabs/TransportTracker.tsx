"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native"
import { Card, Title, Text, Button, Chip, Portal, Modal } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Calendar } from "react-native-calendars"

interface TransportLog {
  id: string
  driverId: string
  driverName: string
  vehicleNumber: string
  route: string
  pickupTime: string
  dropTime?: string
  status: "in_progress" | "completed" | "delayed"
  feederPoints: {
    name: string
    pickupTime?: string
    wasteCollected: number
    status: "pending" | "completed"
  }[]
  totalWaste: number
  location?: {
    latitude: number
    longitude: number
  }
}

export default function TransportTracker() {
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [calendarVisible, setCalendarVisible] = useState(false)
  const [filterStatus, setFilterStatus] = useState<"all" | "in_progress" | "completed" | "delayed">("all")

  const [transportLogs] = useState<TransportLog[]>([
    {
      id: "1",
      driverId: "D001",
      driverName: "Ramesh Kumar",
      vehicleNumber: "V-003",
      route: "Route A-1",
      pickupTime: "08:30 AM",
      dropTime: "12:45 PM",
      status: "completed",
      feederPoints: [
        { name: "FP-A12", pickupTime: "08:45 AM", wasteCollected: 45.5, status: "completed" },
        { name: "FP-A15", pickupTime: "10:15 AM", wasteCollected: 38.2, status: "completed" },
        { name: "FP-A18", pickupTime: "11:30 AM", wasteCollected: 42.8, status: "completed" },
      ],
      totalWaste: 126.5,
    },
    {
      id: "2",
      driverId: "D002",
      driverName: "Suresh Patel",
      vehicleNumber: "V-007",
      route: "Route B-2",
      pickupTime: "09:00 AM",
      status: "in_progress",
      feederPoints: [
        { name: "FP-B08", pickupTime: "09:15 AM", wasteCollected: 52.0, status: "completed" },
        { name: "FP-B11", wasteCollected: 0, status: "pending" },
        { name: "FP-B14", wasteCollected: 0, status: "pending" },
      ],
      totalWaste: 52.0,
      location: {
        latitude: 28.6139,
        longitude: 77.209,
      },
    },
    {
      id: "3",
      driverId: "D003",
      driverName: "Vikash Singh",
      vehicleNumber: "V-012",
      route: "Route C-3",
      pickupTime: "07:45 AM",
      status: "delayed",
      feederPoints: [
        { name: "FP-C15", wasteCollected: 0, status: "pending" },
        { name: "FP-C18", wasteCollected: 0, status: "pending" },
      ],
      totalWaste: 0,
    },
  ])

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }

  const filteredLogs = transportLogs.filter((log) => {
    const matchesStatus = filterStatus === "all" || log.status === filterStatus
    return matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4CAF50"
      case "in_progress":
        return "#2196F3"
      case "delayed":
        return "#F44336"
      default:
        return "#757575"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "check-circle"
      case "in_progress":
        return "truck-fast"
      case "delayed":
        return "alert-circle"
      default:
        return "help-circle"
    }
  }

  const summary = {
    total: filteredLogs.length,
    completed: filteredLogs.filter((log) => log.status === "completed").length,
    inProgress: filteredLogs.filter((log) => log.status === "in_progress").length,
    delayed: filteredLogs.filter((log) => log.status === "delayed").length,
    totalWaste: filteredLogs.reduce((sum, log) => sum + log.totalWaste, 0),
  }

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.dateSelector}>
              <Text style={styles.dateLabel}>Selected Date:</Text>
              <Button mode="outlined" icon="calendar" onPress={() => setCalendarVisible(true)} compact>
                {new Date(selectedDate).toLocaleDateString()}
              </Button>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{summary.total}</Text>
                <Text style={styles.summaryLabel}>Total Trips</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: "#4CAF50" }]}>{summary.completed}</Text>
                <Text style={styles.summaryLabel}>Completed</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: "#2196F3" }]}>{summary.inProgress}</Text>
                <Text style={styles.summaryLabel}>In Progress</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: "#F44336" }]}>{summary.delayed}</Text>
                <Text style={styles.summaryLabel}>Delayed</Text>
              </View>
            </View>

            <View style={styles.wasteTotal}>
              <MaterialCommunityIcons name="delete-variant" size={24} color="#4CAF50" />
              <Text style={styles.wasteTotalText}>Total Waste Collected: {summary.totalWaste.toFixed(1)} kg</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.filterCard}>
          <Card.Content>
            <Text style={styles.filterTitle}>Filter by Status</Text>
            <View style={styles.filterChips}>
              {["all", "in_progress", "completed", "delayed"].map((status) => (
                <Chip
                  key={status}
                  selected={filterStatus === status}
                  onPress={() => setFilterStatus(status as any)}
                  style={styles.filterChip}
                >
                  {status === "all" ? "All" : status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.logsCard}>
          <Card.Content>
            <Title>Transport Logs</Title>
            {filteredLogs.length === 0 ? (
              <Text style={styles.emptyText}>No transport logs for selected filters</Text>
            ) : (
              filteredLogs.map((log) => (
                <Card key={log.id} style={styles.logCard}>
                  <Card.Content>
                    <View style={styles.logHeader}>
                      <View style={styles.logInfo}>
                        <Text style={styles.driverName}>{log.driverName}</Text>
                        <Text style={styles.logDetails}>
                          {log.vehicleNumber} • {log.route}
                        </Text>
                        <Text style={styles.logTime}>Started: {log.pickupTime}</Text>
                        {log.dropTime && <Text style={styles.logTime}>Completed: {log.dropTime}</Text>}
                      </View>
                      <View style={styles.statusContainer}>
                        <MaterialCommunityIcons
                          name={getStatusIcon(log.status)}
                          size={24}
                          color={getStatusColor(log.status)}
                        />
                        <Chip
                          style={[styles.statusChip, { backgroundColor: getStatusColor(log.status) }]}
                          textStyle={{ color: "#fff", fontSize: 12 }}
                        >
                          {log.status.replace("_", " ").toUpperCase()}
                        </Chip>
                      </View>
                    </View>

                    <View style={styles.wasteInfo}>
                      <MaterialCommunityIcons name="weight-kilogram" size={20} color="#4CAF50" />
                      <Text style={styles.wasteText}>Total Waste: {log.totalWaste} kg</Text>
                    </View>

                    <View style={styles.feederPointsContainer}>
                      <Text style={styles.feederPointsTitle}>Feeder Points Progress:</Text>
                      {log.feederPoints.map((point, index) => (
                        <View key={index} style={styles.feederPoint}>
                          <MaterialCommunityIcons
                            name={point.status === "completed" ? "check-circle" : "clock"}
                            size={16}
                            color={point.status === "completed" ? "#4CAF50" : "#FF9800"}
                          />
                          <Text style={styles.feederPointName}>{point.name}</Text>
                          {point.pickupTime && <Text style={styles.feederPointTime}>{point.pickupTime}</Text>}
                          <Text style={styles.feederPointWaste}>{point.wasteCollected} kg</Text>
                        </View>
                      ))}
                    </View>

                    {log.location && (
                      <View style={styles.locationContainer}>
                        <MaterialCommunityIcons name="map-marker" size={16} color="#2196F3" />
                        <Text style={styles.locationText}>
                          Current Location: {log.location.latitude.toFixed(4)}, {log.location.longitude.toFixed(4)}
                        </Text>
                      </View>
                    )}

                    <View style={styles.logActions}>
                      <Button mode="text" icon="map" compact onPress={() => {}}>
                        Track Live
                      </Button>
                      <Button mode="text" icon="phone" compact onPress={() => {}}>
                        Call Driver
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Modal
          visible={calendarVisible}
          onDismiss={() => setCalendarVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Title style={styles.modalTitle}>Select Date</Title>
          <Calendar
            onDayPress={(day) => {
              setSelectedDate(day.dateString)
              setCalendarVisible(false)
            }}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: "#FF9800" },
            }}
            maxDate={new Date().toISOString().split("T")[0]}
          />
        </Modal>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  wasteTotal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E8F5E8",
    padding: 12,
    borderRadius: 8,
  },
  wasteTotalText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
  },
  filterCard: {
    marginBottom: 16,
    elevation: 2,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#FFF3E0",
  },
  logsCard: {
    elevation: 2,
  },
  emptyText: {
    textAlign: "center",
    color: "#757575",
    fontStyle: "italic",
    paddingVertical: 32,
  },
  logCard: {
    marginBottom: 12,
    backgroundColor: "#f8f9fa",
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  logInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  logDetails: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  logTime: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  statusContainer: {
    alignItems: "center",
    gap: 4,
  },
  statusChip: {
    height: 20,
  },
  wasteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 4,
  },
  wasteText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  feederPointsContainer: {
    marginBottom: 12,
  },
  feederPointsTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  feederPoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  feederPointName: {
    fontSize: 12,
    color: "#333",
    flex: 1,
  },
  feederPointTime: {
    fontSize: 10,
    color: "#757575",
  },
  feederPointWaste: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    backgroundColor: "#E3F2FD",
    padding: 8,
    borderRadius: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#1976D2",
  },
  logActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modal: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
})
