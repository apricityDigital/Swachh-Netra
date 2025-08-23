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
import AdminHeader from "../../components/AdminHeader"

const { width } = Dimensions.get("window")

const ContractorDashboard = ({ navigation }: any) => {
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [contractorStats, setContractorStats] = useState({
    totalDrivers: 12,
    activeDrivers: 10,
    totalVehicles: 8,
    activeVehicles: 7,
    todayPickups: 45,
    completedPickups: 38,
    pendingApprovals: 3,
  })
  const [userName, setUserName] = useState("Contractor")

  const contractorActions = [
    {
      title: "Manage Drivers",
      description: "View and approve driver requests",
      icon: "people",
      color: "#3b82f6",
      bgColor: "#eff6ff",
      screen: "DriverApprovals",
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
      title: "Route Planning",
      description: "Plan and optimize routes",
      icon: "map",
      color: "#f59e0b",
      bgColor: "#fffbeb",
      screen: "RoutePlanning",
    },
    {
      title: "Reports",
      description: "View performance reports",
      icon: "analytics",
      color: "#8b5cf6",
      bgColor: "#faf5ff",
      screen: "Reports",
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
        // TODO: Fetch real contractor data from Firebase
        // For now using mock data
        setContractorStats({
          totalDrivers: 12,
          activeDrivers: 10,
          totalVehicles: 8,
          activeVehicles: 7,
          todayPickups: 45,
          completedPickups: 38,
          pendingApprovals: 3,
        })
        setUserName("John Smith") // TODO: Get from user profile
      }
    } catch (error) {
      console.log("Error fetching dashboard data:", error)
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
    if (screen === "DriverApprovals") {
      navigation.navigate("DriverApprovals")
    } else {
      Alert.alert("Coming Soon", `${screen} functionality will be implemented soon`)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="business" size={48} color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Contractor Dashboard...</Text>
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
                      <Text style={styles.performanceText}>Completed Pickups</Text>
                    </View>
                    <Text style={styles.performanceValue}>{contractorStats.completedPickups}</Text>
                  </View>
                </View>

                <View style={styles.performanceItem}>
                  <View style={styles.performanceRow}>
                    <View style={styles.performanceLabel}>
                      <MaterialIcons name="assignment" size={16} color="#3b82f6" />
                      <Text style={styles.performanceText}>Total Pickups</Text>
                    </View>
                    <Text style={styles.performanceValue}>{contractorStats.todayPickups}</Text>
                  </View>
                </View>

                <View style={styles.performanceItem}>
                  <View style={styles.performanceRow}>
                    <View style={styles.performanceLabel}>
                      <MaterialIcons name="local-shipping" size={16} color="#f59e0b" />
                      <Text style={styles.performanceText}>Active Vehicles</Text>
                    </View>
                    <Text style={styles.performanceValue}>{contractorStats.activeVehicles}</Text>
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
})

export default ContractorDashboard
