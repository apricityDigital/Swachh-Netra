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
  updateDoc,
  writeBatch
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
  driverName: string
  vehicleId?: string
  contractorId?: string
  feederPointId: string
  feederPointName: string
  status: 'present' | 'absent'
  timestamp: Date
  photoUri?: string
  location?: {
    latitude: number
    longitude: number
  }
  notes?: string
  createdAt?: Date
  updatedAt?: Date
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
      console.log("💾 [WorkerAttendanceService] Marking attendance for worker:", params.workerName, "with photo:", !!params.photoUri)

      // Validate attendance data - ensure we have either photo or location for verification
      if (!params.photoUri && !params.location) {
        console.warn("⚠️ [WorkerAttendanceService] Attendance marked without photo or location verification")
      }

      // Validate and sanitize input parameters
      const sanitizedParams = {
        workerId: params.workerId || "",
        workerName: params.workerName || "",
        driverId: params.driverId || "",
        vehicleId: params.vehicleId || null,
        isPresent: params.isPresent,
        checkInTime: params.checkInTime || new Date(),
        photoUri: params.photoUri || null, // Use null instead of undefined
        location: params.location || null, // Use null instead of undefined
        notes: params.notes || "" // Default to empty string
      }

      console.log("📋 [WorkerAttendanceService] Sanitized params:", {
        workerId: sanitizedParams.workerId,
        workerName: sanitizedParams.workerName,
        isPresent: sanitizedParams.isPresent,
        hasPhoto: !!sanitizedParams.photoUri,
        hasLocation: !!sanitizedParams.location,
        hasNotes: !!sanitizedParams.notes
      })

      // Get driver's contractor ID
      const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", sanitizedParams.driverId))
      const driverData = driverDoc.data()

      const attendanceRecord: Omit<AttendanceRecord, "id"> = {
        workerId: sanitizedParams.workerId,
        workerName: sanitizedParams.workerName,
        driverId: sanitizedParams.driverId,
        vehicleId: sanitizedParams.vehicleId,
        contractorId: driverData?.contractorId || null,
        date: Timestamp.fromDate(new Date()) as any,
        isPresent: sanitizedParams.isPresent,
        checkInTime: sanitizedParams.checkInTime ? Timestamp.fromDate(sanitizedParams.checkInTime) as any : null,
        photoUri: sanitizedParams.photoUri,
        location: sanitizedParams.location,
        notes: sanitizedParams.notes,
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
        // Update existing record with sanitized data
        const existingDoc = existingSnapshot.docs[0]
        await updateDoc(existingDoc.ref, {
          isPresent: sanitizedParams.isPresent,
          checkInTime: sanitizedParams.checkInTime ? Timestamp.fromDate(sanitizedParams.checkInTime) : null,
          photoUri: sanitizedParams.photoUri,
          location: sanitizedParams.location,
          notes: sanitizedParams.notes,
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

  // Update attendance record
  static async updateAttendanceRecord(recordId: string, updates: {
    status?: 'present' | 'absent'
    notes?: string
    timestamp?: Date
  }): Promise<void> {
    try {
      console.log("📝 [WorkerAttendanceService] Updating attendance record:", recordId)

      // Sanitize update data to prevent undefined values
      const updateData: any = {
        updatedAt: serverTimestamp()
      }

      if (updates.status) updateData.status = updates.status
      if (updates.notes !== undefined) updateData.notes = updates.notes || "" // Ensure notes is never undefined
      if (updates.timestamp) updateData.timestamp = Timestamp.fromDate(updates.timestamp)

      console.log("📋 [WorkerAttendanceService] Sanitized update data:", {
        recordId,
        hasStatus: !!updateData.status,
        hasNotes: updateData.notes !== undefined,
        hasTimestamp: !!updateData.timestamp
      })

      await updateDoc(doc(FIRESTORE_DB, "workerAttendance", recordId), updateData)
      console.log("✅ [WorkerAttendanceService] Attendance record updated successfully")
    } catch (error) {
      console.error("❌ [WorkerAttendanceService] Error updating attendance record:", error)
      throw new Error("Failed to update attendance record")
    }
  }

  // Bulk update attendance status
  static async bulkUpdateAttendanceStatus(recordIds: string[], status: 'present' | 'absent'): Promise<void> {
    try {
      console.log("📋 [WorkerAttendanceService] Bulk updating", recordIds.length, "records to", status)

      const batch = writeBatch(FIRESTORE_DB)

      recordIds.forEach(recordId => {
        const recordRef = doc(FIRESTORE_DB, "workerAttendance", recordId)
        batch.update(recordRef, {
          status,
          updatedAt: serverTimestamp()
        })
      })

      await batch.commit()
      console.log("✅ [WorkerAttendanceService] Bulk update completed successfully")
    } catch (error) {
      console.error("❌ [WorkerAttendanceService] Error in bulk update:", error)
      throw new Error("Failed to bulk update attendance records")
    }
  }

  // Get worker attendance profile with statistics
  static async getWorkerAttendanceProfile(workerId: string, dateRange?: {
    startDate: Date
    endDate: Date
  }): Promise<{
    worker: any
    attendanceHistory: AttendanceRecord[]
    statistics: {
      totalDays: number
      presentDays: number
      absentDays: number
      attendanceRate: number
      lateArrivals: number
      earlyDepartures: number
      averageCheckInTime: string
    }
    trends: {
      weeklyAttendance: { week: string, rate: number }[]
      monthlyAttendance: { month: string, rate: number }[]
    }
  }> {
    try {
      console.log("👤 [WorkerAttendanceService] Getting attendance profile for worker:", workerId)

      // Set default date range to last 30 days if not provided
      const endDate = dateRange?.endDate || new Date()
      const startDate = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      // Get worker information
      const workerDoc = await getDoc(doc(FIRESTORE_DB, "users", workerId))
      const worker = workerDoc.exists() ? { id: workerId, ...workerDoc.data() } : null

      // Get attendance records for the date range
      const attendanceQuery = query(
        collection(FIRESTORE_DB, "workerAttendance"),
        where("workerId", "==", workerId),
        where("date", ">=", Timestamp.fromDate(startDate)),
        where("date", "<=", Timestamp.fromDate(endDate)),
        orderBy("date", "desc")
      )

      const attendanceSnapshot = await getDocs(attendanceQuery)
      const attendanceHistory: AttendanceRecord[] = []

      attendanceSnapshot.forEach((doc) => {
        const data = doc.data()
        attendanceHistory.push({
          id: doc.id,
          workerId: data.workerId,
          workerName: data.workerName,
          feederPointId: data.feederPointId || "",
          feederPointName: data.feederPointName || "",
          driverId: data.driverId,
          driverName: data.driverName || "",
          tripId: data.tripId || "",
          status: data.isPresent ? 'present' : 'absent',
          timestamp: data.date?.toDate() || new Date(),
          location: data.location || { latitude: 0, longitude: 0 },
          photoUri: data.photoUri,
          notes: data.notes
        })
      })

      // Calculate statistics
      const totalDays = attendanceHistory.length
      const presentDays = attendanceHistory.filter(record => record.status === 'present').length
      const absentDays = totalDays - presentDays
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0

      // Calculate late arrivals and early departures (simplified logic)
      const lateArrivals = attendanceHistory.filter(record => {
        if (record.status === 'present' && record.timestamp) {
          const hour = record.timestamp.getHours()
          return hour > 9 // Assuming work starts at 9 AM
        }
        return false
      }).length

      const earlyDepartures = 0 // Would need check-out time data

      // Calculate average check-in time
      const checkInTimes = attendanceHistory
        .filter(record => record.status === 'present')
        .map(record => record.timestamp.getHours() * 60 + record.timestamp.getMinutes())

      const averageMinutes = checkInTimes.length > 0
        ? checkInTimes.reduce((sum, time) => sum + time, 0) / checkInTimes.length
        : 0

      const avgHours = Math.floor(averageMinutes / 60)
      const avgMins = Math.floor(averageMinutes % 60)
      const averageCheckInTime = `${avgHours.toString().padStart(2, '0')}:${avgMins.toString().padStart(2, '0')}`

      // Calculate trends (simplified)
      const weeklyAttendance: { week: string, rate: number }[] = []
      const monthlyAttendance: { month: string, rate: number }[] = []

      // Group by weeks and months for trends
      const weekGroups = new Map<string, { present: number, total: number }>()
      const monthGroups = new Map<string, { present: number, total: number }>()

      attendanceHistory.forEach(record => {
        const date = record.timestamp
        const weekKey = `Week ${Math.ceil(date.getDate() / 7)}`
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

        // Week grouping
        if (!weekGroups.has(weekKey)) {
          weekGroups.set(weekKey, { present: 0, total: 0 })
        }
        const weekData = weekGroups.get(weekKey)!
        weekData.total++
        if (record.status === 'present') weekData.present++

        // Month grouping
        if (!monthGroups.has(monthKey)) {
          monthGroups.set(monthKey, { present: 0, total: 0 })
        }
        const monthData = monthGroups.get(monthKey)!
        monthData.total++
        if (record.status === 'present') monthData.present++
      })

      weekGroups.forEach((data, week) => {
        weeklyAttendance.push({
          week,
          rate: data.total > 0 ? (data.present / data.total) * 100 : 0
        })
      })

      monthGroups.forEach((data, month) => {
        monthlyAttendance.push({
          month,
          rate: data.total > 0 ? (data.present / data.total) * 100 : 0
        })
      })

      return {
        worker,
        attendanceHistory,
        statistics: {
          totalDays,
          presentDays,
          absentDays,
          attendanceRate,
          lateArrivals,
          earlyDepartures,
          averageCheckInTime
        },
        trends: {
          weeklyAttendance,
          monthlyAttendance
        }
      }
    } catch (error) {
      console.error("❌ [WorkerAttendanceService] Error getting worker profile:", error)
      throw new Error("Failed to get worker attendance profile")
    }
  }

  // Get comprehensive attendance analytics
  static async getAttendanceAnalytics(dateRange: {
    startDate: Date
    endDate: Date
  }): Promise<{
    overview: {
      totalWorkers: number
      totalRecords: number
      averageAttendanceRate: number
      topPerformers: { workerId: string, workerName: string, rate: number }[]
      lowPerformers: { workerId: string, workerName: string, rate: number }[]
    }
    trends: {
      dailyAttendance: { date: string, present: number, absent: number, rate: number }[]
      weeklyTrends: { week: string, rate: number }[]
      monthlyTrends: { month: string, rate: number }[]
    }
    insights: {
      peakAttendanceDays: string[]
      lowAttendanceDays: string[]
      averageCheckInTime: string
      lateArrivalRate: number
    }
  }> {
    try {
      console.log("📊 [WorkerAttendanceService] Generating attendance analytics")

      // Get all attendance records for the date range
      const attendanceQuery = query(
        collection(FIRESTORE_DB, "workerAttendance"),
        where("date", ">=", Timestamp.fromDate(dateRange.startDate)),
        where("date", "<=", Timestamp.fromDate(dateRange.endDate)),
        orderBy("date", "asc")
      )

      const attendanceSnapshot = await getDocs(attendanceQuery)
      const records: any[] = []

      attendanceSnapshot.forEach((doc) => {
        const data = doc.data()
        records.push({
          id: doc.id,
          workerId: data.workerId,
          workerName: data.workerName,
          isPresent: data.isPresent,
          date: data.date?.toDate(),
          checkInTime: data.checkInTime?.toDate()
        })
      })

      // Calculate overview statistics
      const uniqueWorkers = new Set(records.map(r => r.workerId))
      const totalWorkers = uniqueWorkers.size
      const totalRecords = records.length
      const presentRecords = records.filter(r => r.isPresent).length
      const averageAttendanceRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0

      // Calculate worker performance
      const workerStats = new Map<string, { name: string, present: number, total: number }>()

      records.forEach(record => {
        if (!workerStats.has(record.workerId)) {
          workerStats.set(record.workerId, {
            name: record.workerName,
            present: 0,
            total: 0
          })
        }
        const stats = workerStats.get(record.workerId)!
        stats.total++
        if (record.isPresent) stats.present++
      })

      const workerPerformance = Array.from(workerStats.entries()).map(([workerId, stats]) => ({
        workerId,
        workerName: stats.name,
        rate: stats.total > 0 ? (stats.present / stats.total) * 100 : 0
      }))

      const topPerformers = workerPerformance
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 5)

      const lowPerformers = workerPerformance
        .sort((a, b) => a.rate - b.rate)
        .slice(0, 5)

      // Calculate daily trends
      const dailyStats = new Map<string, { present: number, absent: number }>()

      records.forEach(record => {
        const dateKey = record.date.toDateString()
        if (!dailyStats.has(dateKey)) {
          dailyStats.set(dateKey, { present: 0, absent: 0 })
        }
        const dayStats = dailyStats.get(dateKey)!
        if (record.isPresent) {
          dayStats.present++
        } else {
          dayStats.absent++
        }
      })

      const dailyAttendance = Array.from(dailyStats.entries()).map(([date, stats]) => ({
        date,
        present: stats.present,
        absent: stats.absent,
        rate: (stats.present + stats.absent) > 0 ? (stats.present / (stats.present + stats.absent)) * 100 : 0
      }))

      // Calculate insights
      const sortedDays = dailyAttendance.sort((a, b) => b.rate - a.rate)
      const peakAttendanceDays = sortedDays.slice(0, 3).map(d => d.date)
      const lowAttendanceDays = sortedDays.slice(-3).map(d => d.date)

      // Calculate average check-in time
      const checkInTimes = records
        .filter(r => r.isPresent && r.checkInTime)
        .map(r => r.checkInTime.getHours() * 60 + r.checkInTime.getMinutes())

      const avgMinutes = checkInTimes.length > 0
        ? checkInTimes.reduce((sum, time) => sum + time, 0) / checkInTimes.length
        : 0

      const avgHours = Math.floor(avgMinutes / 60)
      const avgMins = Math.floor(avgMinutes % 60)
      const averageCheckInTime = `${avgHours.toString().padStart(2, '0')}:${avgMins.toString().padStart(2, '0')}`

      // Calculate late arrival rate (assuming work starts at 9 AM)
      const lateArrivals = records.filter(r => {
        if (r.isPresent && r.checkInTime) {
          return r.checkInTime.getHours() > 9
        }
        return false
      }).length

      const lateArrivalRate = presentRecords > 0 ? (lateArrivals / presentRecords) * 100 : 0

      return {
        overview: {
          totalWorkers,
          totalRecords,
          averageAttendanceRate,
          topPerformers,
          lowPerformers
        },
        trends: {
          dailyAttendance,
          weeklyTrends: [], // Simplified for now
          monthlyTrends: []  // Simplified for now
        },
        insights: {
          peakAttendanceDays,
          lowAttendanceDays,
          averageCheckInTime,
          lateArrivalRate
        }
      }
    } catch (error) {
      console.error("❌ [WorkerAttendanceService] Error generating analytics:", error)
      throw new Error("Failed to generate attendance analytics")
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
    attendanceList: { workerId: string; workerName: string; isPresent: boolean; photoUri?: string; notes?: string }[]
  ): Promise<void> {
    try {
      console.log("📋 [WorkerAttendanceService] Bulk marking attendance for", attendanceList.length, "workers")

      const promises = attendanceList.map(attendance =>
        this.markWorkerAttendance({
          workerId: attendance.workerId || "",
          workerName: attendance.workerName || "",
          driverId: driverId || "",
          vehicleId: vehicleId || "",
          isPresent: attendance.isPresent,
          checkInTime: new Date(),
          photoUri: attendance.photoUri || null,
          notes: attendance.notes || ""
        })
      )

      await Promise.all(promises)
      console.log("✅ [WorkerAttendanceService] Bulk attendance marking completed")

    } catch (error) {
      console.error("❌ [WorkerAttendanceService] Error in bulk attendance marking:", error)
      throw new Error("Failed to mark bulk attendance")
    }
  }

  // Enhanced attendance data access for HR and Admin roles
  static async getAttendanceForHRAndAdmin(
    userRole: string,
    startDate?: Date,
    endDate?: Date,
    employeeFilter?: string
  ): Promise<AttendanceRecord[]> {
    try {
      console.log("🔄 [WorkerAttendanceService] Fetching attendance for HR/Admin:", { userRole, startDate, endDate, employeeFilter })

      // Validate permissions
      if (userRole !== 'admin' && userRole !== 'swachh_hr') {
        throw new Error("Insufficient permissions to access attendance data")
      }

      let attendanceQuery = collection(FIRESTORE_DB, "workerAttendance")
      const constraints: any[] = []

      // Add date range constraints
      if (startDate) {
        const startTimestamp = Timestamp.fromDate(startDate)
        constraints.push(where("timestamp", ">=", startTimestamp))
      }

      if (endDate) {
        const endTimestamp = Timestamp.fromDate(endDate)
        constraints.push(where("timestamp", "<=", endTimestamp))
      }

      // Add employee filter if provided
      if (employeeFilter) {
        constraints.push(where("workerName", ">=", employeeFilter))
        constraints.push(where("workerName", "<=", employeeFilter + '\uf8ff'))
      }

      // Add ordering
      constraints.push(orderBy("timestamp", "desc"))

      const q = query(attendanceQuery, ...constraints)
      const querySnapshot = await getDocs(q)

      const records: AttendanceRecord[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        records.push({
          id: doc.id,
          workerId: data.workerId,
          workerName: data.workerName,
          driverId: data.driverId,
          driverName: data.driverName,
          feederPointId: data.feederPointId,
          feederPointName: data.feederPointName,
          status: data.status,
          timestamp: data.timestamp?.toDate() || new Date(),
          photoUri: data.photoUri,
          location: data.location,
          notes: data.notes
        })
      })

      console.log(`✅ [WorkerAttendanceService] Retrieved ${records.length} attendance records for ${userRole}`)
      return records

    } catch (error) {
      console.error("❌ [WorkerAttendanceService] Error fetching HR/Admin attendance data:", error)
      throw new Error(`Failed to fetch attendance data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get attendance statistics for HR and Admin
  static async getAttendanceStatisticsForHRAndAdmin(
    userRole: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRecords: number
    presentCount: number
    absentCount: number
    attendanceRate: number
    dailyStats: { [date: string]: { present: number; absent: number; total: number } }
    workerStats: { [workerId: string]: { name: string; present: number; absent: number; total: number } }
  }> {
    try {
      console.log("📊 [WorkerAttendanceService] Generating statistics for HR/Admin")

      // Validate permissions
      if (userRole !== 'admin' && userRole !== 'swachh_hr') {
        throw new Error("Insufficient permissions to access attendance statistics")
      }

      const records = await this.getAttendanceForHRAndAdmin(userRole, startDate, endDate)

      const totalRecords = records.length
      const presentCount = records.filter(r => r.status === 'present').length
      const absentCount = records.filter(r => r.status === 'absent').length
      const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0

      // Generate daily statistics
      const dailyStats: { [date: string]: { present: number; absent: number; total: number } } = {}
      const workerStats: { [workerId: string]: { name: string; present: number; absent: number; total: number } } = {}

      records.forEach(record => {
        const dateKey = record.timestamp.toISOString().split('T')[0]

        // Daily stats
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = { present: 0, absent: 0, total: 0 }
        }
        dailyStats[dateKey].total++
        if (record.status === 'present') {
          dailyStats[dateKey].present++
        } else if (record.status === 'absent') {
          dailyStats[dateKey].absent++
        }

        // Worker stats
        if (!workerStats[record.workerId]) {
          workerStats[record.workerId] = {
            name: record.workerName,
            present: 0,
            absent: 0,
            total: 0
          }
        }
        workerStats[record.workerId].total++
        if (record.status === 'present') {
          workerStats[record.workerId].present++
        } else if (record.status === 'absent') {
          workerStats[record.workerId].absent++
        }
      })

      return {
        totalRecords,
        presentCount,
        absentCount,
        attendanceRate,
        dailyStats,
        workerStats
      }

    } catch (error) {
      console.error("❌ [WorkerAttendanceService] Error generating statistics:", error)
      throw new Error(`Failed to generate statistics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
