import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { FIRESTORE_DB } from '../FirebaseConfig'
import * as Location from 'expo-location'

export interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: Date
}

export interface WorkerAttendanceRecord {
  id?: string
  workerId: string
  workerName: string
  feederPointId: string
  feederPointName: string
  driverId: string
  driverName: string
  tripId: string
  status: 'present' | 'absent'
  timestamp: Date
  location: LocationData
  photoUri?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface TripSession {
  id?: string
  driverId: string
  driverName: string
  vehicleId: string
  vehicleNumber: string
  feederPointId: string
  feederPointName: string
  areaName: string
  wardNumber: string
  startLocation: LocationData
  endLocation?: LocationData
  startTime: Date
  endTime?: Date
  status: 'started' | 'in_progress' | 'completed' | 'cancelled'
  workerAttendanceRecords: string[] // Array of attendance record IDs
  totalWorkers: number
  presentWorkers: number
  absentWorkers: number
  createdAt: Date
  updatedAt: Date
}

export class LocationBasedTripService {
  private static readonly PROXIMITY_THRESHOLD = 100 // 100 meters

  // Calculate distance between two coordinates using Haversine formula
  static calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }

  // Check if driver is within proximity of feeder point
  static async checkProximityToFeederPoint(
    feederPointId: string,
    currentLocation: LocationData
  ): Promise<{ isWithinRange: boolean; distance: number; feederPoint: any }> {
    try {
      console.log("🔍 [LocationBasedTripService] Checking proximity to feeder point:", feederPointId)
      
      const feederPointDoc = await getDoc(doc(FIRESTORE_DB, "feederPoints", feederPointId))
      if (!feederPointDoc.exists()) {
        throw new Error("Feeder point not found")
      }

      const feederPointData = feederPointDoc.data()
      
      // Check if feeder point has GPS coordinates
      if (!feederPointData.gpsCoordinates || 
          !feederPointData.gpsCoordinates.latitude || 
          !feederPointData.gpsCoordinates.longitude) {
        console.warn("⚠️ [LocationBasedTripService] Feeder point has no GPS coordinates, allowing trip start")
        return {
          isWithinRange: true,
          distance: 0,
          feederPoint: { id: feederPointDoc.id, ...feederPointData }
        }
      }

      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        feederPointData.gpsCoordinates.latitude,
        feederPointData.gpsCoordinates.longitude
      )

      console.log(`📍 [LocationBasedTripService] Distance to feeder point: ${distance.toFixed(2)}m`)

      return {
        isWithinRange: distance <= this.PROXIMITY_THRESHOLD,
        distance,
        feederPoint: { id: feederPointDoc.id, ...feederPointData }
      }
    } catch (error) {
      console.error("❌ [LocationBasedTripService] Error checking proximity:", error)
      throw error
    }
  }

  // Get current location
  static async getCurrentLocation(): Promise<LocationData> {
    try {
      console.log("📍 [LocationBasedTripService] Getting current location...")
      
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        throw new Error('Location permission not granted')
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 1,
      })

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: new Date(location.timestamp)
      }

      console.log("✅ [LocationBasedTripService] Location obtained:", {
        lat: locationData.latitude.toFixed(6),
        lng: locationData.longitude.toFixed(6),
        accuracy: locationData.accuracy
      })

      return locationData
    } catch (error) {
      console.error("❌ [LocationBasedTripService] Error getting location:", error)
      throw error
    }
  }

  // Get workers assigned to a feeder point
  static async getAssignedWorkers(feederPointId: string): Promise<any[]> {
    try {
      console.log("👥 [LocationBasedTripService] Getting assigned workers for feeder point:", feederPointId)
      
      // Get workers from the workers collection who are assigned to this feeder point
      const workersQuery = query(
        collection(FIRESTORE_DB, "workers"),
        where("isActive", "==", true)
      )
      
      const workersSnapshot = await getDocs(workersQuery)
      const assignedWorkers: any[] = []
      
      workersSnapshot.forEach((doc) => {
        const data = doc.data()
        const assignedFeederPointIds = Array.isArray(data.assignedFeederPointIds) ? data.assignedFeederPointIds : []
        
        if (assignedFeederPointIds.includes(feederPointId)) {
          assignedWorkers.push({
            id: doc.id,
            fullName: data.fullName || data.name || "Unknown Worker",
            email: data.email || "",
            phoneNumber: data.phoneNumber || data.phone || "",
            employeeId: data.employeeId || "",
            zone: data.zone || "",
            ward: data.ward || "",
            kothi: data.kothi || "",
            assignedFeederPointIds
          })
        }
      })
      
      console.log(`✅ [LocationBasedTripService] Found ${assignedWorkers.length} assigned workers`)
      return assignedWorkers
    } catch (error) {
      console.error("❌ [LocationBasedTripService] Error getting assigned workers:", error)
      throw error
    }
  }

  // Start a trip session
  static async startTripSession(
    driverId: string,
    driverName: string,
    vehicleId: string,
    vehicleNumber: string,
    feederPointId: string,
    location: LocationData
  ): Promise<string> {
    try {
      console.log("🚀 [LocationBasedTripService] Starting trip session...")
      
      // Get feeder point details
      const feederPointDoc = await getDoc(doc(FIRESTORE_DB, "feederPoints", feederPointId))
      if (!feederPointDoc.exists()) {
        throw new Error("Feeder point not found")
      }
      
      const feederPointData = feederPointDoc.data()
      
      // Get assigned workers count
      const assignedWorkers = await this.getAssignedWorkers(feederPointId)
      
      const tripSession: Omit<TripSession, "id"> = {
        driverId,
        driverName,
        vehicleId,
        vehicleNumber,
        feederPointId,
        feederPointName: feederPointData.feederPointName || "Unknown Point",
        areaName: feederPointData.areaName || "",
        wardNumber: String(feederPointData.wardNumber || ""),
        startLocation: location,
        startTime: new Date(),
        status: 'started',
        workerAttendanceRecords: [],
        totalWorkers: assignedWorkers.length,
        presentWorkers: 0,
        absentWorkers: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const docRef = await addDoc(collection(FIRESTORE_DB, "tripSessions"), tripSession)
      
      console.log("✅ [LocationBasedTripService] Trip session started:", docRef.id)
      return docRef.id
    } catch (error) {
      console.error("❌ [LocationBasedTripService] Error starting trip session:", error)
      throw error
    }
  }

  // Record worker attendance
  static async recordWorkerAttendance(
    tripId: string,
    workerId: string,
    workerName: string,
    feederPointId: string,
    feederPointName: string,
    driverId: string,
    driverName: string,
    status: 'present' | 'absent',
    location: LocationData,
    photoUri?: string,
    notes?: string
  ): Promise<string> {
    try {
      console.log(`📝 [LocationBasedTripService] Recording attendance for ${workerName}: ${status}`)
      
      const attendanceRecord: Omit<WorkerAttendanceRecord, "id"> = {
        workerId,
        workerName,
        feederPointId,
        feederPointName,
        driverId,
        driverName,
        tripId,
        status,
        timestamp: new Date(),
        location,
        photoUri,
        notes,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const docRef = await addDoc(collection(FIRESTORE_DB, "workerAttendance"), attendanceRecord)
      
      // Update trip session with attendance record
      const tripRef = doc(FIRESTORE_DB, "tripSessions", tripId)
      const tripDoc = await getDoc(tripRef)
      
      if (tripDoc.exists()) {
        const tripData = tripDoc.data()
        const updatedRecords = [...(tripData.workerAttendanceRecords || []), docRef.id]
        const presentCount = status === 'present' ? (tripData.presentWorkers || 0) + 1 : (tripData.presentWorkers || 0)
        const absentCount = status === 'absent' ? (tripData.absentWorkers || 0) + 1 : (tripData.absentWorkers || 0)
        
        await updateDoc(tripRef, {
          workerAttendanceRecords: updatedRecords,
          presentWorkers: presentCount,
          absentWorkers: absentCount,
          status: 'in_progress',
          updatedAt: serverTimestamp()
        })
      }
      
      console.log("✅ [LocationBasedTripService] Attendance recorded:", docRef.id)
      return docRef.id
    } catch (error) {
      console.error("❌ [LocationBasedTripService] Error recording attendance:", error)
      throw error
    }
  }

  // Get attendance records for a trip
  static async getTripAttendanceRecords(tripId: string): Promise<WorkerAttendanceRecord[]> {
    try {
      const attendanceQuery = query(
        collection(FIRESTORE_DB, "workerAttendance"),
        where("tripId", "==", tripId),
        orderBy("timestamp", "desc")
      )
      
      const attendanceSnapshot = await getDocs(attendanceQuery)
      const records: WorkerAttendanceRecord[] = []
      
      attendanceSnapshot.forEach((doc) => {
        const data = doc.data()
        records.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as WorkerAttendanceRecord)
      })
      
      return records
    } catch (error) {
      console.error("❌ [LocationBasedTripService] Error getting attendance records:", error)
      throw error
    }
  }

  // Complete trip session
  static async completeTripSession(tripId: string, endLocation: LocationData): Promise<void> {
    try {
      console.log("🏁 [LocationBasedTripService] Completing trip session:", tripId)
      
      const tripRef = doc(FIRESTORE_DB, "tripSessions", tripId)
      await updateDoc(tripRef, {
        endLocation,
        endTime: new Date(),
        status: 'completed',
        updatedAt: serverTimestamp()
      })
      
      console.log("✅ [LocationBasedTripService] Trip session completed")
    } catch (error) {
      console.error("❌ [LocationBasedTripService] Error completing trip session:", error)
      throw error
    }
  }
}
