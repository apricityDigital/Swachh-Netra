"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, RefreshControl } from "react-native"
import { Card, Text, Chip, FAB, Divider } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
// Types defined inline
interface FeederPoint {
  id: string
  name: string
  address: string
  zone: string
  ward: string
  scheduledTime: string
  status: string
  totalWorkers: number
  completedWorkers: number
  estimatedWaste: string
  coordinates: { latitude: number; longitude: number }
}

interface DriverInfo {
  id: string
  name: string
  vehicleNumber: string
  zone: string
  ward: string
  route: string
}

const PickupAssignments = ({ navigation }: any) => {
  const [feederPoints, setFeederPoints] = useState<FeederPoint[]>([])
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [totalWorkers, setTotalWorkers] = useState(0)
  const [currentDriverId, setCurrentDriverId] = useState<string>("driver_001")

  useEffect(() => {
    loadDriverData()
    loadFeederPoints()
  }, [currentDriverId])

  const loadDriverData = async () => {
    try {
      const fallbackDriverInfo: DriverInfo = {
        id: currentDriverId,
        name: "Driver User",
        vehicleNumber: "MH12AB1234",
        zone: "Zone B",
        ward: "Ward 15",
        route: "Route 5",
      }
      setDriverInfo(fallbackDriverInfo)
    } catch (error) {
      console.error("Error loading driver data:", error)
    }
  }

  const loadFeederPoints = async () => {
    try {
      setLoading(true)
      // TODO: Implement firebaseService.getDriverFeederPoints
      // Using demo data for now
        const demoPoints: FeederPoint[] = [
          {
            id: "fp_001",
            name: "Feeder Point A1",
            address: "Sector 15, Block A, Near Community Center",
            zone: "Zone B",
            ward: "Ward 15",
            scheduledTime: "09:00 AM",
            status: "in-progress",
            totalWorkers: 6,
            completedWorkers: 0,
            estimatedWaste: "50 kg",
            coordinates: { latitude: 28.6139, longitude: 77.209 },
          },
          {
            id: "fp_002",
            name: "Feeder Point B2",
            address: "Sector 18, Block B, Market Area",
            zone: "Zone B",
            ward: "Ward 15",
            scheduledTime: "11:30 AM",
            status: "in-progress",
            totalWorkers: 4,
            completedWorkers: 2,
            estimatedWaste: "35 kg",
            coordinates: { latitude: 28.6129, longitude: 77.208 },
          },
          {
            id: "fp_003",
            name: "Feeder Point C3",
            address: "Sector 22, Block C, Residential Complex",
            zone: "Zone B",
            ward: "Ward 15",
            scheduledTime: "02:00 PM",
            status: "in-progress",
            totalWorkers: 5,
            completedWorkers: 0,
            estimatedWaste: "65 kg",
            coordinates: { latitude: 28.6119, longitude: 77.207 },
          },
        ]
        setFeederPoints(demoPoints)
        setTotalWorkers(15)
    } catch (error) {
      console.error("Error loading feeder points:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadFeederPoints()
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4caf50"
      case "in-progress":
        return "#ff9800"
      case "pending":
        return "#f44336"
      default:
        return "#666"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "check-circle"
      case "in-progress":
        return "access-time"
      case "pending":
        return "pending"
      default:
        return "help"
    }
  }

  const handleFeederPointPress = (feederPoint: FeederPoint) => {
    console.log("Navigating to FeederPointDetail with:", feederPoint)
    navigation.navigate("FeederPointDetail", {
      feederPointId: feederPoint.id,
      feederPoint: feederPoint,
      driverId: currentDriverId,
    })
  }

  const renderFeederPoint = ({ item }: { item: FeederPoint }) => (
    <Card style={styles.card} onPress={() => handleFeederPointPress(item)}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium">{item.name}</Text>
          <Chip icon={getStatusIcon(item.status)} textStyle={{ color: getStatusColor(item.status) }} mode="flat">
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <Text variant="bodyMedium" style={styles.address}>
          {item.address}
        </Text>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <MaterialIcons name="schedule" size={16} color="#666" />
            <Text variant="bodySmall" style={styles.detailText}>
              {item.scheduledTime}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="people" size={16} color="#666" />
            <Text variant="bodySmall" style={styles.detailText}>
              {item.completedWorkers}/{item.totalWorkers} Workers
            </Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="delete" size={16} color="#666" />
            <Text variant="bodySmall" style={styles.detailText}>
              {item.estimatedWaste}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(item.completedWorkers / item.totalWorkers) * 100}%`,
                  backgroundColor: getStatusColor(item.status),
                },
              ]}
            />
          </View>
          <Text variant="bodySmall" style={styles.progressText}>
            {Math.round((item.completedWorkers / item.totalWorkers) * 100)}% Complete
          </Text>
        </View>
      </Card.Content>
    </Card>
  )

  return (
    <View style={styles.container}>
      {driverInfo && (
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Today's Route
            </Text>
            <View style={styles.driverInfoContainer}>
              <View style={styles.infoRow}>
                <Chip icon="account" mode="flat" style={styles.infoChip}>
                  {driverInfo.name}
                </Chip>
                <Chip icon="truck" mode="flat" style={styles.infoChip}>
                  {driverInfo.vehicleNumber}
                </Chip>
              </View>
              <View style={styles.infoRow}>
                <Chip icon="map" mode="flat" style={styles.infoChip}>
                  {driverInfo.zone}
                </Chip>
                <Chip icon="location-city" mode="flat" style={styles.infoChip}>
                  {driverInfo.ward}
                </Chip>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="headlineMedium" style={styles.summaryNumber}>
                  {feederPoints.length}
                </Text>
                <Text variant="bodySmall" style={styles.summaryLabel}>
                  Feeder Points
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="headlineMedium" style={styles.summaryNumber}>
                  {totalWorkers}
                </Text>
                <Text variant="bodySmall" style={styles.summaryLabel}>
                  Total Workers
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="headlineMedium" style={styles.summaryNumber}>
                  {feederPoints.filter((fp) => fp.status === "completed").length}
                </Text>
                <Text variant="bodySmall" style={styles.summaryLabel}>
                  Completed
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Assigned Feeder Points
      </Text>

      <FlatList
        data={feederPoints}
        renderItem={renderFeederPoint}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      <FAB
        icon="refresh"
        style={styles.fab}
        onPress={onRefresh}
        loading={refreshing}
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
  headerCard: {
    marginBottom: 16,
    elevation: 4,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  driverInfoContainer: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoChip: {
    flex: 0.48,
  },
  divider: {
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryNumber: {
    fontWeight: "bold",
    color: "#2196f3",
  },
  summaryLabel: {
    color: "#666",
    marginTop: 4,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  listContainer: {
    paddingBottom: 80,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  address: {
    color: "#666",
    marginBottom: 12,
  },
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailText: {
    marginLeft: 4,
    color: "#666",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    color: "#666",
    minWidth: 80,
    textAlign: "right",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,

  },
})

export default PickupAssignments;