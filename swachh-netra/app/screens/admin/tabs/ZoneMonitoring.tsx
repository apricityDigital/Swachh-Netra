"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, FlatList } from "react-native"
import { Card, Text, Button, Chip, ProgressBar } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"

interface Zone {
  id: string
  name: string
  area: string
  status: "active" | "inactive" | "maintenance"
  workers: number
  drivers: number
  vehicles: number
  attendanceRate: number
  collectionRate: number
  lastUpdate: string
  issues: number
}

const ZoneMonitoring = () => {
  const [zones] = useState<Zone[]>([
    {
      id: "1",
      name: "Zone A",
      area: "Sector 15-20",
      status: "active",
      workers: 25,
      drivers: 5,
      vehicles: 3,
      attendanceRate: 92,
      collectionRate: 88,
      lastUpdate: "2 hours ago",
      issues: 1,
    },
    {
      id: "2",
      name: "Zone B",
      area: "Sector 21-25",
      status: "active",
      workers: 30,
      drivers: 6,
      vehicles: 4,
      attendanceRate: 95,
      collectionRate: 92,
      lastUpdate: "1 hour ago",
      issues: 0,
    },
    {
      id: "3",
      name: "Zone C",
      area: "Sector 26-30",
      status: "maintenance",
      workers: 20,
      drivers: 4,
      vehicles: 2,
      attendanceRate: 75,
      collectionRate: 70,
      lastUpdate: "6 hours ago",
      issues: 3,
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#4caf50"
      case "inactive":
        return "#f44336"
      case "maintenance":
        return "#ff9800"
      default:
        return "#666"
    }
  }

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return "#4caf50"
    if (rate >= 75) return "#ff9800"
    return "#f44336"
  }

  const renderZone = ({ item }: { item: Zone }) => (
    <Card style={styles.zoneCard}>
      <Card.Content>
        <View style={styles.zoneHeader}>
          <View style={styles.zoneInfo}>
            <Text variant="titleLarge">{item.name}</Text>
            <Text variant="bodyMedium" style={styles.zoneArea}>
              {item.area}
            </Text>
            <Text variant="bodySmall" style={styles.lastUpdate}>
              Last update: {item.lastUpdate}
            </Text>
          </View>
          <View style={styles.zoneStatus}>
            <Chip mode="flat" textStyle={{ color: getStatusColor(item.status) }} style={styles.statusChip}>
              {item.status.toUpperCase()}
            </Chip>
            {item.issues > 0 && (
              <Chip icon="warning" mode="flat" textStyle={{ color: "#f44336" }} style={styles.issueChip}>
                {item.issues} Issues
              </Chip>
            )}
          </View>
        </View>

        {/* Resource Allocation */}
        <View style={styles.resourceContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Resource Allocation
          </Text>
          <View style={styles.resourceGrid}>
            <View style={styles.resourceItem}>
              <MaterialIcons name="people" size={24} color="#1976d2" />
              <Text variant="bodySmall">Workers</Text>
              <Text variant="titleMedium">{item.workers}</Text>
            </View>
            <View style={styles.resourceItem}>
              <MaterialIcons name="local-shipping" size={24} color="#4caf50" />
              <Text variant="bodySmall">Drivers</Text>
              <Text variant="titleMedium">{item.drivers}</Text>
            </View>
            <View style={styles.resourceItem}>
              <MaterialIcons name="directions-car" size={24} color="#ff9800" />
              <Text variant="bodySmall">Vehicles</Text>
              <Text variant="titleMedium">{item.vehicles}</Text>
            </View>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.performanceContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Performance Metrics
          </Text>
          <View style={styles.metricItem}>
            <Text variant="bodyMedium">Attendance Rate</Text>
            <ProgressBar
              progress={item.attendanceRate / 100}
              color={getPerformanceColor(item.attendanceRate)}
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={styles.metricValue}>
              {item.attendanceRate}%
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text variant="bodyMedium">Collection Rate</Text>
            <ProgressBar
              progress={item.collectionRate / 100}
              color={getPerformanceColor(item.collectionRate)}
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={styles.metricValue}>
              {item.collectionRate}%
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.zoneActions}>
          <Button
            mode="outlined"
            icon="visibility"
            onPress={() => {
              /* View details */
            }}
            style={styles.actionButton}
          >
            View Details
          </Button>
          <Button
            mode="outlined"
            icon="edit"
            onPress={() => {
              /* Edit zone */
            }}
            style={styles.actionButton}
          >
            Edit Zone
          </Button>
          {item.issues > 0 && (
            <Button
              mode="contained"
              icon="report-problem"
              onPress={() => {
                /* Escalate issues */
              }}
              style={[styles.actionButton, { backgroundColor: "#f44336" }]}
            >
              Escalate
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  )

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Zone Monitoring
      </Text>

      {/* Summary Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <Card.Content style={styles.summaryContent}>
            <MaterialIcons name="location-on" size={32} color="#1976d2" />
            <Text variant="headlineMedium">15</Text>
            <Text variant="bodySmall">Total Zones</Text>
          </Card.Content>
        </Card>
        <Card style={styles.summaryCard}>
          <Card.Content style={styles.summaryContent}>
            <MaterialIcons name="check-circle" size={32} color="#4caf50" />
            <Text variant="headlineMedium">12</Text>
            <Text variant="bodySmall">Active Zones</Text>
          </Card.Content>
        </Card>
        <Card style={styles.summaryCard}>
          <Card.Content style={styles.summaryContent}>
            <MaterialIcons name="warning" size={32} color="#ff9800" />
            <Text variant="headlineMedium">2</Text>
            <Text variant="bodySmall">Maintenance</Text>
          </Card.Content>
        </Card>
        <Card style={styles.summaryCard}>
          <Card.Content style={styles.summaryContent}>
            <MaterialIcons name="error" size={32} color="#f44336" />
            <Text variant="headlineMedium">1</Text>
            <Text variant="bodySmall">Inactive</Text>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Zones List */}
      <FlatList
        data={zones}
        renderItem={renderZone}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        style={styles.zonesList}
      />
    </View>
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
  summaryContainer: {
    marginBottom: 16,
  },
  summaryCard: {
    width: 120,
    marginRight: 12,
  },
  summaryContent: {
    alignItems: "center",
  },
  zonesList: {
    flex: 1,
  },
  zoneCard: {
    marginBottom: 16,
  },
  zoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneArea: {
    color: "#666",
    marginTop: 2,
  },
  lastUpdate: {
    color: "#999",
    marginTop: 4,
    fontSize: 12,
  },
  zoneStatus: {
    alignItems: "flex-end",
  },
  statusChip: {
    marginBottom: 4,
  },
  issueChip: {
    height: 24,
  },
  resourceContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    color: "#1976d2",
  },
  resourceGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  resourceItem: {
    alignItems: "center",
  },
  performanceContainer: {
    marginBottom: 16,
  },
  metricItem: {
    marginVertical: 8,
  },
  progressBar: {
    marginVertical: 4,
  },
  metricValue: {
    textAlign: "right",
    color: "#666",
  },
  zoneActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 2,
  },
})

export default ZoneMonitoring
