import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import {
  ShieldCheck,
  ShieldAlert,
  Database,
  Cpu,
  Activity,
  GitCompare,
  Clock,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Minus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  FolderOpen,
  Settings2,
  FileText,
  Link as LinkIcon,
  ChevronRight,
  TriangleAlert,
  FlaskConical,
} from 'lucide-react';
import StatusBadge from '../components/UI/StatusBadge';
import type { Status } from '../types';
import {
  MOCK_WORKSPACE,
  MOCK_RUNS,
  MOCK_FINDINGS,
  MOCK_COMPARISONS,
  MOCK_DISTRIBUTION_DATA,
} from '../mockData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function deltaSign(val: number) {
  if (val > 0) return '+';
  if (val < 0) return '';
  return '';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[10px] font-bold tracking-[0.15em] text-slate-500 uppercase mb-3">
    {children}
  </div>
);

interface CheckCardProps {
  icon: React.ElementType;
  title: string;
  status: Status;
  summary: string;
  metric: string;
  method: string;
  lastRun: string;
  actionLabel: string;
  onAction: () => void;
}

const CHECK_BORDER: Record<Status, string> = {
  PASS: 'border-slate-800 hover:border-emerald-500/30',
  WARNING: 'border-amber-500/25 hover:border-amber-500/50',
  FAIL: 'border-red-500/30 hover:border-red-500/60',
  'NOT RUN': 'border-slate-700/50 hover:border-slate-600',
};

const CheckCard: React.FC<CheckCardProps> = ({
  icon: Icon,
  title,
  status,
  summary,
  metric,
  method,
  lastRun,
  actionLabel,
  onAction,
}) => (
  <div
    className={`bg-slate-900 border rounded-sm flex flex-col transition-colors duration-150 ${CHECK_BORDER[status]}`}
  >
    <div className="p-4 flex-1">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">{title}</span>
        </div>
        <StatusBadge status={status} size="sm" />
      </div>
      <div className="text-sm text-slate-300 leading-relaxed mb-3 min-h-[2.5rem]">{summary}</div>
      <div className="font-mono text-xs text-slate-500 bg-slate-950 rounded px-2 py-1.5 border border-slate-800 mb-2">
        {metric}
      </div>
      <div className="text-[10px] text-slate-600 font-mono">Method: {method}</div>
    </div>
    <div className="border-t border-slate-800 px-4 py-2.5 flex items-center justify-between">
      <span className="text-[10px] font-mono text-slate-600">
        <Clock className="w-3 h-3 inline mr-1 mb-0.5" />
        {lastRun}
      </span>
      <button
        onClick={onAction}
        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
      >
        {actionLabel}
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);

interface DeltaRowProps {
  label: string;
  baseline: number | string;
  current: number | string;
  delta: number;
  unit?: string;
  status: Status;
}

const DeltaRow: React.FC<DeltaRowProps> = ({ label, baseline, current, delta, unit = '', status }) => {
  const Arrow =
    delta > 0.001 ? ArrowUp : delta < -0.001 ? ArrowDown : Minus;
  const arrowColor =
    status === 'PASS'
      ? 'text-emerald-500'
      : status === 'WARNING'
      ? 'text-amber-400'
      : status === 'FAIL'
      ? 'text-red-500'
      : 'text-slate-500';
  return (
    <div className="flex items-center py-2.5 border-b border-slate-800/60 last:border-0 gap-4 text-sm">
      <span className="text-slate-400 flex-1 text-xs">{label}</span>
      <span className="font-mono text-slate-500 w-16 text-right text-xs">
        {baseline}
        {unit}
      </span>
      <Arrow className={`w-3.5 h-3.5 shrink-0 ${arrowColor}`} />
      <span className="font-mono text-slate-200 w-16 text-right text-xs">
        {current}
        {unit}
      </span>
      <span
        className={`font-mono w-14 text-right text-xs ${
          delta > 0 && status !== 'PASS'
            ? 'text-amber-400'
            : delta < 0 && status === 'FAIL'
            ? 'text-red-400'
            : 'text-slate-500'
        }`}
      >
        {deltaSign(delta)}
        {typeof delta === 'number' ? delta.toFixed(delta % 1 === 0 ? 0 : 3) : delta}
        {unit}
      </span>
      <div className="w-16 flex justify-end">
        <StatusBadge status={status} size="sm" />
      </div>
    </div>
  );
};

