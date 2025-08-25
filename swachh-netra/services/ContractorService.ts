import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore"
import { FIRESTORE_DB } from "../FirebaseConfig"
import { FeederPointService, FeederPoint, FeederPointAssignment } from "./FeederPointService"

// Enhanced interfaces for contractor operations
export interface ContractorData {
  id: string
  fullName: string
  email: string
  phoneNumber?: string
  role: "transport_contractor"
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  lastLogin?: Timestamp
  // Contractor-specific fields
  companyName?: string
  licenseNumber?: string
  address?: string
  serviceAreas?: string[]
}

export interface VehicleAssignment {
  id?: string
  vehicleId: string
  contractorId: string
  driverId?: string
  assignedAt: Date
  assignedBy: string
  status: "assigned" | "unassigned" | "in_use" | "maintenance"
  notes?: string
}

export interface DriverAssignment {
  id?: string
  driverId: string
  contractorId: string
  vehicleId?: string
  feederPointIds: string[]
  assignedAt: Date
  assignedBy: string
  status: "active" | "inactive"
  shiftType: "morning" | "afternoon" | "evening" | "night"
  notes?: string
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
  workerAttendance: WorkerAttendance[]
  status: "pending" | "in_progress" | "completed" | "cancelled"
  gpsCoordinates?: {
    start: { latitude: number; longitude: number }
    end?: { latitude: number; longitude: number }
  }
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

export interface ContractorDashboardStats {
  totalDrivers: number
  activeDrivers: number
  totalVehicles: number
  activeVehicles: number
  assignedFeederPoints: number
  todayTrips: {
    total: number
    completed: number
    pending: number
  }
  todayAttendance: {
    totalWorkers: number
    presentWorkers: number
    absentWorkers: number
  }
  pendingApprovals: number
}

export class ContractorService {
  // Get contractor's real-time dashboard data
  static async getContractorDashboardData(contractorId: string): Promise<ContractorDashboardStats> {
    try {
      const [
        drivers,
        vehicles,
        feederPointAssignments,
        todayTrips,
        workerAttendance
      ] = await Promise.all([
        this.getContractorDrivers(contractorId),
        this.getContractorVehicles(contractorId),
        this.getContractorFeederPoints(contractorId),
        this.getTodayTrips(contractorId),
        this.getTodayWorkerAttendance(contractorId)
      ])

      const activeDrivers = drivers.filter(d => d.isActive).length
      const activeVehicles = vehicles.filter(v => v.status === "active").length

      const completedTrips = todayTrips.filter(t => t.status === "completed").length
      const pendingTrips = todayTrips.filter(t => t.status === "pending").length

      const presentWorkers = workerAttendance.filter(w => w.isPresent).length

      return {
        totalDrivers: drivers.length,
        activeDrivers,
        totalVehicles: vehicles.length,
        activeVehicles,
        assignedFeederPoints: feederPointAssignments.length,
        todayTrips: {
          total: todayTrips.length,
          completed: completedTrips,
          pending: pendingTrips,
        },
        todayAttendance: {
          totalWorkers: workerAttendance.length,
          presentWorkers,
          absentWorkers: workerAttendance.length - presentWorkers,
        },
        pendingApprovals: 0, // TODO: Implement driver approval system
      }
    } catch (error) {
      console.error("Error fetching contractor dashboard data:", error)
      throw new Error("Failed to fetch dashboard data")
    }
  }

  // Get drivers assigned to contractor
  static async getContractorDrivers(contractorId: string) {
    try {
      const driversRef = collection(FIRESTORE_DB, "users")
      const q = query(
        driversRef,
        where("role", "==", "driver"),
        where("contractorId", "==", contractorId)
      )
      const querySnapshot = await getDocs(q)

      const drivers: any[] = []
      querySnapshot.forEach((doc) => {
        drivers.push({ id: doc.id, ...doc.data() })
      })

      return drivers
    } catch (error) {
      console.error("Error fetching contractor drivers:", error)
      throw error
    }
  }

  // Get vehicles assigned to contractor
  static async getContractorVehicles(contractorId: string) {
    try {
      const vehiclesRef = collection(FIRESTORE_DB, "vehicles")
      const q = query(
        vehiclesRef,
        where("contractorId", "==", contractorId)
      )
      const querySnapshot = await getDocs(q)

      const vehicles: any[] = []
      querySnapshot.forEach((doc) => {
        vehicles.push({ id: doc.id, ...doc.data() })
      })

      return vehicles
    } catch (error) {
      console.error("Error fetching contractor vehicles:", error)
      throw error
    }
  }

  // Get feeder points assigned to contractor
  static async getContractorFeederPoints(contractorId: string): Promise<FeederPoint[]> {
    try {
      const assignments = await FeederPointService.getAssignmentsByContractor(contractorId)
      const feederPointIds = assignments.map(a => a.feederPointId)

      if (feederPointIds.length === 0) return []

      const feederPoints: FeederPoint[] = []
      for (const fpId of feederPointIds) {
        try {
          const fp = await FeederPointService.getFeederPointById(fpId)
          if (fp) feederPoints.push(fp)
        } catch (error) {
          console.error(`Error fetching feeder point ${fpId}:`, error)
        }
      }

      return feederPoints
    } catch (error) {
      console.error("Error fetching contractor feeder points:", error)
      throw error
    }
  }

