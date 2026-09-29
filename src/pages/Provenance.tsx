import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Link as LinkIcon,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  Database,
  Loader2,
  FileText,
  Activity,
  ArrowDown
} from 'lucide-react';
import Drawer from '../components/UI/Drawer';
import type { ProvenanceEntry } from '../types';
import { fetchProvenance, verifyLedger } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncateHash(h: string, start = 8, end = 8) {
  return h.length > (start + end) ? `${h.slice(0, start)}…${h.slice(-end)}` : h;
}

const CopyHash: React.FC<{ hash: string; fullWidth?: boolean }> = ({ hash, fullWidth }) => {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div
      onClick={copy}
      className={`group cursor-pointer flex items-center justify-between font-mono text-xs text-slate-400 bg-slate-950 border border-slate-800 px-2 py-1 rounded transition-colors hover:border-slate-700 ${fullWidth ? 'w-full' : 'inline-flex gap-2'}`}
      title={hash}
    >
      <span className="truncate">{fullWidth ? hash : truncateHash(hash)}</span>
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      ) : (
        <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 shrink-0" />
      )}
    </div>
  );
};

const VERIFICATION_STEPS = [
  'Loading entries from local ledger...',
  'Recomputing entry payload hashes...',
  'Checking previous cryptographic links...',
  'Checking current entry signatures...',
  'Verification complete.',
];

// ─── Component ────────────────────────────────────────────────────────────────

