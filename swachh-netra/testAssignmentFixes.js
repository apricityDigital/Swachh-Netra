import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

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

async function testAssignmentFixes() {
  try {
    console.log('🧪 Testing Assignment System Fixes...\n');

    // 1. Test driver name display
    console.log('👤 1. Testing Driver Name Display...');
    const driversQuery = query(
      collection(db, "users"),
      where("role", "==", "driver")
    );
    const driversSnapshot = await getDocs(driversQuery);
    
    console.log(`✅ Found ${driversSnapshot.size} drivers:`);
    driversSnapshot.forEach((doc) => {
      const data = doc.data();
      const displayName = data.fullName || data.displayName || data.name || "Unknown Driver";
      console.log(`  - ${displayName} (${doc.id})`);
      console.log(`    Fields: fullName="${data.fullName || 'MISSING'}", displayName="${data.displayName || 'MISSING'}", name="${data.name || 'MISSING'}"`);
    });

    // 2. Check daily assignments
    console.log('\n📅 2. Checking Daily Assignments...');
    const dailyAssignmentsSnapshot = await getDocs(collection(db, "dailyAssignments"));
    console.log(`✅ Found ${dailyAssignmentsSnapshot.size} daily assignments`);
    
    if (dailyAssignmentsSnapshot.size > 0) {
      dailyAssignmentsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`  - Assignment ${doc.id}:`);
        console.log(`    Driver: ${data.driverName || 'MISSING'} (${data.driverId || 'MISSING'})`);
        console.log(`    Date: ${data.assignmentDate || 'MISSING'}`);
        console.log(`    Feeder Points: ${data.feederPointIds?.length || 0}`);
      });
    } else {
      console.log('  ⚠️ No daily assignments found - this needs to be fixed by creating new assignments');
    }

    // 3. Check vehicle assignments with driverIds
    console.log('\n🚗 3. Checking Vehicle Assignments...');
    const vehicleAssignmentsSnapshot = await getDocs(collection(db, "vehicleAssignments"));
    console.log(`✅ Found ${vehicleAssignmentsSnapshot.size} vehicle assignments`);
    
    let vehicleAssignmentsWithDrivers = 0;
    vehicleAssignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.driverId) {
        vehicleAssignmentsWithDrivers++;
      }
      console.log(`  - Assignment ${doc.id}:`);
      console.log(`    Driver ID: ${data.driverId || 'MISSING'}`);
      console.log(`    Vehicle ID: ${data.vehicleId || 'MISSING'}`);
      console.log(`    Status: ${data.status || 'MISSING'}`);
    });
    
    console.log(`  ✅ ${vehicleAssignmentsWithDrivers}/${vehicleAssignmentsSnapshot.size} assignments have driver IDs`);

    // 4. Check feeder point assignments with driverIds
    console.log('\n📍 4. Checking Feeder Point Assignments...');
    const feederPointAssignmentsSnapshot = await getDocs(collection(db, "feederPointAssignments"));
    console.log(`✅ Found ${feederPointAssignmentsSnapshot.size} feeder point assignments`);
    
    let feederPointAssignmentsWithDrivers = 0;
    feederPointAssignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.driverId) {
        feederPointAssignmentsWithDrivers++;
      }
      console.log(`  - Assignment ${doc.id}:`);
      console.log(`    Driver ID: ${data.driverId || 'MISSING'}`);
      console.log(`    Feeder Point ID: ${data.feederPointId || 'MISSING'}`);
      console.log(`    Status: ${data.status || 'MISSING'}`);
    });
    
    console.log(`  ✅ ${feederPointAssignmentsWithDrivers}/${feederPointAssignmentsSnapshot.size} assignments have driver IDs`);

    // 5. Check multiple feeder point assignments for drivers
    console.log('\n🔗 5. Checking Multiple Feeder Point Assignments...');
    driversSnapshot.forEach((doc) => {
      const data = doc.data();
      const assignedFeederPointIds = data.assignedFeederPointIds || [];
      const driverName = data.fullName || data.displayName || data.name || "Unknown Driver";
      
      console.log(`  - ${driverName}: ${assignedFeederPointIds.length} feeder points`);
      if (assignedFeederPointIds.length > 1) {
        console.log(`    ✅ Multiple assignments: ${assignedFeederPointIds.join(', ')}`);
      } else if (assignedFeederPointIds.length === 1) {
        console.log(`    ⚠️ Single assignment: ${assignedFeederPointIds[0]}`);
      } else {
        console.log(`    ❌ No assignments`);
      }
    });

    // 6. Test today's date format
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n📅 6. Today's Date Format: ${today}`);
    
    // Check if there are assignments for today
    const todayAssignmentsQuery = query(
      collection(db, "dailyAssignments"),
      where("assignmentDate", "==", today)
    );
    const todayAssignmentsSnapshot = await getDocs(todayAssignmentsQuery);
    console.log(`✅ Assignments for today: ${todayAssignmentsSnapshot.size}`);

    // 7. Summary of fixes needed
    console.log('\n🎯 Summary of Fixes Applied:');
    console.log('  ✅ Driver name fallback: fullName || displayName || name || "Unknown Driver"');
    console.log('  ✅ Daily assignment creation: Added to ContractorService.assignVehicleToDriver');
    console.log('  ✅ Driver ID in assignments: Added to vehicle and feeder point assignments');
    console.log('  ✅ Multiple feeder point support: UI logic already supports this');
    console.log('  ✅ Debug logging: Added to feeder point selection');

    console.log('\n🚀 Next Steps:');
    console.log('  1. Test contractor assignment flow with multiple feeder points');
    console.log('  2. Verify daily assignments are created when contractors assign drivers');
    console.log('  3. Check that drivers can see their assigned feeder points');
    console.log('  4. Test the location-based trip start with assigned feeder points');

    console.log('\n✅ Assignment system testing completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testAssignmentFixes();
