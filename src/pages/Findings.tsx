import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  XCircle,
  CheckCircle2,
  ChevronDown,
  Filter,
  Activity,
  Database,
  Cpu,
  GitCompare,
  Shield,
  FlaskConical,
  Info,
  Copy,
  Check,
  ExternalLink,
  ZoomIn,
  X,
  Hash,
  FileSearch,
  ClipboardCheck,
  AlertTriangle,
} from 'lucide-react';
import Drawer from '../components/UI/Drawer';
import type {
  RichFinding,
  RichEvidence,
  FindingSeverity,
  FindingStatus,
  FindingCategory,
  DispositionRecommendation,
} from '../types';
import { RICH_FINDINGS } from '../mockData/findings';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEV_CONFIG: Record<FindingSeverity, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  CRITICAL: { label: 'CRITICAL', color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     icon: XCircle      },
  WARNING:  { label: 'WARNING',  color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   icon: AlertCircle  },
  INFO:     { label: 'INFO',     color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: Info         },
  PASS:     { label: 'PASS',     color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle2 },
};

const STATUS_CONFIG: Record<FindingStatus, { label: string; color: string; dot: string }> = {
  OPEN:     { label: 'Open',     color: 'text-amber-400',   dot: 'bg-amber-400'   },
  REVIEWED: { label: 'Reviewed', color: 'text-blue-400',    dot: 'bg-blue-400'    },
  CLEARED:  { label: 'Cleared',  color: 'text-emerald-400', dot: 'bg-emerald-400' },
};

const CAT_ICONS: Record<FindingCategory, React.ElementType> = {
  DATA_INTEGRITY:    Database,
  MODEL_INTEGRITY:   Cpu,
  DISTRIBUTION_SHIFT: Activity,
  COMPARATOR:        GitCompare,
  ROBUSTNESS:        Shield,
};

