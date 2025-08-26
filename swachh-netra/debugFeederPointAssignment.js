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

async function debugFeederPointAssignment() {
  try {
    console.log('🔍 Debugging Feeder Point Assignment Issue...\n');

    const testDriverId = "2qYtT18kNYcTMsnDOqJPMpIYcsl1"; // chandel

    // 1. Check driver's current assignedFeederPointIds
    console.log('👤 1. Driver Profile Data:');
    const driverDoc = await getDoc(doc(db, "users", testDriverId));
    if (driverDoc.exists()) {
      const driverData = driverDoc.data();
      console.log(`  Driver: ${driverData.fullName || driverData.displayName || driverData.name}`);
      console.log(`  assignedVehicleId: ${driverData.assignedVehicleId || 'None'}`);
      console.log(`  assignedFeederPointIds: ${JSON.stringify(driverData.assignedFeederPointIds || [])}`);
      console.log(`  contractorId: ${driverData.contractorId || 'None'}`);
      console.log(`  updatedAt: ${driverData.updatedAt?.toDate() || 'None'}`);
    } else {
      console.log('  ❌ Driver not found');
      return;
    }

    // 2. Check driverAssignments collection
    console.log('\n📋 2. Driver Assignments Collection:');
    const driverAssignmentsQuery = query(
      collection(db, "driverAssignments"),
      where("driverId", "==", testDriverId),
      where("status", "==", "active")
    );
    const driverAssignmentsSnapshot = await getDocs(driverAssignmentsQuery);
    
    console.log(`  Found ${driverAssignmentsSnapshot.size} active driver assignments:`);
    driverAssignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`    Assignment ${doc.id}:`);
      console.log(`      vehicleId: ${data.vehicleId}`);
      console.log(`      feederPointIds: ${JSON.stringify(data.feederPointIds || [])}`);
      console.log(`      contractorId: ${data.contractorId}`);
      console.log(`      assignedAt: ${data.assignedAt?.toDate() || 'None'}`);
    });

    // 3. Check feederPointAssignments collection
    console.log('\n📍 3. Feeder Point Assignments Collection:');
    const feederPointAssignmentsQuery = query(
      collection(db, "feederPointAssignments"),
      where("driverId", "==", testDriverId),
      where("status", "==", "active")
    );
    const feederPointAssignmentsSnapshot = await getDocs(feederPointAssignmentsQuery);
    
    console.log(`  Found ${feederPointAssignmentsSnapshot.size} active feeder point assignments:`);
    feederPointAssignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`    Assignment ${doc.id}:`);
      console.log(`      feederPointId: ${data.feederPointId}`);
      console.log(`      driverId: ${data.driverId}`);
      console.log(`      contractorId: ${data.contractorId}`);
      console.log(`      assignedAt: ${data.assignedAt?.toDate() || 'None'}`);
    });

    // 4. Check dailyAssignments collection
    console.log('\n📅 4. Daily Assignments Collection:');
    const today = new Date().toISOString().split('T')[0];
    const dailyAssignmentsQuery = query(
      collection(db, "dailyAssignments"),
      where("driverId", "==", testDriverId),
      where("assignmentDate", "==", today)
    );
    const dailyAssignmentsSnapshot = await getDocs(dailyAssignmentsQuery);
    
    console.log(`  Found ${dailyAssignmentsSnapshot.size} daily assignments for today (${today}):`);
    dailyAssignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`    Assignment ${doc.id}:`);
      console.log(`      driverName: ${data.driverName}`);
      console.log(`      vehicleId: ${data.vehicleId}`);
      console.log(`      feederPointIds: ${JSON.stringify(data.feederPointIds || [])}`);
      console.log(`      assignmentDate: ${data.assignmentDate}`);
      console.log(`      createdAt: ${data.createdAt?.toDate() || 'None'}`);
    });

    // 5. Get actual feeder point details
    console.log('\n🗺️ 5. Feeder Point Details:');
    const driverData = driverDoc.data();
    const assignedFeederPointIds = driverData.assignedFeederPointIds || [];
    
    if (assignedFeederPointIds.length > 0) {
      for (const fpId of assignedFeederPointIds) {
        const feederPointDoc = await getDoc(doc(db, "feederPoints", fpId));
        if (feederPointDoc.exists()) {
          const fpData = feederPointDoc.data();
          console.log(`    Feeder Point ${fpId}:`);
          console.log(`      name: ${fpData.feederPointName || 'Unknown'}`);
          console.log(`      areaName: ${fpData.areaName || 'Unknown'}`);
          console.log(`      wardNumber: ${fpData.wardNumber || 'Unknown'}`);
        } else {
          console.log(`    ❌ Feeder Point ${fpId}: NOT FOUND`);
        }
      }
    } else {
      console.log('    No feeder points assigned in driver profile');
    }

    // 6. Check all feeder points to see what driver should see
    console.log('\n🔍 6. All Available Feeder Points:');
    const allFeederPointsSnapshot = await getDocs(collection(db, "feederPoints"));
    console.log(`  Total feeder points in system: ${allFeederPointsSnapshot.size}`);
    
    allFeederPointsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`    ${doc.id}: ${data.feederPointName || 'Unknown'} (${data.areaName || 'Unknown'})`);
    });

    // 7. Analysis and recommendations
    console.log('\n🎯 7. Analysis:');
    
    const driverProfileFPs = driverData.assignedFeederPointIds || [];
    let driverAssignmentFPs = [];
    let dailyAssignmentFPs = [];
    
    driverAssignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      driverAssignmentFPs = data.feederPointIds || [];
    });
    
    dailyAssignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      dailyAssignmentFPs = data.feederPointIds || [];
    });

    console.log('  Data Consistency Check:');
    console.log(`    Driver Profile FPs: ${JSON.stringify(driverProfileFPs)}`);
    console.log(`    Driver Assignment FPs: ${JSON.stringify(driverAssignmentFPs)}`);
    console.log(`    Daily Assignment FPs: ${JSON.stringify(dailyAssignmentFPs)}`);
    
    const profileMatch = JSON.stringify(driverProfileFPs) === JSON.stringify(driverAssignmentFPs);
    const dailyMatch = JSON.stringify(driverAssignmentFPs) === JSON.stringify(dailyAssignmentFPs);
    
    console.log(`    Profile ↔ Assignment Match: ${profileMatch ? '✅' : '❌'}`);
    console.log(`    Assignment ↔ Daily Match: ${dailyMatch ? '✅' : '❌'}`);

    if (!profileMatch) {
      console.log('  🔧 Issue: Driver profile and assignment data don\'t match');
      console.log('  💡 Solution: Need to sync driver profile with latest assignment');
    }
    
    if (!dailyMatch) {
      console.log('  🔧 Issue: Daily assignment doesn\'t match driver assignment');
      console.log('  💡 Solution: Need to create/update daily assignment');
    }

    console.log('\n✅ Feeder point assignment debugging completed!');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

debugFeederPointAssignment();
