import React, { useState } from 'react';
import { api, setStoredToken } from '../../lib/api';
import { AuthUser } from '../../types';
import { Truck, ShieldCheck, Lock, Mail, Phone, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LoginFormProps {
  onSuccess: (user: AuthUser) => void;
  onNavigateRegister: () => void;
  onRequiresVerification: (data: { email: string; phone: string; demoOtp?: string }) => void;
  onQuickSwitch: (role: 'driver' | 'admin', email?: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onNavigateRegister,
  onRequiresVerification,
  onQuickSwitch
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please provide your email or phone and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.login({ identifier: identifier.trim(), password });
      setStoredToken(res.token);
      onSuccess(res.user);
    } catch (err: any) {
      if (err.requiresVerification) {
        onRequiresVerification({
          email: err.email,
          phone: err.phone,
          demoOtp: err.demoOtp
        });
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 mb-4 shadow-sm">
          <Truck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign In to Your Account
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Access your driver onboarding application or administrative portal
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address or Phone
            </label>
            <div className="relative">
              <input
                id="login-identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="driver@example.com or +1 555-0199"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors pl-10"
                required
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors pl-10"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            Applying as a new courier driver?{' '}
            <button
              onClick={onNavigateRegister}
              className="font-semibold text-emerald-600 hover:text-emerald-700 underline focus:outline-none cursor-pointer"
            >
              Start driver registration
            </button>
          </p>
        </div>
      </div>

      {/* Pre-seeded quick login credentials box */}
      <div className="mt-6 bg-slate-50 border border-slate-200/90 rounded-xl p-4 text-xs">
        <div className="font-semibold text-slate-800 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Assessment Seed Accounts
          </span>
          <span className="text-[10px] text-slate-500 uppercase font-mono">1-Click Auto Fill</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            type="button"
            onClick={() => {
              setIdentifier('driver@example.com');
              setPassword('Driver123!');
            }}
            className="p-2 text-left rounded-lg bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition group cursor-pointer"
          >
            <div className="font-semibold text-slate-800 flex items-center justify-between">
              Driver
              <span className="text-[10px] text-emerald-600 font-mono">Fill</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">driver@example.com</div>
            <div className="text-[10px] text-slate-400">Pass: Driver123!</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIdentifier('admin@example.com');
              setPassword('Admin123!');
            }}
            className="p-2 text-left rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition group cursor-pointer"
          >
            <div className="font-semibold text-slate-800 flex items-center justify-between">
              Admin
              <span className="text-[10px] text-blue-600 font-mono">Fill</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">admin@example.com</div>
            <div className="text-[10px] text-slate-400">Pass: Admin123!</div>
          </button>
        </div>
      </div>
    </div>
  );
};
