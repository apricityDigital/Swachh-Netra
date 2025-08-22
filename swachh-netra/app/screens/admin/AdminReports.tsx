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
  RefreshControl,
  Dimensions,
} from "react-native"
import { Card, Text, Button, Chip } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { collection, getDocs, query, where } from "firebase/firestore"
import { FIRESTORE_DB } from "../../../FirebaseConfig"
import AdminSidebar from "../../components/AdminSidebar"
import ProtectedRoute from "../../components/ProtectedRoute"
import { useRequireAdmin } from "../../hooks/useRequireAuth"

const { width } = Dimensions.get("window")

interface ReportData {
  totalUsers: number
  totalFeederPoints: number
  totalVehicles: number
  totalAssignments: number
  activeContractors: number
  activeDrivers: number
  pendingApprovals: number
  systemHealth: "excellent" | "good" | "warning" | "critical"
}

const AdminReports = ({ navigation }: any) => {
  const { hasAccess, userData } = useRequireAdmin(navigation)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [reportData, setReportData] = useState<ReportData>({
    totalUsers: 0,
    totalFeederPoints: 0,
    totalVehicles: 0,
    totalAssignments: 0,
    activeContractors: 0,
    activeDrivers: 0,
    pendingApprovals: 0,
    systemHealth: "good",
  })
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter">("month")

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      
      // Fetch users data
      const usersSnapshot = await getDocs(collection(FIRESTORE_DB, "users"))
      const users = usersSnapshot.docs.map(doc => doc.data())
      
      // Fetch feeder points data
      const feederPointsSnapshot = await getDocs(
        query(collection(FIRESTORE_DB, "feederPoints"), where("isActive", "==", true))
      )
      
      // Fetch vehicles data
      const vehiclesSnapshot = await getDocs(
        query(collection(FIRESTORE_DB, "vehicles"), where("isActive", "==", true))
      )
      
      // Calculate metrics
      const activeContractors = users.filter(u => u.role === "transport_contractor" && u.isActive).length
      const activeDrivers = users.filter(u => u.role === "driver" && u.isActive).length
      const totalUsers = users.length
      const totalFeederPoints = feederPointsSnapshot.size
      const totalVehicles = vehiclesSnapshot.size
      
      // Determine system health
      let systemHealth: "excellent" | "good" | "warning" | "critical" = "excellent"
      if (totalUsers < 10) systemHealth = "warning"
      if (totalFeederPoints < 5) systemHealth = "warning"
      if (totalVehicles < 3) systemHealth = "critical"
      
      setReportData({
        totalUsers,
        totalFeederPoints,
        totalVehicles,
        totalAssignments: 0, // TODO: Calculate from assignments
        activeContractors,
        activeDrivers,
        pendingApprovals: 0, // TODO: Calculate from approval requests
        systemHealth,
      })
    } catch (error) {
      console.error("Error fetching report data:", error)
      Alert.alert("Error", "Failed to fetch report data")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchReportData()
    setRefreshing(false)
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case "excellent": return "#10b981"
      case "good": return "#3b82f6"
      case "warning": return "#f59e0b"
      case "critical": return "#ef4444"
      default: return "#6b7280"
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "excellent": return "check-circle"
      case "good": return "thumb-up"
      case "warning": return "warning"
      case "critical": return "error"
      default: return "help"
    }
  }

  const exportReport = () => {
    Alert.alert("Coming Soon", "Report export functionality will be implemented")
  }

  const generateDetailedReport = () => {
    Alert.alert("Coming Soon", "Detailed report generation will be implemented")
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="analytics" size={48} color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Reports...</Text>
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
            <Text style={styles.headerTitle}>Reports & Analytics</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <MaterialIcons name="refresh" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* System Health */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Health</Text>
            <Card style={styles.healthCard}>
              <LinearGradient
                colors={[getHealthColor(reportData.systemHealth), `${getHealthColor(reportData.systemHealth)}80`]}
                style={styles.healthGradient}
              >
                <MaterialIcons 
                  name={getHealthIcon(reportData.systemHealth) as any} 
                  size={32} 
                  color="#fff" 
                />
                <Text style={styles.healthStatus}>
                  {reportData.systemHealth.toUpperCase()}
                </Text>
                <Text style={styles.healthDescription}>
                  System is operating {reportData.systemHealth}
                </Text>
              </LinearGradient>
            </Card>
          </View>

          {/* Period Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Report Period</Text>
            <View style={styles.periodContainer}>
              {["week", "month", "quarter"].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.activePeriod
                  ]}
                  onPress={() => setSelectedPeriod(period as any)}
                >
                  <Text style={[
                    styles.periodText,
                    selectedPeriod === period && styles.activePeriodText
                  ]}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Key Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <View style={styles.metricsGrid}>
              <Card style={styles.metricCard}>
                <View style={styles.metricContent}>
                  <MaterialIcons name="people" size={24} color="#3b82f6" />
                  <Text style={styles.metricNumber}>{reportData.totalUsers}</Text>
                  <Text style={styles.metricLabel}>Total Users</Text>
                </View>
              </Card>
              <Card style={styles.metricCard}>
                <View style={styles.metricContent}>
                  <MaterialIcons name="location-on" size={24} color="#10b981" />
                  <Text style={styles.metricNumber}>{reportData.totalFeederPoints}</Text>
                  <Text style={styles.metricLabel}>Feeder Points</Text>
                </View>
              </Card>
              <Card style={styles.metricCard}>
                <View style={styles.metricContent}>
                  <MaterialIcons name="local-shipping" size={24} color="#f59e0b" />
                  <Text style={styles.metricNumber}>{reportData.totalVehicles}</Text>
                  <Text style={styles.metricLabel}>Vehicles</Text>
                </View>
              </Card>
              <Card style={styles.metricCard}>
                <View style={styles.metricContent}>
                  <MaterialIcons name="assignment" size={24} color="#8b5cf6" />
                  <Text style={styles.metricNumber}>{reportData.totalAssignments}</Text>
                  <Text style={styles.metricLabel}>Assignments</Text>
                </View>
              </Card>
            </View>
          </View>

          {/* User Distribution */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Distribution</Text>
            <Card style={styles.distributionCard}>
              <View style={styles.distributionItem}>
                <View style={styles.distributionRow}>
                  <View style={styles.distributionLabel}>
                    <View style={[styles.distributionDot, { backgroundColor: '#3b82f6' }]} />
                    <Text style={styles.distributionText}>Active Contractors</Text>
                  </View>
                  <Text style={styles.distributionValue}>{reportData.activeContractors}</Text>
                </View>
              </View>
              <View style={styles.distributionItem}>
                <View style={styles.distributionRow}>
                  <View style={styles.distributionLabel}>
                    <View style={[styles.distributionDot, { backgroundColor: '#10b981' }]} />
                    <Text style={styles.distributionText}>Active Drivers</Text>
                  </View>
                  <Text style={styles.distributionValue}>{reportData.activeDrivers}</Text>
                </View>
              </View>
              <View style={styles.distributionItem}>
                <View style={styles.distributionRow}>
                  <View style={styles.distributionLabel}>
                    <View style={[styles.distributionDot, { backgroundColor: '#f59e0b' }]} />
                    <Text style={styles.distributionText}>Pending Approvals</Text>
                  </View>
                  <Text style={styles.distributionValue}>{reportData.pendingApprovals}</Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Report Actions</Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={exportReport}>
                <MaterialIcons name="file-download" size={24} color="#3b82f6" />
                <Text style={styles.actionButtonText}>Export Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={generateDetailedReport}>
                <MaterialIcons name="description" size={24} color="#10b981" />
                <Text style={styles.actionButtonText}>Detailed Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Admin Sidebar */}
        <AdminSidebar
          navigation={navigation}
          isVisible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          currentScreen="AdminReports"
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
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  healthCard: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: "hidden",
  },
  healthGradient: {
    padding: 24,
    alignItems: "center",
  },
  healthStatus: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 8,
  },
  healthDescription: {
    fontSize: 14,
    color: "#ffffff",
    marginTop: 4,
    opacity: 0.9,
  },
  periodContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  activePeriod: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  periodText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  activePeriodText: {
    color: "#ffffff",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metricCard: {
    width: (width - 60) / 2,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  metricContent: {
    padding: 16,
    alignItems: "center",
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
  distributionCard: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 20,
  },
  distributionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  distributionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  distributionLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  distributionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  distributionText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  distributionValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
  },
  actionButtonText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    marginLeft: 8,
  },
})

export default AdminReports
