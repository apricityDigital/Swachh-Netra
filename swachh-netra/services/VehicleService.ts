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
  Timestamp,
} from "firebase/firestore"
import { FIRESTORE_DB } from "../FirebaseConfig"

export interface Vehicle {
  id?: string
  vehicleNumber: string
  capacity: number
  vehicleType: string
  registrationDate: Date
  status: "active" | "inactive" | "maintenance"
  createdAt: Date
  createdBy: string
  isActive: boolean
  // Assignment tracking
  assignedToContractor?: string
  assignedToDriver?: string
  contractorName?: string
  driverName?: string
}

export interface VehicleAssignment {
  id?: string
  vehicleId: string
  assignedTo: string // contractor or driver ID
  assignedBy: string // admin or contractor ID
  assignmentType: "admin_to_contractor" | "contractor_to_driver"
  assignedAt: Date
  status: "active" | "inactive"
  notes?: string
}

export interface VehicleWithAssignment extends Vehicle {
  isAssigned?: boolean
  assignmentDetails?: VehicleAssignment
}

export class VehicleService {
  // Vehicle CRUD Operations
  static async createVehicle(vehicleData: Omit<Vehicle, "id" | "createdAt" | "isActive">): Promise<string> {
    try {
      const docRef = await addDoc(collection(FIRESTORE_DB, "vehicles"), {
        ...vehicleData,
        createdAt: new Date(),
        isActive: true,
        status: vehicleData.status || "active",
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating vehicle:", error)
      throw new Error("Failed to create vehicle")
    }
  }

  static async getAllVehicles(): Promise<Vehicle[]> {
    try {
      const vehiclesRef = collection(FIRESTORE_DB, "vehicles")

      // Try compound query first, fallback to simple query if it fails
      let querySnapshot
      try {
        const q = query(vehiclesRef, where("isActive", "==", true), orderBy("createdAt", "desc"))
        querySnapshot = await getDocs(q)
      } catch (indexError) {
        console.warn("Compound query failed, using simple query:", indexError)
        // Fallback to simple query without orderBy
        const q = query(vehiclesRef, where("isActive", "==", true))
        querySnapshot = await getDocs(q)
      }

      const vehicles: Vehicle[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        vehicles.push({
          id: doc.id,
          ...data,
          // Ensure required fields have defaults
          createdAt: data.createdAt || new Date(),
          registrationDate: data.registrationDate || new Date(),
          isActive: data.isActive !== undefined ? data.isActive : true,
          status: data.status || "active"
        } as Vehicle)
      })

      // Sort manually if orderBy failed
      vehicles.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
        return dateB.getTime() - dateA.getTime()
      })

      return vehicles
    } catch (error) {
      console.error("Error fetching vehicles:", error)

      // If even the simple query fails, try to get all documents
      try {
        console.log("Attempting to fetch all vehicles without filters...")
        const vehiclesRef = collection(FIRESTORE_DB, "vehicles")
        const querySnapshot = await getDocs(vehiclesRef)

        const vehicles: Vehicle[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          vehicles.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt || new Date(),
            registrationDate: data.registrationDate || new Date(),
            isActive: data.isActive !== undefined ? data.isActive : true,
            status: data.status || "active"
          } as Vehicle)
        })

        // Filter active vehicles manually
        return vehicles.filter(v => v.isActive !== false)
      } catch (fallbackError) {
        console.error("Fallback query also failed:", fallbackError)
        throw new Error(`Failed to fetch vehicles: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  static async getVehicleById(id: string): Promise<Vehicle | null> {
    try {
      const vehiclesRef = collection(FIRESTORE_DB, "vehicles")
      const q = query(vehiclesRef, where("__name__", "==", id))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        return { id: doc.id, ...doc.data() } as Vehicle
      }

      return null
    } catch (error) {
      console.error("Error fetching vehicle:", error)
      throw new Error("Failed to fetch vehicle")
    }
  }

  static async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<void> {
    try {
      const vehicleRef = doc(FIRESTORE_DB, "vehicles", id)
      await updateDoc(vehicleRef, {
        ...updates,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error("Error updating vehicle:", error)
      throw new Error("Failed to update vehicle")
    }
  }

  static async deleteVehicle(id: string): Promise<void> {
    try {
      // Soft delete - mark as inactive
      const vehicleRef = doc(FIRESTORE_DB, "vehicles", id)
      await updateDoc(vehicleRef, {
        isActive: false,
        deletedAt: new Date(),
      })
    } catch (error) {
      console.error("Error deleting vehicle:", error)
      throw new Error("Failed to delete vehicle")
    }
  }

  // Vehicle Assignment Operations
  static async createVehicleAssignment(assignmentData: Omit<VehicleAssignment, "id" | "assignedAt">): Promise<string> {
    try {
      const docRef = await addDoc(collection(FIRESTORE_DB, "vehicleAssignments"), {
        ...assignmentData,
        assignedAt: new Date(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating vehicle assignment:", error)
      throw new Error("Failed to create vehicle assignment")
    }
  }

  static async getAllVehicleAssignments(): Promise<VehicleAssignment[]> {
    try {
      const assignmentsRef = collection(FIRESTORE_DB, "vehicleAssignments")
      const q = query(assignmentsRef, orderBy("assignedAt", "desc"))
      const querySnapshot = await getDocs(q)

      const assignments: VehicleAssignment[] = []
      querySnapshot.forEach((doc) => {
        assignments.push({ id: doc.id, ...doc.data() } as VehicleAssignment)
      })

      return assignments
    } catch (error) {
      console.error("Error fetching vehicle assignments:", error)
      throw new Error("Failed to fetch vehicle assignments")
    }
  }

  static async getActiveVehicleAssignments(): Promise<VehicleAssignment[]> {
    try {
      const assignmentsRef = collection(FIRESTORE_DB, "vehicleAssignments")
      const q = query(assignmentsRef, where("status", "==", "active"), orderBy("assignedAt", "desc"))
      const querySnapshot = await getDocs(q)

      const assignments: VehicleAssignment[] = []
      querySnapshot.forEach((doc) => {
        assignments.push({ id: doc.id, ...doc.data() } as VehicleAssignment)
      })

      return assignments
    } catch (error) {
      console.error("Error fetching active vehicle assignments:", error)
      throw new Error("Failed to fetch active vehicle assignments")
    }
  }

  static async getVehicleAssignmentsByContractor(contractorId: string): Promise<VehicleAssignment[]> {
    try {
      const assignmentsRef = collection(FIRESTORE_DB, "vehicleAssignments")
      const q = query(
        assignmentsRef,
        where("assignedTo", "==", contractorId),
        where("assignmentType", "==", "admin_to_contractor"),
        where("status", "==", "active"),
        orderBy("assignedAt", "desc")
      )
      const querySnapshot = await getDocs(q)

      const assignments: VehicleAssignment[] = []
      querySnapshot.forEach((doc) => {
        assignments.push({ id: doc.id, ...doc.data() } as VehicleAssignment)
      })

      return assignments
    } catch (error) {
      console.error("Error fetching contractor vehicle assignments:", error)
      throw new Error("Failed to fetch contractor vehicle assignments")
    }
  }

  static async getVehicleAssignmentsByDriver(driverId: string): Promise<VehicleAssignment[]> {
    try {
      const assignmentsRef = collection(FIRESTORE_DB, "vehicleAssignments")
      const q = query(
        assignmentsRef,
        where("assignedTo", "==", driverId),
        where("assignmentType", "==", "contractor_to_driver"),
        where("status", "==", "active"),
        orderBy("assignedAt", "desc")
      )
      const querySnapshot = await getDocs(q)

      const assignments: VehicleAssignment[] = []
      querySnapshot.forEach((doc) => {
        assignments.push({ id: doc.id, ...doc.data() } as VehicleAssignment)
      })

      return assignments
    } catch (error) {
      console.error("Error fetching driver vehicle assignments:", error)
      throw new Error("Failed to fetch driver vehicle assignments")
    }
  }

  static async updateVehicleAssignment(id: string, updates: Partial<VehicleAssignment>): Promise<void> {
    try {
      const assignmentRef = doc(FIRESTORE_DB, "vehicleAssignments", id)
      await updateDoc(assignmentRef, {
        ...updates,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error("Error updating vehicle assignment:", error)
      throw new Error("Failed to update vehicle assignment")
    }
  }

  static async deleteVehicleAssignment(id: string): Promise<void> {
    try {
      await deleteDoc(doc(FIRESTORE_DB, "vehicleAssignments", id))
    } catch (error) {
      console.error("Error deleting vehicle assignment:", error)
      throw new Error("Failed to delete vehicle assignment")
    }
  }

  // Utility Methods
  static async getUnassignedVehicles(): Promise<Vehicle[]> {
    try {
      const [vehicles, assignments] = await Promise.all([
        this.getAllVehicles(),
        this.getActiveVehicleAssignments()
      ])

      const assignedVehicleIds = new Set(assignments.map(a => a.vehicleId))
      return vehicles.filter(vehicle => !assignedVehicleIds.has(vehicle.id!))
    } catch (error) {
      console.error("Error fetching unassigned vehicles:", error)
      throw new Error("Failed to fetch unassigned vehicles")
    }
  }

  static async getAssignedVehicles(): Promise<VehicleWithAssignment[]> {
    try {
      const [assignments, vehicles] = await Promise.all([
        this.getActiveVehicleAssignments(),
        this.getAllVehicles()
      ])

      const vehicleMap = new Map(vehicles.map(vehicle => [vehicle.id!, vehicle]))

      return assignments.map(assignment => ({
        ...vehicleMap.get(assignment.vehicleId)!,
        isAssigned: true,
        assignmentDetails: assignment
      })).filter(vehicle => vehicle.id) // Filter out undefined vehicles
    } catch (error) {
      console.error("Error fetching assigned vehicles:", error)
      throw new Error("Failed to fetch assigned vehicles")
    }
  }

  static async getVehiclesByStatus(status: Vehicle["status"]): Promise<Vehicle[]> {
    try {
      const vehiclesRef = collection(FIRESTORE_DB, "vehicles")
      const q = query(
        vehiclesRef,
        where("status", "==", status),
        where("isActive", "==", true),
        orderBy("createdAt", "desc")
      )
      const querySnapshot = await getDocs(q)

      const vehicles: Vehicle[] = []
      querySnapshot.forEach((doc) => {
        vehicles.push({ id: doc.id, ...doc.data() } as Vehicle)
      })

      return vehicles
    } catch (error) {
      console.error("Error fetching vehicles by status:", error)
      throw new Error("Failed to fetch vehicles by status")
    }
  }

  static async getVehicleStatistics(): Promise<{
    totalVehicles: number
    activeVehicles: number
    assignedVehicles: number
    unassignedVehicles: number
    maintenanceVehicles: number
    totalCapacity: number
  }> {
    try {
      const [vehicles, assignments] = await Promise.all([
        this.getAllVehicles(),
        this.getActiveVehicleAssignments()
      ])

      const activeVehicles = vehicles.filter(v => v.status === "active")
      const maintenanceVehicles = vehicles.filter(v => v.status === "maintenance")
      const totalCapacity = vehicles.reduce((sum, vehicle) => sum + vehicle.capacity, 0)

      return {
        totalVehicles: vehicles.length,
        activeVehicles: activeVehicles.length,
        assignedVehicles: assignments.length,
        unassignedVehicles: vehicles.length - assignments.length,
        maintenanceVehicles: maintenanceVehicles.length,
        totalCapacity,
      }
    } catch (error) {
      console.error("Error fetching vehicle statistics:", error)
      throw new Error("Failed to fetch vehicle statistics")
    }
  }
}
