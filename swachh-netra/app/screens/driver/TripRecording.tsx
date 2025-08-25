import React, { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  Image,
  Dimensions,
  TextInput,
} from "react-native"
import { Card, Text, Button, Chip, FAB, ProgressBar } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { Camera } from "expo-camera"
import * as Location from "expo-location"
import { TripRecordingService, TripData, TripStatus } from "../../../services/TripRecordingService"
import { useRequireAuth } from "../../hooks/useRequireAuth"

const { width, height } = Dimensions.get("window")

interface FeederPointTrip {
  feederPointId: string
  feederPointName: string
  areaName: string
  wardNumber: string
  nearestLandmark: string
  approximateHouseholds: string
  completedTrips: number
  totalTrips: number
  currentTripNumber: number
  isActive: boolean
}

interface TripPhoto {
  uri: string
  timestamp: Date
  location?: {
    latitude: number
    longitude: number
  }
  type: 'before' | 'during' | 'after'
}

const TripRecording = ({ navigation, route }: any) => {
  const { userData } = useRequireAuth(navigation)
  const { vehicleId, feederPoints, driverId } = route.params || {}

  const [loading, setLoading] = useState(false)
  const [currentTrip, setCurrentTrip] = useState<TripData | null>(null)
  const [feederPointTrips, setFeederPointTrips] = useState<FeederPointTrip[]>([])
  const [selectedFeederPoint, setSelectedFeederPoint] = useState<FeederPointTrip | null>(null)
  const [tripStatus, setTripStatus] = useState<TripStatus>('not_started')

  // Trip data states
  const [wasteWeight, setWasteWeight] = useState("")
  const [tripPhotos, setTripPhotos] = useState<TripPhoto[]>([])
  const [tripNotes, setTripNotes] = useState("")
  const [startLocation, setStartLocation] = useState<{ latitude: number, longitude: number } | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number, longitude: number } | null>(null)

  // Camera states
  const [showCamera, setShowCamera] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const [cameraRef, setCameraRef] = useState<Camera | null>(null)
  const [photoType, setPhotoType] = useState<'before' | 'during' | 'after'>('before')

  // Timer states
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (feederPoints && feederPoints.length > 0) {
      initializeFeederPointTrips()
      requestPermissions()
      getCurrentLocation()
    }
  }, [feederPoints])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (tripStatus === 'in_progress' && tripStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - tripStartTime.getTime()) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [tripStatus, tripStartTime])

  const requestPermissions = async () => {
    try {
      const cameraStatus = await Camera.requestCameraPermissionsAsync()
      setCameraPermission(cameraStatus.status === 'granted')

      const locationStatus = await Location.requestForegroundPermissionsAsync()
      if (locationStatus.status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required for trip tracking.')
      }
    } catch (error) {
      console.error("❌ [TripRecording] Error requesting permissions:", error)
    }
  }

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({})
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }
      setCurrentLocation(coords)
      if (!startLocation) {
        setStartLocation(coords)
      }
    } catch (error) {
      console.error("❌ [TripRecording] Error getting location:", error)
    }
  }

  const initializeFeederPointTrips = async () => {
    try {
      setLoading(true)
      console.log("🚛 [TripRecording] Initializing feeder point trips")

      const tripData = await TripRecordingService.getTodayTripData(driverId, feederPoints)

      const feederPointTrips: FeederPointTrip[] = feederPoints.map((fp: any) => {
        const completedTrips = tripData.filter(trip =>
          trip.feederPointId === fp.id && trip.status === 'completed'
        ).length

        return {
          feederPointId: fp.id,
          feederPointName: fp.feederPointName,
          areaName: fp.areaName,
          wardNumber: fp.wardNumber,
          nearestLandmark: fp.nearestLandmark,
          approximateHouseholds: fp.approximateHouseholds,
          completedTrips,
          totalTrips: 3,
          currentTripNumber: completedTrips + 1,
          isActive: completedTrips < 3
        }
      })

      setFeederPointTrips(feederPointTrips)
      console.log("✅ [TripRecording] Feeder point trips initialized")

    } catch (error) {
      console.error("❌ [TripRecording] Error initializing trips:", error)
      Alert.alert("Error", "Failed to load trip data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const startTrip = async (feederPoint: FeederPointTrip) => {
    if (feederPoint.completedTrips >= 3) {
      Alert.alert("Trips Complete", "All 3 trips for this feeder point have been completed today.")
      return
    }

    if (tripStatus === 'in_progress') {
      Alert.alert("Trip in Progress", "Please complete the current trip before starting a new one.")
      return
    }

    try {
      console.log("🚀 [TripRecording] Starting trip for:", feederPoint.feederPointName)

      await getCurrentLocation()

      const tripData = await TripRecordingService.startTrip({
        driverId,
        vehicleId,
        feederPointId: feederPoint.feederPointId,
        tripNumber: feederPoint.currentTripNumber,
        startLocation: currentLocation || startLocation,
        contractorId: userData?.contractorId || ""
      })

      setCurrentTrip(tripData)
      setSelectedFeederPoint(feederPoint)
      setTripStatus('in_progress')
      setTripStartTime(new Date())
      setWasteWeight("")
      setTripPhotos([])
      setTripNotes("")

      Alert.alert(
        "Trip Started",
        `Trip ${feederPoint.currentTripNumber} started for ${feederPoint.feederPointName}`,
        [{ text: "OK" }]
      )

    } catch (error) {
      console.error("❌ [TripRecording] Error starting trip:", error)
      Alert.alert("Error", "Failed to start trip. Please try again.")
    }
  }

  const endTrip = async () => {
    if (!currentTrip || !selectedFeederPoint) {
      Alert.alert("Error", "No active trip to end.")
      return
    }

    if (!wasteWeight || parseFloat(wasteWeight) <= 0) {
      Alert.alert("Weight Required", "Please enter the waste weight before ending the trip.")
      return
    }

    if (tripPhotos.length === 0) {
      Alert.alert(
        "Photos Required",
        "Please take at least one photo of the waste collection before ending the trip.",
        [
          { text: "Cancel" },
          { text: "Take Photo", onPress: () => openCamera('after') }
        ]
      )
      return
    }

    try {
      console.log("🏁 [TripRecording] Ending trip for:", selectedFeederPoint.feederPointName)

      await getCurrentLocation()

      await TripRecordingService.endTrip(currentTrip.id!, {
        endLocation: currentLocation,
        wasteWeight: parseFloat(wasteWeight),
        photos: tripPhotos.map(photo => photo.uri),
        notes: tripNotes
      })

      // Update local state
      const updatedFeederPoints = feederPointTrips.map(fp =>
        fp.feederPointId === selectedFeederPoint.feederPointId
          ? {
            ...fp,
            completedTrips: fp.completedTrips + 1,
            currentTripNumber: fp.completedTrips + 2,
            isActive: fp.completedTrips + 1 < 3
          }
          : fp
      )
      setFeederPointTrips(updatedFeederPoints)

      // Reset trip state
      setCurrentTrip(null)
      setSelectedFeederPoint(null)
      setTripStatus('not_started')
      setTripStartTime(null)
      setElapsedTime(0)
      setWasteWeight("")
      setTripPhotos([])
      setTripNotes("")

      Alert.alert(
        "Trip Completed",
        `Trip ${selectedFeederPoint.currentTripNumber} completed successfully!\n\nWaste collected: ${wasteWeight}kg`,
        [{ text: "OK" }]
      )

    } catch (error) {
      console.error("❌ [TripRecording] Error ending trip:", error)
      Alert.alert("Error", "Failed to end trip. Please try again.")
    }
  }

  const openCamera = (type: 'before' | 'during' | 'after') => {
    if (!cameraPermission) {
      Alert.alert(
        "Camera Permission Required",
        "Please grant camera permission to take photos.",
        [
          { text: "Cancel" },
          { text: "Open Settings", onPress: requestPermissions }
        ]
      )
      return
    }

    setPhotoType(type)
    setShowCamera(true)
  }

  const takePicture = async () => {
    if (!cameraRef) return

    try {
      console.log("📸 [TripRecording] Taking photo:", photoType)

      const photo = await cameraRef.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      })

      const tripPhoto: TripPhoto = {
        uri: photo.uri,
        timestamp: new Date(),
        location: currentLocation || undefined,
        type: photoType
      }

      setTripPhotos(prev => [...prev, tripPhoto])
      setShowCamera(false)

      Alert.alert("Photo Captured", `${photoType} photo added to trip record.`)

    } catch (error) {
      console.error("❌ [TripRecording] Error taking picture:", error)
      Alert.alert("Error", "Failed to capture photo. Please try again.")
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getTripProgress = () => {
    const totalTrips = feederPointTrips.reduce((sum, fp) => sum + fp.totalTrips, 0)
    const completedTrips = feederPointTrips.reduce((sum, fp) => sum + fp.completedTrips, 0)
    return { completed: completedTrips, total: totalTrips, percentage: totalTrips > 0 ? completedTrips / totalTrips : 0 }
  }

  const progress = getTripProgress()

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Recording</Text>
        <View style={styles.headerRight}>
          {tripStatus === 'in_progress' && (
            <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Trip Progress */}
        <Card style={styles.progressCard}>
          <Text style={styles.cardTitle}>Today's Progress</Text>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {progress.completed} of {progress.total} trips completed
            </Text>
            <ProgressBar progress={progress.percentage} color="#10b981" style={styles.progressBar} />
          </View>
        </Card>

        {/* Current Trip Status */}
        {tripStatus === 'in_progress' && selectedFeederPoint && (
          <Card style={styles.currentTripCard}>
            <View style={styles.currentTripHeader}>
              <MaterialIcons name="play-circle-filled" size={24} color="#10b981" />
              <Text style={styles.currentTripTitle}>Trip in Progress</Text>
              <Chip mode="outlined" style={styles.activeChip}>
                Trip {selectedFeederPoint.currentTripNumber}
              </Chip>
            </View>

            <Text style={styles.currentTripLocation}>{selectedFeederPoint.feederPointName}</Text>
            <Text style={styles.currentTripArea}>{selectedFeederPoint.areaName}, Ward {selectedFeederPoint.wardNumber}</Text>

            <View style={styles.tripDataSection}>
              <Text style={styles.sectionTitle}>Trip Data</Text>

              {/* Waste Weight Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Waste Weight (kg) *</Text>
                <TextInput
                  style={styles.weightInput}
                  value={wasteWeight}
                  onChangeText={setWasteWeight}
                  placeholder="Enter weight in kg"
                  keyboardType="numeric"
                />
              </View>

              {/* Photos Section */}
              <View style={styles.photosSection}>
                <Text style={styles.inputLabel}>Photos ({tripPhotos.length})</Text>
                <View style={styles.photoButtons}>
                  <Button
                    mode="outlined"
                    onPress={() => openCamera('before')}
                    style={styles.photoButton}
                    icon="camera"
                  >
                    Before
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => openCamera('during')}
                    style={styles.photoButton}
                    icon="camera"
                  >
                    During
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => openCamera('after')}
                    style={styles.photoButton}
                    icon="camera"
                  >
                    After
                  </Button>
                </View>

                {tripPhotos.length > 0 && (
                  <ScrollView horizontal style={styles.photoPreview}>
                    {tripPhotos.map((photo, index) => (
                      <View key={index} style={styles.photoContainer}>
                        <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                        <Text style={styles.photoType}>{photo.type}</Text>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Notes Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={styles.notesInput}
                  value={tripNotes}
                  onChangeText={setTripNotes}
                  placeholder="Add any notes about this trip..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* End Trip Button */}
              <Button
                mode="contained"
                onPress={endTrip}
                style={styles.endTripButton}
                icon="stop"
              >
                End Trip
              </Button>
            </View>
          </Card>
        )}

        {/* Feeder Points List */}
        <View style={styles.feederPointsSection}>
          <Text style={styles.sectionTitle}>Collection Points ({feederPointTrips.length})</Text>

          {feederPointTrips.map((feederPoint) => (
            <Card key={feederPoint.feederPointId} style={styles.feederPointCard}>
              <View style={styles.feederPointContent}>
                <View style={styles.feederPointHeader}>
                  <MaterialIcons
                    name="location-on"
                    size={20}
                    color={feederPoint.isActive ? "#3b82f6" : "#9ca3af"}
                  />
                  <Text style={styles.feederPointName}>{feederPoint.feederPointName}</Text>
                  <View style={styles.tripStatus}>
                    <Text style={styles.tripCount}>
                      {feederPoint.completedTrips}/{feederPoint.totalTrips}
                    </Text>
                  </View>
                </View>

                <Text style={styles.feederPointArea}>
                  {feederPoint.areaName}, Ward {feederPoint.wardNumber}
                </Text>
                <Text style={styles.feederPointLandmark}>
                  📍 {feederPoint.nearestLandmark}
                </Text>
                <Text style={styles.householdsText}>
                  ~{feederPoint.approximateHouseholds} households
                </Text>

                <View style={styles.feederPointActions}>
                  {feederPoint.isActive ? (
                    <Button
                      mode="contained"
                      onPress={() => startTrip(feederPoint)}
                      style={styles.startTripButton}
                      disabled={tripStatus === 'in_progress'}
                      icon="play-arrow"
                    >
                      Start Trip {feederPoint.currentTripNumber}
                    </Button>
                  ) : (
                    <Chip mode="outlined" style={styles.completedChip}>
                      ✅ All trips completed
                    </Chip>
                  )}
                </View>
              </View>
            </Card>
          ))}
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
                  Take {photoType} photo
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
      {tripStatus !== 'in_progress' && (
        <FAB
          style={styles.fab}
          icon="play-arrow"
          label="Quick Start"
          onPress={() => {
            const nextFeederPoint = feederPointTrips.find(fp => fp.isActive)
            if (nextFeederPoint) {
              startTrip(nextFeederPoint)
            } else {
              Alert.alert("All Complete", "All trips for today have been completed!")
            }
          }}
        />
      )}
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
  headerRight: {
    minWidth: 80,
    alignItems: "flex-end",
  },
  timerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10b981",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // Progress styles
  progressCard: {
    marginBottom: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  progressInfo: {
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: "#6b7280",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  // Current trip styles
  currentTripCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#f0fdf4",
    borderColor: "#10b981",
    borderWidth: 1,
  },
  currentTripHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  currentTripTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#065f46",
    marginLeft: 8,
    flex: 1,
  },
  activeChip: {
    backgroundColor: "#dcfce7",
    borderColor: "#10b981",
  },
  currentTripLocation: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  currentTripArea: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  tripDataSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  weightInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
    textAlignVertical: "top",
  },
  // Photos styles
  photosSection: {
    gap: 12,
  },
  photoButtons: {
    flexDirection: "row",
    gap: 8,
  },
  photoButton: {
    flex: 1,
  },
  photoPreview: {
    flexDirection: "row",
  },
  photoContainer: {
    marginRight: 12,
    alignItems: "center",
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  photoType: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  endTripButton: {
    backgroundColor: "#ef4444",
    marginTop: 8,
  },
  // Feeder points styles
  feederPointsSection: {
    marginBottom: 100,
  },
  feederPointCard: {
    marginBottom: 12,
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
  tripStatus: {
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
    marginBottom: 4,
  },
  householdsText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12,
  },
  feederPointActions: {
    alignItems: "flex-start",
  },
  startTripButton: {
    backgroundColor: "#10b981",
  },
  completedChip: {
    backgroundColor: "#dcfce7",
    borderColor: "#10b981",
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
    backgroundColor: "#10b981",
  },
})

export default TripRecording
