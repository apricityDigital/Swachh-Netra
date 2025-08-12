// Setup script to create predefined users in Firebase Authentication
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUH9LAcS34kyCO6UlEzVGsICZY9nkwUcw",
  authDomain: "watchsetu-project.firebaseapp.com",
  projectId: "watchsetu-project",
  storageBucket: "watchsetu-project.firebasestorage.app",
  messagingSenderId: "1071916263129",
  appId: "1:1071916263129:web:2aaf570b7f64b6400b00c8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// User roles enum
const UserRole = {
  VEHICLE_OWNER: 'vehicle_owner',
  DRIVER: 'driver',
  SWATCH_ADMIN: 'swatch_admin',
  ALL_ADMIN: 'all_admin'
};

// Predefined users
const PREDEFINED_USERS = {
  'vehicle@gmail.com': {
    role: UserRole.VEHICLE_OWNER,
    displayName: 'Vehicle Admin',
    description: 'Manage fleet operations and vehicle assignments',
    dashboardColor: '#2E7D32'
  },
  'driver@gmail.com': {
    role: UserRole.DRIVER,
    displayName: 'Driver',
    description: 'Access route information and submit reports',
    dashboardColor: '#1976D2'
  },
  'sadmin@gmail.com': {
    role: UserRole.SWATCH_ADMIN,
    displayName: 'Swatch Admin',
    description: 'Oversee area management and compliance',
    dashboardColor: '#FF6F00'
  },
  'admin@gmail.com': {
    role: UserRole.ALL_ADMIN,
    displayName: 'All Admin',
    description: 'Full system access and management',
    dashboardColor: '#7B1FA2'
  }
};

const COMMON_PASSWORD = 'qwerty';

async function createUser(email, userConfig) {
  try {
    console.log(`Creating user: ${email}`);

    // Try to create the user (only in Firebase Authentication)
    const userCredential = await createUserWithEmailAndPassword(auth, email, COMMON_PASSWORD);
    const firebaseUser = userCredential.user;

    console.log(`✅ Successfully created user: ${email} (UID: ${firebaseUser.uid})`);
    return true;

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️  User already exists: ${email}`);

      // Try to sign in to verify the user exists and works
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, COMMON_PASSWORD);
        console.log(`✅ Verified existing user: ${email} (UID: ${userCredential.user.uid})`);
        return true;
      } catch (signInError) {
        console.log(`❌ User exists but password doesn't match: ${email}`);
        console.log(`   Expected password: ${COMMON_PASSWORD}`);
        return false;
      }
    } else {
      console.error(`❌ Error creating user ${email}:`, error.message);
      return false;
    }
  }
}

async function setupAllUsers() {
  console.log('🚀 Starting Firebase user setup...\n');
  
  let successCount = 0;
  let totalCount = Object.keys(PREDEFINED_USERS).length;
  
  for (const [email, userConfig] of Object.entries(PREDEFINED_USERS)) {
    const success = await createUser(email, userConfig);
    if (success) successCount++;
    console.log(''); // Add spacing between users
  }
  
  console.log(`\n📊 Setup Summary:`);
  console.log(`✅ Successful: ${successCount}/${totalCount}`);
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 All users are ready! You can now login with:');
    Object.keys(PREDEFINED_USERS).forEach(email => {
      console.log(`   📧 ${email} / 🔑 ${COMMON_PASSWORD}`);
    });
  }
  
  process.exit(0);
}

// Run the setup
setupAllUsers().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
