import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../FirebaseConfig';

export interface ApprovalRequest {
    id?: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    password: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
    approver: string;
    approverType: 'admin' | 'contractor';
    approvedAt?: string;
    approvedBy?: string;
    rejectedAt?: string;
    rejectedBy?: string;
}

export interface User {
    uid: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    contractorId?: string;
    permissions?: any;
    approvedAt?: string;
    approvedBy?: string;
}

export class ApprovalService {
    // Create approval request
    static async createApprovalRequest(requestData: Omit<ApprovalRequest, 'id'>): Promise<string> {
        try {
            const docRef = await addDoc(collection(FIRESTORE_DB, 'approvalRequests'), {
                ...requestData,
                requestedAt: new Date().toISOString(),
                status: 'pending'
            });
            console.log('✅ Approval request created with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error creating approval request:', error);
            throw error;
        }
    }

    // Get pending approval requests for admin
    static async getAdminApprovalRequests(): Promise<ApprovalRequest[]> {
        try {
            const q = query(
                collection(FIRESTORE_DB, 'approvalRequests'),
                where('status', '==', 'pending'),
                where('approverType', '==', 'admin'),
                orderBy('requestedAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ApprovalRequest[];
        } catch (error) {
            console.error('❌ Error fetching admin approval requests:', error);
            throw error;
        }
    }

    // Get pending approval requests for contractor
    static async getContractorApprovalRequests(contractorId: string): Promise<ApprovalRequest[]> {
        try {
            const q = query(
                collection(FIRESTORE_DB, 'approvalRequests'),
                where('status', '==', 'pending'),
                where('approver', '==', contractorId),
                where('approverType', '==', 'contractor'),
                orderBy('requestedAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ApprovalRequest[];
        } catch (error) {
            console.error('❌ Error fetching contractor approval requests:', error);
            throw error;
        }
    }

    // Approve request and create user
    static async approveRequest(requestId: string, approverId: string): Promise<void> {
        try {
            // Get the approval request
            const requestDoc = await getDoc(doc(FIRESTORE_DB, 'approvalRequests', requestId));
            if (!requestDoc.exists()) {
                throw new Error('Approval request not found');
            }

            const requestData = requestDoc.data() as ApprovalRequest;

            // Create user account
            const userCredential = await createUserWithEmailAndPassword(
                FIREBASE_AUTH,
                requestData.email,
                requestData.password
            );

            const user = userCredential.user;

            // Prepare user data
            const userData: User = {
                uid: user.uid,
                fullName: requestData.fullName,
                email: requestData.email,
                phone: requestData.phone,
                role: requestData.role,
                isActive: true,
                createdAt: new Date().toISOString(),
                approvedAt: new Date().toISOString(),
                approvedBy: approverId,
                permissions: this.getRolePermissions(requestData.role)
            };

            // Add contractor assignment for drivers
            if (requestData.role === 'driver' && requestData.approver) {
                userData.contractorId = requestData.approver;
            }

            // Store user data
            await setDoc(doc(FIRESTORE_DB, 'users', user.uid), userData);

            // Update approval request status
            await updateDoc(doc(FIRESTORE_DB, 'approvalRequests', requestId), {
                status: 'approved',
                approvedAt: new Date().toISOString(),
                approvedBy: approverId
            });

            console.log('✅ Request approved and user created successfully');
        } catch (error) {
            console.error('❌ Error approving request:', error);
            throw error;
        }
    }

    // Reject request
    static async rejectRequest(requestId: string, rejectorId: string): Promise<void> {
        try {
            await updateDoc(doc(FIRESTORE_DB, 'approvalRequests', requestId), {
                status: 'rejected',
                rejectedAt: new Date().toISOString(),
                rejectedBy: rejectorId
            });
            console.log('✅ Request rejected successfully');
        } catch (error) {
            console.error('❌ Error rejecting request:', error);
            throw error;
        }
    }

    // Get all users
    static async getAllUsers(): Promise<User[]> {
        try {
            const q = query(
                collection(FIRESTORE_DB, 'users'),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];
        } catch (error) {
            console.error('❌ Error fetching users:', error);
            throw error;
        }
    }

    // Get users by role
    static async getUsersByRole(role: string): Promise<User[]> {
        try {
            const q = query(
                collection(FIRESTORE_DB, 'users'),
                where('role', '==', role),
                where('isActive', '==', true),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];
        } catch (error) {
            console.error('❌ Error fetching users by role:', error);
            throw error;
        }
    }

    // Get drivers by contractor
    static async getDriversByContractor(contractorId: string): Promise<User[]> {
        try {
            const q = query(
                collection(FIRESTORE_DB, 'users'),
                where('role', '==', 'driver'),
                where('contractorId', '==', contractorId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];
        } catch (error) {
            console.error('❌ Error fetching drivers by contractor:', error);
            throw error;
        }
    }

    // Update user status
    static async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
        try {
            await updateDoc(doc(FIRESTORE_DB, 'users', userId), {
                isActive,
                updatedAt: new Date().toISOString()
            });
            console.log('✅ User status updated successfully');
        } catch (error) {
            console.error('❌ Error updating user status:', error);
            throw error;
        }
    }

    // Get user statistics
    static async getUserStatistics(): Promise<any> {
        try {
            const users = await this.getAllUsers();
            const pendingRequests = await this.getAdminApprovalRequests();

            return {
                totalUsers: users.length,
                activeUsers: users.filter(u => u.isActive).length,
                drivers: users.filter(u => u.role === 'driver').length,
                contractors: users.filter(u => u.role === 'transport_contractor').length,
                swachhHR: users.filter(u => u.role === 'swachh_hr').length,
                admins: users.filter(u => u.role === 'admin').length,
                pendingApprovals: pendingRequests.length
            };
        } catch (error) {
            console.error('❌ Error getting user statistics:', error);
            throw error;
        }
    }

    // Get role permissions
    static getRolePermissions(role: string): any {
        switch (role) {
            case 'admin':
                return {
                    canManageUsers: true,
                    canViewAllReports: true,
                    canAssignTasks: true,
                    canGenerateReports: true,
                    canManageSystem: true,
                    canApproveRequests: true
                };
            case 'transport_contractor':
                return {
                    canManageDrivers: true,
                    canViewDriverReports: true,
                    canAssignRoutes: true,
                    canManageVehicles: true,
                    canApproveDrivers: true
                };
            case 'swachh_hr':
                return {
                    canManageWorkers: true,
                    canViewReports: true,
                    canAssignTasks: true,
                    canGenerateReports: true
                };
            case 'driver':
            default:
                return {
                    canSubmitReports: true,
                    canViewAssignedRoutes: true,
                    canUpdateStatus: true
                };
        }
    }

    // Initialize database collections (run once)
    static async initializeDatabase(): Promise<void> {
        try {
            // Create initial admin user if not exists
            const adminQuery = query(
                collection(FIRESTORE_DB, 'users'),
                where('role', '==', 'admin')
            );
            const adminSnapshot = await getDocs(adminQuery);

            if (adminSnapshot.empty) {
                console.log('🔧 Creating initial admin user...');
                // This would be done through the signup process with admin secret
            }

            console.log('✅ Database initialization completed');
        } catch (error) {
            console.error('❌ Error initializing database:', error);
            throw error;
        }
    }
}
