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
  Image,
  Modal,
  Dimensions,
} from "react-native"
import { Card, Text, Button, Chip, FAB, Searchbar } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { Camera } from "expo-camera"
import * as Location from "expo-location"
import { WorkerAttendanceService, WorkerAttendanceData, AssignedWorker } from "../../../services/WorkerAttendanceService"
import { useRequireAuth } from "../../hooks/useRequireAuth"

const { width, height } = Dimensions.get("window")

interface AttendancePhoto {
  uri: string
  timestamp: Date
  location?: {
    latitude: number
    longitude: number
  }
}

const WorkerAttendance = ({ navigation, route }: any) => {
  const { userData } = useRequireAuth(navigation)
  const { driverId, vehicleId } = route.params || {}

  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [attendanceData, setAttendanceData] = useState<WorkerAttendanceData | null>(null)
  const [assignedWorkers, setAssignedWorkers] = useState<AssignedWorker[]>([])
  const [filteredWorkers, setFilteredWorkers] = useState<AssignedWorker[]>([])

  // Camera states
  const [showCamera, setShowCamera] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const [selectedWorker, setSelectedWorker] = useState<AssignedWorker | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<AttendancePhoto | null>(null)
  const [cameraRef, setCameraRef] = useState<Camera | null>(null)

  // Location state
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number, longitude: number } | null>(null)

  useEffect(() => {
    if (driverId) {
      fetchAttendanceData()
      requestPermissions()
      getCurrentLocation()
    }
  }, [driverId])

  useEffect(() => {
    filterWorkers()
  }, [searchQuery, assignedWorkers])

  const requestPermissions = async () => {
    try {
      // Request camera permission
      const cameraStatus = await Camera.requestCameraPermissionsAsync()
      setCameraPermission(cameraStatus.status === 'granted')

      // Request location permission
      const locationStatus = await Location.requestForegroundPermissionsAsync()
      if (locationStatus.status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for attendance verification.')
      }
    } catch (error) {
      console.error("❌ [WorkerAttendance] Error requesting permissions:", error)
    }
  }

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({})
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      })
    } catch (error) {
      console.error("❌ [WorkerAttendance] Error getting location:", error)
    }
  }

  const fetchAttendanceData = async () => {
    try {
      setLoading(true)
      console.log("👥 [WorkerAttendance] Fetching attendance data for driver:", driverId)

      const data = await WorkerAttendanceService.getDriverWorkerAttendance(driverId)
      setAttendanceData(data)
      setAssignedWorkers(data.assignedWorkers)

      console.log("✅ [WorkerAttendance] Attendance data loaded:", data.assignedWorkers.length, "workers")
    } catch (error) {
      console.error("❌ [WorkerAttendance] Error fetching attendance data:", error)
      Alert.alert("Error", "Failed to load worker attendance data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchAttendanceData()
    setRefreshing(false)
  }

  const filterWorkers = () => {
    if (!searchQuery.trim()) {
      setFilteredWorkers(assignedWorkers)
      return
    }

    const filtered = assignedWorkers.filter(worker =>
      worker.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.workerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.role.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredWorkers(filtered)
  }

  const handleMarkAttendance = (worker: AssignedWorker) => {
    if (!cameraPermission) {
      Alert.alert(
        "Camera Permission Required",
        "Please grant camera permission to capture attendance photos.",
        [
          { text: "Cancel" },
          { text: "Open Settings", onPress: () => requestPermissions() }
        ]
      )
      return
    }

    setSelectedWorker(worker)
    setShowCamera(true)
  }

  const takePicture = async () => {
    if (!cameraRef || !selectedWorker) return

    try {
      console.log("📸 [WorkerAttendance] Taking attendance photo for:", selectedWorker.workerName)

      const photo = await cameraRef.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      })

      const attendancePhoto: AttendancePhoto = {
        uri: photo.uri,
        timestamp: new Date(),
        location: currentLocation || undefined
      }

      setCapturedPhoto(attendancePhoto)
      setShowCamera(false)

      // Show confirmation dialog
      showAttendanceConfirmation(attendancePhoto)

    } catch (error) {
      console.error("❌ [WorkerAttendance] Error taking picture:", error)
      Alert.alert("Error", "Failed to capture photo. Please try again.")
    }
  }

  const showAttendanceConfirmation = (photo: AttendancePhoto) => {
    if (!selectedWorker) return

    Alert.alert(
      "Confirm Attendance",
      `Mark ${selectedWorker.workerName} as present?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            setCapturedPhoto(null)
            setSelectedWorker(null)
          }
        },
        {
          text: "Mark Present",
          onPress: () => submitAttendance(true, photo)
        },
        {
          text: "Mark Absent",
          style: "destructive",
          onPress: () => submitAttendance(false, photo)
        }
      ]
    )
  }

  const submitAttendance = async (isPresent: boolean, photo?: AttendancePhoto) => {
    if (!selectedWorker) return

    try {
      console.log("💾 [WorkerAttendance] Submitting attendance for:", selectedWorker.workerName, "Present:", isPresent)

      await WorkerAttendanceService.markWorkerAttendance({
        workerId: selectedWorker.workerId,
        workerName: selectedWorker.workerName,
        driverId: driverId,
        vehicleId: vehicleId,
        isPresent,
        checkInTime: new Date(),
        photoUri: photo?.uri,
        location: photo?.location,
        notes: ""
      })

      // Update local state
      const updatedWorkers = assignedWorkers.map(worker =>
        worker.workerId === selectedWorker.workerId
          ? { ...worker, isPresent, checkInTime: new Date(), photoUri: photo?.uri }
          : worker
      )
      setAssignedWorkers(updatedWorkers)

      Alert.alert(
        "Success",
        `${selectedWorker.workerName} marked as ${isPresent ? 'present' : 'absent'}.`,
        [{ text: "OK" }]
      )

      // Reset states
      setCapturedPhoto(null)
      setSelectedWorker(null)

    } catch (error) {
      console.error("❌ [WorkerAttendance] Error submitting attendance:", error)
      Alert.alert("Error", "Failed to mark attendance. Please try again.")
    }
  }

  const getAttendanceStats = () => {
    const total = assignedWorkers.length
    const present = assignedWorkers.filter(w => w.isPresent === true).length
    const absent = assignedWorkers.filter(w => w.isPresent === false).length
    const pending = assignedWorkers.filter(w => w.isPresent === undefined).length

    return { total, present, absent, pending }
  }

  const getWorkerStatusColor = (worker: AssignedWorker) => {
    if (worker.isPresent === true) return "#10b981"
    if (worker.isPresent === false) return "#ef4444"
    return "#f59e0b"
  }

  const getWorkerStatusText = (worker: AssignedWorker) => {
    if (worker.isPresent === true) return "Present"
    if (worker.isPresent === false) return "Absent"
    return "Pending"
  }

  const stats = getAttendanceStats()

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker Attendance</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Attendance Statistics */}
        <Card style={styles.statsCard}>
          <Text style={styles.cardTitle}>Today's Attendance</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialIcons name="people" size={24} color="#3b82f6" />
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="check-circle" size={24} color="#10b981" />
              <Text style={styles.statNumber}>{stats.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="cancel" size={24} color="#ef4444" />
              <Text style={styles.statNumber}>{stats.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="schedule" size={24} color="#f59e0b" />
              <Text style={styles.statNumber}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </Card>

        {/* Search Bar */}
        <Searchbar
          placeholder="Search workers..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        {/* Workers List */}
        <View style={styles.workersSection}>
          <Text style={styles.sectionTitle}>Assigned Workers ({filteredWorkers.length})</Text>

          {filteredWorkers.length > 0 ? (
            <View style={styles.workersList}>
              {filteredWorkers.map((worker) => (
                <Card key={worker.workerId} style={styles.workerCard}>
                  <View style={styles.workerContent}>
                    <View style={styles.workerInfo}>
                      <View style={styles.workerHeader}>
                        <Text style={styles.workerName}>{worker.workerName}</Text>
                        <Chip
                          mode="outlined"
                          style={[styles.statusChip, {
                            backgroundColor: getWorkerStatusColor(worker) + '20',
                            borderColor: getWorkerStatusColor(worker)
                          }]}
                          textStyle={{ color: getWorkerStatusColor(worker) }}
                        >
                          {getWorkerStatusText(worker)}
                        </Chip>
                      </View>

                      <Text style={styles.workerRole}>{worker.role}</Text>
                      <Text style={styles.workerId}>ID: {worker.workerId}</Text>

                      {worker.checkInTime && (
                        <Text style={styles.checkInTime}>
                          Check-in: {worker.checkInTime.toLocaleTimeString()}
                        </Text>
                      )}
                    </View>

                    {worker.photoUri && (
                      <Image source={{ uri: worker.photoUri }} style={styles.attendancePhoto} />
                    )}
                  </View>

                  {worker.isPresent === undefined && (
                    <View style={styles.actionButtons}>
                      <Button
                        mode="contained"
                        onPress={() => handleMarkAttendance(worker)}
                        style={styles.attendanceButton}
                        icon="camera"
                      >
                        Mark Attendance
                      </Button>
                    </View>
                  )}
                </Card>
              ))}
            </View>
          ) : (
            <Card style={styles.emptyCard}>
              <MaterialIcons name="people-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Workers Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? "No workers match your search." : "No workers assigned to this vehicle."}
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <View style={styles.cameraContainer}>
          <Camera
            style={styles.camera}
            type={Camera.Constants.Type.back}
            ref={(ref) => setCameraRef(ref)}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraHeader}>
                <TouchableOpacity
                  onPress={() => setShowCamera(false)}
                  style={styles.cameraCloseButton}
                >
                  <MaterialIcons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.cameraTitle}>
                  Take photo for {selectedWorker?.workerName}
                </Text>
              </View>

              <View style={styles.cameraFooter}>
                <TouchableOpacity
                  onPress={takePicture}
                  style={styles.captureButton}
                >
                  <MaterialIcons name="camera" size={32} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </Camera>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="camera"
        label="Quick Attendance"
        onPress={() => {
          const pendingWorkers = assignedWorkers.filter(w => w.isPresent === undefined)
          if (pendingWorkers.length === 0) {
            Alert.alert("All Done", "All workers' attendance has been marked.")
            return
          }
          handleMarkAttendance(pendingWorkers[0])
        }}
      />
    </SafeAreaView>
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
    paddingTop: 16,
  },
  backButton: {
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
  // Workers section styles
  workersSection: {
    marginBottom: 100, // Space for FAB
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  workersList: {
    gap: 12,
  },
  workerCard: {
    marginBottom: 8,
  },
  workerContent: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  workerInfo: {
    flex: 1,
  },
  workerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  workerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  statusChip: {
    height: 28,
  },
  workerRole: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  workerId: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  checkInTime: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "500",
  },
  attendancePhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginLeft: 12,
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  attendanceButton: {
    marginTop: 8,
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
  // Camera styles
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "space-between",
  },
  cameraHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  cameraCloseButton: {
    padding: 8,
  },
  cameraTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 16,
    flex: 1,
  },
  cameraFooter: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#ffffff",
  },
  // FAB styles
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#3b82f6",
  },
})

export default WorkerAttendance
