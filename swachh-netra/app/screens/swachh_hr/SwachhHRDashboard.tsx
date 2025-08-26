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
import { Card, Text } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { signOut } from "firebase/auth"
import { FIREBASE_AUTH } from "../../../FirebaseConfig"
import { WorkerService } from "../../../services/WorkerService"
import FirebaseService from "../../../services/FirebaseService"

const { width } = Dimensions.get("window")

const SwachhHRDashboard = ({ navigation }: any) => {
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hrStats, setHrStats] = useState({
    totalWorkers: 45,
    activeWorkers: 38,
    todayAttendance: 85,
    wasteCollected: 2.4,
    unassignedWorkers: 3,
    pendingRequests: 2,
    activeFeederPoints: 15,
  })
  const [userName, setUserName] = useState("HR Manager")

  const hrActions = [
    {
      title: "Worker Management",
      description: "Manage workforce and assignments",
      icon: "people",
      color: "#3b82f6",
      bgColor: "#eff6ff",
      screen: "WorkerManagement",
    },
    {
      title: "Worker Assignment",
      description: "Assign workers to feeder points",
      icon: "person-add",
      color: "#059669",
      bgColor: "#f0fdf4",
      screen: "WorkerAssignment",
    },
    {
      title: "Attendance Dashboard",
      description: "View worker attendance records",
      icon: "event-available",
      color: "#10b981",
      bgColor: "#f0fdf4",
      screen: "HRAttendanceDashboard",
    },
    {
      title: "Performance Reports",
      description: "View worker performance",
      icon: "analytics",
      color: "#f59e0b",
      bgColor: "#fffbeb",
      screen: "PerformanceReports",
    },
    {
      title: "Payroll Management",
      description: "Manage worker payments",
      icon: "payment",
      color: "#8b5cf6",
      bgColor: "#faf5ff",
      screen: "PayrollManagement",
    },
  ]

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const user = FIREBASE_AUTH.currentUser
      if (user) {
        // Fetch real user data
        const userData = await FirebaseService.getUserData(user.uid)
        if (userData) {
          setUserName(userData.fullName || "HR Manager")
        }

        // Fetch real worker data (only active workers)
        const allWorkers = await WorkerService.getAllWorkers(false) // false = only active workers
        const activeWorkers = allWorkers // all fetched workers are already active

        // Fetch pending approval requests
        const pendingRequests = await WorkerService.getPendingWorkerApprovalRequests()

        setHrStats({
          totalWorkers: allWorkers.length,
          activeWorkers: activeWorkers.length,
          todayAttendance: allWorkers.length > 0 ? Math.round((activeWorkers.length / allWorkers.length) * 100) : 0,
          wasteCollected: 2.4, // This would come from actual waste collection data
          unassignedWorkers: 0, // Since we only fetch active workers, unassigned would be calculated differently
          pendingRequests: pendingRequests.length,
          activeFeederPoints: 15, // This would come from feeder point data
        })
      }
    } catch (error) {
      console.log("Error fetching dashboard data:", error)
      // Fallback to default values on error
      setHrStats({
        totalWorkers: 0,
        activeWorkers: 0,
        todayAttendance: 0,
        wasteCollected: 0,
        unassignedWorkers: 0,
        pendingRequests: 0,
        activeFeederPoints: 0,
      })
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
      case "WorkerManagement":
        navigation.navigate("WorkerManagement")
        break
      case "WorkerAssignment":
        navigation.navigate("WorkerAssignment")
        break
      case "AttendanceTracking":
      case "PerformanceReports":
      case "PayrollManagement":
        Alert.alert("Coming Soon", `${screen} functionality will be implemented soon`)
        break
      default:
        Alert.alert("Coming Soon", `${screen} functionality will be implemented soon`)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="group" size={48} color="#3b82f6" />
        <Text style={styles.loadingText}>Loading HR Dashboard...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.hrBadge}>
              <MaterialIcons name="group" size={24} color="#3b82f6" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.roleText}>HR Manager</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Statistics Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workforce Overview</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#eff6ff' }]}>
                  <MaterialIcons name="people" size={24} color="#3b82f6" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{hrStats.totalWorkers}</Text>
                  <Text style={styles.statLabel}>Total Workers</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#f0fdf4' }]}>
                  <MaterialIcons name="check-circle" size={24} color="#10b981" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{hrStats.activeWorkers}</Text>
                  <Text style={styles.statLabel}>Active Today</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                  <MaterialIcons name="schedule" size={24} color="#f59e0b" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{hrStats.todayAttendance}%</Text>
                  <Text style={styles.statLabel}>Attendance</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#fef2f2' }]}>
                  <MaterialIcons name="person-off" size={24} color="#ef4444" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{hrStats.unassignedWorkers}</Text>
                  <Text style={styles.statLabel}>Unassigned</Text>
                </View>
              </View>
            </Card>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {hrActions.map((action, index) => (
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

        {/* Today's Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <Card style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Daily Operations</Text>
                <Text style={styles.summaryDate}>Today</Text>
              </View>
              
              <View style={styles.summaryStats}>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryLabel}>
                      <MaterialIcons name="delete" size={16} color="#10b981" />
                      <Text style={styles.summaryText}>Waste Collected</Text>
                    </View>
                    <Text style={styles.summaryValue}>{hrStats.wasteCollected} tons</Text>
                  </View>
                </View>

                <View style={styles.summaryItem}>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryLabel}>
                      <MaterialIcons name="location-on" size={16} color="#3b82f6" />
                      <Text style={styles.summaryText}>Active Feeder Points</Text>
                    </View>
                    <Text style={styles.summaryValue}>{hrStats.activeFeederPoints}</Text>
                  </View>
                </View>

                <View style={styles.summaryItem}>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryLabel}>
                      <MaterialIcons name="pending-actions" size={16} color="#f59e0b" />
                      <Text style={styles.summaryText}>Pending Requests</Text>
                    </View>
                    <Text style={styles.summaryValue}>{hrStats.pendingRequests}</Text>
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
  hrBadge: {
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
  // Summary styles
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  summaryContent: {
    padding: 20,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  summaryDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  summaryStats: {
    gap: 16,
  },
  summaryItem: {
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    marginLeft: 8,
  },
  summaryValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
  },
})

export default SwachhHRDashboard
