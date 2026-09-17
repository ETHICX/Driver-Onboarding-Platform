import fs from 'fs';
import path from 'path';
import { 
  AuthUser, 
  DriverProfile, 
  Vehicle, 
  DocumentRecord, 
  Application,
  AdminApplicationSummary,
  AdminDashboardStats
} from '../src/types';

interface DatabaseSchema {
  users: (AuthUser & { passwordHash: string })[];
  profiles: DriverProfile[];
  vehicles: Vehicle[];
  documents: DocumentRecord[];
  applications: Application[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure base directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Simple deterministic hash for demo passwords
export function hashPassword(password: string): string {
  // Simple hash for password check
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash)}_${password.length}`;
}

const INITIAL_DB: DatabaseSchema = {
  users: [
    {
      id: 'usr_admin_001',
      email: 'admin@example.com',
      phone: '+1 555-0100',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      role: 'admin',
      isVerified: true,
      passwordHash: hashPassword('Admin123!'),
      createdAt: '2026-01-10T08:00:00.000Z'
    },
    {
      id: 'usr_driver_001',
      email: 'driver@example.com',
      phone: '+1 555-0199',
      firstName: 'Marcus',
      lastName: 'Vance',
      role: 'driver',
      isVerified: true,
      passwordHash: hashPassword('Driver123!'),
      createdAt: '2026-03-01T10:00:00.000Z'
    },
    {
      id: 'usr_driver_002',
      email: 'elena.rostova@example.com',
      phone: '+1 555-0244',
      firstName: 'Elena',
      lastName: 'Rostova',
      role: 'driver',
      isVerified: true,
      passwordHash: hashPassword('Driver123!'),
      createdAt: '2026-03-05T11:30:00.000Z'
    },
    {
      id: 'usr_driver_003',
      email: 'david.kim@example.com',
      phone: '+1 555-0377',
      firstName: 'David',
      lastName: 'Kim',
      role: 'driver',
      isVerified: true,
      passwordHash: hashPassword('Driver123!'),
      createdAt: '2026-03-08T09:15:00.000Z'
    }
  ],
  profiles: [
    {
      id: 'prf_driver_001',
      auth_user_id: 'usr_driver_001',
      role: 'driver',
      firstName: 'Marcus',
      lastName: 'Vance',
      dateOfBirth: '1992-05-14',
      email: 'driver@example.com',
      phone: '+1 555-0199',
      residentialAddress: '742 Evergreen Terrace',
      city: 'Metro City',
      country: 'United States',
      emergencyContactName: 'Laura Vance',
      emergencyContactPhone: '+1 555-0198',
      nationalIdNumber: 'NAT-94827104',
      driverLicenceNumber: 'DL-88371920',
      driverLicenceExpiryDate: '2029-08-20',
      createdAt: '2026-03-01T10:05:00.000Z',
      updatedAt: '2026-03-01T10:30:00.000Z'
    },
    {
      id: 'prf_driver_002',
      auth_user_id: 'usr_driver_002',
      role: 'driver',
      firstName: 'Elena',
      lastName: 'Rostova',
      dateOfBirth: '1995-11-23',
      email: 'elena.rostova@example.com',
      phone: '+1 555-0244',
      residentialAddress: '120 Ocean View Blvd',
      city: 'Bay Harbor',
      country: 'United States',
      emergencyContactName: 'Nikolai Rostov',
      emergencyContactPhone: '+1 555-0240',
      nationalIdNumber: 'NAT-44910283',
      driverLicenceNumber: 'DL-55201948',
      driverLicenceExpiryDate: '2028-12-15',
      createdAt: '2026-03-05T11:35:00.000Z',
      updatedAt: '2026-03-05T12:00:00.000Z'
    },
    {
      id: 'prf_driver_003',
      auth_user_id: 'usr_driver_003',
      role: 'driver',
      firstName: 'David',
      lastName: 'Kim',
      dateOfBirth: '1989-03-30',
      email: 'david.kim@example.com',
      phone: '+1 555-0377',
      residentialAddress: '88 Market Plaza, Apt 4B',
      city: 'Centerville',
      country: 'United States',
      emergencyContactName: 'Grace Kim',
      emergencyContactPhone: '+1 555-0370',
      nationalIdNumber: 'NAT-33829105',
      driverLicenceNumber: 'DL-44829177',
      driverLicenceExpiryDate: '2027-04-10',
      createdAt: '2026-03-08T09:20:00.000Z',
      updatedAt: '2026-03-08T09:50:00.000Z'
    }
  ],
  vehicles: [
    {
      id: 'veh_001',
      driver_profile_id: 'prf_driver_001',
      vehicleType: 'Car',
      make: 'Toyota',
      model: 'Prius Prime',
      year: '2022',
      registrationNumber: '7XYZ892',
      colour: 'Midnight Silver',
      createdAt: '2026-03-01T10:15:00.000Z',
      updatedAt: '2026-03-01T10:15:00.000Z'
    },
    {
      id: 'veh_002',
      driver_profile_id: 'prf_driver_002',
      vehicleType: 'Van',
      make: 'Ford',
      model: 'Transit Custom',
      year: '2023',
      registrationNumber: '9TRN441',
      colour: 'Polar White',
      createdAt: '2026-03-05T11:45:00.000Z',
      updatedAt: '2026-03-05T11:45:00.000Z'
    },
    {
      id: 'veh_003',
      driver_profile_id: 'prf_driver_003',
      vehicleType: 'Motorcycle',
      make: 'Honda',
      model: 'CB500X',
      year: '2021',
      registrationNumber: '2MC7819',
      colour: 'Grand Prix Red',
      createdAt: '2026-03-08T09:30:00.000Z',
      updatedAt: '2026-03-08T09:30:00.000Z'
    }
  ],
  documents: [
    {
      id: 'doc_001',
      driver_profile_id: 'prf_driver_001',
      document_type: 'national_id',
      file_name: 'marcus_vance_passport.pdf',
      storage_path: 'documents/prf_driver_001/identity/marcus_vance_passport.pdf',
      mime_type: 'application/pdf',
      file_size: 1420500,
      verification_status: 'pending',
      uploaded_at: '2026-03-01T10:20:00.000Z',
      updated_at: '2026-03-01T10:20:00.000Z'
    },
    {
      id: 'doc_002',
      driver_profile_id: 'prf_driver_001',
      document_type: 'driver_licence',
      file_name: 'marcus_vance_licence.png',
      storage_path: 'documents/prf_driver_001/licence/marcus_vance_licence.png',
      mime_type: 'image/png',
      file_size: 2180400,
      verification_status: 'pending',
      uploaded_at: '2026-03-01T10:22:00.000Z',
      updated_at: '2026-03-01T10:22:00.000Z'
    },
    {
      id: 'doc_003',
      driver_profile_id: 'prf_driver_001',
      document_type: 'vehicle_registration',
      file_name: 'toyota_prius_registration.pdf',
      storage_path: 'documents/prf_driver_001/vehicle/toyota_prius_registration.pdf',
      mime_type: 'application/pdf',
      file_size: 890120,
      verification_status: 'pending',
      uploaded_at: '2026-03-01T10:25:00.000Z',
      updated_at: '2026-03-01T10:25:00.000Z'
    },
    {
      id: 'doc_004',
      driver_profile_id: 'prf_driver_001',
      document_type: 'insurance_certificate',
      file_name: 'commercial_auto_insurance.pdf',
      storage_path: 'documents/prf_driver_001/vehicle/commercial_auto_insurance.pdf',
      mime_type: 'application/pdf',
      file_size: 1120400,
      verification_status: 'pending',
      uploaded_at: '2026-03-01T10:26:00.000Z',
      updated_at: '2026-03-01T10:26:00.000Z'
    },
    // Elena's docs
    {
      id: 'doc_005',
      driver_profile_id: 'prf_driver_002',
      document_type: 'national_id',
      file_name: 'elena_passport.pdf',
      storage_path: 'documents/prf_driver_002/identity/elena_passport.pdf',
      mime_type: 'application/pdf',
      file_size: 1350000,
      verification_status: 'approved',
      uploaded_at: '2026-03-05T11:48:00.000Z',
      updated_at: '2026-03-05T14:00:00.000Z'
    },
    {
      id: 'doc_006',
      driver_profile_id: 'prf_driver_002',
      document_type: 'driver_licence',
      file_name: 'elena_commercial_licence.png',
      storage_path: 'documents/prf_driver_002/licence/elena_commercial_licence.png',
      mime_type: 'image/png',
      file_size: 1980000,
      verification_status: 'approved',
      uploaded_at: '2026-03-05T11:50:00.000Z',
      updated_at: '2026-03-05T14:00:00.000Z'
    }
  ],
  applications: [
    {
      id: 'app_001',
      driver_profile_id: 'prf_driver_001',
      status: 'submitted',
      submitted_at: '2026-03-01T10:30:00.000Z',
      reviewed_at: null,
      reviewed_by: null,
      rejection_reason: null,
      created_at: '2026-03-01T10:05:00.000Z',
      updated_at: '2026-03-01T10:30:00.000Z'
    },
    {
      id: 'app_002',
      driver_profile_id: 'prf_driver_002',
      status: 'approved',
      submitted_at: '2026-03-05T12:00:00.000Z',
      reviewed_at: '2026-03-05T14:15:00.000Z',
      reviewed_by: 'admin@example.com',
      rejection_reason: null,
      created_at: '2026-03-05T11:35:00.000Z',
      updated_at: '2026-03-05T14:15:00.000Z'
    },
    {
      id: 'app_003',
      driver_profile_id: 'prf_driver_003',
      status: 'under_review',
      submitted_at: '2026-03-08T09:50:00.000Z',
      reviewed_at: '2026-03-08T11:00:00.000Z',
      reviewed_by: 'admin@example.com',
      rejection_reason: null,
      created_at: '2026-03-08T09:20:00.000Z',
      updated_at: '2026-03-08T11:00:00.000Z'
    }
  ]
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed reading DB file, using initial dataset:', e);
    }
    this.save(INITIAL_DB);
    return INITIAL_DB;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      const content = JSON.stringify(dataToSave || this.data, null, 2);
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, content, 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (e) {
      console.error('Failed saving DB file:', e);
    }
  }

  // --- Users ---
  findUserByEmail(email: string) {
    const norm = email.trim().toLowerCase();
    return this.data.users.find(u => u.email.toLowerCase() === norm);
  }

  findUserByPhone(phone: string) {
    const norm = phone.trim().replace(/\s+/g, '');
    return this.data.users.find(u => u.phone.replace(/\s+/g, '') === norm);
  }

  findUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  createUser(userData: Omit<AuthUser & { passwordHash: string }, 'id' | 'createdAt'>): AuthUser {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newUser = {
      ...userData,
      id,
      createdAt: now
    };
    this.data.users.push(newUser);
    this.save();
    const { passwordHash: _, ...publicUser } = newUser;
    return publicUser;
  }

  updateUser(id: string, updates: Partial<AuthUser & { passwordHash: string }>): AuthUser | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    const { passwordHash: _, ...publicUser } = this.data.users[idx];
    return publicUser;
  }

  // --- Profiles ---
  findProfileByAuthUserId(authUserId: string): DriverProfile | null {
    return this.data.profiles.find(p => p.auth_user_id === authUserId) || null;
  }

  findProfileById(id: string): DriverProfile | null {
    return this.data.profiles.find(p => p.id === id) || null;
  }

  createProfile(profileData: Omit<DriverProfile, 'id' | 'createdAt' | 'updatedAt'>): DriverProfile {
    const id = `prf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newProfile: DriverProfile = {
      ...profileData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.data.profiles.push(newProfile);
    this.save();
    return newProfile;
  }

