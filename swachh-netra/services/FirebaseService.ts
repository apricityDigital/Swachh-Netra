import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
// TODO: Add Firebase Storage and Realtime Database imports when needed
// import { ref, set, get, update, remove, onValue, off, push, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
// import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../FirebaseConfig';

// Types
export interface UserData {
  uid: string;
  email: string;
  fullName: string;
  role: 'admin' | 'contractor' | 'driver' | 'swachh_hr';
  phoneNumber?: string;
  address?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin?: Timestamp;
  deviceInfo?: {
    deviceId: string;
    platform: string;
    version: string;
  };
  ipAddresses?: string[];
  // Role-specific fields
  contractorId?: string; // For drivers - which contractor they belong to
  assignedVehicleId?: string; // For drivers - assigned vehicle
  assignedFeederPointIds?: string[]; // For drivers - assigned feeder points
  companyName?: string; // For contractors
  licenseNumber?: string; // For contractors
  serviceAreas?: string[]; // For contractors
}

export interface ReportData {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  images?: string[];
  reportedBy: string;
  assignedTo?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
}

export interface VehicleData {
  id: string;
  vehicleNumber: string;
  type: 'truck' | 'van' | 'compactor' | 'tipper';
  capacity: number;
  driverId?: string;
  contractorId: string;
  status: 'active' | 'maintenance' | 'inactive';
  location?: {
    latitude: number;
    longitude: number;
    timestamp: Timestamp;
  };
  fuelLevel?: number;
  maintenanceSchedule?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RouteData {
  id: string;
  name: string;
  description: string;
  waypoints: Array<{
    latitude: number;
    longitude: number;
    address: string;
    estimatedTime: number;
  }>;
  assignedVehicleId?: string;
  assignedDriverId?: string;
  status: 'active' | 'completed' | 'paused';
  estimatedDuration: number;
  actualDuration?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

class FirebaseService {
  // Authentication Methods
  async signUp(email: string, password: string, userData: Partial<UserData>) {
    try {
      const userCredential = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
      const user = userCredential.user;

      // Update profile
      await updateProfile(user, {
        displayName: userData.fullName
      });

      // Save user data to Firestore
      const userDocData: UserData = {
        uid: user.uid,
        email: user.email!,
        fullName: userData.fullName!,
        role: userData.role!,
        phoneNumber: userData.phoneNumber,
        address: userData.address,
        isActive: true,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        deviceInfo: userData.deviceInfo,
        ipAddresses: userData.ipAddresses || []
      };

      await setDoc(doc(FIRESTORE_DB, 'users', user.uid), userDocData);

      return { user, userData: userDocData };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string, deviceInfo?: any) {
    try {
      const userCredential = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
      const user = userCredential.user;

      // Update last login and device info
      await updateDoc(doc(FIRESTORE_DB, 'users', user.uid), {
        lastLogin: serverTimestamp(),
        deviceInfo: deviceInfo,
        updatedAt: serverTimestamp()
      });

      return user;
    } catch (error) {
      console.error('Signin error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await signOut(FIREBASE_AUTH);
    } catch (error) {
      console.error('Signout error:', error);
      throw error;
    }
  }

  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(FIREBASE_AUTH, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // User Management
  async getUserData(uid: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', uid));
      return userDoc.exists() ? userDoc.data() as UserData : null;
    } catch (error) {
      console.error('Get user data error:', error);
      throw error;
    }
  }

  async updateUserData(uid: string, data: Partial<UserData>) {
    try {
      await updateDoc(doc(FIRESTORE_DB, 'users', uid), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Update user data error:', error);
      throw error;
    }
  }

  async getAllUsers(role?: string): Promise<UserData[]> {
    try {
      let querySnapshot;
      if (role) {
        const q = query(collection(FIRESTORE_DB, 'users'), where('role', '==', role));
        querySnapshot = await getDocs(q);
      } else {
        querySnapshot = await getDocs(collection(FIRESTORE_DB, 'users'));
      }
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as UserData));
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  // Real-time listeners
  subscribeToUserUpdates(uid: string, callback: (userData: UserData | null) => void) {
    const unsubscribe = onSnapshot(
      doc(FIRESTORE_DB, 'users', uid),
      (doc) => {
        callback(doc.exists() ? doc.data() as UserData : null);
      },
      (error) => {
        console.error('User subscription error:', error);
        callback(null);
      }
    );
    return unsubscribe;
  }

  subscribeToReports(callback: (reports: ReportData[]) => void, filters?: any) {
    let q = query(collection(FIRESTORE_DB, 'reports'), orderBy('createdAt', 'desc'));

    if (filters) {
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.assignedTo) {
        q = query(q, where('assignedTo', '==', filters.assignedTo));
      }
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const reports = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ReportData));
        callback(reports);
      },
      (error) => {
        console.error('Reports subscription error:', error);
        callback([]);
      }
    );
    return unsubscribe;
  }

  // Report Management
  async createReport(reportData: Omit<ReportData, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = doc(collection(FIRESTORE_DB, 'reports'));
      const report: ReportData = {
        ...reportData,
        id: docRef.id,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };
      await setDoc(docRef, report);
      return report;
    } catch (error) {
      console.error('Create report error:', error);
      throw error;
    }
  }

