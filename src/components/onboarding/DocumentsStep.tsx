import React, { useState } from 'react';
import { DocumentRecord, DocumentType, VehicleType } from '../../types';
import { api } from '../../lib/api';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  FileCheck,
  ShieldCheck,
  Info
} from 'lucide-react';

interface DocumentsStepProps {
  vehicleType: VehicleType;
  initialDocuments: DocumentRecord[];
  onNext: () => void;
  onBack: () => void;
  onDocumentsUpdated: (documents: DocumentRecord[]) => void;
}

interface DocSlotConfig {
  type: DocumentType;
  title: string;
  description: string;
  required: boolean;
  acceptedFormats: string;
}

export const DocumentsStep: React.FC<DocumentsStepProps> = ({
  vehicleType,
  initialDocuments,
  onNext,
  onBack,
  onDocumentsUpdated
}) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeModalDoc, setActiveModalDoc] = useState<DocumentRecord | null>(null);

  // Configure required slots depending on vehicle type
  const isBicycle = vehicleType === 'Bicycle';

  const docSlots: DocSlotConfig[] = [
    {
      type: 'national_id',
      title: 'National ID or Passport Scan',
      description: 'Government-issued passport, national identity card, or citizenship paper.',
      required: true,
      acceptedFormats: 'PDF, JPG, PNG (Max 10MB)'
    },
    {
      type: 'driver_licence',
      title: isBicycle ? 'Rider / Photo ID' : 'Valid Driver Licence (Front/Back)',
      description: isBicycle
        ? 'Government photo ID confirming your identity and age.'
        : 'Official valid motor vehicle driver licence with matching categories.',
      required: true,
      acceptedFormats: 'PDF, JPG, PNG (Max 10MB)'
    },
    ...(!isBicycle ? [
      {
        type: 'vehicle_registration' as DocumentType,
        title: 'Vehicle Registration Document',
        description: 'Official motor vehicle registration certificate showing registration plate and VIN.',
        required: true,
        acceptedFormats: 'PDF, JPG, PNG (Max 10MB)'
      },
      {
        type: 'insurance_certificate' as DocumentType,
        title: 'Commercial or Courier Insurance Policy',
        description: 'Proof of valid third-party or comprehensive courier/commercial insurance coverage.',
        required: true,
        acceptedFormats: 'PDF, JPG, PNG (Max 10MB)'
      },
      {
        type: 'inspection_certificate' as DocumentType,
        title: 'Roadworthy Inspection Certificate',
        description: 'Periodic safety certificate or municipal inspection certificate (if applicable).',
        required: false,
        acceptedFormats: 'PDF, JPG, PNG (Max 10MB)'
      }
    ] : [])
  ];

  const handleFileUpload = async (type: DocumentType, file: File) => {
    // Validate format
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const fileType = (file?.type || '').toLowerCase();
    if (!allowed.includes(fileType)) {
      setError('Invalid format. Only PDF, JPG, JPEG, and PNG files are accepted.');
      return;
    }

    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is 10MB.`);
      return;
    }

    setError(null);
    setUploadingType(type);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', type);

      const res = await api.uploadDocument(formData);
      
      // Update local state and notify parent
      const updated = [...documents.filter(d => d.document_type !== type), res.document];
      setDocuments(updated);
      onDocumentsUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document to storage.');
    } finally {
      setUploadingType(null);
    }
  };

  const handleDelete = async (docId: string) => {
    setError(null);
    try {
      await api.deleteDocument(docId);
      const updated = documents.filter(d => d.id !== docId);
      setDocuments(updated);
      onDocumentsUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to delete document.');
    }
  };

  const handleContinue = () => {
    // Check if all required documents are uploaded
    const missing = docSlots.filter(s => s.required && !documents.some(d => d.document_type === s.type));
    if (missing.length > 0) {
      setError(`Please upload all required documents: ${missing.map(m => m.title).join(', ')}`);
      return;
    }
    onNext();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Step 4: Document Uploads
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Upload clear digital scans or photos for identity and vehicle compliance review.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Encrypted Cloud Storage</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="leading-snug">{error}</div>
        </div>
      )}

      {/* Notice info */}
      <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          Ensure all edges of the document are visible, text is crisp and readable, and there is no glare. Files are stored securely in driver-specific storage partitions (<code className="font-mono text-slate-800">documents/&#123;driver_id&#125;/</code>).
        </div>
      </div>

      {/* Document Slots List */}
      <div className="space-y-4">
        {docSlots.map(slot => {
          const uploaded = documents.find(d => d.document_type === slot.type);
          const isUploading = uploadingType === slot.type;

          return (
            <div
              key={slot.type}
              className={`p-4 sm:p-5 rounded-xl border transition-all ${
                uploaded
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Title & Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      {slot.title}
                    </span>
                    {slot.required ? (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                        Required
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {slot.description}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Accepted: {slot.acceptedFormats}
                  </p>
                </div>

                {/* Upload Status or Action */}
                <div className="shrink-0 flex items-center gap-2">
                  {uploaded ? (
                    <div className="flex items-center gap-2">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                          {uploaded.file_name}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready for review
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveModalDoc(uploaded)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                        title="Preview Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(uploaded.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs text-white transition shadow-xs cursor-pointer ${
                          isUploading
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" />
                            <span>Upload File</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(slot.type, file);
                            // reset input so same file can be selected again
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      {/* Action buttons */}
      <div className="pt-8 mt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto py-2.5 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          id="documents-next-btn"
          type="button"
          onClick={handleContinue}
          className="w-full sm:w-auto py-2.5 px-7 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Document Modal */}
      <DocumentViewerModal
        document={activeModalDoc}
        onClose={() => setActiveModalDoc(null)}
      />
    </div>
  );
};