  updateProfile(id: string, updates: Partial<DriverProfile>): DriverProfile | null {
    const idx = this.data.profiles.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.profiles[idx] = {
      ...this.data.profiles[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.profiles[idx];
  }

  // --- Vehicles ---
  findVehicleByDriverProfileId(driverProfileId: string): Vehicle | null {
    return this.data.vehicles.find(v => v.driver_profile_id === driverProfileId) || null;
  }

  upsertVehicle(driverProfileId: string, vehicleData: Omit<Vehicle, 'id' | 'driver_profile_id' | 'createdAt' | 'updatedAt'>): Vehicle {
    const now = new Date().toISOString();
    const existingIdx = this.data.vehicles.findIndex(v => v.driver_profile_id === driverProfileId);
    if (existingIdx !== -1) {
      this.data.vehicles[existingIdx] = {
        ...this.data.vehicles[existingIdx],
        ...vehicleData,
        updatedAt: now
      };
      this.save();
      return this.data.vehicles[existingIdx];
    } else {
      const newVehicle: Vehicle = {
        id: `veh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        driver_profile_id: driverProfileId,
        ...vehicleData,
        createdAt: now,
        updatedAt: now
      };
      this.data.vehicles.push(newVehicle);
      this.save();
      return newVehicle;
    }
  }

  // --- Documents ---
  findDocumentsByDriverProfileId(driverProfileId: string): DocumentRecord[] {
    return this.data.documents.filter(d => d.driver_profile_id === driverProfileId);
  }

  findDocumentById(id: string): DocumentRecord | null {
    return this.data.documents.find(d => d.id === id) || null;
  }

  createDocument(docData: Omit<DocumentRecord, 'id' | 'uploaded_at' | 'updated_at'>): DocumentRecord {
    // If a document of same type exists for this driver, replace it
    const existingIdx = this.data.documents.findIndex(
      d => d.driver_profile_id === docData.driver_profile_id && d.document_type === docData.document_type
    );
    const now = new Date().toISOString();
    const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newDoc: DocumentRecord = {
      ...docData,
      id,
      uploaded_at: now,
      updated_at: now
    };

    if (existingIdx !== -1) {
      this.data.documents[existingIdx] = newDoc;
    } else {
      this.data.documents.push(newDoc);
    }
    this.save();
    return newDoc;
  }

  deleteDocument(id: string): boolean {
    const idx = this.data.documents.findIndex(d => d.id === id);
    if (idx === -1) return false;
    const doc = this.data.documents[idx];
    const fullPath = path.join(UPLOADS_DIR, doc.storage_path.replace(/^documents\//, ''));
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error('Failed to delete physical file:', err);
      }
    }
    this.data.documents.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Applications ---
  findApplicationByDriverProfileId(driverProfileId: string): Application | null {
    return this.data.applications.find(a => a.driver_profile_id === driverProfileId) || null;
  }

  findApplicationById(id: string): Application | null {
    return this.data.applications.find(a => a.id === id) || null;
  }

  createApplication(driverProfileId: string): Application {
    const now = new Date().toISOString();
    const newApp: Application = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      driver_profile_id: driverProfileId,
      status: 'draft',
      submitted_at: null,
      reviewed_at: null,
      reviewed_by: null,
      rejection_reason: null,
      created_at: now,
      updated_at: now
    };
    this.data.applications.push(newApp);
    this.save();
    return newApp;
  }

  updateApplication(id: string, updates: Partial<Application>): Application | null {
    const idx = this.data.applications.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.data.applications[idx] = {
      ...this.data.applications[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    } as any;
    this.data.applications[idx].updated_at = new Date().toISOString();
    this.save();
    return this.data.applications[idx];
  }

  // --- Admin Queries ---
  getAdminDashboard(): { stats: AdminDashboardStats; applications: AdminApplicationSummary[] } {
    const apps = this.data.applications;
    const stats: AdminDashboardStats = {
      totalApplications: apps.length,
      submitted: apps.filter(a => a.status === 'submitted').length,
      underReview: apps.filter(a => a.status === 'under_review').length,
      approved: apps.filter(a => a.status === 'approved').length,
      rejected: apps.filter(a => a.status === 'rejected').length
    };

    const summaries: AdminApplicationSummary[] = apps.map(app => {
      const profile = this.findProfileById(app.driver_profile_id);
      const vehicle = this.findVehicleByDriverProfileId(app.driver_profile_id);
      const docs = this.findDocumentsByDriverProfileId(app.driver_profile_id);

      return {
        id: app.id,
        driverProfileId: app.driver_profile_id,
        driverName: profile ? `${profile.firstName} ${profile.lastName}` : 'Unknown Driver',
        driverEmail: profile?.email || 'N/A',
        driverPhone: profile?.phone || 'N/A',
        vehicleType: vehicle?.vehicleType || 'None',
        status: app.status,
        submittedAt: app.submitted_at,
        reviewedAt: app.reviewed_at,
        reviewedBy: app.reviewed_by,
        rejectionReason: app.rejection_reason,
        documentCount: docs.length
      };
    });

    // Sort by most recently updated/submitted
    summaries.sort((a, b) => {
      const tA = new Date(a.submittedAt || 0).getTime();
      const tB = new Date(b.submittedAt || 0).getTime();
      return tB - tA;
    });

    return { stats, applications: summaries };
  }
}

export const db = new Database();
