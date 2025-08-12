// Worker management types for Swachh Admin

export interface SwachhWorker {
  id: string;
  name: string;
  employeeId: string;
  phone: string;
  email?: string;
  address: string;
  joiningDate: Date;
  designation: string;
  department: string;
  supervisorId?: string; // ID of the Swachh Admin who manages this worker
  isActive: boolean;
  replacementDetails?: WorkerReplacement;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // UID of the admin who created this record
  lastModifiedBy: string; // UID of the admin who last modified this record
}

export interface WorkerReplacement {
  replacedWorkerId?: string; // ID of the worker being replaced
  replacementReason: string;
  replacementDate: Date;
  previousWorkerName?: string;
  notes?: string;
}

export interface WorkerFormData {
  name: string;
  employeeId: string;
  phone: string;
  email: string;
  address: string;
  joiningDate: Date;
  designation: string;
  department: string;
  isReplacement: boolean;
  replacedWorkerId?: string;
  replacementReason?: string;
  replacementNotes?: string;
}

// Predefined designations for Swachh workers
export const WORKER_DESIGNATIONS = [
  'Sweeper',
  'Sanitation Worker',
  'Waste Collector',
  'Street Cleaner',
  'Drain Cleaner',
  'Garbage Truck Driver',
  'Waste Segregation Worker',
  'Supervisor',
  'Team Leader',
  'Other'
];

// Predefined departments
export const WORKER_DEPARTMENTS = [
  'Street Cleaning',
  'Waste Collection',
  'Drain Maintenance',
  'Public Toilet Maintenance',
  'Waste Processing',
  'Vehicle Maintenance',
  'Administration',
  'Other'
];

// Worker status options
export const WORKER_STATUS_OPTIONS = [
  { label: 'Active', value: true, color: '#2E7D32' },
  { label: 'Inactive', value: false, color: '#d32f2f' }
];