  // Get today's trips for contractor
  static async getTodayTrips(contractorId: string): Promise<TripRecord[]> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Convert to Firestore Timestamps
      const todayTimestamp = Timestamp.fromDate(today)
      const tomorrowTimestamp = Timestamp.fromDate(tomorrow)

      const tripsRef = collection(FIRESTORE_DB, "tripRecords")
      const q = query(
        tripsRef,
        where("contractorId", "==", contractorId),
        where("createdAt", ">=", todayTimestamp),
        where("createdAt", "<", tomorrowTimestamp),
        orderBy("createdAt", "desc")
      )
      const querySnapshot = await getDocs(q)

      const trips: TripRecord[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        trips.push({
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps back to Date objects for easier handling
          startTime: data.startTime?.toDate?.() || new Date(),
          endTime: data.endTime?.toDate?.() || undefined,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        } as TripRecord)
      })

      return trips
    } catch (error) {
      console.error("Error fetching today's trips:", error)
      // Return empty array if collection doesn't exist or query fails
      return []
    }
  }

  // Get today's worker attendance
  static async getTodayWorkerAttendance(contractorId: string): Promise<WorkerAttendance[]> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Convert to Firestore Timestamps
      const todayTimestamp = Timestamp.fromDate(today)
      const tomorrowTimestamp = Timestamp.fromDate(tomorrow)

      const attendanceRef = collection(FIRESTORE_DB, "workerAttendance")
      const q = query(
        attendanceRef,
        where("contractorId", "==", contractorId),
        where("date", ">=", todayTimestamp),
        where("date", "<", tomorrowTimestamp)
      )
      const querySnapshot = await getDocs(q)

      const attendance: WorkerAttendance[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        // Handle different data structures
        if (data.workers && Array.isArray(data.workers)) {
          attendance.push(...data.workers)
        } else if (data.workerId) {
          // Single worker attendance record
          attendance.push({
            workerId: data.workerId,
            workerName: data.workerName || "Unknown",
            isPresent: data.isPresent || false,
            checkInTime: data.checkInTime?.toDate?.() || undefined,
            photoUrl: data.photoUrl || undefined,
            notes: data.notes || undefined,
          })
        }
      })

      return attendance
    } catch (error) {
      console.error("Error fetching today's worker attendance:", error)
      // Return empty array if collection doesn't exist or query fails
      return []
    }
  }

  // Assign vehicle to driver
  static async assignVehicleToDriver(
    contractorId: string,
    vehicleId: string,
    driverId: string,
    feederPointIds: string[]
  ): Promise<void> {
    try {
      const batch = writeBatch(FIRESTORE_DB)

      // Create driver assignment
      const driverAssignmentRef = doc(collection(FIRESTORE_DB, "driverAssignments"))
      const driverAssignment = {
        driverId,
        contractorId,
        vehicleId,
        feederPointIds,
        assignedAt: serverTimestamp(),
        assignedBy: contractorId,
        status: "active",
        shiftType: "morning", // Default shift
      }
      batch.set(driverAssignmentRef, driverAssignment)

      // Update vehicle assignment
      const vehicleRef = doc(FIRESTORE_DB, "vehicles", vehicleId)
      batch.update(vehicleRef, {
        driverId,
        status: "assigned",
        updatedAt: serverTimestamp(),
      })

      // Update driver with assigned vehicle
      const driverRef = doc(FIRESTORE_DB, "users", driverId)
      batch.update(driverRef, {
        assignedVehicleId: vehicleId,
        assignedFeederPointIds: feederPointIds,
        updatedAt: serverTimestamp(),
      })

      await batch.commit()
    } catch (error) {
      console.error("Error assigning vehicle to driver:", error)
      throw new Error("Failed to assign vehicle to driver")
    }
  }

  // Real-time listener for contractor dashboard
  static subscribeToContractorData(
    contractorId: string,
    callback: (data: ContractorDashboardStats) => void
  ): () => void {
    // Set up real-time listeners for all relevant collections
    const unsubscribers: (() => void)[] = []

    // Listen to driver changes
    const driversQuery = query(
      collection(FIRESTORE_DB, "users"),
      where("role", "==", "driver"),
      where("contractorId", "==", contractorId)
    )

    const unsubscribeDrivers = onSnapshot(driversQuery, () => {
      // Refresh dashboard data when drivers change
      this.getContractorDashboardData(contractorId)
        .then(callback)
        .catch(console.error)
    })
    unsubscribers.push(unsubscribeDrivers)

    // Listen to vehicle changes
    const vehiclesQuery = query(
      collection(FIRESTORE_DB, "vehicles"),
      where("contractorId", "==", contractorId)
    )

    const unsubscribeVehicles = onSnapshot(vehiclesQuery, () => {
      this.getContractorDashboardData(contractorId)
        .then(callback)
        .catch(console.error)
    })
    unsubscribers.push(unsubscribeVehicles)

    // Return cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }
}