const DISP_CONFIG: Record<DispositionRecommendation, { label: string; color: string; bg: string; border: string }> = {
  ACCEPT:     { label: 'Accept',     color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  REVIEW:     { label: 'Review',     color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30'  },
  QUARANTINE: { label: 'Quarantine', color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30'    },
};

const ALL_CATS: { value: FindingCategory | ''; label: string }[] = [
  { value: '', label: 'All categories' },
  { value: 'DATA_INTEGRITY',    label: 'Data Integrity' },
  { value: 'MODEL_INTEGRITY',   label: 'Model Integrity' },
  { value: 'DISTRIBUTION_SHIFT', label: 'Distribution Shift' },
  { value: 'COMPARATOR',        label: 'Comparator' },
  { value: 'ROBUSTNESS',        label: 'Robustness' },
];

const ALL_SEVS: { value: FindingSeverity | ''; label: string }[] = [
  { value: '', label: 'All severities' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'WARNING',  label: 'Warning' },
  { value: 'INFO',     label: 'Info' },
  { value: 'PASS',     label: 'Pass' },
];

const ALL_STATUSES: { value: FindingStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'OPEN',     label: 'Open' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'CLEARED',  label: 'Cleared' },
];

function truncateHash(h: string, n = 8) {
  return h.length > 16 ? `${h.slice(0, n)}…${h.slice(-4)}` : h;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SeverityBadge: React.FC<{ sev: FindingSeverity; size?: 'sm' | 'md' }> = ({ sev, size = 'md' }) => {
  const cfg = SEV_CONFIG[sev];
  const Icon = cfg.icon;
  const cls = size === 'sm'
    ? 'px-2 py-0.5 text-[10px] gap-1'
    : 'px-2.5 py-1 text-xs gap-1.5';
  return (
    <span className={`inline-flex items-center font-semibold tracking-wide rounded-sm border ${cfg.color} ${cfg.bg} ${cfg.border} ${cls}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {cfg.label}
    </span>
  );
};

const StatusDot: React.FC<{ status: FindingStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const CopyHash: React.FC<{ hash: string }> = ({ hash }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(hash); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded group cursor-pointer" onClick={copy}>
      {truncateHash(hash)}
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600" />}
    </span>
  );
};

const FilterSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ElementType;
}> = ({ value, onChange, options, icon: Icon }) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none bg-slate-900 border border-slate-700 rounded-sm text-xs text-slate-300 py-2 pr-7 focus:outline-none focus:border-blue-500 cursor-pointer hover:border-slate-600 transition-colors ${Icon ? 'pl-8' : 'pl-3'}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
  </div>
);

// ─── Evidence Viewer ──────────────────────────────────────────────────────────

const EvidenceItem: React.FC<{
  ev: RichEvidence;
  onZoom: (url: string, caption: string) => void;
}> = ({ ev, onZoom }) => {
  if (ev.type === 'IMAGE' && ev.thumbnailDataUrl) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-sm overflow-hidden">
        <div
          className="relative group cursor-zoom-in"
          onClick={() => onZoom(ev.thumbnailDataUrl!, `${ev.sampleId ?? ev.id} · Finding ${ev.findingId}`)}
        >
          <img
            src={ev.thumbnailDataUrl}
            alt={`Evidence thumbnail — ${ev.sampleId ?? ev.id}`}
            className="w-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center">
            <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="p-3 space-y-1.5 text-xs">
          {ev.sampleId && (
            <div className="flex justify-between">
              <span className="text-slate-500">Sample ID</span>
              <span className="font-mono text-slate-300">{ev.sampleId}</span>
            </div>
          )}
          {ev.expectedLabel && (
            <div className="flex justify-between">
              <span className="text-slate-500">Expected label</span>
              <span className="font-mono text-slate-300">{ev.expectedLabel}</span>
            </div>
          )}
          {ev.observedLabel && (
            <div className="flex justify-between">
              <span className="text-slate-500">Observed label</span>
              <span className={`font-mono ${ev.observedLabel !== ev.expectedLabel ? 'text-amber-400' : 'text-emerald-400'}`}>
                {ev.observedLabel}
              </span>
            </div>
          )}

          {ev.fileHash && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500">File hash</span>
              <CopyHash hash={ev.fileHash} />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (ev.type === 'HASH_MISMATCH') {
    return (
      <div className="bg-slate-950 border border-red-500/20 rounded-sm p-3">
        <div className="flex items-center gap-2 mb-2">
          <Hash className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-semibold text-red-400">Hash Mismatch</span>
        </div>
        <p className="text-xs font-mono text-slate-400 leading-relaxed">{ev.description}</p>
      </div>
    );
  }

  if (ev.type === 'LOG' && ev.content) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-sm p-3">
        <div className="flex items-center gap-2 mb-2">
          <FileSearch className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-400">Log output</span>
        </div>
        <pre className="text-[10px] font-mono text-slate-400 leading-relaxed whitespace-pre-wrap break-all">{ev.content}</pre>
      </div>
    );
  }

  // METRIC or fallback
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-sm p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Activity className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-xs font-semibold text-slate-400">Metric</span>
      </div>
      <p className="text-xs font-mono text-slate-400 leading-relaxed">{ev.description}</p>
    </div>
  );
};

// ─── Lightbox ─────────────────────────────────────────────────────────────────

const Lightbox: React.FC<{ url: string; caption: string; onClose: () => void }> = ({ url, caption, onClose }) => (
  <div
    className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur flex items-center justify-center p-8"
    onClick={onClose}
  >
    <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onClose}
        className="absolute -top-10 right-0 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 text-xs"
      >
        <X className="w-4 h-4" /> Close
      </button>
      <img src={url} alt={caption} className="w-full rounded-sm border border-slate-700 shadow-2xl" />
      <div className="mt-3 text-center font-mono text-xs text-slate-500">{caption}</div>
      <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-slate-600">
        <Info className="w-3 h-3" />
        Prototype placeholder — no raw filesystem path exposed
      </div>
    </div>
  </div>
);

// ─── Finding Detail Drawer Content ────────────────────────────────────────────

const FindingDetail: React.FC<{
  finding: RichFinding;
  onOpenRun: () => void;
  onZoom: (url: string, caption: string) => void;
}> = ({ finding, onOpenRun, onZoom }) => {
  const CatIcon = CAT_ICONS[finding.category];
  const disp = DISP_CONFIG[finding.disposition];

  return (
    <div className="space-y-6 text-sm">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CatIcon className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">{finding.categoryLabel}</span>
          </div>
          <h3 className="text-base font-semibold text-slate-100 leading-snug">{finding.title}</h3>
          <div className="flex items-center gap-3 mt-2">
            <SeverityBadge sev={finding.severity} size="sm" />
            <StatusDot status={finding.status} />
            {finding.controlledScenario && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400/80 bg-amber-500/8 border border-amber-500/20 px-1.5 py-0.5 rounded-sm">
                <FlaskConical className="w-2.5 h-2.5" />Controlled scenario
              </span>
            )}
          </div>
        </div>
        <span className="font-mono text-xs text-slate-600 shrink-0">{finding.id}</span>
      </div>

      {/* ── Description ── */}
      <div>
        <div className="section-label">Description</div>
        <p className="text-slate-300 leading-relaxed text-xs">{finding.description}</p>
      </div>

      {/* ── What was tested ── */}
      <div>
        <div className="section-label">What was tested</div>
        <p className="text-slate-400 text-xs leading-relaxed">{finding.whatWasTested}</p>
        <div className="mt-2 font-mono text-[10px] text-slate-600">Method: {finding.method}</div>
      </div>

      {/* ── Observed / Expected ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-sm p-3">
          <div className="text-[10px] font-bold tracking-wider text-slate-600 uppercase mb-2">Observed</div>
          <div className="font-mono text-xs text-amber-400 leading-relaxed break-all">{finding.observedValue}</div>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-sm p-3">
          <div className="text-[10px] font-bold tracking-wider text-slate-600 uppercase mb-2">Expected</div>
          <div className="font-mono text-xs text-slate-300 leading-relaxed break-all">{finding.expectedValue}</div>
        </div>
      </div>

      {/* ── Threshold ── */}
      <div>
        <div className="section-label">Threshold</div>
        <div className="font-mono text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-sm px-3 py-2">
          {finding.thresholdLabel}
        </div>
      </div>

      {/* ── Certainty ── */}
      <div>
        <div className="section-label">Certainty</div>
        <div className={`text-xs px-3 py-2 rounded-sm border ${finding.certaintyType === 'DETERMINISTIC' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400/80' : 'bg-blue-500/5 border-blue-500/20 text-blue-400/80'}`}>
          {finding.certaintyType === 'DETERMINISTIC'
            ? 'Rule-based / deterministic check'
            : 'Statistical check'}
        </div>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{finding.certaintyNote}</p>

        {finding.statisticalMetric && (
          <div className="mt-3 bg-slate-950 border border-slate-800 rounded-sm p-3 grid grid-cols-3 gap-3 text-xs">
            {[
              { label: 'Raw metric', value: `${finding.statisticalMetric.raw.toFixed(3)} ${finding.statisticalMetric.unit}` },
              { label: 'Threshold',  value: `${finding.statisticalMetric.threshold.toFixed(3)} ${finding.statisticalMetric.unit}` },
              { label: 'Sample count', value: finding.statisticalMetric.sampleCount.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">{label}</div>
                <div className="font-mono text-slate-300">{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Evidence ── */}
      <div>
        <div className="section-label">Evidence ({finding.evidence.length})</div>
        {finding.evidence.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-sm p-4 text-xs text-slate-500 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            Structured evidence is available, but no image preview is provided for this finding.
          </div>
        ) : (
          <div className="space-y-3">
            {finding.evidence.map((ev) => (
              <EvidenceItem key={ev.id} ev={ev} onZoom={onZoom} />
            ))}
          </div>
        )}
      </div>

      {/* ── Limitations ── */}
      <div>
        <div className="section-label flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          Limitations
        </div>
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-sm px-3 py-2.5 text-xs text-amber-400/80 leading-relaxed">
          {finding.limitations}
        </div>
      </div>

      {/* ── Recommended disposition ── */}
      <div>
        <div className="section-label">Recommended Disposition</div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border text-sm font-semibold ${disp.color} ${disp.bg} ${disp.border}`}>
          <ClipboardCheck className="w-4 h-4" />
          {disp.label}
        </div>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{finding.dispositionRationale}</p>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-600">
          <Info className="w-3 h-3" />
          Dispositions are analyst recommendations based on finding state, not automated decisions.
        </div>
      </div>

      {/* ── Linked run ── */}
      <div className="border-t border-slate-800 pt-4">
        <div className="section-label">Linked Run</div>
        <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-sm px-3 py-2.5">
          <span className="font-mono text-xs text-slate-300">{finding.runId}</span>
          <button
            onClick={onOpenRun}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Open Run <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Findings: React.FC = () => {
  const navigate = useNavigate();

  // Filter state
  const [catFilter,    setCatFilter]    = useState<string>('');
  const [sevFilter,    setSevFilter]    = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Drawer / lightbox state
  const [selectedFinding, setSelectedFinding] = useState<RichFinding | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; caption: string } | null>(null);

  // Filtered findings
  const filtered = useMemo(() => RICH_FINDINGS.filter((f) => {
    if (catFilter    && f.category !== catFilter)    return false;
    if (sevFilter    && f.severity !== sevFilter)    return false;
    if (statusFilter && f.status   !== statusFilter) return false;
    return true;
  }), [catFilter, sevFilter, statusFilter]);

  // Summary counts
  const summary = useMemo(() => ({
    total:    RICH_FINDINGS.length,
    critical: RICH_FINDINGS.filter((f) => f.severity === 'CRITICAL').length,
    warning:  RICH_FINDINGS.filter((f) => f.severity === 'WARNING').length,
    cleared:  RICH_FINDINGS.filter((f) => f.status   === 'CLEARED').length,
  }), []);

  const handleZoom = useCallback((url: string, caption: string) => {
    setLightbox({ url, caption });
  }, []);

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="pb-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5 mb-1">
          <FileSearch className="w-5 h-5 text-slate-500" />
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Findings</h1>
        </div>
        <p className="text-sm text-slate-400">Evidence-backed observations from assurance runs.</p>
        <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-600">
          <span>Run: RUN-2026-0042</span>
          <span>·</span>
          <span>Workspace: ws-SIH26228</span>
          <span>·</span>
          <span className="flex items-center gap-1 text-amber-500/70">
            <FlaskConical className="w-2.5 h-2.5" />
            Prototype / Controlled Demo
          </span>
        </div>
      </div>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total findings', value: summary.total,    color: 'text-slate-200', icon: FileSearch },
          { label: 'Critical',       value: summary.critical, color: 'text-red-400',   icon: XCircle   },
          { label: 'Warnings',       value: summary.warning,  color: 'text-amber-400', icon: AlertCircle },
          { label: 'Cleared',        value: summary.cleared,  color: 'text-emerald-400', icon: CheckCircle2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-sm px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className={`text-2xl font-mono font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>
        <FilterSelect
          value={catFilter}
          onChange={setCatFilter}
          options={ALL_CATS}
        />
        <FilterSelect
          value={sevFilter}
          onChange={setSevFilter}
          options={ALL_SEVS}
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={ALL_STATUSES}
        />
        {(catFilter || sevFilter || statusFilter) && (
          <button
            onClick={() => { setCatFilter(''); setSevFilter(''); setStatusFilter(''); }}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-slate-600 font-mono">
          {filtered.length} of {RICH_FINDINGS.length} findings
        </span>
      </div>

      {/* ── Findings table ───────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60">
              {['ID', 'Category', 'Severity', 'Status', 'Title', 'Observed', 'Threshold', 'Artifact', 'Run'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                  No findings match the current filters.
                </td>
              </tr>
            ) : filtered.map((f) => {
              const CatIcon = CAT_ICONS[f.category];
              return (
                <tr
                  key={f.id}
                  onClick={() => setSelectedFinding(f)}
                  className={`cursor-pointer transition-colors hover:bg-slate-800/40 group
                    ${f.severity === 'CRITICAL' ? 'border-l-2 border-l-red-500/50' : ''}`}
                >
                  {/* ID */}
                  <td className="px-4 py-3 font-mono font-bold text-slate-300 group-hover:text-white transition-colors whitespace-nowrap">
                    {f.id}
                  </td>
                  {/* Category */}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-slate-400 whitespace-nowrap">
                      <CatIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      {f.categoryLabel}
                    </span>
                  </td>
                  {/* Severity */}
                  <td className="px-4 py-3">
                    <SeverityBadge sev={f.severity} size="sm" />
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusDot status={f.status} />
                  </td>
                  {/* Title */}
                  <td className="px-4 py-3 text-slate-300 max-w-[220px]">
                    <span className="line-clamp-1">{f.title}</span>
                    {f.controlledScenario && (
                      <span className="ml-1.5 text-[9px] text-amber-500/70 font-mono">[controlled]</span>
                    )}
                  </td>
                  {/* Observed */}
                  <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">{f.observed}</td>
                  {/* Threshold */}
                  <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">{f.threshold}</td>
                  {/* Artifact */}
                  <td className="px-4 py-3 font-mono text-blue-400/80 whitespace-nowrap">{f.affectedArtifact}</td>
                  {/* Run */}
                  <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">{f.runId}</td>
                </tr>
              );

            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
        <Info className="w-3 h-3" />
        Click any row to open the full finding detail.
      </div>

      {/* ── Finding detail drawer ─────────────────────────────────────────── */}
      <Drawer
        isOpen={!!selectedFinding}
        onClose={() => setSelectedFinding(null)}
        title={selectedFinding ? `${selectedFinding.id} — ${selectedFinding.categoryLabel}` : ''}
        subtitle={selectedFinding?.title}
        width="w-[560px]"
      >
        {selectedFinding && (
          <FindingDetail
            finding={selectedFinding}
            onOpenRun={() => { setSelectedFinding(null); navigate('/run'); }}
            onZoom={handleZoom}
          />
        )}
      </Drawer>

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {lightbox && (
        <Lightbox
          url={lightbox.url}
          caption={lightbox.caption}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
};

export default Findings;
