// Test Firestore connection after enabling database
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCUH9LAcS34kyCO6UlEzVGsICZY9nkwUcw",
  authDomain: "watchsetu-project.firebaseapp.com",
  projectId: "watchsetu-project",
  storageBucket: "watchsetu-project.firebasestorage.app",
  messagingSenderId: "1071916263129",
  appId: "1:1071916263129:web:2aaf570b7f64b6400b00c8"
};

async function testFirestore() {
  try {
    console.log('🔥 Testing Firestore connection...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Test writing a signup request
    console.log('📝 Testing signup request creation...');
    const testRequest = {
      id: `test_${Date.now()}`,
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      requestedRole: 'driver',
      organization: 'Test Org',
      department: 'Test Dept',
      reason: 'Testing the signup system',
      status: 'pending',
      submittedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'signupRequests'), testRequest);
    console.log('✅ Test signup request created with ID:', docRef.id);
    
    // Test reading signup requests
    console.log('📖 Testing signup request retrieval...');
    const snapshot = await getDocs(collection(db, 'signupRequests'));
    console.log('✅ Found', snapshot.size, 'signup requests');
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${data.name} (${data.email}) - ${data.status}`);
    });
    
    console.log('🎉 Firestore is working perfectly!');
    console.log('🚀 Your signup system is ready to use!');
    
  } catch (error) {
    console.error('❌ Firestore test failed:', error.message);
    if (error.code === 'permission-denied') {
      console.log('💡 Make sure Firestore security rules allow access');
    } else if (error.code === 'not-found') {
      console.log('💡 Make sure Firestore database is created in Firebase Console');
    }
  }
}

testFirestore();
