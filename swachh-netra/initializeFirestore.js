// Simple script to initialize Firestore collections with basic data
// Run this once to ensure collections exist and prevent query errors

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

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

async function initializeCollections() {
  console.log('🔄 Initializing Firestore collections...');

  try {
    // Check if collections exist by trying to read them
    const collections = [
      'vehicles',
      'vehicleAssignments', 
      'feederPoints',
      'feederPointAssignments',
      'users',
      'tripRecords',
      'workerAttendance'
    ];

    for (const collectionName of collections) {
      try {
        console.log(`📋 Checking collection: ${collectionName}`);
        const snapshot = await getDocs(collection(db, collectionName));
        console.log(`✅ Collection ${collectionName} exists with ${snapshot.size} documents`);
      } catch (error) {
        console.log(`⚠️  Collection ${collectionName} might not exist or has access issues:`, error.message);
        
        // Try to create a dummy document to initialize the collection
        try {
          await addDoc(collection(db, collectionName), {
            _initialized: true,
            createdAt: new Date(),
            note: 'Collection initialization document'
          });
          console.log(`✅ Initialized collection: ${collectionName}`);
        } catch (initError) {
          console.log(`❌ Failed to initialize collection ${collectionName}:`, initError.message);
        }
      }
    }

    console.log('🎉 Firestore initialization complete!');
    
  } catch (error) {
    console.error('❌ Error during initialization:', error);
  }
}

// Run the initialization
initializeCollections();
