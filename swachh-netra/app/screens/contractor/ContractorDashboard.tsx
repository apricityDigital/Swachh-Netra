//ContractorDashboard

"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native"
import { Card, Title, Paragraph, Text, Chip, Button, List } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"

export default function ContractorDashboard() {
  const [refreshing, setRefreshing] = useState(false)
  const [dashboardData, setDashboardData] = useState({
    totalDrivers: 12,
    activeDrivers: 10,
    totalVehicles: 8,
    activeVehicles: 7,
    todayPickups: 45,
    completedPickups: 38,
    pendingRequests: 3,
    alerts: [
      { id: 1, type: "vehicle", message: "Vehicle V-003 needs maintenance", priority: "high" },
      { id: 2, type: "driver", message: "Driver D-007 absent today", priority: "medium" },
    ],
  })

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }

  const StatCard = ({ title, value, subtitle, icon, color }: any) => (
    <Card style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <Card.Content style={styles.statContent}>
        <View style={styles.statHeader}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
          <Text style={styles.statValue}>{value}</Text>
        </View>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </Card.Content>
    </Card>
  )

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Transport Contractor Dashboard</Title>
        <Paragraph style={styles.headerSubtitle}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Paragraph>
      </View>

      <View style={styles.statsGrid}>
        <StatCard title="Total Drivers" value={dashboardData.totalDrivers} icon="account-hard-hat" color="#FF9800" />
        <StatCard
          title="Active Today"
          value={`${dashboardData.activeDrivers}/${dashboardData.totalDrivers}`}
          subtitle={`${Math.round((dashboardData.activeDrivers / dashboardData.totalDrivers) * 100)}% active`}
          icon="account-check"
          color="#4CAF50"
        />
        <StatCard title="Total Vehicles" value={dashboardData.totalVehicles} icon="truck" color="#2196F3" />
        <StatCard
          title="Vehicles Active"
          value={`${dashboardData.activeVehicles}/${dashboardData.totalVehicles}`}
          subtitle={`${Math.round((dashboardData.activeVehicles / dashboardData.totalVehicles) * 100)}% operational`}
          icon="truck-check"
          color="#4CAF50"
        />
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>Today's Operations</Title>
          </View>
          <View style={styles.operationsGrid}>
            <View style={styles.operationItem}>
              <MaterialCommunityIcons name="map-marker-multiple" size={32} color="#2196F3" />
              <Text style={styles.operationValue}>{dashboardData.todayPickups}</Text>
              <Text style={styles.operationLabel}>Total Pickups</Text>
            </View>
            <View style={styles.operationItem}>
              <MaterialCommunityIcons name="check-circle" size={32} color="#4CAF50" />
              <Text style={styles.operationValue}>{dashboardData.completedPickups}</Text>
              <Text style={styles.operationLabel}>Completed</Text>
            </View>
            <View style={styles.operationItem}>
              <MaterialCommunityIcons name="clock" size={32} color="#FF9800" />
              <Text style={styles.operationValue}>{dashboardData.todayPickups - dashboardData.completedPickups}</Text>
              <Text style={styles.operationLabel}>Pending</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>Quick Actions</Title>
          </View>
          <View style={styles.quickActions}>
            <Button mode="contained" icon="account-plus" style={styles.actionButton} onPress={() => {}}>
              Add Driver
            </Button>
            <Button mode="outlined" icon="truck-plus" style={styles.actionButton} onPress={() => {}}>
              Add Vehicle
            </Button>
          </View>
          <View style={styles.quickActions}>
            <Button mode="outlined" icon="map-marker-path" style={styles.actionButton} onPress={() => {}}>
              Assign Routes
            </Button>
            <Button mode="outlined" icon="chart-line" style={styles.actionButton} onPress={() => {}}>
              View Reports
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>Alerts & Issues</Title>
            <Chip icon="alert" textStyle={{ fontSize: 12 }}>
              {dashboardData.alerts.length}
            </Chip>
          </View>
          {dashboardData.alerts.map((alert) => (
            <List.Item
              key={alert.id}
              title={alert.message}
              left={(props) => (
                <MaterialCommunityIcons
                  {...props}
                  name={alert.priority === "high" ? "alert-circle" : "information"}
                  color={alert.priority === "high" ? "#F44336" : "#FF9800"}
                  size={24}
                />
              )}
              right={(props) => (
                <Button {...props} mode="text" compact>
                  Resolve
                </Button>
              )}
              style={styles.alertItem}
            />
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Pending Requests</Title>
          <View style={styles.requestsContainer}>
            <Chip icon="account-plus" style={styles.requestChip}>
              2 Driver Additions
            </Chip>
            <Chip icon="truck-plus" style={styles.requestChip}>
              1 Vehicle Addition
            </Chip>
          </View>
          <Button mode="outlined" icon="file-document-multiple" style={styles.viewAllButton} onPress={() => {}}>
            View All Requests
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#FF9800",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "#FFF3E0",
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    elevation: 2,
  },
  statContent: {
    paddingVertical: 12,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statTitle: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: "#9E9E9E",
  },
  card: {
    margin: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  operationsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  operationItem: {
    alignItems: "center",
  },
  operationValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  operationLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
  },
  alertItem: {
    backgroundColor: "#f8f9fa",
    marginBottom: 8,
    borderRadius: 8,
  },
  requestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  requestChip: {
    backgroundColor: "#FFF3E0",
  },
  viewAllButton: {
    marginTop: 8,
  },
})