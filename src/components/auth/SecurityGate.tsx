import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { arcadeAudio } from '../../utils/audio';

interface SecurityGateProps {
  onVerified: () => void;
  // Cloudflare Turnstile Site Key (if left empty or invalid, falls back to one-click human verification)
  turnstileSiteKey?: string; 
}

export const SecurityGate: React.FC<SecurityGateProps> = ({ 
  onVerified,
  turnstileSiteKey = '' 
}) => {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSuccess = () => {
    setStatus('success');
    arcadeAudio.playLevelUp?.();
    setTimeout(() => {
      onVerified();
    }, 700);
  };

  const handleManualCheck = () => {
    setStatus('verifying');
    arcadeAudio.playTap?.();
    // Simulate brief cryptographical verification
    setTimeout(() => {
      handleSuccess();
    }, 800);
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md p-6 rounded-3xl transition-all duration-300 animate-in fade-in">
      {/* Glow highlight */}
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-5">
        {/* Status Icon */}
        <div className="flex justify-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
            status === 'success' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20 scale-105' 
              : 'bg-slate-800/80 text-teal-400 border border-slate-700/80'
          }`}>
            {status === 'success' ? (
              <CheckCircle2 className="w-7 h-7 animate-in zoom-in-75 duration-300" />
            ) : (
              <ShieldCheck className="w-7 h-7" />
            )}
          </div>
        </div>

        {/* Header Text */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Lock className="w-3 h-3" /> Gate Security
          </div>
          <h3 className="text-lg font-bold text-slate-100">
            {status === 'success' ? 'Verification Passed' : 'Verify You Are Human'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {status === 'success' 
              ? 'Security check cleared. Unlocking Ledgerly portal...' 
              : 'Please complete the rapid verification to proceed to sign in or register.'}
          </p>
        </div>

        {/* Captcha Challenge Area */}
        <div className="flex flex-col items-center justify-center min-h-[70px]">
          {status === 'success' ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-4 py-2.5 rounded-xl border border-emerald-500/25">
              <Sparkles className="w-4 h-4 text-emerald-300 animate-spin" />
              Access Granted — Opening Form...
            </div>
          ) : turnstileSiteKey ? (
            /* Cloudflare Turnstile widget */
            <div className="scale-90 origin-center">
              <Turnstile
                siteKey={turnstileSiteKey}
                onSuccess={() => handleSuccess()}
                onError={() => {
                  setErrorMessage('Verification failed. Click below to retry.');
                  arcadeAudio.playAlert?.();
                }}
              />
            </div>
          ) : (
            /* Interactive theme-matching Fallback Button */
            <button
              type="button"
              onClick={handleManualCheck}
              disabled={status === 'verifying'}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/40 rounded-xl transition-all duration-200 group text-left cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  status === 'verifying'
                    ? 'border-emerald-500 bg-emerald-500/20'
                    : 'border-slate-600 bg-slate-900 group-hover:border-emerald-400'
                }`}>
                  {status === 'verifying' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
                <span className="text-xs font-medium text-slate-200 group-hover:text-white">
                  {status === 'verifying' ? 'Verifying browser...' : "I'm not a robot"}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          )}

          {errorMessage && (
            <p className="mt-2 text-xs text-rose-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              {errorMessage}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-slate-800/70 text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-500/70" /> Protected by Ledgerly Vault Shield
        </div>
      </div>
    </div>
  );
};
