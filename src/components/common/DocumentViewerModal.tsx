import React from 'react';
import { DocumentRecord } from '../../types';
import { X, Download, FileText, CheckCircle2, Clock, AlertTriangle, ExternalLink } from 'lucide-react';

interface DocumentViewerModalProps {
  document: DocumentRecord | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  onClose
}) => {
  if (!document) return null;

  const fileUrl = `/api/documents/${document.id}/file`;
  const isImage = document.mime_type.startsWith('image/');
  const isPdf = document.mime_type === 'application/pdf';

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                {document.document_type.replace(/_/g, ' ').toUpperCase()}
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-md">
                {document.file_name} ({formatFileSize(document.file_size)})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Open raw file in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-slate-100 p-4 sm:p-6 overflow-auto flex items-center justify-center min-h-[350px]">
          {isImage ? (
            <img
              src={fileUrl}
              alt={document.file_name}
              className="max-h-[500px] max-w-full rounded-lg shadow-md object-contain border border-slate-200 bg-white"
            />
          ) : isPdf ? (
            <iframe
              src={`${fileUrl}#toolbar=0`}
              title={document.file_name}
              className="w-full h-[500px] rounded-lg shadow-md border border-slate-200 bg-white"
            />
          ) : (
            <div className="text-center p-8 bg-white rounded-xl shadow-xs border border-slate-200">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <div className="text-sm font-semibold text-slate-800">{document.file_name}</div>
              <div className="text-xs text-slate-500 mt-1">{document.mime_type}</div>
              <a
                href={fileUrl}
                download={document.file_name}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium"
              >
                <Download className="w-4 h-4" /> Download File
              </a>
            </div>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span>
              <strong>Status:</strong>{' '}
              <span className={`inline-flex items-center gap-1 font-semibold ${
                document.verification_status === 'approved' 
                  ? 'text-emerald-700' 
                  : document.verification_status === 'rejected'
                  ? 'text-rose-600'
                  : 'text-amber-600'
              }`}>
                {document.verification_status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {document.verification_status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                {document.verification_status === 'rejected' && <AlertTriangle className="w-3.5 h-3.5" />}
                {document.verification_status.toUpperCase()}
              </span>
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline">
              <strong>Uploaded:</strong> {new Date(document.uploaded_at).toLocaleDateString()}
            </span>
          </div>

          <div className="font-mono text-[11px] text-slate-500 truncate max-w-xs">
            Path: {document.storage_path}
          </div>
        </div>
      </div>
    </div>
  );
};
