// Import the functions you need from the SDKs you need
import { initializeApp } from "././swachh-netra/node_modules/firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDFIdrYsVPA-1S3UB-SQJUcu6H57f7jGqU",
  authDomain: "swachh-netra-3e12e.firebaseapp.com",
  projectId: "swachh-netra-3e12e",
  storageBucket: "swachh-netra-3e12e.firebasestorage.app",
  messagingSenderId: "697022376282",
  appId: "1:697022376282:web:9fb1df9dd06f2802072b63",
  measurementId: "G-HYRTCQH2P2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const FIREBASE_APP = app;