export type UserRole = 'driver' | 'admin';

export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';

export type VehicleType = 'Bicycle' | 'Motorcycle' | 'Car' | 'Van';

export type DocumentType = 
  | 'national_id'
  | 'driver_licence'
  | 'vehicle_registration'
  | 'insurance_certificate'
  | 'inspection_certificate';

export type DocumentVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVerified: boolean;
  otpCode?: string;
  otpExpiresAt?: string;
  createdAt: string;
}

export interface DriverProfile {
  id: string;
  auth_user_id: string;
  role: 'driver';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  residentialAddress: string;
  city: string;
  country: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  // Identity fields
  nationalIdNumber: string;
  driverLicenceNumber: string;
  driverLicenceExpiryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  driver_profile_id: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  year: string;
  registrationNumber: string;
  colour: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRecord {
  id: string;
  driver_profile_id: string;
  document_type: DocumentType;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  verification_status: DocumentVerificationStatus;
  uploaded_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  driver_profile_id: string;
  status: ApplicationStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DriverFullData {
  user: AuthUser;
  profile: DriverProfile;
  vehicle: Vehicle | null;
  documents: DocumentRecord[];
  application: Application;
}

export interface AdminDashboardStats {
  totalApplications: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
}

export interface AdminApplicationSummary {
  id: string;
  driverProfileId: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  vehicleType: VehicleType | 'None';
  status: ApplicationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  documentCount: number;
}
