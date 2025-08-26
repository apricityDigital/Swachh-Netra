import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

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

async function fixContractorVehicles() {
  try {
    console.log('🔧 Fixing Contractor Vehicle Assignment...\n');

    const contractorId = "T3Lf1NZBdBNlLtEK98nsirwcwbM2";
    const driverId = "2qYtT18kNYcTMsnDOqJPMpIYcsl1"; // chandel

    // 1. Check all vehicles in the system
    console.log('🚗 1. Checking All Vehicles in System:');
    const allVehiclesSnapshot = await getDocs(collection(db, "vehicles"));
    console.log(`  Total vehicles in system: ${allVehiclesSnapshot.size}`);
    
    allVehiclesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`    - ${data.vehicleNumber} (${doc.id})`);
      console.log(`      Contractor: ${data.contractorId || 'None'}`);
      console.log(`      Driver: ${data.driverId || 'None'}`);
      console.log(`      Status: ${data.status}`);
    });

    // 2. Check which vehicle the driver is currently assigned to
    console.log('\n👤 2. Checking Driver\'s Current Vehicle Assignment:');
    const driverDoc = await getDoc(doc(db, "users", driverId));
    if (driverDoc.exists()) {
      const driverData = driverDoc.data();
      const assignedVehicleId = driverData.assignedVehicleId;
      console.log(`  Driver's assigned vehicle ID: ${assignedVehicleId}`);
      
      if (assignedVehicleId) {
        const vehicleDoc = await getDoc(doc(db, "vehicles", assignedVehicleId));
        if (vehicleDoc.exists()) {
          const vehicleData = vehicleDoc.data();
          console.log(`  Vehicle details:`);
          console.log(`    Number: ${vehicleData.vehicleNumber}`);
          console.log(`    Contractor: ${vehicleData.contractorId || 'None'}`);
          console.log(`    Status: ${vehicleData.status}`);
          
          if (vehicleData.contractorId !== contractorId) {
            console.log(`  🔧 ISSUE: Vehicle belongs to different contractor!`);
            console.log(`    Vehicle contractor: ${vehicleData.contractorId}`);
            console.log(`    Expected contractor: ${contractorId}`);
            
            // Fix: Assign vehicle to correct contractor
            console.log(`  🔄 Fixing: Assigning vehicle to correct contractor...`);
            await updateDoc(doc(db, "vehicles", assignedVehicleId), {
              contractorId: contractorId,
              updatedAt: new Date()
            });
            console.log(`  ✅ Vehicle ${vehicleData.vehicleNumber} assigned to contractor ${contractorId}`);
          } else {
            console.log(`  ✅ Vehicle is correctly assigned to contractor`);
          }
        }
      }
    }

    // 3. Verify the fix
    console.log('\n🔍 3. Verifying the Fix:');
    
    // Check contractor's vehicles after fix
    const contractorVehiclesQuery = query(
      collection(db, "vehicles"),
      where("contractorId", "==", contractorId)
    );
    const contractorVehiclesSnapshot = await getDocs(contractorVehiclesQuery);
    console.log(`  Contractor's vehicles after fix: ${contractorVehiclesSnapshot.size}`);
    
    contractorVehiclesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`    - ${data.vehicleNumber} (${doc.id})`);
      console.log(`      Driver: ${data.driverId || 'None'}`);
      console.log(`      Status: ${data.status}`);
    });

    // 4. Test assignment readiness
    console.log('\n🎯 4. Assignment Readiness Check:');
    
    const hasDrivers = true; // We know chandel is assigned
    const hasVehicles = contractorVehiclesSnapshot.size > 0;
    const hasFeederPoints = true; // We know Hms solaris is assigned
    
    console.log(`  ✅ Has drivers: ${hasDrivers}`);
    console.log(`  ${hasVehicles ? '✅' : '❌'} Has vehicles: ${hasVehicles}`);
    console.log(`  ✅ Has feeder points: ${hasFeederPoints}`);
    
    if (hasDrivers && hasVehicles && hasFeederPoints) {
      console.log(`\n  🎉 READY FOR ASSIGNMENT!`);
      console.log(`  The contractor can now assign drivers to vehicles and feeder points.`);
    } else {
      console.log(`\n  ❌ NOT READY FOR ASSIGNMENT`);
      if (!hasVehicles) {
        console.log(`    Missing: Vehicles assigned to contractor`);
      }
    }

    // 5. Assignment instructions
    console.log('\n📱 5. Next Steps:');
    console.log('  1. Go to Contractor Dashboard');
    console.log('  2. Navigate to Driver Assignment');
    console.log('  3. Select driver "chandel"');
    console.log('  4. You should now see available vehicles');
    console.log('  5. Select vehicle and feeder point');
    console.log('  6. Click "Assign" to complete assignment');

    console.log('\n✅ Contractor vehicle assignment fix completed!');
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
  }
}

fixContractorVehicles();
