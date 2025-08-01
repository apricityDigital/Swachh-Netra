// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBb5ED3dlxSltlbPpDBHEKntEPzrWvYycc",
  authDomain: "swachh-netra.firebaseapp.com",
  projectId: "swachh-netra",
  storageBucket: "swachh-netra.firebasestorage.app",
  messagingSenderId: "866927609653",
  appId: "1:866927609653:web:1946a358f1ab75a2042e7c",
  measurementId: "G-RR6521DQDL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);