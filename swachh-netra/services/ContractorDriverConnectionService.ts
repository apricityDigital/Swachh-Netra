import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  updateDoc,
  serverTimestamp
} from "firebase/firestore"
import { FIRESTORE_DB } from "../FirebaseConfig"

// Connection verification interfaces
export interface ConnectionTestResult {
  success: boolean
  message: string
  details?: any
  timestamp: Date
}

export interface ContractorDriverConnection {
  contractorId: string
  contractorName: string
  driverId: string
  driverName: string
  connectionStatus: 'connected' | 'disconnected' | 'partial'
  assignedVehicle?: {
    id: string
    vehicleNumber: string
    status: string
  }
  assignedFeederPoints: {
    id: string
    name: string
  }[]
  lastSyncTime?: Date
  issues: string[]
}

export interface DataFlowTest {
  testName: string
  contractorData: any
  driverData: any
  assignmentData: any
  vehicleData: any
  feederPointData: any
  isDataConsistent: boolean
  inconsistencies: string[]
}

export class ContractorDriverConnectionService {

  // Test complete contractor-driver data flow
  static async testContractorDriverConnection(
    contractorId: string,
    driverId: string
  ): Promise<DataFlowTest> {
    try {
      console.log("🔍 [ConnectionService] Testing contractor-driver connection:", { contractorId, driverId })

      // 1. Get contractor data
      const contractorDoc = await getDoc(doc(FIRESTORE_DB, "users", contractorId))
      const contractorData = contractorDoc.exists() ? contractorDoc.data() : null

      // 2. Get driver data
      const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", driverId))
      const driverData = driverDoc.exists() ? driverDoc.data() : null

      // 3. Get assignment data from driverAssignments collection
      const assignmentsRef = collection(FIRESTORE_DB, "driverAssignments")
      const assignmentQuery = query(
        assignmentsRef,
        where("driverId", "==", driverId),
        where("contractorId", "==", contractorId),
        where("status", "==", "active")
      )
      const assignmentSnapshot = await getDocs(assignmentQuery)
      const assignmentData = assignmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      // 4. Get vehicle data if assigned
      let vehicleData = null
      if (driverData?.assignedVehicleId) {
        const vehicleDoc = await getDoc(doc(FIRESTORE_DB, "vehicles", driverData.assignedVehicleId))
        vehicleData = vehicleDoc.exists() ? vehicleDoc.data() : null
      }

      // 5. Get feeder point data if assigned
      const feederPointData: any[] = []
      if (driverData?.assignedFeederPointIds && Array.isArray(driverData.assignedFeederPointIds)) {
        for (const fpId of driverData.assignedFeederPointIds) {
          const fpDoc = await getDoc(doc(FIRESTORE_DB, "feederPoints", fpId))
          if (fpDoc.exists()) {
            feederPointData.push({ id: fpDoc.id, ...fpDoc.data() })
          }
        }
      }

      // 6. Check data consistency
      const inconsistencies: string[] = []

      // Check contractor-driver relationship
      if (driverData?.contractorId !== contractorId) {
        inconsistencies.push(`Driver contractorId (${driverData?.contractorId}) doesn't match expected (${contractorId})`)
      }

      // Check assignment data consistency
      if (assignmentData.length === 0) {
        inconsistencies.push("No active assignment found in driverAssignments collection")
      } else {
        const latestAssignment = assignmentData[0] as any
        if (latestAssignment.vehicleId !== driverData?.assignedVehicleId) {
          inconsistencies.push(`Assignment vehicleId (${latestAssignment.vehicleId}) doesn't match driver assignedVehicleId (${driverData?.assignedVehicleId})`)
        }
      }

      // Check vehicle assignment
      if (vehicleData && vehicleData.driverId !== driverId) {
        inconsistencies.push(`Vehicle driverId (${vehicleData.driverId}) doesn't match expected (${driverId})`)
      }

      const testResult: DataFlowTest = {
        testName: `Contractor-Driver Connection Test`,
        contractorData,
        driverData,
        assignmentData,
        vehicleData,
        feederPointData,
        isDataConsistent: inconsistencies.length === 0,
        inconsistencies
      }

      console.log("📊 [ConnectionService] Test completed:", {
        isConsistent: testResult.isDataConsistent,
        issuesFound: inconsistencies.length
      })

      return testResult

    } catch (error) {
      console.error("❌ [ConnectionService] Error testing connection:", error)
      throw error
    }
  }

