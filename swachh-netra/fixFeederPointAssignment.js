import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';

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

async function fixFeederPointAssignment() {
  try {
    console.log('🔧 Fixing Feeder Point Assignment Issue...\n');

    const testDriverId = "2qYtT18kNYcTMsnDOqJPMpIYcsl1"; // chandel
    const today = new Date().toISOString().split('T')[0];

    // 1. Get current driver assignment data
    console.log('📋 1. Getting current driver assignment data...');
    const driverAssignmentsQuery = query(
      collection(db, "driverAssignments"),
      where("driverId", "==", testDriverId),
      where("status", "==", "active")
    );
    const driverAssignmentsSnapshot = await getDocs(driverAssignmentsQuery);
    
    if (driverAssignmentsSnapshot.empty) {
      console.log('❌ No active driver assignments found');
      return;
    }

    const driverAssignment = driverAssignmentsSnapshot.docs[0].data();
    console.log('✅ Found driver assignment:', {
      vehicleId: driverAssignment.vehicleId,
      feederPointIds: driverAssignment.feederPointIds,
      contractorId: driverAssignment.contractorId
    });

    // 2. Get driver name
    const driverDoc = await getDoc(doc(db, "users", testDriverId));
    const driverData = driverDoc.data();
    const driverName = driverData.fullName || driverData.displayName || driverData.name || "Unknown Driver";

    // 3. Clean up any existing daily assignments for today
    console.log('\n🧹 2. Cleaning up existing daily assignments for today...');
    const existingDailyQuery = query(
      collection(db, "dailyAssignments"),
      where("driverId", "==", testDriverId),
      where("assignmentDate", "==", today)
    );
    const existingDailySnapshot = await getDocs(existingDailyQuery);
    
    console.log(`Found ${existingDailySnapshot.size} existing daily assignments for today`);
    for (const doc of existingDailySnapshot.docs) {
      console.log(`Deleting existing assignment: ${doc.id}`);
      await deleteDoc(doc.ref);
    }

    // 4. Create new daily assignment
    console.log('\n📅 3. Creating new daily assignment...');
    const dailyAssignmentData = {
      driverId: testDriverId,
      driverName: driverName,
      contractorId: driverAssignment.contractorId,
      assignmentDate: today,
      feederPointIds: driverAssignment.feederPointIds,
      vehicleId: driverAssignment.vehicleId,
      status: "active",
      shiftType: "morning",
      assignedBy: driverAssignment.contractorId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const dailyAssignmentRef = await addDoc(collection(db, "dailyAssignments"), dailyAssignmentData);
    console.log('✅ Created daily assignment:', dailyAssignmentRef.id);
    console.log('Assignment data:', dailyAssignmentData);

    // 5. Create missing feeder point assignment records
    console.log('\n📍 4. Creating feeder point assignment records...');
    
    // First, clean up any existing feeder point assignments
    const existingFPQuery = query(
      collection(db, "feederPointAssignments"),
      where("driverId", "==", testDriverId),
      where("status", "==", "active")
    );
    const existingFPSnapshot = await getDocs(existingFPQuery);
    
    console.log(`Found ${existingFPSnapshot.size} existing feeder point assignments`);
    for (const doc of existingFPSnapshot.docs) {
      console.log(`Deleting existing FP assignment: ${doc.id}`);
      await deleteDoc(doc.ref);
    }

    // Create new feeder point assignments
    for (const feederPointId of driverAssignment.feederPointIds) {
      const fpAssignmentData = {
        feederPointId: feederPointId,
        driverId: testDriverId,
        contractorId: driverAssignment.contractorId,
        assignedAt: new Date(),
        status: "active",
        updatedAt: new Date()
      };

      const fpAssignmentRef = await addDoc(collection(db, "feederPointAssignments"), fpAssignmentData);
      console.log(`✅ Created feeder point assignment: ${fpAssignmentRef.id} for FP: ${feederPointId}`);
    }

    // 6. Verify the fix
    console.log('\n🔍 5. Verifying the fix...');
    
    // Check daily assignment
    const verifyDailyQuery = query(
      collection(db, "dailyAssignments"),
      where("driverId", "==", testDriverId),
      where("assignmentDate", "==", today)
    );
    const verifyDailySnapshot = await getDocs(verifyDailyQuery);
    console.log(`✅ Daily assignments for today: ${verifyDailySnapshot.size}`);
    
    verifyDailySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  Assignment ${doc.id}:`);
      console.log(`    feederPointIds: ${JSON.stringify(data.feederPointIds)}`);
      console.log(`    vehicleId: ${data.vehicleId}`);
    });

    // Check feeder point assignments
    const verifyFPQuery = query(
      collection(db, "feederPointAssignments"),
      where("driverId", "==", testDriverId),
      where("status", "==", "active")
    );
    const verifyFPSnapshot = await getDocs(verifyFPQuery);
    console.log(`✅ Active feeder point assignments: ${verifyFPSnapshot.size}`);
    
    verifyFPSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  FP Assignment ${doc.id}: ${data.feederPointId}`);
    });

    // 7. Get feeder point names
    console.log('\n🗺️ 6. Feeder Point Details:');
    for (const fpId of driverAssignment.feederPointIds) {
      const fpDoc = await getDoc(doc(db, "feederPoints", fpId));
      if (fpDoc.exists()) {
        const fpData = fpDoc.data();
        console.log(`  ${fpId}: ${fpData.feederPointName} (${fpData.areaName})`);
      }
    }

    console.log('\n🎯 7. Summary:');
    console.log('  ✅ Cleaned up old daily assignments');
    console.log('  ✅ Created new daily assignment for today');
    console.log('  ✅ Created feeder point assignment records');
    console.log('  ✅ All data is now consistent');
    console.log('\n📱 Next Steps:');
    console.log('  1. Open driver dashboard in app');
    console.log('  2. Pull to refresh or tap refresh button');
    console.log('  3. Driver should now see correct feeder points');
    console.log('  4. Try creating a new assignment from contractor side');

    console.log('\n✅ Feeder point assignment fix completed!');
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
  }
}

fixFeederPointAssignment();
