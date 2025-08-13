"use client"

import { useState } from "react"
import { View, StyleSheet, FlatList, RefreshControl } from "react-native"
import { Card, Text, Button, Searchbar, Chip, FAB, Avatar } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"

interface Worker {
  id: string
  name: string
  employeeId: string
  status: "active" | "inactive" | "pending"
  feederPoint?: string
  attendanceRate: number
  wasteAverage: number
  zone: string
  ward: string
  phone: string
}

export default function WorkersDirectory() {
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [workers] = useState<Worker[]>([
    {
      id: "1",
      name: "Rajesh Kumar",
      employeeId: "SW001",
      status: "active",
      feederPoint: "FP-A12",
      attendanceRate: 95,
      wasteAverage: 45,
      zone: "Zone A",
      ward: "Ward 1",
      phone: "+91 9876543210",
    },
    {
      id: "2",
      name: "Priya Sharma",
      employeeId: "SW002",
      status: "active",
      feederPoint: "FP-B08",
      attendanceRate: 88,
      wasteAverage: 52,
      zone: "Zone B",
      ward: "Ward 2",
      phone: "+91 9876543211",
    },
    {
      id: "3",
      name: "Amit Singh",
      employeeId: "SW003",
      status: "pending",
      attendanceRate: 0,
      wasteAverage: 0,
      zone: "Zone A",
      ward: "Ward 3",
      phone: "+91 9876543212",
    },
  ])

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }

  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === "all" || worker.status === selectedFilter
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#4CAF50"
      case "inactive":
        return "#F44336"
      case "pending":
        return "#FF9800"
      default:
        return "#757575"
    }
  }

  const renderWorker = ({ item }: { item: Worker }) => (
    <Card style={styles.workerCard}>
      <Card.Content>
        <View style={styles.workerHeader}>
          <View style={styles.workerInfo}>
            <Avatar.Text
              size={40}
              label={item.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
              style={{ backgroundColor: "#2196F3" }}
            />
            <View style={styles.workerDetails}>
              <Text style={styles.workerName}>{item.name}</Text>
              <Text style={styles.workerId}>ID: {item.employeeId}</Text>
              <Text style={styles.workerLocation}>
                {item.zone} • {item.ward}
              </Text>
            </View>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={{ color: "#fff", fontSize: 12 }}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        {item.status === "active" && (
          <View style={styles.metricsContainer}>
            <View style={styles.metric}>
              <MaterialCommunityIcons name="calendar-check" size={16} color="#4CAF50" />
              <Text style={styles.metricText}>{item.attendanceRate}% Attendance</Text>
            </View>
            <View style={styles.metric}>
              <MaterialCommunityIcons name="delete-variant" size={16} color="#FF9800" />
              <Text style={styles.metricText}>{item.wasteAverage}kg Avg</Text>
            </View>
            {item.feederPoint && (
              <View style={styles.metric}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#2196F3" />
                <Text style={styles.metricText}>{item.feederPoint}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.actionButtons}>
          <Button mode="outlined" icon="eye" compact onPress={() => {}}>
            View Details
          </Button>
          <Button mode="text" icon="pencil" compact onPress={() => {}}>
            Edit Request
          </Button>
        </View>
      </Card.Content>
    </Card>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search workers..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <View style={styles.filterContainer}>
          {["all", "active", "inactive", "pending"].map((filter) => (
            <Chip
              key={filter}
              selected={selectedFilter === filter}
              onPress={() => setSelectedFilter(filter)}
              style={styles.filterChip}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Chip>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredWorkers}
        renderItem={renderWorker}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />

      <FAB icon="plus" style={styles.fab} onPress={() => {}} label="Add Worker" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    elevation: 2,
  },
  searchbar: {
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#E3F2FD",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  workerCard: {
    marginBottom: 12,
    elevation: 2,
  },
  workerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  workerInfo: {
    flexDirection: "row",
    flex: 1,
  },
  workerDetails: {
    marginLeft: 12,
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
  workerLocation: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  statusChip: {
    height: 24,
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: "#757575",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#2196F3",
  },
})
