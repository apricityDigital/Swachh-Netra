import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  limit,
  updateDoc,
  serverTimestamp
} from "firebase/firestore"
import { FIRESTORE_DB } from "../FirebaseConfig"
import { FeederPointService, FeederPoint } from "./FeederPointService"
import { DailyAssignmentService } from "./DailyAssignmentService"

// Driver-specific interfaces
export interface DriverDashboardData {
  driverId: string
  driverName: string
  assignedVehicle: AssignedVehicle | null
  assignedFeederPoints: AssignedFeederPoint[]
  todayTrips: {
    total: number
    completed: number
    pending: number
    totalWasteCollected: number
  }
  assignedWorkers: {
    total: number
    present: number
    absent: number
  }
  contractorInfo: {
    id: string
    name: string
    contact?: string
  } | null
  shiftInfo: {
    startTime?: string
    endTime?: string
    status: "not_started" | "in_progress" | "completed"
  }
}

export interface AssignedVehicle {
  id: string
  vehicleNumber: string
  type: string
  capacity: number
  status: string
  fuelLevel?: number
  contractorName?: string
  lastMaintenanceDate?: Date
}

export interface AssignedFeederPoint {
  id: string
  feederPointName: string
  areaName: string
  wardNumber: string
  nearestLandmark: string
  approximateHouseholds: string
  completedTrips: number
  totalTrips: number
  nextTripTime?: string
  estimatedDuration?: number
  priority?: "high" | "medium" | "low"
  status?: "pending" | "in_progress" | "completed"
}

export interface TripRecord {
  id?: string
  driverId: string
  vehicleId: string
  feederPointId: string
  contractorId: string
  tripNumber: number // 1, 2, or 3 (3 trips per day per feeder point)
  startTime: Date
  endTime?: Date
  wasteWeight?: number
  status: "pending" | "in_progress" | "completed" | "cancelled"
  workerIds: string[]
  photos?: string[]
  notes?: string
  createdAt: Date
}

export interface WorkerAttendance {
  workerId: string
  workerName: string
  isPresent: boolean
  checkInTime?: Date
  photoUrl?: string
  notes?: string
}

export class DriverService {
  // Get comprehensive driver dashboard data
  static async getDriverDashboardData(driverId: string): Promise<DriverDashboardData> {
    try {
      console.log("🚛 [DriverService] Fetching dashboard data for driver:", driverId)

      // Get driver information
      const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", driverId))
      if (!driverDoc.exists()) {
        throw new Error("Driver not found")
      }

      const driverData = driverDoc.data()
      console.log("👤 [DriverService] Driver data:", driverData)

      // Get assigned vehicle
      const assignedVehicle = await this.getAssignedVehicle(driverId)
      console.log("🚗 [DriverService] Assigned vehicle:", assignedVehicle)

      // Get assigned feeder points
      const assignedFeederPoints = await this.getAssignedFeederPoints(driverId)
      console.log("📍 [DriverService] Assigned feeder points:", assignedFeederPoints.length)

      // Get today's trip statistics
      const todayTrips = await this.getTodayTripStats(driverId)
      console.log("📊 [DriverService] Today's trips:", todayTrips)

      // Get assigned workers attendance
      const assignedWorkers = await this.getAssignedWorkersAttendance(driverId)
      console.log("👥 [DriverService] Assigned workers:", assignedWorkers)

      // Get contractor information
      const contractorInfo = await this.getContractorInfo(driverData.contractorId)
      console.log("🏢 [DriverService] Contractor info:", contractorInfo)

      // Get shift information
      const shiftInfo = await this.getShiftInfo(driverId)
      console.log("⏰ [DriverService] Shift info:", shiftInfo)

      const dashboardData: DriverDashboardData = {
        driverId,
        driverName: driverData.fullName || "Driver",
        assignedVehicle,
        assignedFeederPoints,
        todayTrips,
        assignedWorkers,
        contractorInfo,
        shiftInfo
      }

      console.log("✅ [DriverService] Dashboard data compiled successfully")
      return dashboardData

    } catch (error) {
      console.error("❌ [DriverService] Error fetching dashboard data:", error)
      throw new Error("Failed to fetch driver dashboard data")
    }
  }

