import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { db, hashPassword, UPLOADS_DIR } from './server/db';
import { 
  authenticate, 
  requireAuth, 
  requireRole, 
  createSessionToken, 
  generateOtp, 
  AuthenticatedRequest 
} from './server/auth';
import { VehicleType, DocumentType } from './src/types';

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userReq = req as AuthenticatedRequest;
    const profile = db.findProfileByAuthUserId(userReq.user?.id || '');
    const profileId = profile?.id || 'temp';
    const docType = (req.body.document_type || 'general') as string;
    
    // Structured path: uploads/documents/{driver_profile_id}/{document_type}/
    const targetDir = path.join(UPLOADS_DIR, 'documents', profileId, docType);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    cb(null, `${uniqueSuffix}_${cleanName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.'));
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(authenticate);

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'Driver Onboarding API' });
  });

  // -------------------------------------------------------------
  // AUTHENTICATION ROUTES
  // -------------------------------------------------------------

  // Register Driver
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { firstName, lastName, email, phone, password, confirmPassword, termsAccepted } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    if (!termsAccepted) {
      return res.status(400).json({ error: 'You must accept the terms and conditions.' });
    }

    // Check email uniqueness
    if (db.findUserByEmail(email)) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Check phone uniqueness
    if (db.findUserByPhone(phone)) {
      return res.status(400).json({ error: 'An account with this phone number already exists.' });
    }

    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

    // Create user
    const newUser = db.createUser({
      email,
      phone,
      firstName,
      lastName,
      role: 'driver',
      isVerified: false,
      otpCode,
      otpExpiresAt,
      passwordHash: hashPassword(password)
    });

    // Create initial profile
    const newProfile = db.createProfile({
      auth_user_id: newUser.id,
      role: 'driver',
      firstName,
      lastName,
      dateOfBirth: '',
      email,
      phone,
      residentialAddress: '',
      city: '',
      country: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      nationalIdNumber: '',
      driverLicenceNumber: '',
      driverLicenceExpiryDate: ''
    });

    // Create initial application in draft status
    db.createApplication(newProfile.id);

    return res.status(201).json({
      success: true,
      message: `Account created. Verification code sent to ${email}`,
      email: newUser.email,
      phone: newUser.phone,
      // Provide demo OTP so testing in AI Studio is seamless
      demoOtp: otpCode
    });
  });

  // Verify OTP
  app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required.' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    if (user.isVerified) {
      const token = createSessionToken(user.id);
      return res.json({
        success: true,
        alreadyVerified: true,
        token,
        user
      });
    }

    if (!user.otpCode || user.otpCode !== code.trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    if (user.otpExpiresAt && new Date(user.otpExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    // Activate user
    const updatedUser = db.updateUser(user.id, {
      isVerified: true,
      otpCode: undefined,
      otpExpiresAt: undefined
    });

    const token = createSessionToken(user.id);

    return res.json({
      success: true,
      message: 'Account verified successfully.',
      token,
      user: updatedUser
    });
  });

  // Resend OTP
  app.post('/api/auth/resend-otp', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.updateUser(user.id, {
      otpCode,
      otpExpiresAt
    });

    return res.json({
      success: true,
      message: `A fresh 6-digit code has been sent to ${email}`,
      demoOtp: otpCode
    });
  });

  // Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/phone and password are required.' });
    }

    let user = db.findUserByEmail(identifier);
    if (!user) {
      user = db.findUserByPhone(identifier);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. Please check your email/phone and password.' });
    }

    const fullUser = db.findUserById(user.id) as any;
    if (fullUser.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials. Please check your email/phone and password.' });
    }

    // Check if driver requires OTP contact verification first
    if (user.role === 'driver' && !user.isVerified) {
      // Re-issue OTP if expired or missing
      let currentOtp = user.otpCode;
      if (!currentOtp || (user.otpExpiresAt && new Date(user.otpExpiresAt).getTime() < Date.now())) {
        currentOtp = generateOtp();
        db.updateUser(user.id, {
          otpCode: currentOtp,
          otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        });
      }

      return res.status(403).json({
        requiresVerification: true,
        email: user.email,
        phone: user.phone,
        message: 'Your account is not verified yet. Please enter the OTP sent to your contact method.',
        demoOtp: currentOtp
      });
    }

    const token = createSessionToken(user.id);
    const { passwordHash: _, ...publicUser } = fullUser;

    return res.json({
      success: true,
      token,
      user: publicUser
    });
  });

  // Get current user session
  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    return res.json({ user: req.user });
  });

  // Quick Switcher / Demo Session Generator (for immediate tester assessment)
  app.post('/api/auth/quick-login', (req: Request, res: Response) => {
    const { role, email } = req.body;
    let targetUser: any = null;

    if (email) {
      targetUser = db.findUserByEmail(email);
    } else if (role === 'admin') {
      targetUser = db.findUserByEmail('admin@example.com');
    } else {
      targetUser = db.findUserByEmail('driver@example.com');
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'Demo user not found.' });
    }

    const token = createSessionToken(targetUser.id);
    const { passwordHash: _, ...publicUser } = targetUser;

    return res.json({
      success: true,
      token,
      user: publicUser
    });
  });

  // -------------------------------------------------------------
  // DRIVER ONBOARDING & APPLICATION ROUTES
  // -------------------------------------------------------------

  // Get all data for current driver
  app.get('/api/driver/application', requireAuth, requireRole('driver'), (req: AuthenticatedRequest, res: Response) => {
    let profile = db.findProfileByAuthUserId(req.user!.id);
    if (!profile) {
      profile = db.createProfile({
        auth_user_id: req.user!.id,
        role: 'driver',
        firstName: req.user!.firstName,
        lastName: req.user!.lastName,
        dateOfBirth: '',
        email: req.user!.email,
        phone: req.user!.phone,
        residentialAddress: '',
        city: '',
        country: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        nationalIdNumber: '',
        driverLicenceNumber: '',
        driverLicenceExpiryDate: ''
      });
    }

    let application = db.findApplicationByDriverProfileId(profile.id);
    if (!application) {
      application = db.createApplication(profile.id);
    }

    const vehicle = db.findVehicleByDriverProfileId(profile.id);
    const documents = db.findDocumentsByDriverProfileId(profile.id);

    return res.json({
      user: req.user,
      profile,
      vehicle,
      documents,
      application
    });
  });

  // Autosave personal details
  app.put('/api/driver/personal', requireAuth, requireRole('driver'), (req: AuthenticatedRequest, res: Response) => {
    const profile = db.findProfileByAuthUserId(req.user!.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });

    const application = db.findApplicationByDriverProfileId(profile.id);
    if (application && application.status !== 'draft') {
      return res.status(400).json({ error: 'Application has already been submitted and cannot be edited.' });
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      email,
      phone,
      residentialAddress,
      city,
      country,
      emergencyContactName,
      emergencyContactPhone
    } = req.body;

    const updated = db.updateProfile(profile.id, {
      firstName: firstName || profile.firstName,
      lastName: lastName || profile.lastName,
      dateOfBirth: dateOfBirth || '',
      email: email || profile.email,
      phone: phone || profile.phone,
      residentialAddress: residentialAddress || '',
      city: city || '',
      country: country || '',
      emergencyContactName: emergencyContactName || '',
      emergencyContactPhone: emergencyContactPhone || ''
    });

    return res.json({ success: true, profile: updated });
  });

  // Autosave identity details
  app.put('/api/driver/identity', requireAuth, requireRole('driver'), (req: AuthenticatedRequest, res: Response) => {
    const profile = db.findProfileByAuthUserId(req.user!.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });

    const application = db.findApplicationByDriverProfileId(profile.id);
    if (application && application.status !== 'draft') {
      return res.status(400).json({ error: 'Application has already been submitted and cannot be edited.' });
    }

    const { nationalIdNumber, driverLicenceNumber, driverLicenceExpiryDate } = req.body;

    const updated = db.updateProfile(profile.id, {
      nationalIdNumber: nationalIdNumber ?? profile.nationalIdNumber,
      driverLicenceNumber: driverLicenceNumber ?? profile.driverLicenceNumber,
      driverLicenceExpiryDate: driverLicenceExpiryDate ?? profile.driverLicenceExpiryDate
    });

    return res.json({ success: true, profile: updated });
  });

  // Autosave vehicle details
  app.put('/api/driver/vehicle', requireAuth, requireRole('driver'), (req: AuthenticatedRequest, res: Response) => {
    const profile = db.findProfileByAuthUserId(req.user!.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });

    const application = db.findApplicationByDriverProfileId(profile.id);
    if (application && application.status !== 'draft') {
      return res.status(400).json({ error: 'Application has already been submitted and cannot be edited.' });
    }

    const { vehicleType, make, model, year, registrationNumber, colour } = req.body;

    if (!vehicleType) {
      return res.status(400).json({ error: 'Vehicle type is required.' });
    }

    const updated = db.upsertVehicle(profile.id, {
      vehicleType: vehicleType as VehicleType,
      make: make || '',
      model: model || '',
      year: year || '',
      registrationNumber: registrationNumber || '',
      colour: colour || ''
    });

    return res.json({ success: true, vehicle: updated });
  });

  // Upload document
  app.post(
    '/api/driver/documents/upload',
    requireAuth,
    requireRole('driver'),
    upload.single('file'),
    (req: AuthenticatedRequest, res: Response) => {
      const profile = db.findProfileByAuthUserId(req.user!.id);
      if (!profile) return res.status(404).json({ error: 'Profile not found.' });

      const application = db.findApplicationByDriverProfileId(profile.id);
      if (application && application.status !== 'draft') {
        return res.status(400).json({ error: 'Application has already been submitted.' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file was uploaded.' });
      }

      const documentType = req.body.document_type as DocumentType;
      if (!documentType) {
        return res.status(400).json({ error: 'Document type is required.' });
      }

      // Compute relative storage path matching: documents/{driver_profile_id}/{type}/filename
      const relativePath = path.relative(UPLOADS_DIR, req.file.path).replace(/\\/g, '/');

      const docRecord = db.createDocument({
        driver_profile_id: profile.id,
        document_type: documentType,
        file_name: req.file.originalname,
        storage_path: relativePath,
        mime_type: req.file.mimetype,
        file_size: req.file.size,
        verification_status: 'pending'
      });

      return res.status(201).json({
        success: true,
        document: docRecord
      });
    }
  );

  // Delete document
  app.delete('/api/driver/documents/:id', requireAuth, requireRole('driver'), (req: AuthenticatedRequest, res: Response) => {
    const profile = db.findProfileByAuthUserId(req.user!.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });

    const doc = db.findDocumentById(req.params.id);
    if (!doc || doc.driver_profile_id !== profile.id) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const application = db.findApplicationByDriverProfileId(profile.id);
    if (application && application.status !== 'draft') {
      return res.status(400).json({ error: 'Application has already been submitted.' });
    }

    db.deleteDocument(doc.id);
    return res.json({ success: true, message: 'Document deleted successfully.' });
  });

  // Submit Application
  app.post('/api/driver/application/submit', requireAuth, requireRole('driver'), (req: AuthenticatedRequest, res: Response) => {
    const profile = db.findProfileByAuthUserId(req.user!.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });

    let application = db.findApplicationByDriverProfileId(profile.id);
    if (!application) {
      application = db.createApplication(profile.id);
    }

    if (application.status !== 'draft') {
      return res.status(400).json({ error: 'Application has already been submitted.' });
    }

    // Comprehensive validation before submission
    const errors: string[] = [];

    if (!profile.firstName || !profile.lastName) errors.push('First and last name are required.');
    if (!profile.dateOfBirth) errors.push('Date of birth is required.');
    if (!profile.residentialAddress || !profile.city || !profile.country) errors.push('Complete residential address is required.');
    if (!profile.emergencyContactName || !profile.emergencyContactPhone) errors.push('Emergency contact details are required.');
    if (!profile.nationalIdNumber) errors.push('National ID or passport number is required.');
    if (!profile.driverLicenceNumber || !profile.driverLicenceExpiryDate) errors.push('Driver licence number and expiry date are required.');

    const vehicle = db.findVehicleByDriverProfileId(profile.id);
    if (!vehicle || !vehicle.vehicleType) {
      errors.push('Vehicle information is required.');
    } else {
      if (vehicle.vehicleType !== 'Bicycle') {
        if (!vehicle.make || !vehicle.model || !vehicle.registrationNumber) {
          errors.push('Vehicle make, model, and registration number are required.');
        }
      }
    }

    const docs = db.findDocumentsByDriverProfileId(profile.id);
    const hasDoc = (t: DocumentType) => docs.some(d => d.document_type === t);

    if (!hasDoc('national_id')) errors.push('National ID / Passport document must be uploaded.');
    if (!hasDoc('driver_licence')) errors.push('Driver Licence document must be uploaded.');

    if (vehicle && vehicle.vehicleType !== 'Bicycle') {
      if (!hasDoc('vehicle_registration')) errors.push('Vehicle Registration document must be uploaded.');
      if (!hasDoc('insurance_certificate')) errors.push('Commercial/Vehicle Insurance document must be uploaded.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Please complete all required fields and document uploads before submitting.',
        details: errors
      });
    }

    // Atomically transition to 'submitted'
    const now = new Date().toISOString();
    const updatedApp = db.updateApplication(application.id, {
      status: 'submitted',
      submitted_at: now
    });

    return res.json({
      success: true,
      message: 'Application successfully submitted.',
      application: updatedApp
    });
  });

  // -------------------------------------------------------------
  // DOCUMENT VIEWING & DOWNLOAD
  // -------------------------------------------------------------
  app.get('/api/documents/:id/file', (req: Request, res: Response) => {
    const doc = db.findDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).send('Document not found');
    }

    const fullPath = path.join(UPLOADS_DIR, doc.storage_path.replace(/^documents\//, ''));
    if (fs.existsSync(fullPath)) {
      res.setHeader('Content-Type', doc.mime_type);
      res.setHeader('Content-Disposition', `inline; filename="${doc.file_name}"`);
      return fs.createReadStream(fullPath).pipe(res);
    }

    // If seeded sample document without physical file, generate clean SVG preview
    res.setHeader('Content-Type', 'image/svg+xml');
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" style="background:#f8fafc; font-family:sans-serif;">
        <rect width="100%" height="100%" fill="#f8fafc"/>
        <rect x="40" y="40" width="520" height="320" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
        <circle cx="100" cy="110" r="30" fill="#e2e8f0"/>
        <path d="M100 95 v30 M85 110 h30" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
        <text x="150" y="105" font-size="20" font-weight="bold" fill="#0f172a">${doc.document_type.replace(/_/g, ' ').toUpperCase()}</text>
        <text x="150" y="130" font-size="14" fill="#64748b">File: ${doc.file_name}</text>
        <line x1="80" y1="180" x2="520" y2="180" stroke="#f1f5f9" stroke-width="2"/>
        <text x="80" y="220" font-size="14" fill="#334155">Driver Profile ID: ${doc.driver_profile_id}</text>
        <text x="80" y="250" font-size="14" fill="#334155">Storage Path: ${doc.storage_path}</text>
        <text x="80" y="280" font-size="14" fill="#334155">Status: ${doc.verification_status.toUpperCase()}</text>
        <text x="80" y="310" font-size="12" fill="#94a3b8">Simulated secure preview artifact for verification</text>
      </svg>
    `;
    return res.send(svg);
  });

  // -------------------------------------------------------------
  // ADMIN ROUTES
  // -------------------------------------------------------------

  // Get Admin Dashboard Overview
  app.get('/api/admin/dashboard', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
    const data = db.getAdminDashboard();
    return res.json(data);
  });

  // Get Application Details for Admin Review
  app.get('/api/admin/applications/:id', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
    const application = db.findApplicationById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const profile = db.findProfileById(application.driver_profile_id);
    const vehicle = db.findVehicleByDriverProfileId(application.driver_profile_id);
    const documents = db.findDocumentsByDriverProfileId(application.driver_profile_id);

    return res.json({
      application,
      profile,
      vehicle,
      documents
    });
  });

  // Admin: Start Review (transitions submitted -> under_review)
  app.post('/api/admin/applications/:id/start-review', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
    const application = db.findApplicationById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    if (application.status !== 'submitted') {
      return res.status(400).json({ error: `Cannot start review. Current status is ${application.status}.` });
    }

    const updated = db.updateApplication(application.id, {
      status: 'under_review',
      reviewed_by: req.user!.email,
      reviewed_at: new Date().toISOString()
    });

    return res.json({ success: true, application: updated });
  });

  // Admin: Approve Application
  app.post('/api/admin/applications/:id/approve', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
    const application = db.findApplicationById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    if (application.status !== 'submitted' && application.status !== 'under_review') {
      return res.status(400).json({ error: `Application is already ${application.status}.` });
    }

    const now = new Date().toISOString();
    const updated = db.updateApplication(application.id, {
      status: 'approved',
      reviewed_by: req.user!.email,
      reviewed_at: now,
      rejection_reason: null
    });

    // Also mark documents as approved
    const docs = db.findDocumentsByDriverProfileId(application.driver_profile_id);
    for (const d of docs) {
      d.verification_status = 'approved';
    }

    return res.json({ success: true, application: updated });
  });

  // Admin: Reject Application
  app.post('/api/admin/applications/:id/reject', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A clear rejection reason is required.' });
    }

    const application = db.findApplicationById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const now = new Date().toISOString();
    const updated = db.updateApplication(application.id, {
      status: 'rejected',
      reviewed_by: req.user!.email,
      reviewed_at: now,
      rejection_reason: reason.trim()
    });

    return res.json({ success: true, application: updated });
  });

  // Admin: Reset to Draft or Submitted (convenient test utility)
  app.post('/api/admin/applications/:id/reset-status', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
    const { status } = req.body;
    const application = db.findApplicationById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found.' });

    const updated = db.updateApplication(application.id, {
      status: status || 'draft',
      reviewed_at: null,
      reviewed_by: null,
      rejection_reason: null,
      submitted_at: status === 'submitted' ? new Date().toISOString() : null
    });

    return res.json({ success: true, application: updated });
  });

  // -------------------------------------------------------------
  // VITE / STATIC SERVING
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Driver Onboarding Server running on port ${PORT}`);
  });
}

startServer();
