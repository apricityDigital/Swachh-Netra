import React, { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
} from "react-native"
import { Card, Text, Button } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import AdminHeader from "../../components/AdminHeader"
import ContractorSidebar from "../../components/ContractorSidebar"
import { ContractorService, ContractorDashboardStats } from "../../../services/ContractorService"
import FirebaseService from "../../../services/FirebaseService"
import { useQuickLogout } from "../../hooks/useLogout"
import { FIREBASE_AUTH } from "../../../FirebaseConfig"

const { width } = Dimensions.get("window")

const ContractorDashboard = ({ navigation }: any) => {
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [contractorStats, setContractorStats] = useState<ContractorDashboardStats>({
    totalDrivers: 0,
    activeDrivers: 0,
    totalVehicles: 0,
    activeVehicles: 0,
    assignedFeederPoints: 0,
    todayTrips: {
      total: 0,
      completed: 0,
      pending: 0,
    },
    todayAttendance: {
      totalWorkers: 0,
      presentWorkers: 0,
      absentWorkers: 0,
    },
    pendingApprovals: 0,
  })
  const [userName, setUserName] = useState("Contractor")
  const [contractorId, setContractorId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Quick actions moved to sidebar

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Set up real-time data subscription
  useEffect(() => {
    if (!contractorId) return

    const unsubscribe = ContractorService.subscribeToContractorData(
      contractorId,
      (data) => {
        setContractorStats(data)
        setError(null)
      }
    )

    return unsubscribe
  }, [contractorId])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const user = FIREBASE_AUTH.currentUser
      if (user) {
        // Get user profile data
        const userData = await FirebaseService.getUserData(user.uid)
        if (userData) {
          setUserName(userData.fullName)
          setContractorId(user.uid)

          // Fetch real-time contractor dashboard data
          const dashboardData = await ContractorService.getContractorDashboardData(user.uid)
          setContractorStats(dashboardData)
        } else {
          throw new Error("User data not found")
        }
      } else {
        throw new Error("User not authenticated")
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError(error instanceof Error ? error.message : "Failed to load dashboard data")

      // Show user-friendly error message
      Alert.alert(
        "Error Loading Data",
        "Unable to load dashboard data. Please check your connection and try again.",
        [
          { text: "Retry", onPress: fetchDashboardData },
          { text: "Cancel", style: "cancel" }
        ]
      )
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }, [])

  // Using professional logout - import useQuickLogout at the top
  const { quickLogout, AlertComponent } = useQuickLogout(navigation)

  const handleAction = (screen: string) => {
    if (!contractorId) {
      console.error("❌ ContractorId is null, cannot navigate")
      return
    }

    console.log(`🧭 Navigating to ${screen} with contractorId: ${contractorId}`)

    switch (screen) {
      case "DriverAssignment":
        navigation.navigate("DriverAssignment", { contractorId })
        break
      case "ContractorDailyAssignments":
        navigation.navigate("ContractorDailyAssignments", { contractorId })
        break
      case "VehicleManagement":
        navigation.navigate("ContractorVehicleManagement", { contractorId })
        break
      case "TripMonitoring":
        navigation.navigate("TripMonitoring", { contractorId })
        break
      case "WorkerAttendance":
        navigation.navigate("WorkerAttendance", { contractorId })
        break
      case "FeederPoints":
        navigation.navigate("ContractorFeederPoints", { contractorId })
        break
      case "Reports":
        navigation.navigate("ContractorReports", { contractorId })
        break
      default:
        Alert.alert("Coming Soon", `${screen} functionality will be implemented soon`)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="business" size={48} color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Contractor Dashboard...</Text>
        <Text style={styles.loadingSubtext}>Fetching real-time data...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Unable to Load Dashboard</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          mode="contained"
          onPress={fetchDashboardData}
          style={styles.retryButton}
          icon="refresh"
        >
          Retry
        </Button>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <AdminHeader
        title="Contractor Dashboard"
        isDashboard={true}
        userName={userName}
        showLogoutButton={true}
        onLogoutPress={quickLogout}
        onMenuPress={() => setSidebarVisible(true)}
      />

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Statistics Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fleet Overview</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#eff6ff' }]}>
                  <MaterialIcons name="people" size={24} color="#3b82f6" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{contractorStats.totalDrivers}</Text>
                  <Text style={styles.statLabel}>Total Drivers</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#f0fdf4' }]}>
                  <MaterialIcons name="check-circle" size={24} color="#10b981" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{contractorStats.activeDrivers}</Text>
                  <Text style={styles.statLabel}>Active Drivers</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#f0fdf4' }]}>
                  <MaterialIcons name="local-shipping" size={24} color="#10b981" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{contractorStats.activeVehicles}</Text>
                  <Text style={styles.statLabel}>Active Vehicles</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                  <MaterialIcons name="local-shipping" size={24} color="#f59e0b" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{contractorStats.totalVehicles}</Text>
                  <Text style={styles.statLabel}>Total Vehicles</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#fef2f2' }]}>
                  <MaterialIcons name="pending-actions" size={24} color="#ef4444" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{contractorStats.pendingApprovals}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>
            </Card>
          </View>
        </View>

        {/* Quick Actions moved to the sidebar */}

        {/* Vehicle Status Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vehicle Status</Text>
            <TouchableOpacity
              onPress={() => handleAction("VehicleManagement")}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialIcons name="chevron-right" size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          <Card style={styles.vehicleStatusCard}>
            <View style={styles.vehicleStatusContent}>
              <View style={styles.vehicleStatusRow}>
                <View style={styles.vehicleStatusItem}>
                  <View style={styles.vehicleStatusIcon}>
                    <MaterialIcons name="check-circle" size={20} color="#10b981" />
                  </View>
                  <View style={styles.vehicleStatusInfo}>
                    <Text style={styles.vehicleStatusNumber}>{contractorStats.activeVehicles}</Text>
                    <Text style={styles.vehicleStatusLabel}>Active</Text>
                  </View>
                </View>

                <View style={styles.vehicleStatusItem}>
                  <View style={styles.vehicleStatusIcon}>
                    <MaterialIcons name="build" size={20} color="#f59e0b" />
                  </View>
                  <View style={styles.vehicleStatusInfo}>
                    <Text style={styles.vehicleStatusNumber}>
                      {contractorStats.totalVehicles - contractorStats.activeVehicles}
                    </Text>
                    <Text style={styles.vehicleStatusLabel}>Maintenance</Text>
                  </View>
                </View>

                <View style={styles.vehicleStatusItem}>
                  <View style={styles.vehicleStatusIcon}>
                    <MaterialIcons name="location-on" size={20} color="#3b82f6" />
                  </View>
                  <View style={styles.vehicleStatusInfo}>
                    <Text style={styles.vehicleStatusNumber}>{contractorStats.assignedFeederPoints}</Text>
                    <Text style={styles.vehicleStatusLabel}>Routes</Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* Today's Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Performance</Text>
          <Card style={styles.performanceCard}>
            <View style={styles.performanceContent}>
              <View style={styles.performanceHeader}>
                <Text style={styles.performanceTitle}>Collection Summary</Text>
                <Text style={styles.performanceDate}>Today</Text>
              </View>

              <View style={styles.performanceStats}>
                <View style={styles.performanceItem}>
                  <View style={styles.performanceRow}>
                    <View style={styles.performanceLabel}>
                      <MaterialIcons name="assignment-turned-in" size={16} color="#10b981" />
                      <Text style={styles.performanceText}>Completed Trips</Text>
                    </View>
                    <Text style={styles.performanceValue}>{contractorStats.todayTrips.completed}</Text>
                  </View>
                </View>

                <View style={styles.performanceItem}>
                  <View style={styles.performanceRow}>
                    <View style={styles.performanceLabel}>
                      <MaterialIcons name="assignment" size={16} color="#3b82f6" />
                      <Text style={styles.performanceText}>Total Trips</Text>
                    </View>
                    <Text style={styles.performanceValue}>{contractorStats.todayTrips.total}</Text>
                  </View>
                </View>

                <View style={styles.performanceItem}>
                  <View style={styles.performanceRow}>
                    <View style={styles.performanceLabel}>
                      <MaterialIcons name="people" size={16} color="#10b981" />
                      <Text style={styles.performanceText}>Workers Present</Text>
                    </View>
                    <Text style={styles.performanceValue}>{contractorStats.todayAttendance.presentWorkers}</Text>
                  </View>
                </View>

                <View style={styles.performanceItem}>
                  <View style={styles.performanceRow}>
                    <View style={styles.performanceLabel}>
                      <MaterialIcons name="location-on" size={16} color="#f59e0b" />
                      <Text style={styles.performanceText}>Feeder Points</Text>
                    </View>
                    <Text style={styles.performanceValue}>{contractorStats.assignedFeederPoints}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Professional Alert Component */}
      <AlertComponent />

      {/* Contractor Sidebar containing Quick Actions */}
      <ContractorSidebar
        navigation={navigation}
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onSelectAction={handleAction}
        currentScreen="ContractorDashboard"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 16,
  },
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  contractorBadge: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 2,
  },
  roleText: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
  },
  vehicleStatusCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  vehicleStatusContent: {
    padding: 16,
  },
  vehicleStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  vehicleStatusItem: {
    alignItems: "center",
    flex: 1,
  },
  vehicleStatusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  vehicleStatusInfo: {
    alignItems: "center",
  },
  vehicleStatusNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  vehicleStatusLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  // Statistics styles
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: (width - 60) / 2,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  // Actions styles
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: "#6b7280",
  },
  // Performance styles
  performanceCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  performanceContent: {
    padding: 20,
  },
  performanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  performanceDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  performanceStats: {
    gap: 16,
  },
  performanceItem: {
    marginBottom: 12,
  },
  performanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  performanceLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  performanceText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    marginLeft: 8,
  },
  performanceValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
  },
  // New styles for enhanced UI
  loadingSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "400",
    marginTop: 8,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    color: "#111827",
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "400",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    minWidth: 120,
  },
})

export default ContractorDashboard
