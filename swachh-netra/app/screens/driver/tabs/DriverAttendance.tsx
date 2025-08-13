"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Card, Text, Button, Chip, List } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import * as Location from "expo-location"

const DriverAttendance = () => {
  const [isMarkedIn, setIsMarkedIn] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null)
  const [attendanceHistory] = useState([
    { date: "2024-01-15", timeIn: "08:30 AM", timeOut: "06:45 PM", hours: "10h 15m" },
    { date: "2024-01-14", timeIn: "08:25 AM", timeOut: "06:30 PM", hours: "10h 5m" },
    { date: "2024-01-13", timeIn: "08:35 AM", timeOut: "06:40 PM", hours: "10h 5m" },
  ])

  useEffect(() => {
    getCurrentLocation()
  }, [])

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required for attendance")
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      setCurrentLocation(location)
    } catch (error) {
      Alert.alert("Error", "Failed to get current location")
    }
  }

  const handleMarkAttendance = async () => {
    if (!currentLocation) {
      Alert.alert("Error", "Location not available. Please try again.")
      return
    }

    try {
      // Here you would save attendance to Firebase
      setIsMarkedIn(!isMarkedIn)
      Alert.alert("Success", `Successfully marked ${isMarkedIn ? "out" : "in"} at ${new Date().toLocaleTimeString()}`)
    } catch (error) {
      Alert.alert("Error", "Failed to mark attendance")
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Attendance
      </Text>

      {/* Current Status */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Current Status</Text>
          <View style={styles.statusContainer}>
            <Chip
              icon={isMarkedIn ? "check-circle" : "access-time"}
              mode="flat"
              textStyle={{ color: isMarkedIn ? "#4caf50" : "#ff9800" }}
            >
              {isMarkedIn ? "Marked In" : "Not Marked In"}
            </Chip>
          </View>

          {currentLocation && (
            <Text variant="bodySmall" style={styles.locationText}>
              Location: {currentLocation.coords.latitude.toFixed(6)}, {currentLocation.coords.longitude.toFixed(6)}
            </Text>
          )}

          <Button
            mode="contained"
            icon={isMarkedIn ? "logout" : "login"}
            onPress={handleMarkAttendance}
            style={styles.attendanceButton}
          >
            Mark {isMarkedIn ? "Out" : "In"}
          </Button>
        </Card.Content>
      </Card>

      {/* Today's Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Today's Summary</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <MaterialIcons name="login" size={20} color="#4caf50" />
              <Text variant="bodyMedium">Time In: 08:30 AM</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialIcons name="logout" size={20} color="#f44336" />
              <Text variant="bodyMedium">Time Out: --:--</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialIcons name="schedule" size={20} color="#1976d2" />
              <Text variant="bodyMedium">Hours Worked: 2h 30m</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Attendance History */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Attendance History</Text>
          {attendanceHistory.map((record, index) => (
            <List.Item
              key={index}
              title={record.date}
              description={`In: ${record.timeIn} | Out: ${record.timeOut} | Hours: ${record.hours}`}
              left={(props) => <List.Icon {...props} icon="calendar" />}
              style={styles.historyItem}
            />
          ))}
        </Card.Content>
      </Card>

      {/* Trip-based Tracking */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Trip Tracking</Text>
          <Text variant="bodyMedium" style={styles.tripInfo}>
            Track attendance for each trip (typically 3 trips per day)
          </Text>
          <View style={styles.tripContainer}>
            <Chip icon="check-circle" mode="flat" textStyle={{ color: "#4caf50" }}>
              Trip 1: Complete
            </Chip>
            <Chip icon="access-time" mode="flat" textStyle={{ color: "#ff9800" }}>
              Trip 2: In Progress
            </Chip>
            <Chip icon="pending" mode="flat" textStyle={{ color: "#666" }}>
              Trip 3: Pending
            </Chip>
          </View>
        </Card.Content>
      </Card>
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
  card: {
    marginBottom: 16,
  },
  statusContainer: {
    marginVertical: 8,
  },
  locationText: {
    color: "#666",
    marginTop: 8,
    fontSize: 12,
  },
  attendanceButton: {
    marginTop: 16,
  },
  summaryContainer: {
    marginTop: 8,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tripInfo: {
    color: "#666",
    marginBottom: 8,
  },
  tripContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
})

export default DriverAttendance
