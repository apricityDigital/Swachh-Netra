//DriverDashboard

import React, { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native"
import { Card, Text, Button, Chip, ProgressBar, Divider } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"

const DriverDashboard = ({ navigation }: any) => {
  const [refreshing, setRefreshing] = useState(false)
  const [showDatabaseViewer, setShowDatabaseViewer] = useState(false)
  const [tripData, setTripData] = useState({
    currentTrip: null as any,
    todayTrips: 0,
    totalDistance: 0,
    totalDuration: 0,
    totalWasteCollected: 0,
    completedFeederPoints: 0,
    totalFeederPoints: 0,
  })
  const [dashboardData, setDashboardData] = useState({
    totalPickups: 12,
    completedPickups: 8,
    pendingPickups: 4,
    todayAttendance: "Marked In",
    vehicleStatus: "Active",
    unreadMessages: 3,
  })

  useEffect(() => {
    loadTripData()
  }, [])

  const loadTripData = async () => {
    try {
      const driverId = "driver_001" // Replace with actual driver ID

      // Get current trip status
      const currentTrip = { totalDistance: 0, duration: 0 } // TODO: Implement getCurrentDriverTrip

      // Get today's summary
      const dailySummary = { totalFeederPoints: 0, totalWasteCollected: 0 } // TODO: Implement getDriverDailySummary

      // Get driver's feeder points
      const feederPoints = [] // TODO: Implement getDriverFeederPoints

      setTripData({
        currentTrip,
        todayTrips: dailySummary.totalFeederPoints,
        totalDistance: currentTrip.totalDistance,
        totalDuration: currentTrip.duration,
        totalWasteCollected: dailySummary.totalWasteCollected,
        completedFeederPoints: dailySummary.totalFeederPoints,
        totalFeederPoints: feederPoints.length,
      })
    } catch (error) {
      console.error("Error loading trip data:", error)
    }
  }

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    loadTripData().finally(() => {
      setRefreshing(false)
    })
  }, [])

  const completionRate = dashboardData.completedPickups / dashboardData.totalPickups

  const startTrip = async () => {
    try {
      const driverId = "driver_001"
      // TODO: Implement startDriverTrip
      console.log("Starting trip for driver:", driverId)
      await loadTripData()
    } catch (error) {
      console.error("Error starting trip:", error)
    }
  }

  const endTrip = async () => {
    try {
      const driverId = "driver_001"
      if (tripData.currentTrip) {
        // TODO: Implement endDriverTrip
        console.log("Ending trip for driver:", driverId)
        await loadTripData()
      }
    } catch (error) {
      console.error("Error ending trip:", error)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text variant="headlineSmall" style={styles.title}>
        Good Morning, Driver!
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.tripHeader}>
            <Text variant="titleMedium">Current Trip Status</Text>
            <Chip
              icon={tripData.currentTrip ? "play-circle" : "stop-circle"}
              mode="flat"
              textStyle={{ color: tripData.currentTrip ? "#4caf50" : "#f44336" }}
            >
              {tripData.currentTrip ? "In Progress" : "Not Started"}
            </Chip>
          </View>

          {tripData.currentTrip ? (
            <View style={styles.tripDetails}>
              <View style={styles.tripStat}>
                <MaterialIcons name="timer" size={20} color="#666" />
                <Text variant="bodyMedium">Duration: {formatDuration(tripData.totalDuration)}</Text>
              </View>
              <View style={styles.tripStat}>
                <MaterialIcons name="navigation" size={20} color="#666" />
                <Text variant="bodyMedium">Distance: {tripData.totalDistance.toFixed(1)} km</Text>
              </View>
              <Button mode="contained" onPress={endTrip} style={styles.tripButton}>
                End Trip
              </Button>
            </View>
          ) : (
            <Button mode="contained" onPress={startTrip} style={styles.tripButton}>
              Start Trip
            </Button>
          )}
        </Card.Content>
      </Card>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialIcons name="today" size={24} color="#1976d2" />
            <Text variant="bodySmall">Today's Trips</Text>
            <Text variant="headlineMedium">{tripData.todayTrips}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialIcons name="location-on" size={24} color="#4caf50" />
            <Text variant="bodySmall">Feeder Points</Text>
            <Text variant="headlineMedium">
              {tripData.completedFeederPoints}/{tripData.totalFeederPoints}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialIcons name="delete" size={24} color="#ff9800" />
            <Text variant="bodySmall">Waste (kg)</Text>
            <Text variant="headlineMedium">{tripData.totalWasteCollected}</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Progress Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Today's Progress</Text>
          <ProgressBar progress={completionRate} color="#4caf50" style={styles.progressBar} />
          <Text variant="bodySmall">{Math.round(completionRate * 100)}% Complete</Text>

          <Divider style={styles.divider} />
          <Text variant="titleSmall">Feeder Points Progress</Text>
          <ProgressBar
            progress={tripData.totalFeederPoints > 0 ? tripData.completedFeederPoints / tripData.totalFeederPoints : 0}
            color="#2196f3"
            style={styles.progressBar}
          />
          <Text variant="bodySmall">
            {tripData.completedFeederPoints} of {tripData.totalFeederPoints} completed
          </Text>
        </Card.Content>
      </Card>

      {/* Status Cards */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Current Status</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Text variant="bodyMedium">Attendance:</Text>
              <Chip icon="check" mode="flat" textStyle={{ color: "#4caf50" }}>
                {dashboardData.todayAttendance}
              </Chip>
            </View>
            <View style={styles.statusItem}>
              <Text variant="bodyMedium">Vehicle:</Text>
              <Chip icon="local-shipping" mode="flat" textStyle={{ color: "#1976d2" }}>
                {dashboardData.vehicleStatus}
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Quick Actions</Text>
          <View style={styles.actionContainer}>
            <Button
              mode="contained"
              icon="qr-code-scanner"
              onPress={() => navigation.navigate("QRScanner")}
              style={styles.actionButton}
            >
              Scan QR
            </Button>
            <Button
              mode="outlined"
              icon="assignment"
              onPress={() => navigation.navigate("Assignments")}
              style={styles.actionButton}
            >
              View Tasks
            </Button>
          </View>
          <View style={styles.actionContainer}>
            <Button
              mode="outlined"
              icon="message"
              onPress={() => navigation.navigate("Messages")}
              style={styles.actionButton}
            >
              Messages ({dashboardData.unreadMessages})
            </Button>
            <Button
              mode="outlined"
              icon="report-problem"
              onPress={() => navigation.navigate("ReportIssue")}
              style={styles.actionButton}
            >
              Report Issue
            </Button>
          </View>
          <View style={styles.actionContainer}>
            <Button
              mode={showDatabaseViewer ? "contained" : "outlined"}
              icon="database"
              onPress={() => setShowDatabaseViewer(!showDatabaseViewer)}
              style={[styles.actionButton, { marginTop: 8 }]}
            >
              {showDatabaseViewer ? "Hide" : "Show"} Database Status
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Conditional Database Viewer */}
      {showDatabaseViewer && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Database Status</Text>
            <Text variant="bodyMedium">TODO: Implement database viewer</Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  )

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  title: {
    marginBottom: 16,
    color: "#1976d2",
  },
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tripDetails: {
    marginTop: 8,
  },
  tripStat: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tripButton: {
    marginTop: 12,
  },
  divider: {
    marginVertical: 12,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  statContent: {
    alignItems: "center",
  },
  card: {
    marginBottom: 16,
  },
  progressBar: {
    marginVertical: 8,
  },
  statusContainer: {
    marginTop: 8,
  },
  statusItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
})

export default DriverDashboard