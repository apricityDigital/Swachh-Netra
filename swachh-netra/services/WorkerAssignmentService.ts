import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  writeBatch
} from "firebase/firestore"
import { FIRESTORE_DB } from "../FirebaseConfig"

export interface WorkerAssignment {
  id?: string
  workerId: string
  workerName: string
  feederPointId: string
  feederPointName: string
  areaName: string
  assignedBy: string
  assignedAt: Date
  status: "active" | "inactive"
  shiftType: "morning" | "afternoon" | "evening"
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Worker {
  id: string
  fullName: string
  email: string
  phoneNumber?: string
  role: string
  isActive: boolean
  assignedFeederPointIds?: string[]
  createdAt: Date
}

export interface FeederPoint {
  id: string
  feederPointName: string
  areaName: string
  wardNumber: string
  nearestLandmark: string
  approximateHouseholds: string
  isActive: boolean
  assignedWorkerIds?: string[]
}

export class WorkerAssignmentService {
  // Get all workers
  static async getAllWorkers(): Promise<Worker[]> {
    try {
      console.log("🔄 [WorkerAssignmentService] Fetching all workers...")

      // Query the workers collection (same as WorkerService)
      const workersQuery = query(
        collection(FIRESTORE_DB, "workers"),
        where("isActive", "==", true)
      )

      const workersSnapshot = await getDocs(workersQuery)
      const workers: Worker[] = []

      workersSnapshot.forEach((doc) => {
        try {
          const data = doc.data()

          // Safe date conversion
          let createdAt = new Date()
          if (data.createdAt) {
            if (typeof data.createdAt.toDate === 'function') {
              createdAt = data.createdAt.toDate()
            } else if (data.createdAt instanceof Date) {
              createdAt = data.createdAt
            } else if (typeof data.createdAt === 'string') {
              createdAt = new Date(data.createdAt)
            }
          }

          workers.push({
            id: doc.id,
            fullName: data.fullName || data.name || data.displayName || "Unknown Worker",
            email: data.email || "",
            phoneNumber: data.phoneNumber || data.phone || "",
            role: "worker",
            isActive: data.isActive !== false,
            assignedFeederPointIds: Array.isArray(data.assignedFeederPointIds) ? data.assignedFeederPointIds : [],
            createdAt
          })
        } catch (docError) {
          console.warn(`⚠️ [WorkerAssignmentService] Error processing worker document ${doc.id}:`, docError)
          // Continue processing other documents
        }
      })

      // Sort workers by name
      workers.sort((a, b) => a.fullName.localeCompare(b.fullName))

      console.log(`✅ [WorkerAssignmentService] Found ${workers.length} workers`)
      return workers
    } catch (error) {
      console.error("❌ [WorkerAssignmentService] Error fetching workers:", error)
      console.error("❌ [WorkerAssignmentService] Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      // Return empty array instead of throwing to prevent app crashes
      return []
    }
  }

  // Get all feeder points
  static async getAllFeederPoints(): Promise<FeederPoint[]> {
    try {
      console.log("🔄 [WorkerAssignmentService] Fetching all feeder points...")
      
      const feederPointsSnapshot = await getDocs(collection(FIRESTORE_DB, "feederPoints"))
      const feederPoints: FeederPoint[] = []
      
      feederPointsSnapshot.forEach((doc) => {
        try {
          const data = doc.data()
          feederPoints.push({
            id: doc.id,
            feederPointName: data.feederPointName || data.name || "Unknown Point",
            areaName: data.areaName || data.area || "",
            wardNumber: String(data.wardNumber || data.ward || ""),
            nearestLandmark: data.nearestLandmark || data.landmark || "",
            approximateHouseholds: String(data.approximateHouseholds || data.households || ""),
            isActive: data.isActive !== false,
            assignedWorkerIds: Array.isArray(data.assignedWorkerIds) ? data.assignedWorkerIds : []
          })
        } catch (docError) {
          console.warn(`⚠️ [WorkerAssignmentService] Error processing feeder point document ${doc.id}:`, docError)
          // Continue processing other documents
        }
      })
      
      console.log(`✅ [WorkerAssignmentService] Found ${feederPoints.length} feeder points`)
      return feederPoints
    } catch (error) {
      console.error("❌ [WorkerAssignmentService] Error fetching feeder points:", error)
      console.error("❌ [WorkerAssignmentService] Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      // Return empty array instead of throwing to prevent app crashes
      return []
    }
  }

  // Assign workers to feeder point
  static async assignWorkersToFeederPoint(
    feederPointId: string,
    workerIds: string[],
    assignedBy: string,
    shiftType: "morning" | "afternoon" | "evening" = "morning"
  ): Promise<void> {
    try {
      console.log("🔄 [WorkerAssignmentService] Assigning workers to feeder point:", {
        feederPointId,
        workerIds: workerIds.length,
        assignedBy
      })

      const batch = writeBatch(FIRESTORE_DB)

      // Get feeder point details
      const feederPointDoc = await getDoc(doc(FIRESTORE_DB, "feederPoints", feederPointId))
      if (!feederPointDoc.exists()) {
        throw new Error("Feeder point not found")
      }
      const feederPointData = feederPointDoc.data()
      if (!feederPointData) {
        throw new Error("Feeder point data is empty")
      }

      // Create assignment records for each worker
      for (const workerId of workerIds) {
        // Get worker details - try workers collection first, then users collection
        let workerDoc = await getDoc(doc(FIRESTORE_DB, "workers", workerId))
        let workerData = null

        if (workerDoc.exists()) {
          workerData = workerDoc.data()
        } else {
          // Fallback to users collection
          workerDoc = await getDoc(doc(FIRESTORE_DB, "users", workerId))
          if (workerDoc.exists()) {
            workerData = workerDoc.data()
          }
        }

        if (!workerData) {
          console.warn(`⚠️ [WorkerAssignmentService] Worker ${workerId} not found in workers or users collection, skipping...`)
          continue
        }

        // Create assignment record
        const assignmentRef = doc(collection(FIRESTORE_DB, "workerAssignments"))
        const assignment: Omit<WorkerAssignment, "id"> = {
          workerId,
          workerName: workerData.fullName || workerData.name || workerData.displayName || "Unknown Worker",
          feederPointId,
          feederPointName: feederPointData.feederPointName || feederPointData.name || "Unknown Point",
          areaName: feederPointData.areaName || feederPointData.area || "",
          assignedBy,
          assignedAt: new Date(),
          status: "active",
          shiftType,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        batch.set(assignmentRef, {
          ...assignment,
          assignedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })

        // Update worker document (use the collection where we found the worker)
        const workerCollection = workerDoc.ref.parent.id // Get the collection name from the document reference
        const workerRef = doc(FIRESTORE_DB, workerCollection, workerId)
        const currentFeederPoints = Array.isArray(workerData.assignedFeederPointIds) ? workerData.assignedFeederPointIds : []



        if (!currentFeederPoints.includes(feederPointId)) {
          batch.update(workerRef, {
            assignedFeederPointIds: [...currentFeederPoints, feederPointId],
            updatedAt: serverTimestamp()
          })
        }
      }

      // Update feeder point document
      const feederPointRef = doc(FIRESTORE_DB, "feederPoints", feederPointId)
      const currentWorkers = Array.isArray(feederPointData.assignedWorkerIds) ? feederPointData.assignedWorkerIds : []
      const newWorkers = [...new Set([...currentWorkers, ...workerIds])]



      batch.update(feederPointRef, {
        assignedWorkerIds: newWorkers,
        updatedAt: serverTimestamp()
      })

      await batch.commit()
      console.log("✅ [WorkerAssignmentService] Workers assigned successfully")

    } catch (error) {
      console.error("❌ [WorkerAssignmentService] Error assigning workers:", error)
      throw new Error(`Failed to assign workers: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Remove worker from feeder point
  static async removeWorkerFromFeederPoint(workerId: string, feederPointId: string): Promise<void> {
    try {
      console.log("🔄 [WorkerAssignmentService] Removing worker from feeder point:", { workerId, feederPointId })

      const batch = writeBatch(FIRESTORE_DB)

      // Deactivate assignment records
      const assignmentsQuery = query(
        collection(FIRESTORE_DB, "workerAssignments"),
        where("workerId", "==", workerId),
        where("feederPointId", "==", feederPointId),
        where("status", "==", "active")
      )
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery)
      assignmentsSnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          status: "inactive",
          updatedAt: serverTimestamp()
        })
      })

      // Update worker document - try workers collection first, then users collection
      let workerDoc = await getDoc(doc(FIRESTORE_DB, "workers", workerId))
      let workerData = null
      let workerCollection = "workers"

      if (workerDoc.exists()) {
        workerData = workerDoc.data()
      } else {
        // Fallback to users collection
        workerDoc = await getDoc(doc(FIRESTORE_DB, "users", workerId))
        workerCollection = "users"
        if (workerDoc.exists()) {
          workerData = workerDoc.data()
        }
      }

      if (workerData) {
        const currentFeederPoints = Array.isArray(workerData.assignedFeederPointIds) ? workerData.assignedFeederPointIds : []
        const updatedFeederPoints = currentFeederPoints.filter((id: string) => id !== feederPointId)

        batch.update(doc(FIRESTORE_DB, workerCollection, workerId), {
          assignedFeederPointIds: updatedFeederPoints,
          updatedAt: serverTimestamp()
        })
      }

      // Update feeder point document
      const feederPointDoc = await getDoc(doc(FIRESTORE_DB, "feederPoints", feederPointId))
      if (feederPointDoc.exists()) {
        const feederPointData = feederPointDoc.data()
        const currentWorkers = feederPointData.assignedWorkerIds || []
        const updatedWorkers = currentWorkers.filter((id: string) => id !== workerId)
        
        batch.update(doc(FIRESTORE_DB, "feederPoints", feederPointId), {
          assignedWorkerIds: updatedWorkers,
          updatedAt: serverTimestamp()
        })
      }

      await batch.commit()
      console.log("✅ [WorkerAssignmentService] Worker removed successfully")

    } catch (error) {
      console.error("❌ [WorkerAssignmentService] Error removing worker:", error)
      throw new Error("Failed to remove worker assignment")
    }
  }

  // Get assignments for a feeder point
  static async getFeederPointAssignments(feederPointId: string): Promise<WorkerAssignment[]> {
    try {
      const assignmentsQuery = query(
        collection(FIRESTORE_DB, "workerAssignments"),
        where("feederPointId", "==", feederPointId),
        where("status", "==", "active")
      )
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery)
      const assignments: WorkerAssignment[] = []
      
      assignmentsSnapshot.forEach((doc) => {
        try {
          const data = doc.data()

          // Safe date conversion function
          const safeToDate = (dateField: any): Date => {
            if (!dateField) return new Date()
            if (typeof dateField.toDate === 'function') return dateField.toDate()
            if (dateField instanceof Date) return dateField
            if (typeof dateField === 'string') return new Date(dateField)
            return new Date()
          }

          assignments.push({
            id: doc.id,
            workerId: data.workerId || "",
            workerName: data.workerName || "Unknown Worker",
            feederPointId: data.feederPointId || "",
            feederPointName: data.feederPointName || "Unknown Point",
            areaName: data.areaName || "",
            assignedBy: data.assignedBy || "",
            assignedAt: safeToDate(data.assignedAt),
            status: data.status || "active",
            shiftType: data.shiftType || "morning",
            notes: data.notes || "",
            createdAt: safeToDate(data.createdAt),
            updatedAt: safeToDate(data.updatedAt)
          } as WorkerAssignment)
        } catch (docError) {
          console.warn(`⚠️ [WorkerAssignmentService] Error processing assignment document ${doc.id}:`, docError)
          // Continue processing other documents
        }
      })

      // Sort assignments by assigned date (newest first)
      assignments.sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime())

      return assignments
    } catch (error) {
      console.error("❌ [WorkerAssignmentService] Error fetching assignments:", error)
      return []
    }
  }
}
