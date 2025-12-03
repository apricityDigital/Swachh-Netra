// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import Constants from 'expo-constants';

// Get Firebase configuration from environment variables
// Using both process.env and Constants.expoConfig.extra as fallback
const getEnvVar = (key: string, fallbackKey?: string) => {
  return process.env[key] ||
    (fallbackKey ? Constants.expoConfig?.extra?.[fallbackKey] : undefined) ||
    (fallbackKey ? Constants.manifest?.extra?.[fallbackKey] : undefined);
};

// Firebase configuration
const firebaseConfig = {
  apiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY', 'firebaseApiKey') || 'AIzaSyDFIdrYsVPA-1S3UB-SQJUcu6H57f7jGqU',
  authDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', 'firebaseAuthDomain') || 'swachh-netra-3e12e.firebaseapp.com',
  projectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'firebaseProjectId') || 'swachh-netra-3e12e',
  storageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', 'firebaseStorageBucket') || 'swachh-netra-3e12e.firebasestorage.app',
  messagingSenderId: getEnvVar('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'firebaseMessagingSenderId') || '697022376282',
  appId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID', 'firebaseAppId') || '1:697022376282:web:9fb1df9dd06f2802072b63',
  measurementId: getEnvVar('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID', 'firebaseMeasurementId') || 'G-HYRTCQH2P2'
};

// Validate that we have the required configuration
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('Firebase configuration is incomplete:', firebaseConfig);
  throw new Error('Firebase configuration is missing required fields');
}

console.log('Firebase config loaded successfully:', {
  apiKey: firebaseConfig.apiKey ? '***' + firebaseConfig.apiKey.slice(-4) : 'missing',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const FIREBASE_APP = app;
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIRESTORE_DB = getFirestore(FIREBASE_APP);
