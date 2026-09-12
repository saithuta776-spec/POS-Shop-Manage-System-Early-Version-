import React, { useState } from 'react';
import { Database, Check, Copy, Key, ExternalLink, X, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA, isLiveSupabase, dbService } from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => Promise<void>;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [copied, setCopied] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('shopflow_supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('shopflow_supabase_anon_key') || '');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveCredentials = () => {
    if (supabaseUrl.trim() && supabaseKey.trim()) {
      localStorage.setItem('shopflow_supabase_url', supabaseUrl.trim());
      localStorage.setItem('shopflow_supabase_anon_key', supabaseKey.trim());
      setStatusMsg('Credentials saved! Reloading application to connect...');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      localStorage.removeItem('shopflow_supabase_url');
      localStorage.removeItem('shopflow_supabase_anon_key');
      setStatusMsg('Switched to local offline-resilient storage mode.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleResetSeed = async () => {
    if (window.confirm('Reset local database to initial demo state (products, daily logs, historical vouchers)?')) {
      dbService.resetToDefaultSeed();
      await onRefreshData();
      setStatusMsg('Reset database seed successfully.');
      setTimeout(() => setStatusMsg(null), 2500);
    }
  };

  return (
    <div
      id="supabase-config-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-[#0a0a0a] rounded-2xl shadow-2xl border border-white/10 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 bg-[#0e0e0e] border-b border-white/10 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Supabase & Database Architecture</h3>
              <p className="text-[11px] text-slate-400 font-mono">PostgreSQL Schema & Live Client Integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs font-sans text-slate-300">
          {statusMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Connection Status Banner */}
          <div className="p-4 rounded-xl bg-[#121212] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isLiveSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-blue-400'
                  }`}
                />
                Engine Status: {isLiveSupabase ? 'Connected to Live Supabase' : 'Offline-Resilient Local DB'}
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {isLiveSupabase
                  ? 'All reads and writes synchronize in real-time with your PostgreSQL cloud instance.'
                  : 'Operating seamlessly with local storage engine mirroring the full Supabase schema.'}
              </p>
            </div>

            <button
              onClick={handleResetSeed}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Demo Seed
            </button>
          </div>

          {/* Schema SQL Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 text-xs uppercase tracking-wider font-mono">
                1. Supabase PostgreSQL Migration Script
              </span>
              <button
                onClick={handleCopySQL}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-slate-200 font-medium rounded-lg text-xs transition-colors cursor-pointer border border-white/5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied SQL' : 'Copy SQL Schema'}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#050505] text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed border border-white/10">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>

          {/* Connect Live Supabase Project */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <span className="font-bold text-slate-300 text-xs uppercase tracking-wider block font-mono">
              2. Connect Live Supabase Credentials (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1 font-mono">SUPABASE URL</label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1 font-mono">ANON PUBLIC KEY</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..."
                  value={supabaseKey}
                  onChange={e => setSupabaseKey(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={handleSaveCredentials}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
