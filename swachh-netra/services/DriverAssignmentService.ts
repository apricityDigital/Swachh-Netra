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
  deleteDoc
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
  // Assign a driver to a contractor
  static async assignDriverToContractor(params: AssignDriverParams): Promise<void> {
    try {
      console.log("🔄 [DriverAssignmentService] Assigning driver to contractor:", params)

      // Get driver information
      const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", params.driverId))
      if (!driverDoc.exists()) {
        throw new Error("Driver not found")
      }
      const driverData = driverDoc.data()

      // Get contractor information
      const contractorDoc = await getDoc(doc(FIRESTORE_DB, "users", params.contractorId))
      if (!contractorDoc.exists()) {
        throw new Error("Contractor not found")
      }
      const contractorData = contractorDoc.data()

      // Check if driver is already assigned
      if (driverData.contractorId && driverData.contractorId !== params.contractorId) {
        throw new Error("Driver is already assigned to another contractor")
      }

      // Update driver document with contractor assignment
      await updateDoc(doc(FIRESTORE_DB, "users", params.driverId), {
        contractorId: params.contractorId,
        contractorName: contractorData.fullName || "Unknown Contractor",
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Create assignment record
      const assignmentData: Omit<DriverAssignmentData, "id"> = {
        driverId: params.driverId,
        driverName: driverData.fullName || "Unknown Driver",
        contractorId: params.contractorId,
        contractorName: contractorData.fullName || "Unknown Contractor",
        assignedBy: params.assignedBy,
        assignedAt: new Date(),
        status: 'active',
        notes: params.notes || "",
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await addDoc(collection(FIRESTORE_DB, "driverAssignments"), {
        ...assignmentData,
        assignedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      console.log("✅ [DriverAssignmentService] Driver assigned successfully")

    } catch (error) {
      console.error("❌ [DriverAssignmentService] Error assigning driver:", error)
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

      // Update driver document to remove contractor assignment
      await updateDoc(doc(FIRESTORE_DB, "users", driverId), {
        contractorId: null,
        contractorName: null,
        assignedAt: null,
        updatedAt: serverTimestamp()
      })

      // Update assignment record status to inactive
      const assignmentsRef = collection(FIRESTORE_DB, "driverAssignments")
      const q = query(
        assignmentsRef,
        where("driverId", "==", driverId),
        where("status", "==", "active")
      )

      const querySnapshot = await getDocs(q)
      const updatePromises = querySnapshot.docs.map(doc =>
        updateDoc(doc.ref, {
          status: 'terminated',
          updatedAt: serverTimestamp()
        })
      )

      await Promise.all(updatePromises)

      console.log("✅ [DriverAssignmentService] Driver unassigned successfully")

    } catch (error) {
      console.error("❌ [DriverAssignmentService] Error unassigning driver:", error)
      throw new Error(`Failed to unassign driver: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
