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

async function testAssignmentData() {
  try {
    console.log('🧪 Testing Assignment Data...\n');

    // Test 1: Get workers and their assigned feeder points
    console.log('📋 Test 1: Checking workers and their assignments...');
    const workersQuery = query(
      collection(db, "workers"),
      where("isActive", "==", true)
    );
    const workersSnapshot = await getDocs(workersQuery);
    
    console.log(`✅ Found ${workersSnapshot.size} workers:`);
    workersSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${data.fullName || data.name || 'Unknown'} (${doc.id})`);
      console.log(`    Assigned Feeder Points: ${JSON.stringify(data.assignedFeederPointIds || [])}`);
    });

    // Test 2: Get feeder points and their assigned workers
    console.log('\n📍 Test 2: Checking feeder points and their assignments...');
    const feederPointsQuery = query(collection(db, "feederPoints"));
    const feederPointsSnapshot = await getDocs(feederPointsQuery);
    
    console.log(`✅ Found ${feederPointsSnapshot.size} feeder points:`);
    feederPointsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${data.feederPointName || data.name || 'Unknown'} (${doc.id})`);
      console.log(`    Assigned Workers: ${JSON.stringify(data.assignedWorkerIds || [])}`);
    });

    // Test 3: Check assignment records
    console.log('\n🔗 Test 3: Checking assignment records...');
    const assignmentsQuery = query(collection(db, "workerAssignments"));
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    
    console.log(`✅ Found ${assignmentsSnapshot.size} assignment records:`);
    assignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  - Worker: ${data.workerName} → Feeder Point: ${data.feederPointName}`);
      console.log(`    Status: ${data.status}, Shift: ${data.shiftType}`);
    });

    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testAssignmentData();