  // Get vehicle assigned to driver
  static async getAssignedVehicle(driverId: string): Promise<AssignedVehicle | null> {
    try {
      console.log("🚗 [DriverService] Fetching assigned vehicle for driver:", driverId)

      // Check if driver has assignedVehicleId in their profile
      const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", driverId))
      if (!driverDoc.exists()) {
        console.error("❌ [DriverService] Driver document not found:", driverId)
        return null
      }

      const driverData = driverDoc.data()
      console.log("👤 [DriverService] Driver data:", {
        assignedVehicleId: driverData?.assignedVehicleId,
        contractorId: driverData?.contractorId,
        assignedFeederPointIds: driverData?.assignedFeederPointIds?.length || 0
      })

      if (!driverData?.assignedVehicleId) {
        console.log("⚠️ [DriverService] No vehicle assigned to driver")
        return null
      }

      // Get vehicle details
      const vehicleDoc = await getDoc(doc(FIRESTORE_DB, "vehicles", driverData.assignedVehicleId))
      if (!vehicleDoc.exists()) {
        console.log("⚠️ [DriverService] Assigned vehicle not found")
        return null
      }

      const vehicleData = vehicleDoc.data()

      // Get contractor name
      let contractorName = "Unknown Contractor"
      if (vehicleData.contractorId) {
        const contractorDoc = await getDoc(doc(FIRESTORE_DB, "users", vehicleData.contractorId))
        if (contractorDoc.exists()) {
          contractorName = contractorDoc.data().fullName || contractorName
        }
      }

      return {
        id: vehicleDoc.id,
        vehicleNumber: vehicleData.vehicleNumber,
        type: vehicleData.type,
        capacity: vehicleData.capacity,
        status: vehicleData.status,
        fuelLevel: vehicleData.fuelLevel,
        contractorName,
        lastMaintenanceDate: vehicleData.lastMaintenanceDate?.toDate()
      }

    } catch (error) {
      console.error("❌ [DriverService] Error fetching assigned vehicle:", error)
      return null
    }
  }

  // Get feeder points assigned to driver
  static async getAssignedFeederPoints(driverId: string): Promise<AssignedFeederPoint[]> {
    try {
      console.log("📍 [DriverService] Fetching assigned feeder points for driver:", driverId)

      // Get driver's assigned feeder point IDs
      const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", driverId))
      if (!driverDoc.exists()) {
        console.error("❌ [DriverService] Driver document not found:", driverId)
        return []
      }

      const driverData = driverDoc.data()
      console.log("📋 [DriverService] Driver feeder point assignments:", {
        assignedFeederPointIds: driverData?.assignedFeederPointIds || [],
        count: driverData?.assignedFeederPointIds?.length || 0
      })

      if (!driverData?.assignedFeederPointIds || driverData.assignedFeederPointIds.length === 0) {
        console.log("⚠️ [DriverService] No feeder points assigned to driver")
        return []
      }

      const feederPoints: AssignedFeederPoint[] = []

      for (const fpId of driverData.assignedFeederPointIds) {
        try {
          console.log(`🔍 [DriverService] Fetching feeder point details for: ${fpId}`)
          const feederPoint = await FeederPointService.getFeederPointById(fpId)
          if (feederPoint) {
            console.log(`✅ [DriverService] Feeder point found:`, {
              id: feederPoint.id,
              name: feederPoint.feederPointName,
              area: feederPoint.areaName,
              ward: feederPoint.wardNumber
            })

            // Get today's trip count for this feeder point
            const completedTrips = await this.getTodayCompletedTrips(driverId, fpId)

            feederPoints.push({
              id: feederPoint.id!,
              feederPointName: feederPoint.feederPointName,
              areaName: feederPoint.areaName,
              wardNumber: feederPoint.wardNumber,
              nearestLandmark: feederPoint.nearestLandmark,
              approximateHouseholds: feederPoint.approximateHouseholds,
              completedTrips,
              totalTrips: 3, // 3 trips per day per feeder point
              nextTripTime: this.calculateNextTripTime(completedTrips),
              estimatedDuration: 45 // minutes per trip
            })
          } else {
            console.warn(`⚠️ [DriverService] Feeder point not found: ${fpId}`)
          }
        } catch (error) {
          console.error(`❌ [DriverService] Error fetching feeder point ${fpId}:`, error)
        }
      }

      return feederPoints

    } catch (error) {
      console.error("❌ [DriverService] Error fetching assigned feeder points:", error)
      return []
    }
  }

