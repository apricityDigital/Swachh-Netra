import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  limit
} from "firebase/firestore"
import { FIRESTORE_DB } from "../FirebaseConfig"

// Trip Recording interfaces
export type TripStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled'

export interface TripData {
  id?: string
  driverId: string
  vehicleId: string
  feederPointId: string
  contractorId: string
  tripNumber: number // 1, 2, or 3 (3 trips per day per feeder point)
  status: TripStatus
  startTime: Date
  endTime?: Date
  startLocation?: {
    latitude: number
    longitude: number
  }
  endLocation?: {
    latitude: number
    longitude: number
  }
  wasteWeight?: number // in kg
  photos?: string[] // photo URLs
  notes?: string
  workerIds?: string[] // workers assigned to this trip
  createdAt: Date
  updatedAt: Date
}

export interface StartTripParams {
  driverId: string
  vehicleId: string
  feederPointId: string
  tripNumber: number
  contractorId: string
  startLocation?: {
    latitude: number
    longitude: number
  }
  workerIds?: string[]
}

export interface EndTripParams {
  endLocation?: {
    latitude: number
    longitude: number
  }
  wasteWeight: number
  photos?: string[]
  notes?: string
  workerIds?: string[]
}

export interface TripStatistics {
  totalTrips: number
  completedTrips: number
  pendingTrips: number
  totalWasteCollected: number
  averageTripDuration: number // in minutes
  tripsPerFeederPoint: { [feederPointId: string]: number }
}

