import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Vehicle, VehicleType } from '../../types';
import { api } from '../../lib/api';
import { 
  Bike, 
  Car, 
  Truck, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  FileCheck2,
  ShieldAlert,
  Info
} from 'lucide-react';

interface VehicleStepProps {
  initialVehicle: Vehicle | null;
  onNext: (updatedVehicle: Vehicle) => void;
  onBack: () => void;
  onSaveProgress: (updatedVehicle: Vehicle) => void;
}

const VEHICLE_OPTIONS: {
  type: VehicleType;
  title: string;
  desc: string;
  icon: React.ReactNode;
  reqs: string[];
}[] = [
  {
    type: 'Bicycle',
    title: 'Bicycle / E-Bike',
    desc: 'Local eco-friendly courier routes. Zero emissions.',
    icon: <Bike className="w-6 h-6" />,
    reqs: ['National ID / Passport', 'Rider / Photo ID']
  },
  {
    type: 'Motorcycle',
    title: 'Motorcycle / Scooter',
    desc: 'Rapid urban express delivery and agile parcel dispatch.',
    icon: <Bike className="w-6 h-6 rotate-12" />,
    reqs: ['National ID', 'Driver Licence', 'Vehicle Registration', 'Motorcycle Insurance']
  },
  {
    type: 'Car',
    title: 'Standard Car / Sedan',
    desc: 'Mid-sized courier packages, multi-drop residential deliveries.',
    icon: <Car className="w-6 h-6" />,
    reqs: ['National ID', 'Driver Licence', 'Vehicle Registration', 'Commercial Auto Insurance']
  },
  {
    type: 'Van',
    title: 'Cargo Van / Large Fleet',
    desc: 'Bulk freight, pallet delivery, and high-volume commercial logistics.',
    icon: <Truck className="w-6 h-6" />,
    reqs: ['National ID', 'Commercial Licence', 'Vehicle Registration', 'Commercial Fleet Insurance']
  }
];

export const VehicleStep: React.FC<VehicleStepProps> = ({
  initialVehicle,
  onNext,
  onBack,
  onSaveProgress
}) => {
  const [vehicleType, setVehicleType] = useState<VehicleType>(initialVehicle?.vehicleType || 'Car');
  const [formData, setFormData] = useState({
    make: initialVehicle?.make || '',
    model: initialVehicle?.model || '',
    year: initialVehicle?.year || '',
    registrationNumber: initialVehicle?.registrationNumber || '',
    colour: initialVehicle?.colour || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (initialVehicle) {
      setVehicleType(initialVehicle.vehicleType);
      setFormData({
        make: initialVehicle.make || '',
        model: initialVehicle.model || '',
        year: initialVehicle.year || '',
        registrationNumber: initialVehicle.registrationNumber || '',
        colour: initialVehicle.colour || ''
      });
    }
  }, [initialVehicle]);

  const handleTypeSelect = async (type: VehicleType) => {
    setVehicleType(type);
    setSaveStatus('saving');
    try {
      const res = await api.saveVehicle({
        vehicleType: type,
        ...formData
      });
      onSaveProgress(res.vehicle);
      setSaveStatus('saved');
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      const res = await api.saveVehicle({
        vehicleType,
        ...formData
      });
      onSaveProgress(res.vehicle);
      setSaveStatus('saved');
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const fieldErrors: Record<string, string> = {};
    if (vehicleType !== 'Bicycle') {
      if (!formData.make.trim()) fieldErrors.make = 'Vehicle make is required';
      if (!formData.model.trim()) fieldErrors.model = 'Vehicle model is required';
      if (!formData.year.trim()) fieldErrors.year = 'Vehicle year is required';
      if (!formData.registrationNumber.trim()) fieldErrors.registrationNumber = 'Registration plate number is required';
      if (!formData.colour.trim()) fieldErrors.colour = 'Vehicle colour is required';
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSaveStatus('saving');
    try {
      const res = await api.saveVehicle({
        vehicleType,
        ...formData
      });
      setSaveStatus('saved');
      onNext(res.vehicle);
    } catch (err: any) {
      setSaveStatus('error');
      setErrors({ form: err.message || 'Failed to save vehicle details.' });
    }
  };

  const selectedOption = VEHICLE_OPTIONS.find(o => o.type === vehicleType)!;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Step 3: Vehicle Details
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Select your logistics delivery vehicle category and provide vehicle specs.
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
        {/* Vehicle Type Selection Cards */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
            Select Courier Vehicle Type <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {VEHICLE_OPTIONS.map(opt => {
              const isSelected = vehicleType === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleTypeSelect(opt.type)}
                  className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div>
                    <div className={`p-2.5 rounded-lg inline-flex mb-3 ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {opt.icon}
                    </div>
                    <div className="font-semibold text-slate-900 text-sm">{opt.title}</div>
                    <div className="text-xs text-slate-500 mt-1 leading-snug">{opt.desc}</div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Document Requirement Adaptive Notice */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            <span>Document Requirements for <strong className="text-emerald-700">{selectedOption.title}</strong>:</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {selectedOption.reqs.map((req, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium shadow-2xs">
                <Check className="w-3 h-3 text-emerald-600" />
                {req}
              </span>
            ))}
          </div>
          {vehicleType === 'Bicycle' && (
            <p className="mt-2 text-slate-500 italic text-[11px]">
              Note: Bicycles do not require motor vehicle registration plates or commercial auto insurance documents.
            </p>
          )}
        </div>

        {/* Vehicle Specification Fields (conditional for motorized vehicles) */}
        {vehicleType !== 'Bicycle' ? (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
              Vehicle Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Make <span className="text-rose-500">*</span>
                </label>
                <input
                  id="veh-make"
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. Toyota, Ford, Honda"
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.make ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  required
                />
                {errors.make && <p className="text-xs text-rose-600 mt-1">{errors.make}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Model <span className="text-rose-500">*</span>
                </label>
                <input
                  id="veh-model"
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. Prius, Transit, CB500X"
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.model ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  required
                />
                {errors.model && <p className="text-xs text-rose-600 mt-1">{errors.model}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Year <span className="text-rose-500">*</span>
                </label>
                <input
                  id="veh-year"
                  type="text"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. 2022"
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.year ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  required
                />
                {errors.year && <p className="text-xs text-rose-600 mt-1">{errors.year}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Registration Number / Plate <span className="text-rose-500">*</span>
                </label>
                <input
                  id="veh-reg"
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. 7XYZ892"
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.registrationNumber ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono`}
                  required
                />
                {errors.registrationNumber && (
                  <p className="text-xs text-rose-600 mt-1">{errors.registrationNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Vehicle Colour <span className="text-rose-500">*</span>
                </label>
                <input
                  id="veh-colour"
                  type="text"
                  name="colour"
                  value={formData.colour}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. Silver, White, Red"
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.colour ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  required
                />
                {errors.colour && <p className="text-xs text-rose-600 mt-1">{errors.colour}</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-800">
            <span className="font-semibold">Bicycle Mode:</span> No engine registration plate or commercial motor registration is required. You will proceed directly to identity document upload on the next step.
          </div>
        )}

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
            id="vehicle-next-btn"
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
