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
} from "react-native"
import { Card, Text, Button, Chip, Searchbar } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import AdminSidebar from "../../components/AdminSidebar"
import {
  ContractorDriverConnectionService,
  ContractorDriverConnection,
  DataFlowTest
} from "../../../services/ContractorDriverConnectionService"
import ProtectedRoute from "../../components/ProtectedRoute"
import { useRequireAdmin } from "../../hooks/useRequireAuth"

const ContractorDriverConnectionTestScreen = ({ navigation }: any) => {
  const { hasAccess, userData } = useRequireAdmin(navigation)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [connections, setConnections] = useState<ContractorDriverConnection[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedConnection, setSelectedConnection] = useState<ContractorDriverConnection | null>(null)
  const [testResults, setTestResults] = useState<DataFlowTest | null>(null)
  const [showTestResults, setShowTestResults] = useState(false)

  useEffect(() => {
    if (hasAccess) {
      fetchConnections()
      setupRealTimeMonitoring()
    }
  }, [hasAccess])

  const fetchConnections = async () => {
    try {
      setLoading(true)
      console.log("🔍 [ConnectionTest] Fetching contractor-driver connections")

      const connectionsData = await ContractorDriverConnectionService.getAllContractorDriverConnections()
      setConnections(connectionsData)

      console.log("✅ [ConnectionTest] Fetched", connectionsData.length, "connections")
    } catch (error) {
      console.error("❌ [ConnectionTest] Error fetching connections:", error)
      Alert.alert("Error", "Failed to fetch connections. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const setupRealTimeMonitoring = () => {
    console.log("🔄 [ConnectionTest] Setting up real-time monitoring")

    const unsubscribe = ContractorDriverConnectionService.subscribeToConnectionChanges(
      (updatedConnections) => {
        console.log("📡 [ConnectionTest] Real-time update received")
        setConnections(updatedConnections)
      }
    )

    return unsubscribe
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchConnections()
    setRefreshing(false)
  }

  const testConnection = async (connection: ContractorDriverConnection) => {
    try {
      setLoading(true)
      console.log("🧪 [ConnectionTest] Testing connection:", connection.contractorName, "→", connection.driverName)

      const testResult = await ContractorDriverConnectionService.testContractorDriverConnection(
        connection.contractorId,
        connection.driverId
      )

      setTestResults(testResult)
      setSelectedConnection(connection)
      setShowTestResults(true)

      console.log("✅ [ConnectionTest] Test completed:", testResult.isDataConsistent ? "PASS" : "FAIL")
    } catch (error) {
      console.error("❌ [ConnectionTest] Error testing connection:", error)
      Alert.alert("Error", "Failed to test connection")
    } finally {
      setLoading(false)
    }
  }

  const fixConnection = async (connection: ContractorDriverConnection) => {
    Alert.alert(
      "Fix Connection",
      `Are you sure you want to fix the connection between ${connection.contractorName} and ${connection.driverName}?`,
      [
        { text: "Cancel" },
        {
          text: "Fix",
          onPress: async () => {
            try {
              setLoading(true)
              console.log("🔧 [ConnectionTest] Fixing connection")

              const result = await ContractorDriverConnectionService.fixContractorDriverConnection(
                connection.contractorId,
                connection.driverId
              )

              if (result.success) {
                Alert.alert("Success", result.message)
                fetchConnections()
              } else {
                Alert.alert("Error", result.message)
              }
            } catch (error) {
              console.error("❌ [ConnectionTest] Error fixing connection:", error)
              Alert.alert("Error", "Failed to fix connection")
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const filteredConnections = connections.filter(connection => {
    const query = searchQuery.toLowerCase()
    return connection.contractorName.toLowerCase().includes(query) ||
      connection.driverName.toLowerCase().includes(query)
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#10b981'
      case 'partial': return '#f59e0b'
      case 'disconnected': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'connected': return '#dcfce7'
      case 'partial': return '#fef3c7'
      case 'disconnected': return '#fecaca'
      default: return '#f3f4f6'
    }
  }

  if (!hasAccess) {
    return null
  }

  return (
    <ProtectedRoute requiredRole="admin" navigation={navigation}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1f2937" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuButton}>
            <MaterialIcons name="menu" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Connection Test</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <MaterialIcons name="refresh" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Statistics */}
          <Card style={styles.statsCard}>
            <Text style={styles.cardTitle}>Connection Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialIcons name="link" size={24} color="#3b82f6" />
                <Text style={styles.statNumber}>{connections.length}</Text>
                <Text style={styles.statLabel}>Total Connections</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="check-circle" size={24} color="#10b981" />
                <Text style={styles.statNumber}>
                  {connections.filter(c => c.connectionStatus === 'connected').length}
                </Text>
                <Text style={styles.statLabel}>Connected</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="warning" size={24} color="#f59e0b" />
                <Text style={styles.statNumber}>
                  {connections.filter(c => c.connectionStatus === 'partial').length}
                </Text>
                <Text style={styles.statLabel}>Issues</Text>
              </View>
            </View>
          </Card>

          {/* Search */}
          <Searchbar
            placeholder="Search connections..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />

          {/* Connections List */}
          <View style={styles.connectionsSection}>
            <Text style={styles.sectionTitle}>
              Contractor-Driver Connections ({filteredConnections.length})
            </Text>

            {filteredConnections.length > 0 ? (
              <View style={styles.connectionsList}>
                {filteredConnections.map((connection, index) => (
                  <Card key={`${connection.contractorId}-${connection.driverId}`} style={styles.connectionCard}>
                    <View style={styles.connectionContent}>
                      <View style={styles.connectionHeader}>
                        <View style={styles.connectionInfo}>
                          <Text style={styles.contractorName}>{connection.contractorName}</Text>
                          <Text style={styles.connectionArrow}>→</Text>
                          <Text style={styles.driverName}>{connection.driverName}</Text>
                        </View>
                        <Chip
                          style={[
                            styles.statusChip,
                            { backgroundColor: getStatusBgColor(connection.connectionStatus) }
                          ]}
                          textStyle={{ color: getStatusColor(connection.connectionStatus) }}
                        >
                          {connection.connectionStatus.toUpperCase()}
                        </Chip>
                      </View>

                      <View style={styles.connectionDetails}>
                        {connection.assignedVehicle && (
                          <View style={styles.detailRow}>
                            <MaterialIcons name="local-shipping" size={16} color="#6b7280" />
                            <Text style={styles.detailText}>
                              Vehicle: {connection.assignedVehicle.vehicleNumber}
                            </Text>
                          </View>
                        )}
                        <View style={styles.detailRow}>
                          <MaterialIcons name="location-on" size={16} color="#6b7280" />
                          <Text style={styles.detailText}>
                            Routes: {connection.assignedFeederPoints.length}
                          </Text>
                        </View>
                        {connection.issues.length > 0 && (
                          <View style={styles.issuesContainer}>
                            <MaterialIcons name="error" size={16} color="#ef4444" />
                            <Text style={styles.issuesText}>
                              {connection.issues.length} issue(s)
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.connectionActions}>
                        <Button
                          mode="outlined"
                          onPress={() => testConnection(connection)}
                          style={styles.testButton}
                          icon="bug-report"
                        >
                          Test
                        </Button>
                        {connection.issues.length > 0 && (
                          <Button
                            mode="contained"
                            onPress={() => fixConnection(connection)}
                            style={styles.fixButton}
                            icon="build"
                          >
                            Fix
                          </Button>
                        )}
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            ) : (
              <Card style={styles.emptyCard}>
                <MaterialIcons name="link-off" size={48} color="#9ca3af" />
                <Text style={styles.emptyTitle}>No Connections Found</Text>
                <Text style={styles.emptyText}>
                  No contractor-driver connections are currently active.
                </Text>
              </Card>
            )}
          </View>
        </ScrollView>

        {/* Admin Sidebar */}
        <AdminSidebar
          navigation={navigation}
          isVisible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          currentScreen="ContractorDriverConnectionTest"
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
  header: {
    backgroundColor: "#1f2937",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 50 : 16,
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // Statistics styles
  statsCard: {
    marginBottom: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
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
  },
  // Search styles
  searchBar: {
    marginBottom: 16,
    elevation: 2,
  },
  // Connections section styles
  connectionsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  connectionsList: {
    gap: 12,
  },
  connectionCard: {
    marginBottom: 8,
  },
  connectionContent: {
    padding: 16,
  },
  connectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  connectionInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  contractorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  connectionArrow: {
    fontSize: 16,
    color: "#6b7280",
    marginHorizontal: 8,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#3b82f6",
  },
  statusChip: {
    height: 28,
  },
  connectionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 4,
  },
  issuesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  issuesText: {
    fontSize: 14,
    color: "#ef4444",
    marginLeft: 4,
  },
  connectionActions: {
    flexDirection: "row",
    gap: 8,
  },
  testButton: {
    flex: 1,
    borderColor: "#3b82f6",
  },
  fixButton: {
    flex: 1,
    backgroundColor: "#f59e0b",
  },
  // Empty state styles
  emptyCard: {
    padding: 32,
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
  },
})

export default ContractorDriverConnectionTestScreen
