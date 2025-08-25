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
import { signOut } from "firebase/auth"
import { FIREBASE_AUTH } from "../../../FirebaseConfig"
import AdminHeader from "../../components/AdminHeader"
import { ContractorService, ContractorDashboardStats } from "../../../services/ContractorService"
import FirebaseService from "../../../services/FirebaseService"

const { width } = Dimensions.get("window")

const ContractorDashboard = ({ navigation }: any) => {
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
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

  const contractorActions = [
    {
      title: "Assign Drivers",
      description: "Assign vehicles and routes to drivers",
      icon: "assignment-ind",
      color: "#3b82f6",
      bgColor: "#eff6ff",
      screen: "DriverAssignment",
    },
    {
      title: "Vehicle Management",
      description: "Manage fleet and assignments",
      icon: "local-shipping",
      color: "#10b981",
      bgColor: "#f0fdf4",
      screen: "VehicleManagement",
    },
    {
      title: "Trip Monitoring",
      description: "Monitor daily trips and progress",
      icon: "track-changes",
      color: "#f59e0b",
      bgColor: "#fffbeb",
      screen: "TripMonitoring",
    },
    {
      title: "Worker Attendance",
      description: "View worker attendance records",
      icon: "how-to-reg",
      color: "#8b5cf6",
      bgColor: "#faf5ff",
      screen: "WorkerAttendance",
    },
    {
      title: "Feeder Points",
      description: "View assigned feeder points",
      icon: "location-on",
      color: "#ef4444",
      bgColor: "#fef2f2",
      screen: "FeederPoints",
    },
    {
      title: "Reports",
      description: "View performance reports",
      icon: "analytics",
      color: "#06b6d4",
      bgColor: "#f0f9ff",
      screen: "Reports",
    },
  ]

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

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(FIREBASE_AUTH)
            navigation.replace("Login")
          } catch (error) {
            Alert.alert("Error", "Failed to logout")
          }
        },
      },
    ])
  }

  const handleAction = (screen: string) => {
    switch (screen) {
      case "DriverAssignment":
        navigation.navigate("DriverAssignment", { contractorId })
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
        onLogoutPress={handleLogout}
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
                <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                  <MaterialIcons name="local-shipping" size={24} color="#f59e0b" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{contractorStats.totalVehicles}</Text>
                  <Text style={styles.statLabel}>Vehicles</Text>
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

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {contractorActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleAction(action.screen)}
                activeOpacity={0.7}
              >
                <Card style={styles.actionCard}>
                  <View style={styles.actionContent}>
                    <View style={[styles.actionIcon, { backgroundColor: action.bgColor }]}>
                      <MaterialIcons name={action.icon as any} size={28} color={action.color} />
                    </View>
                    <View style={styles.actionInfo}>
                      <Text style={styles.actionTitle}>{action.title}</Text>
                      <Text style={styles.actionDescription}>{action.description}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
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
