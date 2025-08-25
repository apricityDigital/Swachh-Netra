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
      // Fetch data with individual error handling to prevent total failure
      const [
        drivers,
        vehicles,
        feederPointAssignments,
        todayTrips,
        workerAttendance
      ] = await Promise.allSettled([
        this.getContractorDrivers(contractorId),
        this.getContractorVehicles(contractorId),
        this.getContractorFeederPoints(contractorId),
        this.getTodayTrips(contractorId),
        this.getTodayWorkerAttendance(contractorId)
      ])

      // Extract values or use empty arrays for failed requests
      const driversData = drivers.status === 'fulfilled' ? drivers.value : []
      const vehiclesData = vehicles.status === 'fulfilled' ? vehicles.value : []
      const feederPointsData = feederPointAssignments.status === 'fulfilled' ? feederPointAssignments.value : []
      const tripsData = todayTrips.status === 'fulfilled' ? todayTrips.value : []
      const attendanceData = workerAttendance.status === 'fulfilled' ? workerAttendance.value : []

      const activeDrivers = driversData.filter(d => d.isActive).length
      const activeVehicles = vehiclesData.filter(v => v.status === "active").length

      const completedTrips = tripsData.filter(t => t.status === "completed").length
      const pendingTrips = tripsData.filter(t => t.status === "pending").length

      const presentWorkers = attendanceData.filter(w => w.isPresent).length

      return {
        totalDrivers: driversData.length,
        activeDrivers,
        totalVehicles: vehiclesData.length,
        activeVehicles,
        assignedFeederPoints: feederPointsData.length,
        todayTrips: {
          total: tripsData.length,
          completed: completedTrips,
          pending: pendingTrips,
        },
        todayAttendance: {
          totalWorkers: attendanceData.length,
          presentWorkers,
          absentWorkers: attendanceData.length - presentWorkers,
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
      // Return empty array instead of throwing to prevent app crash
      console.log("Returning empty drivers array to prevent crash")
      return []
    }
  }

  // Get vehicles assigned to contractor
  static async getContractorVehicles(contractorId: string) {
    try {
      console.log(`🚗 Fetching vehicles for contractor: ${contractorId}`)

      // Get vehicle assignments for this contractor
      const assignmentsRef = collection(FIRESTORE_DB, "vehicleAssignments")

      let assignmentsSnapshot
      try {
        const assignmentsQuery = query(
          assignmentsRef,
          where("assignedTo", "==", contractorId),
          where("status", "==", "active"),
          where("assignmentType", "==", "admin_to_contractor")
        )
        assignmentsSnapshot = await getDocs(assignmentsQuery)
        console.log(`📋 Found ${assignmentsSnapshot.size} vehicle assignments`)
      } catch (queryError) {
        console.warn("Vehicle assignments query failed, trying fallback:", queryError)
        // Fallback: get all assignments and filter manually
        const allAssignmentsSnapshot = await getDocs(assignmentsRef)
        console.log(`📋 Total assignments in collection: ${allAssignmentsSnapshot.size}`)
        const filteredDocs: any[] = []
        allAssignmentsSnapshot.forEach((doc) => {
          const data = doc.data()
          console.log(`  Assignment: assignedTo=${data.assignedTo}, status=${data.status}, type=${data.assignmentType}`)
          if (data.assignedTo === contractorId && data.status === "active" && data.assignmentType === "admin_to_contractor") {
            filteredDocs.push(doc)
          }
        })
        console.log(`📋 Filtered assignments: ${filteredDocs.length}`)
        // Create a mock snapshot-like object
        assignmentsSnapshot = {
          forEach: (callback: any) => filteredDocs.forEach(callback),
          size: filteredDocs.length
        } as any
      }

      const vehicleIds: string[] = []
      assignmentsSnapshot.forEach((doc: any) => {
        const data = doc.data()
        vehicleIds.push(data.vehicleId)
      })

      console.log(`🚗 Vehicle IDs found: ${vehicleIds.length}`, vehicleIds)

      if (vehicleIds.length === 0) {
        console.log("❌ No vehicle assignments found, checking for direct vehicle assignments...")

        // Fallback: Check for vehicles directly assigned to contractor (legacy method)
        try {
          const vehiclesRef = collection(FIRESTORE_DB, "vehicles")
          const directAssignmentQuery = query(
            vehiclesRef,
            where("assignedToContractor", "==", contractorId),
            where("status", "==", "active")
          )
          const directVehiclesSnapshot = await getDocs(directAssignmentQuery)

          if (directVehiclesSnapshot.size > 0) {
            console.log(`📋 Found ${directVehiclesSnapshot.size} directly assigned vehicles`)
            const directVehicles: any[] = []
            directVehiclesSnapshot.forEach((doc) => {
              const data = doc.data()
              directVehicles.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt || new Date(),
                registrationDate: data.registrationDate || new Date(),
                isActive: data.isActive !== undefined ? data.isActive : true,
                status: data.status || "active"
              })
            })
            return directVehicles
          }
        } catch (directError) {
          console.warn("Direct vehicle assignment query failed:", directError)
        }

        console.log("❌ No vehicles found for contractor")
        return []
      }

      // Get the actual vehicle details
      const vehiclesRef = collection(FIRESTORE_DB, "vehicles")
      const vehicles: any[] = []

      // Fetch vehicles in batches (Firestore 'in' query limit is 10)
      const batchSize = 10
      for (let i = 0; i < vehicleIds.length; i += batchSize) {
        const batch = vehicleIds.slice(i, i + batchSize)
        const vehiclesQuery = query(vehiclesRef, where("__name__", "in", batch))
        const vehiclesSnapshot = await getDocs(vehiclesQuery)

        vehiclesSnapshot.forEach((doc) => {
          const data = doc.data()
          vehicles.push({
            id: doc.id,
            ...data,
            // Ensure required fields have defaults
            createdAt: data.createdAt || new Date(),
            registrationDate: data.registrationDate || new Date(),
            isActive: data.isActive !== undefined ? data.isActive : true,
            status: data.status || "active"
          })
        })
      }

      console.log(`✅ Returning ${vehicles.length} vehicles for contractor ${contractorId}`)
      vehicles.forEach((vehicle, index) => {
        console.log(`  ${index + 1}. ${vehicle.vehicleNumber} (${vehicle.vehicleName || 'No name'}) - Status: ${vehicle.status}`)
      })

      return vehicles
    } catch (error) {
      console.error("Error fetching contractor vehicles:", error)
      // Return empty array instead of throwing to prevent app crash
      console.log("Returning empty vehicles array to prevent crash")
      return []
    }
  }

  // Get feeder points assigned to contractor
  static async getContractorFeederPoints(contractorId: string): Promise<FeederPoint[]> {
    try {
      const assignments = await FeederPointService.getAssignmentsByContractor(contractorId)
      // Use Set to ensure unique feeder point IDs
      const uniqueFeederPointIds = [...new Set(assignments.map(a => a.feederPointId))]

      if (uniqueFeederPointIds.length === 0) return []

      const feederPoints: FeederPoint[] = []
      const seenIds = new Set<string>()

      for (const fpId of uniqueFeederPointIds) {
        try {
          const fp = await FeederPointService.getFeederPointById(fpId)
          if (fp && !seenIds.has(fp.id || fpId)) {
            seenIds.add(fp.id || fpId)
            feederPoints.push(fp)
          }
        } catch (error) {
          console.error(`Error fetching feeder point ${fpId}:`, error)
        }
      }

      return feederPoints
    } catch (error) {
      console.error("Error fetching contractor feeder points:", error)
      // Return empty array instead of throwing to prevent app crash
      console.log("Returning empty feeder points array to prevent crash")
      return []
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
      console.log("🔄 [ContractorService] Starting vehicle assignment:", {
        contractorId,
        vehicleId,
        driverId,
        feederPointIds: feederPointIds.length
      })

      // Validate inputs
      if (!contractorId || !vehicleId || !driverId || !feederPointIds.length) {
        throw new Error("Missing required assignment parameters")
      }

      // Check if vehicle exists and is available
      const vehicleDoc = await getDoc(doc(FIRESTORE_DB, "vehicles", vehicleId))
      if (!vehicleDoc.exists()) {
        throw new Error("Vehicle not found")
      }

      const vehicleData = vehicleDoc.data()
      if (vehicleData.driverId && vehicleData.driverId !== driverId) {
        throw new Error("Vehicle is already assigned to another driver")
      }

      // Check if driver exists
      const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", driverId))
      if (!driverDoc.exists()) {
        throw new Error("Driver not found")
      }

      const batch = writeBatch(FIRESTORE_DB)

      // First, deactivate any existing assignments for this driver
      const existingAssignmentsQuery = query(
        collection(FIRESTORE_DB, "driverAssignments"),
        where("driverId", "==", driverId),
        where("status", "==", "active")
      )
      const existingAssignments = await getDocs(existingAssignmentsQuery)

      existingAssignments.forEach((doc) => {
        batch.update(doc.ref, { status: "inactive", updatedAt: serverTimestamp() })
      })

      // Create new driver assignment
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
        contractorId: contractorId,
        updatedAt: serverTimestamp(),
      })

      await batch.commit()
      console.log("✅ [ContractorService] Vehicle assignment completed successfully")

    } catch (error) {
      console.error("❌ [ContractorService] Error assigning vehicle to driver:", error)
      throw new Error(`Failed to assign vehicle to driver: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
