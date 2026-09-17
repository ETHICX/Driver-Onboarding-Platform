import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { DriverProfile } from '../../types';
import { api } from '../../lib/api';
import { Check, ArrowRight, ArrowLeft, ShieldCheck, AlertCircle, FileText, Info } from 'lucide-react';

const identitySchema = z.object({
  nationalIdNumber: z.string().min(5, 'National ID or Passport number is required (min. 5 chars)'),
  driverLicenceNumber: z.string().min(5, 'Driver licence number is required'),
  driverLicenceExpiryDate: z.string().min(1, 'Licence expiry date is required').refine(val => {
    return new Date(val).getTime() > Date.now();
  }, 'Licence must not be expired')
});

interface IdentityStepProps {
  initialProfile: DriverProfile;
  onNext: (updatedProfile: DriverProfile) => void;
  onBack: () => void;
  onSaveProgress: (updatedProfile: DriverProfile) => void;
}

export const IdentityStep: React.FC<IdentityStepProps> = ({
  initialProfile,
  onNext,
  onBack,
  onSaveProgress
}) => {
  const [formData, setFormData] = useState({
    nationalIdNumber: initialProfile.nationalIdNumber || '',
    driverLicenceNumber: initialProfile.driverLicenceNumber || '',
    driverLicenceExpiryDate: initialProfile.driverLicenceExpiryDate || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      nationalIdNumber: initialProfile.nationalIdNumber || '',
      driverLicenceNumber: initialProfile.driverLicenceNumber || '',
      driverLicenceExpiryDate: initialProfile.driverLicenceExpiryDate || ''
    });
  }, [initialProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = async () => {
    setSaveStatus('saving');
    try {
      const res = await api.saveIdentity(formData);
      onSaveProgress(res.profile);
      setSaveStatus('saved');
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = identitySchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setSaveStatus('saving');
    try {
      const res = await api.saveIdentity(formData);
      setSaveStatus('saved');
      onNext(res.profile);
    } catch (err: any) {
      setSaveStatus('error');
      setErrors({ form: err.message || 'Failed to save to database.' });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Step 2: Identity Verification
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Enter your official government ID and driver licence credentials.
          </p>
        </div>

        {/* Real-time Persistence Status */}
        <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 self-start sm:self-center">
          {saveStatus === 'saving' && (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              <span>Saving to database...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Autosaved to DB ({lastSavedAt})</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-rose-600">Autosave failed</span>
            </>
          )}
          {saveStatus === 'idle' && (
            <>
              <Check className="w-3.5 h-3.5 text-slate-400" />
              <span>Database synced</span>
            </>
          )}
        </div>
      </div>

      {/* Explanatory guidelines notice */}
      <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-2">
        <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
          <Info className="w-4 h-4 text-emerald-600" />
          Document Requirement Guidance
        </div>
        <p className="leading-relaxed">
          In Step 4, you will upload original photos or PDF scans of your documents matching these exact numbers.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-600">
          <li><strong>National ID / Passport:</strong> Valid passport, government-issued national identity card, or citizenship card.</li>
          <li><strong>Driver Licence:</strong> Unrestricted licence appropriate for your courier vehicle type. Must have at least 3 months validity remaining.</li>
          <li><strong>Accepted Formats in Step 4:</strong> High-resolution PDF, JPG, JPEG, or PNG (maximum 10MB per file).</li>
        </ul>
      </div>

      {errors.form && (
        <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errors.form}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            National ID / Passport Number <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="identity-national-id"
              type="text"
              name="nationalIdNumber"
              value={formData.nationalIdNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. NAT-94827104 or Passport #12345678"
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${
                errors.nationalIdNumber ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              required
            />
          </div>
          {errors.nationalIdNumber && (
            <p className="text-xs text-rose-600 mt-1">{errors.nationalIdNumber}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Driver Licence Number <span className="text-rose-500">*</span>
            </label>
            <input
              id="identity-licence-number"
              type="text"
              name="driverLicenceNumber"
              value={formData.driverLicenceNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. DL-88371920"
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${
                errors.driverLicenceNumber ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              required
            />
            {errors.driverLicenceNumber && (
              <p className="text-xs text-rose-600 mt-1">{errors.driverLicenceNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Licence Expiry Date <span className="text-rose-500">*</span>
            </label>
            <input
              id="identity-licence-expiry"
              type="date"
              name="driverLicenceExpiryDate"
              value={formData.driverLicenceExpiryDate}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${
                errors.driverLicenceExpiryDate ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              required
            />
            {errors.driverLicenceExpiryDate && (
              <p className="text-xs text-rose-600 mt-1">{errors.driverLicenceExpiryDate}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto py-2.5 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            id="identity-next-btn"
            type="submit"
            className="w-full sm:w-auto py-2.5 px-7 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