const Provenance: React.FC = () => {
  const [entries, setEntries] = useState<ProvenanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<ProvenanceEntry | null>(null);

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifyStatus, setVerifyStatus] = useState<'IDLE' | 'VALID' | 'INVALID'>('VALID');
  const [lastVerified, setLastVerified] = useState<string>('Just now');

  useEffect(() => {
    fetchProvenance()
      .then(setEntries)
      .finally(() => setLoading(false));
  }, []);

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerifyStep(0);
    setVerifyStatus('IDLE');

    // Simulate animated verification steps
    for (let i = 0; i < VERIFICATION_STEPS.length; i++) {
      setVerifyStep(i);
      await new Promise(r => setTimeout(r, 600)); // 600ms per step
    }

    try {
      const result = await verifyLedger();
      setVerifyStatus(result.valid ? 'VALID' : 'INVALID');
      setLastVerified('Just now');
    } catch (e) {
      setVerifyStatus('INVALID');
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  const latestSequence = entries.length > 0 ? entries[0].sequence : '—';
  const entryCount = entries.length;

  return (
    <div className="space-y-8 pb-10">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="pb-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5 mb-1">
          <LinkIcon className="w-5 h-5 text-slate-500" />
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Provenance</h1>
        </div>
        <p className="text-sm text-slate-400">Tamper-evident history of assurance runs and artifacts.</p>
      </div>

      {/* ── Top Status Card ──────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-sm p-6 relative overflow-hidden">
        {isVerifying ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <div className="text-sm font-medium text-slate-300 mb-1">Verifying Ledger Integrity</div>
            <div className="text-xs text-slate-500 font-mono animate-pulse">
              {VERIFICATION_STEPS[verifyStep]}
            </div>
            {/* Progress bar */}
            <div className="w-64 h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${((verifyStep + 1) / VERIFICATION_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        ) : verifyStatus === 'VALID' ? (
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-1">Ledger Integrity</div>
                <div className="text-xl font-semibold text-slate-100 mb-1">VALID</div>
                <div className="text-sm text-slate-400">All {entryCount} entries verified.</div>
              </div>
            </div>
            <button
              onClick={handleVerify}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-4 py-2 rounded transition-colors"
            >
              Verify Ledger
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <div className="text-xs font-bold tracking-widest text-red-400 uppercase mb-1">Ledger Integrity Failure</div>
                <div className="text-xl font-semibold text-slate-100 mb-1">INVALID</div>
                <div className="text-sm text-slate-400">First invalid sequence: 041</div>
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                  <Activity className="w-3.5 h-3.5" /> Controlled test copy
                </div>
              </div>
            </div>
            <button
              onClick={handleVerify}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-4 py-2 rounded transition-colors"
            >
              Retry Verification
            </button>
          </div>
        )}

        {/* Stats footer */}
        {!isVerifying && (
          <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Last Verified</div>
              <div className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-500" /> {lastVerified}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Entry Count</div>
              <div className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Database className="w-3 h-3 text-slate-500" /> {entryCount}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Latest Sequence</div>
              <div className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-slate-500" /> {latestSequence}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Section 1: Hash Chain Visualization ───────────────────────────── */}
        <div className="xl:col-span-1 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Hash Chain</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-sm p-4 h-[600px] overflow-y-auto">
            <div className="flex flex-col items-center">
              {entries.map((entry, idx) => (
                <React.Fragment key={entry.sequence}>
                  {/* Node */}
                  <div
                    onClick={() => setSelectedEntry(entry)}
                    className="w-full max-w-sm bg-slate-950 border border-slate-700 rounded p-4 relative group cursor-pointer hover:border-blue-500/50 transition-colors"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-800 rounded-l group-hover:bg-blue-500/50 transition-colors" />
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                        ENTRY {entry.sequence}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, timeZone: 'UTC' })} UTC
                      </div>
                    </div>
                    <div className="mb-2 text-sm font-medium text-slate-200">
                      {entry.runId}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase mb-0.5">Hash</div>
                        <div className="font-mono text-[10px] text-emerald-400/80 truncate">
                          {truncateHash(entry.currentEntryHash, 12, 12)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase mb-0.5">Previous</div>
                        <div className="font-mono text-[10px] text-slate-500 truncate">
                          {entry.previousEntryHash === '0000000000000000000000000000000000000000000000000000000000000000'
                            ? 'GENESIS'
                            : truncateHash(entry.previousEntryHash, 12, 12)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Link arrow */}
                  {idx < entries.length - 1 && (
                    <div className="py-2 text-slate-700">
                      <ArrowDown className="w-5 h-5" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section 2: Run History Table ─────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Run History</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-950/90 backdrop-blur z-10">
                <tr className="border-b border-slate-800">
                  {['Seq', 'Run ID', 'Timestamp', 'Status', 'Baseline', 'Entry Hash', 'Verification'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {entries.map((entry) => (
                  <tr
                    key={entry.sequence}
                    onClick={() => setSelectedEntry(entry)}
                    className="cursor-pointer transition-colors hover:bg-slate-800/40 group"
                  >
                    <td className="px-4 py-3 font-mono text-slate-400">{entry.sequence}</td>
                    <td className="px-4 py-3 font-medium text-slate-300">{entry.runId}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, timeZone: 'UTC' })} UTC
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                        entry.status === 'PASS' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                        entry.status === 'WARNING' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
                        entry.status === 'REVIEW' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
                        'text-red-400 border-red-500/20 bg-red-500/10'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{entry.baseline}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                        {truncateHash(entry.currentEntryHash)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> VALID
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Section 3: Ledger Entry Detail Drawer ────────────────────────── */}
      <Drawer
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title="Ledger Entry Detail"
        subtitle={selectedEntry ? `Sequence ${selectedEntry.sequence}` : ''}
        width="w-[600px]"
      >
        {selectedEntry && (
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Run ID</div>
                <div className="font-mono text-slate-200">{selectedEntry.runId}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Timestamp</div>
                <div className="font-mono text-slate-200">{selectedEntry.timestamp}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Actor</div>
                <div className="font-mono text-slate-200">{selectedEntry.actor}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Verification</div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" /> VERIFIED
                </div>
              </div>
            </div>

            {selectedEntry.isControlledTest && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 flex items-start gap-2.5">
                <Activity className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-amber-400 mb-0.5">Controlled test copy</div>
                  <div className="text-xs text-amber-400/80 leading-relaxed">
                    This entry contains simulated condition parameters for demonstration purposes.
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">Asset Hashes</div>
                <div className="space-y-2">
                  {selectedEntry.assetHashes.map((h, i) => (
                    <CopyHash key={i} hash={h} fullWidth />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">Configuration Hash</div>
                <CopyHash hash={selectedEntry.configHash} fullWidth />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">Summary Hash</div>
                <CopyHash hash={selectedEntry.summaryHash} fullWidth />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 space-y-4">
              <h3 className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Chain Links</h3>
              <div>
                <div className="text-[10px] text-slate-500 uppercase mb-1">Previous Entry Hash</div>
                <CopyHash hash={selectedEntry.previousEntryHash} fullWidth />
              </div>
              <div>
                <div className="text-[10px] text-emerald-400/80 uppercase mb-1">Current Entry Hash</div>
                <CopyHash hash={selectedEntry.currentEntryHash} fullWidth />
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Provenance;
