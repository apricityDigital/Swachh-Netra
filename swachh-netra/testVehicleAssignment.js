// Test script to create sample vehicle assignments
// Run this to test the vehicle assignment functionality

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

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

async function createTestVehicleAssignments() {
  console.log('🚗 Creating test vehicle assignments...');

  try {
    // First, let's check what vehicles exist
    console.log('📋 Checking existing vehicles...');
    const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
    console.log(`Found ${vehiclesSnapshot.size} vehicles`);

    const vehicles = [];
    vehiclesSnapshot.forEach((doc) => {
      vehicles.push({ id: doc.id, ...doc.data() });
    });

    if (vehicles.length === 0) {
      console.log('❌ No vehicles found. Please create some vehicles first.');
      return;
    }

    // Check existing users to find contractors
    console.log('👥 Checking existing users...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`Found ${usersSnapshot.size} users`);

    const contractors = [];
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.role === 'transport_contractor') {
        contractors.push({ id: doc.id, ...userData });
      }
    });

    if (contractors.length === 0) {
      console.log('❌ No contractors found. Please create some contractor users first.');
      return;
    }

    console.log(`Found ${contractors.length} contractors:`, contractors.map(c => c.fullName));

    // Create test assignments
    const assignmentsToCreate = Math.min(vehicles.length, contractors.length * 2); // Max 2 vehicles per contractor
    
    for (let i = 0; i < assignmentsToCreate; i++) {
      const vehicle = vehicles[i];
      const contractor = contractors[i % contractors.length];

      const assignmentData = {
        vehicleId: vehicle.id,
        assignedTo: contractor.id,
        assignedBy: "admin",
        assignmentType: "admin_to_contractor",
        status: "active",
        assignedAt: new Date(),
        notes: `Test assignment for ${contractor.fullName}`
      };

      try {
        const docRef = await addDoc(collection(db, 'vehicleAssignments'), assignmentData);
        console.log(`✅ Created assignment ${docRef.id}: Vehicle ${vehicle.vehicleNumber} → ${contractor.fullName}`);
      } catch (error) {
        console.error(`❌ Failed to create assignment for vehicle ${vehicle.vehicleNumber}:`, error);
      }
    }

    // Verify assignments
    console.log('🔍 Verifying created assignments...');
    const assignmentsSnapshot = await getDocs(collection(db, 'vehicleAssignments'));
    console.log(`Total assignments in database: ${assignmentsSnapshot.size}`);

    assignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  Assignment ${doc.id}: Vehicle ${data.vehicleId} → Contractor ${data.assignedTo} (${data.status})`);
    });

    console.log('🎉 Test vehicle assignments created successfully!');

  } catch (error) {
    console.error('❌ Error creating test assignments:', error);
  }
}

// Run the test
createTestVehicleAssignments();