  // Get today's trip statistics
  static async getTodayTripStats(driverId: string) {
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
        where("createdAt", ">=", todayTimestamp),
        where("createdAt", "<", tomorrowTimestamp)
      )

      const querySnapshot = await getDocs(q)

      let totalTrips = 0
      let completedTrips = 0
      let totalWasteCollected = 0

      querySnapshot.forEach((doc) => {
        const trip = doc.data()
        totalTrips++

        if (trip.status === "completed") {
          completedTrips++
          totalWasteCollected += trip.wasteWeight || 0
        }
      })

      return {
        total: totalTrips,
        completed: completedTrips,
        pending: totalTrips - completedTrips,
        totalWasteCollected
      }

    } catch (error) {
      console.error("❌ [DriverService] Error fetching today's trip stats:", error)
      return {
        total: 0,
        completed: 0,
        pending: 0,
        totalWasteCollected: 0
      }
    }
  }

  // Get assigned workers attendance
  static async getAssignedWorkersAttendance(driverId: string) {
    try {
      // Get today's worker attendance for this driver
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todayTimestamp = Timestamp.fromDate(today)
      const tomorrowTimestamp = Timestamp.fromDate(tomorrow)

      const attendanceRef = collection(FIRESTORE_DB, "workerAttendance")
      const q = query(
        attendanceRef,
        where("driverId", "==", driverId),
        where("date", ">=", todayTimestamp),
        where("date", "<", tomorrowTimestamp)
      )

      const querySnapshot = await getDocs(q)

      let totalWorkers = 0
      let presentWorkers = 0

      querySnapshot.forEach((doc) => {
        const attendance = doc.data()
        if (attendance.workers && Array.isArray(attendance.workers)) {
          totalWorkers += attendance.workers.length
          presentWorkers += attendance.workers.filter((w: any) => w.isPresent).length
        }
      })

      return {
        total: totalWorkers,
        present: presentWorkers,
        absent: totalWorkers - presentWorkers
      }

    } catch (error) {
      console.error("❌ [DriverService] Error fetching worker attendance:", error)
      return {
        total: 0,
        present: 0,
        absent: 0
      }
    }
  }

  // Get contractor information
  static async getContractorInfo(contractorId: string) {
    try {
      if (!contractorId) return null

      const contractorDoc = await getDoc(doc(FIRESTORE_DB, "users", contractorId))
      if (!contractorDoc.exists()) return null

      const contractorData = contractorDoc.data()
      return {
        id: contractorDoc.id,
        name: contractorData.fullName || "Unknown Contractor",
        contact: contractorData.phoneNumber
      }

    } catch (error) {
      console.error("❌ [DriverService] Error fetching contractor info:", error)
      return null
    }
  }

  // Get shift information
  static async getShiftInfo(driverId: string) {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todayTimestamp = Timestamp.fromDate(today)
      const tomorrowTimestamp = Timestamp.fromDate(tomorrow)

      // Check if driver has started any trips today
      const tripsRef = collection(FIRESTORE_DB, "tripRecords")
      const q = query(
        tripsRef,
        where("driverId", "==", driverId),
        where("createdAt", ">=", todayTimestamp),
        where("createdAt", "<", tomorrowTimestamp),
        orderBy("createdAt", "asc"),
        limit(1)
      )

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return {
          status: "not_started" as const
        }
      }

      const firstTrip = querySnapshot.docs[0].data()
      const startTime = firstTrip.startTime?.toDate?.() || firstTrip.createdAt?.toDate?.()

      // Check if all trips are completed
      const allTripsQuery = query(
        tripsRef,
        where("driverId", "==", driverId),
        where("createdAt", ">=", todayTimestamp),
        where("createdAt", "<", tomorrowTimestamp)
      )

      const allTripsSnapshot = await getDocs(allTripsQuery)
      const allCompleted = allTripsSnapshot.docs.every(doc => doc.data().status === "completed")

      return {
        startTime: startTime?.toLocaleTimeString(),
        status: (allCompleted ? "completed" : "in_progress") as "completed" | "in_progress"
      }

    } catch (error) {
      console.error("❌ [DriverService] Error fetching shift info:", error)
      return {
        status: "not_started" as const
      }
    }
  }

  // Helper method to get today's completed trips for a feeder point
  static async getTodayCompletedTrips(driverId: string, feederPointId: string): Promise<number> {
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
        where("status", "==", "completed"),
        where("createdAt", ">=", todayTimestamp),
        where("createdAt", "<", tomorrowTimestamp)
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.size

    } catch (error) {
      console.error("❌ [DriverService] Error fetching completed trips:", error)
      return 0
    }
  }

  // Helper method to calculate next trip time
  static calculateNextTripTime(completedTrips: number): string {
    const now = new Date()
    const currentHour = now.getHours()

    // Morning shift: 6 AM - 2 PM, Evening shift: 2 PM - 10 PM
    if (completedTrips >= 3) {
      return "All trips completed"
    }

    if (currentHour < 14) {
      // Morning shift
      const nextTripHour = 6 + (completedTrips * 2.5) // Trips every 2.5 hours
      return `${Math.floor(nextTripHour)}:${(nextTripHour % 1 * 60).toFixed(0).padStart(2, '0')}`
    } else {
      // Evening shift
      const nextTripHour = 14 + (completedTrips * 2.5)
      return `${Math.floor(nextTripHour)}:${(nextTripHour % 1 * 60).toFixed(0).padStart(2, '0')}`
    }
  }

  // Real-time listener for driver dashboard data
  static subscribeToDriverData(
    driverId: string,
    callback: (data: DriverDashboardData) => void
  ): () => void {
    console.log("🔄 [DriverService] Setting up real-time listeners for driver:", driverId)

    const unsubscribers: (() => void)[] = []

    // Listen to driver profile changes
    const driverDocRef = doc(FIRESTORE_DB, "users", driverId)
    const unsubscribeDriver = onSnapshot(driverDocRef, () => {
      this.getDriverDashboardDataWithDailyAssignments(driverId)
        .then(callback)
        .catch(console.error)
    })
    unsubscribers.push(unsubscribeDriver)

    // Listen to trip changes
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = Timestamp.fromDate(today)

    const tripsQuery = query(
      collection(FIRESTORE_DB, "tripRecords"),
      where("driverId", "==", driverId),
      where("createdAt", ">=", todayTimestamp)
    )

    const unsubscribeTrips = onSnapshot(tripsQuery, () => {
      this.getDriverDashboardDataWithDailyAssignments(driverId)
        .then(callback)
        .catch(console.error)
    })
    unsubscribers.push(unsubscribeTrips)

    // Listen to daily assignment changes
    const unsubscribeDailyAssignments = DailyAssignmentService.subscribeToDriverAssignments(
      driverId,
      () => {
        this.getDriverDashboardDataWithDailyAssignments(driverId)
          .then(callback)
          .catch(console.error)
      }
    )
    unsubscribers.push(unsubscribeDailyAssignments)

    // Listen to driver assignment changes (contractor assignments)
    const driverAssignmentsQuery = query(
      collection(FIRESTORE_DB, "driverAssignments"),
      where("driverId", "==", driverId),
      where("status", "==", "active")
    )
    const unsubscribeDriverAssignments = onSnapshot(driverAssignmentsQuery, () => {
      console.log("📡 [DriverService] Driver assignments changed, refreshing data...")
      this.getDriverDashboardDataWithDailyAssignments(driverId)
        .then(callback)
        .catch(console.error)
    })
    unsubscribers.push(unsubscribeDriverAssignments)

    // Listen to vehicle assignment changes
    const vehicleAssignmentsQuery = query(
      collection(FIRESTORE_DB, "vehicleAssignments"),
      where("driverId", "==", driverId),
      where("status", "==", "active")
    )
    const unsubscribeVehicleAssignments = onSnapshot(vehicleAssignmentsQuery, () => {
      console.log("📡 [DriverService] Vehicle assignments changed, refreshing data...")
      this.getDriverDashboardDataWithDailyAssignments(driverId)
        .then(callback)
        .catch(console.error)
    })
    unsubscribers.push(unsubscribeVehicleAssignments)

    // Listen to feeder point assignment changes
    const feederPointAssignmentsQuery = query(
      collection(FIRESTORE_DB, "feederPointAssignments"),
      where("driverId", "==", driverId),
      where("status", "==", "active")
    )
    const unsubscribeFeederPointAssignments = onSnapshot(feederPointAssignmentsQuery, () => {
      console.log("📡 [DriverService] Feeder point assignments changed, refreshing data...")
      this.getDriverDashboardDataWithDailyAssignments(driverId)
        .then(callback)
        .catch(console.error)
    })
    unsubscribers.push(unsubscribeFeederPointAssignments)

    // Listen to daily assignment document changes (additional listener)
    const dailyAssignmentsQuery = query(
      collection(FIRESTORE_DB, "dailyAssignments"),
      where("driverId", "==", driverId),
      where("status", "==", "active")
    )
    const unsubscribeDailyAssignmentsDirect = onSnapshot(dailyAssignmentsQuery, () => {
      console.log("📡 [DriverService] Daily assignments document changed, refreshing data...")
      this.getDriverDashboardDataWithDailyAssignments(driverId)
        .then(callback)
        .catch(console.error)
    })
    unsubscribers.push(unsubscribeDailyAssignmentsDirect)

    // Return cleanup function
    return () => {
      console.log("🔄 [DriverService] Cleaning up real-time listeners")
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }

  // Verify and refresh driver assignments from contractor assignments
  static async verifyDriverAssignments(driverId: string): Promise<void> {
    try {
      console.log("🔍 [DriverService] Verifying driver assignments for:", driverId)

      // Get active driver assignments from driverAssignments collection
      const assignmentsRef = collection(FIRESTORE_DB, "driverAssignments")
      const q = query(
        assignmentsRef,
        where("driverId", "==", driverId),
        where("status", "==", "active")
      )

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        console.log("⚠️ [DriverService] No active assignments found in driverAssignments collection")
        return
      }

      // Get the latest assignment
      const latestAssignment = querySnapshot.docs[0].data()
      console.log("📋 [DriverService] Latest assignment found:", {
        vehicleId: latestAssignment.vehicleId,
        feederPointIds: latestAssignment.feederPointIds,
        contractorId: latestAssignment.contractorId
      })

      // Update driver document with assignment data
      const driverRef = doc(FIRESTORE_DB, "users", driverId)
      await updateDoc(driverRef, {
        assignedVehicleId: latestAssignment.vehicleId,
        assignedFeederPointIds: latestAssignment.feederPointIds || [],
        contractorId: latestAssignment.contractorId,
        updatedAt: serverTimestamp()
      })

      console.log("✅ [DriverService] Driver assignments verified and updated")

    } catch (error) {
      console.error("❌ [DriverService] Error verifying driver assignments:", error)
    }
  }

  // Get driver assignments from driverAssignments collection
  static async getDriverAssignmentsFromCollection(driverId: string): Promise<any[]> {
    try {
      console.log("📋 [DriverService] Fetching assignments from driverAssignments collection")

      const assignmentsRef = collection(FIRESTORE_DB, "driverAssignments")
      const q = query(
        assignmentsRef,
        where("driverId", "==", driverId),
        where("status", "==", "active"),
        orderBy("assignedAt", "desc")
      )

      const querySnapshot = await getDocs(q)
      const assignments: any[] = []

      querySnapshot.forEach((doc) => {
        assignments.push({
          id: doc.id,
          ...doc.data()
        })
      })

      console.log("📊 [DriverService] Found", assignments.length, "active assignments")
      return assignments

    } catch (error) {
      console.error("❌ [DriverService] Error fetching assignments from collection:", error)
      return []
    }
  }

  // Get today's daily assignment for driver
  static async getTodayDailyAssignment(driverId: string): Promise<AssignedFeederPoint[]> {
    try {
      const todayString = new Date().toISOString().split('T')[0]
      console.log("📅 [DriverService] Fetching today's daily assignment for driver:", driverId, "date:", todayString)

      const todayAssignment = await DailyAssignmentService.getTodayAssignment(driverId)

      console.log("📋 [DriverService] Today's assignment result:", {
        found: !!todayAssignment,
        assignmentId: todayAssignment?.id,
        feederPointCount: todayAssignment?.feederPointIds?.length || 0,
        status: todayAssignment?.status,
        assignmentDate: todayAssignment?.assignmentDate
      })

      if (!todayAssignment || todayAssignment.feederPointIds.length === 0) {
        console.log("⚠️ [DriverService] No daily assignment found for today - checking fallback methods")

        // Fallback to old assignment system
        console.log("🔄 [DriverService] Trying fallback to old assignment system...")
        return await this.getAssignedFeederPoints(driverId)
      }

      // Get feeder point details
      console.log(`🔍 [DriverService] Fetching details for ${todayAssignment.feederPointIds.length} feeder points`)
      const feederPointsData = await Promise.all(
        todayAssignment.feederPointIds.map(async (fpId) => {
          try {
            console.log(`🔍 [DriverService] Fetching feeder point: ${fpId}`)
            const feederPoint = await FeederPointService.getFeederPointById(fpId)
            if (feederPoint) {
              console.log(`✅ [DriverService] Feeder point found: ${feederPoint.feederPointName}`)
              return feederPoint
            } else {
              console.warn(`⚠️ [DriverService] Feeder point not found: ${fpId}`)
              return null
            }
          } catch (error) {
            console.error(`❌ [DriverService] Error fetching feeder point ${fpId}:`, error)
            return null
          }
        })
      )

      const validFeederPoints = feederPointsData.filter(fp => fp !== null) as FeederPoint[]

      // Get today's trip records for progress tracking
      const todayDate = new Date()
      todayDate.setHours(0, 0, 0, 0)
      const todayTimestamp = Timestamp.fromDate(todayDate)

      const tripsQuery = query(
        collection(FIRESTORE_DB, "tripRecords"),
        where("driverId", "==", driverId),
        where("createdAt", ">=", todayTimestamp)
      )

      const tripsSnapshot = await getDocs(tripsQuery)
      const tripsByFeederPoint: { [key: string]: number } = {}

      tripsSnapshot.forEach((doc) => {
        const trip = doc.data()
        if (trip.status === "completed") {
          tripsByFeederPoint[trip.feederPointId] = (tripsByFeederPoint[trip.feederPointId] || 0) + 1
        }
      })

      // Convert to AssignedFeederPoint format with progress tracking
      const assignedFeederPoints: AssignedFeederPoint[] = validFeederPoints.map((fp, index) => {
        const completedTrips = tripsByFeederPoint[fp.id!] || 0
        const totalTrips = 3 // Standard 3 trips per day per feeder point

        return {
          id: fp.id!,
          feederPointName: fp.feederPointName,
          areaName: fp.areaName,
          wardNumber: fp.wardNumber,
          nearestLandmark: fp.nearestLandmark,
          approximateHouseholds: fp.approximateHouseholds,
          completedTrips,
          totalTrips,
          nextTripTime: this.calculateNextTripTime(completedTrips),
          estimatedDuration: 45, // Default 45 minutes per trip
          priority: this.calculatePriority(index, validFeederPoints.length),
          status: completedTrips >= totalTrips ? "completed" :
            completedTrips > 0 ? "in_progress" : "pending"
        }
      })

      console.log(`✅ [DriverService] Found ${assignedFeederPoints.length} assigned feeder points for today`)
      return assignedFeederPoints

    } catch (error) {
      console.error("❌ [DriverService] Error fetching today's daily assignment:", error)
      return []
    }
  }

  // Calculate priority based on position in list and other factors
  private static calculatePriority(index: number, total: number): "high" | "medium" | "low" {
    const ratio = index / total
    if (ratio < 0.3) return "high"
    if (ratio < 0.7) return "medium"
    return "low"
  }

  // Enhanced method to get driver dashboard data with daily assignments
  static async getDriverDashboardDataWithDailyAssignments(driverId: string): Promise<DriverDashboardData> {
    try {
      console.log("🔄 [DriverService] Fetching enhanced driver dashboard data for:", driverId)

      // Get basic dashboard data
      const basicData = await this.getDriverDashboardData(driverId)

      // Get today's daily assignment (this will override the basic assigned feeder points)
      const todayAssignedFeederPoints = await this.getTodayDailyAssignment(driverId)

      // Return enhanced data with today's specific assignments
      return {
        ...basicData,
        assignedFeederPoints: todayAssignedFeederPoints
      }

    } catch (error) {
      console.error("❌ [DriverService] Error fetching enhanced dashboard data:", error)
      // Fallback to basic data
      return this.getDriverDashboardData(driverId)
    }
  }
}
