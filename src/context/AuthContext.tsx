import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, UserRole, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userWasSet, setUserWasSet] = useState(false); // Track if user was successfully set

  console.log('🚀 AuthProvider render - User:', user?.email, 'Loading:', loading);

  // Debug user state changes
  React.useEffect(() => {
    console.log('👤 User state changed in AuthProvider:', user?.email, 'Role:', user?.role);
  }, [user]);

  // Create user document in Firestore from approved signup request
  const createUserDocument = async (firebaseUser: FirebaseUser, email: string) => {
    console.log('📝 Ensuring user document exists for:', email);

    // Try to find approved signup request to infer role and name
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const existing = await getDoc(userDocRef);
      if (existing.exists()) {
        console.log('✅ User document already exists');
        return existing.data() as User;
      }

      // Fallback: create minimal user document with default role
      const minimalUser: User = {
        uid: firebaseUser.uid,
        email,
        role: UserRole.DRIVER, // default minimal role; can be updated by admin
        displayName: email.split('@')[0],
        createdAt: new Date()
      };

      await setDoc(userDocRef, minimalUser);
      console.log('✅ Minimal user document created');
      return minimalUser;
    } catch (error: any) {
      console.warn('🔥 Firestore write error while creating user doc:', error.message);
      return null;
    }
  };

  // Get user document from Firestore
  const getUserDocument = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    console.log('🔍 Getting user document for UID:', firebaseUser.uid);
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        console.log('✅ User document found in Firestore');
        return userDoc.data() as User;
      }
      console.log('📭 No user document found in Firestore');
      return null;
    } catch (error: any) {
      console.warn('🔥 Firestore read error:', {
        code: error.code,
        message: error.message,
        name: error.name
      });
      console.log('📭 Returning null due to Firestore error');
      // Return null so createUserDocument will be called
      return null;
    }
  };

  useEffect(() => {
    let authChangeCount = 0;
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        authChangeCount++;
        console.log(`🔥 Auth state changed #${authChangeCount}:`, firebaseUser?.email || 'No user');
        setLoading(true);

      if (firebaseUser && firebaseUser.email) {
        console.log('👤 Firebase user found:', firebaseUser.email);
        // Load user document from Firestore
        const existingUser = await getUserDocument(firebaseUser);
        if (existingUser) {
          console.log('🎯 Setting user data from Firestore:', existingUser);
          setUser(existingUser);
          setUserWasSet(true);
        } else {
          // Create minimal user doc if missing
          const created = await createUserDocument(firebaseUser, firebaseUser.email);
          if (created) {
            setUser(created);
            setUserWasSet(true);
          } else {
            // If we still don't have user data, force logout
            await signOut(auth);
            setUser(null);
            setError('User profile not found. Please contact admin.');
          }
        }
      } else {
        console.log('🚫 No firebase user');
        // Only reset user to null if no user was previously set (to prevent race conditions)
        if (!userWasSet) {
          console.log('🚫 Setting user to null (no previous user)');
          setUser(null);
        } else {
          console.log('⚠️ Ignoring null user state (user was previously set)');
        }
      }

        setLoading(false);
      },
      (error: any) => {
        // Error handler for onAuthStateChanged
        console.error('🔥 Auth state change error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        setError(`Authentication error: ${error.message}`);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);

      console.log('🔐 Login attempt started');
      console.log('📧 Raw email:', `"${email}"`);
      console.log('🔑 Raw password:', `"${password}"`);

      const normalizedEmail = email.toLowerCase().trim();
      console.log('📧 Normalized email:', `"${normalizedEmail}"`);

      // Try to sign in first
      try {
        console.log('🔐 Attempting to sign in:', normalizedEmail);
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
        console.log('✅ Sign in successful');
      } catch (signInError: any) {
        console.log('❌ Sign in failed:', signInError.code);
        // If user doesn't exist, create the account
        if (signInError.code === 'auth/user-not-found') {
          console.log('👤 Creating new user account...');
          await createUserWithEmailAndPassword(auth, normalizedEmail, password);
          console.log('✅ User account created');
          // Note: onAuthStateChanged will handle creating the user document
        } else if (signInError.code === 'auth/wrong-password') {
          throw new Error('Invalid password. Please try again.');
        } else if (signInError.code === 'auth/invalid-email') {
          throw new Error('Invalid email format. Please check your email.');
        } else {
          throw signInError;
        }
      }
    } catch (error: any) {
      console.log('❌ Login error:', error.message);
      setError(error.message || 'Login failed. Please try again.');
      throw error;
    } finally {
      console.log('🏁 Login process completed');
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setError(null);
      setUserWasSet(false); // Reset the flag when logging out
      await signOut(auth);
    } catch (error: any) {
      setError(error.message || 'Logout failed. Please try again.');
      throw error;
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    error,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
