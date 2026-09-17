import React, { useState } from 'react';
import { DriverProfile, Vehicle, DocumentRecord, Application } from '../../types';
import { api } from '../../lib/api';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Send, 
  Edit3, 
  User, 
  Shield, 
  Car, 
  FileText,
  FileCheck2,
  Lock,
  Eye
} from 'lucide-react';
import { OnboardingStepId } from './ProgressIndicator';

interface ReviewStepProps {
  profile: DriverProfile;
  vehicle: Vehicle | null;
  documents: DocumentRecord[];
  onNavigateStep: (step: OnboardingStepId) => void;
  onSubmitSuccess: (application: Application) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  profile,
  vehicle,
  documents,
  onNavigateStep,
  onSubmitSuccess
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [activeModalDoc, setActiveModalDoc] = useState<DocumentRecord | null>(null);

  const isBicycle = vehicle?.vehicleType === 'Bicycle';

  // Validation checks for UI display
  const hasPersonal = Boolean(
    profile.firstName && 
    profile.lastName && 
    profile.dateOfBirth && 
    profile.residentialAddress && 
    profile.city && 
    profile.country && 
    profile.emergencyContactName && 
    profile.emergencyContactPhone
  );

  const hasIdentity = Boolean(
    profile.nationalIdNumber && 
    profile.driverLicenceNumber && 
    profile.driverLicenceExpiryDate
  );

  const hasVehicle = Boolean(
    vehicle && 
    vehicle.vehicleType && 
    (isBicycle || (vehicle.make && vehicle.model && vehicle.year && vehicle.registrationNumber))
  );

  const hasDoc = (type: string) => documents.some(d => d.document_type === type);
  const hasRequiredDocs = isBicycle
    ? hasDoc('national_id') && hasDoc('driver_licence')
    : hasDoc('national_id') && hasDoc('driver_licence') && hasDoc('vehicle_registration') && hasDoc('insurance_certificate');

  const isReadyToSubmit = hasPersonal && hasIdentity && hasVehicle && hasRequiredDocs;

  const handleSubmit = async () => {
    if (!isReadyToSubmit) {
      setError('Please resolve all incomplete sections highlighted below before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setErrorDetails([]);

    try {
      const res = await api.submitApplication();
      onSubmitSuccess(res.application);
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
      if (err.details) {
        setErrorDetails(err.details);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
      {/* Header */}
      <div className="pb-6 mb-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Step 5: Review & Submit Application
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Carefully verify all submitted details. Once submitted, your application will be locked for administrative compliance review.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-900 text-white self-start sm:self-center">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Final Review Stage</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          {errorDetails.length > 0 && (
            <ul className="list-disc pl-6 mt-2 space-y-1 text-xs">
              {errorDetails.map((det, i) => (
                <li key={i}>{det}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Sections Review */}
      <div className="space-y-6">
        {/* 1. Personal Information */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
              <User className="w-4 h-4 text-emerald-600" />
              <span>1. Personal Information</span>
              {hasPersonal ? (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Complete
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">
                  Incomplete
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onNavigateStep('personal')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Full Legal Name</span>
              <span className="font-semibold text-slate-800 text-sm">{profile.firstName} {profile.lastName}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Date of Birth</span>
              <span className="font-semibold text-slate-800 text-sm">{profile.dateOfBirth || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Contact Email</span>
              <span className="font-semibold text-slate-800 text-sm">{profile.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Contact Phone</span>
              <span className="font-semibold text-slate-800 text-sm">{profile.phone}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block mb-0.5">Residential Address</span>
              <span className="font-semibold text-slate-800 text-sm">
                {profile.residentialAddress ? `${profile.residentialAddress}, ${profile.city}, ${profile.country}` : 'Not provided'}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block mb-0.5">Emergency Contact</span>
              <span className="font-semibold text-slate-800 text-sm">
                {profile.emergencyContactName ? `${profile.emergencyContactName} (${profile.emergencyContactPhone})` : 'Not provided'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Identity Verification */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>2. Identity Verification</span>
              {hasIdentity ? (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Complete
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">
                  Incomplete
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onNavigateStep('identity')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">National ID / Passport</span>
              <span className="font-semibold text-slate-800 text-sm font-mono">{profile.nationalIdNumber || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Driver Licence Number</span>
              <span className="font-semibold text-slate-800 text-sm font-mono">{profile.driverLicenceNumber || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Licence Expiry</span>
              <span className="font-semibold text-slate-800 text-sm font-mono">{profile.driverLicenceExpiryDate || 'Not provided'}</span>
            </div>
          </div>
        </div>

        {/* 3. Vehicle Details */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
              <Car className="w-4 h-4 text-emerald-600" />
              <span>3. Vehicle Specifications</span>
              {hasVehicle ? (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Complete
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">
                  Incomplete
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onNavigateStep('vehicle')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Vehicle Category</span>
              <span className="font-semibold text-slate-800 text-sm">{vehicle?.vehicleType || 'Not selected'}</span>
            </div>
            {vehicle?.vehicleType !== 'Bicycle' ? (
              <>
                <div>
                  <span className="text-slate-400 block mb-0.5">Make & Model</span>
                  <span className="font-semibold text-slate-800 text-sm">{vehicle?.make} {vehicle?.model}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Year / Colour</span>
                  <span className="font-semibold text-slate-800 text-sm">{vehicle?.year} · {vehicle?.colour}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Registration Plate</span>
                  <span className="font-semibold text-slate-800 text-sm font-mono">{vehicle?.registrationNumber}</span>
                </div>
              </>
            ) : (
              <div className="sm:col-span-3 text-slate-500 italic">
                Bicycle courier profile. Motor vehicle registrations exempt.
              </div>
            )}
          </div>
        </div>

        {/* 4. Uploaded Documents Status */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span>4. Uploaded Documents</span>
              {hasRequiredDocs ? (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> All Required Files Attached
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">
                  Missing Required Files
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onNavigateStep('documents')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { type: 'national_id', label: 'National ID / Passport', req: true },
                { type: 'driver_licence', label: 'Driver Licence', req: true },
                ...(!isBicycle ? [
                  { type: 'vehicle_registration', label: 'Vehicle Registration', req: true },
                  { type: 'insurance_certificate', label: 'Commercial Auto Insurance', req: true }
                ] : [])
              ].map(item => {
                const doc = documents.find(d => d.document_type === item.type);
                return (
                  <div
                    key={item.type}
                    className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                      doc
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {doc ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-800">{item.label}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {doc ? doc.file_name : 'Not yet uploaded'}
                        </div>
                      </div>
                    </div>

                    {doc && (
                      <button
                        type="button"
                        onClick={() => setActiveModalDoc(doc)}
                        className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 text-[11px] font-medium hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation & Final Submission Action */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => onNavigateStep('documents')}
          className="w-full sm:w-auto py-2.5 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm transition flex items-center justify-center gap-1.5 self-auto sm:self-start cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          id="submit-application-btn"
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !isReadyToSubmit}
          className="w-full sm:w-auto py-3 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting for Review...
            </span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Application
            </>
          )}
        </button>
      </div>

      {/* Document modal */}
      <DocumentViewerModal
        document={activeModalDoc}
        onClose={() => setActiveModalDoc(null)}
      />
    </div>
  );
};
