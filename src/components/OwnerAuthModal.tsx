import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, KeyRound, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { verifyOwnerPin } from '../lib/supabase';

interface OwnerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitle?: string;
  onOpenChangePin?: () => void;
}

export const OwnerAuthModal: React.FC<OwnerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Owner Authentication Required',
  subtitle = 'Please enter your 4-digit Owner PIN to access Owner Void Approvals and management controls.',
  onOpenChangePin,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setError('Please enter the complete 4-digit PIN.');
      return;
    }

    if (verifyOwnerPin(pin)) {
      setError(null);
      setPin('');
      onSuccess();
    } else {
      setError('Incorrect Owner PIN. Please try again.');
      setPin('');
      inputRef.current?.focus();
    }
  };

  const handleDigitClick = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(null);
      if (newPin.length === 4) {
        if (verifyOwnerPin(newPin)) {
          setTimeout(() => {
            setPin('');
            onSuccess();
          }, 150);
        } else {
          setTimeout(() => {
            setError('Incorrect Owner PIN. Please try again.');
            setPin('');
          }, 150);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  return (
    <div
      id="owner-auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-owner-auth-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-slate-400 px-2 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center items-center gap-3 my-2">
          {[0, 1, 2, 3].map(idx => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border transition-all duration-150 ${
                  isFilled
                    ? 'bg-amber-400 border-amber-300 scale-110 shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                    : 'bg-white/5 border-white/20'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center justify-center gap-1.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Hidden Form for keyboard support */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            id="owner-auth-modal-pin-input"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              setPin(val);
              setError(null);
              if (val.length === 4) {
                if (verifyOwnerPin(val)) {
                  setTimeout(() => {
                    setPin('');
                    onSuccess();
                  }, 100);
                } else {
                  setError('Incorrect Owner PIN. Please try again.');
                  setPin('');
                }
              }
            }}
            className="sr-only"
          />

          {/* Number Pad for Touch & Mouse */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigitClick(num)}
                className="h-12 bg-[#141414] hover:bg-[#202020] active:bg-amber-500/20 active:text-amber-400 border border-white/10 rounded-xl text-base font-mono font-bold text-white transition-all cursor-pointer flex items-center justify-center select-none"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={onClose}
              className="h-12 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleDigitClick('0')}
              className="h-12 bg-[#141414] hover:bg-[#202020] active:bg-amber-500/20 active:text-amber-400 border border-white/10 rounded-xl text-base font-mono font-bold text-white transition-all cursor-pointer flex items-center justify-center select-none"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer flex items-center justify-center"
            >
              ⌫
            </button>
          </div>
        </form>

        {/* Change PIN Option */}
        {onOpenChangePin && (
          <div className="pt-2 text-center border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenChangePin();
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Need to change or reset Owner PIN?</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
