"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Card, Text, Button, Chip, TextInput, Modal, Portal } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"

const VehicleInfo = () => {
  const [vehicleData] = useState({
    number: "DL-01-AB-1234",
    type: "Garbage Truck",
    capacity: "5 Tons",
    fuelLevel: 75,
    lastMaintenance: "2024-01-10",
    nextMaintenance: "2024-02-10",
    status: "Active",
    driverInstructions: "Check tire pressure daily. Report any unusual sounds immediately.",
  })

  const [reportModalVisible, setReportModalVisible] = useState(false)
  const [issueDescription, setIssueDescription] = useState("")
  const [issueType, setIssueType] = useState("")

  const handleReportIssue = () => {
    if (!issueType || !issueDescription) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    // Here you would save the issue report to Firebase
    Alert.alert("Success", "Issue reported successfully")
    setReportModalVisible(false)
    setIssueDescription("")
    setIssueType("")
  }

  const getFuelLevelColor = (level: number) => {
    if (level > 50) return "#4caf50"
    if (level > 25) return "#ff9800"
    return "#f44336"
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Vehicle Information
      </Text>

      {/* Vehicle Details */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Vehicle Details</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text variant="bodyMedium">Vehicle Number:</Text>
              <Text variant="bodyMedium" style={styles.detailValue}>
                {vehicleData.number}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text variant="bodyMedium">Type:</Text>
              <Text variant="bodyMedium" style={styles.detailValue}>
                {vehicleData.type}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text variant="bodyMedium">Capacity:</Text>
              <Text variant="bodyMedium" style={styles.detailValue}>
                {vehicleData.capacity}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text variant="bodyMedium">Status:</Text>
              <Chip icon="check-circle" mode="flat" textStyle={{ color: "#4caf50" }}>
                {vehicleData.status}
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Fuel Level */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Fuel Level</Text>
          <View style={styles.fuelContainer}>
            <MaterialIcons name="local-gas-station" size={24} color={getFuelLevelColor(vehicleData.fuelLevel)} />
            <Text
              variant="headlineMedium"
              style={[styles.fuelText, { color: getFuelLevelColor(vehicleData.fuelLevel) }]}
            >
              {vehicleData.fuelLevel}%
            </Text>
          </View>
          {vehicleData.fuelLevel < 30 && (
            <Text variant="bodySmall" style={styles.warningText}>
              ⚠️ Low fuel level. Please refuel soon.
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Maintenance */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Maintenance Schedule</Text>
          <View style={styles.maintenanceContainer}>
            <View style={styles.maintenanceItem}>
              <MaterialIcons name="build" size={20} color="#666" />
              <View style={styles.maintenanceText}>
                <Text variant="bodyMedium">Last Maintenance</Text>
                <Text variant="bodySmall" style={styles.dateText}>
                  {vehicleData.lastMaintenance}
                </Text>
              </View>
            </View>
            <View style={styles.maintenanceItem}>
              <MaterialIcons name="schedule" size={20} color="#ff9800" />
              <View style={styles.maintenanceText}>
                <Text variant="bodyMedium">Next Maintenance</Text>
                <Text variant="bodySmall" style={styles.dateText}>
                  {vehicleData.nextMaintenance}
                </Text>
              </View>
            </View>
          </View>
          <Button
            mode="outlined"
            icon="build"
            onPress={() => setReportModalVisible(true)}
            style={styles.maintenanceButton}
          >
            Request Maintenance
          </Button>
        </Card.Content>
      </Card>

      {/* Driver Instructions */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Driver Instructions</Text>
          <Text variant="bodyMedium" style={styles.instructions}>
            {vehicleData.driverInstructions}
          </Text>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Quick Actions</Text>
          <View style={styles.actionContainer}>
            <Button
              mode="contained"
              icon="report-problem"
              onPress={() => setReportModalVisible(true)}
              style={styles.actionButton}
            >
              Report Breakdown
            </Button>
            <Button
              mode="outlined"
              icon="build"
              onPress={() => setReportModalVisible(true)}
              style={styles.actionButton}
            >
              Maintenance Needed
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Report Issue Modal */}
      <Portal>
        <Modal
          visible={reportModalVisible}
          onDismiss={() => setReportModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Report Vehicle Issue
          </Text>

          <TextInput
            label="Issue Type"
            value={issueType}
            onChangeText={setIssueType}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Breakdown, Maintenance, Fuel Issue"
          />

          <TextInput
            label="Description"
            value={issueDescription}
            onChangeText={setIssueDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            placeholder="Describe the issue in detail..."
          />

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setReportModalVisible(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleReportIssue} style={styles.modalButton}>
              Submit Report
            </Button>
          </View>
        </Modal>
      </Portal>
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
  detailsContainer: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  detailValue: {
    fontWeight: "bold",
  },
  fuelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  fuelText: {
    marginLeft: 8,
  },
  warningText: {
    color: "#f44336",
    marginTop: 8,
  },
  maintenanceContainer: {
    marginTop: 8,
  },
  maintenanceItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  maintenanceText: {
    marginLeft: 8,
  },
  dateText: {
    color: "#666",
  },
  maintenanceButton: {
    marginTop: 8,
  },
  instructions: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
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
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
})

export default VehicleInfo
