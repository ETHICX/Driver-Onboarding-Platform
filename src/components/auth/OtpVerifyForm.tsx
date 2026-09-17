import React, { useState, useEffect, useRef } from 'react';
import { api, setStoredToken } from '../../lib/api';
import { AuthUser } from '../../types';
import { ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2, RotateCw, KeyRound, Sparkles } from 'lucide-react';

interface OtpVerifyFormProps {
  email: string;
  phone: string;
  initialDemoOtp?: string;
  onSuccess: (user: AuthUser) => void;
  onChangeContact: () => void;
}

export const OtpVerifyForm: React.FC<OtpVerifyFormProps> = ({
  email,
  phone,
  initialDemoOtp,
  onSuccess,
  onChangeContact
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(60);
  const [demoOtp, setDemoOtp] = useState<string | undefined>(initialDemoOtp);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown(c => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    // Only accept numeric characters
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    // If pasted multiple digits
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      const next = [...digits];
      pasted.forEach((char, i) => {
        if (i < 6) next[i] = char;
      });
      setDigits(next);
      const targetIdx = Math.min(pasted.length, 5);
      inputRefs.current[targetIdx]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = clean[0];
    setDigits(next);

    // Auto-advance
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.verifyOtp({ email, code });
      setStoredToken(res.token);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError(null);
    setResendSuccess(null);

    try {
      const res = await api.resendOtp(email);
      setCountdown(60);
      setResendSuccess(res.message);
      if (res.demoOtp) {
        setDemoOtp(res.demoOtp);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  const handleFillDemo = () => {
    if (!demoOtp || demoOtp.length !== 6) return;
    const split = demoOtp.split('');
    setDigits(split);
    handleVerify(demoOtp);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 mb-4 shadow-sm">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Verify Your Contact Method
        </h1>
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
          We've sent a 6-digit verification code to
          <br />
          <span className="font-semibold text-slate-800">{email}</span>
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        {/* Testing hint banner */}
        {demoOtp && (
          <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Simulated OTP: <strong className="font-mono text-sm tracking-widest">{demoOtp}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[11px] transition cursor-pointer"
            >
              Auto-Verify
            </button>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {resendSuccess && (
          <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resendSuccess}</span>
          </div>
        )}

        {/* 6-box OTP entry */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 text-center mb-3">
            Enter 6-Digit Code
          </label>
          <div className="flex justify-between gap-2 sm:gap-3">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 sm:w-14 sm:h-14 text-center text-xl font-bold font-mono text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 transition-colors shadow-2xs"
              />
            ))}
          </div>
        </div>

        <button
          id="otp-verify-btn"
          type="button"
          onClick={() => handleVerify()}
          disabled={loading || digits.some(d => !d)}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verifying...
            </span>
          ) : (
            'Verify & Activate Driver Account'
          )}
        </button>

        {/* Resend & Change Contact links */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <button
            type="button"
            onClick={onChangeContact}
            className="flex items-center gap-1 hover:text-slate-900 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Change email / phone
          </button>

          <div>
            {countdown > 0 ? (
              <span className="text-slate-400 font-mono">
                Resend code in {countdown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                Resend OTP
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
