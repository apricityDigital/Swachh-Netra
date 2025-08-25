// Test script to manually test the assignment function
// This will help us verify if the assignment logic works

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, updateDoc, addDoc, writeBatch, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDFIdrYsVPA-1S3UB-SQJUcu6H57f7jGqU",
  authDomain: "swachh-netra-3e12e.firebaseapp.com",
  projectId: "swachh-netra-3e12e",
  storageBucket: "swachh-netra-3e12e.firebasestorage.app",
  messagingSenderId: "697022376282",
  appId: "1:697022376282:web:9fb1df9dd06f2802072b63",
  measurementId: "G-HYRTCQH2P2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Replicate the assignment function from ContractorService
async function testAssignVehicleToDriver(contractorId, vehicleId, driverId, feederPointIds) {
  try {
    console.log("🔄 [TEST] Starting vehicle assignment:", {
      contractorId,
      vehicleId,
      driverId,
      feederPointIds: feederPointIds.length
    });

    // Validate inputs
    if (!contractorId || !vehicleId || !driverId || !feederPointIds.length) {
      throw new Error("Missing required assignment parameters");
    }

    // Check if vehicle exists and is available
    const vehicleDoc = await getDoc(doc(db, "vehicles", vehicleId));
    if (!vehicleDoc.exists()) {
      throw new Error("Vehicle not found");
    }

    const vehicleData = vehicleDoc.data();
    console.log("🚗 [TEST] Vehicle data:", vehicleData);

    // Check if driver exists
    const driverDoc = await getDoc(doc(db, "users", driverId));
    if (!driverDoc.exists()) {
      throw new Error("Driver not found");
    }

    const driverData = driverDoc.data();
    console.log("👤 [TEST] Driver data before assignment:", driverData);

    const batch = writeBatch(db);

    // First, deactivate any existing assignments for this driver
    const existingAssignmentsQuery = query(
      collection(db, "driverAssignments"),
      where("driverId", "==", driverId),
      where("status", "==", "active")
    );
    const existingAssignments = await getDocs(existingAssignmentsQuery);
    
    console.log(`🔄 [TEST] Found ${existingAssignments.size} existing assignments to deactivate`);
    existingAssignments.forEach((doc) => {
      batch.update(doc.ref, { status: "inactive", updatedAt: serverTimestamp() });
    });

    // Create new driver assignment
    const driverAssignmentRef = doc(collection(db, "driverAssignments"));
    const driverAssignment = {
      driverId,
      contractorId,
      vehicleId,
      feederPointIds,
      assignedAt: serverTimestamp(),
      assignedBy: contractorId,
      status: "active",
      shiftType: "morning", // Default shift
    };
    batch.set(driverAssignmentRef, driverAssignment);

    // Update vehicle assignment
    const vehicleRef = doc(db, "vehicles", vehicleId);
    batch.update(vehicleRef, {
      driverId,
      status: "assigned",
      updatedAt: serverTimestamp(),
    });

    // Update driver with assigned vehicle
    const driverRef = doc(db, "users", driverId);
    batch.update(driverRef, {
      assignedVehicleId: vehicleId,
      assignedFeederPointIds: feederPointIds,
      contractorId: contractorId,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    console.log("✅ [TEST] Vehicle assignment completed successfully");

    // Verify the assignment was saved
    console.log("🔍 [TEST] Verifying assignment...");
    const updatedDriverDoc = await getDoc(doc(db, "users", driverId));
    if (updatedDriverDoc.exists()) {
      const updatedDriverData = updatedDriverDoc.data();
      console.log("📋 [TEST] Driver data after assignment:", {
        assignedVehicleId: updatedDriverData.assignedVehicleId,
        assignedFeederPointIds: updatedDriverData.assignedFeederPointIds,
        contractorId: updatedDriverData.contractorId
      });
    }

  } catch (error) {
    console.error("❌ [TEST] Error assigning vehicle to driver:", error);
    throw error;
  }
}

async function runTest() {
  console.log('🧪 Testing assignment function...');

  try {
    // Use the data from our previous test
    const driverId = "2qYtT18kNYcTMsnDOqJPMpIYcsl1"; // chandel
    const contractorId = "T3Lf1NZBdBNlLtEK98nsirwcwbM2"; // Contractor
    const vehicleId = "M2YBKhQSeLYofhyce3pX"; // MH12BM2020 (available)
    const feederPointIds = ["ckkvQy6Z77ijqSXEUk5s"]; // Hms solaris

    console.log('📋 Test parameters:', {
      driverId,
      contractorId,
      vehicleId,
      feederPointIds
    });

    await testAssignVehicleToDriver(contractorId, vehicleId, driverId, feederPointIds);

    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
runTest();
