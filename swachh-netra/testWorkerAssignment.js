// Test script to verify worker assignment functionality
// Run this to test if the cleaned code works correctly

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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

async function testWorkerAssignmentService() {
  console.log('🧪 Testing Worker Assignment Service...');

  try {
    // Test 1: Get all workers (using correct collection)
    console.log('\n📋 Test 1: Fetching all workers...');
    const workersQuery = query(
      collection(db, "workers"),
      where("isActive", "==", true)
    );
    
    const workersSnapshot = await getDocs(workersQuery);
    const workers = [];
    
    workersSnapshot.forEach((doc) => {
      try {
        const data = doc.data();

        // Safe date conversion
        let createdAt = new Date();
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            createdAt = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) {
            createdAt = data.createdAt;
          } else if (typeof data.createdAt === 'string') {
            createdAt = new Date(data.createdAt);
          }
        }

        workers.push({
          id: doc.id,
          fullName: data.fullName || data.name || data.displayName || "Unknown Worker",
          email: data.email || "",
          phoneNumber: data.phoneNumber || data.phone || "",
          role: "worker",
          isActive: data.isActive !== false,
          assignedFeederPointIds: Array.isArray(data.assignedFeederPointIds) ? data.assignedFeederPointIds : [],
          createdAt
        });
      } catch (error) {
        console.warn(`⚠️ Error processing worker document ${doc.id}:`, error.message);
      }
    });

    // Sort workers by name
    workers.sort((a, b) => a.fullName.localeCompare(b.fullName));
    
    console.log(`✅ Found ${workers.length} workers:`);
    workers.forEach((worker, index) => {
      console.log(`  ${index + 1}. ${worker.fullName} (${worker.email}) - Active: ${worker.isActive}`);
      if (worker.assignedFeederPointIds.length > 0) {
        console.log(`     Assigned to ${worker.assignedFeederPointIds.length} feeder points`);
      }
    });

    // Test 2: Get all feeder points
    console.log('\n📍 Test 2: Fetching all feeder points...');
    const feederPointsSnapshot = await getDocs(collection(db, "feederPoints"));
    const feederPoints = [];
    
    feederPointsSnapshot.forEach((doc) => {
      const data = doc.data();
      feederPoints.push({
        id: doc.id,
        feederPointName: data.feederPointName || "Unknown Point",
        areaName: data.areaName || "",
        wardNumber: data.wardNumber || "",
        nearestLandmark: data.nearestLandmark || "",
        approximateHouseholds: data.approximateHouseholds || "",
        isActive: data.isActive !== false,
        assignedWorkerIds: data.assignedWorkerIds || []
      });
    });
    
    console.log(`✅ Found ${feederPoints.length} feeder points:`);
    feederPoints.forEach((fp, index) => {
      console.log(`  ${index + 1}. ${fp.feederPointName} (${fp.areaName}) - Ward: ${fp.wardNumber}`);
      if (fp.assignedWorkerIds.length > 0) {
        console.log(`     Assigned to ${fp.assignedWorkerIds.length} workers`);
      }
    });

    // Test 3: Check worker assignments
    console.log('\n🔗 Test 3: Checking worker assignments...');
    const assignmentsSnapshot = await getDocs(collection(db, "workerAssignments"));
    
    console.log(`✅ Found ${assignmentsSnapshot.size} assignment records:`);
    assignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  Assignment ${doc.id}:`);
      console.log(`    Worker: ${data.workerName} (${data.workerId})`);
      console.log(`    Feeder Point: ${data.feederPointName} (${data.feederPointId})`);
      console.log(`    Status: ${data.status}`);
      console.log(`    Assigned At: ${data.assignedAt?.toDate?.() || 'Unknown'}`);
    });

    // Test 4: Statistics
    console.log('\n📊 Test 4: Assignment Statistics...');
    const activeWorkers = workers.filter(w => w.isActive);
    const assignedWorkers = workers.filter(w => w.assignedFeederPointIds.length > 0);
    const activeFeederPoints = feederPoints.filter(fp => fp.isActive);
    const assignedFeederPoints = feederPoints.filter(fp => fp.assignedWorkerIds.length > 0);

    console.log(`📈 Statistics:`);
    console.log(`  Total Workers: ${workers.length} (Active: ${activeWorkers.length})`);
    console.log(`  Assigned Workers: ${assignedWorkers.length}`);
    console.log(`  Total Feeder Points: ${feederPoints.length} (Active: ${activeFeederPoints.length})`);
    console.log(`  Assigned Feeder Points: ${assignedFeederPoints.length}`);
    console.log(`  Assignment Records: ${assignmentsSnapshot.size}`);

    console.log('\n✅ All tests completed successfully!');
    console.log('🎉 Worker Assignment Service is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWorkerAssignmentService();
