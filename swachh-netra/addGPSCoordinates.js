const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, collection, getDocs } = require('firebase/firestore');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Validate environment variables
const requiredEnvVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID'
];

console.log('🔍 Checking environment variables...');
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing environment variable: ${envVar}`);
    process.exit(1);
  }
}
console.log('✅ All required environment variables found');

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addGPSCoordinates() {
  try {
    console.log('🗺️ Fetching feeder points from database and adding GPS coordinates...');

    // Validate Firebase configuration
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error('Firebase configuration is missing. Please check your .env file.');
    }

    console.log(`🔗 Connected to Firebase project: ${firebaseConfig.projectId}`);

    // Fetch all feeder points from the database
    const feederPointsRef = collection(db, "feederPoints");
    const querySnapshot = await getDocs(feederPointsRef);

    if (querySnapshot.empty) {
      console.log('⚠️ No feeder points found in the database');
      return;
    }

    console.log(`📍 Found ${querySnapshot.size} feeder points in the database`);

    // Base coordinates for Udaipur area
    const baseLatitude = 24.5854;
    const baseLongitude = 73.7125;

    // Array to store coordinate assignments
    const coordinateAssignments = [];
    let index = 0;

    // Process each feeder point
    for (const docSnapshot of querySnapshot.docs) {
      const feederPointData = docSnapshot.data();
      const feederPointId = docSnapshot.id;

      // Generate slightly different coordinates for each feeder point
      // This spreads them around Udaipur area with realistic distances
      const latOffset = (Math.random() - 0.5) * 0.02; // ~1km variation
      const lngOffset = (Math.random() - 0.5) * 0.02; // ~1km variation

      const coordinates = {
        latitude: baseLatitude + latOffset,
        longitude: baseLongitude + lngOffset,
        accuracy: Math.floor(Math.random() * 15) + 5 // 5-20 meters accuracy
      };

      // Update the feeder point with GPS coordinates
      await updateDoc(doc(db, "feederPoints", feederPointId), {
        gpsCoordinates: coordinates,
        updatedAt: new Date()
      });

      coordinateAssignments.push({
        id: feederPointId,
        name: feederPointData.feederPointName || 'Unnamed',
        area: feederPointData.areaName || 'Unknown Area',
        coordinates: coordinates
      });

      console.log(`✅ Added GPS coordinates to "${feederPointData.feederPointName || 'Unnamed'}" (${feederPointId})`);
      index++;
    }

    // Display summary
    console.log('\n📍 GPS Coordinates Summary:');
    coordinateAssignments.forEach((assignment, idx) => {
      console.log(`  ${idx + 1}. ${assignment.name} (${assignment.area})`);
      console.log(`     📍 ${assignment.coordinates.latitude.toFixed(6)}, ${assignment.coordinates.longitude.toFixed(6)}`);
      console.log(`     🎯 Accuracy: ${assignment.coordinates.accuracy}m`);
      console.log(`     🆔 ID: ${assignment.id}`);
      console.log('');
    });

    console.log('\n🎯 Testing Instructions:');
    console.log('  1. Use a GPS spoofing app to set your location near these coordinates');
    console.log('  2. Test the proximity checking (100m threshold)');
    console.log('  3. Try starting a trip when within/outside the range');
    console.log('  4. All coordinates are in the Udaipur area for realistic testing');

    console.log(`\n✅ GPS coordinates added successfully to ${coordinateAssignments.length} feeder points!`);

  } catch (error) {
    console.error('❌ Error adding GPS coordinates:', error);
    if (error.message.includes('Firebase configuration')) {
      console.error('💡 Make sure your .env file contains all required Firebase configuration variables');
    }
  }
}

addGPSCoordinates();
