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

// Driver Assignment interfaces
export interface DriverAssignmentData {
  id?: string
  driverId: string
  driverName: string
  contractorId: string
  contractorName: string
  assignedBy: string
  assignedAt: Date
  status: 'active' | 'inactive' | 'terminated'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface AssignDriverParams {
  driverId: string
  contractorId: string
  assignedBy: string
  notes?: string
}

export interface AdminAssignDriverParams extends AssignDriverParams {
  adminUserId: string // Must be admin role
  forceReassign?: boolean // Allow reassignment if true
}

export interface DriverAssignmentStats {
  totalDrivers: number
  assignedDrivers: number
  unassignedDrivers: number
  contractorAssignments: { [contractorId: string]: number }
}

// Helper function to safely convert Firestore timestamps to Date objects
const safeToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date()
  if (typeof timestamp.toDate === 'function') return timestamp.toDate()
  if (timestamp instanceof Date) return timestamp
  if (typeof timestamp === 'string') return new Date(timestamp)
  return new Date()
}

export class DriverAssignmentService {
  // Assign a driver to a contractor (Admin only)
  static async assignDriverToContractor(params: AssignDriverParams): Promise<void> {
    try {
      console.log("🔄 [DriverAssignmentService] Assigning driver to contractor:", params)

      // Validate that assignedBy user is admin
      const assignerDoc = await getDoc(doc(FIRESTORE_DB, "users", params.assignedBy))
      if (!assignerDoc.exists()) {
        throw new Error("Assigner user not found")
      }
      const assignerData = assignerDoc.data()
      if (assignerData.role !== 'admin') {
        throw new Error("Only admin users can assign drivers to contractors")
      }

      // Get driver information
      const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", params.driverId))
      if (!driverDoc.exists()) {
        throw new Error("Driver not found")
      }
      const driverData = driverDoc.data()

      // Validate driver role
      if (driverData.role !== 'driver') {
        throw new Error("User is not a driver")
      }

      // Get contractor information
      const contractorDoc = await getDoc(doc(FIRESTORE_DB, "users", params.contractorId))
      if (!contractorDoc.exists()) {
        throw new Error("Contractor not found")
      }
      const contractorData = contractorDoc.data()

      // Validate contractor role
      if (contractorData.role !== 'transport_contractor') {
        throw new Error("User is not a contractor")
      }

      // Enforce one-to-one relationship: Check if driver is already assigned to ANY contractor
      if (driverData.contractorId) {
        throw new Error(`Driver is already assigned to contractor: ${driverData.contractorName || 'Unknown'}`)
      }

      // Check for any active assignments in the assignments collection
      const existingAssignmentsQuery = query(
        collection(FIRESTORE_DB, "driverAssignments"),
        where("driverId", "==", params.driverId),
        where("status", "==", "active")
      )
      const existingAssignments = await getDocs(existingAssignmentsQuery)

      if (!existingAssignments.empty) {
        const existingAssignment = existingAssignments.docs[0].data()
        throw new Error(`Driver is already assigned to contractor: ${existingAssignment.contractorName || 'Unknown'}`)
      }

      // Use transaction to ensure data consistency
      const batch = writeBatch(FIRESTORE_DB)

      // Update driver document with contractor assignment
      const driverRef = doc(FIRESTORE_DB, "users", params.driverId)
      batch.update(driverRef, {
        contractorId: params.contractorId,
        contractorName: contractorData.fullName || "Unknown Contractor",
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Create assignment record
      const assignmentRef = doc(collection(FIRESTORE_DB, "driverAssignments"))
      const assignmentData = {
        driverId: params.driverId,
        driverName: driverData.fullName || "Unknown Driver",
        contractorId: params.contractorId,
        contractorName: contractorData.fullName || "Unknown Contractor",
        assignedBy: params.assignedBy,
        assignedAt: serverTimestamp(),
        status: 'active',
        notes: params.notes || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      batch.set(assignmentRef, assignmentData)

      // Commit the transaction
      await batch.commit()

      console.log("✅ [DriverAssignmentService] Driver assigned successfully")

    } catch (error) {
      console.error("❌ [DriverAssignmentService] Error assigning driver:", error)
      throw new Error(`Failed to assign driver: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Admin-only assignment with enhanced validation and force reassign option
  static async adminAssignDriverToContractor(params: AdminAssignDriverParams): Promise<void> {
    try {
      console.log("🔄 [DriverAssignmentService] Admin assigning driver to contractor:", params)

      // Validate admin permissions
      const adminDoc = await getDoc(doc(FIRESTORE_DB, "users", params.adminUserId))
      if (!adminDoc.exists()) {
        throw new Error("Admin user not found")
      }
      const adminData = adminDoc.data()
      if (adminData.role !== 'admin') {
        throw new Error("Only admin users can perform driver assignments")
      }

      // Get driver information
      const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", params.driverId))
      if (!driverDoc.exists()) {
        throw new Error("Driver not found")
      }
      const driverData = driverDoc.data()

      if (driverData.role !== 'driver') {
        throw new Error("User is not a driver")
      }

      // Check for existing assignment
      if (driverData.contractorId && !params.forceReassign) {
        throw new Error(`Driver is already assigned to contractor: ${driverData.contractorName || 'Unknown'}. Use forceReassign option to override.`)
      }

      // If force reassign, first unassign the driver
      if (driverData.contractorId && params.forceReassign) {
        await this.unassignDriver(params.driverId)
      }

      // Now assign using the standard method
      await this.assignDriverToContractor({
        driverId: params.driverId,
        contractorId: params.contractorId,
        assignedBy: params.adminUserId,
        notes: params.notes
      })

      console.log("✅ [DriverAssignmentService] Admin assignment completed successfully")

    } catch (error) {
      console.error("❌ [DriverAssignmentService] Error in admin assignment:", error)
      throw new Error(`Failed to assign driver: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Unassign a driver from their contractor
  static async unassignDriver(driverId: string): Promise<void> {
    try {
      console.log("🔄 [DriverAssignmentService] Unassigning driver:", driverId)

      // Get driver information
      const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", driverId))
      if (!driverDoc.exists()) {
        throw new Error("Driver not found")
      }

      // Use batch for atomic operations
      const batch = writeBatch(FIRESTORE_DB)

      // Update driver document to remove contractor assignment
      const driverRef = doc(FIRESTORE_DB, "users", driverId)
      batch.update(driverRef, {
        contractorId: null,
        contractorName: null,
        assignedAt: null,
        updatedAt: serverTimestamp()
      })

      // Update assignment record status to terminated
      const assignmentsRef = collection(FIRESTORE_DB, "driverAssignments")
      const q = query(
        assignmentsRef,
        where("driverId", "==", driverId),
        where("status", "==", "active")
      )

      const querySnapshot = await getDocs(q)
      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'terminated',
          updatedAt: serverTimestamp()
        })
      })

      // Commit the batch
      await batch.commit()

      console.log("✅ [DriverAssignmentService] Driver unassigned successfully")

    } catch (error) {
      console.error("❌ [DriverAssignmentService] Error unassigning driver:", error)
      throw new Error(`Failed to unassign driver: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Validate assignment constraints
  static async validateAssignmentConstraints(driverId: string, contractorId: string): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    try {
      const errors: string[] = []
      const warnings: string[] = []

      // Check if driver exists and is valid
      const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", driverId))
      if (!driverDoc.exists()) {
        errors.push("Driver not found")
      } else {
        const driverData = driverDoc.data()
        if (driverData.role !== 'driver') {
          errors.push("User is not a driver")
        }
        if (driverData.contractorId) {
          if (driverData.contractorId === contractorId) {
            warnings.push("Driver is already assigned to this contractor")
          } else {
            errors.push(`Driver is already assigned to contractor: ${driverData.contractorName || 'Unknown'}`)
          }
        }
      }

      // Check if contractor exists and is valid
      const contractorDoc = await getDoc(doc(FIRESTORE_DB, "users", contractorId))
      if (!contractorDoc.exists()) {
        errors.push("Contractor not found")
      } else {
        const contractorData = contractorDoc.data()
        if (contractorData.role !== 'transport_contractor') {
          errors.push("User is not a contractor")
        }
      }

      // Check for active assignments in the assignments collection
      const existingAssignmentsQuery = query(
        collection(FIRESTORE_DB, "driverAssignments"),
        where("driverId", "==", driverId),
        where("status", "==", "active")
      )
      const existingAssignments = await getDocs(existingAssignmentsQuery)

      if (!existingAssignments.empty) {
        const existingAssignment = existingAssignments.docs[0].data()
        if (existingAssignment.contractorId === contractorId) {
          warnings.push("Assignment record already exists for this driver-contractor pair")
        } else {
          errors.push(`Active assignment exists for driver with contractor: ${existingAssignment.contractorName || 'Unknown'}`)
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }

    } catch (error) {
      console.error("❌ [DriverAssignmentService] Error validating constraints:", error)
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      }
    }
  }

  // Get all driver assignments
  static async getAllDriverAssignments(): Promise<DriverAssignmentData[]> {
    try {
      console.log("📋 [DriverAssignmentService] Fetching all driver assignments")

      const assignmentsRef = collection(FIRESTORE_DB, "driverAssignments")
      const q = query(assignmentsRef, orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      const assignments: DriverAssignmentData[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()



        assignments.push({
          id: doc.id,
          driverId: data.driverId,
          driverName: data.driverName,
          contractorId: data.contractorId,
          contractorName: data.contractorName,
          assignedBy: data.assignedBy,
          assignedAt: safeToDate(data.assignedAt),
          status: data.status,
          notes: data.notes,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt)
        })
      })

      console.log("✅ [DriverAssignmentService] Fetched", assignments.length, "assignments")
      return assignments

    } catch (error) {
      console.error("❌ [DriverAssignmentService] Error fetching assignments:", error)
      return []
    }
  }

  // Get assignments for a specific contractor
  static async getContractorDriverAssignments(contractorId: string): Promise<DriverAssignmentData[]> {
    try {
      console.log("📋 [DriverAssignmentService] Fetching assignments for contractor:", contractorId)

      const assignmentsRef = collection(FIRESTORE_DB, "driverAssignments")
      const q = query(
        assignmentsRef,
        where("contractorId", "==", contractorId),
        where("status", "==", "active"),
        orderBy("createdAt", "desc")
      )
      const querySnapshot = await getDocs(q)

      const assignments: DriverAssignmentData[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()



        assignments.push({
          id: doc.id,
          driverId: data.driverId,
          driverName: data.driverName,
          contractorId: data.contractorId,
          contractorName: data.contractorName,
          assignedBy: data.assignedBy,
          assignedAt: safeToDate(data.assignedAt),
          status: data.status,
          notes: data.notes,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt)
        })
      })

      console.log("✅ [DriverAssignmentService] Fetched", assignments.length, "assignments for contractor")
      return assignments

    } catch (error) {
      console.error("❌ [DriverAssignmentService] Error fetching contractor assignments:", error)
      return []
    }
  }

  // Get assignment statistics
  static async getAssignmentStatistics(): Promise<DriverAssignmentStats> {
    try {
      console.log("📊 [DriverAssignmentService] Fetching assignment statistics")

      // Get all drivers
      const driversRef = collection(FIRESTORE_DB, "users")
      const driversQuery = query(driversRef, where("role", "==", "driver"))
      const driversSnapshot = await getDocs(driversQuery)

      const totalDrivers = driversSnapshot.size
      let assignedDrivers = 0
      const contractorAssignments: { [contractorId: string]: number } = {}

      driversSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.contractorId) {
          assignedDrivers++
          contractorAssignments[data.contractorId] = (contractorAssignments[data.contractorId] || 0) + 1
        }
      })

      const unassignedDrivers = totalDrivers - assignedDrivers

      const stats: DriverAssignmentStats = {
        totalDrivers,
        assignedDrivers,
        unassignedDrivers,
        contractorAssignments
      }

      console.log("✅ [DriverAssignmentService] Assignment statistics:", stats)
      return stats

    } catch (error) {
      console.error("❌ [DriverAssignmentService] Error fetching statistics:", error)
      return {
        totalDrivers: 0,
        assignedDrivers: 0,
        unassignedDrivers: 0,
        contractorAssignments: {}
      }
    }
  }

  // Real-time listener for assignment changes
  static subscribeToAssignmentChanges(
    callback: (assignments: DriverAssignmentData[]) => void
  ): () => void {
    console.log("🔄 [DriverAssignmentService] Setting up real-time assignment listener")

    const assignmentsRef = collection(FIRESTORE_DB, "driverAssignments")
    const q = query(assignmentsRef, orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const assignments: DriverAssignmentData[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()



        assignments.push({
          id: doc.id,
          driverId: data.driverId,
          driverName: data.driverName,
          contractorId: data.contractorId,
          contractorName: data.contractorName,
          assignedBy: data.assignedBy,
          assignedAt: safeToDate(data.assignedAt),
          status: data.status,
          notes: data.notes,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt)
        })
      })

      callback(assignments)
    })

    return () => {
      console.log("🔄 [DriverAssignmentService] Cleaning up real-time assignment listener")
      unsubscribe()
    }
  }

  // Transfer driver from one contractor to another
  static async transferDriver(driverId: string, newContractorId: string, transferredBy: string): Promise<void> {
    try {
      console.log("🔄 [DriverAssignmentService] Transferring driver:", driverId, "to contractor:", newContractorId)

      // First unassign from current contractor
      await this.unassignDriver(driverId)

      // Then assign to new contractor
      await this.assignDriverToContractor({
        driverId,
        contractorId: newContractorId,
        assignedBy: transferredBy,
        notes: "Driver transferred"
      })

      console.log("✅ [DriverAssignmentService] Driver transferred successfully")

    } catch (error) {
      console.error("❌ [DriverAssignmentService] Error transferring driver:", error)
      throw new Error(`Failed to transfer driver: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
