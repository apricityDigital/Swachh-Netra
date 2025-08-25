import React, { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  FlatList,
  RefreshControl,
} from "react-native"
import { Card, Text, Chip, Searchbar } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { ContractorService } from "../../../services/ContractorService"
import { FeederPoint } from "../../../services/FeederPointService"

const ContractorFeederPoints = ({ route, navigation }: any) => {
  const { contractorId } = route.params
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [feederPoints, setFeederPoints] = useState<FeederPoint[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchFeederPoints()
  }, [])

  const fetchFeederPoints = async () => {
    setLoading(true)
    try {
      const points = await ContractorService.getContractorFeederPoints(contractorId)
      setFeederPoints(points)
    } catch (error) {
      console.error("Error fetching feeder points:", error)
      Alert.alert("Error", "Failed to load feeder points")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchFeederPoints()
  }

  const filteredFeederPoints = feederPoints.filter(point =>
    point.feederPointName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    point.areaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    point.wardNumber.includes(searchQuery)
  )

  const renderFeederPointCard = ({ item }: { item: FeederPoint }) => (
    <Card style={styles.feederPointCard}>
      <View style={styles.feederPointContent}>
        <View style={styles.feederPointHeader}>
          <View style={styles.feederPointInfo}>
            <Text style={styles.feederPointName}>{item.feederPointName}</Text>
            <Text style={styles.areaName}>{item.areaName}</Text>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={16} color="#6b7280" />
              <Text style={styles.locationText}>{item.nearestLandmark}</Text>
            </View>
          </View>
          <Chip
            style={styles.wardChip}
            textStyle={styles.wardText}
          >
            Ward {item.wardNumber}
          </Chip>
        </View>

        <View style={styles.feederPointDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="home" size={16} color="#6b7280" />
            <Text style={styles.detailText}>~{item.approximateHouseholds} households</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="local-shipping" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{item.vehicleTypes}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="people" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{item.populationDensity} density</Text>
          </View>
        </View>

        <View style={styles.feederPointActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => Alert.alert("Coming Soon", "Detailed view will be implemented")}
          >
            <MaterialIcons name="visibility" size={20} color="#2563eb" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => Alert.alert("Coming Soon", "Map view will be implemented")}
          >
            <MaterialIcons name="map" size={20} color="#059669" />
            <Text style={styles.mapButtonText}>View on Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  )

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="location-on" size={48} color="#2563eb" />
        <Text style={styles.loadingText}>Loading Feeder Points...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Assigned Feeder Points</Text>
          <Text style={styles.headerSubtitle}>{feederPoints.length} points assigned</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search feeder points..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{feederPoints.length}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {[...new Set(feederPoints.map(fp => fp.wardNumber))].length}
            </Text>
            <Text style={styles.statLabel}>Wards</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {feederPoints.reduce((sum, fp) => sum + parseInt(fp.approximateHouseholds || "0"), 0)}
            </Text>
            <Text style={styles.statLabel}>Households</Text>
          </View>
        </View>

        {/* Feeder Points List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feeder Points</Text>
          {filteredFeederPoints.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="location-off" size={64} color="#9ca3af" />
              <Text style={styles.emptyStateText}>
                {feederPoints.length === 0 
                  ? "No feeder points assigned yet" 
                  : "No feeder points match your search"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredFeederPoints}
              renderItem={renderFeederPointCard}
              keyExtractor={(item, index) => item.id || `feeder-point-${index}`}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 16,
  },
  header: {
    backgroundColor: "#ffffff",
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    backgroundColor: "#ffffff",
    elevation: 2,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  feederPointCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
  },
  feederPointContent: {
    padding: 16,
  },
  feederPointHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  feederPointInfo: {
    flex: 1,
  },
  feederPointName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  areaName: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  wardChip: {
    backgroundColor: "#eff6ff",
    height: 28,
  },
  wardText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "600",
  },
  feederPointDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
  },
  feederPointActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: "center",
  },
  viewButtonText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "600",
    marginLeft: 8,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    justifyContent: "center",
  },
  mapButtonText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9ca3af",
    marginTop: 16,
    textAlign: "center",
  },
})

export default ContractorFeederPoints
