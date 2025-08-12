import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { SignupRequest, SignupFormData, UserRole } from '../types/auth';

export class SignupService {
  // Submit a new signup request
  static async submitSignupRequest(formData: SignupFormData): Promise<string> {
    try {
      // Check if email already exists in requests
      const existingRequestQuery = query(
        collection(db, 'signupRequests'),
        where('email', '==', formData.email.toLowerCase().trim())
      );
      const existingRequests = await getDocs(existingRequestQuery);
      
      if (!existingRequests.empty) {
        // Check if there's a pending request
        const pendingRequest = existingRequests.docs.find(
          doc => doc.data().status === 'pending'
        );
        if (pendingRequest) {
          throw new Error('A signup request with this email is already pending review.');
        }
      }

      const requestId = `signup_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      const signupRequest: Omit<SignupRequest, 'id'> = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
        requestedRole: formData.requestedRole,
        organization: formData.organization.trim(),
        department: formData.department.trim(),
        reason: formData.reason.trim(),
        password: formData.password,
        status: 'pending',
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to Firebase
      await setDoc(doc(db, 'signupRequests', requestId), {
        ...signupRequest,
        id: requestId,
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Signup request submitted successfully');
      return requestId;
    } catch (error: any) {
      console.error('❌ Error submitting signup request:', error);
      if (error.message.includes('already pending')) {
        throw error;
      }
      throw new Error('Failed to submit signup request. Please try again.');
    }
  }

  // Get all signup requests (for admin use)
  static async getAllSignupRequests(): Promise<SignupRequest[]> {
    try {
      const requestsQuery = query(
        collection(db, 'signupRequests'),
        orderBy('submittedAt', 'desc')
      );
      const snapshot = await getDocs(requestsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SignupRequest[];
    } catch (error) {
      console.error('❌ Error fetching signup requests:', error);
      throw new Error('Failed to fetch signup requests');
    }
  }

  // Get pending signup requests
  static async getPendingSignupRequests(): Promise<SignupRequest[]> {
    try {
      const requestsQuery = query(
        collection(db, 'signupRequests'),
        where('status', '==', 'pending'),
        orderBy('submittedAt', 'desc')
      );
      const snapshot = await getDocs(requestsQuery);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SignupRequest[];
    } catch (error) {
      console.error('❌ Error fetching pending signup requests:', error);
      throw new Error('Failed to fetch pending signup requests');
    }
  }

  // Get approved signup requests
  static async getApprovedSignupRequests(): Promise<SignupRequest[]> {
    try {
      // Simple query without orderBy to avoid index issues
      const requestsQuery = query(
        collection(db, 'signupRequests'),
        where('status', '==', 'approved')
      );
      const snapshot = await getDocs(requestsQuery);

      const requests: SignupRequest[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as SignupRequest);
      });

      // Sort in memory by reviewedAt descending
      requests.sort((a, b) => {
        const dateA = a.reviewedAt ? a.reviewedAt.getTime() : 0;
        const dateB = b.reviewedAt ? b.reviewedAt.getTime() : 0;
        return dateB - dateA;
      });

      return requests;
    } catch (error) {
      console.error('❌ Error fetching approved signup requests:', error);
      throw new Error('Failed to fetch approved signup requests');
    }
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number (basic validation)
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  // Validate form data
  static validateSignupForm(formData: SignupFormData): { [key: string]: string } {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!this.validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!this.validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (!formData.organization.trim()) {
      errors.organization = 'Organization is required';
    }

    if (!formData.department.trim()) {
      errors.department = 'Department is required';
    }

    if (!formData.reason.trim()) {
      errors.reason = 'Reason for access is required';
    } else if (formData.reason.trim().length < 2) {
      errors.reason = 'Please provide a more detailed reason (at least 10 characters)';
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    return errors;
  }

  // Approve a signup request and create user account
  static async approveSignupRequest(
    requestId: string,
    reviewedBy: string,
    reviewComments?: string
  ): Promise<void> {
    try {
      // Get the signup request by document ID
      const requestDoc = await getDoc(doc(db, 'signupRequests', requestId));

      if (!requestDoc.exists()) {
        throw new Error('Signup request not found');
      }

      const requestData = requestDoc.data() as SignupRequest;

      if (requestData.status !== 'pending') {
        throw new Error('Request has already been processed');
      }

      // Create Firebase Auth user with the password they provided (or default if not provided)
      const passwordToUse = requestData.password || 'qwerty';
      let userCredential: any;

      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          requestData.email,
          passwordToUse
        );
        console.log('✅ Firebase Auth user created successfully');
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          console.log('⚠️ Email already in use, user account already exists');
          // For existing users, we'll create a dummy user object
          userCredential = {
            user: {
              uid: `existing_${Date.now()}`, // Temporary UID for existing users
              email: requestData.email
            }
          };
        } else {
          throw authError; // Re-throw other auth errors
        }
      }

      const userDoc = {
        uid: userCredential.user.uid,
        email: requestData.email,
        role: requestData.requestedRole,
        displayName: requestData.name,
        description: this.getRoleDescription(requestData.requestedRole),
        dashboardColor: this.getRoleColor(requestData.requestedRole),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        lastLogin: null
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);

      // Update the signup request status
      await updateDoc(doc(db, 'signupRequests', requestId), {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy,
        reviewComments: reviewComments || 'Request approved',
        updatedAt: serverTimestamp()
      });

      console.log('✅ Signup request approved and user created');
    } catch (error: any) {
      console.error('❌ Error approving signup request:', error);
      throw new Error(error.message || 'Failed to approve signup request');
    }
  }

  // Reject a signup request (delete it)
  static async rejectSignupRequest(
    requestId: string,
    reviewedBy: string,
    reviewComments: string
  ): Promise<void> {
    try {
      // Delete the rejected request from database
      await deleteDoc(doc(db, 'signupRequests', requestId));

      console.log('✅ Signup request rejected and deleted');
    } catch (error: any) {
      console.error('❌ Error rejecting signup request:', error);
      throw new Error('Failed to reject signup request');
    }
  }

  // Get role description
  static getRoleDescription(role: UserRole): string {
    switch (role) {
      case UserRole.VEHICLE_OWNER:
        return 'Manage fleet operations and vehicle assignments';
      case UserRole.DRIVER:
        return 'Access route information and submit reports';
      case UserRole.SWATCH_ADMIN:
        return 'Oversee area management and compliance';
      case UserRole.ALL_ADMIN:
        return 'Full system access and management';
      default:
        return 'System user';
    }
  }

  // Get role color
  static getRoleColor(role: UserRole): string {
    switch (role) {
      case UserRole.VEHICLE_OWNER:
        return '#2E7D32';
      case UserRole.DRIVER:
        return '#1976D2';
      case UserRole.SWATCH_ADMIN:
        return '#FF6F00';
      case UserRole.ALL_ADMIN:
        return '#7B1FA2';
      default:
        return '#666';
    }
  }
}
