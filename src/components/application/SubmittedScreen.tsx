import React from 'react';
import { Application } from '../../types';
import { CheckCircle2, Clock, ArrowRight, LogOut, ShieldCheck, FileCheck2 } from 'lucide-react';

interface SubmittedScreenProps {
  application: Application;
  onViewStatus: () => void;
  onSignOut: () => void;
}

export const SubmittedScreen: React.FC<SubmittedScreenProps> = ({
  application,
  onViewStatus,
  onSignOut
}) => {
  return (
    <div className="w-full max-w-xl mx-auto py-8">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 text-center">
        {/* Animated Checkmark Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-emerald-50">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Application Submitted!
        </h1>

        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
          Your courier driver application has been successfully submitted to Logiswift Operations and is now awaiting compliance review.
        </p>

        {/* Status card */}
        <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left max-w-md mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Current Status
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              <Clock className="w-3.5 h-3.5" />
              Under Review
            </span>
          </div>

          <div className="pt-3 text-xs text-slate-600 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Application ID:</span>
              <span className="font-mono font-medium text-slate-800">{application.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Submitted at:</span>
              <span className="font-medium text-slate-800">
                {application.submitted_at 
                  ? new Date(application.submitted_at).toLocaleString() 
                  : new Date().toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          We'll notify you via your registered email/phone once the compliance team has verified your identity and vehicle documents.
        </div>

        {/* Actions */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="view-status-btn"
            type="button"
            onClick={onViewStatus}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View Application Status</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="sign-out-btn"
            type="button"
            onClick={onSignOut}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
