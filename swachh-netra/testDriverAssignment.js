// Test script to verify driver assignment functionality
// Run this to test if assignments are being saved correctly

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore';

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

async function testDriverAssignments() {
  console.log('🔍 Testing driver assignment data...');

  try {
    // Check the specific driver from your logs
    const driverId = "2qYtT18kNYcTMsnDOqJPMpIYcsl1";
    
    console.log(`\n👤 Checking driver: ${driverId}`);
    
    // Get driver document
    const driverDoc = await getDoc(doc(db, 'users', driverId));
    if (driverDoc.exists()) {
      const driverData = driverDoc.data();
      console.log('📋 Driver document data:', {
        fullName: driverData.fullName || driverData.displayName,
        email: driverData.email,
        role: driverData.role,
        contractorId: driverData.contractorId,
        assignedVehicleId: driverData.assignedVehicleId,
        assignedFeederPointIds: driverData.assignedFeederPointIds
      });
    } else {
      console.log('❌ Driver document not found');
      return;
    }

    // Check driverAssignments collection
    console.log('\n📋 Checking driverAssignments collection...');
    const assignmentsQuery = query(
      collection(db, 'driverAssignments'),
      where('driverId', '==', driverId)
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    
    console.log(`Found ${assignmentsSnapshot.size} assignments in driverAssignments collection:`);
    assignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  Assignment ${doc.id}:`, {
        vehicleId: data.vehicleId,
        contractorId: data.contractorId,
        feederPointIds: data.feederPointIds,
        status: data.status,
        assignedAt: data.assignedAt
      });
    });

    // Check all contractors
    console.log('\n🏢 Checking contractors...');
    const contractorsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'transport_contractor')
    );
    const contractorsSnapshot = await getDocs(contractorsQuery);
    
    console.log(`Found ${contractorsSnapshot.size} contractors:`);
    contractorsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  Contractor ${doc.id}: ${data.fullName || data.displayName} (${data.email})`);
    });

    // Check all vehicles
    console.log('\n🚗 Checking vehicles...');
    const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
    
    console.log(`Found ${vehiclesSnapshot.size} vehicles:`);
    vehiclesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  Vehicle ${doc.id}: ${data.vehicleNumber} - Driver: ${data.driverId || 'None'} - Status: ${data.status}`);
    });

    // Check feeder points
    console.log('\n📍 Checking feeder points...');
    const feederPointsSnapshot = await getDocs(collection(db, 'feederPoints'));
    
    console.log(`Found ${feederPointsSnapshot.size} feeder points:`);
    feederPointsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  Feeder Point ${doc.id}: ${data.feederPointName} (${data.areaName})`);
    });

    console.log('\n✅ Test completed!');

  } catch (error) {
    console.error('❌ Error testing assignments:', error);
  }
}

// Run the test
testDriverAssignments();
