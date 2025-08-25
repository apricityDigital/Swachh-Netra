import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  updateDoc
} from "firebase/firestore"
import { FIRESTORE_DB } from "../FirebaseConfig"

// Worker Attendance interfaces
export interface AssignedWorker {
  workerId: string
  workerName: string
  role: string
  phoneNumber?: string
  isPresent?: boolean
  checkInTime?: Date
  photoUri?: string
  location?: {
    latitude: number
    longitude: number
  }
  notes?: string
}

export interface WorkerAttendanceData {
  driverId: string
  vehicleId?: string
  date: Date
  assignedWorkers: AssignedWorker[]
  totalWorkers: number
  presentWorkers: number
  absentWorkers: number
  pendingWorkers: number
  shiftStartTime?: Date
  lastUpdated: Date
}

export interface AttendanceRecord {
  id?: string
  workerId: string
  workerName: string
  driverId: string
  vehicleId?: string
  contractorId?: string
  date: Date
  isPresent: boolean
  checkInTime?: Date
  checkOutTime?: Date
  photoUri?: string
  location?: {
    latitude: number
    longitude: number
  }
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface MarkAttendanceParams {
  workerId: string
  workerName: string
  driverId: string
  vehicleId?: string
  isPresent: boolean
  checkInTime: Date
  photoUri?: string
  location?: {
    latitude: number
    longitude: number
  }
  notes?: string
}

export class WorkerAttendanceService {
  // Get driver's worker attendance data for today
  static async getDriverWorkerAttendance(driverId: string): Promise<WorkerAttendanceData> {
    try {
      console.log("👥 [WorkerAttendanceService] Fetching worker attendance for driver:", driverId)

      // Get driver information to find assigned workers
      const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", driverId))
      if (!driverDoc.exists()) {
        throw new Error("Driver not found")
      }

      const driverData = driverDoc.data()
      console.log("👤 [WorkerAttendanceService] Driver data:", driverData)

      // Get assigned workers for this driver
      const assignedWorkers = await this.getAssignedWorkers(driverId)
      console.log("👥 [WorkerAttendanceService] Found assigned workers:", assignedWorkers.length)

      // Get today's attendance records
      const todayAttendance = await this.getTodayAttendanceRecords(driverId)
      console.log("📋 [WorkerAttendanceService] Today's attendance records:", todayAttendance.length)

      // Merge worker data with attendance records
      const workersWithAttendance = assignedWorkers.map(worker => {
        const attendanceRecord = todayAttendance.find(record => record.workerId === worker.workerId)

        return {
          ...worker,
          isPresent: attendanceRecord?.isPresent,
          checkInTime: attendanceRecord?.checkInTime,
          photoUri: attendanceRecord?.photoUri,
          location: attendanceRecord?.location,
          notes: attendanceRecord?.notes
        }
      })

      // Calculate statistics
      const totalWorkers = workersWithAttendance.length
      const presentWorkers = workersWithAttendance.filter(w => w.isPresent === true).length
      const absentWorkers = workersWithAttendance.filter(w => w.isPresent === false).length
      const pendingWorkers = workersWithAttendance.filter(w => w.isPresent === undefined).length

      const attendanceData: WorkerAttendanceData = {
        driverId,
        vehicleId: driverData.assignedVehicleId,
        date: new Date(),
        assignedWorkers: workersWithAttendance,
        totalWorkers,
        presentWorkers,
        absentWorkers,
        pendingWorkers,
        lastUpdated: new Date()
      }

      console.log("✅ [WorkerAttendanceService] Attendance data compiled successfully")
      return attendanceData

    } catch (error) {
      console.error("❌ [WorkerAttendanceService] Error fetching worker attendance:", error)
      throw new Error("Failed to fetch worker attendance data")
    }
  }

