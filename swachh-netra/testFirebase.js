// Simple Firebase connection test
import { FIREBASE_AUTH, FIRESTORE_DB } from './FirebaseConfig';

export const testFirebaseConnection = () => {
  console.log('Testing Firebase connection...');
  
  // Test Auth
  if (FIREBASE_AUTH) {
    console.log('✅ Firebase Auth initialized successfully');
    console.log('Auth instance:', FIREBASE_AUTH);
  } else {
    console.log('❌ Firebase Auth failed to initialize');
  }
  
  // Test Firestore
  if (FIRESTORE_DB) {
    console.log('✅ Firestore initialized successfully');
    console.log('Firestore instance:', FIRESTORE_DB);
  } else {
    console.log('❌ Firestore failed to initialize');
  }
  
  return {
    auth: !!FIREBASE_AUTH,
    firestore: !!FIRESTORE_DB
  };
};