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

interface AnalyticsData {
  overview: {
    totalWorkers: number
    totalRecords: number
    averageAttendanceRate: number
    topPerformers: { workerId: string, workerName: string, rate: number }[]
    lowPerformers: { workerId: string, workerName: string, rate: number }[]
  }
  trends: {
    dailyAttendance: { date: string, present: number, absent: number, rate: number }[]
    weeklyTrends: { week: string, rate: number }[]
    monthlyTrends: { month: string, rate: number }[]
  }
  insights: {
    peakAttendanceDays: string[]
    lowAttendanceDays: string[]
    averageCheckInTime: string
    lateArrivalRate: number
  }
}

const AttendanceAnalytics = ({ navigation }: any) => {
  const { userData, hasPermission } = useRequireAuth(navigation)

  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate: new Date()
  })
  const [viewMode, setViewMode] = useState<'overview' | 'trends' | 'insights'>('overview')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      console.log("📊 [Analytics] Fetching attendance analytics")

      const data = await WorkerAttendanceService.getAttendanceAnalytics(dateRange)
      setAnalyticsData(data)
    } catch (error) {
      console.error("❌ [Analytics] Error fetching analytics:", error)
      Alert.alert("Error", "Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return '#10b981'
    if (rate >= 75) return '#f59e0b'
    return '#ef4444'
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="analytics" size={48} color="#2563eb" />
        <Text style={styles.loadingText}>Loading Analytics...</Text>
      </View>
    )
  }

  if (!analyticsData) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load analytics</Text>
        <Button mode="outlined" onPress={fetchAnalytics}>
          Retry
        </Button>
      </View>
    )
  }

  const { overview, trends, insights } = analyticsData

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Attendance Analytics</Text>
          <Text style={styles.headerSubtitle}>
            {formatDate(dateRange.startDate.toDateString())} - {formatDate(dateRange.endDate.toDateString())}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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
              style={[styles.viewModeButton, viewMode === 'trends' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('trends')}
            >
              <Text style={[styles.viewModeText, viewMode === 'trends' && styles.viewModeTextActive]}>
                Trends
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'insights' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('insights')}
            >
              <Text style={[styles.viewModeText, viewMode === 'insights' && styles.viewModeTextActive]}>
                Insights
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Overview Mode */}
        {viewMode === 'overview' && (
          <>
            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
              <Card style={styles.metricCard}>
                <MaterialIcons name="people" size={24} color="#3b82f6" />
                <Text style={styles.metricNumber}>{overview.totalWorkers}</Text>
                <Text style={styles.metricLabel}>Total Workers</Text>
              </Card>
              
              <Card style={styles.metricCard}>
                <MaterialIcons name="assignment" size={24} color="#8b5cf6" />
                <Text style={styles.metricNumber}>{overview.totalRecords}</Text>
                <Text style={styles.metricLabel}>Total Records</Text>
              </Card>
              
              <Card style={styles.metricCard}>
                <MaterialIcons name="trending-up" size={24} color="#10b981" />
                <Text style={[styles.metricNumber, { color: getPerformanceColor(overview.averageAttendanceRate) }]}>
                  {overview.averageAttendanceRate.toFixed(1)}%
                </Text>
                <Text style={styles.metricLabel}>Avg Attendance</Text>
              </Card>
              
              <Card style={styles.metricCard}>
                <MaterialIcons name="schedule" size={24} color="#f59e0b" />
                <Text style={styles.metricNumber}>{insights.averageCheckInTime}</Text>
                <Text style={styles.metricLabel}>Avg Check-in</Text>
              </Card>
            </View>

            {/* Top Performers */}
            <Card style={styles.performersCard}>
              <Text style={styles.cardTitle}>Top Performers</Text>
              <View style={styles.performersList}>
                {overview.topPerformers.map((performer, index) => (
                  <View key={performer.workerId} style={styles.performerItem}>
                    <View style={styles.performerRank}>
                      <Text style={styles.rankNumber}>{index + 1}</Text>
                    </View>
                    <View style={styles.performerInfo}>
                      <Text style={styles.performerName}>{performer.workerName}</Text>
                      <Text style={styles.performerId}>ID: {performer.workerId}</Text>
                    </View>
                    <View style={styles.performerRate}>
                      <Text style={[styles.rateText, { color: getPerformanceColor(performer.rate) }]}>
                        {performer.rate.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            {/* Low Performers */}
            <Card style={styles.performersCard}>
              <Text style={styles.cardTitle}>Needs Attention</Text>
              <View style={styles.performersList}>
                {overview.lowPerformers.map((performer, index) => (
                  <View key={performer.workerId} style={styles.performerItem}>
                    <View style={[styles.performerRank, styles.lowPerformerRank]}>
                      <MaterialIcons name="warning" size={16} color="#ef4444" />
                    </View>
                    <View style={styles.performerInfo}>
                      <Text style={styles.performerName}>{performer.workerName}</Text>
                      <Text style={styles.performerId}>ID: {performer.workerId}</Text>
                    </View>
                    <View style={styles.performerRate}>
                      <Text style={[styles.rateText, { color: getPerformanceColor(performer.rate) }]}>
                        {performer.rate.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}

        {/* Trends Mode */}
        {viewMode === 'trends' && (
          <>
            <Card style={styles.trendsCard}>
              <Text style={styles.cardTitle}>Daily Attendance Trends</Text>
              <View style={styles.trendsList}>
                {trends.dailyAttendance.slice(-14).map((day, index) => (
                  <View key={index} style={styles.trendItem}>
                    <Text style={styles.trendLabel}>{formatDate(day.date)}</Text>
                    <View style={styles.trendBars}>
                      <View style={styles.trendBar}>
                        <View
                          style={[
                            styles.trendProgress,
                            {
                              width: `${(day.present / (day.present + day.absent)) * 100}%`,
                              backgroundColor: '#10b981'
                            }
                          ]}
                        />
                      </View>
                      <Text style={styles.trendNumbers}>
                        {day.present}/{day.present + day.absent}
                      </Text>
                    </View>
                    <Text style={[styles.trendValue, { color: getPerformanceColor(day.rate) }]}>
                      {day.rate.toFixed(1)}%
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}

        {/* Insights Mode */}
        {viewMode === 'insights' && (
          <>
            <Card style={styles.insightsCard}>
              <Text style={styles.cardTitle}>Key Insights</Text>
              
              <View style={styles.insightItem}>
                <MaterialIcons name="trending-up" size={24} color="#10b981" />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Peak Attendance Days</Text>
                  <Text style={styles.insightText}>
                    {insights.peakAttendanceDays.map(day => formatDate(day)).join(', ')}
                  </Text>
                </View>
              </View>

              <View style={styles.insightItem}>
                <MaterialIcons name="trending-down" size={24} color="#ef4444" />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Low Attendance Days</Text>
                  <Text style={styles.insightText}>
                    {insights.lowAttendanceDays.map(day => formatDate(day)).join(', ')}
                  </Text>
                </View>
              </View>

              <View style={styles.insightItem}>
                <MaterialIcons name="schedule" size={24} color="#f59e0b" />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Late Arrival Rate</Text>
                  <Text style={styles.insightText}>
                    {insights.lateArrivalRate.toFixed(1)}% of workers arrive late
                  </Text>
                </View>
              </View>

              <View style={styles.insightItem}>
                <MaterialIcons name="access-time" size={24} color="#3b82f6" />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Average Check-in Time</Text>
                  <Text style={styles.insightText}>
                    Most workers check in around {insights.averageCheckInTime}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Recommendations */}
            <Card style={styles.recommendationsCard}>
              <Text style={styles.cardTitle}>Recommendations</Text>
              
              <View style={styles.recommendationsList}>
                {overview.averageAttendanceRate < 80 && (
                  <View style={styles.recommendationItem}>
                    <MaterialIcons name="lightbulb" size={20} color="#f59e0b" />
                    <Text style={styles.recommendationText}>
                      Overall attendance is below 80%. Consider implementing attendance incentives.
                    </Text>
                  </View>
                )}
                
                {insights.lateArrivalRate > 20 && (
                  <View style={styles.recommendationItem}>
                    <MaterialIcons name="lightbulb" size={20} color="#f59e0b" />
                    <Text style={styles.recommendationText}>
                      High late arrival rate detected. Review work start times and transportation.
                    </Text>
                  </View>
                )}
                
                {overview.lowPerformers.length > 3 && (
                  <View style={styles.recommendationItem}>
                    <MaterialIcons name="lightbulb" size={20} color="#f59e0b" />
                    <Text style={styles.recommendationText}>
                      Multiple workers need attention. Consider individual coaching sessions.
                    </Text>
                  </View>
                )}
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
  viewModeCard: {
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
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    margin: 16,
    marginTop: 8,
    gap: 12,
  },
  metricCard: {
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
  performersCard: {
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
  performersList: {
    gap: 12,
  },
  performerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  performerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  lowPerformerRank: {
    backgroundColor: "#fef2f2",
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  performerId: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  performerRate: {
    alignItems: "flex-end",
  },
  rateText: {
    fontSize: 16,
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
    fontSize: 12,
    color: "#374151",
    width: 60,
  },
  trendBars: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  trendNumbers: {
    fontSize: 10,
    color: "#6b7280",
    width: 30,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: "500",
    width: 40,
    textAlign: "right",
  },
  insightsCard: {
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
  insightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  recommendationsCard: {
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
  recommendationsList: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    backgroundColor: "#fffbeb",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  recommendationText: {
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
    flex: 1,
  },
})

export default AttendanceAnalytics
