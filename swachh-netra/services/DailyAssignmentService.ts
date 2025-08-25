import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  deleteDoc,
  writeBatch
} from "firebase/firestore"
import { FIRESTORE_DB } from "../FirebaseConfig"

export interface DailyAssignment {
  id?: string
  driverId: string
  contractorId: string
  assignmentDate: string // YYYY-MM-DD format
  feederPointIds: string[]
  vehicleId?: string
  status: "active" | "completed" | "cancelled"
  createdAt: Date
  updatedAt: Date
  assignedBy: string
  notes?: string
}

export interface CreateDailyAssignmentParams {
  driverId: string
  contractorId: string
  assignmentDate: string
  feederPointIds: string[]
  vehicleId?: string
  status?: "active" | "completed" | "cancelled"
  notes?: string
}

export interface DailyAssignmentWithDetails extends DailyAssignment {
  driverName?: string
  driverEmail?: string
  vehicleName?: string
  feederPointNames?: string[]
}

export class DailyAssignmentService {
  
  /**
   * Create or update a daily assignment for a driver
   */
  static async createOrUpdateAssignment(params: CreateDailyAssignmentParams): Promise<string> {
    try {
      console.log("🔄 [DailyAssignmentService] Creating/updating assignment:", params)

      // Check if assignment already exists for this driver and date
      const existingAssignment = await this.getDriverAssignmentByDate(
        params.driverId, 
        params.assignmentDate
      )

      const assignmentData = {
        driverId: params.driverId,
        contractorId: params.contractorId,
        assignmentDate: params.assignmentDate,
        feederPointIds: params.feederPointIds,
        vehicleId: params.vehicleId || null,
        status: params.status || "active",
        notes: params.notes || "",
        assignedBy: params.contractorId,
        updatedAt: new Date()
      }

      if (existingAssignment) {
        // Update existing assignment
        await updateDoc(doc(FIRESTORE_DB, "dailyAssignments", existingAssignment.id!), {
          ...assignmentData,
          updatedAt: serverTimestamp()
        })
        console.log("✅ [DailyAssignmentService] Assignment updated:", existingAssignment.id)
        return existingAssignment.id!
      } else {
        // Create new assignment
        const docRef = await addDoc(collection(FIRESTORE_DB, "dailyAssignments"), {
          ...assignmentData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        console.log("✅ [DailyAssignmentService] Assignment created:", docRef.id)
        return docRef.id
      }
    } catch (error) {
      console.error("❌ [DailyAssignmentService] Error creating/updating assignment:", error)
      throw new Error(`Failed to save assignment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get all assignments for a contractor on a specific date
   */
  static async getAssignmentsByDate(contractorId: string, date: string): Promise<DailyAssignment[]> {
    try {
      console.log(`🔄 [DailyAssignmentService] Fetching assignments for contractor ${contractorId} on ${date}`)

      const q = query(
        collection(FIRESTORE_DB, "dailyAssignments"),
        where("contractorId", "==", contractorId),
        where("assignmentDate", "==", date),
        orderBy("updatedAt", "desc")
      )

      const querySnapshot = await getDocs(q)
      const assignments: DailyAssignment[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        assignments.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as DailyAssignment)
      })

      console.log(`✅ [DailyAssignmentService] Found ${assignments.length} assignments`)
      return assignments
    } catch (error) {
      console.error("❌ [DailyAssignmentService] Error fetching assignments by date:", error)
      throw new Error(`Failed to fetch assignments: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get assignment for a specific driver on a specific date
   */
  static async getDriverAssignmentByDate(driverId: string, date: string): Promise<DailyAssignment | null> {
    try {
      console.log("🔍 [DailyAssignmentService] Querying assignment for driver:", driverId, "date:", date)

      const q = query(
        collection(FIRESTORE_DB, "dailyAssignments"),
        where("driverId", "==", driverId),
        where("assignmentDate", "==", date),
        orderBy("updatedAt", "desc")
      )

      const querySnapshot = await getDocs(q)

      console.log("📊 [DailyAssignmentService] Query result:", {
        empty: querySnapshot.empty,
        size: querySnapshot.size,
        driverId,
        date
      })

      if (querySnapshot.empty) {
        console.log("⚠️ [DailyAssignmentService] No assignment found for driver on this date")
        return null
      }

      const doc = querySnapshot.docs[0]
      const data = doc.data()

      console.log("✅ [DailyAssignmentService] Assignment found:", {
        id: doc.id,
        feederPointIds: data.feederPointIds,
        status: data.status,
        contractorId: data.contractorId
      })

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as DailyAssignment
    } catch (error) {
      console.error("❌ [DailyAssignmentService] Error fetching driver assignment:", error)
      return null
    }
  }

  /**
   * Get all assignments for a driver within a date range
   */
  static async getDriverAssignments(
    driverId: string, 
    startDate: string, 
    endDate: string
  ): Promise<DailyAssignment[]> {
    try {
      console.log(`🔄 [DailyAssignmentService] Fetching assignments for driver ${driverId} from ${startDate} to ${endDate}`)

      const q = query(
        collection(FIRESTORE_DB, "dailyAssignments"),
        where("driverId", "==", driverId),
        where("assignmentDate", ">=", startDate),
        where("assignmentDate", "<=", endDate),
        orderBy("assignmentDate", "desc")
      )

      const querySnapshot = await getDocs(q)
      const assignments: DailyAssignment[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        assignments.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as DailyAssignment)
      })

      console.log(`✅ [DailyAssignmentService] Found ${assignments.length} assignments for driver`)
      return assignments
    } catch (error) {
      console.error("❌ [DailyAssignmentService] Error fetching driver assignments:", error)
      throw new Error(`Failed to fetch driver assignments: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get today's assignment for a driver
   */
  static async getTodayAssignment(driverId: string): Promise<DailyAssignment | null> {
    const today = new Date().toISOString().split('T')[0]
    console.log("📅 [DailyAssignmentService] Getting today's assignment for driver:", driverId, "date:", today)
    const result = await this.getDriverAssignmentByDate(driverId, today)
    console.log("📋 [DailyAssignmentService] Today's assignment result:", {
      found: !!result,
      assignmentId: result?.id,
      feederPointCount: result?.feederPointIds?.length || 0
    })
    return result
  }

  /**
   * Update assignment status
   */
  static async updateAssignmentStatus(
    assignmentId: string, 
    status: "active" | "completed" | "cancelled"
  ): Promise<void> {
    try {
      await updateDoc(doc(FIRESTORE_DB, "dailyAssignments", assignmentId), {
        status,
        updatedAt: serverTimestamp()
      })
      console.log(`✅ [DailyAssignmentService] Assignment status updated to ${status}`)
    } catch (error) {
      console.error("❌ [DailyAssignmentService] Error updating assignment status:", error)
      throw new Error(`Failed to update assignment status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete an assignment
   */
  static async deleteAssignment(assignmentId: string): Promise<void> {
    try {
      await deleteDoc(doc(FIRESTORE_DB, "dailyAssignments", assignmentId))
      console.log("✅ [DailyAssignmentService] Assignment deleted")
    } catch (error) {
      console.error("❌ [DailyAssignmentService] Error deleting assignment:", error)
      throw new Error(`Failed to delete assignment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Bulk create assignments for multiple drivers
   */
  static async bulkCreateAssignments(assignments: CreateDailyAssignmentParams[]): Promise<void> {
    try {
      console.log(`🔄 [DailyAssignmentService] Bulk creating ${assignments.length} assignments`)
      
      const batch = writeBatch(FIRESTORE_DB)
      
      for (const assignment of assignments) {
        const docRef = doc(collection(FIRESTORE_DB, "dailyAssignments"))
        batch.set(docRef, {
          ...assignment,
          status: assignment.status || "active",
          assignedBy: assignment.contractorId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }
      
      await batch.commit()
      console.log("✅ [DailyAssignmentService] Bulk assignments created successfully")
    } catch (error) {
      console.error("❌ [DailyAssignmentService] Error bulk creating assignments:", error)
      throw new Error(`Failed to bulk create assignments: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Subscribe to real-time updates for assignments
   */
  static subscribeToAssignments(
    contractorId: string,
    date: string,
    callback: (assignments: DailyAssignment[]) => void
  ): () => void {
    const q = query(
      collection(FIRESTORE_DB, "dailyAssignments"),
      where("contractorId", "==", contractorId),
      where("assignmentDate", "==", date),
      orderBy("updatedAt", "desc")
    )

    return onSnapshot(q, (querySnapshot) => {
      const assignments: DailyAssignment[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        assignments.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as DailyAssignment)
      })
      callback(assignments)
    })
  }

  /**
   * Subscribe to real-time updates for a driver's assignments
   */
  static subscribeToDriverAssignments(
    driverId: string,
    callback: (assignments: DailyAssignment[]) => void
  ): () => void {
    const q = query(
      collection(FIRESTORE_DB, "dailyAssignments"),
      where("driverId", "==", driverId),
      orderBy("assignmentDate", "desc")
    )

    return onSnapshot(q, (querySnapshot) => {
      const assignments: DailyAssignment[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        assignments.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as DailyAssignment)
      })
      callback(assignments)
    })
  }
}