  // Get workers assigned to a driver
  static async getAssignedWorkers(driverId: string): Promise<AssignedWorker[]> {
    try {
      // Method 1: Check for workers directly assigned to driver
      const workersRef = collection(FIRESTORE_DB, "users")
      const workersQuery = query(
        workersRef,
        where("role", "==", "worker"),
        where("assignedDriverId", "==", driverId),
        where("isActive", "==", true)
      )

      const workersSnapshot = await getDocs(workersQuery)
      const directlyAssignedWorkers: AssignedWorker[] = []

      workersSnapshot.forEach((doc) => {
        const data = doc.data()
        directlyAssignedWorkers.push({
          workerId: doc.id,
          workerName: data.fullName || data.name || "Unknown Worker",
          role: data.workerType || data.category || "Worker",
          phoneNumber: data.phoneNumber
        })
      })

      if (directlyAssignedWorkers.length > 0) {
        console.log("👥 [WorkerAttendanceService] Found directly assigned workers:", directlyAssignedWorkers.length)
        return directlyAssignedWorkers
      }

      // Method 2: Check for workers assigned to driver's contractor
      const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", driverId))
      const driverData = driverDoc.data()

      if (driverData?.contractorId) {
        const contractorWorkersQuery = query(
          workersRef,
          where("role", "==", "worker"),
          where("contractorId", "==", driverData.contractorId),
          where("isActive", "==", true)
        )

        const contractorWorkersSnapshot = await getDocs(contractorWorkersQuery)
        const contractorWorkers: AssignedWorker[] = []

        contractorWorkersSnapshot.forEach((doc) => {
          const data = doc.data()
          contractorWorkers.push({
            workerId: doc.id,
            workerName: data.fullName || data.name || "Unknown Worker",
            role: data.workerType || data.category || "Worker",
            phoneNumber: data.phoneNumber
          })
        })

        console.log("👥 [WorkerAttendanceService] Found contractor workers:", contractorWorkers.length)
        return contractorWorkers
      }

      // Method 3: Create mock workers for testing if none found
      console.log("⚠️ [WorkerAttendanceService] No workers found, creating mock data for testing")
      return this.createMockWorkers(driverId)

    } catch (error) {
      console.error("❌ [WorkerAttendanceService] Error fetching assigned workers:", error)
      return this.createMockWorkers(driverId)
    }
  }

  // Get today's attendance records for a driver
  static async getTodayAttendanceRecords(driverId: string): Promise<AttendanceRecord[]> {
    try {
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
        where("date", "<", tomorrowTimestamp),
        orderBy("date", "desc")
      )

      const querySnapshot = await getDocs(q)
      const attendanceRecords: AttendanceRecord[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        attendanceRecords.push({
          id: doc.id,
          workerId: data.workerId,
          workerName: data.workerName,
          driverId: data.driverId,
          vehicleId: data.vehicleId,
          contractorId: data.contractorId,
          date: data.date?.toDate() || new Date(),
          isPresent: data.isPresent,
          checkInTime: data.checkInTime?.toDate(),
          checkOutTime: data.checkOutTime?.toDate(),
          photoUri: data.photoUri,
          location: data.location,
          notes: data.notes,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        })
      })

