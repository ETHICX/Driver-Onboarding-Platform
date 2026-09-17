import React, { useState, useEffect } from 'react';
import { Application, DriverProfile, Vehicle, DocumentRecord } from '../../types';
import { api } from '../../lib/api';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  FileText, 
  User, 
  ShieldCheck, 
  Truck, 
  MapPin, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface ApplicationReviewDetailProps {
  applicationId: string;
  onBack: () => void;
  onApplicationUpdated: () => void;
}

export const ApplicationReviewDetail: React.FC<ApplicationReviewDetailProps> = ({
  applicationId,
  onBack,
  onApplicationUpdated
}) => {
  const [data, setData] = useState<{
    application: Application;
    profile: DriverProfile | null;
    vehicle: Vehicle | null;
    documents: DocumentRecord[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals for actions
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeModalDoc, setActiveModalDoc] = useState<DocumentRecord | null>(null);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminApplicationDetail(applicationId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [applicationId]);

  // Handle Start Review
  const handleStartReview = async () => {
    setActionLoading(true);
    try {
      await api.startAdminReview(applicationId);
      await loadDetails();
      onApplicationUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to start review.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Approve
  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.approveApplication(applicationId);
      setShowApproveConfirm(false);
      await loadDetails();
      onApplicationUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to approve application.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejecting the application.');
      return;
    }

    setActionLoading(true);
    try {
      await api.rejectApplication(applicationId, rejectionReason.trim());
      setShowRejectDialog(false);
      setRejectionReason('');
      await loadDetails();
      onApplicationUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to reject application.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reset status helper for test runs
  const handleResetStatus = async (status: string) => {
    setActionLoading(true);
    try {
      await api.resetApplicationStatus(applicationId, status);
      await loadDetails();
      onApplicationUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to reset status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Loading application file...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">Application not found</h2>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { application, profile, vehicle, documents } = data;
  const isBicycle = vehicle?.vehicleType === 'Bicycle';

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
            title="Back to applications list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {profile ? `${profile.firstName} ${profile.lastName}` : 'Driver Review'}
              </h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs ${
                application.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : application.status === 'rejected'
                  ? 'bg-rose-100 text-rose-800'
                  : application.status === 'under_review'
                  ? 'bg-blue-100 text-blue-800'
                  : application.status === 'submitted'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {application.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                {application.status === 'rejected' && <XCircle className="w-3 h-3" />}
                {application.status === 'under_review' && <FileText className="w-3 h-3" />}
                {application.status === 'submitted' && <Clock className="w-3 h-3" />}
                {application.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              ID: {application.id} • Submitted:{' '}
              {application.submitted_at ? new Date(application.submitted_at).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          {application.status === 'submitted' && (
            <button
              onClick={handleStartReview}
              disabled={actionLoading}
              className="w-full xs:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Start Review</span>
            </button>
          )}

          {(application.status === 'submitted' || application.status === 'under_review') && (
            <div className="flex items-center gap-2 w-full xs:w-auto">
              <button
                onClick={() => setShowApproveConfirm(true)}
                disabled={actionLoading}
                className="flex-1 xs:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>

              <button
                onClick={() => setShowRejectDialog(true)}
                disabled={actionLoading}
                className="flex-1 xs:flex-initial px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>
          )}

          {/* Testing Utility Dropdown/Buttons */}
          <div className="flex items-center gap-1 pl-2 sm:border-l sm:border-slate-300">
            <button
              onClick={() => handleResetStatus('submitted')}
              className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition cursor-pointer"
              title="Reset status back to Submitted for re-testing"
            >
              <RotateCcw className="w-3 h-3 inline mr-1" />
              Reset Demo
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Review History / Status Alert */}
      {application.status === 'rejected' && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-sm">
            <XCircle className="w-4 h-4 text-rose-600" />
            Application Rejected by Admin
          </div>
          <p>
            <strong>Rejection Reason:</strong> "{application.rejection_reason}"
          </p>
          <p className="text-slate-500 text-[11px]">
            Reviewed by {application.reviewed_by} on{' '}
            {application.reviewed_at ? new Date(application.reviewed_at).toLocaleString() : 'N/A'}
          </p>
        </div>
      )}

      {application.status === 'approved' && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Application Approved
          </div>
          <p>
            Driver credentials and vehicle insurance have been verified and endorsed for active service.
          </p>
          <p className="text-slate-500 text-[11px]">
            Endorsed by {application.reviewed_by} on{' '}
            {application.reviewed_at ? new Date(application.reviewed_at).toLocaleString() : 'N/A'}
          </p>
        </div>
      )}

      {/* Driver Details & Identity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver Profile */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-semibold text-slate-900 text-sm">
            <User className="w-4 h-4 text-emerald-600" />
            <h3>Driver Details</h3>
          </div>
          {profile ? (
            <dl className="space-y-2.5 text-xs">
              <div>
                <dt className="text-slate-400">Full Name</dt>
                <dd className="font-semibold text-slate-800 text-sm">{profile.firstName} {profile.lastName}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Email Address</dt>
                <dd className="font-semibold text-slate-800">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Phone Number</dt>
                <dd className="font-semibold text-slate-800">{profile.phone}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Date of Birth</dt>
                <dd className="font-semibold text-slate-800">{profile.dateOfBirth || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Residential Address</dt>
                <dd className="font-semibold text-slate-800">
                  {profile.residentialAddress ? `${profile.residentialAddress}, ${profile.city}, ${profile.country}` : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Emergency Contact</dt>
                <dd className="font-semibold text-slate-800">
                  {profile.emergencyContactName ? `${profile.emergencyContactName} (${profile.emergencyContactPhone})` : 'N/A'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-slate-400">No profile recorded.</p>
          )}
        </div>

        {/* Identity & Licence */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-semibold text-slate-900 text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3>Identity & Licence</h3>
          </div>
          {profile ? (
            <dl className="space-y-2.5 text-xs">
              <div>
                <dt className="text-slate-400">National ID / Passport Number</dt>
                <dd className="font-mono font-semibold text-slate-800 text-sm">{profile.nationalIdNumber || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Driver Licence Number</dt>
                <dd className="font-mono font-semibold text-slate-800 text-sm">{profile.driverLicenceNumber || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Licence Expiry Date</dt>
                <dd className="font-mono font-semibold text-slate-800">{profile.driverLicenceExpiryDate || 'N/A'}</dd>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded inline-flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Contact Phone & Email OTP-Verified
                </span>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-slate-400">No identity recorded.</p>
          )}
        </div>

        {/* Vehicle Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-semibold text-slate-900 text-sm">
            <Truck className="w-4 h-4 text-emerald-600" />
            <h3>Vehicle Specifications</h3>
          </div>
          {vehicle ? (
            <dl className="space-y-2.5 text-xs">
              <div>
                <dt className="text-slate-400">Category</dt>
                <dd className="font-bold text-slate-900 text-sm">{vehicle.vehicleType}</dd>
              </div>
              {!isBicycle ? (
                <>
                  <div>
                    <dt className="text-slate-400">Make & Model</dt>
                    <dd className="font-semibold text-slate-800">{vehicle.make} {vehicle.model}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Year / Colour</dt>
                    <dd className="font-semibold text-slate-800">{vehicle.year} · {vehicle.colour}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Registration Number</dt>
                    <dd className="font-mono font-bold text-slate-800 text-sm">{vehicle.registrationNumber}</dd>
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  Non-motorized courier fleet (Bicycle/E-Bike). Registration plates exempt.
                </div>
              )}
            </dl>
          ) : (
            <p className="text-xs text-slate-400">No vehicle registered.</p>
          )}
        </div>
      </div>

      {/* Uploaded Documents Verification Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
            <FileText className="w-4 h-4 text-emerald-600" />
            <h3>Attached Compliance Documents ({documents.length})</h3>
          </div>
          <span className="text-xs text-slate-500">
            Click 'View Document' to examine scan or download original file
          </span>
        </div>

        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => (
              <div
                key={doc.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      {doc.document_type.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      doc.verification_status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : doc.verification_status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {doc.verification_status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-1">{doc.file_name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    {(doc.file_size / 1024).toFixed(0)} KB • {doc.mime_type}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setActiveModalDoc(doc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Document</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-xs">
            No compliance documents uploaded yet.
          </div>
        )}
      </div>

      {/* Modal: Confirm Approval */}
      {showApproveConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Approve Application?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              This will officially mark the driver's onboarding application as <strong>APPROVED</strong>. The driver will be cleared for logistics deliveries and notified via their dashboard.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowApproveConfirm(false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="admin-confirm-approve-btn"
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                {actionLoading ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject Application */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Reject Application</h3>
            <p className="text-xs text-slate-600 mt-1">
              Please specify the precise reason for non-approval. This explanation will be displayed to the driver on their status screen.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="admin-reject-reason-input"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Driver licence scan was blurry and unreadable; please upload a high-resolution color scan with all 4 corners visible."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="admin-confirm-reject-btn"
                type="button"
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        document={activeModalDoc}
        onClose={() => setActiveModalDoc(null)}
      />
    </div>
  );
};
