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
import { db } from '../config/firebase';
import { SwachhWorker, WorkerFormData } from '../types/worker';

export class WorkerService {
  // Add a new worker
  static async addWorker(
    formData: WorkerFormData, 
    adminId: string
  ): Promise<string> {
    try {
      // Check if employee ID already exists
      const existingWorkerQuery = query(
        collection(db, 'swachhWorkers'),
        where('employeeId', '==', formData.employeeId)
      );
      const existingSnapshot = await getDocs(existingWorkerQuery);
      
      if (!existingSnapshot.empty) {
        throw new Error('Employee ID already exists. Please use a different Employee ID.');
      }

      const workerId = `worker_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      const workerData: any = {
        name: formData.name.trim(),
        employeeId: formData.employeeId.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        joiningDate: serverTimestamp(),
        designation: formData.designation,
        department: formData.department,
        supervisorId: adminId,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: adminId,
        lastModifiedBy: adminId
      };

      // Only add email if provided
      if (formData.email.trim()) {
        workerData.email = formData.email.trim();
      }

      // Only add replacement details if it's a replacement
      if (formData.isReplacement && formData.replacedWorkerId) {
        workerData.replacementDetails = {
          replacedWorkerId: formData.replacedWorkerId,
          replacementReason: formData.replacementReason || '',
          replacementDate: serverTimestamp(),
          notes: formData.replacementNotes || ''
        };
      }

      // Save to Firebase
      await setDoc(doc(db, 'swachhWorkers', workerId), workerData);

      console.log('✅ Worker added successfully');
      return workerId;
    } catch (error: any) {
      console.error('❌ Error adding worker:', error);
      throw new Error(error.message || 'Failed to add worker');
    }
  }

  // Get all workers for a specific admin
  static async getWorkersByAdmin(adminId: string): Promise<SwachhWorker[]> {
    try {
      // Simple query without orderBy to avoid index issues
      const workersQuery = query(
        collection(db, 'swachhWorkers'),
        where('supervisorId', '==', adminId)
      );

      const snapshot = await getDocs(workersQuery);
      const workers: SwachhWorker[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        workers.push({
          id: doc.id,
          ...data,
          joiningDate: data.joiningDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as SwachhWorker);
      });

      // Sort in memory by createdAt descending
      workers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return workers;
    } catch (error: any) {
      console.error('❌ Error fetching workers:', error);
      throw new Error('Failed to fetch workers');
    }
  }

  // Get all active workers for a specific admin
  static async getActiveWorkersByAdmin(adminId: string): Promise<SwachhWorker[]> {
    try {
      // Get all workers first, then filter active ones in memory
      const allWorkers = await this.getWorkersByAdmin(adminId);
      return allWorkers.filter(worker => worker.isActive);
    } catch (error: any) {
      console.error('❌ Error fetching active workers:', error);
      throw new Error('Failed to fetch active workers');
    }
  }

  // Update worker details
  static async updateWorker(
    workerId: string, 
    updateData: Partial<WorkerFormData>, 
    adminId: string
  ): Promise<void> {
    try {
      const updateFields: any = {
        ...updateData,
        updatedAt: serverTimestamp(),
        lastModifiedBy: adminId
      };

      // Remove undefined fields
      Object.keys(updateFields).forEach(key => {
        if (updateFields[key] === undefined) {
          delete updateFields[key];
        }
      });

      await updateDoc(doc(db, 'swachhWorkers', workerId), updateFields);
      console.log('✅ Worker updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating worker:', error);
      throw new Error('Failed to update worker');
    }
  }

  // Toggle worker active status
  static async toggleWorkerStatus(
    workerId: string, 
    isActive: boolean, 
    adminId: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'swachhWorkers', workerId), {
        isActive,
        updatedAt: serverTimestamp(),
        lastModifiedBy: adminId
      });
      
      console.log(`✅ Worker status updated to ${isActive ? 'active' : 'inactive'}`);
    } catch (error: any) {
      console.error('❌ Error updating worker status:', error);
      throw new Error('Failed to update worker status');
    }
  }

  // Delete worker
  static async deleteWorker(workerId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'swachhWorkers', workerId));
      console.log('✅ Worker deleted successfully');
    } catch (error: any) {
      console.error('❌ Error deleting worker:', error);
      throw new Error('Failed to delete worker');
    }
  }

  // Get worker by ID
  static async getWorkerById(workerId: string): Promise<SwachhWorker | null> {
    try {
      const workerDoc = await getDoc(doc(db, 'swachhWorkers', workerId));
      
      if (!workerDoc.exists()) {
        return null;
      }

      const data = workerDoc.data();
      return {
        id: workerDoc.id,
        ...data,
        joiningDate: data.joiningDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as SwachhWorker;
    } catch (error: any) {
      console.error('❌ Error fetching worker:', error);
      throw new Error('Failed to fetch worker');
    }
  }

  // Validate worker form data
  static validateWorkerForm(formData: WorkerFormData): { [key: string]: string } {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }

    if (!formData.employeeId.trim()) {
      errors.employeeId = 'Employee ID is required';
    } else if (formData.employeeId.trim().length < 3) {
      errors.employeeId = 'Employee ID must be at least 3 characters long';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!this.validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (formData.email && !this.validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }

    if (!formData.designation) {
      errors.designation = 'Designation is required';
    }

    if (!formData.department) {
      errors.department = 'Department is required';
    }

    if (formData.isReplacement) {
      if (!formData.replacedWorkerId) {
        errors.replacedWorkerId = 'Please select the worker being replaced';
      }
      if (!formData.replacementReason?.trim()) {
        errors.replacementReason = 'Replacement reason is required';
      }
    }

    return errors;
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }
}