  // Get all contractor-driver connections
  static async getAllContractorDriverConnections(): Promise<ContractorDriverConnection[]> {
    try {
      console.log("🔍 [ConnectionService] Fetching all contractor-driver connections")

      const connections: ContractorDriverConnection[] = []

      // Get all active driver assignments
      const assignmentsRef = collection(FIRESTORE_DB, "driverAssignments")
      const assignmentsQuery = query(
        assignmentsRef,
        where("status", "==", "active"),
        orderBy("assignedAt", "desc")
      )
      const assignmentsSnapshot = await getDocs(assignmentsQuery)

      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const assignment = assignmentDoc.data()

        try {
          // Get contractor info
          const contractorDoc = await getDoc(doc(FIRESTORE_DB, "users", assignment.contractorId))
          const contractorData = contractorDoc.exists() ? contractorDoc.data() : null

          // Get driver info
          const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", assignment.driverId))
          const driverData = driverDoc.exists() ? driverDoc.data() : null

          // Get vehicle info if assigned
          let assignedVehicle = undefined
          if (assignment.vehicleId) {
            const vehicleDoc = await getDoc(doc(FIRESTORE_DB, "vehicles", assignment.vehicleId))
            if (vehicleDoc.exists()) {
              const vehicleData = vehicleDoc.data()
              assignedVehicle = {
                id: vehicleDoc.id,
                vehicleNumber: vehicleData.vehicleNumber || "Unknown",
                status: vehicleData.status || "unknown"
              }
            }
          }

          // Get feeder points info
          const assignedFeederPoints: { id: string; name: string }[] = []
          if (assignment.feederPointIds && Array.isArray(assignment.feederPointIds)) {
            for (const fpId of assignment.feederPointIds) {
              const fpDoc = await getDoc(doc(FIRESTORE_DB, "feederPoints", fpId))
              if (fpDoc.exists()) {
                const fpData = fpDoc.data()
                assignedFeederPoints.push({
                  id: fpDoc.id,
                  name: fpData.feederPointName || "Unknown"
                })
              }
            }
          }

          // Check connection status and issues
          const issues: string[] = []
          let connectionStatus: 'connected' | 'disconnected' | 'partial' = 'connected'

          if (!contractorData) {
            issues.push("Contractor not found")
            connectionStatus = 'disconnected'
          }

          if (!driverData) {
            issues.push("Driver not found")
            connectionStatus = 'disconnected'
          }

          if (driverData && driverData.contractorId !== assignment.contractorId) {
            issues.push("Driver contractorId mismatch")
            connectionStatus = 'partial'
          }

          if (assignment.vehicleId && !assignedVehicle) {
            issues.push("Assigned vehicle not found")
            connectionStatus = 'partial'
          }

          const connection: ContractorDriverConnection = {
            contractorId: assignment.contractorId,
            contractorName: contractorData?.fullName || "Unknown Contractor",
            driverId: assignment.driverId,
            driverName: driverData?.fullName || "Unknown Driver",
            connectionStatus,
            assignedVehicle,
            assignedFeederPoints,
            lastSyncTime: assignment.assignedAt?.toDate?.() || new Date(),
            issues
          }

          connections.push(connection)

        } catch (error) {
          console.error("❌ [ConnectionService] Error processing assignment:", assignment.id, error)
        }
      }

      console.log("✅ [ConnectionService] Found", connections.length, "connections")
      return connections

    } catch (error) {
      console.error("❌ [ConnectionService] Error fetching connections:", error)
      return []
    }
  }

  // Fix data inconsistencies
  static async fixContractorDriverConnection(
    contractorId: string,
    driverId: string
  ): Promise<ConnectionTestResult> {
    try {
      console.log("🔧 [ConnectionService] Fixing contractor-driver connection:", { contractorId, driverId })

      // Get latest assignment data
      const assignmentsRef = collection(FIRESTORE_DB, "driverAssignments")
      const assignmentQuery = query(
        assignmentsRef,
        where("driverId", "==", driverId),
        where("contractorId", "==", contractorId),
        where("status", "==", "active"),
        orderBy("assignedAt", "desc")
      )
      const assignmentSnapshot = await getDocs(assignmentQuery)

      if (assignmentSnapshot.empty) {
        return {
          success: false,
          message: "No active assignment found to fix",
          timestamp: new Date()
        }
      }

      const latestAssignment = assignmentSnapshot.docs[0].data()

      // Update driver document with correct assignment data
      const driverRef = doc(FIRESTORE_DB, "users", driverId)
      await updateDoc(driverRef, {
        contractorId: contractorId,
        assignedVehicleId: latestAssignment.vehicleId || null,
        assignedFeederPointIds: latestAssignment.feederPointIds || [],
        updatedAt: serverTimestamp()
      })

      // Update vehicle if assigned
      if (latestAssignment.vehicleId) {
        const vehicleRef = doc(FIRESTORE_DB, "vehicles", latestAssignment.vehicleId)
        await updateDoc(vehicleRef, {
          driverId: driverId,
          status: "assigned",
          updatedAt: serverTimestamp()
        })
      }

      console.log("✅ [ConnectionService] Connection fixed successfully")

      return {
        success: true,
        message: "Contractor-driver connection fixed successfully",
        details: {
          contractorId,
          driverId,
          vehicleId: latestAssignment.vehicleId,
          feederPointsCount: latestAssignment.feederPointIds?.length || 0
        },
        timestamp: new Date()
      }

    } catch (error) {
      console.error("❌ [ConnectionService] Error fixing connection:", error)
      return {
        success: false,
        message: `Failed to fix connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }
    }
  }

  // Real-time monitoring of contractor-driver connections
  static subscribeToConnectionChanges(
    callback: (connections: ContractorDriverConnection[]) => void
  ): () => void {
    console.log("🔄 [ConnectionService] Setting up real-time connection monitoring")

    const assignmentsRef = collection(FIRESTORE_DB, "driverAssignments")
    const assignmentsQuery = query(
      assignmentsRef,
      where("status", "==", "active"),
      orderBy("assignedAt", "desc")
    )

    const unsubscribe = onSnapshot(assignmentsQuery, async () => {
      try {
        const connections = await this.getAllContractorDriverConnections()
        callback(connections)
      } catch (error) {
        console.error("❌ [ConnectionService] Error in real-time monitoring:", error)
      }
    })

    return () => {
      console.log("🔄 [ConnectionService] Cleaning up connection monitoring")
      unsubscribe()
    }
  }

  // Monitor specific contractor-driver data flow
  static async monitorDataFlow(contractorId: string, driverId: string): Promise<{
    contractorAssignment: any
    driverDocument: any
    vehicleDocument: any
    feederPointDocuments: any[]
    dataFlowStatus: 'healthy' | 'delayed' | 'broken'
    lastUpdateTime: Date
  }> {
    try {
      console.log("📊 [ConnectionService] Monitoring data flow:", { contractorId, driverId })

      // Get contractor assignment
      const assignmentsRef = collection(FIRESTORE_DB, "driverAssignments")
      const assignmentQuery = query(
        assignmentsRef,
        where("driverId", "==", driverId),
        where("contractorId", "==", contractorId),
        where("status", "==", "active"),
        orderBy("assignedAt", "desc")
      )
      const assignmentSnapshot = await getDocs(assignmentQuery)
      const contractorAssignment = assignmentSnapshot.docs[0]?.data() || null

      // Get driver document
      const driverDoc = await getDoc(doc(FIRESTORE_DB, "users", driverId))
      const driverDocument = driverDoc.exists() ? driverDoc.data() : null

      // Get vehicle document if assigned
      let vehicleDocument = null
      if (contractorAssignment?.vehicleId) {
        const vehicleDoc = await getDoc(doc(FIRESTORE_DB, "vehicles", contractorAssignment.vehicleId))
        vehicleDocument = vehicleDoc.exists() ? vehicleDoc.data() : null
      }

      // Get feeder point documents
      const feederPointDocuments: any[] = []
      if (contractorAssignment?.feederPointIds && Array.isArray(contractorAssignment.feederPointIds)) {
        for (const fpId of contractorAssignment.feederPointIds) {
          const fpDoc = await getDoc(doc(FIRESTORE_DB, "feederPoints", fpId))
          if (fpDoc.exists()) {
            feederPointDocuments.push({ id: fpDoc.id, ...fpDoc.data() })
          }
        }
      }

      // Determine data flow status
      let dataFlowStatus: 'healthy' | 'delayed' | 'broken' = 'healthy'

      if (!contractorAssignment) {
        dataFlowStatus = 'broken'
      } else if (!driverDocument || driverDocument.contractorId !== contractorId) {
        dataFlowStatus = 'broken'
      } else if (contractorAssignment.vehicleId && !vehicleDocument) {
        dataFlowStatus = 'delayed'
      } else if (contractorAssignment.vehicleId !== driverDocument.assignedVehicleId) {
        dataFlowStatus = 'delayed'
      }

      const lastUpdateTime = contractorAssignment?.assignedAt?.toDate?.() || new Date()

      console.log("📊 [ConnectionService] Data flow status:", dataFlowStatus)

      return {
        contractorAssignment,
        driverDocument,
        vehicleDocument,
        feederPointDocuments,
        dataFlowStatus,
        lastUpdateTime
      }

    } catch (error) {
      console.error("❌ [ConnectionService] Error monitoring data flow:", error)
      throw error
    }
  }

  // Get data flow summary for all connections
  static async getDataFlowSummary(): Promise<{
    totalConnections: number
    healthyConnections: number
    delayedConnections: number
    brokenConnections: number
    lastChecked: Date
  }> {
    try {
      console.log("📈 [ConnectionService] Getting data flow summary")

      const connections = await this.getAllContractorDriverConnections()

      const summary = {
        totalConnections: connections.length,
        healthyConnections: connections.filter(c => c.connectionStatus === 'connected').length,
        delayedConnections: connections.filter(c => c.connectionStatus === 'partial').length,
        brokenConnections: connections.filter(c => c.connectionStatus === 'disconnected').length,
        lastChecked: new Date()
      }

      console.log("📈 [ConnectionService] Data flow summary:", summary)
      return summary

    } catch (error) {
      console.error("❌ [ConnectionService] Error getting data flow summary:", error)
      return {
        totalConnections: 0,
        healthyConnections: 0,
        delayedConnections: 0,
        brokenConnections: 0,
        lastChecked: new Date()
      }
    }
  }
}
