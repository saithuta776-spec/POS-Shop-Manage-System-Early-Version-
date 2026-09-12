import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, DailyLog, DailyLogWithSummary, TabType, Voucher, VoucherItem } from './types';
import { dbService, isLiveSupabase } from './lib/supabase';
import { PosVoucherGenerator } from './components/PosVoucherGenerator';
import { NotionArchive } from './components/NotionArchive';
import { ProductInventory } from './components/ProductInventory';
import { VoidApprovals } from './components/VoidApprovals';
import { ReceiptModal } from './components/ReceiptModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { OwnerAuthModal } from './components/OwnerAuthModal';
import { ChangePinModal } from './components/ChangePinModal';
import {
  Store,
  Receipt,
  FileSpreadsheet,
  Package,
  ShieldAlert,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [archiveTree, setArchiveTree] = useState<DailyLogWithSummary[]>([]);
  const [pendingVoidsCount, setPendingVoidsCount] = useState<number>(0);
  const [activeLog, setActiveLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Receipt Modal State
  const [selectedReceiptVoucher, setSelectedReceiptVoucher] = useState<Voucher | null>(null);
  const [selectedReceiptItems, setSelectedReceiptItems] = useState<VoucherItem[]>([]);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Supabase Config Modal State
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Owner Authentication & Change PIN Modal States
  const [isOwnerAuthOpen, setIsOwnerAuthOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load all records
  const loadData = useCallback(async () => {
    try {
      const [fetchedProducts, fetchedLogs, fetchedTree, pendingVoids] = await Promise.all([
        dbService.getProducts(),
        dbService.getDailyLogs(),
        dbService.getArchiveTree(),
        dbService.getPendingVoids(),
      ]);

      setProducts(fetchedProducts);
      setDailyLogs(fetchedLogs);
      setArchiveTree(fetchedTree);
      setPendingVoidsCount(pendingVoids.length);

      // Default active log: today's log or latest log
      const todayDateStr = new Date().toISOString().split('T')[0];
      const todayMatch = fetchedLogs.find(l => l.log_date === todayDateStr);
      if (todayMatch) {
        setActiveLog(prev => prev || todayMatch);
      } else if (fetchedLogs.length > 0) {
        setActiveLog(prev => prev || fetchedLogs[0]);
      }
    } catch (err) {
      console.error('Failed to load shop data:', err);
      showNotification('Failed to fetch data from storage', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create or get Today's daily log
  const handleCreateTodayLog = async (): Promise<DailyLog> => {
    try {
      const todayLog = await dbService.getOrCreateTodayLog();
      await loadData();
      setActiveLog(todayLog);
      showNotification(`Daily log "${todayLog.day_label}" is active and ready for sales.`, 'success');
      return todayLog;
    } catch (err: any) {
      showNotification(err?.message || 'Failed to open daily log', 'error');
      throw err;
    }
  };

  // When a voucher is successfully confirmed
  const handleVoucherCreated = (voucher: Voucher, items: VoucherItem[]) => {
    setSelectedReceiptVoucher(voucher);
    setSelectedReceiptItems(items);
    setIsReceiptOpen(true);
    showNotification(`Voucher ${voucher.voucher_number} generated successfully!`, 'success');
  };

  // Open receipt preview from archive
  const handleViewVoucherReceipt = (voucher: Voucher, items: VoucherItem[]) => {
    setSelectedReceiptVoucher(voucher);
    setSelectedReceiptItems(items);
    setIsReceiptOpen(true);
  };

  // Strict Per-Action Navigation handler for Tab 4
  const handleTabClick = (tab: TabType) => {
    if (tab === 'void_approvals') {
      if (activeTab === 'void_approvals') {
        return; // Already on Tab 4
      }
      // Trigger Owner Authentication Modal before granting access
      setIsOwnerAuthOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleOwnerAuthSuccess = () => {
    setIsOwnerAuthOpen(false);
    setActiveTab('void_approvals');
    showNotification('Owner authenticated successfully. Void approvals portal unlocked.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Application Navigation & Header */}
      <header className="bg-[#0a0a0a] border-b border-white/10 sticky top-0 z-30 shadow-2xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Store Brand / Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-black flex items-center justify-center font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base sm:text-lg tracking-tight text-white leading-none">
                    SHOPFLOW <span className="text-emerald-500">POS</span>
                  </h1>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-white/5 border border-white/10 text-emerald-400 rounded font-medium">
                    VMS RETAIL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">
                  Point of Sale, Live Stock, Notion Archives & Owner Void Approval
                </p>
              </div>
            </div>

            {/* Header Right: Controls, Security PIN & Database Status */}
            <div className="flex items-center gap-2 sm:gap-3">
              {activeLog && (
                <div className="hidden lg:flex flex-col items-end text-xs pr-2 border-r border-white/10">
                  <span className="text-[10px] text-slate-400">Current Session</span>
                  <span className="text-emerald-400 font-mono font-medium">{activeLog.day_label}</span>
                </div>
              )}

              {/* Change Owner PIN Header Button */}
              <button
                id="header-change-pin-btn"
                onClick={() => setIsChangePinOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-500/25 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer shadow-xs"
                title="Change 4-Digit Owner Security PIN"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Change Owner PIN</span>
                <span className="sm:hidden">PIN</span>
              </button>

              {/* Database Status Button */}
              <button
                id="supabase-config-trigger-btn"
                onClick={() => setIsConfigOpen(true)}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  isLiveSupabase
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-[#121212] border-white/10 text-slate-300 hover:border-emerald-500/40 hover:text-white'
                }`}
                title="View Database Architecture & Supabase SQL"
              >
                <Database className={`w-3.5 h-3.5 ${isLiveSupabase ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">
                  {isLiveSupabase ? 'Supabase Live' : 'Supabase Engine'}
                </span>
              </button>

              {/* Refresh Button */}
              <button
                id="refresh-data-btn"
                onClick={loadData}
                className="p-2 rounded-lg bg-[#121212] text-slate-400 hover:text-white hover:bg-zinc-800 border border-white/10 transition-colors cursor-pointer"
                title="Refresh Database"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex space-x-1 border-t border-white/10 overflow-x-auto py-1 scrollbar-none">
            <button
              id="tab-btn-pos"
              onClick={() => handleTabClick('pos')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'pos'
                  ? 'bg-white/10 text-emerald-400 border-b-2 border-emerald-500 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>TAB 1: POS & Voucher</span>
            </button>

            <button
              id="tab-btn-archive"
              onClick={() => handleTabClick('archive')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'archive'
                  ? 'bg-white/10 text-emerald-400 border-b-2 border-emerald-500 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>TAB 2: Voucher Archive</span>
              <span className="ml-1 px-1.5 py-0.2 bg-white/10 text-slate-300 rounded-full text-[10px] font-mono">
                {archiveTree.length}
              </span>
            </button>

            <button
              id="tab-btn-inventory"
              onClick={() => handleTabClick('inventory')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-white/10 text-emerald-400 border-b-2 border-emerald-500 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>TAB 3: Product Inventory</span>
              <span className="ml-1 px-1.5 py-0.2 bg-white/10 text-slate-300 rounded-full text-[10px] font-mono">
                {products.length}
              </span>
            </button>

            <button
              id="tab-btn-void-approvals"
              onClick={() => handleTabClick('void_approvals')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'void_approvals'
                  ? 'bg-amber-500/15 text-amber-400 border-b-2 border-amber-500 shadow-xs'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-white/5'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>TAB 4: Owner Void Approvals</span>
              {activeTab !== 'void_approvals' && (
                <Lock className="w-3 h-3 text-amber-400/80 ml-0.5" />
              )}
              {pendingVoidsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-black font-bold rounded-full text-[10px] font-mono animate-pulse">
                  {pendingVoidsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Global Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border text-xs font-medium flex items-center gap-2.5 backdrop-blur-md ${
              notification.type === 'success'
                ? 'bg-[#121212] text-emerald-400 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                : notification.type === 'error'
                ? 'bg-[#121212] text-rose-400 border-rose-500/40'
                : 'bg-[#121212] text-slate-200 border-white/10'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]" />
            <p className="text-sm font-medium text-slate-400">Initializing ShopFlow POS & Supabase sync...</p>
          </div>
        ) : (
          <>
            {activeTab === 'pos' && (
              <PosVoucherGenerator
                products={products}
                dailyLogs={dailyLogs}
                activeLog={activeLog}
                onSelectLog={log => {
                  setActiveLog(log);
                  showNotification(`Selected daily log: ${log.day_label}`, 'info');
                }}
                onCreateTodayLog={handleCreateTodayLog}
                onVoucherCreated={handleVoucherCreated}
                onRefreshData={loadData}
              />
            )}

            {activeTab === 'archive' && (
              <NotionArchive
                archiveTree={archiveTree}
                activeLog={activeLog}
                onSelectActiveLog={log => {
                  setActiveLog(log);
                  showNotification(`Activated ${log.day_label} for POS checkout`, 'success');
                }}
                onCreateTodayLog={handleCreateTodayLog}
                onViewVoucherReceipt={handleViewVoucherReceipt}
                onRefreshData={loadData}
              />
            )}

            {activeTab === 'inventory' && (
              <ProductInventory
                products={products}
                onRefreshData={loadData}
              />
            )}

            {activeTab === 'void_approvals' && (
              <VoidApprovals
                onRefreshData={loadData}
                onOpenChangePin={() => setIsChangePinOpen(true)}
                onLock={() => {
                  setActiveTab('pos');
                  showNotification('Owner void vault locked.', 'info');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Sophisticated Dark Bottom Status Bar */}
      <footer className="bg-black border-t border-white/5 flex items-center px-4 sm:px-8 justify-between py-3 text-xs text-slate-400">
        <div className="flex items-center gap-4 sm:gap-6 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-slate-300 font-medium">
              {isLiveSupabase ? 'Supabase Connected' : 'Local DB Active'}
            </span>
          </span>
          <span className="hidden sm:inline">Terminal: POS-01 (Main Counter)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          SESSION: {activeLog ? activeLog.day_label : 'STANDBY'}
        </div>
      </footer>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        voucher={selectedReceiptVoucher}
        items={selectedReceiptItems}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

      {/* Supabase Schema & Connection Modal */}
      <SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onRefreshData={loadData}
      />

      {/* Owner Authentication Modal (Gating Tab 4) */}
      <OwnerAuthModal
        isOpen={isOwnerAuthOpen}
        onClose={() => setIsOwnerAuthOpen(false)}
        onSuccess={handleOwnerAuthSuccess}
        onOpenChangePin={() => setIsChangePinOpen(true)}
      />

      {/* Change Owner Security PIN Modal */}
      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
        onSuccess={(msg) => showNotification(msg, 'success')}
      />
    </div>
  );
}

