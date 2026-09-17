import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { DriverProfile } from '../../types';
import { api } from '../../lib/api';
import { Check, CloudCheck, ArrowRight, User, Phone, MapPin, AlertCircle, Calendar } from 'lucide-react';

const personalSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required').refine(val => {
    const age = (Date.now() - new Date(val).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 18;
  }, 'Driver must be at least 18 years old'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(7, 'Valid phone number is required'),
  residentialAddress: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(7, 'Emergency contact phone is required')
});

interface PersonalStepProps {
  initialProfile: DriverProfile;
  onNext: (updatedProfile: DriverProfile) => void;
  onSaveProgress: (updatedProfile: DriverProfile) => void;
}

export const PersonalStep: React.FC<PersonalStepProps> = ({
  initialProfile,
  onNext,
  onSaveProgress
}) => {
  const [formData, setFormData] = useState({
    firstName: initialProfile.firstName || '',
    lastName: initialProfile.lastName || '',
    dateOfBirth: initialProfile.dateOfBirth || '',
    email: initialProfile.email || '',
    phone: initialProfile.phone || '',
    residentialAddress: initialProfile.residentialAddress || '',
    city: initialProfile.city || '',
    country: initialProfile.country || 'United States',
    emergencyContactName: initialProfile.emergencyContactName || '',
    emergencyContactPhone: initialProfile.emergencyContactPhone || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Sync if initialProfile changes externally
  useEffect(() => {
    setFormData({
      firstName: initialProfile.firstName || '',
      lastName: initialProfile.lastName || '',
      dateOfBirth: initialProfile.dateOfBirth || '',
      email: initialProfile.email || '',
      phone: initialProfile.phone || '',
      residentialAddress: initialProfile.residentialAddress || '',
      city: initialProfile.city || '',
      country: initialProfile.country || 'United States',
      emergencyContactName: initialProfile.emergencyContactName || '',
      emergencyContactPhone: initialProfile.emergencyContactPhone || ''
    });
  }, [initialProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = async () => {
    // Autosave on blur to backend database
    setSaveStatus('saving');
    try {
      const res = await api.savePersonal(formData);
      onSaveProgress(res.profile);
      setSaveStatus('saved');
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = personalSchema.safeParse(formData);
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
      const res = await api.savePersonal(formData);
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
            Step 1: Personal Details
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Provide your contact and residential information for courier verification.
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

      {errors.form && (
        <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errors.form}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Name Details */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Legal Name & Date of Birth
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="personal-first-name"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.firstName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                placeholder="Marcus"
                required
              />
              {errors.firstName && <p className="text-xs text-rose-600 mt-1">{errors.firstName}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="personal-last-name"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.lastName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                placeholder="Vance"
                required
              />
              {errors.lastName && <p className="text-xs text-rose-600 mt-1">{errors.lastName}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="personal-dob"
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.dateOfBirth ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  required
                />
              </div>
              {errors.dateOfBirth && <p className="text-xs text-rose-600 mt-1">{errors.dateOfBirth}</p>}
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Verified Email <span className="text-rose-500">*</span>
              </label>
              <input
                id="personal-email"
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed"
                title="Verified via OTP during account creation"
              />
              <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1">
                <Check className="w-3 h-3" /> Contact verified with OTP
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Verified Mobile Phone <span className="text-rose-500">*</span>
              </label>
              <input
                id="personal-phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                placeholder="+1 555-0199"
                required
              />
              {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>}
            </div>
          </div>
        </div>

        {/* Residential Address */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Residential Address
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Street Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="personal-address"
                type="text"
                name="residentialAddress"
                value={formData.residentialAddress}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="742 Evergreen Terrace, Apt 2B"
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.residentialAddress ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                required
              />
              {errors.residentialAddress && <p className="text-xs text-rose-600 mt-1">{errors.residentialAddress}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  id="personal-city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Metro City"
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.city ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  required
                />
                {errors.city && <p className="text-xs text-rose-600 mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Country <span className="text-rose-500">*</span>
                </label>
                <input
                  id="personal-country"
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="United States"
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.country ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  required
                />
                {errors.country && <p className="text-xs text-rose-600 mt-1">{errors.country}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            Emergency Contact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Emergency Contact Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="personal-emergency-name"
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Laura Vance"
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.emergencyContactName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                required
              />
              {errors.emergencyContactName && <p className="text-xs text-rose-600 mt-1">{errors.emergencyContactName}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Emergency Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                id="personal-emergency-phone"
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="+1 555-0198"
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.emergencyContactPhone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                required
              />
              {errors.emergencyContactPhone && <p className="text-xs text-rose-600 mt-1">{errors.emergencyContactPhone}</p>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
          <button
            id="personal-next-btn"
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
