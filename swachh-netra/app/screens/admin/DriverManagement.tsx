import React, { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  FlatList,
  RefreshControl,
} from "react-native"
import { Card, Text, Button, Chip, Searchbar, FAB } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { collection, getDocs, query, where, orderBy, updateDoc, doc } from "firebase/firestore"
import { FIRESTORE_DB } from "../../../FirebaseConfig"
import AdminSidebar from "../../components/AdminSidebar"
import ProtectedRoute from "../../components/ProtectedRoute"
import { useRequireAdmin } from "../../hooks/useRequireAuth"

interface Driver {
  id: string
  fullName: string
  email: string
  phone: string
  role: string
  isActive: boolean
  createdAt: string
  assignedVehicle?: string
  contractorId?: string
  contractorName?: string
}

const DriverManagement = ({ navigation }: any) => {
  const { hasAccess, userData } = useRequireAdmin(navigation)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [stats, setStats] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
    inactiveDrivers: 0,
    assignedDrivers: 0,
  })

  useEffect(() => {
    fetchDrivers()
  }, [])

  const fetchDrivers = async () => {
    try {
      setLoading(true)
      const driversQuery = query(
        collection(FIRESTORE_DB, "users"),
        where("role", "==", "driver"),
        orderBy("createdAt", "desc")
      )
      const driversSnapshot = await getDocs(driversQuery)
      const driversList = driversSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Driver[]

      setDrivers(driversList)

      // Calculate stats
      const activeCount = driversList.filter(d => d.isActive).length
      const assignedCount = driversList.filter(d => d.assignedVehicle).length
      setStats({
        totalDrivers: driversList.length,
        activeDrivers: activeCount,
        inactiveDrivers: driversList.length - activeCount,
        assignedDrivers: assignedCount,
      })
    } catch (error) {
      console.error("Error fetching drivers:", error)
      Alert.alert("Error", "Failed to fetch drivers")
    } finally {
      setLoading(false)
    }
  }

  const toggleDriverStatus = async (driver: Driver) => {
    try {
      await updateDoc(doc(FIRESTORE_DB, "users", driver.id), {
        isActive: !driver.isActive,
        updatedAt: new Date().toISOString()
      })
      Alert.alert("Success", `Driver ${driver.isActive ? 'deactivated' : 'activated'} successfully.`)
      fetchDrivers()
    } catch (error) {
      console.error("Error updating driver status:", error)
      Alert.alert("Error", "Failed to update driver status")
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchDrivers()
    setRefreshing(false)
  }

  const filteredDrivers = drivers.filter(driver => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = (driver.fullName || '').toLowerCase().includes(searchLower) ||
      (driver.email || '').toLowerCase().includes(searchLower)
    const matchesFilter = filterStatus === "all" ||
      (filterStatus === "active" && driver.isActive) ||
      (filterStatus === "inactive" && !driver.isActive)
    return matchesSearch && matchesFilter
  })

  const renderDriverCard = ({ item }: { item: Driver }) => (
    <Card style={styles.driverCard}>
      <View style={styles.driverHeader}>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{item.fullName}</Text>
          <Text style={styles.driverEmail}>{item.email}</Text>
          <Text style={styles.driverPhone}>{item.phone}</Text>
        </View>
        <View style={styles.badgeContainer}>
          <View style={[
            styles.statusBadge,
            item.isActive ? styles.activeBadge : styles.inactiveBadge
          ]}>
            <Text style={[
              styles.statusText,
              item.isActive ? styles.activeText : styles.inactiveText
            ]}>
              {item.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
          {item.assignedVehicle && (
            <Chip style={styles.assignedChip} textStyle={styles.assignedChipText}>
              Assigned
            </Chip>
          )}
        </View>
      </View>

      <View style={styles.driverDetails}>
        {item.contractorName && (
          <View style={styles.detailRow}>
            <MaterialIcons name="business" size={16} color="#6b7280" />
            <Text style={styles.detailText}>Contractor: {item.contractorName}</Text>
          </View>
        )}
        {item.assignedVehicle && (
          <View style={styles.detailRow}>
            <MaterialIcons name="local-shipping" size={16} color="#6b7280" />
            <Text style={styles.detailText}>Vehicle: {item.assignedVehicle}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <MaterialIcons name="schedule" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            Joined {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.driverActions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => Alert.alert("Coming Soon", "Driver details view will be implemented")}
        >
          <MaterialIcons name="visibility" size={20} color="#3b82f6" />
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusButton,
            item.isActive ? styles.deactivateButton : styles.activateButton
          ]}
          onPress={() => toggleDriverStatus(item)}
        >
          <MaterialIcons
            name={item.isActive ? 'block' : 'check-circle'}
            size={20}
            color="#fff"
          />
          <Text style={styles.statusButtonText}>
            {item.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="local-shipping" size={48} color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Drivers...</Text>
      </View>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin" navigation={navigation}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => setSidebarVisible(true)}
              style={styles.menuButton}
            >
              <MaterialIcons name="menu" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Driver Management</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <MaterialIcons name="refresh" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <MaterialIcons name="local-shipping" size={24} color="#3b82f6" />
                <Text style={styles.statNumber}>{stats.totalDrivers}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <MaterialIcons name="check-circle" size={24} color="#10b981" />
                <Text style={styles.statNumber}>{stats.activeDrivers}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <MaterialIcons name="assignment" size={24} color="#f59e0b" />
                <Text style={styles.statNumber}>{stats.assignedDrivers}</Text>
                <Text style={styles.statLabel}>Assigned</Text>
              </View>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <MaterialIcons name="block" size={24} color="#ef4444" />
                <Text style={styles.statNumber}>{stats.inactiveDrivers}</Text>
                <Text style={styles.statLabel}>Inactive</Text>
              </View>
            </Card>
          </View>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search drivers..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === "all" && styles.activeFilter]}
              onPress={() => setFilterStatus("all")}
            >
              <Text style={[styles.filterText, filterStatus === "all" && styles.activeFilterText]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === "active" && styles.activeFilter]}
              onPress={() => setFilterStatus("active")}
            >
              <Text style={[styles.filterText, filterStatus === "active" && styles.activeFilterText]}>
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === "inactive" && styles.activeFilter]}
              onPress={() => setFilterStatus("inactive")}
            >
              <Text style={[styles.filterText, filterStatus === "inactive" && styles.activeFilterText]}>
                Inactive
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Drivers List */}
        <FlatList
          data={filteredDrivers}
          renderItem={renderDriverCard}
          keyExtractor={(item) => item.id}
          style={styles.driversList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <MaterialIcons name="local-shipping" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No drivers found</Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery ? "Try adjusting your search" : "No drivers registered yet"}
                </Text>
              </View>
            </Card>
          }
        />

        {/* Admin Sidebar */}
        <AdminSidebar
          navigation={navigation}
          isVisible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          currentScreen="DriverManagement"
        />
      </SafeAreaView>
    </ProtectedRoute>
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
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingTop: Platform.OS === "ios" ? 0 : 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
  },
  statsContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    marginHorizontal: 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statContent: {
    padding: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchbar: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  activeFilter: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  filterText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  activeFilterText: {
    color: "#ffffff",
  },
  driversList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  driverCard: {
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  driverHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  driverEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  driverPhone: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  badgeContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  activeBadge: {
    backgroundColor: "#dcfce7",
  },
  inactiveBadge: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  activeText: {
    color: "#166534",
  },
  inactiveText: {
    color: "#dc2626",
  },
  assignedChip: {
    backgroundColor: "#dbeafe",
  },
  assignedChipText: {
    color: "#1e40af",
    fontSize: 10,
  },
  driverDetails: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 8,
  },
  driverActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  viewButtonText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
    marginLeft: 4,
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activateButton: {
    backgroundColor: "#10b981",
  },
  deactivateButton: {
    backgroundColor: "#ef4444",
  },
  statusButtonText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyCard: {
    marginTop: 40,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  emptyContent: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
    textAlign: "center",
  },
})

export default DriverManagement
