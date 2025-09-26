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
import { useProfessionalAlert } from "../../components/ProfessionalAlert"

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
  const { showAlert, AlertComponent } = useProfessionalAlert()

  // Validate required parameters
  const actualDriverId = driverId || userData?.uid
  const actualVehicleId = vehicleId || userData?.assignedVehicleId || 'default-vehicle'

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

  // Photo capture settings
  const [isPhotoRequired, setIsPhotoRequired] = useState(true)
  const [showAttendanceOptions, setShowAttendanceOptions] = useState(false)

  useEffect(() => {
    if (actualDriverId) {
      fetchAttendanceData()
      requestPermissions()
      getCurrentLocation()
    } else {
      showAlert({
        title: 'Missing Driver Information',
        message: 'Driver ID is required to mark attendance. Please contact support.',
        type: 'error',
        buttons: [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
          },
        ],
      })
    }
  }, [actualDriverId])

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
        showAlert({
          title: 'Permission Required',
          message: 'Location permission is required for attendance verification.',
          type: 'warning',
          buttons: [{ text: 'OK' }],
        })
      }
    } catch (error) {
      console.error("❌ [WorkerAttendance] Error requesting permissions:", error)
      showAlert({
        title: 'Permission Error',
        message: 'Failed to request permissions. Please check your device settings.',
        type: 'error',
        buttons: [{ text: 'OK' }],
      })
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
    setSelectedWorker(worker)

    if (isPhotoRequired) {
      // Photo is required - check camera permission and show camera
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
      setShowCamera(true)
    } else {
      // Photo is optional - show attendance options directly
      setShowAttendanceOptions(true)
    }
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

  const showAttendanceConfirmation = (photo?: AttendancePhoto) => {
    if (!selectedWorker) return

    Alert.alert(
      "Confirm Attendance",
      `Mark ${selectedWorker.workerName} as present?${photo ? ' (with photo)' : ' (without photo)'}`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            setCapturedPhoto(null)
            setSelectedWorker(null)
            setShowAttendanceOptions(false)
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

  const handleAttendanceWithoutPhoto = () => {
    if (!selectedWorker) return

    // Create attendance record with location but no photo
    const attendanceData = {
      timestamp: new Date(),
      location: currentLocation || undefined
    }

    setShowAttendanceOptions(false)
    showAttendanceConfirmation()
  }

  const handleAttendanceWithPhoto = () => {
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

    setShowAttendanceOptions(false)
    setShowCamera(true)
  }

  const submitAttendance = async (isPresent: boolean, photo?: AttendancePhoto) => {
    if (!selectedWorker) return

    try {
      console.log("💾 [WorkerAttendance] Submitting attendance for:", selectedWorker.workerName, "Present:", isPresent, "With photo:", !!photo)

      // Use photo location if available, otherwise use current location
      const attendanceLocation = photo?.location || currentLocation

      // Validate required data before submission
      if (!selectedWorker.workerId || !selectedWorker.workerName) {
        throw new Error('Invalid worker data')
      }

      if (!actualDriverId) {
        throw new Error('Driver ID is required')
      }

      await WorkerAttendanceService.markWorkerAttendance({
        workerId: selectedWorker.workerId,
        workerName: selectedWorker.workerName,
        driverId: actualDriverId,
        vehicleId: actualVehicleId,
        isPresent,
        checkInTime: new Date(),
        photoUri: photo?.uri,
        location: attendanceLocation,
        notes: photo ? "Attendance marked with photo" : "Attendance marked without photo"
      })

      // Update local state
      const updatedWorkers = assignedWorkers.map(worker =>
        worker.workerId === selectedWorker.workerId
          ? { ...worker, isPresent, checkInTime: new Date(), photoUri: photo?.uri }
          : worker
      )
      setAssignedWorkers(updatedWorkers)

      showAlert({
        title: 'Attendance Marked',
        message: `${selectedWorker.workerName} marked as ${isPresent ? 'present' : 'absent'}${photo ? ' with photo' : ' without photo'}.`,
        type: 'success',
        buttons: [{ text: 'OK' }],
      })

      // Reset states
      setCapturedPhoto(null)
      setSelectedWorker(null)
      setShowAttendanceOptions(false)

    } catch (error) {
      console.error("❌ [WorkerAttendance] Error submitting attendance:", error)
      showAlert({
        title: 'Attendance Error',
        message: `Failed to mark attendance: ${error.message || 'Unknown error'}. Please try again.`,
        type: 'error',
        buttons: [{ text: 'OK' }],
      })
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

        {/* Photo Settings */}
        <Card style={styles.settingsCard}>
          <Text style={styles.cardTitle}>Attendance Settings</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="photo-camera" size={24} color="#6b7280" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Photo Capture</Text>
                <Text style={styles.settingDescription}>
                  {isPhotoRequired ? 'Photos required for attendance' : 'Photos optional for attendance'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.toggleButton, isPhotoRequired && styles.toggleButtonActive]}
              onPress={() => setIsPhotoRequired(!isPhotoRequired)}
            >
              <Text style={[styles.toggleText, isPhotoRequired && styles.toggleTextActive]}>
                {isPhotoRequired ? 'Required' : 'Optional'}
              </Text>
            </TouchableOpacity>
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

      {/* Attendance Options Modal */}
      <Modal visible={showAttendanceOptions} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.attendanceOptionsModal}>
            <Text style={styles.modalTitle}>
              Mark Attendance for {selectedWorker?.workerName}
            </Text>
            <Text style={styles.modalSubtitle}>
              Choose how you want to mark attendance
            </Text>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleAttendanceWithPhoto}
              >
                <MaterialIcons name="photo-camera" size={32} color="#2563eb" />
                <Text style={styles.optionTitle}>With Photo</Text>
                <Text style={styles.optionDescription}>Take a photo for verification</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleAttendanceWithoutPhoto}
              >
                <MaterialIcons name="location-on" size={32} color="#059669" />
                <Text style={styles.optionTitle}>Without Photo</Text>
                <Text style={styles.optionDescription}>Use location only</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowAttendanceOptions(false)
                setSelectedWorker(null)
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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

      {/* Professional Alert Component */}
      <AlertComponent />
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
  // Settings styles
  settingsCard: {
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
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  settingDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  toggleButtonActive: {
    backgroundColor: "#dbeafe",
    borderColor: "#3b82f6",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  toggleTextActive: {
    color: "#3b82f6",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  attendanceOptionsModal: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: width - 40,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  optionButton: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginTop: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6b7280",
  },
})

export default WorkerAttendance
