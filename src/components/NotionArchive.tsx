import React, { useState, useMemo } from 'react';
import { DailyLog, DailyLogWithSummary, Voucher, VoucherItem } from '../types';
import { dbService, getTodayDateString } from '../lib/supabase';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Calendar,
  DollarSign,
  Receipt,
  Plus,
  ArrowUpRight,
  Clock,
  User,
  ShoppingBag,
  Printer,
  Search,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  X,
  Package,
  Layers,
  RotateCcw,
  ShieldAlert,
  Clock3,
  Ban
} from 'lucide-react';

interface NotionArchiveProps {
  archiveTree: DailyLogWithSummary[];
  activeLog: DailyLog | null;
  onSelectActiveLog: (log: DailyLog) => void;
  onCreateTodayLog: () => Promise<DailyLog>;
  onViewVoucherReceipt: (voucher: Voucher, items: VoucherItem[]) => void;
  onRefreshData: () => Promise<void>;
}

export const NotionArchive: React.FC<NotionArchiveProps> = ({
  archiveTree,
  activeLog,
  onSelectActiveLog,
  onCreateTodayLog,
  onViewVoucherReceipt,
  onRefreshData,
}) => {
  // Selected daily log in Notion viewer
  const [selectedLogId, setSelectedLogId] = useState<string | null>(() => {
    return activeLog?.id || archiveTree[0]?.id || null;
  });

  // Tree expansion states
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>(() => {
    const currentYear = new Date().getFullYear();
    return { [currentYear]: true, 2026: true, 2025: false };
  });

  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(() => {
    return { '2026-August': true, '2026-Jul': true };
  });

  // Expanded rows in voucher items table
  const [expandedVoucherIds, setExpandedVoucherIds] = useState<Record<string, boolean>>({});
  const [voucherSearch, setVoucherSearch] = useState('');
  
  // Custom Date Creation Modal
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const todayStr = getTodayDateString();

  // Group archives into Year -> Month -> Daily Files
  const groupedData = useMemo(() => {
    const yearsMap = new Map<
      number,
      Map<
        string,
        {
          month: string;
          logs: DailyLogWithSummary[];
          totalRevenue: number;
          vouchersCount: number;
        }
      >
    >();

    archiveTree.forEach(log => {
      if (!yearsMap.has(log.year)) {
        yearsMap.set(log.year, new Map());
      }
      const yearMonths = yearsMap.get(log.year)!;
      if (!yearMonths.has(log.month)) {
        yearMonths.set(log.month, {
          month: log.month,
          logs: [],
          totalRevenue: 0,
          vouchersCount: 0,
        });
      }
      const monthObj = yearMonths.get(log.month)!;
      monthObj.logs.push(log);
      monthObj.totalRevenue += log.totalRevenue;
      monthObj.vouchersCount += log.vouchersCount;
    });

    const result = Array.from(yearsMap.entries()).map(([year, monthsMap]) => {
      const months = Array.from(monthsMap.values());
      const totalYearRev = months.reduce((acc, m) => acc + m.totalRevenue, 0);
      const totalYearVouchers = months.reduce((acc, m) => acc + m.vouchersCount, 0);
      return {
        year,
        months,
        totalRevenue: totalYearRev,
        vouchersCount: totalYearVouchers,
      };
    });

    return result.sort((a, b) => b.year - a.year);
  }, [archiveTree]);

  // Selected Log Details
  const selectedLog = useMemo(() => {
    if (!selectedLogId && archiveTree.length > 0) return archiveTree[0];
    return archiveTree.find(l => l.id === selectedLogId) || archiveTree[0] || null;
  }, [archiveTree, selectedLogId]);

  const toggleYear = (year: number) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleMonth = (key: string) => {
    setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleVoucherRow = (voucherId: string) => {
    setExpandedVoucherIds(prev => ({ ...prev, [voucherId]: !prev[voucherId] }));
  };

  const handleCreateToday = async () => {
    try {
      setIsProcessing(true);
      const todayLog = await onCreateTodayLog();
      setSelectedLogId(todayLog.id);
      await onRefreshData();
      setStatusMessage({ text: `Daily Log for ${todayLog.day_label} is active.`, type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Failed to create today log', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateCustomDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDateInput) {
      setDateError('Please select a valid date');
      return;
    }

    if (customDateInput > todayStr) {
      setDateError(`Future dates are forbidden. Maximum allowed date is today (${todayStr}).`);
      return;
    }

    setDateError(null);
    setIsProcessing(true);

    try {
      const newLog = await dbService.createCustomDailyLog(customDateInput);
      await onRefreshData();
      setSelectedLogId(newLog.id);
      setShowCustomDateModal(false);
      setCustomDateInput('');
      setStatusMessage({ text: `Created daily log file: ${newLog.day_label}`, type: 'success' });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      setDateError(err?.message || 'Failed to create daily log');
    } finally {
      setIsProcessing(false);
    }
  };

  // Staff Request Void Confirmation State
  const [voidCandidateVoucher, setVoidCandidateVoucher] = useState<Voucher | null>(null);
  const [voidReasonInput, setVoidReasonInput] = useState<string>('');

  // Staff Request Void Workflow
  const handleInitiateRequestVoid = (voucher: Voucher) => {
    setVoidReasonInput('');
    setVoidCandidateVoucher(voucher);
  };

  const handleConfirmRequestVoid = async () => {
    if (!voidCandidateVoucher) return;
    const voucher = voidCandidateVoucher;
    const finalReason = voidReasonInput.trim() || 'Customer requested order cancellation';
    setIsProcessing(true);
    try {
      await dbService.requestVoid(voucher.id, finalReason);
      // Re-fetch all daily vouchers and pending voids immediately
      await onRefreshData();
      setVoidCandidateVoucher(null);
      setVoidReasonInput('');
      setStatusMessage({
        text: `Void request submitted for ${voucher.voucher_number}. Appears in Tab 4 (Owner Void Approvals).`,
        type: 'success'
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Void request failed:', err);
      setStatusMessage({ text: err?.message || 'Failed to request void', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter vouchers within the selected log
  const filteredVouchers = useMemo(() => {
    if (!selectedLog) return [];
    if (!voucherSearch.trim()) return selectedLog.vouchers;
    const q = voucherSearch.toLowerCase();
    return selectedLog.vouchers.filter(v => {
      return (
        v.voucher_number.toLowerCase().includes(q) ||
        (v.customer_name && v.customer_name.toLowerCase().includes(q)) ||
        (v.staff_name && v.staff_name.toLowerCase().includes(q)) ||
        (v.status && v.status.toLowerCase().includes(q)) ||
        (v.items && v.items.some(i => i.product_name.toLowerCase().includes(q)))
      );
    });
  }, [selectedLog, voucherSearch]);

  const avgVoucherValue = useMemo(() => {
    if (!selectedLog || selectedLog.vouchersCount === 0) return 0;
    return selectedLog.totalRevenue / selectedLog.vouchersCount;
  }, [selectedLog]);

  return (
    <div id="notion-archive-container" className="flex flex-col lg:flex-row gap-6 min-h-[640px]">
      {/* LEFT SIDEBAR: Notion-Style Directory Tree */}
      <div className="w-full lg:w-80 shrink-0 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Sidebar Header */}
        <div className="p-4 bg-[#0e0e0e] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-xs tracking-wider uppercase text-white">Permanent Archives</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {archiveTree.length} Daily Files
          </span>
        </div>

        {/* Quick Action Buttons for Staff */}
        <div className="p-3 border-b border-white/10 bg-[#0a0a0a] space-y-2">
          <button
            id="notion-create-today-file-btn"
            onClick={handleCreateToday}
            disabled={isProcessing}
            className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Open Today's Daily File</span>
          </button>

          <button
            id="notion-custom-date-btn"
            onClick={() => {
              setCustomDateInput(todayStr);
              setShowCustomDateModal(true);
            }}
            className="w-full py-2 px-3 bg-[#121212] hover:bg-zinc-800 border border-white/10 text-slate-300 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Create Past Date File</span>
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mx-3 my-2 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="truncate">{statusMessage.text}</span>
          </div>
        )}

        {/* Tree View Navigation */}
        <div className="p-3 flex-1 overflow-y-auto space-y-1 font-sans text-xs scrollbar-thin">
          {groupedData.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
              <p>No archives found yet.</p>
            </div>
          ) : (
            groupedData.map(yearGroup => {
              const isYearExpanded = expandedYears[yearGroup.year] !== false;

              return (
                <div key={yearGroup.year} className="space-y-0.5 select-none">
                  {/* Year Node */}
                  <div
                    onClick={() => toggleYear(yearGroup.year)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer font-semibold text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      {isYearExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <FolderOpen className="w-4 h-4 text-emerald-400" />
                      <span>{yearGroup.year}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-medium">
                      ${yearGroup.totalRevenue.toFixed(0)}
                    </span>
                  </div>

                  {/* Months inside Year */}
                  {isYearExpanded && (
                    <div className="pl-4 space-y-0.5 border-l border-white/10 ml-3">
                      {yearGroup.months.map(monthGroup => {
                        const monthKey = `${yearGroup.year}-${monthGroup.month}`;
                        const isMonthExpanded = expandedMonths[monthKey] !== false;

                        return (
                          <div key={monthKey} className="space-y-0.5">
                            {/* Month Node */}
                            <div
                              onClick={() => toggleMonth(monthKey)}
                              className="flex items-center justify-between p-1.5 rounded-md hover:bg-white/5 cursor-pointer text-slate-300 font-medium transition-colors"
                            >
                              <div className="flex items-center gap-1.5">
                                {isMonthExpanded ? (
                                  <ChevronDown className="w-3 h-3 text-slate-400" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-slate-400" />
                                )}
                                <Folder className="w-3.5 h-3.5 text-amber-400" />
                                <span>{monthGroup.month}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {monthGroup.logs.length} files
                              </span>
                            </div>

                            {/* Daily Log Files inside Month */}
                            {isMonthExpanded && (
                              <div className="pl-4 space-y-0.5 border-l border-white/10 ml-2">
                                {monthGroup.logs.map(log => {
                                  const isSelected = selectedLog?.id === log.id;
                                  const isActivePOS = activeLog?.id === log.id;

                                  return (
                                    <div
                                      key={log.id}
                                      id={`daily-file-${log.id}`}
                                      onClick={() => setSelectedLogId(log.id)}
                                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                                        isSelected
                                          ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30'
                                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <FileText
                                          className={`w-3.5 h-3.5 shrink-0 ${
                                            isSelected ? 'text-emerald-400' : 'text-slate-400'
                                          }`}
                                        />
                                        <span className="truncate text-xs font-mono">{log.day_label}</span>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {isActivePOS && (
                                          <span
                                            className={`text-[9px] px-1 rounded uppercase font-bold tracking-tight ${
                                              isSelected ? 'bg-emerald-500 text-black' : 'bg-emerald-500/20 text-emerald-400'
                                            }`}
                                          >
                                            Active
                                          </span>
                                        )}
                                        <span
                                          className={`text-[11px] font-mono font-medium ${
                                            isSelected ? 'text-emerald-300' : 'text-slate-400'
                                          }`}
                                        >
                                          ${log.totalRevenue.toFixed(0)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT WORKSPACE: Notion Page Canvas */}
      <div className="flex-1 space-y-5">
        {selectedLog ? (
          <>
            {/* Notion Page Header & Breadcrumbs */}
            <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-white/10 shadow-2xl space-y-4">
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Archives</span>
                <span>/</span>
                <span>{selectedLog.year}</span>
                <span>/</span>
                <span>{selectedLog.month}</span>
                <span>/</span>
                <span className="font-semibold text-slate-200">{selectedLog.day_label}</span>
              </div>

              {/* Title & Set Active POS Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl shadow-xs">
                    📄
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                      Daily Sales File: {selectedLog.day_label}
                    </h1>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Log Date: {selectedLog.log_date} • Database Record ID: {selectedLog.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {activeLog?.id === selectedLog.id ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      Active POS Session
                    </span>
                  ) : (
                    <button
                      id="set-as-active-pos-btn"
                      onClick={() => onSelectActiveLog(selectedLog)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#121212] hover:bg-zinc-800 border border-white/10 active:bg-zinc-700 text-slate-200 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Set as Active POS</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notion-Style Metrics Cards (Pending requests remain included; voided vouchers excluded) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-[#121212] border border-white/10">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                    Daily Total Revenue
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-1">
                    ${selectedLog.totalRevenue.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Excludes Voided Sales</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#121212] border border-white/10">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                    Vouchers Issued
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-200 font-mono mt-1">
                    {selectedLog.vouchersCount}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Active Transactions</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#121212] border border-white/10">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                    Items Sold
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-200 font-mono mt-1">
                    {selectedLog.totalItemsSold} pcs
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Active Units Sold</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#121212] border border-white/10">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                    Avg. Order Value
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-200 font-mono mt-1">
                    ${avgVoucherValue.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Per Active Voucher</div>
                </div>
              </div>
            </div>

            {/* Vouchers & Itemized Line Items Database View */}
            <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Table Toolbar */}
              <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0e0e0e]">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">
                    Vouchers & Itemized Sales ({filteredVouchers.length})
                  </h3>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter by voucher #, status, or item..."
                    value={voucherSearch}
                    onChange={e => setVoucherSearch(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Vouchers List */}
              {filteredVouchers.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Receipt className="w-12 h-12 mx-auto mb-2 text-zinc-700 stroke-1" />
                  <p className="text-sm font-medium text-slate-400">No vouchers recorded for this date</p>
                  <p className="text-xs mt-1 text-slate-400">
                    Switch to the POS tab to generate sales vouchers under this daily log.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredVouchers.map(voucher => {
                    const isExpanded = expandedVoucherIds[voucher.id] ?? true;
                    const items = voucher.items || [];
                    const formattedTime = new Date(voucher.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const voucherItemsQuantity = items.reduce((acc, i) => acc + (i.quantity || 0), 0);
                    const status = voucher.status || 'completed';
                    const isVoided = status === 'voided';
                    const isVoidPending = status === 'void_pending';

                    return (
                      <div
                        key={voucher.id}
                        id={`voucher-card-${voucher.id}`}
                        className={`p-4 transition-colors ${
                          isVoided
                            ? 'bg-rose-950/10 opacity-75'
                            : isVoidPending
                            ? 'bg-amber-950/10'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        {/* Voucher Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleVoucherRow(voucher.id)}
                              className="p-1 rounded-lg hover:bg-zinc-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title="Toggle itemized lines"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`font-bold font-mono text-sm ${
                                    isVoided ? 'text-slate-400 line-through' : 'text-white'
                                  }`}
                                >
                                  {voucher.voucher_number}
                                </span>

                                {/* Status Badges */}
                                {isVoided ? (
                                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold font-mono rounded flex items-center gap-1">
                                    <Ban className="w-3 h-3" /> VOIDED
                                  </span>
                                ) : isVoidPending ? (
                                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono rounded flex items-center gap-1 animate-pulse">
                                    <Clock3 className="w-3 h-3" /> VOID PENDING APPROVAL
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold font-mono rounded">
                                    COMPLETED
                                  </span>
                                )}

                                <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-slate-300 text-[11px] font-mono rounded">
                                  {voucher.payment_method || 'Cash'}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  ({voucherItemsQuantity} {voucherItemsQuantity === 1 ? 'item' : 'items'})
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {formattedTime}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" /> {voucher.customer_name || 'Walk-in'}
                                </span>
                                {voucher.staff_name && (
                                  <>
                                    <span>•</span>
                                    <span>Staff: {voucher.staff_name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <div className="text-right">
                              <span className="text-xs text-slate-400 block font-mono">Amount</span>
                              <span
                                className={`font-extrabold text-base font-mono ${
                                  isVoided
                                    ? 'text-slate-500 line-through'
                                    : isVoidPending
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                ${voucher.total_amount.toFixed(2)}
                              </span>
                            </div>

                            {/* View Receipt Button */}
                            <button
                              id={`view-receipt-${voucher.id}`}
                              onClick={() => onViewVoucherReceipt(voucher, items)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#121212] hover:bg-zinc-800 active:bg-zinc-700 border border-white/10 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                              title="Print / View Thermal Receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Receipt</span>
                            </button>

                            {/* Staff Void Request Button (Enabled only if completed) */}
                            {!isVoided && !isVoidPending && (
                              <button
                                id={`request-void-${voucher.id}`}
                                onClick={() => handleInitiateRequestVoid(voucher)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-500/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Submit Void Request for Owner Approval"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Request Void</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Nested Line Items Breakdown (Notion Table style) */}
                        {isExpanded && items.length > 0 && (
                          <div className="mt-3 pl-8 pr-2">
                            <div className="bg-black/60 rounded-xl p-3 border border-white/10 font-mono text-xs">
                              <div className="grid grid-cols-12 font-bold text-slate-400 uppercase text-[10px] pb-1.5 border-b border-white/10">
                                <span className="col-span-6">Itemized Product</span>
                                <span className="col-span-2 text-center">Qty</span>
                                <span className="col-span-2 text-right">Unit Price</span>
                                <span className="col-span-2 text-right">Subtotal</span>
                              </div>
                              <div className="divide-y divide-white/5">
                                {items.map((item, idx) => (
                                  <div key={item.id || idx} className="grid grid-cols-12 py-1.5 text-slate-300">
                                    <span className="col-span-6 font-sans font-medium truncate text-white">
                                      {item.product_name}
                                    </span>
                                    <span className="col-span-2 text-center text-slate-400 font-mono">
                                      {item.quantity}
                                    </span>
                                    <span className="col-span-2 text-right text-slate-400">
                                      ${item.unit_price.toFixed(2)}
                                    </span>
                                    <span
                                      className={`col-span-2 text-right font-semibold ${
                                        isVoided ? 'text-slate-500 line-through' : 'text-emerald-400'
                                      }`}
                                    >
                                      ${item.subtotal.toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-[#0a0a0a] rounded-2xl p-12 text-center border border-white/10">
            <p className="text-slate-400">Select a daily file from the left sidebar to inspect vouchers.</p>
          </div>
        )}
      </div>

      {/* CREATE PAST DATE MODAL (Strict control: No future dates allowed) */}
      {showCustomDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#0a0a0a] rounded-2xl shadow-2xl border border-white/10 w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 bg-[#0e0e0e] border-b border-white/10 text-white">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider">Create Historical Daily File</h3>
              </div>
              <button
                onClick={() => setShowCustomDateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomDate} className="p-5 space-y-4 text-xs font-sans">
              <p className="text-slate-400">
                Staff can create daily log files for today or historical dates. Future dates cannot be created.
              </p>

              {dateError && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{dateError}</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Select Date (Max: Today {todayStr})
                </label>
                <input
                  type="date"
                  max={todayStr}
                  required
                  value={customDateInput}
                  onChange={e => setCustomDateInput(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-slate-200 font-mono text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCustomDateModal(false)}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-medium rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.2)] disabled:opacity-50"
                >
                  {isProcessing ? 'Creating...' : 'Create Daily File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IN-APP CONFIRMATION MODAL: Void Request */}
      {voidCandidateVoucher && (
        <div
          id="void-request-confirmation-modal"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-[#0e0e0e] border border-amber-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)]">
            <div className="p-4 bg-amber-950/20 border-b border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <RotateCcw className="w-4 h-4" />
                <h3 className="font-bold text-xs uppercase tracking-wider">Confirm Void Request</h3>
              </div>
              <button
                onClick={() => setVoidCandidateVoucher(null)}
                disabled={isProcessing}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-black/60 rounded-xl p-3 border border-white/10 space-y-2 font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Voucher Number:</span>
                  <span className="font-bold text-white text-sm">{voidCandidateVoucher.voucher_number}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Total Amount:</span>
                  <span className="font-extrabold text-amber-400 text-base font-mono">
                    ${voidCandidateVoucher.total_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Customer / Payment:</span>
                  <span className="text-slate-200">
                    {voidCandidateVoucher.customer_name || 'Walk-in'} • {voidCandidateVoucher.payment_method || 'Cash'}
                  </span>
                </div>
                {voidCandidateVoucher.items && voidCandidateVoucher.items.length > 0 && (
                  <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-300 block">Items in Voucher:</span>
                    {voidCandidateVoucher.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-300">
                        <span className="truncate max-w-[220px]">{item.product_name}</span>
                        <span>x{item.quantity} (${item.subtotal.toFixed(2)})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reason for Void Input & Presets */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-200 uppercase tracking-wider font-mono">
                  Reason for Void <span className="text-rose-400">*</span>
                </label>
                <textarea
                  id="void-reason-input"
                  rows={2}
                  value={voidReasonInput}
                  onChange={e => setVoidReasonInput(e.target.value)}
                  placeholder="E.g., Customer changed order, wrong items entered, duplicate billing..."
                  className="w-full bg-[#141414] border border-amber-500/30 text-slate-200 placeholder-slate-500 text-xs rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-sans resize-none"
                />
                
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'Customer cancelled order',
                    'Wrong item entered',
                    'Duplicate transaction',
                    'Payment method error',
                    'Defective/Returned item'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setVoidReasonInput(preset)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        voidReasonInput === preset
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-[11px] space-y-1">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Clock3 className="w-3.5 h-3.5" /> Owner Approval Required
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Submitting this request saves the void reason to Supabase and queues it for the Owner in <strong>Tab 4: Owner Void Approvals</strong>.
                </p>
                <p className="text-slate-400 text-[10px]">
                  Note: Daily Revenue and items sold will remain in sales totals until the Owner approves the void request.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setVoidCandidateVoucher(null)}
                  disabled={isProcessing}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-medium rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-submit-void-btn"
                  type="button"
                  onClick={handleConfirmRequestVoid}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.25)] disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'Submitting...' : 'Confirm Void Request'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
