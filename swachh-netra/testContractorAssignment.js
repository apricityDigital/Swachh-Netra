import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ",
  authDomain: "swachh-netra-3e12e.firebaseapp.com",
  projectId: "swachh-netra-3e12e",
  storageBucket: "swachh-netra-3e12e.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testContractorAssignment() {
  try {
    console.log('🧪 Testing Contractor Assignment Process...\n');

    const contractorId = "T3Lf1NZBdBNlLtEK98nsirwcwbM2"; // The contractor ID from logs
    const driverId = "2qYtT18kNYcTMsnDOqJPMpIYcsl1"; // chandel

    // 1. Check contractor's available data
    console.log('🏢 1. Checking Contractor Data:');
    
    // Check contractor's drivers
    const driversQuery = query(
      collection(db, "users"),
      where("role", "==", "driver"),
      where("contractorId", "==", contractorId)
    );
    const driversSnapshot = await getDocs(driversQuery);
    console.log(`  Drivers: ${driversSnapshot.size}`);
    
    driversSnapshot.forEach((doc) => {
      const data = doc.data();
      const driverName = data.fullName || data.displayName || data.name || "Unknown";
      console.log(`    - ${driverName} (${doc.id})`);
      console.log(`      Vehicle: ${data.assignedVehicleId || 'None'}`);
      console.log(`      Feeder Points: ${data.assignedFeederPointIds?.length || 0}`);
    });

    // Check contractor's vehicles
    const vehiclesQuery = query(
      collection(db, "vehicles"),
      where("contractorId", "==", contractorId)
    );
    const vehiclesSnapshot = await getDocs(vehiclesQuery);
    console.log(`\n  Vehicles: ${vehiclesSnapshot.size}`);
    
    vehiclesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`    - ${data.vehicleNumber} (${doc.id})`);
      console.log(`      Status: ${data.status}`);
      console.log(`      Driver: ${data.driverId || 'None'}`);
    });

    // Check contractor's feeder points
    const feederPointAssignmentsQuery = query(
      collection(db, "feederPointAssignments"),
      where("contractorId", "==", contractorId)
    );
    const fpAssignmentsSnapshot = await getDocs(feederPointAssignmentsQuery);
    console.log(`\n  Feeder Point Assignments: ${fpAssignmentsSnapshot.size}`);
    
    const contractorFeederPointIds = new Set();
    fpAssignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      contractorFeederPointIds.add(data.feederPointId);
      console.log(`    - FP: ${data.feederPointId}, Status: ${data.status}`);
    });

    // Get actual feeder point details
    console.log(`\n  Available Feeder Points for Assignment: ${contractorFeederPointIds.size}`);
    for (const fpId of contractorFeederPointIds) {
      const fpDoc = await getDoc(doc(db, "feederPoints", fpId));
      if (fpDoc.exists()) {
        const fpData = fpDoc.data();
        console.log(`    - ${fpId}: ${fpData.feederPointName} (${fpData.areaName})`);
      }
    }

    // 2. Check current assignment state
    console.log('\n📋 2. Current Assignment State:');
    
    // Check driver assignments
    const driverAssignmentsQuery = query(
      collection(db, "driverAssignments"),
      where("contractorId", "==", contractorId),
      where("status", "==", "active")
    );
    const driverAssignmentsSnapshot = await getDocs(driverAssignmentsQuery);
    console.log(`  Active Driver Assignments: ${driverAssignmentsSnapshot.size}`);
    
    driverAssignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`    Assignment ${doc.id}:`);
      console.log(`      Driver: ${data.driverId}`);
      console.log(`      Vehicle: ${data.vehicleId}`);
      console.log(`      Feeder Points: ${JSON.stringify(data.feederPointIds)}`);
      console.log(`      Assigned At: ${data.assignedAt?.toDate()}`);
    });

    // 3. Check what happens when contractor tries to assign
    console.log('\n🔄 3. Assignment Process Analysis:');
    
    // Check if the assignment flow would work
    const testDriverDoc = await getDoc(doc(db, "users", driverId));
    if (testDriverDoc.exists()) {
      const driverData = testDriverDoc.data();
      console.log(`  Target Driver: ${driverData.fullName || driverData.displayName || driverData.name}`);
      console.log(`  Current Contractor: ${driverData.contractorId}`);
      console.log(`  Current Vehicle: ${driverData.assignedVehicleId || 'None'}`);
      console.log(`  Current Feeder Points: ${JSON.stringify(driverData.assignedFeederPointIds || [])}`);
      
      if (driverData.contractorId !== contractorId) {
        console.log(`  ⚠️ WARNING: Driver belongs to different contractor!`);
        console.log(`    Driver's contractor: ${driverData.contractorId}`);
        console.log(`    Trying to assign from: ${contractorId}`);
      }
    }

    // 4. Check assignment permissions
    console.log('\n🔐 4. Assignment Permissions Check:');
    
    // Check if contractor can assign this driver
    const contractorDriversQuery = query(
      collection(db, "users"),
      where("role", "==", "driver"),
      where("contractorId", "==", contractorId)
    );
    const contractorDriversSnapshot = await getDocs(contractorDriversQuery);
    
    let canAssignDriver = false;
    contractorDriversSnapshot.forEach((doc) => {
      if (doc.id === driverId) {
        canAssignDriver = true;
      }
    });
    
    console.log(`  Can assign driver ${driverId}: ${canAssignDriver ? '✅' : '❌'}`);
    
    if (!canAssignDriver) {
      console.log(`  🔧 Issue: Driver is not assigned to this contractor`);
      console.log(`  💡 Solution: Driver needs to be assigned to contractor first`);
    }

    // 5. Simulate assignment process
    console.log('\n🎯 5. Assignment Process Simulation:');
    
    if (canAssignDriver && vehiclesSnapshot.size > 0 && contractorFeederPointIds.size > 0) {
      const testVehicle = vehiclesSnapshot.docs[0].data();
      const testFeederPoint = Array.from(contractorFeederPointIds)[0];
      
      console.log(`  Simulating assignment:`);
      console.log(`    Driver: ${driverId}`);
      console.log(`    Vehicle: ${testVehicle.vehicleNumber} (${vehiclesSnapshot.docs[0].id})`);
      console.log(`    Feeder Point: ${testFeederPoint}`);
      console.log(`    Contractor: ${contractorId}`);
      
      console.log(`\n  Assignment would call:`);
      console.log(`    ContractorService.assignVehicleToDriver(`);
      console.log(`      contractorId: "${contractorId}",`);
      console.log(`      vehicleId: "${vehiclesSnapshot.docs[0].id}",`);
      console.log(`      driverId: "${driverId}",`);
      console.log(`      feederPointIds: ["${testFeederPoint}"]`);
      console.log(`    )`);
      
      console.log(`\n  ✅ Assignment should work!`);
    } else {
      console.log(`  ❌ Assignment cannot proceed:`);
      console.log(`    Can assign driver: ${canAssignDriver}`);
      console.log(`    Has vehicles: ${vehiclesSnapshot.size > 0}`);
      console.log(`    Has feeder points: ${contractorFeederPointIds.size > 0}`);
    }

    console.log('\n🎯 6. Troubleshooting Steps:');
    console.log('  1. Make sure driver is assigned to the contractor');
    console.log('  2. Make sure contractor has available vehicles');
    console.log('  3. Make sure contractor has assigned feeder points');
    console.log('  4. Check console logs during assignment for errors');
    console.log('  5. Verify ContractorService.assignVehicleToDriver is being called');

    console.log('\n✅ Contractor assignment testing completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testContractorAssignment();
