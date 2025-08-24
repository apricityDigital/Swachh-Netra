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
import { FIRESTORE_DB } from '../FirebaseConfig';

export interface WorkerData {
    id?: string;
    fullName: string;
    zone: string;
    ward: string;
    kothi: string;
    feederPoint: string;
    shiftTiming: string;
    employeeId?: string; // Optional field
    aadhaarNumber: string; // Mandatory field
    isActive: boolean;
    createdAt: string;
    createdBy: string;
    updatedAt?: string;
    updatedBy?: string;
    approvedAt?: string;
    approvedBy?: string;
}

export interface WorkerApprovalRequest {
    id?: string;
    type: 'worker_add' | 'worker_edit' | 'worker_delete';
    workerId?: string;
    workerData?: WorkerData;
    originalData?: WorkerData;
    requestedAt: string;
    requestedBy: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedAt?: string;
    approvedBy?: string;
    rejectedAt?: string;
    rejectedBy?: string;
    reason?: string;
}

export class WorkerService {
    // Get all workers (only active ones by default)
    static async getAllWorkers(includeInactive: boolean = false): Promise<WorkerData[]> {
        try {
            let workersQuery;
            if (includeInactive) {
                // Get all workers including inactive ones
                workersQuery = query(
                    collection(FIRESTORE_DB, 'workers'),
                    orderBy('createdAt', 'desc')
                );
            } else {
                // Get only active workers
                workersQuery = query(
                    collection(FIRESTORE_DB, 'workers'),
                    where('isActive', '==', true),
                    orderBy('createdAt', 'desc')
                );
            }
            const workersSnapshot = await getDocs(workersQuery);
            return workersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as WorkerData[];
        } catch (error) {
            console.error('❌ Error fetching workers:', error);
            // Return empty array instead of throwing to prevent app crashes
            return [];
        }
    }

    // Get active workers only (same as getAllWorkers with default parameter)
    static async getActiveWorkers(): Promise<WorkerData[]> {
        return this.getAllWorkers(false);
    }

    // Get all workers including inactive ones (for admin use)
    static async getAllWorkersIncludingInactive(): Promise<WorkerData[]> {
        return this.getAllWorkers(true);
    }

    // Get worker by ID
    static async getWorkerById(workerId: string): Promise<WorkerData | null> {
        try {
            const workerDoc = await getDoc(doc(FIRESTORE_DB, 'workers', workerId));
            if (workerDoc.exists()) {
                return {
                    id: workerDoc.id,
                    ...workerDoc.data()
                } as WorkerData;
            }
            return null;
        } catch (error) {
            console.error('❌ Error fetching worker:', error);
            // Return null on error
            return null;
        }
    }

    // Create worker approval request
    static async createWorkerApprovalRequest(
        type: 'worker_add' | 'worker_edit' | 'worker_delete',
        requestedBy: string,
        workerData?: WorkerData,
        workerId?: string,
        originalData?: WorkerData
    ): Promise<string> {
        try {
            const requestData: Omit<WorkerApprovalRequest, 'id'> = {
                type,
                requestedBy,
                requestedAt: new Date().toISOString(),
                status: 'pending'
            };

            if (workerData) requestData.workerData = workerData;
            if (workerId) requestData.workerId = workerId;
            if (originalData) requestData.originalData = originalData;

            const docRef = await addDoc(collection(FIRESTORE_DB, 'workerApprovalRequests'), requestData);
            console.log('✅ Worker approval request created with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error creating worker approval request:', error);
            throw error;
        }
    }

    // Get all worker approval requests
    static async getWorkerApprovalRequests(): Promise<WorkerApprovalRequest[]> {
        try {
            const requestsQuery = query(
                collection(FIRESTORE_DB, 'workerApprovalRequests')
            );
            const requestsSnapshot = await getDocs(requestsQuery);
            const allRequests = requestsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as WorkerApprovalRequest[];

            // Sort by date in memory
            return allRequests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        } catch (error) {
            console.error('❌ Error fetching worker approval requests:', error);
            // Return empty array instead of throwing to prevent app crashes
            return [];
        }
    }

