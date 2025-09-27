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
import { WorkerService } from "../../../services/WorkerService"
import { WorkerAssignmentService } from "../../../services/WorkerAssignmentService"
import { WorkerAttendanceService } from "../../../services/WorkerAttendanceService"
import { useQuickLogout } from "../../hooks/useLogout"
import { useAuth } from "../../../contexts/AuthContext"
import SwachhHRSidebar from "../../components/SwachhHRSidebar"
import { PieChart, LineChart } from "react-native-chart-kit"

const { width } = Dimensions.get("window")

const SwachhHRDashboard = ({ navigation }: any) => {
  const { quickLogout, AlertComponent } = useQuickLogout(navigation)
  const { userData } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [hrStats, setHrStats] = useState({
    totalWorkers: 0,
    activeWorkers: 0,
    todayAttendance: 0,
    wasteCollected: 0,
    unassignedWorkers: 0,
    pendingRequests: 0,
    activeFeederPoints: 0,
    assignedWorkers: 0,
    totalAssignments: 0,
  })
  const [userName, setUserName] = useState("HR Manager")

  // Chart state
  const [todayCounts, setTodayCounts] = useState({ present: 0, absent: 0, unmarked: 0 })
  const [trendLabels, setTrendLabels] = useState<string[]>([])
  const [trendRates, setTrendRates] = useState<number[]>([])
  const [trendRangeDays, setTrendRangeDays] = useState<7 | 14 | 30>(14)
  const [trendDetails, setTrendDetails] = useState<{
    label: string
    key: string
    present: number
    absent: number
    unmarked: number
    total: number
    rate: number
  }[]>([])
  const [selectedDayInfo, setSelectedDayInfo] = useState<{
    label: string
    key: string
    present: number
    absent: number
    unmarked: number
    total: number
    rate: number
  } | null>(null)

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: () => "#6b7280",
    propsForDots: { r: "3", strokeWidth: "2", stroke: "#3b82f6" },
    propsForBackgroundLines: { stroke: "#e5e7eb" },
  }

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
      // Set user name from auth context
      if (userData) {
        setUserName(userData.fullName || userData.email || "HR Manager")
      }

      // Fetch all data in parallel for better performance
      const [
        allWorkers,
        feederPoints,
        pendingRequests,
        todayAttendanceStats
      ] = await Promise.all([
        WorkerAssignmentService.getAllWorkers(),
        WorkerAssignmentService.getAllFeederPoints(),
        WorkerService.getPendingWorkerApprovalRequests(),
        getTodayAttendanceStats()
      ])

      // Calculate assignment statistics
      const assignedWorkers = allWorkers.filter(worker =>
        worker.assignedFeederPointIds && worker.assignedFeederPointIds.length > 0
      ).length

      const unassignedWorkers = allWorkers.length - assignedWorkers

      const activeFeederPoints = feederPoints.filter(fp => fp.isActive).length

      const totalAssignments = feederPoints.reduce((total, fp) =>
        total + (fp.assignedWorkerIds?.length || 0), 0
      )

      setHrStats({
        totalWorkers: allWorkers.length,
        activeWorkers: allWorkers.filter(w => w.isActive).length,
        todayAttendance: todayAttendanceStats.attendanceRate,
        wasteCollected: 2.4, // This would come from actual waste collection data
        unassignedWorkers,
        pendingRequests: pendingRequests.length,
        activeFeederPoints,
        assignedWorkers,
        totalAssignments,
      })

      // Build today's pie data counts
      const present = todayAttendanceStats.presentCount
      const totalRecords = todayAttendanceStats.totalRecords
      const absent = Math.max(totalRecords - present, 0)
      const unmarked = Math.max(allWorkers.length - totalRecords, 0)
      setTodayCounts({ present, absent, unmarked })

    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      // Fallback to default values on error
      setHrStats({
        totalWorkers: 0,
        activeWorkers: 0,
        todayAttendance: 0,
        wasteCollected: 0,
        unassignedWorkers: 0,
        pendingRequests: 0,
        activeFeederPoints: 0,
        assignedWorkers: 0,
        totalAssignments: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const updateTrend = async (rangeDays: 7 | 14 | 30, totalWorkersCount?: number) => {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - (rangeDays - 1))
      const stats = await WorkerAttendanceService.getAttendanceStatisticsForHRAndAdmin(
        'swachh_hr',
        startDate,
        endDate
      )
      const days: string[] = []
      const rates: number[] = []
      const details: {
        label: string
        key: string
        present: number
        absent: number
        unmarked: number
        total: number
        rate: number
      }[] = []
      const totalWorkers = totalWorkersCount ?? hrStats.totalWorkers
      const dailyStats = stats?.dailyStats || {}
      for (let i = 0; i < rangeDays; i++) {
        const d = new Date(startDate)
        d.setDate(startDate.getDate() + i)
        const key = d.toISOString().split('T')[0]
        const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        const dayStat = dailyStats[key]
        const present = dayStat?.present || 0
        const absent = dayStat?.absent || 0
        const recordedTotal = dayStat?.total || 0
        const unmarked = Math.max(totalWorkers - recordedTotal, 0)
        const rate = recordedTotal > 0 ? Math.round((present / recordedTotal) * 100) : 0
        days.push(label)
        rates.push(rate)
        details.push({
          label,
          key,
          present,
          absent,
          unmarked,
          total: recordedTotal,
          rate,
        })
      }
      setTrendLabels(days)
      setTrendRates(rates)
      setTrendDetails(details)
      setSelectedDayInfo(details.length > 0 ? details[details.length - 1] : null)
    } catch (e) {
      console.error('Error updating trend', e)
      setTrendLabels([])
      setTrendRates([])
      setTrendDetails([])
      setSelectedDayInfo(null)
    }
  }

  useEffect(() => {
    if (trendRangeDays) {
      updateTrend(trendRangeDays, hrStats.totalWorkers)
    }
  }, [trendRangeDays, hrStats.totalWorkers])

  const getTodayAttendanceStats = async () => {
    try {
      const today = new Date()
      const startOfDay = new Date(today)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(today)
      endOfDay.setHours(23, 59, 59, 999)

      const attendanceRecords = await WorkerAttendanceService.getAttendanceForHRAndAdmin(
        'swachh_hr',
        startOfDay,
        endOfDay
      )

      const presentCount = attendanceRecords.filter(r => r.status === 'present').length
      const totalRecords = attendanceRecords.length
      const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0

      return { attendanceRate, presentCount, totalRecords }
    } catch (error) {
      console.error("Error fetching attendance stats:", error)
      return { attendanceRate: 0, presentCount: 0, totalRecords: 0 }
    }
  }

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }, [])

  // Remove the old handleLogout function - now using quickLogout from hook

  const handleAction = (screen: string) => {
    switch (screen) {
      case "WorkerManagement":
        navigation.navigate("WorkerManagement")
        break
      case "WorkerAssignment":
        navigation.navigate("WorkerAssignment")
        break
      case "HRAttendanceDashboard":
        navigation.navigate("HRAttendanceDashboard")
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
            <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuButton}>
              <MaterialIcons name="menu" size={24} color="#374151" />
            </TouchableOpacity>
            <View style={styles.hrBadge}>
              <MaterialIcons name="group" size={24} color="#3b82f6" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.roleText}>HR Manager</Text>
            </View>
          </View>
          <TouchableOpacity onPress={quickLogout} style={styles.logoutButton}>
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

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#f0f9ff' }]}>
                  <MaterialIcons name="assignment" size={24} color="#0ea5e9" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{hrStats.assignedWorkers}</Text>
                  <Text style={styles.statLabel}>Assigned</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#fefce8' }]}>
                  <MaterialIcons name="location-on" size={24} color="#eab308" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{hrStats.activeFeederPoints}</Text>
                  <Text style={styles.statLabel}>Active Points</Text>
                </View>
              </View>
            </Card>
          </View>
        </View>

        {/* Quick Actions moved to the sidebar */}

        {/* Attendance Overview - Pie Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Overview</Text>
          <Card style={styles.chartCard}>
            <View style={styles.chartContent}>
              <PieChart
                width={width - 40}
                height={200}
                accessor="count"
                chartConfig={chartConfig}
                backgroundColor="transparent"
                paddingLeft="10"
                data={[
                  { name: "Present", count: todayCounts.present, color: "#10b981", legendFontColor: "#374151", legendFontSize: 12 },
                  { name: "Absent", count: todayCounts.absent, color: "#ef4444", legendFontColor: "#374151", legendFontSize: 12 },
                  { name: "Unmarked", count: todayCounts.unmarked, color: "#f59e0b", legendFontColor: "#374151", legendFontSize: 12 },
                ]}
                hasLegend
                absolute
              />
            </View>
          </Card>
        </View>

        {/* Attendance Trend - Line Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Last {trendRangeDays} Days Attendance</Text>
            <View style={styles.filtersRow}>
              <TouchableOpacity
                style={[styles.filterChip, trendRangeDays === 7 && styles.filterChipActive]}
                onPress={() => setTrendRangeDays(7)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, trendRangeDays === 7 && styles.filterChipTextActive]}>7D</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, trendRangeDays === 14 && styles.filterChipActive]}
                onPress={() => setTrendRangeDays(14)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, trendRangeDays === 14 && styles.filterChipTextActive]}>14D</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, trendRangeDays === 30 && styles.filterChipActive]}
                onPress={() => setTrendRangeDays(30)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, trendRangeDays === 30 && styles.filterChipTextActive]}>30D</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Card style={styles.chartCard}>
            <View style={styles.chartContent}>
              <LineChart
                data={{ labels: trendLabels, datasets: [{ data: trendRates }] }}
                width={width - 40}
                height={220}
                chartConfig={chartConfig}
                bezier
                fromZero
                yAxisSuffix="%"
                style={{ borderRadius: 12 }}
                onDataPointClick={({ index }) => {
                  const detail = trendDetails[index]
                  if (detail) {
                    setSelectedDayInfo(detail)
                  }
                }}
              />
            </View>
          </Card>
          {selectedDayInfo && (
            <Card style={styles.trendInfoCard}>
              <View style={styles.trendInfoHeader}>
                <Text style={styles.trendInfoTitle}>{selectedDayInfo.label}</Text>
                <Text style={styles.trendInfoRate}>{selectedDayInfo.rate}% attendance</Text>
              </View>
              <View style={styles.trendInfoRow}>
                <View style={styles.trendInfoLabel}>
                  <View style={[styles.trendColorDot, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.trendInfoText}>Present</Text>
                </View>
                <Text style={styles.trendInfoValue}>{selectedDayInfo.present}</Text>
              </View>
              <View style={styles.trendInfoRow}>
                <View style={styles.trendInfoLabel}>
                  <View style={[styles.trendColorDot, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.trendInfoText}>Absent</Text>
                </View>
                <Text style={styles.trendInfoValue}>{selectedDayInfo.absent}</Text>
              </View>
              <View style={styles.trendInfoRow}>
                <View style={styles.trendInfoLabel}>
                  <View style={[styles.trendColorDot, { backgroundColor: '#f59e0b' }]} />
                  <Text style={styles.trendInfoText}>Unmarked</Text>
                </View>
                <Text style={styles.trendInfoValue}>{selectedDayInfo.unmarked}</Text>
              </View>
            </Card>
          )}
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
                      <MaterialIcons name="assignment" size={16} color="#0ea5e9" />
                      <Text style={styles.summaryText}>Total Assignments</Text>
                    </View>
                    <Text style={styles.summaryValue}>{hrStats.totalAssignments}</Text>
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

      {/* HR Sidebar */}
      <SwachhHRSidebar
        navigation={navigation}
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onSelectAction={handleAction}
        currentScreen="SwachhHRDashboard"
      />

      {/* Professional Alert Component */}
      <AlertComponent />
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
  menuButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginLeft: 8,
  },
  filterChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#1d4ed8',
  },
  trendInfoCard: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  trendInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  trendInfoRate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  trendInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trendInfoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  trendInfoText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  trendInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
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
  chartCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  chartContent: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
