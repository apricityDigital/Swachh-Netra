//SwachhHRDashboard


"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native"
import { Card, Title, Paragraph, Text, Chip, Button, List } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"

export default function SwachhHRDashboard() {
  const [refreshing, setRefreshing] = useState(false)
  const [dashboardData, setDashboardData] = useState({
    totalWorkers: 45,
    todayAttendance: 38,
    wasteCollected: 2.4,
    unassignedWorkers: 3,
    pendingRequests: 2,
    activeFeederPoints: 15,
    alerts: [
      { id: 1, type: "absent", message: "5 workers absent today", priority: "medium" },
      { id: 2, type: "collection", message: "Low waste collection at Point A-12", priority: "high" },
    ],
  })

  const onRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
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
        <Title style={styles.headerTitle}>Swachh HR Dashboard</Title>
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
        <StatCard title="Total Workers" value={dashboardData.totalWorkers} icon="account-group" color="#2196F3" />
        <StatCard
          title="Today's Attendance"
          value={`${dashboardData.todayAttendance}/${dashboardData.totalWorkers}`}
          subtitle={`${Math.round((dashboardData.todayAttendance / dashboardData.totalWorkers) * 100)}% present`}
          icon="calendar-check"
          color="#4CAF50"
        />
        <StatCard
          title="Waste Collected"
          value={`${dashboardData.wasteCollected} tons`}
          subtitle="Today"
          icon="delete-variant"
          color="#FF9800"
        />
        <StatCard
          title="Unassigned Workers"
          value={dashboardData.unassignedWorkers}
          icon="account-alert"
          color="#F44336"
        />
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>Quick Actions</Title>
          </View>
          <View style={styles.quickActions}>
            <Button mode="contained" icon="account-plus" style={styles.actionButton} onPress={() => {}}>
              Add Worker
            </Button>
            <Button mode="outlined" icon="map-marker-multiple" style={styles.actionButton} onPress={() => {}}>
              Assign Points
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
                  View
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
              2 Worker Additions
            </Chip>
            <Chip icon="pencil" style={styles.requestChip}>
              1 Worker Update
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
    backgroundColor: "#2196F3",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "#E3F2FD",
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
  quickActions: {
    flexDirection: "row",
    gap: 12,
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
    backgroundColor: "#E3F2FD",
  },
  viewAllButton: {
    marginTop: 8,
  },
})