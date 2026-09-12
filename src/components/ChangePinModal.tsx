import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, X, AlertTriangle, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { verifyOwnerPin, setStoredOwnerPin } from '../lib/supabase';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setError(null);
      setShowPins(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validate Current PIN
    if (!currentPin) {
      setError('Please enter your Current PIN.');
      return;
    }

    if (!verifyOwnerPin(currentPin)) {
      setError('Incorrect Current PIN.');
      return;
    }

    // 2. Validate New PIN format (4 digits)
    if (!/^\d{4}$/.test(newPin)) {
      setError('New PIN must be exactly 4 numeric digits (0-9).');
      return;
    }

    // 3. Prevent using same PIN as current
    if (newPin === currentPin) {
      setError('New PIN cannot be identical to the current PIN.');
      return;
    }

    // 4. Validate Confirm PIN matches
    if (newPin !== confirmPin) {
      setError('New PIN and Confirm New PIN do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      setStoredOwnerPin(newPin);
      onSuccess('Owner PIN updated successfully!');
      onClose();
    } catch (err: any) {
      setError('Failed to update PIN in storage.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="change-pin-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-change-pin-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 border-b border-white/10 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)] shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Change Owner Security PIN
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Update the 4-digit code required for void approvals and security actions.
            </p>
          </div>
        </div>

        {/* Inline Error Notice */}
        {error && (
          <div className="p-3.5 bg-rose-950/50 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Field 1: Current PIN */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              1. Current PIN <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                id="current-pin-input"
                type={showPins ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoFocus
                placeholder="Enter current 4-digit PIN"
                value={currentPin}
                onChange={e => {
                  setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                  setError(null);
                }}
                className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest text-white placeholder-slate-600 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <p className="text-[10px] text-slate-500">Default initial system PIN is 1234.</p>
          </div>

          {/* Field 2: New PIN */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              2. New PIN (4 Digits) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                id="new-pin-input"
                type={showPins ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="Enter new 4-digit PIN"
                value={newPin}
                onChange={e => {
                  setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                  setError(null);
                }}
                className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest text-white placeholder-slate-600 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Field 3: Confirm New PIN */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              3. Confirm New PIN <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                id="confirm-pin-input"
                type={showPins ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="Re-enter new 4-digit PIN"
                value={confirmPin}
                onChange={e => {
                  setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                  setError(null);
                }}
                className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest text-white placeholder-slate-600 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowPins(!showPins)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPins ? 'Hide PIN characters' : 'Show PIN characters'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-new-pin-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Update Owner PIN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
