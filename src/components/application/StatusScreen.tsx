import React, { useState } from 'react';
import { Application, DriverProfile, Vehicle, DocumentRecord } from '../../types';
import { api } from '../../lib/api';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  Eye, 
  ShieldCheck, 
  Truck, 
  MapPin, 
  ArrowLeft
} from 'lucide-react';

interface StatusScreenProps {
  application: Application;
  profile: DriverProfile;
  vehicle: Vehicle | null;
  documents: DocumentRecord[];
  onRefresh: () => void;
  onEditApplication?: () => void;
}

export const StatusScreen: React.FC<StatusScreenProps> = ({
  application,
  profile,
  vehicle,
  documents,
  onRefresh,
  onEditApplication
}) => {
  const [activeModalDoc, setActiveModalDoc] = useState<DocumentRecord | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const status = application.status;

  // Timeline Step Status Mapping
  // 1. Application Submitted
  // 2. Documents Received
  // 3. Application Under Review
  // 4. Final Decision (Approved / Rejected)

  const isSubmitted = status === 'submitted' || status === 'under_review' || status === 'approved' || status === 'rejected';
  const isDocumentsReceived = documents.length > 0 && isSubmitted;
  const isUnderReview = status === 'under_review' || status === 'approved' || status === 'rejected';
  const isDecided = status === 'approved' || status === 'rejected';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Banner based on status */}
      {status === 'approved' && (
        <div className="bg-emerald-600 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl shrink-0">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-200">
                Decision: Approved
              </span>
              <h1 className="text-2xl font-bold mt-0.5">
                Congratulations, {profile.firstName}!
              </h1>
              <p className="text-emerald-100 text-sm mt-1 leading-relaxed max-w-2xl">
                Your driver onboarding application has been verified and fully approved by operations. You are now cleared to accept logistics deliveries and activate your fleet device.
              </p>
              <div className="mt-4 pt-4 border-t border-emerald-500/50 flex flex-wrap gap-4 text-xs text-emerald-100 font-mono">
                <span>Application ID: {application.id}</span>
                <span>Reviewed by: {application.reviewed_by || 'Operations Admin'}</span>
                <span>Approval Date: {application.reviewed_at ? new Date(application.reviewed_at).toLocaleDateString() : 'Today'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === 'rejected' && (
        <div className="bg-rose-600 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl shrink-0">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-rose-200">
                Decision: Application Not Approved
              </span>
              <h1 className="text-2xl font-bold mt-0.5">
                Application Not Approved
              </h1>
              <p className="text-rose-100 text-sm mt-1 leading-relaxed">
                Unfortunately, your application did not pass the compliance or document verification requirements.
              </p>

              {/* Explicit Admin Reason box */}
              <div className="mt-4 p-4 rounded-xl bg-black/20 border border-white/20 text-xs">
                <span className="font-semibold uppercase tracking-wider text-rose-200 block mb-1">
                  Reason provided by Compliance Reviewer:
                </span>
                <p className="text-white text-sm font-medium leading-relaxed">
                  "{application.rejection_reason || 'Document verification could not be completed with the provided credentials.'}"
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-rose-500/50 text-xs text-rose-200">
                Please contact courier onboarding support at <span className="underline font-semibold">compliance@logiswift.example.com</span> if you believe this was an error.
              </div>
            </div>
          </div>
        </div>
      )}

      {(status === 'submitted' || status === 'under_review') && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-800 rounded-xl text-amber-400 shrink-0">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
                  {status === 'under_review' ? 'Active Compliance Review' : 'Awaiting Review Queue'}
                </span>
                <h1 className="text-2xl font-bold mt-0.5">
                  Application Under Review
                </h1>
                <p className="text-slate-300 text-sm mt-1 leading-relaxed max-w-2xl">
                  {status === 'under_review'
                    ? 'Our safety and compliance officers are currently verifying your vehicle documentation and driving licence credentials.'
                    : 'Your application has been logged in our queue. Administrative review typically completes within 24 business hours.'}
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span>Application ID: {application.id}</span>
                  <span>•</span>
                  <span>Submitted: {application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : 'Pending'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs cursor-pointer"
              title="Refresh status from server"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Status</span>
            </button>
          </div>
        </div>
      )}

      {/* State Machine Step Timeline */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">
          Application Lifecycle State Machine
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          {/* Step 1 */}
          <div className="flex sm:flex-col items-center sm:items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              isSubmitted ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">1. Submitted</div>
              <div className="text-[11px] text-slate-500">Contact verified & logged</div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex sm:flex-col items-center sm:items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              isDocumentsReceived ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {isDocumentsReceived ? <CheckCircle2 className="w-5 h-5" /> : '2'}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">2. Documents Stored</div>
              <div className="text-[11px] text-slate-500">{documents.length} verified files</div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex sm:flex-col items-center sm:items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              isUnderReview
                ? status === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : status === 'rejected'
                  ? 'bg-rose-600 text-white'
                  : 'bg-amber-500 text-white ring-4 ring-amber-100'
                : 'bg-slate-100 text-slate-400'
            }`}>
              {status === 'approved' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : status === 'rejected' ? (
                <XCircle className="w-5 h-5" />
              ) : isUnderReview ? (
                <Clock className="w-5 h-5" />
              ) : (
                '3'
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">3. Under Review</div>
              <div className="text-[11px] text-slate-500">Compliance & vehicle check</div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex sm:flex-col items-center sm:items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              status === 'approved'
                ? 'bg-emerald-600 text-white'
                : status === 'rejected'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-400'
            }`}>
              {status === 'approved' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : status === 'rejected' ? (
                <XCircle className="w-5 h-5" />
              ) : (
                '4'
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">4. Decision</div>
              <div className="text-[11px] text-slate-500">
                {status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending review'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile & Vehicle Details */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-emerald-600" />
            Registered Courier Profile
          </h3>
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-slate-400">Driver Name</dt>
              <dd className="font-semibold text-slate-800">{profile.firstName} {profile.lastName}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Date of Birth</dt>
              <dd className="font-semibold text-slate-800">{profile.dateOfBirth}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Email</dt>
              <dd className="font-semibold text-slate-800">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Phone</dt>
              <dd className="font-semibold text-slate-800">{profile.phone}</dd>
            </div>
            <div>
              <dt className="text-slate-400">National ID / Passport</dt>
              <dd className="font-semibold text-slate-800 font-mono">{profile.nationalIdNumber}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Driver Licence</dt>
              <dd className="font-semibold text-slate-800 font-mono">{profile.driverLicenceNumber}</dd>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-100">
              <dt className="text-slate-400">Assigned Vehicle</dt>
              <dd className="font-semibold text-slate-800">
                {vehicle?.vehicleType}
                {vehicle?.vehicleType !== 'Bicycle' && vehicle && (
                  <span> — {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.registrationNumber})</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Uploaded Documents List */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-600" />
            Submitted Documents ({documents.length})
          </h3>
          <div className="space-y-2">
            {documents.map(doc => (
              <div
                key={doc.id}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div className="truncate max-w-[200px]">
                  <div className="font-semibold text-slate-800 truncate">
                    {doc.document_type.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {doc.file_name}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    doc.verification_status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : doc.verification_status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {doc.verification_status}
                  </span>

                  <button
                    type="button"
                    onClick={() => setActiveModalDoc(doc)}
                    className="p-1 rounded hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                    title="View Document"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Document Modal */}
      <DocumentViewerModal
        document={activeModalDoc}
        onClose={() => setActiveModalDoc(null)}
      />
    </div>
  );
};