    // Get pending worker approval requests
    static async getPendingWorkerApprovalRequests(): Promise<WorkerApprovalRequest[]> {
        try {
            // First get all requests, then filter in memory to avoid composite index requirement
            const requestsQuery = query(
                collection(FIRESTORE_DB, 'workerApprovalRequests')
            );
            const requestsSnapshot = await getDocs(requestsQuery);
            const allRequests = requestsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as WorkerApprovalRequest[];

            // Filter for pending requests and sort by date
            return allRequests
                .filter(request => request.status === 'pending')
                .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        } catch (error) {
            console.error('❌ Error fetching pending worker approval requests:', error);
            // Return empty array instead of throwing to prevent app crashes
            return [];
        }
    }

    // Approve worker request
    static async approveWorkerRequest(requestId: string, approverId: string): Promise<void> {
        try {
            const requestDoc = await getDoc(doc(FIRESTORE_DB, 'workerApprovalRequests', requestId));
            if (!requestDoc.exists()) {
                throw new Error('Request not found');
            }

            const requestData = requestDoc.data() as WorkerApprovalRequest;

            // Execute the approved action
            switch (requestData.type) {
                case 'worker_add':
                    if (requestData.workerData) {
                        await this.createWorkerDirectly({
                            ...requestData.workerData,
                            approvedAt: new Date().toISOString(),
                            approvedBy: approverId
                        });
                    }
                    break;

                case 'worker_edit':
                    if (requestData.workerId && requestData.workerData) {
                        await this.updateWorkerDirectly(requestData.workerId, {
                            ...requestData.workerData,
                            updatedAt: new Date().toISOString(),
                            updatedBy: approverId
                        });
                    }
                    break;

                case 'worker_delete':
                    if (requestData.workerId) {
                        await this.deleteWorkerDirectly(requestData.workerId);
                    }
                    break;
            }

            // Update request status
            await updateDoc(doc(FIRESTORE_DB, 'workerApprovalRequests', requestId), {
                status: 'approved',
                approvedAt: new Date().toISOString(),
                approvedBy: approverId
            });

            console.log('✅ Worker request approved successfully');
        } catch (error) {
            console.error('❌ Error approving worker request:', error);
            throw error;
        }
    }

    // Reject worker request
    static async rejectWorkerRequest(requestId: string, rejectorId: string, reason?: string): Promise<void> {
        try {
            await updateDoc(doc(FIRESTORE_DB, 'workerApprovalRequests', requestId), {
                status: 'rejected',
                rejectedAt: new Date().toISOString(),
                rejectedBy: rejectorId,
                reason: reason || 'No reason provided'
            });
            console.log('✅ Worker request rejected successfully');
        } catch (error) {
            console.error('❌ Error rejecting worker request:', error);
            throw error;
        }
    }

    // Direct worker operations (used after approval)
    private static async createWorkerDirectly(workerData: WorkerData): Promise<string> {
        try {
            const docRef = await addDoc(collection(FIRESTORE_DB, 'workers'), workerData);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error creating worker directly:', error);
            throw error;
        }
    }

    private static async updateWorkerDirectly(workerId: string, updates: Partial<WorkerData>): Promise<void> {
        try {
            await updateDoc(doc(FIRESTORE_DB, 'workers', workerId), updates);
        } catch (error) {
            console.error('❌ Error updating worker directly:', error);
            throw error;
        }
    }

    private static async deleteWorkerDirectly(workerId: string): Promise<void> {
        try {
            // Hard delete - completely remove the worker document
            await deleteDoc(doc(FIRESTORE_DB, 'workers', workerId));
            console.log('✅ Worker deleted successfully');
        } catch (error) {
            console.error('❌ Error deleting worker directly:', error);
            throw error;
        }
    }

    // Bulk approve all pending requests
    static async bulkApproveAllRequests(approverId: string): Promise<void> {
        try {
            const pendingRequests = await this.getPendingWorkerApprovalRequests();
            
            for (const request of pendingRequests) {
                if (request.id) {
                    await this.approveWorkerRequest(request.id, approverId);
                }
            }
            
            console.log('✅ All pending worker requests approved successfully');
        } catch (error) {
            console.error('❌ Error bulk approving worker requests:', error);
            throw error;
        }
    }
}
