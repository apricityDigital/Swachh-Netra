import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, firestore } from '@config/firebase';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_PROJECT_ID } from '@env';
import { User, UserRole } from '../types/user';
import { SignUpData, AuthResult } from '../types/auth';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  userRole: UserRole | null;
  userData: User | null;
  loading: boolean;
  signUp: (userData: SignUpData) => Promise<AuthResult>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await firestore()
            .collection('users')
            .doc(authUser.uid)
            .get();
          
          if (userDoc.exists()) {
            const data = userDoc.data() as User;
            setUser(authUser);
            setUserRole(data.role);
            setUserData(data);
            
            console.log(`🔥 Connected to Swach Netra Firebase: ${FIREBASE_PROJECT_ID}`);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (signUpData: SignUpData): Promise<AuthResult> => {
    try {
      const { email, password, name, mobileNumber, role } = signUpData;
      
      // Create user account
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const userId = userCredential.user.uid;

      // Store user data in Firestore
      const newUserData: Partial<User> = {
        name,
        email,
        mobileNumber,
        role,
        createdAt: firestore.FieldValue.serverTimestamp(),
        emailVerified: false,
        projectId: FIREBASE_PROJECT_ID,
      };

      await firestore().collection('users').doc(userId).set(newUserData);

      // Send email verification
      await userCredential.user.sendEmailVerification();

      return { 
        success: true, 
        message: 'Account created successfully! Please verify your email to access Swach Netra.' 
      };
    } catch (error) {
      throw error;
    }
  };

  const signIn = async (
    email: string, 
    password: string, 
    rememberMe: boolean = false
  ): Promise<AuthResult> => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
      
      if (rememberMe) {
        await AsyncStorage.setItem('rememberMe', 'true');
        await AsyncStorage.setItem('userEmail', email);
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await auth().signOut();
      await AsyncStorage.removeItem('rememberMe');
      await AsyncStorage.removeItem('userEmail');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      await auth().sendPasswordResetEmail(email);
      return { 
        success: true, 
        message: 'Password reset email sent! Check your inbox.' 
      };
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userRole,
    userData,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
