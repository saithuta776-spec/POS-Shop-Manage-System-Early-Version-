import React, { useState, useEffect, useMemo } from 'react';
import { Voucher, VoucherItem } from '../types';
import { dbService, verifyOwnerPin } from '../lib/supabase';
import {
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Clock,
  User,
  ShoppingBag,
  DollarSign,
  Ban,
  RotateCcw,
  Sparkles,
  KeyRound,
  CheckCircle2,
  Calendar,
  FileText,
  MessageSquareQuote
} from 'lucide-react';

interface VoidApprovalsProps {
  onRefreshData: () => Promise<void>;
  onOpenChangePin?: () => void;
  onLock?: () => void;
}

export const VoidApprovals: React.FC<VoidApprovalsProps> = ({
  onRefreshData,
  onOpenChangePin,
  onLock,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [pinError, setPinError] = useState<string | null>(null);

  const [pendingVoids, setPendingVoids] = useState<(Voucher & { items: VoucherItem[]; daily_log_label?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Confirmation state for approve / reject
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject';
    voucher: Voucher & { items: VoucherItem[]; daily_log_label?: string };
  } | null>(null);

  // Load pending voids
  const loadPendingVoids = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getPendingVoids();
      setPendingVoids(data);
    } catch (err) {
      console.error('Failed to load pending voids:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      loadPendingVoids();
    }
  }, [isUnlocked]);

  // Handle PIN unlock
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOwnerPin(pinInput)) {
      setIsUnlocked(true);
      setPinError(null);
      setPinInput('');
      loadPendingVoids();
    } else {
      setPinError('Incorrect Owner PIN. Please enter the valid 4-digit code.');
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setPinInput('');
    setPinError(null);
    if (onLock) {
      onLock();
    }
  };

  // Handle Approve Void
  const handleApproveVoid = async (voucher: Voucher) => {
    setActionProcessingId(voucher.id);
    try {
      await dbService.approveVoid(voucher.id);
      // Re-fetch products, vouchers, and pending void queue directly
      await Promise.all([loadPendingVoids(), onRefreshData()]);
      setConfirmAction(null);
      setNotification({
        text: `Voucher ${voucher.voucher_number} marked VOIDED. Sales deducted & inventory stock restored.`,
        type: 'success',
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      console.error('Approve void failed:', err);
      setNotification({
        text: err?.message || 'Failed to approve void',
        type: 'error',
      });
    } finally {
      setActionProcessingId(null);
    }
  };

  // Handle Reject Void
  const handleRejectVoid = async (voucher: Voucher) => {
    setActionProcessingId(voucher.id);
    try {
      await dbService.rejectVoid(voucher.id);
      // Re-fetch all records immediately
      await Promise.all([loadPendingVoids(), onRefreshData()]);
      setConfirmAction(null);
      setNotification({
        text: `Void request rejected. Voucher ${voucher.voucher_number} restored to Completed.`,
        type: 'success',
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      console.error('Reject void failed:', err);
      setNotification({
        text: err?.message || 'Failed to reject void',
        type: 'error',
      });
    } finally {
      setActionProcessingId(null);
    }
  };

  // Metrics
  const totalPendingAmount = useMemo(() => {
    return pendingVoids.reduce((sum, v) => sum + v.total_amount, 0);
  }, [pendingVoids]);

  const totalPendingUnits = useMemo(() => {
    return pendingVoids.reduce((sum, v) => {
      return sum + (v.items || []).reduce((iSum, item) => iSum + (item.quantity || 0), 0);
    }, 0);
  }, [pendingVoids]);

  if (!isUnlocked) {
    return (
      <div id="void-approvals-locked-view" className="max-w-md mx-auto my-12 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#0a0a0a] rounded-3xl border border-white/10 p-8 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.15)]">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">Owner Void Approval Vault</h2>
            <p className="text-xs text-slate-400">
              Enter Owner PIN to review staff void requests and manage inventory restorations.
            </p>
          </div>

          <div className="bg-[#121212] border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-center justify-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Default Owner PIN: <strong className="font-mono font-bold text-white">1234</strong></span>
          </div>

          {pinError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              {pinError}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <input
                id="owner-pin-input"
                type="password"
                maxLength={8}
                autoFocus
                placeholder="Enter 4-digit PIN..."
                value={pinInput}
                onChange={e => {
                  setPinInput(e.target.value);
                  setPinError(null);
                }}
                className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest text-white placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              id="owner-pin-submit-btn"
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Void Approvals</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div id="void-approvals-unlocked-view" className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border text-xs font-medium flex items-center gap-2.5 backdrop-blur-md ${
              notification.type === 'success'
                ? 'bg-[#121212] text-emerald-400 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                : 'bg-[#121212] text-rose-400 border-rose-500/40'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
        </div>
      )}

      {/* Header & Metrics */}
      <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-white/10 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Owner Void Approval Portal
                </h1>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold rounded">
                  AUTHENTICATED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Review staff void requests. Approving will automatically invoke the PostgreSQL trigger to restore stock.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenChangePin && (
              <button
                id="tab4-change-pin-btn"
                onClick={onOpenChangePin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                title="Change Owner Security PIN"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change PIN</span>
              </button>
            )}

            <button
              onClick={loadPendingVoids}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#121212] hover:bg-zinc-800 border border-white/10 text-slate-200 text-xs font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>

            <button
              id="tab4-lock-vault-btn"
              onClick={handleLock}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer border border-white/5"
              title="Lock portal and return to sales"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Vault</span>
            </button>
          </div>
        </div>

        {/* Pending Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-[#121212] border border-amber-500/20">
            <div className="text-[11px] text-amber-400 uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Pending Void Requests
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1">
              {pendingVoids.length} <span className="text-xs text-slate-500 font-sans font-normal">vouchers</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121212] border border-white/10">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
              Pending Revenue at Stake
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono mt-1">
              ${totalPendingAmount.toFixed(2)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121212] border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
              Units to Restore
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-1">
              {totalPendingUnits} pcs
            </div>
          </div>
        </div>
      </div>

      {/* Pending Voids List */}
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-4 bg-[#0e0e0e] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              Pending Void Requests ({pendingVoids.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {pendingVoids.length === 0 ? 'All Clear' : 'Action Required'}
          </span>
        </div>

        {pendingVoids.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">No Pending Void Requests</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All sales vouchers are approved and verified. When staff submits a void request from the Notion Archive, it will appear here for review.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {pendingVoids.map(voucher => {
              const items = voucher.items || [];
              const formattedDate = new Date(voucher.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const formattedTime = new Date(voucher.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const isActioning = actionProcessingId === voucher.id;

              return (
                <div key={voucher.id} id={`pending-void-${voucher.id}`} className="p-5 space-y-4 hover:bg-white/5 transition-colors">
                  {/* Voucher Header & Actions */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold font-mono text-base text-white">
                          {voucher.voucher_number}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold rounded flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3" /> VOID REQUESTED
                        </span>
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-slate-300 text-xs font-mono rounded">
                          {voucher.daily_log_label || 'Daily File'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formattedDate} at {formattedTime}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {voucher.customer_name || 'Walk-in Customer'}
                        </span>
                        {voucher.staff_name && (
                          <>
                            <span>•</span>
                            <span>Staff: {voucher.staff_name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <div className="text-right mr-2">
                        <span className="text-xs text-slate-400 block font-mono">Void Amount</span>
                        <span className="font-extrabold text-lg text-amber-400 font-mono">
                          ${voucher.total_amount.toFixed(2)}
                        </span>
                      </div>

                      {/* Reject Button */}
                      <button
                        id={`reject-void-btn-${voucher.id}`}
                        onClick={() => setConfirmAction({ type: 'reject', voucher })}
                        disabled={isActioning}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#121212] hover:bg-zinc-800 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                        title="Reject void request and keep completed sale"
                      >
                        <XCircle className="w-4 h-4 text-slate-400" />
                        <span>Reject Void</span>
                      </button>

                      {/* Approve Button */}
                      <button
                        id={`approve-void-btn-${voucher.id}`}
                        onClick={() => setConfirmAction({ type: 'approve', voucher })}
                        disabled={isActioning}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] cursor-pointer disabled:opacity-50"
                        title="Approve void and restore product stock"
                      >
                        <Ban className="w-4 h-4" />
                        <span>{isActioning ? 'Processing...' : 'Approve Void (Restore Stock)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Void Reason Banner */}
                  <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 text-xs">
                    <MessageSquareQuote className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-amber-400 block tracking-wider">
                        Staff Void Reason / Justification
                      </span>
                      <p className="text-slate-200 font-sans mt-0.5 text-xs italic">
                        "{voucher.void_reason || 'No specific reason provided by staff.'}"
                      </p>
                    </div>
                  </div>

                  {/* Itemized Table of What Will Be Returned to Stock */}
                  <div className="bg-black/60 rounded-xl p-3 border border-white/10 font-mono text-xs">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-emerald-400" />
                      Items to be Restored to Inventory:
                    </div>

                    <div className="grid grid-cols-12 font-bold text-slate-400 uppercase text-[10px] pb-1.5 border-b border-white/10">
                      <span className="col-span-6">Product Title</span>
                      <span className="col-span-2 text-center text-emerald-400">Qty to Restore</span>
                      <span className="col-span-2 text-right">Unit Price</span>
                      <span className="col-span-2 text-right">Line Subtotal</span>
                    </div>

                    <div className="divide-y divide-white/5">
                      {items.map((item, idx) => (
                        <div key={item.id || idx} className="grid grid-cols-12 py-2 text-slate-300 items-center">
                          <span className="col-span-6 font-sans font-medium truncate text-white">
                            {item.product_name}
                          </span>
                          <span className="col-span-2 text-center text-emerald-400 font-bold font-mono text-sm">
                            +{item.quantity} units
                          </span>
                          <span className="col-span-2 text-right text-slate-400 font-mono">
                            ${item.unit_price.toFixed(2)}
                          </span>
                          <span className="col-span-2 text-right font-mono font-semibold text-slate-200">
                            ${item.subtotal.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL: Approve / Reject Void */}
      {confirmAction && (
        <div
          id="owner-void-action-modal"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-[#0e0e0e] border border-white/15 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div
              className={`p-4 border-b flex items-center justify-between ${
                confirmAction.type === 'approve'
                  ? 'bg-rose-950/30 border-rose-500/20 text-rose-400'
                  : 'bg-zinc-900 border-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                {confirmAction.type === 'approve' ? (
                  <>
                    <Ban className="w-4 h-4 text-rose-400" />
                    <span>Confirm Void Approval & Stock Restoration</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-slate-400" />
                    <span>Reject Void Request</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setConfirmAction(null)}
                disabled={actionProcessingId !== null}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-black/60 rounded-xl p-3 border border-white/10 space-y-2 font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Voucher:</span>
                  <span className="font-bold text-white">{confirmAction.voucher.voucher_number}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Amount:</span>
                  <span className="font-extrabold text-amber-400">${confirmAction.voucher.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Items to Restore:</span>
                  <span className="text-emerald-400 font-bold">
                    {(confirmAction.voucher.items || []).reduce((s, i) => s + (i.quantity || 0), 0)} units
                  </span>
                </div>
                {confirmAction.voucher.void_reason && (
                  <div className="pt-2 border-t border-white/10 text-[11px] text-amber-300">
                    <span className="text-slate-400 block text-[10px] font-mono uppercase">Void Reason:</span>
                    <span className="italic font-sans">"{confirmAction.voucher.void_reason}"</span>
                  </div>
                )}
              </div>

              {confirmAction.type === 'approve' ? (
                <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl text-rose-200 text-[11px] space-y-1">
                  <div className="font-bold text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Permanent Void & Stock Restoration
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Approving this void will mark the voucher status as <strong>VOIDED</strong>, deduct ${confirmAction.voucher.total_amount.toFixed(2)} from Daily Revenue and sales analytics, and restore all line items back into product inventory stock in Supabase and the web interface.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-zinc-900 border border-white/10 rounded-xl text-slate-300 text-[11px] space-y-1">
                  <div className="font-bold text-slate-200">Reset to Completed Sale</div>
                  <p className="text-slate-400 leading-relaxed">
                    Rejecting the void request keeps the transaction active. Status will return to <strong>COMPLETED</strong> and sales revenue and inventory counts will remain unchanged.
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  disabled={actionProcessingId !== null}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-medium rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                {confirmAction.type === 'approve' ? (
                  <button
                    id="confirm-approve-void-btn"
                    type="button"
                    onClick={() => handleApproveVoid(confirmAction.voucher)}
                    disabled={actionProcessingId !== null}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.3)] disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Ban className={`w-3.5 h-3.5 ${actionProcessingId ? 'animate-spin' : ''}`} />
                    <span>{actionProcessingId ? 'Restoring Stock...' : 'Confirm Void & Restore Stock'}</span>
                  </button>
                ) : (
                  <button
                    id="confirm-reject-void-btn"
                    type="button"
                    onClick={() => handleRejectVoid(confirmAction.voucher)}
                    disabled={actionProcessingId !== null}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <XCircle className={`w-3.5 h-3.5 ${actionProcessingId ? 'animate-spin' : ''}`} />
                    <span>{actionProcessingId ? 'Rejecting...' : 'Confirm Reject'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
