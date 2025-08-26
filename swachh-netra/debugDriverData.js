import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

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

async function debugDriverData() {
  try {
    console.log('🔍 Debugging Driver Data Issues...\n');

    // 1. Check all drivers and their field names
    console.log('📋 1. Checking all drivers in users collection...');
    const driversQuery = query(
      collection(db, "users"),
      where("role", "==", "driver")
    );
    const driversSnapshot = await getDocs(driversQuery);
    
    console.log(`✅ Found ${driversSnapshot.size} drivers:`);
    driversSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\n  Driver ID: ${doc.id}`);
      console.log(`  Available fields:`, Object.keys(data));
      console.log(`  - fullName: "${data.fullName || 'MISSING'}"`);
      console.log(`  - displayName: "${data.displayName || 'MISSING'}"`);
      console.log(`  - name: "${data.name || 'MISSING'}"`);
      console.log(`  - email: "${data.email || 'MISSING'}"`);
      console.log(`  - contractorId: "${data.contractorId || 'MISSING'}"`);
      console.log(`  - assignedFeederPointIds: ${JSON.stringify(data.assignedFeederPointIds || [])}`);
    });

    // 2. Check daily assignments
    console.log('\n📅 2. Checking daily assignments...');
    const dailyAssignmentsSnapshot = await getDocs(collection(db, "dailyAssignments"));
    
    console.log(`✅ Found ${dailyAssignmentsSnapshot.size} daily assignments:`);
    dailyAssignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\n  Assignment ID: ${doc.id}`);
      console.log(`  - driverId: "${data.driverId || 'MISSING'}"`);
      console.log(`  - assignmentDate: "${data.assignmentDate || 'MISSING'}"`);
      console.log(`  - feederPointIds: ${JSON.stringify(data.feederPointIds || [])}`);
      console.log(`  - status: "${data.status || 'MISSING'}"`);
      console.log(`  - createdAt: ${data.createdAt?.toDate() || 'MISSING'}`);
    });

    // 3. Check vehicle assignments
    console.log('\n🚗 3. Checking vehicle assignments...');
    const vehicleAssignmentsSnapshot = await getDocs(collection(db, "vehicleAssignments"));
    
    console.log(`✅ Found ${vehicleAssignmentsSnapshot.size} vehicle assignments:`);
    vehicleAssignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\n  Assignment ID: ${doc.id}`);
      console.log(`  - driverId: "${data.driverId || 'MISSING'}"`);
      console.log(`  - vehicleId: "${data.vehicleId || 'MISSING'}"`);
      console.log(`  - contractorId: "${data.contractorId || 'MISSING'}"`);
      console.log(`  - status: "${data.status || 'MISSING'}"`);
    });

    // 4. Check feeder point assignments
    console.log('\n📍 4. Checking feeder point assignments...');
    const feederPointAssignmentsSnapshot = await getDocs(collection(db, "feederPointAssignments"));
    
    console.log(`✅ Found ${feederPointAssignmentsSnapshot.size} feeder point assignments:`);
    feederPointAssignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\n  Assignment ID: ${doc.id}`);
      console.log(`  - driverId: "${data.driverId || 'MISSING'}"`);
      console.log(`  - feederPointId: "${data.feederPointId || 'MISSING'}"`);
      console.log(`  - contractorId: "${data.contractorId || 'MISSING'}"`);
      console.log(`  - status: "${data.status || 'MISSING'}"`);
    });

    // 5. Today's date check
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n📅 5. Today's date: ${today}`);
    
    // Check if there are any assignments for today
    const todayAssignmentsQuery = query(
      collection(db, "dailyAssignments"),
      where("assignmentDate", "==", today)
    );
    const todayAssignmentsSnapshot = await getDocs(todayAssignmentsQuery);
    console.log(`✅ Assignments for today (${today}): ${todayAssignmentsSnapshot.size}`);

    console.log('\n🎯 Issues Identified:');
    
    // Check for missing driver names
    let driversWithMissingNames = 0;
    driversSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.fullName && !data.displayName && !data.name) {
        driversWithMissingNames++;
      }
    });
    
    if (driversWithMissingNames > 0) {
      console.log(`  ❌ ${driversWithMissingNames} drivers have missing names`);
    } else {
      console.log(`  ✅ All drivers have names`);
    }
    
    // Check for missing daily assignments
    if (dailyAssignmentsSnapshot.size === 0) {
      console.log(`  ❌ No daily assignments found - this explains the "No assignment found" error`);
    } else {
      console.log(`  ✅ Daily assignments exist`);
    }
    
    // Check for today's assignments
    if (todayAssignmentsSnapshot.size === 0) {
      console.log(`  ❌ No assignments for today (${today}) - drivers won't see feeder points`);
    } else {
      console.log(`  ✅ Assignments exist for today`);
    }

    console.log('\n✅ Debug completed!');
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

debugDriverData();
