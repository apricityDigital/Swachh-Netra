import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore"
import { FIRESTORE_DB } from "../FirebaseConfig"

export interface FeederPoint {
  id?: string
  areaName: string
  areaDescription: string
  wardNumber: string
  populationDensity: string
  accessibility: string
  additionalDetails: string
  kothiName: string
  feederPointName: string
  nearestLandmark: string
  approximateHouseholds: string
  vehicleTypes: string
  locationPhoto: string
  coordinates: {
    latitude: number
    longitude: number
  }
  createdAt: Date
  createdBy: string
  isActive: boolean
}

export interface FeederPointAssignment {
  id?: string
  feederPointId: string
  contractorId: string
  assignedAt: Date
  assignedBy: string
  status: "active" | "inactive"
  notes?: string
}

export interface AssignmentWithDetails extends FeederPointAssignment {
  feederPoint?: FeederPoint
  contractorName?: string
  contractorEmail?: string
}

export class FeederPointService {
  // Feeder Point CRUD Operations
  static async createFeederPoint(feederPointData: Omit<FeederPoint, "id" | "createdAt" | "isActive">): Promise<string> {
    try {
      const docRef = await addDoc(collection(FIRESTORE_DB, "feederPoints"), {
        ...feederPointData,
        createdAt: new Date(),
        isActive: true,
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating feeder point:", error)
      throw new Error("Failed to create feeder point")
    }
  }

  static async getAllFeederPoints(): Promise<FeederPoint[]> {
    try {
      const feederPointsRef = collection(FIRESTORE_DB, "feederPoints")
      const q = query(feederPointsRef, where("isActive", "==", true), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      
      const feederPoints: FeederPoint[] = []
      querySnapshot.forEach((doc) => {
        feederPoints.push({ id: doc.id, ...doc.data() } as FeederPoint)
      })
      
      return feederPoints
    } catch (error) {
      console.error("Error fetching feeder points:", error)
      throw new Error("Failed to fetch feeder points")
    }
  }

  static async getFeederPointById(id: string): Promise<FeederPoint | null> {
    try {
      const feederPointsRef = collection(FIRESTORE_DB, "feederPoints")
      const q = query(feederPointsRef, where("__name__", "==", id))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        return { id: doc.id, ...doc.data() } as FeederPoint
      }
      
      return null
    } catch (error) {
      console.error("Error fetching feeder point:", error)
      throw new Error("Failed to fetch feeder point")
    }
  }

  static async updateFeederPoint(id: string, updates: Partial<FeederPoint>): Promise<void> {
    try {
      const feederPointRef = doc(FIRESTORE_DB, "feederPoints", id)
      await updateDoc(feederPointRef, {
        ...updates,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error("Error updating feeder point:", error)
      throw new Error("Failed to update feeder point")
    }
  }

  static async deleteFeederPoint(id: string): Promise<void> {
    try {
      // Soft delete - mark as inactive
      const feederPointRef = doc(FIRESTORE_DB, "feederPoints", id)
      await updateDoc(feederPointRef, {
        isActive: false,
        deletedAt: new Date(),
      })
    } catch (error) {
      console.error("Error deleting feeder point:", error)
      throw new Error("Failed to delete feeder point")
    }
  }

  // Assignment CRUD Operations
  static async createAssignment(assignmentData: Omit<FeederPointAssignment, "id" | "assignedAt">): Promise<string> {
    try {
      const docRef = await addDoc(collection(FIRESTORE_DB, "feederPointAssignments"), {
        ...assignmentData,
        assignedAt: new Date(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating assignment:", error)
      throw new Error("Failed to create assignment")
    }
  }

  static async getAllAssignments(): Promise<FeederPointAssignment[]> {
    try {
      const assignmentsRef = collection(FIRESTORE_DB, "feederPointAssignments")
      const q = query(assignmentsRef, orderBy("assignedAt", "desc"))
      const querySnapshot = await getDocs(q)
      
      const assignments: FeederPointAssignment[] = []
      querySnapshot.forEach((doc) => {
        assignments.push({ id: doc.id, ...doc.data() } as FeederPointAssignment)
      })
      
      return assignments
    } catch (error) {
      console.error("Error fetching assignments:", error)
      throw new Error("Failed to fetch assignments")
    }
  }

  static async getActiveAssignments(): Promise<FeederPointAssignment[]> {
    try {
      const assignmentsRef = collection(FIRESTORE_DB, "feederPointAssignments")
      const q = query(assignmentsRef, where("status", "==", "active"), orderBy("assignedAt", "desc"))
      const querySnapshot = await getDocs(q)
      
      const assignments: FeederPointAssignment[] = []
      querySnapshot.forEach((doc) => {
        assignments.push({ id: doc.id, ...doc.data() } as FeederPointAssignment)
      })
      
      return assignments
    } catch (error) {
      console.error("Error fetching active assignments:", error)
      throw new Error("Failed to fetch active assignments")
    }
  }

  static async getAssignmentsByContractor(contractorId: string): Promise<FeederPointAssignment[]> {
    try {
      const assignmentsRef = collection(FIRESTORE_DB, "feederPointAssignments")
      const q = query(
        assignmentsRef, 
        where("contractorId", "==", contractorId),
        where("status", "==", "active"),
        orderBy("assignedAt", "desc")
      )
      const querySnapshot = await getDocs(q)
      
      const assignments: FeederPointAssignment[] = []
      querySnapshot.forEach((doc) => {
        assignments.push({ id: doc.id, ...doc.data() } as FeederPointAssignment)
      })
      
      return assignments
    } catch (error) {
      console.error("Error fetching contractor assignments:", error)
      throw new Error("Failed to fetch contractor assignments")
    }
  }

  static async updateAssignment(id: string, updates: Partial<FeederPointAssignment>): Promise<void> {
    try {
      const assignmentRef = doc(FIRESTORE_DB, "feederPointAssignments", id)
      await updateDoc(assignmentRef, {
        ...updates,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error("Error updating assignment:", error)
      throw new Error("Failed to update assignment")
    }
  }

  static async deleteAssignment(id: string): Promise<void> {
    try {
      await deleteDoc(doc(FIRESTORE_DB, "feederPointAssignments", id))
    } catch (error) {
      console.error("Error deleting assignment:", error)
      throw new Error("Failed to delete assignment")
    }
  }

  // Utility Methods
  static async getUnassignedFeederPoints(): Promise<FeederPoint[]> {
    try {
      const [feederPoints, assignments] = await Promise.all([
        this.getAllFeederPoints(),
        this.getActiveAssignments()
      ])
      
      const assignedFeederPointIds = new Set(assignments.map(a => a.feederPointId))
      return feederPoints.filter(fp => !assignedFeederPointIds.has(fp.id!))
    } catch (error) {
      console.error("Error fetching unassigned feeder points:", error)
      throw new Error("Failed to fetch unassigned feeder points")
    }
  }

  static async getAssignedFeederPoints(): Promise<AssignmentWithDetails[]> {
    try {
      const [assignments, feederPoints] = await Promise.all([
        this.getActiveAssignments(),
        this.getAllFeederPoints()
      ])
      
      const feederPointMap = new Map(feederPoints.map(fp => [fp.id!, fp]))
      
      return assignments.map(assignment => ({
        ...assignment,
        feederPoint: feederPointMap.get(assignment.feederPointId)
      }))
    } catch (error) {
      console.error("Error fetching assigned feeder points:", error)
      throw new Error("Failed to fetch assigned feeder points")
    }
  }

  static async getFeederPointsByWard(wardNumber: string): Promise<FeederPoint[]> {
    try {
      const feederPointsRef = collection(FIRESTORE_DB, "feederPoints")
      const q = query(
        feederPointsRef, 
        where("wardNumber", "==", wardNumber),
        where("isActive", "==", true),
        orderBy("createdAt", "desc")
      )
      const querySnapshot = await getDocs(q)
      
      const feederPoints: FeederPoint[] = []
      querySnapshot.forEach((doc) => {
        feederPoints.push({ id: doc.id, ...doc.data() } as FeederPoint)
      })
      
      return feederPoints
    } catch (error) {
      console.error("Error fetching feeder points by ward:", error)
      throw new Error("Failed to fetch feeder points by ward")
    }
  }

  static async getStatistics(): Promise<{
    totalFeederPoints: number
    assignedFeederPoints: number
    unassignedFeederPoints: number
    totalAssignments: number
    activeAssignments: number
  }> {
    try {
      const [feederPoints, assignments] = await Promise.all([
        this.getAllFeederPoints(),
        this.getAllAssignments()
      ])
      
      const activeAssignments = assignments.filter(a => a.status === "active")
      
      return {
        totalFeederPoints: feederPoints.length,
        assignedFeederPoints: activeAssignments.length,
        unassignedFeederPoints: feederPoints.length - activeAssignments.length,
        totalAssignments: assignments.length,
        activeAssignments: activeAssignments.length,
      }
    } catch (error) {
      console.error("Error fetching statistics:", error)
      throw new Error("Failed to fetch statistics")
    }
  }
}
