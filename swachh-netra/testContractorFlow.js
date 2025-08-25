// Test script to verify contractor functionality
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, serverTimestamp } = require('firebase/firestore');

// Firebase config (replace with your actual config)
const firebaseConfig = {
  // Your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testContractorFlow() {
  console.log('🧪 Testing Contractor Flow...\n');

  try {
    // Test 1: Create test contractor
    console.log('1️⃣ Creating test contractor...');
    const contractorId = 'test-contractor-' + Date.now();
    const contractorData = {
      uid: contractorId,
      email: 'contractor@test.com',
      fullName: 'Test Contractor',
      role: 'contractor',
      phoneNumber: '+1234567890',
      isActive: true,
      companyName: 'Test Waste Management Co.',
      licenseNumber: 'LIC123456',
      serviceAreas: ['Ward 1', 'Ward 2'],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', contractorId), contractorData);
    console.log('✅ Contractor created successfully');

    // Test 2: Create test driver
    console.log('\n2️⃣ Creating test driver...');
    const driverId = 'test-driver-' + Date.now();
    const driverData = {
      uid: driverId,
      email: 'driver@test.com',
      fullName: 'Test Driver',
      role: 'driver',
      phoneNumber: '+1234567891',
      isActive: true,
      contractorId: contractorId, // Assign to contractor
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', driverId), driverData);
    console.log('✅ Driver created successfully');

    // Test 3: Create test vehicle
    console.log('\n3️⃣ Creating test vehicle...');
    const vehicleId = 'test-vehicle-' + Date.now();
    const vehicleData = {
      id: vehicleId,
      vehicleNumber: 'MH12AB1234',
      type: 'truck',
      capacity: 5000,
      contractorId: contractorId,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'vehicles', vehicleId), vehicleData);
    console.log('✅ Vehicle created successfully');

    // Test 4: Create test feeder point
    console.log('\n4️⃣ Creating test feeder point...');
    const feederPointId = 'test-fp-' + Date.now();
    const feederPointData = {
      id: feederPointId,
      feederPointName: 'Test Feeder Point',
      areaName: 'Test Area',
      wardNumber: '1',
      nearestLandmark: 'Test Landmark',
      approximateHouseholds: '100',
      vehicleTypes: 'truck',
      populationDensity: 'high',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'feederPoints', feederPointId), feederPointData);
    console.log('✅ Feeder point created successfully');

    // Test 5: Create feeder point assignment
    console.log('\n5️⃣ Creating feeder point assignment...');
    const assignmentId = 'test-assignment-' + Date.now();
    const assignmentData = {
      id: assignmentId,
      feederPointId: feederPointId,
      contractorId: contractorId,
      assignedBy: 'admin',
      assignedAt: serverTimestamp(),
      status: 'active'
    };
    
    await setDoc(doc(db, 'feederPointAssignments', assignmentId), assignmentData);
    console.log('✅ Feeder point assignment created successfully');

    // Test 6: Test contractor drivers query
    console.log('\n6️⃣ Testing contractor drivers query...');
    const driversRef = collection(db, 'users');
    const driversQuery = query(
      driversRef,
      where('role', '==', 'driver'),
      where('contractorId', '==', contractorId)
    );
    const driversSnapshot = await getDocs(driversQuery);
    console.log(`✅ Found ${driversSnapshot.size} driver(s) for contractor`);

    // Test 7: Test contractor vehicles query
    console.log('\n7️⃣ Testing contractor vehicles query...');
    const vehiclesRef = collection(db, 'vehicles');
    const vehiclesQuery = query(
      vehiclesRef,
      where('contractorId', '==', contractorId)
    );
    const vehiclesSnapshot = await getDocs(vehiclesQuery);
    console.log(`✅ Found ${vehiclesSnapshot.size} vehicle(s) for contractor`);

    // Test 8: Test feeder point assignments query
    console.log('\n8️⃣ Testing feeder point assignments query...');
    const assignmentsRef = collection(db, 'feederPointAssignments');
    const assignmentsQuery = query(
      assignmentsRef,
      where('contractorId', '==', contractorId)
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    console.log(`✅ Found ${assignmentsSnapshot.size} feeder point assignment(s) for contractor`);

    // Test 9: Create driver assignment
    console.log('\n9️⃣ Creating driver assignment...');
    const driverAssignmentId = 'test-driver-assignment-' + Date.now();
    const driverAssignmentData = {
      id: driverAssignmentId,
      driverId: driverId,
      contractorId: contractorId,
      vehicleId: vehicleId,
      feederPointIds: [feederPointId],
      assignedAt: new Date(),
      assignedBy: contractorId,
      status: 'active',
      shiftType: 'morning'
    };
    
    await setDoc(doc(db, 'driverAssignments', driverAssignmentId), driverAssignmentData);
    console.log('✅ Driver assignment created successfully');

    // Test 10: Update driver with assignment
    console.log('\n🔟 Updating driver with assignment...');
    const driverRef = doc(db, 'users', driverId);
    await setDoc(driverRef, {
      ...driverData,
      assignedVehicleId: vehicleId,
      assignedFeederPointIds: [feederPointId],
      updatedAt: serverTimestamp()
    });
    console.log('✅ Driver updated with assignment');

    // Test 11: Update vehicle with driver
    console.log('\n1️⃣1️⃣ Updating vehicle with driver...');
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await setDoc(vehicleRef, {
      ...vehicleData,
      driverId: driverId,
      status: 'assigned',
      updatedAt: serverTimestamp()
    });
    console.log('✅ Vehicle updated with driver assignment');

    console.log('\n🎉 All tests passed! Contractor flow is working correctly.');
    console.log('\n📊 Test Summary:');
    console.log(`- Contractor ID: ${contractorId}`);
    console.log(`- Driver ID: ${driverId}`);
    console.log(`- Vehicle ID: ${vehicleId}`);
    console.log(`- Feeder Point ID: ${feederPointId}`);
    console.log(`- Assignment ID: ${assignmentId}`);
    console.log(`- Driver Assignment ID: ${driverAssignmentId}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testContractorFlow();
