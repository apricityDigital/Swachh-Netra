import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

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

async function addGPSCoordinates() {
  try {
    console.log('🗺️ Adding GPS coordinates to feeder points...');

    // Add GPS coordinates to "Hms solaris" feeder point
    // Using coordinates for a location in Udaipur (example coordinates)
    const hmsolarisId = "ckkvQy6Z77ijqSXEUk5s";
    await updateDoc(doc(db, "feederPoints", hmsolarisId), {
      gpsCoordinates: {
        latitude: 24.5854,  // Udaipur latitude
        longitude: 73.7125, // Udaipur longitude
        accuracy: 10
      },
      updatedAt: new Date()
    });

    console.log('✅ Added GPS coordinates to Hms solaris feeder point');

    // Add GPS coordinates to "Ramganj" feeder point
    const ramganjId = "2lo7dZ1q50O6gGqe0oKn";
    await updateDoc(doc(db, "feederPoints", ramganjId), {
      gpsCoordinates: {
        latitude: 24.5900,  // Slightly different coordinates
        longitude: 73.7200,
        accuracy: 10
      },
      updatedAt: new Date()
    });

    console.log('✅ Added GPS coordinates to Ramganj feeder point');

    // Add GPS coordinates to "K1 test" feeder point
    const k1testId = "lanGGn7HxuSgAvUswa5X";
    await updateDoc(doc(db, "feederPoints", k1testId), {
      gpsCoordinates: {
        latitude: 24.5800,  // Another location
        longitude: 73.7050,
        accuracy: 10
      },
      updatedAt: new Date()
    });

    console.log('✅ Added GPS coordinates to K1 test feeder point');

    console.log('\n📍 GPS Coordinates Summary:');
    console.log('  • Hms solaris: 24.5854, 73.7125');
    console.log('  • Ramganj: 24.5900, 73.7200');
    console.log('  • K1 test: 24.5800, 73.7050');

    console.log('\n🎯 Testing Instructions:');
    console.log('  1. Use a GPS spoofing app to set your location near these coordinates');
    console.log('  2. Test the proximity checking (100m threshold)');
    console.log('  3. Try starting a trip when within/outside the range');

    console.log('\n✅ GPS coordinates added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding GPS coordinates:', error);
  }
}

addGPSCoordinates();
