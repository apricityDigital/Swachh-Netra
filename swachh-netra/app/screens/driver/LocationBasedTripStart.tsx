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
  Dimensions,
} from "react-native"
import { Card, Text, Button, Chip, FAB, ProgressBar } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { CameraView, useCameraPermissions } from "expo-camera"
import { 
  LocationBasedTripService, 
  LocationData, 
  WorkerAttendanceRecord 
} from "../../../services/LocationBasedTripService"
import { useRequireAuth } from "../../hooks/useRequireAuth"

const { width, height } = Dimensions.get("window")

interface AssignedWorker {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  employeeId: string
  zone: string
  ward: string
  kothi: string
}

interface AttendanceStatus {
  workerId: string
  status: 'pending' | 'present' | 'absent'
  photoUri?: string
  notes?: string
}

const LocationBasedTripStart = ({ navigation, route }: any) => {
  const { userData } = useRequireAuth(navigation)
  const { feederPoint, vehicleId, vehicleNumber } = route.params || {}

  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const [isWithinRange, setIsWithinRange] = useState(false)
  const [distance, setDistance] = useState<number>(0)
  const [assignedWorkers, setAssignedWorkers] = useState<AssignedWorker[]>([])
  const [attendanceStatus, setAttendanceStatus] = useState<{ [key: string]: AttendanceStatus }>({})
  const [tripSessionId, setTripSessionId] = useState<string | null>(null)
  const [tripStarted, setTripStarted] = useState(false)

  // Camera states
  const [showCamera, setShowCamera] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<AssignedWorker | null>(null)
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null)
  const [permission, requestPermission] = useCameraPermissions()

  useEffect(() => {
    checkLocationAndLoadData()
  }, [])



  const checkLocationAndLoadData = async () => {
    try {
      setLoading(true)
      
      // Get current location
      const location = await LocationBasedTripService.getCurrentLocation()
      setCurrentLocation(location)
      
      // Check proximity to feeder point
      const proximityResult = await LocationBasedTripService.checkProximityToFeederPoint(
        feederPoint.id,
        location
      )
      
      setIsWithinRange(proximityResult.isWithinRange)
      setDistance(proximityResult.distance)
      
      // Get assigned workers
      const workers = await LocationBasedTripService.getAssignedWorkers(feederPoint.id)
      setAssignedWorkers(workers)
      
      // Initialize attendance status
      const initialStatus: { [key: string]: AttendanceStatus } = {}
      workers.forEach(worker => {
        initialStatus[worker.id] = {
          workerId: worker.id,
          status: 'pending'
        }
      })
      setAttendanceStatus(initialStatus)
      
    } catch (error) {
      console.error("Error checking location and loading data:", error)
      Alert.alert("Error", "Failed to check location. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    checkLocationAndLoadData().finally(() => setRefreshing(false))
  }

  const handleStartTrip = async () => {
    if (!isWithinRange) {
      Alert.alert(
        "Too Far from Feeder Point",
        `You are ${distance.toFixed(0)}m away from the feeder point. You need to be within 100m to start the trip.`,
        [{ text: "OK" }]
      )
      return
    }

    if (!currentLocation || !userData?.uid) return

    try {
      setLoading(true)
      
      const tripId = await LocationBasedTripService.startTripSession(
        userData.uid,
        userData.displayName || userData.email || "Unknown Driver",
        vehicleId,
        vehicleNumber,
        feederPoint.id,
        currentLocation
      )
      
      setTripSessionId(tripId)
      setTripStarted(true)
      
      Alert.alert(
        "Trip Started",
        "Trip has been started successfully. Please mark worker attendance.",
        [{ text: "OK" }]
      )
      
    } catch (error) {
      console.error("Error starting trip:", error)
      Alert.alert("Error", "Failed to start trip. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceChange = (workerId: string, status: 'present' | 'absent') => {
    setAttendanceStatus(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        status
      }
    }))
  }

  const handleTakePhoto = async (worker: AssignedWorker) => {
    if (!permission) {
      // Camera permissions are still loading
      return
    }

    if (!permission.granted) {
      const response = await requestPermission()
      if (!response.granted) {
        Alert.alert("Camera Permission", "Camera permission is required to take photos.")
        return
      }
    }

    setSelectedWorker(worker)
    setShowCamera(true)
  }

  const capturePhoto = async () => {
    if (!cameraRef || !selectedWorker) return

    try {
      const photo = await cameraRef.takePictureAsync({
        quality: 0.8,
        base64: false,
      })

      setAttendanceStatus(prev => ({
        ...prev,
        [selectedWorker.id]: {
          ...prev[selectedWorker.id],
          photoUri: photo.uri
        }
      }))

      setShowCamera(false)
      setSelectedWorker(null)

    } catch (error) {
      console.error("Error capturing photo:", error)
      Alert.alert("Error", "Failed to capture photo. Please try again.")
    }
  }

  const handleSubmitAttendance = async () => {
    if (!tripSessionId || !currentLocation || !userData?.uid) return

    try {
      setLoading(true)
      
      // Submit attendance for all workers
      for (const worker of assignedWorkers) {
        const attendance = attendanceStatus[worker.id]
        if (attendance.status !== 'pending') {
          await LocationBasedTripService.recordWorkerAttendance(
            tripSessionId,
            worker.id,
            worker.fullName,
            feederPoint.id,
            feederPoint.feederPointName,
            userData.uid,
            userData.displayName || userData.email || "Unknown Driver",
            attendance.status,
            currentLocation,
            attendance.photoUri,
            attendance.notes
          )
        }
      }
      
      Alert.alert(
        "Attendance Submitted",
        "Worker attendance has been recorded successfully.",
        [
          {
            text: "Continue Trip",
            onPress: () => {
              navigation.navigate('TripRecording', {
                vehicleId,
                feederPoints: [feederPoint],
                driverId: userData.uid,
                tripSessionId
              })
            }
          }
        ]
      )
      
    } catch (error) {
      console.error("Error submitting attendance:", error)
      Alert.alert("Error", "Failed to submit attendance. Please try again.")
    } finally {
      setLoading(false)
    }
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

  const completedAttendance = Object.values(attendanceStatus).filter(a => a.status !== 'pending').length
  const totalWorkers = assignedWorkers.length
  const attendanceProgress = totalWorkers > 0 ? completedAttendance / totalWorkers : 0

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="location-on" size={48} color="#2563eb" />
        <Text style={styles.loadingText}>Checking location...</Text>
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
          <Text style={styles.headerTitle}>Start Trip</Text>
          <Text style={styles.headerSubtitle}>{feederPoint.feederPointName}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Location Status */}
        <Card style={styles.locationCard}>
          <View style={styles.locationContent}>
            <View style={styles.locationHeader}>
              <MaterialIcons 
                name="location-on" 
                size={24} 
                color={isWithinRange ? "#10b981" : "#ef4444"} 
              />
              <Text style={styles.locationTitle}>Location Status</Text>
            </View>
            
            <View style={styles.locationDetails}>
              <Text style={styles.locationText}>
                Distance: {distance.toFixed(0)}m from feeder point
              </Text>
              <Chip
                style={[
                  styles.statusChip,
                  { backgroundColor: isWithinRange ? "#f0fdf4" : "#fef2f2" }
                ]}
                textStyle={[
                  styles.statusText,
                  { color: isWithinRange ? "#059669" : "#dc2626" }
                ]}
              >
                {isWithinRange ? "Within Range" : "Too Far"}
              </Chip>
            </View>
            
            {!isWithinRange && (
              <Text style={styles.warningText}>
                You need to be within 100m of the feeder point to start the trip.
              </Text>
            )}
          </View>
        </Card>

        {/* Trip Start Button */}
        {!tripStarted && (
          <Card style={styles.actionCard}>
            <Button
              mode="contained"
              onPress={handleStartTrip}
              disabled={!isWithinRange || loading}
              style={[
                styles.startButton,
                { backgroundColor: isWithinRange ? "#2563eb" : "#9ca3af" }
              ]}
              icon="play-circle"
            >
              {isWithinRange ? "Start Trip" : "Move Closer to Start"}
            </Button>
          </Card>
        )}

        {/* Worker Attendance */}
        {tripStarted && (
          <>
            <Card style={styles.progressCard}>
              <View style={styles.progressContent}>
                <Text style={styles.progressTitle}>Worker Attendance Progress</Text>
                <Text style={styles.progressText}>
                  {completedAttendance} of {totalWorkers} workers marked
                </Text>
                <ProgressBar 
                  progress={attendanceProgress} 
                  color="#2563eb" 
                  style={styles.progressBar}
                />
              </View>
            </Card>

            {assignedWorkers.map((worker) => {
              const attendance = attendanceStatus[worker.id]
              return (
                <Card key={worker.id} style={styles.workerCard}>
                  <View style={styles.workerContent}>
                    <View style={styles.workerHeader}>
                      <View style={styles.workerInfo}>
                        <Text style={styles.workerName}>{worker.fullName}</Text>
                        <Text style={styles.workerDetails}>
                          ID: {worker.employeeId} • Zone: {worker.zone}
                        </Text>
                      </View>
                      <MaterialIcons
                        name={getStatusIcon(attendance.status)}
                        size={24}
                        color={getStatusColor(attendance.status)}
                      />
                    </View>

                    <View style={styles.attendanceActions}>
                      <View style={styles.statusButtons}>
                        <TouchableOpacity
                          style={[
                            styles.statusButton,
                            attendance.status === 'present' && styles.statusButtonActive
                          ]}
                          onPress={() => handleAttendanceChange(worker.id, 'present')}
                        >
                          <MaterialIcons name="check" size={20} color="#10b981" />
                          <Text style={styles.statusButtonText}>Present</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.statusButton,
                            attendance.status === 'absent' && styles.statusButtonActive
                          ]}
                          onPress={() => handleAttendanceChange(worker.id, 'absent')}
                        >
                          <MaterialIcons name="close" size={20} color="#ef4444" />
                          <Text style={styles.statusButtonText}>Absent</Text>
                        </TouchableOpacity>
                      </View>

                      {attendance.status === 'present' && (
                        <TouchableOpacity
                          style={styles.photoButton}
                          onPress={() => handleTakePhoto(worker)}
                        >
                          <MaterialIcons 
                            name={attendance.photoUri ? "photo" : "camera-alt"} 
                            size={20} 
                            color="#2563eb" 
                          />
                          <Text style={styles.photoButtonText}>
                            {attendance.photoUri ? "Photo Taken" : "Take Photo"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </Card>
              )
            })}

            {/* Submit Attendance Button */}
            <Card style={styles.actionCard}>
              <Button
                mode="contained"
                onPress={handleSubmitAttendance}
                disabled={completedAttendance === 0 || loading}
                style={styles.submitButton}
                icon="check"
              >
                Submit Attendance & Continue Trip
              </Button>
            </Card>
          </>
        )}
      </ScrollView>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            ref={(ref) => setCameraRef(ref)}
          >
            <View style={styles.cameraOverlay}>
              <TouchableOpacity
                style={styles.cameraCloseButton}
                onPress={() => setShowCamera(false)}
              >
                <MaterialIcons name="close" size={30} color="#ffffff" />
              </TouchableOpacity>

              <View style={styles.cameraControls}>
                <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
                  <MaterialIcons name="camera" size={40} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
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
  locationCard: {
    marginBottom: 16,
  },
  locationContent: {
    padding: 16,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 8,
  },
  locationDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#6b7280",
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  warningText: {
    fontSize: 12,
    color: "#dc2626",
    fontStyle: "italic",
  },
  actionCard: {
    marginBottom: 16,
  },
  startButton: {
    margin: 16,
    paddingVertical: 8,
  },
  progressCard: {
    marginBottom: 16,
  },
  progressContent: {
    padding: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  workerCard: {
    marginBottom: 12,
  },
  workerContent: {
    padding: 16,
  },
  workerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  workerDetails: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  attendanceActions: {
    gap: 12,
  },
  statusButtons: {
    flexDirection: "row",
    gap: 12,
  },
  statusButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  statusButtonActive: {
    backgroundColor: "#f0fdf4",
    borderColor: "#10b981",
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginLeft: 6,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#93c5fd",
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2563eb",
    marginLeft: 6,
  },
  submitButton: {
    margin: 16,
    paddingVertical: 8,
    backgroundColor: "#10b981",
  },
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
  cameraCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 25,
  },
  cameraControls: {
    alignItems: "center",
    paddingBottom: 50,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#ffffff",
  },
})

export default LocationBasedTripStart