export class TripRecordingService {
  // Get today's trip data for a driver
  static async getTodayTripData(driverId: string, feederPoints: any[]): Promise<TripData[]> {
    try {
      console.log("🚛 [TripRecordingService] Fetching today's trip data for driver:", driverId)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todayTimestamp = Timestamp.fromDate(today)
      const tomorrowTimestamp = Timestamp.fromDate(tomorrow)

      const tripsRef = collection(FIRESTORE_DB, "tripRecords")
      const q = query(
        tripsRef,
        where("driverId", "==", driverId),
        where("createdAt", ">=", todayTimestamp),
        where("createdAt", "<", tomorrowTimestamp),
        orderBy("createdAt", "desc")
      )

      const querySnapshot = await getDocs(q)
      const trips: TripData[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        trips.push({
          id: doc.id,
          driverId: data.driverId,
          vehicleId: data.vehicleId,
          feederPointId: data.feederPointId,
          contractorId: data.contractorId,
          tripNumber: data.tripNumber,
          status: data.status,
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate(),
          startLocation: data.startLocation,
          endLocation: data.endLocation,
          wasteWeight: data.wasteWeight,
          photos: data.photos || [],
          notes: data.notes,
          workerIds: data.workerIds || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        })
      })

      console.log("✅ [TripRecordingService] Found", trips.length, "trips for today")
      return trips

    } catch (error) {
      console.error("❌ [TripRecordingService] Error fetching today's trip data:", error)
      return []
    }
  }

  // Start a new trip
  static async startTrip(params: StartTripParams): Promise<TripData> {
    try {
      console.log("🚀 [TripRecordingService] Starting trip for feeder point:", params.feederPointId)

      // Validate that this trip number is allowed (max 3 per day per feeder point)
      const todayTrips = await this.getTodayTripsForFeederPoint(params.driverId, params.feederPointId)
      const existingTripNumbers = todayTrips.map(trip => trip.tripNumber)

      if (existingTripNumbers.includes(params.tripNumber)) {
        throw new Error(`Trip ${params.tripNumber} already completed for this feeder point today`)
      }

      if (params.tripNumber > 3) {
        throw new Error("Maximum 3 trips per day per feeder point allowed")
      }

      // Check if driver has any active trips
      const activeTrip = await this.getActiveTrip(params.driverId)
      if (activeTrip) {
        throw new Error("Driver already has an active trip. Please complete it first.")
      }

      const tripData: Omit<TripData, "id"> = {
        driverId: params.driverId,
        vehicleId: params.vehicleId,
        feederPointId: params.feederPointId,
        contractorId: params.contractorId,
        tripNumber: params.tripNumber,
        status: 'in_progress',
        startTime: new Date(),
        startLocation: params.startLocation,
        workerIds: params.workerIds || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Save to Firebase
      const tripRef = await addDoc(collection(FIRESTORE_DB, "tripRecords"), {
        ...tripData,
        startTime: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      const savedTrip: TripData = {
        id: tripRef.id,
        ...tripData
      }

      console.log("✅ [TripRecordingService] Trip started successfully with ID:", tripRef.id)
      return savedTrip

    } catch (error) {
      console.error("❌ [TripRecordingService] Error starting trip:", error)
      throw new Error(`Failed to start trip: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // End a trip
  static async endTrip(tripId: string, params: EndTripParams): Promise<void> {
    try {
      console.log("🏁 [TripRecordingService] Ending trip:", tripId)

      if (params.wasteWeight <= 0) {
        throw new Error("Waste weight must be greater than 0")
      }

      const tripRef = doc(FIRESTORE_DB, "tripRecords", tripId)
      const tripDoc = await getDoc(tripRef)

      if (!tripDoc.exists()) {
        throw new Error("Trip not found")
      }

      const tripData = tripDoc.data()
      if (tripData.status !== 'in_progress') {
        throw new Error("Trip is not in progress")
      }

      // Calculate trip duration
      const startTime = tripData.startTime?.toDate() || new Date()
      const endTime = new Date()
      const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))

      await updateDoc(tripRef, {
        status: 'completed',
        endTime: serverTimestamp(),
        endLocation: params.endLocation,
        wasteWeight: params.wasteWeight,
        photos: params.photos || [],
        notes: params.notes || "",
        workerIds: params.workerIds || tripData.workerIds || [],
        updatedAt: serverTimestamp()
      })

      console.log("✅ [TripRecordingService] Trip completed successfully. Duration:", durationMinutes, "minutes")

    } catch (error) {
      console.error("❌ [TripRecordingService] Error ending trip:", error)
      throw new Error(`Failed to end trip: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get active trip for a driver
  static async getActiveTrip(driverId: string): Promise<TripData | null> {
    try {
      const tripsRef = collection(FIRESTORE_DB, "tripRecords")
      const q = query(
        tripsRef,
        where("driverId", "==", driverId),
        where("status", "==", "in_progress"),
        limit(1)
      )

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return null
      }

      const doc = querySnapshot.docs[0]
      const data = doc.data()

      return {
        id: doc.id,
        driverId: data.driverId,
        vehicleId: data.vehicleId,
        feederPointId: data.feederPointId,
        contractorId: data.contractorId,
        tripNumber: data.tripNumber,
        status: data.status,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate(),
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        wasteWeight: data.wasteWeight,
        photos: data.photos || [],
        notes: data.notes,
        workerIds: data.workerIds || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      }

    } catch (error) {
      console.error("❌ [TripRecordingService] Error getting active trip:", error)
      return null
    }
  }

  // Get today's trips for a specific feeder point
  static async getTodayTripsForFeederPoint(driverId: string, feederPointId: string): Promise<TripData[]> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todayTimestamp = Timestamp.fromDate(today)
      const tomorrowTimestamp = Timestamp.fromDate(tomorrow)

      const tripsRef = collection(FIRESTORE_DB, "tripRecords")
      const q = query(
        tripsRef,
        where("driverId", "==", driverId),
        where("feederPointId", "==", feederPointId),
        where("createdAt", ">=", todayTimestamp),
        where("createdAt", "<", tomorrowTimestamp),
        orderBy("createdAt", "asc")
      )

      const querySnapshot = await getDocs(q)
      const trips: TripData[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        trips.push({
          id: doc.id,
          driverId: data.driverId,
          vehicleId: data.vehicleId,
          feederPointId: data.feederPointId,
          contractorId: data.contractorId,
          tripNumber: data.tripNumber,
          status: data.status,
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate(),
          startLocation: data.startLocation,
          endLocation: data.endLocation,
          wasteWeight: data.wasteWeight,
          photos: data.photos || [],
          notes: data.notes,
          workerIds: data.workerIds || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        })
      })

      return trips

    } catch (error) {
      console.error("❌ [TripRecordingService] Error fetching feeder point trips:", error)
      return []
    }
  }

  // Cancel an active trip
  static async cancelTrip(tripId: string, reason?: string): Promise<void> {
    try {
      console.log("❌ [TripRecordingService] Cancelling trip:", tripId)

      const tripRef = doc(FIRESTORE_DB, "tripRecords", tripId)
      const tripDoc = await getDoc(tripRef)

      if (!tripDoc.exists()) {
        throw new Error("Trip not found")
      }

      const tripData = tripDoc.data()
      if (tripData.status !== 'in_progress') {
        throw new Error("Only in-progress trips can be cancelled")
      }

      await updateDoc(tripRef, {
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : "Trip cancelled",
        updatedAt: serverTimestamp()
      })

      console.log("✅ [TripRecordingService] Trip cancelled successfully")

    } catch (error) {
      console.error("❌ [TripRecordingService] Error cancelling trip:", error)
      throw new Error(`Failed to cancel trip: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get trip statistics for a driver
  static async getTripStatistics(driverId: string, startDate: Date, endDate: Date): Promise<TripStatistics> {
    try {
      const startTimestamp = Timestamp.fromDate(startDate)
      const endTimestamp = Timestamp.fromDate(endDate)

      const tripsRef = collection(FIRESTORE_DB, "tripRecords")
      const q = query(
        tripsRef,
        where("driverId", "==", driverId),
        where("createdAt", ">=", startTimestamp),
        where("createdAt", "<=", endTimestamp),
        orderBy("createdAt", "desc")
      )

      const querySnapshot = await getDocs(q)
      const trips: TripData[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        trips.push({
          id: doc.id,
          driverId: data.driverId,
          vehicleId: data.vehicleId,
          feederPointId: data.feederPointId,
          contractorId: data.contractorId,
          tripNumber: data.tripNumber,
          status: data.status,
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate(),
          startLocation: data.startLocation,
          endLocation: data.endLocation,
          wasteWeight: data.wasteWeight,
          photos: data.photos || [],
          notes: data.notes,
          workerIds: data.workerIds || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        })
      })

      // Calculate statistics
      const totalTrips = trips.length
      const completedTrips = trips.filter(trip => trip.status === 'completed').length
      const pendingTrips = trips.filter(trip => trip.status === 'in_progress').length
      const totalWasteCollected = trips
        .filter(trip => trip.status === 'completed')
        .reduce((sum, trip) => sum + (trip.wasteWeight || 0), 0)

      // Calculate average trip duration
      const completedTripsWithDuration = trips.filter(trip =>
        trip.status === 'completed' && trip.startTime && trip.endTime
      )
      const totalDuration = completedTripsWithDuration.reduce((sum, trip) => {
        const duration = (trip.endTime!.getTime() - trip.startTime.getTime()) / (1000 * 60) // minutes
        return sum + duration
      }, 0)
      const averageTripDuration = completedTripsWithDuration.length > 0
        ? totalDuration / completedTripsWithDuration.length
        : 0

      // Calculate trips per feeder point
      const tripsPerFeederPoint: { [feederPointId: string]: number } = {}
      trips.forEach(trip => {
        if (trip.status === 'completed') {
          tripsPerFeederPoint[trip.feederPointId] = (tripsPerFeederPoint[trip.feederPointId] || 0) + 1
        }
      })

      return {
        totalTrips,
        completedTrips,
        pendingTrips,
        totalWasteCollected,
        averageTripDuration,
        tripsPerFeederPoint
      }

    } catch (error) {
      console.error("❌ [TripRecordingService] Error fetching trip statistics:", error)
      return {
        totalTrips: 0,
        completedTrips: 0,
        pendingTrips: 0,
        totalWasteCollected: 0,
        averageTripDuration: 0,
        tripsPerFeederPoint: {}
      }
    }
  }

  // Real-time listener for trip updates
  static subscribeToTripUpdates(
    driverId: string,
    callback: (trips: TripData[]) => void
  ): () => void {
    console.log("🔄 [TripRecordingService] Setting up real-time trip listener for driver:", driverId)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = Timestamp.fromDate(today)

    const tripsQuery = query(
      collection(FIRESTORE_DB, "tripRecords"),
      where("driverId", "==", driverId),
      where("createdAt", ">=", todayTimestamp),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(tripsQuery, (querySnapshot) => {
      const trips: TripData[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        trips.push({
          id: doc.id,
          driverId: data.driverId,
          vehicleId: data.vehicleId,
          feederPointId: data.feederPointId,
          contractorId: data.contractorId,
          tripNumber: data.tripNumber,
          status: data.status,
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate(),
          startLocation: data.startLocation,
          endLocation: data.endLocation,
          wasteWeight: data.wasteWeight,
          photos: data.photos || [],
          notes: data.notes,
          workerIds: data.workerIds || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        })
      })

      callback(trips)
    })

    return () => {
      console.log("🔄 [TripRecordingService] Cleaning up real-time trip listener")
      unsubscribe()
    }
  }

  // Validate trip constraints
  static async validateTripConstraints(driverId: string, feederPointId: string, tripNumber: number): Promise<{
    isValid: boolean
    message?: string
  }> {
    try {
      // Check if driver has an active trip
      const activeTrip = await this.getActiveTrip(driverId)
      if (activeTrip) {
        return {
          isValid: false,
          message: "Driver already has an active trip. Please complete it first."
        }
      }

      // Check if this trip number is already completed today
      const todayTrips = await this.getTodayTripsForFeederPoint(driverId, feederPointId)
      const existingTripNumbers = todayTrips.map(trip => trip.tripNumber)

      if (existingTripNumbers.includes(tripNumber)) {
        return {
          isValid: false,
          message: `Trip ${tripNumber} already completed for this feeder point today`
        }
      }

      // Check if maximum trips per day exceeded
      if (tripNumber > 3) {
        return {
          isValid: false,
          message: "Maximum 3 trips per day per feeder point allowed"
        }
      }

      // Check if trips are being done in order
      const maxCompletedTrip = Math.max(0, ...existingTripNumbers)
      if (tripNumber > maxCompletedTrip + 1) {
        return {
          isValid: false,
          message: `Please complete trip ${maxCompletedTrip + 1} first`
        }
      }

      return { isValid: true }

    } catch (error) {
      console.error("❌ [TripRecordingService] Error validating trip constraints:", error)
      return {
        isValid: false,
        message: "Error validating trip. Please try again."
      }
    }
  }
}
