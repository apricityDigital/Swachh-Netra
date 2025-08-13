"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native"
import { Card, Title, Text, Button, Chip, Portal, Modal } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Calendar } from "react-native-calendars"

interface AttendanceRecord {
  id: string
  workerId: string
  workerName: string
  feederPoint: string
  date: string
  status: "present" | "absent" | "late"
  checkInTime?: string
  markedBy: string
}

interface CalendarDay {
  dateString: string
  day: number
  month: number
  year: number
  timestamp: number
}

export default function AttendanceMonitor() {
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [calendarVisible, setCalendarVisible] = useState(false)
  const [filterStatus, setFilterStatus] = useState<"all" | "present" | "absent" | "late">("all")

  const [attendanceData] = useState<AttendanceRecord[]>([
    {
      id: "1",
      workerId: "SW001",
      workerName: "Rajesh Kumar",
      feederPoint: "FP-A12",
      date: new Date().toISOString().split("T")[0],
      status: "present",
      checkInTime: "08:30 AM",
      markedBy: "Driver D001",
    },
    {
      id: "2",
      workerId: "SW002",
      workerName: "Priya Sharma",
      feederPoint: "FP-B08",
      date: new Date().toISOString().split("T")[0],
      status: "late",
      checkInTime: "09:15 AM",
      markedBy: "Driver D002",
    },
    {
      id: "3",
      workerId: "SW003",
      workerName: "Amit Singh",
      feederPoint: "FP-C15",
      date: new Date().toISOString().split("T")[0],
      status: "absent",
      markedBy: "Driver D001",
    },
    {
      id: "4",
      workerId: "SW004",
      workerName: "Sunita Devi",
      feederPoint: "FP-A12",
      date: new Date().toISOString().split("T")[0],
      status: "present",
      checkInTime: "08:45 AM",
      markedBy: "Driver D003",
    },
  ])

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }

  const filteredAttendance = attendanceData.filter((record) => {
    const matchesDate = record.date === selectedDate
    const matchesStatus = filterStatus === "all" || record.status === filterStatus
    return matchesDate && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "#4CAF50"
      case "absent":
        return "#F44336"
      case "late":
        return "#FF9800"
      default:
        return "#757575"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return "check-circle"
      case "absent":
        return "close-circle"
      case "late":
        return "clock-alert"
      default:
        return "help-circle"
    }
  }

  const attendanceSummary = {
    total: filteredAttendance.length,
    present: filteredAttendance.filter((r) => r.status === "present").length,
    absent: filteredAttendance.filter((r) => r.status === "absent").length,
    late: filteredAttendance.filter((r) => r.status === "late").length,
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
                <Text style={styles.summaryNumber}>{attendanceSummary.total}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: "#4CAF50" }]}>{attendanceSummary.present}</Text>
                <Text style={styles.summaryLabel}>Present</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: "#FF9800" }]}>{attendanceSummary.late}</Text>
                <Text style={styles.summaryLabel}>Late</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: "#F44336" }]}>{attendanceSummary.absent}</Text>
                <Text style={styles.summaryLabel}>Absent</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.filterCard}>
          <Card.Content>
            <Text style={styles.filterTitle}>Filter by Status</Text>
            <View style={styles.filterChips}>
              {["all", "present", "absent", "late"].map((status) => (
                <Chip
                  key={status}
                  selected={filterStatus === status}
                  onPress={() => setFilterStatus(status as any)}
                  style={styles.filterChip}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.attendanceCard}>
          <Card.Content>
            <Title>Attendance Records</Title>
            {filteredAttendance.length === 0 ? (
              <Text style={styles.emptyText}>No attendance records for selected date and filter</Text>
            ) : (
              filteredAttendance.map((record) => (
                <Card key={record.id} style={styles.recordCard}>
                  <Card.Content>
                    <View style={styles.recordHeader}>
                      <View style={styles.workerInfo}>
                        <Text style={styles.workerName}>{record.workerName}</Text>
                        <Text style={styles.workerId}>ID: {record.workerId}</Text>
                        <Text style={styles.feederPoint}>📍 {record.feederPoint}</Text>
                      </View>
                      <View style={styles.statusContainer}>
                        <MaterialCommunityIcons
                          name={getStatusIcon(record.status)}
                          size={24}
                          color={getStatusColor(record.status)}
                        />
                        <Chip
                          style={[styles.statusChip, { backgroundColor: getStatusColor(record.status) }]}
                          textStyle={{ color: "#fff", fontSize: 12 }}
                        >
                          {record.status.toUpperCase()}
                        </Chip>
                      </View>
                    </View>

                    <View style={styles.recordDetails}>
                      {record.checkInTime && (
                        <View style={styles.detailItem}>
                          <MaterialCommunityIcons name="clock" size={16} color="#757575" />
                          <Text style={styles.detailText}>Check-in: {record.checkInTime}</Text>
                        </View>
                      )}
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="account-hard-hat" size={16} color="#757575" />
                        <Text style={styles.detailText}>Marked by: {record.markedBy}</Text>
                      </View>
                    </View>

                    <View style={styles.recordActions}>
                      <Button mode="text" icon="flag" compact onPress={() => {}}>
                        Flag Issue
                      </Button>
                      <Button mode="text" icon="pencil" compact onPress={() => {}}>
                        Edit
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
            onDayPress={(day: CalendarDay) => {
              setSelectedDate(day.dateString)
              setCalendarVisible(false)
            }}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: "#2196F3" },
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
    backgroundColor: "#E3F2FD",
  },
  attendanceCard: {
    elevation: 2,
  },
  emptyText: {
    textAlign: "center",
    color: "#757575",
    fontStyle: "italic",
    paddingVertical: 32,
  },
  recordCard: {
    marginBottom: 12,
    backgroundColor: "#f8f9fa",
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  workerId: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  feederPoint: {
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
  recordDetails: {
    marginBottom: 12,
    gap: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: "#757575",
  },
  recordActions: {
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