      return attendanceRecords

    } catch (error) {
      console.error("❌ [WorkerAttendanceService] Error fetching today's attendance:", error)
      return []
    }
  }

  // Mark worker attendance
  static async markWorkerAttendance(params: MarkAttendanceParams): Promise<void> {
    try {
      console.log("💾 [WorkerAttendanceService] Marking attendance for worker:", params.workerName)

      // Get driver's contractor ID
      const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", params.driverId))
      const driverData = driverDoc.data()

      const attendanceRecord: Omit<AttendanceRecord, "id"> = {
        workerId: params.workerId,
        workerName: params.workerName,
        driverId: params.driverId,
        vehicleId: params.vehicleId,
        contractorId: driverData?.contractorId,
        date: Timestamp.fromDate(new Date()) as any,
        isPresent: params.isPresent,
        checkInTime: params.checkInTime ? Timestamp.fromDate(params.checkInTime) as any : undefined,
        photoUri: params.photoUri,
        location: params.location,
        notes: params.notes || "",
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any
      }

      // Check if attendance already exists for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTimestamp = Timestamp.fromDate(today)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowTimestamp = Timestamp.fromDate(tomorrow)

      const existingQuery = query(
        collection(FIRESTORE_DB, "workerAttendance"),
        where("workerId", "==", params.workerId),
        where("driverId", "==", params.driverId),
        where("date", ">=", todayTimestamp),
        where("date", "<", tomorrowTimestamp)
      )

      const existingSnapshot = await getDocs(existingQuery)

      if (!existingSnapshot.empty) {
        // Update existing record
        const existingDoc = existingSnapshot.docs[0]
        await updateDoc(existingDoc.ref, {
          isPresent: params.isPresent,
          checkInTime: params.checkInTime ? Timestamp.fromDate(params.checkInTime) : undefined,
          photoUri: params.photoUri,
          location: params.location,
          notes: params.notes || "",
          updatedAt: serverTimestamp()
        })
        console.log("✅ [WorkerAttendanceService] Updated existing attendance record")
      } else {
        // Create new record
        await addDoc(collection(FIRESTORE_DB, "workerAttendance"), attendanceRecord)
        console.log("✅ [WorkerAttendanceService] Created new attendance record")
      }

    } catch (error) {
      console.error("❌ [WorkerAttendanceService] Error marking attendance:", error)
      throw new Error("Failed to mark worker attendance")
    }
  }

  // Create mock workers for testing
  static createMockWorkers(driverId: string): AssignedWorker[] {
    const mockWorkers: AssignedWorker[] = [
      {
        workerId: `mock-worker-1-${driverId}`,
        workerName: "Rajesh Kumar",
        role: "Sweeper",
        phoneNumber: "+91-9876543210"
      },
      {
        workerId: `mock-worker-2-${driverId}`,
        workerName: "Priya Sharma",
        role: "Loader",
        phoneNumber: "+91-9876543211"
      },
      {
        workerId: `mock-worker-3-${driverId}`,
        workerName: "Amit Singh",
        role: "Supervisor",
        phoneNumber: "+91-9876543212"
      },
      {
        workerId: `mock-worker-4-${driverId}`,
        workerName: "Sunita Devi",
        role: "Cleaner",
        phoneNumber: "+91-9876543213"
      }
    ]

    console.log("🧪 [WorkerAttendanceService] Created mock workers for testing:", mockWorkers.length)
    return mockWorkers
  }

  // Real-time listener for worker attendance updates
  static subscribeToWorkerAttendance(
    driverId: string,
    callback: (data: WorkerAttendanceData) => void
  ): () => void {
    console.log("🔄 [WorkerAttendanceService] Setting up real-time listener for driver:", driverId)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = Timestamp.fromDate(today)

    const attendanceQuery = query(
      collection(FIRESTORE_DB, "workerAttendance"),
      where("driverId", "==", driverId),
      where("date", ">=", todayTimestamp)
    )

    const unsubscribe = onSnapshot(attendanceQuery, () => {
      this.getDriverWorkerAttendance(driverId)
        .then(callback)
        .catch(console.error)
    })

    return () => {
      console.log("🔄 [WorkerAttendanceService] Cleaning up real-time listener")
      unsubscribe()
    }
  }

  // Get attendance statistics for a date range
  static async getAttendanceStatistics(
    driverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalDays: number
    averagePresent: number
    averageAbsent: number
    workerStats: { [workerId: string]: { present: number; absent: number; total: number } }
  }> {
    try {
      const startTimestamp = Timestamp.fromDate(startDate)
      const endTimestamp = Timestamp.fromDate(endDate)

      const attendanceRef = collection(FIRESTORE_DB, "workerAttendance")
      const q = query(
        attendanceRef,
        where("driverId", "==", driverId),
        where("date", ">=", startTimestamp),
        where("date", "<=", endTimestamp),
        orderBy("date", "desc")
      )

      const querySnapshot = await getDocs(q)
      const records: AttendanceRecord[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        records.push({
          id: doc.id,
          workerId: data.workerId,
          workerName: data.workerName,
          driverId: data.driverId,
          vehicleId: data.vehicleId,
          contractorId: data.contractorId,
          date: data.date?.toDate() || new Date(),
          isPresent: data.isPresent,
          checkInTime: data.checkInTime?.toDate(),
          checkOutTime: data.checkOutTime?.toDate(),
          photoUri: data.photoUri,
          location: data.location,
          notes: data.notes,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        })
      })

      // Calculate statistics
      const workerStats: { [workerId: string]: { present: number; absent: number; total: number } } = {}
      let totalPresent = 0
      let totalAbsent = 0

      records.forEach(record => {
        if (!workerStats[record.workerId]) {
          workerStats[record.workerId] = { present: 0, absent: 0, total: 0 }
        }

        workerStats[record.workerId].total++
        if (record.isPresent) {
          workerStats[record.workerId].present++
          totalPresent++
        } else {
          workerStats[record.workerId].absent++
          totalAbsent++
        }
      })

      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const totalRecords = totalPresent + totalAbsent

      return {
        totalDays,
        averagePresent: totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0,
        averageAbsent: totalRecords > 0 ? (totalAbsent / totalRecords) * 100 : 0,
        workerStats
      }

    } catch (error) {
      console.error("❌ [WorkerAttendanceService] Error fetching attendance statistics:", error)
      throw new Error("Failed to fetch attendance statistics")
    }
  }

  // Bulk mark attendance for multiple workers
  static async bulkMarkAttendance(
    driverId: string,
    vehicleId: string,
    attendanceList: { workerId: string; workerName: string; isPresent: boolean; photoUri?: string }[]
  ): Promise<void> {
    try {
      console.log("📋 [WorkerAttendanceService] Bulk marking attendance for", attendanceList.length, "workers")

      const promises = attendanceList.map(attendance =>
        this.markWorkerAttendance({
          workerId: attendance.workerId,
          workerName: attendance.workerName,
          driverId,
          vehicleId,
          isPresent: attendance.isPresent,
          checkInTime: new Date(),
          photoUri: attendance.photoUri
        })
      )

      await Promise.all(promises)
      console.log("✅ [WorkerAttendanceService] Bulk attendance marking completed")

    } catch (error) {
      console.error("❌ [WorkerAttendanceService] Error in bulk attendance marking:", error)
      throw new Error("Failed to mark bulk attendance")
    }
  }
}
