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
import { Card, Text, Button, Chip, ProgressBar } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { useRequireAuth } from "../../hooks/useRequireAuth"
import { DriverService, DriverDashboardData } from "../../../services/DriverService"
import EnhancedFeederPointsList from "../../components/EnhancedFeederPointsList"
import { useQuickLogout } from "../../hooks/useLogout"
import DriverSidebar from "../../components/DriverSidebar"

const { width } = Dimensions.get("window")

// Enhanced interfaces for driver dashboard
interface AssignedVehicle {
  id: string
  vehicleNumber: string
  type: string
  capacity: number
  status: string
  fuelLevel?: number
  contractorName?: string
}

interface AssignedFeederPoint {
  id: string
  feederPointName: string
  areaName: string
  wardNumber: string
  nearestLandmark: string
  approximateHouseholds: string
  completedTrips: number
  totalTrips: number
  nextTripTime?: string
}

interface TodayStats {
  totalTrips: number
  completedTrips: number
  pendingTrips: number
  totalWasteCollected: number
  workersPresent: number
  totalWorkers: number
  shiftStartTime?: string
  estimatedEndTime?: string
}

const DriverDashboard = ({ navigation }: any) => {
  const { userData } = useRequireAuth(navigation)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DriverDashboardData | null>(null)
  const [assignedVehicle, setAssignedVehicle] = useState<AssignedVehicle | null>(null)
  const [assignedFeederPoints, setAssignedFeederPoints] = useState<AssignedFeederPoint[]>([])
  const [contractorInfo, setContractorInfo] = useState<{
    id: string
    name: string
    contact?: string
  } | null>(null)
  const [todayStats, setTodayStats] = useState<TodayStats>({
    totalTrips: 0,
    completedTrips: 0,
    pendingTrips: 0,
    totalWasteCollected: 0,
    workersPresent: 0,
    totalWorkers: 0
  })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<'trips' | 'waste' | 'workers'>('trips')

  useEffect(() => {
    console.log("🔄 [DriverDashboard] useEffect triggered with userData:", {
      uid: userData?.uid,
      email: userData?.email,
      fullName: userData?.fullName,
      role: userData?.role
    })

    if (userData?.uid) {
      fetchDashboardData()
      setupRealTimeListeners()
    } else {
      console.warn("⚠️ [DriverDashboard] No userData available")
    }
  }, [userData])

  const fetchDashboardData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      console.log("🚛 [DriverDashboard] Fetching dashboard data for driver:", userData?.uid, forceRefresh ? "(FORCE REFRESH)" : "")
      console.log("👤 [DriverDashboard] Current user data:", {
        uid: userData?.uid,
        email: userData?.email,
        fullName: userData?.fullName,
        role: userData?.role,
        contractorId: userData?.contractorId
      })

      if (!userData?.uid) {
        console.error("❌ [DriverDashboard] No user ID available")
        Alert.alert("Error", "User session invalid. Please log in again.")
        return
      }

      // First verify driver assignments from contractor assignments
      console.log("🔍 [DriverDashboard] Verifying driver assignments...")
      await DriverService.verifyDriverAssignments(userData.uid)

      if (forceRefresh) {
        console.log("🔄 [DriverDashboard] Force refresh - clearing any cached data...")
        // Clear current state to show fresh data
        setAssignedVehicle(null)
        setAssignedFeederPoints([])
        setContractorInfo(null)
      }

      // Use enhanced method that includes daily assignments
      const data = await DriverService.getDriverDashboardDataWithDailyAssignments(userData.uid)
      console.log("📊 [DriverDashboard] Dashboard data received:", {
        driverId: data.driverId,
        driverName: data.driverName,
        hasVehicle: !!data.assignedVehicle,
        vehicleDetails: data.assignedVehicle ? {
          id: data.assignedVehicle.id,
          vehicleNumber: data.assignedVehicle.vehicleNumber,
          type: data.assignedVehicle.type
        } : null,
        feederPointsCount: data.assignedFeederPoints.length,
        feederPointDetails: data.assignedFeederPoints.slice(0, 3).map(fp => ({
          id: fp.id,
          name: fp.feederPointName,
          area: fp.areaName
        })),
        hasContractor: !!data.contractorInfo,
        contractorDetails: data.contractorInfo ? {
          id: data.contractorInfo.id,
          name: data.contractorInfo.name
        } : null
      })

      setDashboardData(data)

      // Set individual state items for easier access
      setAssignedVehicle(data.assignedVehicle)
      setAssignedFeederPoints(data.assignedFeederPoints)
      setContractorInfo(data.contractorInfo)
      setTodayStats({
        totalTrips: data.todayTrips.total,
        completedTrips: data.todayTrips.completed,
        pendingTrips: data.todayTrips.pending,
        totalWasteCollected: data.todayTrips.totalWasteCollected,
        workersPresent: data.assignedWorkers.present,
        totalWorkers: data.assignedWorkers.total
      })

      setLastUpdated(new Date())
      console.log("✅ [DriverDashboard] Dashboard data loaded successfully")
    } catch (error) {
      console.error("❌ [DriverDashboard] Error fetching dashboard data:", error)
      Alert.alert("Error", "Failed to load dashboard data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const setupRealTimeListeners = () => {
    if (!userData?.uid) return

    console.log("🔄 [DriverDashboard] Setting up real-time listeners")

    // Listen to driver assignment changes
    const unsubscribe = DriverService.subscribeToDriverData(
      userData.uid,
      (data: DriverDashboardData) => {
        console.log("📡 [DriverDashboard] Real-time update received:", {
          hasVehicle: !!data.assignedVehicle,
          vehicleId: data.assignedVehicle?.id,
          feederPointsCount: data.assignedFeederPoints.length,
          hasContractor: !!data.contractorInfo,
          feederPointDetails: data.assignedFeederPoints.slice(0, 3).map(fp => ({
            id: fp.id,
            name: fp.feederPointName,
            area: fp.areaName
          }))
        })
        setDashboardData(data)
        setAssignedVehicle(data.assignedVehicle)
        setAssignedFeederPoints(data.assignedFeederPoints)
        setContractorInfo(data.contractorInfo)

        // If we received valid feeder point data, stop loading
        if (data.assignedFeederPoints.length > 0 && data.assignedFeederPoints[0].feederPointName) {
          setLoading(false)
        }
        setTodayStats({
          totalTrips: data.todayTrips.total,
          completedTrips: data.todayTrips.completed,
          pendingTrips: data.todayTrips.pending,
          totalWasteCollected: data.todayTrips.totalWasteCollected,
          workersPresent: data.assignedWorkers.present,
          totalWorkers: data.assignedWorkers.total
        })
      }
    )

    return unsubscribe
  }

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    await fetchDashboardData(true) // Force refresh on pull-to-refresh
    setRefreshing(false)
  }, [])

  // Using professional logout - import useQuickLogout at the top
  const { quickLogout, AlertComponent } = useQuickLogout(navigation)

  const handleAction = (action: string) => {
    switch (action) {
      case "startTrip":
        handleStartTrip()
        break
      case "attendance":
        handleWorkerAttendance()
        break
      case "reportIssue":
        Alert.alert("Report Issue", "Issue reporting will be implemented soon")
        break
      case "viewRoute":
        handleViewRoute()
        break
      case "viewHistory":
        Alert.alert("Collection Log", "History viewing will be implemented soon")
        break
      case "connectionTest":
        handleConnectionTest()
        break
      case "debugInfo":
        handleDebugInfo()
        break
      default:
        break
    }
  }

  const handleStartTrip = () => {
    if (!assignedVehicle) {
      Alert.alert("No Vehicle Assigned", "Please contact your contractor to assign a vehicle.")
      return
    }

    if (assignedFeederPoints.length === 0) {
      Alert.alert("No Routes Assigned", "Please contact your contractor to assign collection routes.")
      return
    }

    navigation.navigate('TripRecording', {
      vehicleId: assignedVehicle.id,
      feederPoints: assignedFeederPoints,
      driverId: userData?.uid
    })
  }

  const handleViewRoute = () => {
    if (assignedFeederPoints.length === 0) {
      Alert.alert("No Routes Assigned", "Please contact your contractor to assign collection routes.")
      return
    }

    navigation.navigate('RouteMap', {
      feederPoints: assignedFeederPoints,
      vehicleId: assignedVehicle?.id
    })
  }

  const handleWorkerAttendance = () => {
    navigation.navigate('WorkerAttendance', {
      driverId: userData?.uid,
      vehicleId: assignedVehicle?.id
    })
  }

  const handleConnectionTest = async () => {
    try {
      setLoading(true)
      if (!userData?.contractorId || !userData?.uid) {
        Alert.alert("No Contractor", "You are not assigned to any contractor yet.")
        return
      }

      const { ContractorDriverConnectionService } = await import("../../../services/ContractorDriverConnectionService")
      const testResult = await ContractorDriverConnectionService.testContractorDriverConnection(
        userData.contractorId,
        userData.uid
      )

      const statusMessage = testResult.isDataConsistent
        ? "✅ Connection is working properly!"
        : `❌ Connection issues found:\n${testResult.inconsistencies.join('\n')}`

      Alert.alert(
        "Connection Status",
        statusMessage,
        [
          { text: "Refresh Data", onPress: () => fetchDashboardData(true) },
          { text: "OK" }
        ]
      )
    } catch (error) {
      console.error("❌ [DriverDashboard] Error testing connection:", error)
      Alert.alert("Error", "Failed to test connection")
    } finally {
      setLoading(false)
    }
  }

  const handleDebugInfo = () => {
    Alert.alert(
      "Debug Info",
      `Driver ID: ${userData?.uid}\nEmail: ${userData?.email}\nVehicle: ${assignedVehicle?.vehicleNumber || "None"}\nRoutes: ${assignedFeederPoints.length}\nContractor: ${contractorInfo?.name || "None"}`,
      [
        { text: "Refresh Data", onPress: () => fetchDashboardData(true) },
        { text: "OK" }
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="local-shipping" size={48} color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Driver Dashboard...</Text>
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
            <View style={styles.driverBadge}>
              <MaterialIcons name="local-shipping" size={24} color="#3b82f6" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{userData?.fullName || "Driver"}</Text>
              <Text style={styles.roleText}>Driver</Text>
              {lastUpdated && (
                <Text style={styles.lastUpdatedText}>
                  Updated: {lastUpdated.toLocaleTimeString()}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => fetchDashboardData(true)}
              style={styles.refreshButton}
            >
              <MaterialIcons name="refresh" size={20} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                console.log("🐛 [DEBUG] Driver Dashboard State:", {
                  driverId: userData?.uid,
                  assignedFeederPointsCount: assignedFeederPoints.length,
                  assignedVehicle: assignedVehicle?.vehicleNumber,
                  contractorInfo: contractorInfo?.name,
                  todayStats
                })
                Alert.alert(
                  "Debug Info",
                  `Driver ID: ${userData?.uid}\nRoutes: ${assignedFeederPoints.length}\nVehicle: ${assignedVehicle?.vehicleNumber || "None"}\nContractor: ${contractorInfo?.name || "None"}`,
                  [
                    { text: "Refresh", onPress: () => fetchDashboardData(true) },
                    {
                      text: "Test Daily Assignment", onPress: async () => {
                        if (userData?.uid) {
                          try {
                            const todayAssignment = await DriverService.getTodayDailyAssignment(userData.uid)
                            Alert.alert("Daily Assignment Test", `Found ${todayAssignment.length} routes for today`)
                          } catch (error) {
                            Alert.alert("Error", `Failed to test: ${error}`)
                          }
                        }
                      }
                    },
                    { text: "OK" }
                  ]
                )
              }}
              style={styles.debugButton}
            >
              <MaterialIcons name="bug-report" size={20} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={quickLogout} style={styles.logoutButton}>
              <MaterialIcons name="logout" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Statistics Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            <TouchableOpacity onPress={() => setSelectedInsight('trips')} activeOpacity={0.8}>
              <Card style={[styles.statCard, selectedInsight === 'trips' && styles.statCardActive]}>
                <View style={styles.statContent}>
                  <View style={[styles.statIcon, { backgroundColor: '#eff6ff' }]}>
                    <MaterialIcons name="route" size={24} color="#3b82f6" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statNumber}>{todayStats.completedTrips}/{todayStats.totalTrips}</Text>
                    <Text style={styles.statLabel}>Trips</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSelectedInsight('waste')} activeOpacity={0.8}>
              <Card style={[styles.statCard, selectedInsight === 'waste' && styles.statCardActive]}>
                <View style={styles.statContent}>
                  <View style={[styles.statIcon, { backgroundColor: '#f0fdf4' }]}>
                    <MaterialIcons name="scale" size={24} color="#10b981" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statNumber}>{todayStats.totalWasteCollected}kg</Text>
                    <Text style={styles.statLabel}>Waste Collected</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSelectedInsight('workers')} activeOpacity={0.8}>
              <Card style={[styles.statCard, selectedInsight === 'workers' && styles.statCardActive]}>
                <View style={styles.statContent}>
                  <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                    <MaterialIcons name="people" size={24} color="#f59e0b" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statNumber}>{todayStats.workersPresent}/{todayStats.totalWorkers}</Text>
                    <Text style={styles.statLabel}>Workers</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSelectedInsight('trips')} activeOpacity={0.8}>
              <Card style={styles.statCard}>
                <View style={styles.statContent}>
                  <View style={[styles.statIcon, { backgroundColor: '#faf5ff' }]}>
                    <MaterialIcons name="pending" size={24} color="#8b5cf6" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statNumber}>{todayStats.pendingTrips}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        </View>

        {/* Performance Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          <Card style={styles.insightsCard}>
            <View style={styles.insightTabs}>
              <Chip
                selected={selectedInsight === 'trips'}
                onPress={() => setSelectedInsight('trips')}
                style={styles.insightChip}
              >
                Trip Progress
              </Chip>
              <Chip
                selected={selectedInsight === 'waste'}
                onPress={() => setSelectedInsight('waste')}
                style={styles.insightChip}
              >
                Waste
              </Chip>
              <Chip
                selected={selectedInsight === 'workers'}
                onPress={() => setSelectedInsight('workers')}
                style={styles.insightChip}
              >
                Workforce
              </Chip>
            </View>

            {(() => {
              const totalTrips = Math.max(todayStats.totalTrips, 0)
              const tripProgress = totalTrips > 0 ? todayStats.completedTrips / totalTrips : 0
              const wasteTarget = assignedFeederPoints.length > 0 ? assignedFeederPoints.length * 150 : 1000
              const wasteProgress = wasteTarget > 0 ? Math.min(todayStats.totalWasteCollected / wasteTarget, 1) : 0
              const workerTotal = Math.max(todayStats.totalWorkers, 0)
              const workerProgress = workerTotal > 0 ? todayStats.workersPresent / workerTotal : 0

              const insightMap = {
                trips: {
                  title: "Trips Completed",
                  metric: `${todayStats.completedTrips} of ${todayStats.totalTrips}`,
                  description: todayStats.totalTrips > 0
                    ? `You have completed ${todayStats.completedTrips} trips so far. ${todayStats.pendingTrips} remaining.`
                    : "No trips assigned for today yet.",
                  progress: tripProgress,
                  color: "#3b82f6",
                  actionLabel: "Start Next Trip",
                  actionKey: "startTrip" as const,
                },
                waste: {
                  title: "Waste Collected",
                  metric: `${todayStats.totalWasteCollected} kg`,
                  description: wasteTarget > 0
                    ? `Target: ${wasteTarget} kg based on assigned routes.`
                    : "Collecting starts once routes are assigned.",
                  progress: wasteProgress,
                  color: "#10b981",
                  actionLabel: "View Route",
                  actionKey: "viewRoute" as const,
                },
                workers: {
                  title: "Workers Present",
                  metric: `${todayStats.workersPresent} of ${todayStats.totalWorkers}`,
                  description: workerTotal > 0
                    ? `${todayStats.workersPresent} workers have checked in today.`
                    : "No workers assigned to your route yet.",
                  progress: workerProgress,
                  color: "#f59e0b",
                  actionLabel: "Mark Attendance",
                  actionKey: "attendance" as const,
                }
              }

              const insight = insightMap[selectedInsight]

              return (
                <>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                    <Text style={[styles.insightMetric, { color: insight.color }]}>{insight.metric}</Text>
                  </View>
                  <ProgressBar progress={insight.progress} color={insight.color} style={styles.insightProgress} />
                  <Text style={styles.insightDescription}>{insight.description}</Text>
                  <View style={styles.insightFooter}>
                    <Button
                      mode="contained"
                      onPress={() => handleAction(insight.actionKey)}
                      style={styles.insightButton}
                      buttonColor={insight.color}
                      icon={selectedInsight === 'trips' ? 'play' : selectedInsight === 'waste' ? 'map' : 'check'}
                    >
                      {insight.actionLabel}
                    </Button>
                    <Button
                      mode="text"
                      onPress={() => setSidebarVisible(true)}
                      textColor="#3b82f6"
                    >
                      Open Tools
                    </Button>
                  </View>
                </>
              )
            })()}
          </Card>
        </View>

        {/* Assigned Vehicle */}
        {assignedVehicle ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Vehicle</Text>
            <Card style={styles.vehicleCard}>
              <View style={styles.vehicleContent}>
                <View style={styles.vehicleHeader}>
                  <MaterialIcons name="local-shipping" size={24} color="#3b82f6" />
                  <Text style={styles.vehicleNumber}>{assignedVehicle.vehicleNumber}</Text>
                  <Chip
                    mode="outlined"
                    style={[styles.statusChip, {
                      backgroundColor: assignedVehicle.status === 'active' ? '#dcfce7' : '#fef3c7'
                    }]}
                  >
                    {assignedVehicle.status}
                  </Chip>
                </View>
                <View style={styles.vehicleDetails}>
                  <Text style={styles.vehicleType}>{assignedVehicle.type} • {assignedVehicle.capacity}kg capacity</Text>
                  {assignedVehicle.contractorName && (
                    <Text style={styles.contractorName}>Contractor: {assignedVehicle.contractorName}</Text>
                  )}
                </View>
                {assignedVehicle.fuelLevel && (
                  <View style={styles.fuelInfo}>
                    <MaterialIcons name="local-gas-station" size={20} color="#6b7280" />
                    <Text style={styles.fuelLevel}>Fuel: {assignedVehicle.fuelLevel}%</Text>
                  </View>
                )}
              </View>
            </Card>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Assignment</Text>
            <Card style={styles.noAssignmentCard}>
              <MaterialIcons name="warning" size={48} color="#f59e0b" />
              <Text style={styles.noAssignmentTitle}>No Vehicle Assigned</Text>
              <Text style={styles.noAssignmentText}>
                Please contact your contractor to get a vehicle assignment.
              </Text>
            </Card>
          </View>
        )}

        {/* Enhanced Assigned Feeder Points */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Routes ({assignedFeederPoints.length} locations)</Text>
            {assignedFeederPoints.length > 0 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => {
                  // Navigate to detailed routes view if needed
                  console.log("View all routes pressed")
                }}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <MaterialIcons name="arrow-forward" size={16} color="#3b82f6" />
              </TouchableOpacity>
            )}
          </View>

          {assignedFeederPoints.length > 0 ? (
            <EnhancedFeederPointsList
              feederPoints={assignedFeederPoints}
              onFeederPointPress={(feederPoint) => {
                console.log("Feeder point pressed:", feederPoint.feederPointName)
                // Navigate to feeder point details or trip start screen
              }}
              onStartTrip={(feederPoint) => {
                console.log("Start trip for:", feederPoint.feederPointName)
                // Navigate to location-based trip start screen
                if (!assignedVehicle) {
                  Alert.alert("No Vehicle Assigned", "Please contact your contractor to assign a vehicle.")
                  return
                }

                navigation.navigate('LocationBasedTripStart', {
                  feederPoint,
                  vehicleId: assignedVehicle.id,
                  vehicleNumber: assignedVehicle.vehicleNumber
                })
              }}
              showSearch={true}
              showGrouping={true}
            />
          ) : (
            <Card style={styles.noAssignmentCard}>
              <MaterialIcons name="map" size={48} color="#f59e0b" />
              <Text style={styles.noAssignmentTitle}>No Routes Assigned</Text>
              <Text style={styles.noAssignmentText}>
                Please contact your contractor to get route assignments.
              </Text>
            </Card>
          )}
        </View>

        {/* Contractor Information */}
        {contractorInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contractor Information</Text>
            <Card style={styles.contractorCard}>
              <View style={styles.contractorContent}>
                <View style={styles.contractorHeader}>
                  <MaterialIcons name="business" size={24} color="#3b82f6" />
                  <Text style={styles.contractorTitle}>{contractorInfo.name}</Text>
                </View>
                {contractorInfo.contact && (
                  <View style={styles.contractorContact}>
                    <MaterialIcons name="phone" size={16} color="#6b7280" />
                    <Text style={styles.contactText}>{contractorInfo.contact}</Text>
                  </View>
                )}
                <View style={styles.contractorActions}>
                  <View style={styles.contractorButtonsRow}>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        navigation.navigate('ContractorCommunication', {
                          contractorId: contractorInfo.id,
                          contractorName: contractorInfo.name
                        })
                      }}
                      style={[styles.contactButton, { flex: 1, marginRight: 8 }]}
                      icon="chat"
                    >
                      Message
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        if (contractorInfo.contact) {
                          Alert.alert(
                            "Contact Contractor",
                            `Call ${contractorInfo.name}?`,
                            [
                              { text: "Cancel" },
                              {
                                text: "Call", onPress: () => {
                                  // TODO: Implement phone call functionality
                                  Alert.alert("Feature Coming Soon", "Phone call functionality will be implemented soon.")
                                }
                              }
                            ]
                          )
                        }
                      }}
                      style={[styles.contactButton, { flex: 1 }]}
                      icon="phone"
                    >
                      Call
                    </Button>
                  </View>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Quick actions moved to sidebar */}

        {/* Current Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Status</Text>
          <Card style={styles.statusCard}>
            <View style={styles.statusContent}>
              <View style={styles.statusHeader}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.statusText}>{dashboardData?.shiftInfo.status === 'in_progress' ? 'On Duty' : 'Available'}</Text>
                </View>
                <Text style={styles.statusTime}>Last updated: Just now</Text>
              </View>

              <View style={styles.statusDetails}>
                <View style={styles.statusItem}>
                  <MaterialIcons name="schedule" size={16} color="#6b7280" />
                  <Text style={styles.statusItemText}>Shift: 8:00 AM - 6:00 PM</Text>
                </View>
                <View style={styles.statusItem}>
                  <MaterialIcons name="location-on" size={16} color="#6b7280" />
                  <Text style={styles.statusItemText}>Zone: Central District</Text>
                </View>
                <View style={styles.statusItem}>
                  <MaterialIcons name="local-shipping" size={16} color="#6b7280" />
                  <Text style={styles.statusItemText}>Vehicle: DL-01-AB-1234</Text>
                </View>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Professional Alert Component */}
      <AlertComponent />

      <DriverSidebar
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onSelectAction={handleAction}
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
  menuButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  driverBadge: {
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
  lastUpdatedText: {
    fontSize: 10,
    color: "#9ca3af",
    fontStyle: "italic",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
  },
  debugButton: {
    padding: 8,
    borderRadius: 8,
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
  statCardActive: {
    borderWidth: 2,
    borderColor: "#3b82f6",
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
  insightsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  insightTabs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  insightChip: {
    backgroundColor: "#f3f4f6",
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  insightMetric: {
    fontSize: 16,
    fontWeight: "700",
  },
  insightProgress: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  insightDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  insightFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  insightButton: {
    flex: 1,
    marginRight: 12,
  },
  // Status styles
  statusCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statusContent: {
    padding: 20,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  statusTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  statusDetails: {
    gap: 12,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusItemText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
  },
  // Vehicle styles
  vehicleCard: {
    marginBottom: 16,
  },
  vehicleContent: {
    padding: 16,
  },
  vehicleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  vehicleNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 8,
    flex: 1,
  },
  statusChip: {
    height: 28,
  },
  vehicleDetails: {
    marginBottom: 12,
  },
  vehicleType: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  contractorName: {
    fontSize: 12,
    color: "#9ca3af",
  },
  fuelInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  fuelLevel: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 4,
  },
  // No assignment styles
  noAssignmentCard: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#fef3c7",
  },
  noAssignmentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400e",
    marginTop: 12,
    marginBottom: 8,
  },
  noAssignmentText: {
    fontSize: 14,
    color: "#a16207",
    textAlign: "center",
    lineHeight: 20,
  },
  // Feeder points styles
  feederPointsList: {
    gap: 12,
  },
  feederPointCard: {
    marginBottom: 8,
  },
  feederPointContent: {
    padding: 16,
  },
  feederPointHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  feederPointName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 8,
    flex: 1,
  },
  tripProgress: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tripCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3b82f6",
  },
  feederPointArea: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  feederPointLandmark: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 8,
  },
  feederPointStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  householdsText: {
    fontSize: 12,
    color: "#6b7280",
  },
  nextTripTime: {
    fontSize: 12,
    color: "#f59e0b",
    fontWeight: "500",
  },
  completedText: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "500",
  },
  // Contractor styles
  contractorCard: {
    marginBottom: 16,
  },
  contractorContent: {
    padding: 16,
  },
  contractorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  contractorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 8,
  },
  contractorContact: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 4,
  },
  contractorActions: {
    alignItems: "flex-start",
  },
  contactButton: {
    borderColor: "#3b82f6",
  },
  contractorButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
  },
})

export default DriverDashboard
