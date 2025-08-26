import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';

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

async function testDriverDataRefresh() {
  try {
    console.log('🔄 Testing Driver Data Refresh System...\n');

    // 1. Check current driver assignments
    console.log('👤 1. Current Driver Assignments:');
    const driversQuery = query(
      collection(db, "users"),
      where("role", "==", "driver")
    );
    const driversSnapshot = await getDocs(driversQuery);
    
    const drivers = [];
    driversSnapshot.forEach((doc) => {
      const data = doc.data();
      drivers.push({
        id: doc.id,
        name: data.fullName || data.displayName || data.name || "Unknown Driver",
        email: data.email,
        contractorId: data.contractorId,
        assignedVehicleId: data.assignedVehicleId,
        assignedFeederPointIds: data.assignedFeederPointIds || []
      });
    });

    drivers.forEach(driver => {
      console.log(`  - ${driver.name} (${driver.id})`);
      console.log(`    Vehicle: ${driver.assignedVehicleId || 'None'}`);
      console.log(`    Feeder Points: ${driver.assignedFeederPointIds.length}`);
      console.log(`    Contractor: ${driver.contractorId || 'None'}`);
    });

    // 2. Check real-time listener collections
    console.log('\n📡 2. Real-time Listener Collections:');
    
    // Check driver assignments
    const driverAssignmentsSnapshot = await getDocs(collection(db, "driverAssignments"));
    console.log(`  - driverAssignments: ${driverAssignmentsSnapshot.size} records`);
    
    // Check vehicle assignments  
    const vehicleAssignmentsSnapshot = await getDocs(collection(db, "vehicleAssignments"));
    console.log(`  - vehicleAssignments: ${vehicleAssignmentsSnapshot.size} records`);
    
    // Check feeder point assignments
    const feederPointAssignmentsSnapshot = await getDocs(collection(db, "feederPointAssignments"));
    console.log(`  - feederPointAssignments: ${feederPointAssignmentsSnapshot.size} records`);
    
    // Check daily assignments
    const dailyAssignmentsSnapshot = await getDocs(collection(db, "dailyAssignments"));
    console.log(`  - dailyAssignments: ${dailyAssignmentsSnapshot.size} records`);

    // 3. Test assignment data for a specific driver
    const testDriverId = "2qYtT18kNYcTMsnDOqJPMpIYcsl1"; // chandel
    console.log(`\n🎯 3. Testing data for driver: ${testDriverId}`);
    
    // Check driver assignments for this driver
    const driverAssignmentsQuery = query(
      collection(db, "driverAssignments"),
      where("driverId", "==", testDriverId),
      where("status", "==", "active")
    );
    const driverAssignmentsForDriver = await getDocs(driverAssignmentsQuery);
    console.log(`  - Active driver assignments: ${driverAssignmentsForDriver.size}`);
    
    driverAssignmentsForDriver.forEach((doc) => {
      const data = doc.data();
      console.log(`    Assignment ${doc.id}:`);
      console.log(`      Vehicle: ${data.vehicleId}`);
      console.log(`      Feeder Points: ${data.feederPointIds?.length || 0}`);
      console.log(`      Contractor: ${data.contractorId}`);
    });

    // Check vehicle assignments for this driver
    const vehicleAssignmentsQuery = query(
      collection(db, "vehicleAssignments"),
      where("driverId", "==", testDriverId),
      where("status", "==", "active")
    );
    const vehicleAssignmentsForDriver = await getDocs(vehicleAssignmentsQuery);
    console.log(`  - Active vehicle assignments: ${vehicleAssignmentsForDriver.size}`);

    // Check feeder point assignments for this driver
    const feederPointAssignmentsQuery = query(
      collection(db, "feederPointAssignments"),
      where("driverId", "==", testDriverId),
      where("status", "==", "active")
    );
    const feederPointAssignmentsForDriver = await getDocs(feederPointAssignmentsQuery);
    console.log(`  - Active feeder point assignments: ${feederPointAssignmentsForDriver.size}`);

    // Check daily assignments for this driver
    const today = new Date().toISOString().split('T')[0];
    const dailyAssignmentsQuery = query(
      collection(db, "dailyAssignments"),
      where("driverId", "==", testDriverId),
      where("assignmentDate", "==", today)
    );
    const dailyAssignmentsForDriver = await getDocs(dailyAssignmentsQuery);
    console.log(`  - Daily assignments for today: ${dailyAssignmentsForDriver.size}`);

    // 4. Real-time update test recommendations
    console.log('\n🔧 4. Real-time Update System Status:');
    console.log('  ✅ Added listeners for:');
    console.log('    - users collection (driver profile changes)');
    console.log('    - tripRecords collection (trip changes)');
    console.log('    - dailyAssignments collection (daily assignment changes)');
    console.log('    - driverAssignments collection (contractor assignment changes) [NEW]');
    console.log('    - vehicleAssignments collection (vehicle assignment changes) [NEW]');
    console.log('    - feederPointAssignments collection (feeder point assignment changes) [NEW]');

    console.log('\n🧪 5. Testing Instructions:');
    console.log('  1. Open driver dashboard in app');
    console.log('  2. Note current vehicle and feeder points');
    console.log('  3. Go to contractor dashboard');
    console.log('  4. Change driver assignments (vehicle or feeder points)');
    console.log('  5. Return to driver dashboard');
    console.log('  6. Data should update automatically via real-time listeners');
    console.log('  7. If not, use pull-to-refresh or tap refresh button');

    console.log('\n🎯 6. Troubleshooting:');
    console.log('  - Check console logs for "📡 [DriverService] ... assignments changed, refreshing data..."');
    console.log('  - Look for "Updated: [time]" in driver dashboard header');
    console.log('  - Use force refresh button (refresh icon) in header');
    console.log('  - Pull down to refresh the entire dashboard');

    console.log('\n✅ Driver data refresh testing completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testDriverDataRefresh();