interface TimelineEntry {
  id: string;
  label: string;
  time: string;
  status: Status;
  note: string;
  isCurrent?: boolean;
}

const TimelineItem: React.FC<TimelineEntry & { isLast: boolean }> = ({
  id,
  label,
  time,
  status,
  note,
  isCurrent,
  isLast,
}) => {
  const StatusIcon =
    status === 'PASS'
      ? CheckCircle2
      : status === 'WARNING'
      ? AlertCircle
      : status === 'FAIL'
      ? XCircle
      : HelpCircle;

  const iconColor =
    status === 'PASS'
      ? 'text-emerald-500'
      : status === 'WARNING'
      ? 'text-amber-400'
      : status === 'FAIL'
      ? 'text-red-500'
      : 'text-slate-500';

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center border shrink-0 ${
            isCurrent
              ? 'bg-amber-500/10 border-amber-500/40'
              : 'bg-slate-900 border-slate-700'
          }`}
        >
          <StatusIcon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-slate-800 mt-1 mb-0" />}
      </div>
      <div className="pb-5 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono text-xs font-bold text-slate-300">{id}</span>
          {isCurrent && (
            <span className="text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded-sm tracking-wide">
              CURRENT
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{note}</div>
        <div className="font-mono text-[10px] text-slate-600 mt-1">{time}</div>
      </div>
    </div>
  );
};

// Custom recharts tooltip
const DistTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-sm px-3 py-2 text-xs shadow-lg">
        <div className="font-semibold text-slate-200 mb-1">{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex gap-2 items-center">
            <span style={{ color: p.color }}>{p.name}:</span>
            <span className="font-mono text-slate-200">{p.value.toFixed(3)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const Overview: React.FC = () => {
  const navigate = useNavigate();
  const [demoNotice] = useState(true);

  const latestRun = MOCK_RUNS[MOCK_RUNS.length - 1];
  const baselineRun = MOCK_RUNS.find((r) => r.id === 'RUN-2026-0038')!;
  const openFindings = MOCK_FINDINGS.filter((f) => f.severity === 'WARNING' || f.severity === 'FAIL');
  const overallStatus: Status = latestRun.summary.failures > 0 ? 'FAIL' : latestRun.summary.warnings > 0 ? 'WARNING' : 'PASS';

  const timelineEntries: TimelineEntry[] = [
    {
      id: 'RUN-2026-0042',
      label: 'Current assurance run',
      time: '2026-09-29 · 14:00 UTC',
      status: 'WARNING',
      note: '3 warnings · Controlled anomaly scenario triggered',
      isCurrent: true,
    },
    {
      id: 'RUN-2026-0038',
      label: 'Baseline assurance run',
      time: '2026-09-15 · 08:00 UTC',
      status: 'PASS',
      note: '42 checks · All passed',
    },
    {
      id: 'RUN-2026-0037',
      label: 'Initial workspace registration',
      time: '2026-09-10 · 10:05 UTC',
      status: 'PASS',
      note: '38 checks · Workspace and assets registered',
    },
  ];

  // Findings table rows
  const findingTableRows = [
    {
      id: 'DATA-004',
      category: 'Data Integrity',
      severity: 'WARNING' as Status,
      statusLabel: 'Open',
      observed: '23 duplicates',
      threshold: '0',
      artifact: 'dataset-v1',
    },
    {
      id: 'MODEL-002',
      category: 'Model Integrity',
      severity: 'WARNING' as Status,
      statusLabel: 'Open',
      observed: 'Artifact differs from registered baseline',
      threshold: 'Exact baseline match',
      artifact: 'model.onnx',
    },
    {
      id: 'SHIFT-001',
      category: 'Distribution Shift',
      severity: 'WARNING' as Status,
      statusLabel: 'Open',
      observed: 'PSI 0.21',
      threshold: '0.20',
      artifact: 'current-batch',
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Demo notice banner ─────────────────────────────────────────────── */}
      {demoNotice && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-500/8 border border-amber-500/20 rounded-sm text-xs text-amber-400">
          <FlaskConical className="w-4 h-4 shrink-0" />
          <span>
            <strong className="font-semibold">Prototype / Controlled Demo</strong> — This workspace
            includes a simulated anomaly scenario for demonstration purposes. Controlled anomaly
            scenario triggered.
          </span>
        </div>
      )}

      {/* ── SECTION 1: Hero / System Status ───────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
        <div className="px-6 pt-6 pb-5 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Left: identity */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span className="text-[10px] font-bold tracking-[0.15em] text-slate-500 uppercase">
                  NETRA-Guard · Computer-Vision Assurance Console
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-3">
                {[
                  ['Workspace', MOCK_WORKSPACE.name],
                  ['Latest Run', latestRun.id],
                  ['Last Run', relativeTime(latestRun.completedAt!)],
                  ['Mode', 'LOCAL / OFFLINE'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline gap-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider w-20 shrink-0">
                      {k}
                    </span>
                    <span className="font-mono text-xs text-slate-300">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: main assurance state */}
            <div className="flex flex-col items-start sm:items-end gap-2">
              <span className="text-[10px] font-bold tracking-[0.15em] text-slate-500 uppercase">
                Assurance State
              </span>
              <div
                className={`text-2xl font-bold tracking-tight ${
                  overallStatus === 'PASS'
                    ? 'text-emerald-400'
                    : overallStatus === 'WARNING'
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {overallStatus === 'WARNING' ? 'REVIEW REQUIRED' : overallStatus}
              </div>
              <div className="text-sm text-slate-400">
                {latestRun.summary.warnings} warning
                {latestRun.summary.warnings !== 1 ? 's' : ''} detected in current run
              </div>
              {latestRun.controlledIssueTriggered && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400/80 bg-amber-500/8 border border-amber-500/20 px-2.5 py-1 rounded-sm">
                  <TriangleAlert className="w-3.5 h-3.5" />
                  Controlled anomaly scenario triggered
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Run summary strip */}
        <div className="px-6 py-3 flex items-center gap-6 bg-slate-950/50 flex-wrap">
          {[
            { label: 'Passed', val: latestRun.summary.passed, color: 'text-emerald-400' },
            { label: 'Warnings', val: latestRun.summary.warnings, color: 'text-amber-400' },
            { label: 'Failures', val: latestRun.summary.failures, color: 'text-red-400' },
            { label: 'Total Checks', val: latestRun.summary.totalChecks, color: 'text-slate-300' },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex items-baseline gap-2">
              <span className={`text-xl font-mono font-bold ${color}`}>{val}</span>
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
          <div className="ml-auto font-mono text-[10px] text-slate-600">
            Duration:{' '}
            {Math.round((latestRun.summary.durationMs || 0) / 60000)}m &nbsp;·&nbsp; Run ID:{' '}
            {latestRun.id}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Check Status Grid ──────────────────────────────────── */}
      <div>
        <SectionLabel>Check Status</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <CheckCard
            icon={Database}
            title="Data Integrity"
            status="WARNING"
            summary="23 suspicious samples detected. 1 near-duplicate cluster identified by perceptual hash analysis."
            metric="pHash duplicates: 23 · 1 cluster"
            method="SHA-256 + pHash"
            lastRun={relativeTime(latestRun.completedAt!)}
            actionLabel="View findings"
            onAction={() => navigate('/findings')}
          />
          <CheckCard
            icon={Cpu}
            title="Model Integrity"
            status="WARNING"
            summary="Artifact differs from registered baseline. Simulated condition detected."
            metric="SHA-256: mismatch detected"
            method="SHA-256 hash comparison"
            lastRun={relativeTime(latestRun.completedAt!)}
            actionLabel="View details"
            onAction={() => navigate('/findings')}
          />
          <CheckCard
            icon={Activity}
            title="Distribution Shift"
            status="WARNING"
            summary="PSI exceeded threshold. Brightness and contrast channels show greatest divergence."
            metric="PSI: 0.21 · Threshold: 0.20"
            method="Population Stability Index"
            lastRun={relativeTime(latestRun.completedAt!)}
            actionLabel="Inspect shift"
            onAction={() => navigate('/findings')}
          />
          <CheckCard
            icon={GitCompare}
            title="Assurance Comparator"
            status="WARNING"
            summary="2 new findings compared to baseline. 3 metrics changed beyond threshold."
            metric="2 new findings · 3 changed metrics"
            method="Run-to-run delta comparison"
            lastRun={relativeTime(latestRun.completedAt!)}
            actionLabel="Compare runs"
            onAction={() => navigate('/run')}
          />
        </div>
      </div>

      {/* ── SECTION 3: Baseline vs Current ────────────────────────────────── */}
      <div>
        <SectionLabel>Baseline vs. Current Comparison</SectionLabel>
        <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-0 border-b border-slate-800">
            {/* Baseline */}
            <div className="px-5 py-4">
              <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">
                Baseline
              </div>
              <div className="font-mono text-sm font-bold text-slate-200">{baselineRun.id}</div>
              <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                {new Date(baselineRun.completedAt!).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
              <div className="mt-2">
                <StatusBadge status="PASS" size="sm" />
              </div>
            </div>

            {/* Delta column header */}
            <div className="flex flex-col items-center justify-center px-6 border-x border-slate-800 bg-slate-950/40">
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="text-[9px] text-slate-600 mt-1 font-mono tracking-widest">DELTA</div>
            </div>

            {/* Current */}
            <div className="px-5 py-4">
              <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">
                Current
              </div>
              <div className="font-mono text-sm font-bold text-slate-200">{latestRun.id}</div>
              <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                {new Date(latestRun.completedAt!).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
              <div className="mt-2">
                <StatusBadge status="WARNING" size="sm" />
              </div>
            </div>
          </div>

          {/* Delta summary chips */}
          <div className="flex items-center gap-3 px-5 py-3 bg-slate-950/30 border-b border-slate-800 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/8 border border-amber-500/20 px-2.5 py-1 rounded-sm">
              <ArrowUp className="w-3 h-3" />2 new findings
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 bg-emerald-500/8 border border-emerald-500/20 px-2.5 py-1 rounded-sm">
              <ArrowDown className="w-3 h-3" />1 cleared finding
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/8 border border-blue-500/20 px-2.5 py-1 rounded-sm">
              <Activity className="w-3 h-3" />3 changed metrics
            </div>
          </div>

          {/* Metric delta rows */}
          <div className="px-5 py-1">
            <div className="flex items-center py-2 text-[10px] font-bold tracking-wider text-slate-600 uppercase border-b border-slate-800 gap-4">
              <span className="flex-1">Metric</span>
              <span className="w-16 text-right">Baseline</span>
              <span className="w-3.5" />
              <span className="w-16 text-right">Current</span>
              <span className="w-14 text-right">Δ</span>
              <span className="w-16 text-right">Status</span>
            </div>
            {MOCK_COMPARISONS.map((c) => (
              <DeltaRow
                key={c.metricName}
                label={c.metricName}
                baseline={c.baseline}
                current={c.current}
                delta={c.delta}
                status={c.status}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 4: Findings Summary Table ─────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Open Findings — {latestRun.id}</SectionLabel>
          <button
            onClick={() => navigate('/findings')}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            View all findings <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                {['ID', 'Category', 'Severity', 'Status', 'Observed', 'Threshold', 'Artifact'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {findingTableRows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate('/findings')}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-bold text-slate-300">{row.id}</td>
                  <td className="px-4 py-3 text-slate-400">{row.category}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.severity} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-amber-400 font-semibold">{row.statusLabel}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">{row.observed}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{row.threshold}</td>
                  <td className="px-4 py-3 font-mono text-blue-400/80">{row.artifact}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {openFindings.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-sm">No open findings.</div>
          )}
        </div>
      </div>

      {/* ── SECTION 5 + 6: Distribution Chart & Timeline ──────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart — takes 2/3 */}
        <div className="xl:col-span-2">
          <SectionLabel>Distribution Shift — Feature Δ (Baseline vs. Current)</SectionLabel>
          <div className="bg-slate-900 border border-slate-800 rounded-sm p-5">
            <div className="text-xs text-slate-500 mb-4 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              Normalised feature deviation · Threshold: 0.20 (red dashed line)
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={MOCK_DISTRIBUTION_DATA}
                barGap={4}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#282D35"
                  vertical={false}
                />
                <XAxis
                  dataKey="feature"
                  tick={{ fill: '#737A85', fontSize: 10 }}
                  axisLine={{ stroke: '#282D35' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#737A85', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 1]}
                  tickFormatter={(v) => v.toFixed(1)}
                />
                <Tooltip content={<DistTooltip />} cursor={{ fill: 'rgba(115,122,133,0.05)' }} />
                <Legend
                  wrapperStyle={{ fontSize: '10px', color: '#8E959F', paddingTop: '12px' }}
                  iconType="square"
                  iconSize={8}
                />
                <ReferenceLine
                  y={0.2}
                  stroke="#C85C5C"
                  strokeDasharray="4 3"
                  strokeOpacity={0.6}
                  label={{ value: 'Threshold', fill: '#C85C5C', fontSize: 9, position: 'insideTopRight' }}
                />
                <Bar
                  dataKey="baseline"
                  name="Baseline"
                  fill="#59616D"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="current"
                  name="Current"
                  fill="#D6A84F"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={28}
                  fillOpacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline — takes 1/3 */}
        <div>
          <SectionLabel>Recent Run Timeline</SectionLabel>
          <div className="bg-slate-900 border border-slate-800 rounded-sm p-5">
            {timelineEntries.map((entry, i) => (
              <TimelineItem
                key={entry.id}
                {...entry}
                isLast={i === timelineEntries.length - 1}
              />
            ))}
            <button
              onClick={() => navigate('/run')}
              className="mt-2 w-full text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 py-2 border border-slate-800 rounded-sm hover:border-slate-700 transition-colors"
            >
              View all runs <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 7: Provenance status strip ────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-sm px-5 py-4 flex items-center gap-4 flex-wrap">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
        <div className="flex-1">
          <div className="text-xs font-bold text-slate-300">Provenance Chain</div>
          <div className="text-xs text-slate-500 mt-0.5">
            3 ledger entries · Hash chain integrity verified for registered assets · Controlled run recorded
          </div>
        </div>
        <StatusBadge status="WARNING" size="sm" />
        <button
          onClick={() => navigate('/provenance')}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
        >
          View ledger <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── SECTION 8: Quick Actions ───────────────────────────────────────── */}
      <div>
        <SectionLabel>Quick Actions</SectionLabel>
        <div className="flex flex-wrap gap-3">
          {[
            {
              icon: FolderOpen,
              label: 'Load Demo Workspace',
              onClick: () => navigate('/workspace'),
              variant: 'secondary',
            },
            {
              icon: Settings2,
              label: 'Configure Assurance Run',
              onClick: () => navigate('/run'),
              variant: 'secondary',
            },
            {
              icon: ShieldAlert,
              label: 'View Findings',
              onClick: () => navigate('/findings'),
              variant: 'primary',
            },
            {
              icon: LinkIcon,
              label: 'View Provenance',
              onClick: () => navigate('/provenance'),
              variant: 'secondary',
            },
            {
              icon: FileText,
              label: 'Export JSON Report',
              onClick: () => navigate('/reports'),
              variant: 'secondary',
            },
          ].map(({ icon: Icon, label, onClick, variant }) => (
            <button
              key={label}
              onClick={onClick}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-sm border transition-colors
                ${
                  variant === 'primary'
                    ? 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-slate-100'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Overview;