  async updateReport(reportId: string, data: Partial<ReportData>) {
    try {
      await updateDoc(doc(FIRESTORE_DB, 'reports', reportId), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Update report error:', error);
      throw error;
    }
  }

  async deleteReport(reportId: string) {
    try {
      await deleteDoc(doc(FIRESTORE_DB, 'reports', reportId));
    } catch (error) {
      console.error('Delete report error:', error);
      throw error;
    }
  }

  // Image Upload - TODO: Add Firebase Storage configuration
  async uploadImage(imageUri: string, path: string): Promise<string> {
    try {
      // TODO: Implement Firebase Storage upload
      console.warn('Image upload not implemented - Firebase Storage not configured');
      return 'placeholder-image-url';
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  async deleteImage(imagePath: string) {
    try {
      // TODO: Implement Firebase Storage delete
      console.warn('Image delete not implemented - Firebase Storage not configured');
    } catch (error) {
      console.error('Image delete error:', error);
      throw error;
    }
  }

  // Real-time location tracking - TODO: Add Firebase Realtime Database configuration
  async updateVehicleLocation(vehicleId: string, location: { latitude: number; longitude: number }) {
    try {
      // TODO: Implement Realtime Database location tracking
      console.warn('Location tracking not implemented - Firebase Realtime Database not configured');
    } catch (error) {
      console.error('Update vehicle location error:', error);
      throw error;
    }
  }

  subscribeToVehicleLocation(vehicleId: string, callback: (location: any) => void) {
    // TODO: Implement Realtime Database subscription
    console.warn('Location subscription not implemented - Firebase Realtime Database not configured');
    return () => { }; // Return empty unsubscribe function
  }

  // Batch operations
  async batchUpdateUsers(updates: Array<{ uid: string; data: Partial<UserData> }>) {
    try {
      const batch = writeBatch(FIRESTORE_DB);
      updates.forEach(({ uid, data }) => {
        const userRef = doc(FIRESTORE_DB, 'users', uid);
        batch.update(userRef, { ...data, updatedAt: serverTimestamp() });
      });
      await batch.commit();
    } catch (error) {
      console.error('Batch update users error:', error);
      throw error;
    }
  }

  // Analytics and Statistics
  async getAnalytics() {
    try {
      const [usersSnapshot, reportsSnapshot, vehiclesSnapshot] = await Promise.all([
        getDocs(collection(FIRESTORE_DB, 'users')),
        getDocs(collection(FIRESTORE_DB, 'reports')),
        getDocs(collection(FIRESTORE_DB, 'vehicles'))
      ]);

      const users = usersSnapshot.docs.map(doc => doc.data() as UserData);
      const reports = reportsSnapshot.docs.map(doc => doc.data() as ReportData);
      const vehicles = vehiclesSnapshot.docs.map(doc => doc.data() as VehicleData);

      return {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        usersByRole: {
          admin: users.filter(u => u.role === 'admin').length,
          contractor: users.filter(u => u.role === 'contractor').length,
          driver: users.filter(u => u.role === 'driver').length,
          swachh_hr: users.filter(u => u.role === 'swachh_hr').length
        },
        totalReports: reports.length,
        reportsByStatus: {
          pending: reports.filter(r => r.status === 'pending').length,
          in_progress: reports.filter(r => r.status === 'in_progress').length,
          resolved: reports.filter(r => r.status === 'resolved').length,
          rejected: reports.filter(r => r.status === 'rejected').length
        },
        totalVehicles: vehicles.length,
        activeVehicles: vehicles.filter(v => v.status === 'active').length
      };
    } catch (error) {
      console.error('Get analytics error:', error);
      throw error;
    }
  }
}

export default new FirebaseService();
