// Import Firebase v9 for Expo
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFIdrYsVPA-1S3UB-SQJUcu6H57f7jGqU",
  authDomain: "swachh-netra-3e12e.firebaseapp.com",
  projectId: "swachh-netra-3e12e",
  storageBucket: "swachh-netra-3e12e.firebasestorage.app",
  messagingSenderId: "697022376282",
  appId: "1:697022376282:web:9fb1df9dd06f2802072b63",
  measurementId: "G-HYRTCQH2P2"

};

// Initialize Firebase app
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth - Expo handles persistence automatically
const auth: Auth = getAuth(app);

// Initialize Firestore with error handling
let db: Firestore;
try {
  db = getFirestore(app);
  console.log('Firestore initialized successfully');

  // Note: We're not disabling the network to allow Firestore operations to work
  // The connection errors are expected when Firestore is not enabled in Firebase Console

} catch (error: any) {
  console.error('Firestore initialization failed:', error.message);
  // Create a dummy Firestore instance to prevent app crashes
  db = getFirestore(app);
}

// Log successful initialization
console.log('Firebase initialized successfully');

export { auth, db };
export default app;
