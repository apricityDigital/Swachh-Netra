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
  Modal,
  Image,
} from "react-native"
import { Card, Text, Button, Chip, Searchbar, DataTable } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { PieChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp
} from 'firebase/firestore'
import { FIRESTORE_DB } from "../../../FirebaseConfig"
import { useRequireAuth } from "../../hooks/useRequireAuth"
import { WorkerAttendanceService } from "../../../services/WorkerAttendanceService"
import AdminHeader from "../../components/AdminHeader"
import AdminSidebar from "../../components/AdminSidebar"

interface AttendanceRecord {
  id: string
  workerId: string
  workerName: string
  feederPointId: string
  feederPointName: string
  driverId: string
  driverName: string
  tripId: string
  status: 'present' | 'absent'
  timestamp: Date
  location: {
    latitude: number
    longitude: number
  }
  photoUri?: string
  notes?: string
}

interface AttendanceStats {
  totalRecords: number
  presentCount: number
  absentCount: number
  attendanceRate: number
}

const AttendanceDashboard = ({ navigation }: any) => {
  const { userData, hasPermission } = useRequireAuth(navigation, {
    requiredRole: 'admin',
    requiredPermission: 'canViewAllAttendance'
  })

  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<AttendanceStats>({
    totalRecords: 0,
    presentCount: 0,
    absentCount: 0,
    attendanceRate: 0
  })
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  // Enhanced filtering and management states
  const [viewMode, setViewMode] = useState<'day' | 'range' | 'monthly'>('day')
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [employeeFilter, setEmployeeFilter] = useState("")
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  useEffect(() => {
    fetchAttendanceData()
  }, [selectedDate])

  useEffect(() => {
    filterRecords()
  }, [attendanceRecords, searchQuery])

  const fetchAttendanceData = async () => {
    try {
      setLoading(true)
      console.log("🔄 [AttendanceDashboard] Fetching attendance data...")

      // Get start and end of selected date
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      const attendanceQuery = query(
        collection(FIRESTORE_DB, "workerAttendance"),
        where("timestamp", ">=", startOfDay),
        where("timestamp", "<=", endOfDay),
        orderBy("timestamp", "desc")
      )

      const attendanceSnapshot = await getDocs(attendanceQuery)
      const records: AttendanceRecord[] = []

      attendanceSnapshot.forEach((doc) => {
        const data = doc.data()
        records.push({
          id: doc.id,
          workerId: data.workerId || "",
          workerName: data.workerName || "Unknown Worker",
          feederPointId: data.feederPointId || "",
          feederPointName: data.feederPointName || "Unknown Point",
          driverId: data.driverId || "",
          driverName: data.driverName || "Unknown Driver",
          tripId: data.tripId || "",
          status: data.status || "absent",
          timestamp: data.timestamp?.toDate() || new Date(),
          location: data.location || { latitude: 0, longitude: 0 },
          photoUri: data.photoUri,
          notes: data.notes
        })
      })

      setAttendanceRecords(records)

      // Calculate stats
      const presentCount = records.filter(r => r.status === 'present').length
      const absentCount = records.filter(r => r.status === 'absent').length
      const totalRecords = records.length
      const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0

      setStats({
        totalRecords,
        presentCount,
        absentCount,
        attendanceRate
      })

      console.log(`✅ [AttendanceDashboard] Found ${records.length} attendance records`)
    } catch (error) {
      console.error("❌ [AttendanceDashboard] Error fetching attendance data:", error)
      Alert.alert("Error", "Failed to fetch attendance data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const filterRecords = () => {
    if (!searchQuery.trim()) {
      setFilteredRecords(attendanceRecords)
    } else {
      const filtered = attendanceRecords.filter(record =>
        record.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.feederPointName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.driverName.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredRecords(filtered)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchAttendanceData().finally(() => setRefreshing(false))
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return '#10b981'
      case 'absent': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return 'check-circle'
      case 'absent': return 'cancel'
      default: return 'help'
    }
  }

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  // Management functions
  const handleEditRecord = (record: AttendanceRecord) => {
    setEditingRecord(record)
    setShowEditModal(true)
  }

  const handleUpdateRecord = async (updatedRecord: AttendanceRecord) => {
    try {
      // Update the record in the database
      await WorkerAttendanceService.updateAttendanceRecord(updatedRecord.id, {
        status: updatedRecord.status,
        notes: updatedRecord.notes,
        timestamp: updatedRecord.timestamp
      })

      // Update local state
      setAttendanceRecords(prev =>
        prev.map(record =>
          record.id === updatedRecord.id ? updatedRecord : record
        )
      )

      setShowEditModal(false)
      setEditingRecord(null)
      Alert.alert("Success", "Attendance record updated successfully")
    } catch (error) {
      console.error("Error updating record:", error)
      Alert.alert("Error", "Failed to update attendance record")
    }
  }

  const toggleBulkMode = () => {
    setBulkMode(!bulkMode)
    setSelectedRecords(new Set())
    setShowBulkActions(false)
  }

  const toggleRecordSelection = (recordId: string) => {
    const newSelection = new Set(selectedRecords)
    if (newSelection.has(recordId)) {
      newSelection.delete(recordId)
    } else {
      newSelection.add(recordId)
    }
    setSelectedRecords(newSelection)
    setShowBulkActions(newSelection.size > 0)
  }

  const handleBulkMarkPresent = async () => {
    try {
      const recordsToUpdate = Array.from(selectedRecords)
      await WorkerAttendanceService.bulkUpdateAttendanceStatus(recordsToUpdate, 'present')

      // Update local state
      setAttendanceRecords(prev =>
        prev.map(record =>
          selectedRecords.has(record.id) ? { ...record, status: 'present' } : record
        )
      )

      setSelectedRecords(new Set())
      setShowBulkActions(false)
      Alert.alert("Success", `Marked ${recordsToUpdate.length} workers as present`)
    } catch (error) {
      console.error("Error in bulk update:", error)
      Alert.alert("Error", "Failed to update attendance records")
    }
  }

  const handleBulkMarkAbsent = async () => {
    try {
      const recordsToUpdate = Array.from(selectedRecords)
      await WorkerAttendanceService.bulkUpdateAttendanceStatus(recordsToUpdate, 'absent')

      // Update local state
      setAttendanceRecords(prev =>
        prev.map(record =>
          selectedRecords.has(record.id) ? { ...record, status: 'absent' } : record
        )
      )

      setSelectedRecords(new Set())
      setShowBulkActions(false)
      Alert.alert("Success", `Marked ${recordsToUpdate.length} workers as absent`)
    } catch (error) {
      console.error("Error in bulk update:", error)
      Alert.alert("Error", "Failed to update attendance records")
    }
  }

  const exportAttendanceData = () => {
    Alert.alert("Coming Soon", "Attendance export functionality will be implemented")
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="people" size={48} color="#2563eb" />
        <Text style={styles.loadingText}>Loading Attendance Data...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <AdminHeader
        title="Attendance Dashboard"
        subtitle="Worker attendance tracking"
        showMenuButton={true}
        onMenuPress={() => setSidebarVisible(true)}
        userName={userData?.displayName || userData?.email}
      />

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Date Navigation */}
        <Card style={styles.dateCard}>
          <View style={styles.dateNavigation}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => handleDateChange(-1)}
            >
              <MaterialIcons name="chevron-left" size={24} color="#2563eb" />
            </TouchableOpacity>

            <View style={styles.dateInfo}>
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
              <Text style={styles.dateSubtext}>
                {selectedDate.toDateString() === new Date().toDateString() ? "Today" : ""}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => handleDateChange(1)}
              disabled={selectedDate.toDateString() === new Date().toDateString()}
            >
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={selectedDate.toDateString() === new Date().toDateString() ? "#9ca3af" : "#2563eb"}
              />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Statistics */}
        <Card style={styles.statsCard}>
          <Text style={styles.cardTitle}>Attendance Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialIcons name="people" size={24} color="#3b82f6" />
              <Text style={styles.statNumber}>{stats.totalRecords}</Text>
              <Text style={styles.statLabel}>Total Records</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="check-circle" size={24} color="#10b981" />
              <Text style={styles.statNumber}>{stats.presentCount}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="cancel" size={24} color="#ef4444" />
              <Text style={styles.statNumber}>{stats.absentCount}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="trending-up" size={24} color="#8b5cf6" />
              <Text style={styles.statNumber}>{stats.attendanceRate.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Attendance Rate</Text>
            </View>
          </View>
        </Card>

        {/* Attendance Pie Chart */}
        {stats.totalRecords > 0 && (
          <Card style={styles.chartCard}>
            <Text style={styles.cardTitle}>Attendance Distribution</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={[
                  {
                    name: "Present",
                    population: stats.presentCount,
                    color: "#10b981",
                    legendFontColor: "#374151",
                    legendFontSize: 14,
                  },
                  {
                    name: "Absent",
                    population: stats.absentCount,
                    color: "#ef4444",
                    legendFontColor: "#374151",
                    legendFontSize: 14,
                  },
                ]}
                width={Dimensions.get("window").width - 64}
                height={220}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 10]}
                absolute
              />
            </View>
          </Card>
        )}

        {/* Search */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search by worker, feeder point, or driver..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>

        {/* Export Button */}
        <Card style={styles.actionCard}>
          <Button
            mode="outlined"
            onPress={exportAttendanceData}
            style={styles.exportButton}
            icon="download"
          >
            Export Attendance Data
          </Button>
        </Card>

        {/* Attendance Records */}
        <Card style={styles.recordsCard}>
          <Text style={styles.cardTitle}>Attendance Records ({filteredRecords.length})</Text>

          {filteredRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="event-busy" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No attendance records found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? "Try adjusting your search" : "No records for selected date"}
              </Text>
            </View>
          ) : (
            <View style={styles.recordsList}>
              {filteredRecords.map((record) => (
                <View key={record.id} style={styles.recordItem}>
                  <View style={styles.recordHeader}>
                    <View style={styles.recordInfo}>
                      <Text style={styles.workerName}>{record.workerName}</Text>
                      <Text style={styles.recordDetails}>
                        {record.feederPointName} • {formatTime(record.timestamp)}
                      </Text>
                      <Text style={styles.driverInfo}>
                        Driver: {record.driverName}
                      </Text>
                    </View>

                    <View style={styles.recordStatus}>
                      <MaterialIcons
                        name={getStatusIcon(record.status)}
                        size={24}
                        color={getStatusColor(record.status)}
                      />
                      <Chip
                        style={[
                          styles.statusChip,
                          { backgroundColor: record.status === 'present' ? "#f0fdf4" : "#fef2f2" }
                        ]}
                        textStyle={[
                          styles.statusText,
                          { color: getStatusColor(record.status) }
                        ]}
                      >
                        {record.status.toUpperCase()}
                      </Chip>
                    </View>
                  </View>

                  {record.photoUri && (
                    <TouchableOpacity
                      style={styles.photoButton}
                      onPress={() => setSelectedPhoto(record.photoUri!)}
                    >
                      <MaterialIcons name="photo" size={16} color="#2563eb" />
                      <Text style={styles.photoButtonText}>View Photo</Text>
                    </TouchableOpacity>
                  )}

                  {record.notes && (
                    <Text style={styles.notesText}>Notes: {record.notes}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Photo Modal */}
      <Modal
        visible={!!selectedPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.photoModalContainer}>
          <TouchableOpacity
            style={styles.photoModalOverlay}
            onPress={() => setSelectedPhoto(null)}
          >
            <View style={styles.photoModalContent}>
              {selectedPhoto && (
                <Image source={{ uri: selectedPhoto }} style={styles.photoModalImage} />
              )}
              <TouchableOpacity
                style={styles.photoCloseButton}
                onPress={() => setSelectedPhoto(null)}
              >
                <MaterialIcons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      <AdminSidebar
        navigation={navigation}
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        currentScreen="AttendanceDashboard"
      />
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
  content: {
    flex: 1,
    padding: 16,
  },
  dateCard: {
    marginBottom: 16,
  },
  dateNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  dateButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  dateInfo: {
    alignItems: "center",
  },
  dateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  dateSubtext: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  statsCard: {
    marginBottom: 16,
  },
  chartCard: {
    marginBottom: 16,
    backgroundColor: "#ffffff",
  },
  chartContainer: {
    alignItems: "center",
    paddingBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    padding: 16,
    paddingBottom: 8,
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
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
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: "#ffffff",
  },
  actionCard: {
    marginBottom: 16,
  },
  exportButton: {
    margin: 16,
  },
  recordsCard: {
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
    textAlign: "center",
  },
  recordsList: {
    padding: 16,
  },
  recordItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 16,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  recordInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  recordDetails: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  driverInfo: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  recordStatus: {
    alignItems: "center",
    gap: 8,
  },
  statusChip: {
    height: 24,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  photoButtonText: {
    fontSize: 12,
    color: "#2563eb",
    marginLeft: 4,
  },
  notesText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
    fontStyle: "italic",
  },
  photoModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
  },
  photoModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  photoModalContent: {
    position: "relative",
  },
  photoModalImage: {
    width: 300,
    height: 400,
    borderRadius: 8,
  },
  photoCloseButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
  },
})

export default AttendanceDashboard
