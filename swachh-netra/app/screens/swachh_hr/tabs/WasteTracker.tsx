"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from "react-native"
import { Card, Title, Text, Button, Chip, Portal, Modal } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Calendar } from "react-native-calendars"

interface WasteRecord {
  id: string
  workerId: string
  workerName: string
  feederPoint: string
  date: string
  wasteCollected: number // in kg
  bags: number
  depositTime: string
  driverSignature: string
  status: "verified" | "pending" | "disputed"
}

const screenWidth = Dimensions.get("window").width

const SimpleLineChart = ({ data, title }: { data: number[]; title: string }) => (
  <View style={styles.simpleChart}>
    <Text style={styles.chartTitle}>{title}</Text>
    <View style={styles.chartBars}>
      {data.map((value, index) => (
        <View key={index} style={styles.chartBar}>
          <View style={[styles.bar, { height: (value / Math.max(...data)) * 100 }]} />
          <Text style={styles.barLabel}>{value}</Text>
        </View>
      ))}
    </View>
  </View>
)

export default function WasteTracker() {
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [calendarVisible, setCalendarVisible] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "chart">("list")

  const [wasteData] = useState<WasteRecord[]>([
    {
      id: "1",
      workerId: "SW001",
      workerName: "Rajesh Kumar",
      feederPoint: "FP-A12",
      date: new Date().toISOString().split("T")[0],
      wasteCollected: 45.5,
      bags: 12,
      depositTime: "10:30 AM",
      driverSignature: "Driver D001",
      status: "verified",
    },
    {
      id: "2",
      workerId: "SW002",
      workerName: "Priya Sharma",
      feederPoint: "FP-B08",
      date: new Date().toISOString().split("T")[0],
      wasteCollected: 52.0,
      bags: 15,
      depositTime: "11:15 AM",
      driverSignature: "Driver D002",
      status: "verified",
    },
    {
      id: "3",
      workerId: "SW003",
      workerName: "Amit Singh",
      feederPoint: "FP-C15",
      date: new Date().toISOString().split("T")[0],
      wasteCollected: 0,
      bags: 0,
      depositTime: "-",
      driverSignature: "-",
      status: "disputed",
    },
  ])

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }

  const filteredData = wasteData.filter((record) => record.date === selectedDate)

  const totalWaste = filteredData.reduce((sum, record) => sum + record.wasteCollected, 0)
  const totalBags = filteredData.reduce((sum, record) => sum + record.bags, 0)
  const averageWaste = filteredData.length > 0 ? totalWaste / filteredData.length : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "#4CAF50"
      case "pending":
        return "#FF9800"
      case "disputed":
        return "#F44336"
      default:
        return "#757575"
    }
  }

  const chartData = [120, 145, 132, 158, 142, 135, 165]
  const barChartData = [45.5, 52.0, 38.2, 41.8]

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
                <Text style={styles.summaryNumber}>{totalWaste.toFixed(1)}</Text>
                <Text style={styles.summaryLabel}>Total KG</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{totalBags}</Text>
                <Text style={styles.summaryLabel}>Total Bags</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{averageWaste.toFixed(1)}</Text>
                <Text style={styles.summaryLabel}>Avg per Worker</Text>
              </View>
            </View>

            <View style={styles.viewToggle}>
              <Chip
                selected={viewMode === "list"}
                onPress={() => setViewMode("list")}
                style={styles.toggleChip}
                icon="format-list-bulleted"
              >
                List View
              </Chip>
              <Chip
                selected={viewMode === "chart"}
                onPress={() => setViewMode("chart")}
                style={styles.toggleChip}
                icon="chart-line"
              >
                Chart View
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {viewMode === "chart" ? (
          <View>
            <Card style={styles.chartCard}>
              <Card.Content>
                <SimpleLineChart data={chartData} title="Weekly Waste Collection Trend" />
              </Card.Content>
            </Card>

            <Card style={styles.chartCard}>
              <Card.Content>
                <SimpleLineChart data={barChartData} title="Feeder Point Comparison (Today)" />
              </Card.Content>
            </Card>
          </View>
        ) : (
          <Card style={styles.dataCard}>
            <Card.Content>
              <Title>Waste Collection Records</Title>
              {filteredData.length === 0 ? (
                <Text style={styles.emptyText}>No waste collection records for selected date</Text>
              ) : (
                filteredData.map((record) => (
                  <Card key={record.id} style={styles.recordCard}>
                    <Card.Content>
                      <View style={styles.recordHeader}>
                        <View style={styles.workerInfo}>
                          <Text style={styles.workerName}>{record.workerName}</Text>
                          <Text style={styles.workerId}>ID: {record.workerId}</Text>
                          <Text style={styles.feederPoint}>📍 {record.feederPoint}</Text>
                        </View>
                        <Chip
                          style={[styles.statusChip, { backgroundColor: getStatusColor(record.status) }]}
                          textStyle={{ color: "#fff", fontSize: 12 }}
                        >
                          {record.status.toUpperCase()}
                        </Chip>
                      </View>

                      <View style={styles.wasteMetrics}>
                        <View style={styles.metric}>
                          <MaterialCommunityIcons name="weight-kilogram" size={20} color="#4CAF50" />
                          <Text style={styles.metricValue}>{record.wasteCollected} kg</Text>
                        </View>
                        <View style={styles.metric}>
                          <MaterialCommunityIcons name="package-variant" size={20} color="#FF9800" />
                          <Text style={styles.metricValue}>{record.bags} bags</Text>
                        </View>
                        <View style={styles.metric}>
                          <MaterialCommunityIcons name="clock" size={20} color="#2196F3" />
                          <Text style={styles.metricValue}>{record.depositTime}</Text>
                        </View>
                      </View>

                      {record.driverSignature !== "-" && (
                        <View style={styles.signature}>
                          <MaterialCommunityIcons name="account-hard-hat" size={16} color="#757575" />
                          <Text style={styles.signatureText}>Verified by: {record.driverSignature}</Text>
                        </View>
                      )}

                      {record.status === "disputed" && (
                        <View style={styles.disputeAlert}>
                          <MaterialCommunityIcons name="alert-circle" size={16} color="#F44336" />
                          <Text style={styles.disputeText}>Collection disputed - requires investigation</Text>
                        </View>
                      )}

                      <View style={styles.recordActions}>
                        <Button mode="text" icon="eye" compact onPress={() => {}}>
                          View Details
                        </Button>
                        {record.status === "disputed" && (
                          <Button mode="text" icon="gavel" compact onPress={() => {}}>
                            Resolve
                          </Button>
                        )}
                      </View>
                    </Card.Content>
                  </Card>
                ))
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={calendarVisible}
          onDismiss={() => setCalendarVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Title style={styles.modalTitle}>Select Date</Title>
          <Calendar
            onDayPress={(day: { dateString: string }) => {
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
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  viewToggle: {
    flexDirection: "row",
    gap: 8,
  },
  toggleChip: {
    backgroundColor: "#E3F2FD",
  },
  chartCard: {
    marginBottom: 16,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  dataCard: {
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
  statusChip: {
    height: 24,
  },
  wasteMetrics: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
  },
  metric: {
    alignItems: "center",
    gap: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  signature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  signatureText: {
    fontSize: 12,
    color: "#757575",
  },
  disputeAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFEBEE",
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  disputeText: {
    fontSize: 12,
    color: "#F44336",
    fontWeight: "500",
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
  simpleChart: {
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginVertical: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  chartBars: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 120,
  },
  chartBar: {
    alignItems: "center",
    flex: 1,
  },
  bar: {
    backgroundColor: "#4CAF50",
    width: 20,
    borderRadius: 2,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    color: "#757575",
  },
})
