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
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  writeBatch,
  serverTimestamp,
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
    requiredRole: 'swachh_hr',
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
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  // Enhanced filtering states
  const [viewMode, setViewMode] = useState<'day' | 'range' | 'monthly'>('day')
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [employeeFilter, setEmployeeFilter] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end' | 'single' | 'month'>('single')

  // Management capabilities states
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  useEffect(() => {
    fetchAttendanceData()
  }, [selectedDate, startDate, endDate, selectedMonth, viewMode])

  useEffect(() => {
    filterRecords()
  }, [attendanceRecords, searchQuery, employeeFilter])

  const fetchAttendanceData = async () => {
    try {
      setLoading(true)
      console.log("🔄 [HR AttendanceDashboard] Fetching attendance data for mode:", viewMode)

      let queryStartDate: Date
      let queryEndDate: Date

      // Determine date range based on view mode
      switch (viewMode) {
        case 'day':
          queryStartDate = new Date(selectedDate)
          queryStartDate.setHours(0, 0, 0, 0)
          queryEndDate = new Date(selectedDate)
          queryEndDate.setHours(23, 59, 59, 999)
          break
        case 'range':
          queryStartDate = new Date(startDate)
          queryStartDate.setHours(0, 0, 0, 0)
          queryEndDate = new Date(endDate)
          queryEndDate.setHours(23, 59, 59, 999)
          break
        case 'monthly':
          queryStartDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
          queryEndDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59, 999)
          break
        default:
          queryStartDate = new Date(selectedDate)
          queryStartDate.setHours(0, 0, 0, 0)
          queryEndDate = new Date(selectedDate)
          queryEndDate.setHours(23, 59, 59, 999)
      }

      // Use direct Firestore query like admin dashboard for better reliability
      const attendanceQuery = query(
        collection(FIRESTORE_DB, "workerAttendance"),
        where("timestamp", ">=", Timestamp.fromDate(queryStartDate)),
        where("timestamp", "<=", Timestamp.fromDate(queryEndDate)),
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

      console.log(`✅ [HR AttendanceDashboard] Found ${records.length} attendance records`)
    } catch (error) {
      console.error("❌ [HR AttendanceDashboard] Error fetching attendance data:", error)
      Alert.alert("Error", "Failed to fetch attendance data. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterRecords = () => {
    let filtered = attendanceRecords

    // Apply search query filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(record =>
        record.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.feederPointName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.driverName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply employee filter (additional to search)
    if (employeeFilter.trim()) {
      filtered = filtered.filter(record =>
        record.workerName.toLowerCase().includes(employeeFilter.toLowerCase())
      )
    }

    setFilteredRecords(filtered)
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
      if (!updatedRecord.id) {
        throw new Error("Record ID is required for update")
      }

      // Update the record in the database using direct Firestore update
      const recordRef = doc(FIRESTORE_DB, "workerAttendance", updatedRecord.id)
      await updateDoc(recordRef, {
        status: updatedRecord.status,
        notes: updatedRecord.notes || "",
        timestamp: Timestamp.fromDate(updatedRecord.timestamp),
        updatedAt: serverTimestamp()
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

      // Use direct Firestore batch update
      const batch = writeBatch(FIRESTORE_DB)
      recordsToUpdate.forEach(recordId => {
        const recordRef = doc(FIRESTORE_DB, "workerAttendance", recordId)
        batch.update(recordRef, {
          status: 'present',
          updatedAt: serverTimestamp()
        })
      })
      await batch.commit()

      // Update local state
      setAttendanceRecords(prev =>
        prev.map(record =>
          selectedRecords.has(record.id || '') ? { ...record, status: 'present' as const } : record
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

      // Use direct Firestore batch update
      const batch = writeBatch(FIRESTORE_DB)
      recordsToUpdate.forEach(recordId => {
        const recordRef = doc(FIRESTORE_DB, "workerAttendance", recordId)
        batch.update(recordRef, {
          status: 'absent',
          updatedAt: serverTimestamp()
        })
      })
      await batch.commit()

      // Update local state
      setAttendanceRecords(prev =>
        prev.map(record =>
          selectedRecords.has(record.id || '') ? { ...record, status: 'absent' as const } : record
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Worker Attendance</Text>
          <Text style={styles.headerSubtitle}>Daily attendance tracking</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* View Mode Selector */}
        <Card style={styles.viewModeCard}>
          <Text style={styles.cardTitle}>View Mode</Text>
          <View style={styles.viewModeContainer}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'day' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('day')}
            >
              <Text style={[styles.viewModeText, viewMode === 'day' && styles.viewModeTextActive]}>
                Day
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'range' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('range')}
            >
              <Text style={[styles.viewModeText, viewMode === 'range' && styles.viewModeTextActive]}>
                Date Range
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'monthly' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('monthly')}
            >
              <Text style={[styles.viewModeText, viewMode === 'monthly' && styles.viewModeTextActive]}>
                Monthly
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Date Navigation - Conditional based on view mode */}
        {viewMode === 'day' && (
          <Card style={styles.dateCard}>
            <Text style={styles.cardTitle}>Day View</Text>
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
        )}

        {/* Date Range Selector */}
        {viewMode === 'range' && (
          <Card style={styles.dateCard}>
            <Text style={styles.cardTitle}>Date Range</Text>
            <View style={styles.dateRangeContainer}>
              <TouchableOpacity
                style={styles.dateRangeButton}
                onPress={() => {
                  setDatePickerMode('start')
                  setShowDatePicker(true)
                }}
              >
                <Text style={styles.dateRangeLabel}>Start Date</Text>
                <Text style={styles.dateRangeValue}>{formatDate(startDate)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateRangeButton}
                onPress={() => {
                  setDatePickerMode('end')
                  setShowDatePicker(true)
                }}
              >
                <Text style={styles.dateRangeLabel}>End Date</Text>
                <Text style={styles.dateRangeValue}>{formatDate(endDate)}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Monthly Selector */}
        {viewMode === 'monthly' && (
          <Card style={styles.dateCard}>
            <Text style={styles.cardTitle}>Monthly View</Text>
            <View style={styles.monthNavigation}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  const newMonth = new Date(selectedMonth)
                  newMonth.setMonth(newMonth.getMonth() - 1)
                  setSelectedMonth(newMonth)
                }}
              >
                <MaterialIcons name="chevron-left" size={24} color="#2563eb" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.monthInfo}
                onPress={() => {
                  setDatePickerMode('month')
                  setShowDatePicker(true)
                }}
              >
                <Text style={styles.monthText}>
                  {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  const newMonth = new Date(selectedMonth)
                  newMonth.setMonth(newMonth.getMonth() + 1)
                  setSelectedMonth(newMonth)
                }}
              >
                <MaterialIcons name="chevron-right" size={24} color="#2563eb" />
              </TouchableOpacity>
            </View>
          </Card>
        )}

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

        {/* Search */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search by worker, feeder point, or driver..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>

        {/* Employee Filter */}
        {hasPermission('canFilterAttendanceByEmployee') && (
          <Card style={styles.filterCard}>
            <Text style={styles.cardTitle}>Employee Filter</Text>
            <View style={styles.employeeFilterContainer}>
              <Searchbar
                placeholder="Filter by specific employee name..."
                onChangeText={setEmployeeFilter}
                value={employeeFilter}
                style={styles.employeeFilterBar}
                icon="account-search"
              />
              {employeeFilter && (
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={() => setEmployeeFilter("")}
                >
                  <MaterialIcons name="clear" size={20} color="#ef4444" />
                  <Text style={styles.clearFilterText}>Clear Filter</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}

        {/* Management Controls */}
        <Card style={styles.managementCard}>
          <Text style={styles.cardTitle}>Management Tools</Text>
          <View style={styles.managementControls}>
            <TouchableOpacity
              style={[styles.managementButton, bulkMode && styles.managementButtonActive]}
              onPress={toggleBulkMode}
            >
              <MaterialIcons
                name={bulkMode ? "check-box" : "check-box-outline-blank"}
                size={20}
                color={bulkMode ? "#ffffff" : "#6b7280"}
              />
              <Text style={[styles.managementButtonText, bulkMode && styles.managementButtonTextActive]}>
                {bulkMode ? 'Exit Bulk Mode' : 'Bulk Edit Mode'}
              </Text>
            </TouchableOpacity>

            {hasPermission('canExportAttendanceData') && (
              <TouchableOpacity
                style={styles.managementButton}
                onPress={exportAttendanceData}
              >
                <MaterialIcons name="download" size={20} color="#6b7280" />
                <Text style={styles.managementButtonText}>Export Data</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bulk Actions */}
          {showBulkActions && (
            <View style={styles.bulkActionsContainer}>
              <Text style={styles.bulkActionsTitle}>
                {selectedRecords.size} record(s) selected
              </Text>
              <View style={styles.bulkActions}>
                <TouchableOpacity
                  style={[styles.bulkActionButton, styles.bulkActionPresent]}
                  onPress={handleBulkMarkPresent}
                >
                  <MaterialIcons name="check-circle" size={16} color="#ffffff" />
                  <Text style={styles.bulkActionText}>Mark Present</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.bulkActionButton, styles.bulkActionAbsent]}
                  onPress={handleBulkMarkAbsent}
                >
                  <MaterialIcons name="cancel" size={16} color="#ffffff" />
                  <Text style={styles.bulkActionText}>Mark Absent</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Card>

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
                <View key={record.id} style={[
                  styles.recordItem,
                  selectedRecords.has(record.id) && styles.recordItemSelected
                ]}>
                  <View style={styles.recordHeader}>
                    {/* Bulk selection checkbox */}
                    {bulkMode && (
                      <TouchableOpacity
                        style={styles.selectionCheckbox}
                        onPress={() => toggleRecordSelection(record.id)}
                      >
                        <MaterialIcons
                          name={selectedRecords.has(record.id) ? "check-box" : "check-box-outline-blank"}
                          size={24}
                          color={selectedRecords.has(record.id) ? "#2563eb" : "#9ca3af"}
                        />
                      </TouchableOpacity>
                    )}

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

                      {/* Edit button */}
                      {!bulkMode && hasPermission('canEditAttendanceRecords') && (
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => handleEditRecord(record)}
                        >
                          <MaterialIcons name="edit" size={16} color="#6b7280" />
                        </TouchableOpacity>
                      )}
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

      {/* Edit Record Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <Text style={styles.editModalTitle}>Edit Attendance Record</Text>

            {editingRecord && (
              <View style={styles.editForm}>
                <Text style={styles.editFieldLabel}>Worker: {editingRecord.workerName}</Text>

                <View style={styles.statusSelector}>
                  <Text style={styles.editFieldLabel}>Status:</Text>
                  <View style={styles.statusOptions}>
                    <TouchableOpacity
                      style={[
                        styles.statusOption,
                        editingRecord.status === 'present' && styles.statusOptionActive
                      ]}
                      onPress={() => setEditingRecord({
                        ...editingRecord,
                        status: 'present'
                      })}
                    >
                      <MaterialIcons name="check-circle" size={20} color="#10b981" />
                      <Text style={styles.statusOptionText}>Present</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusOption,
                        editingRecord.status === 'absent' && styles.statusOptionActive
                      ]}
                      onPress={() => setEditingRecord({
                        ...editingRecord,
                        status: 'absent'
                      })}
                    >
                      <MaterialIcons name="cancel" size={20} color="#ef4444" />
                      <Text style={styles.statusOptionText}>Absent</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.editCancelButton}
                    onPress={() => {
                      setShowEditModal(false)
                      setEditingRecord(null)
                    }}
                  >
                    <Text style={styles.editCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.editSaveButton}
                    onPress={() => handleUpdateRecord(editingRecord)}
                  >
                    <Text style={styles.editSaveText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    fontSize: 20,
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
  // New styles for enhanced features
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
    marginTop: 12,
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
  dateRangeContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  dateRangeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  dateRangeLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  dateRangeValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  monthNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  monthInfo: {
    flex: 1,
    alignItems: "center",
    padding: 12,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  filterCard: {
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
  employeeFilterContainer: {
    marginTop: 12,
  },
  employeeFilterBar: {
    backgroundColor: "#f9fafb",
    elevation: 0,
  },
  clearFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    alignSelf: "flex-start",
  },
  clearFilterText: {
    fontSize: 12,
    color: "#ef4444",
    marginLeft: 4,
  },
  // Management styles
  managementCard: {
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
  managementControls: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  managementButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
    gap: 8,
  },
  managementButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  managementButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  managementButtonTextActive: {
    color: "#ffffff",
  },
  bulkActionsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  bulkActionsTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  bulkActions: {
    flexDirection: "row",
    gap: 12,
  },
  bulkActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  bulkActionPresent: {
    backgroundColor: "#10b981",
  },
  bulkActionAbsent: {
    backgroundColor: "#ef4444",
  },
  bulkActionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
  },
  // Record selection styles
  recordItemSelected: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
    borderWidth: 2,
  },
  selectionCheckbox: {
    padding: 8,
    marginRight: 8,
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  editModal: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: "90%",
    maxWidth: 400,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },
  editForm: {
    gap: 16,
  },
  editFieldLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  statusSelector: {
    gap: 8,
  },
  statusOptions: {
    flexDirection: "row",
    gap: 12,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    gap: 8,
    flex: 1,
  },
  statusOptionActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  editCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  editCancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6b7280",
  },
  editSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    alignItems: "center",
  },
  editSaveText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
  },
})

export default AttendanceDashboard
