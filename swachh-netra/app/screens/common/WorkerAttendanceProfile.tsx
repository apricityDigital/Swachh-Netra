import React, { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  RefreshControl,
  Dimensions,
} from "react-native"
import { Card, Text, Button, Chip, ProgressBar } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { WorkerAttendanceService } from "../../../services/WorkerAttendanceService"
import { useRequireAuth } from "../../hooks/useRequireAuth"

const { width } = Dimensions.get("window")

interface WorkerProfileData {
  worker: any
  attendanceHistory: any[]
  statistics: {
    totalDays: number
    presentDays: number
    absentDays: number
    attendanceRate: number
    lateArrivals: number
    earlyDepartures: number
    averageCheckInTime: string
  }
  trends: {
    weeklyAttendance: { week: string, rate: number }[]
    monthlyAttendance: { month: string, rate: number }[]
  }
}

const WorkerAttendanceProfile = ({ navigation, route }: any) => {
  const { workerId, workerName } = route.params || {}
  const { userData, hasPermission } = useRequireAuth(navigation)

  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [profileData, setProfileData] = useState<WorkerProfileData | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate: new Date()
  })
  const [viewMode, setViewMode] = useState<'overview' | 'history' | 'trends'>('overview')

  useEffect(() => {
    if (workerId) {
      fetchWorkerProfile()
    }
  }, [workerId, dateRange])

  const fetchWorkerProfile = async () => {
    try {
      setLoading(true)
      console.log("👤 [WorkerProfile] Fetching profile for worker:", workerId)

      const data = await WorkerAttendanceService.getWorkerAttendanceProfile(workerId, dateRange)
      setProfileData(data)
    } catch (error) {
      console.error("❌ [WorkerProfile] Error fetching profile:", error)
      Alert.alert("Error", "Failed to load worker profile")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchWorkerProfile()
    setRefreshing(false)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return '#10b981'
    if (rate >= 75) return '#f59e0b'
    return '#ef4444'
  }

  const getPerformanceLevel = (rate: number) => {
    if (rate >= 90) return 'Excellent'
    if (rate >= 75) return 'Good'
    if (rate >= 60) return 'Average'
    return 'Needs Improvement'
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="person" size={48} color="#2563eb" />
        <Text style={styles.loadingText}>Loading Worker Profile...</Text>
      </View>
    )
  }

  if (!profileData) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load worker profile</Text>
        <Button mode="outlined" onPress={fetchWorkerProfile}>
          Retry
        </Button>
      </View>
    )
  }

  const { worker, statistics, attendanceHistory, trends } = profileData

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{workerName || worker?.fullName || 'Worker Profile'}</Text>
          <Text style={styles.headerSubtitle}>Attendance Profile</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Worker Info Card */}
        <Card style={styles.workerInfoCard}>
          <View style={styles.workerHeader}>
            <View style={styles.workerAvatar}>
              <MaterialIcons name="person" size={32} color="#ffffff" />
            </View>
            <View style={styles.workerDetails}>
              <Text style={styles.workerName}>{workerName || worker?.fullName}</Text>
              <Text style={styles.workerRole}>{worker?.role || 'Worker'}</Text>
              <Text style={styles.workerId}>ID: {workerId}</Text>
            </View>
            <View style={styles.performanceBadge}>
              <Text style={[styles.performanceText, { color: getAttendanceColor(statistics.attendanceRate) }]}>
                {getPerformanceLevel(statistics.attendanceRate)}
              </Text>
            </View>
          </View>
        </Card>

        {/* View Mode Selector */}
        <Card style={styles.viewModeCard}>
          <View style={styles.viewModeContainer}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'overview' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('overview')}
            >
              <Text style={[styles.viewModeText, viewMode === 'overview' && styles.viewModeTextActive]}>
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'history' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('history')}
            >
              <Text style={[styles.viewModeText, viewMode === 'history' && styles.viewModeTextActive]}>
                History
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'trends' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('trends')}
            >
              <Text style={[styles.viewModeText, viewMode === 'trends' && styles.viewModeTextActive]}>
                Trends
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Overview Mode */}
        {viewMode === 'overview' && (
          <>
            {/* Statistics Cards */}
            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <MaterialIcons name="calendar-today" size={24} color="#3b82f6" />
                <Text style={styles.statNumber}>{statistics.totalDays}</Text>
                <Text style={styles.statLabel}>Total Days</Text>
              </Card>
              
              <Card style={styles.statCard}>
                <MaterialIcons name="check-circle" size={24} color="#10b981" />
                <Text style={styles.statNumber}>{statistics.presentDays}</Text>
                <Text style={styles.statLabel}>Present</Text>
              </Card>
              
              <Card style={styles.statCard}>
                <MaterialIcons name="cancel" size={24} color="#ef4444" />
                <Text style={styles.statNumber}>{statistics.absentDays}</Text>
                <Text style={styles.statLabel}>Absent</Text>
              </Card>
              
              <Card style={styles.statCard}>
                <MaterialIcons name="schedule" size={24} color="#f59e0b" />
                <Text style={styles.statNumber}>{statistics.lateArrivals}</Text>
                <Text style={styles.statLabel}>Late Arrivals</Text>
              </Card>
            </View>

            {/* Attendance Rate */}
            <Card style={styles.attendanceRateCard}>
              <Text style={styles.cardTitle}>Attendance Rate</Text>
              <View style={styles.attendanceRateContainer}>
                <Text style={[styles.attendanceRateText, { color: getAttendanceColor(statistics.attendanceRate) }]}>
                  {statistics.attendanceRate.toFixed(1)}%
                </Text>
                <ProgressBar
                  progress={statistics.attendanceRate / 100}
                  color={getAttendanceColor(statistics.attendanceRate)}
                  style={styles.progressBar}
                />
              </View>
              <Text style={styles.averageCheckInText}>
                Average Check-in: {statistics.averageCheckInTime}
              </Text>
            </Card>
          </>
        )}

        {/* History Mode */}
        {viewMode === 'history' && (
          <Card style={styles.historyCard}>
            <Text style={styles.cardTitle}>Attendance History ({attendanceHistory.length} records)</Text>
            <View style={styles.historyList}>
              {attendanceHistory.slice(0, 20).map((record, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyDate}>
                    <Text style={styles.historyDateText}>{formatDate(record.timestamp)}</Text>
                  </View>
                  <View style={styles.historyStatus}>
                    <MaterialIcons
                      name={record.status === 'present' ? 'check-circle' : 'cancel'}
                      size={20}
                      color={record.status === 'present' ? '#10b981' : '#ef4444'}
                    />
                    <Text style={[
                      styles.historyStatusText,
                      { color: record.status === 'present' ? '#10b981' : '#ef4444' }
                    ]}>
                      {record.status.toUpperCase()}
                    </Text>
                  </View>
                  {record.photoUri && (
                    <MaterialIcons name="photo" size={16} color="#6b7280" />
                  )}
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Trends Mode */}
        {viewMode === 'trends' && (
          <>
            <Card style={styles.trendsCard}>
              <Text style={styles.cardTitle}>Weekly Trends</Text>
              <View style={styles.trendsList}>
                {trends.weeklyAttendance.map((trend, index) => (
                  <View key={index} style={styles.trendItem}>
                    <Text style={styles.trendLabel}>{trend.week}</Text>
                    <View style={styles.trendBar}>
                      <View
                        style={[
                          styles.trendProgress,
                          {
                            width: `${trend.rate}%`,
                            backgroundColor: getAttendanceColor(trend.rate)
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.trendValue}>{trend.rate.toFixed(1)}%</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card style={styles.trendsCard}>
              <Text style={styles.cardTitle}>Monthly Trends</Text>
              <View style={styles.trendsList}>
                {trends.monthlyAttendance.map((trend, index) => (
                  <View key={index} style={styles.trendItem}>
                    <Text style={styles.trendLabel}>{trend.month}</Text>
                    <View style={styles.trendBar}>
                      <View
                        style={[
                          styles.trendProgress,
                          {
                            width: `${trend.rate}%`,
                            backgroundColor: getAttendanceColor(trend.rate)
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.trendValue}>{trend.rate.toFixed(1)}%</Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    marginTop: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
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
  workerInfoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  workerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  workerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  workerRole: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  workerId: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  performanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  performanceText: {
    fontSize: 12,
    fontWeight: "600",
  },
  viewModeCard: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  viewModeContainer: {
    flexDirection: "row",
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  viewModeButtonActive: {
    backgroundColor: "#2563eb",
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  viewModeTextActive: {
    color: "#ffffff",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    margin: 16,
    marginTop: 8,
    gap: 12,
  },
  statCard: {
    width: (width - 56) / 2,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
  attendanceRateCard: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  attendanceRateContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  attendanceRateText: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  progressBar: {
    width: "100%",
    height: 8,
    borderRadius: 4,
  },
  averageCheckInText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  historyCard: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  historyDate: {
    flex: 1,
  },
  historyDateText: {
    fontSize: 14,
    color: "#374151",
  },
  historyStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  trendsCard: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  trendsList: {
    gap: 12,
  },
  trendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trendLabel: {
    fontSize: 14,
    color: "#374151",
    width: 80,
  },
  trendBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
  },
  trendProgress: {
    height: "100%",
    borderRadius: 4,
  },
  trendValue: {
    fontSize: 12,
    color: "#6b7280",
    width: 40,
    textAlign: "right",
  },
})

export default WorkerAttendanceProfile
