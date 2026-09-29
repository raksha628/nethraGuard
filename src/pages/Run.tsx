import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlayCircle,
  CheckSquare,
  Square,
  Database,
  Cpu,
  Activity,
  GitCompare,
  ChevronDown,
  ChevronUp,
  Info,
  FlaskConical,
  TriangleAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  FileText,
  Link as LinkIcon,
  ArrowRight,
  Download,
  RotateCcw,
} from 'lucide-react';
import StatusBadge from '../components/UI/StatusBadge';
import type {
  CheckId,
  RunStage,
  StageStatus,
  ScenarioConfig,
  ThresholdConfig,
  RunResult,
} from '../types';
import { startRun, fetchRunResult } from '../services/api';
import { MOCK_WORKSPACE } from '../mockData';

// ─── Static configuration ─────────────────────────────────────────────────────

interface CheckDef {
  id: CheckId;
  icon: React.ElementType;
  title: string;
  tagline: string;
  inspects: string[];
  method: string;
}

const CHECK_DEFS: CheckDef[] = [
  {
    id: 'DATA_INTEGRITY',
    icon: Database,
    title: 'Data Integrity',
    tagline: 'Verify dataset consistency and structural validity.',
    inspects: ['Readability', 'Labels & annotations', 'Duplicate detection (pHash)', 'Image dimensions', 'Annotation anomalies'],
    method: 'SHA-256 + Perceptual Hash',
  },
  {
    id: 'MODEL_INTEGRITY',
    icon: Cpu,
    title: 'Model Integrity',
    tagline: 'Confirm the model artifact matches its registered baseline.',
    inspects: ['SHA-256 hash comparison', 'ONNX metadata validation', 'Baseline hash matching', 'Fixed evaluation predictions'],
    method: 'SHA-256 hash comparison',
  },
  {
    id: 'DISTRIBUTION_SHIFT',
    icon: Activity,
    title: 'Distribution Shift',
    tagline: 'Detect statistical drift between reference and current batch.',
    inspects: ['Image brightness / contrast', 'Spatial statistics', 'Reference vs. current distribution', 'Configurable PSI threshold'],
    method: 'Population Stability Index (PSI)',
  },
  {
    id: 'COMPARATOR',
    icon: GitCompare,
    title: 'Assurance Comparator',
    tagline: 'Diff current run findings against the registered baseline.',
    inspects: ['Baseline vs. current metrics', 'Newly raised findings', 'Cleared findings', 'Changed status items'],
    method: 'Run-to-run delta comparison',
  },
];

const THRESHOLD_CONFIGS: ThresholdConfig[] = [
  {
    checkId: 'DISTRIBUTION_SHIFT',
    metric: 'PSI',
    value: 0.20,
    unit: '',
    label: 'Demonstration threshold',
    tooltip: 'Thresholds in this prototype are configurable demonstration values, not universal deployment thresholds.',
  },
  {
    checkId: 'DATA_INTEGRITY',
    metric: 'Duplicate tolerance',
    value: 0,
    unit: ' samples',
    label: 'Demonstration threshold',
    tooltip: 'Thresholds in this prototype are configurable demonstration values, not universal deployment thresholds.',
  },
];

const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'sce-dup-img',
    title: 'Duplicate / Altered Image',
    description: 'Injects a set of near-duplicate images into the current batch to trigger the pHash duplicate-detection check.',
    affectedAsset: 'current-batch',
    expectedSignal: 'DATA_INTEGRITY WARNING — pHash duplicates exceed threshold',
    category: 'DATA_INTEGRITY',
  },
  {
    id: 'sce-label-anomaly',
    title: 'Label Anomaly',
    description: 'Introduces malformed annotation entries to verify that label-consistency validation correctly identifies the anomaly.',
    affectedAsset: 'current-batch',
    expectedSignal: 'DATA_INTEGRITY WARNING — annotation format inconsistency',
    category: 'DATA_INTEGRITY',
  },
  {
    id: 'sce-model-hash',
    title: 'Model Artifact Hash Change',
    description: 'Applies a controlled byte-level modification to the model artifact copy to demonstrate hash-based integrity monitoring. The original registered artifact is not modified.',
    affectedAsset: 'baseline-model.onnx (copy)',
    expectedSignal: 'MODEL_INTEGRITY WARNING — artifact differs from registered baseline',
    category: 'MODEL_INTEGRITY',
  },
  {
    id: 'sce-dist-shift',
    title: 'Image Distribution Shift',
    description: 'Applies a controlled brightness/contrast transformation to the current batch to demonstrate distribution-shift detection via PSI.',
    affectedAsset: 'current-batch',
    expectedSignal: 'DISTRIBUTION_SHIFT WARNING — PSI exceeds 0.20',
    category: 'DISTRIBUTION_SHIFT',
  },
];

const INITIAL_STAGES: RunStage[] = [
  { id: 'init',     label: 'Initializing',          status: 'WAITING' },
  { id: 'asset',    label: 'Asset validation',       status: 'WAITING' },
  { id: 'data',     label: 'Data integrity',         status: 'WAITING' },
  { id: 'model',    label: 'Model integrity',        status: 'WAITING' },
  { id: 'dist',     label: 'Distribution analysis',  status: 'WAITING' },
  { id: 'compare',  label: 'Comparison',             status: 'WAITING' },
  { id: 'prov',     label: 'Provenance recording',   status: 'WAITING' },
  { id: 'final',    label: 'Finalizing',             status: 'WAITING' },
];

// Stage timings in ms for each selected check combo
const STAGE_DURATIONS: Record<string, number> = {
  init: 600,
  asset: 800,
  data: 1400,
  model: 1000,
  dist: 1600,
  compare: 900,
  prov: 700,
  final: 400,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHECK_BORDER: Record<string, string> = {
  selected:   'border-blue-500/40 bg-blue-500/5',
  unselected: 'border-slate-800 hover:border-slate-600 bg-slate-900',
};

const STAGE_STATUS_CONFIG: Record<StageStatus, { color: string; icon: React.ElementType }> = {
  WAITING:  { color: 'text-slate-600', icon: Circle },
  RUNNING:  { color: 'text-blue-400',  icon: Loader2 },
  COMPLETE: { color: 'text-emerald-400', icon: CheckCircle2 },
  FAILED:   { color: 'text-red-400',   icon: XCircle },
  'NOT RUN':{ color: 'text-slate-600', icon: Circle },
};

type PageState = 'configure' | 'running' | 'complete';

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Tooltip on hover */
const Tip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex items-center cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 text-xs text-slate-300 bg-slate-800 border border-slate-700 rounded-sm px-3 py-2 shadow-xl leading-relaxed pointer-events-none">
          {text}
        </span>
      )}
    </span>
  );
};

/** Check selection card */
const CheckCard: React.FC<{
  def: CheckDef;
  selected: boolean;
  onToggle: () => void;
}> = ({ def, selected, onToggle }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = def.icon;

  return (
    <div
      className={`border rounded-sm transition-all duration-150 ${selected ? CHECK_BORDER.selected : CHECK_BORDER.unselected}`}
    >
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={onToggle}
      >
        {/* Checkbox */}
        <div className="mt-0.5 shrink-0">
          {selected
            ? <CheckSquare className="w-4 h-4 text-blue-400" />
            : <Square className="w-4 h-4 text-slate-600" />
          }
        </div>

        {/* Icon + title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-4 h-4 shrink-0 ${selected ? 'text-blue-400' : 'text-slate-500'}`} />
            <span className={`text-sm font-semibold tracking-tight ${selected ? 'text-slate-100' : 'text-slate-300'}`}>
              {def.title}
            </span>
            {selected && (
              <span className="ml-auto text-[9px] font-bold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-sm uppercase">
                Selected
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 leading-relaxed">{def.tagline}</div>
          <div className="text-[10px] font-mono text-slate-600 mt-1">Method: {def.method}</div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          className="text-slate-600 hover:text-slate-400 transition-colors shrink-0 mt-0.5"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded inspects */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-800/60">
          <div className="text-[10px] font-bold tracking-wider text-slate-600 uppercase mb-2 mt-3">
            Inspects
          </div>
          <ul className="space-y-1">
            {def.inspects.map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/** Scenario card */
const ScenarioCard: React.FC<{
  scenario: ScenarioConfig;
  selected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
}> = ({ scenario, selected, onSelect, onDeselect }) => (
  <div
    className={`border rounded-sm p-4 transition-all duration-150
      ${selected
        ? 'border-amber-500/40 bg-amber-500/5'
        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
      }`}
  >
    <div className="flex items-start justify-between gap-3 mb-2">
      <div className="flex items-center gap-2">
        <FlaskConical className={`w-4 h-4 shrink-0 ${selected ? 'text-amber-400' : 'text-slate-500'}`} />
        <span className={`text-sm font-semibold ${selected ? 'text-slate-100' : 'text-slate-300'}`}>
          {scenario.title}
        </span>
      </div>
      {selected && (
        <span className="text-[9px] font-bold tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-sm uppercase shrink-0">
          Selected
        </span>
      )}
    </div>

    <p className="text-xs text-slate-400 leading-relaxed mb-3">{scenario.description}</p>

    {selected && (
      <div className="bg-slate-950/60 border border-slate-800 rounded-sm p-3 mb-3 space-y-1.5 text-xs font-mono">
        <div className="flex gap-2">
          <span className="text-slate-600 w-32 shrink-0">Affected asset</span>
          <span className="text-slate-300">{scenario.affectedAsset}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-slate-600 w-32 shrink-0">Expected signal</span>
          <span className="text-amber-400">{scenario.expectedSignal}</span>
        </div>
      </div>
    )}

    <div className="flex justify-end">
      {selected ? (
        <button
          onClick={onDeselect}
          className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 border border-slate-700 hover:border-slate-600 rounded-sm transition-colors"
        >
          Deselect scenario
        </button>
      ) : (
        <button
          onClick={onSelect}
          className="text-xs text-amber-400 hover:text-amber-300 px-3 py-1.5 border border-amber-500/30 hover:border-amber-500/60 rounded-sm transition-colors bg-amber-500/5"
        >
          Select scenario
        </button>
      )}
    </div>
  </div>
);

/** Stage progress row */
const StageRow: React.FC<{ stage: RunStage; isCurrent: boolean }> = ({ stage, isCurrent }) => {
  const cfg = STAGE_STATUS_CONFIG[stage.status];
  const Icon = cfg.icon;
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 transition-colors rounded-sm
        ${isCurrent ? 'bg-blue-500/5 border border-blue-500/15' : ''}`}
    >
      <Icon
        className={`w-4 h-4 shrink-0 ${cfg.color} ${stage.status === 'RUNNING' ? 'animate-spin' : ''}`}
      />
      <span
        className={`text-sm flex-1 ${
          stage.status === 'RUNNING'
            ? 'text-slate-100 font-medium'
            : stage.status === 'COMPLETE'
            ? 'text-slate-400'
            : stage.status === 'FAILED'
            ? 'text-red-400'
            : 'text-slate-600'
        }`}
      >
        {stage.label}
      </span>
      {stage.status === 'COMPLETE' && stage.durationMs !== undefined && (
        <span className="font-mono text-[10px] text-slate-600">
          {(stage.durationMs / 1000).toFixed(1)}s
        </span>
      )}
      {stage.status === 'RUNNING' && (
        <span className="font-mono text-[10px] text-blue-400 animate-pulse">Running…</span>
      )}
      {stage.status === 'WAITING' && (
        <span className="font-mono text-[10px] text-slate-700">Waiting</span>
      )}
    </div>
  );
};

/** Elapsed timer display */
const ElapsedTimer: React.FC<{ startMs: number }> = ({ startMs }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startMs), 200);
    return () => clearInterval(id);
  }, [startMs]);
  const s = Math.floor(elapsed / 1000);
  const ms = elapsed % 1000;
  return (
    <span className="font-mono text-sm text-slate-400">
      {String(s).padStart(2, '0')}.{String(ms).padStart(3, '0').substring(0, 1)}s
    </span>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Run: React.FC = () => {
  const navigate = useNavigate();

  // ── State ──
  const [pageState, setPageState] = useState<PageState>('configure');
  const [selectedChecks, setSelectedChecks] = useState<Set<CheckId>>(
    new Set(['DATA_INTEGRITY', 'MODEL_INTEGRITY', 'DISTRIBUTION_SHIFT', 'COMPARATOR'])
  );
  const [selectedScenario, setSelectedScenario] = useState<string | null>('sce-dist-shift');
  const [stages, setStages] = useState<RunStage[]>(INITIAL_STAGES);
  const [currentStageIdx, setCurrentStageIdx] = useState(-1);
  const [startMs, setStartMs] = useState(0);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const stageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active thresholds for selected checks
  const activeThresholds = THRESHOLD_CONFIGS.filter((t) => selectedChecks.has(t.checkId));

  const toggleCheck = (id: CheckId) => {
    setSelectedChecks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Stage runner ──
  const runStages = useCallback(async (rid: string) => {
    const stageIds = INITIAL_STAGES.map((s) => s.id);

    for (let i = 0; i < stageIds.length; i++) {
      const stageId = stageIds[i];
      const dur = STAGE_DURATIONS[stageId] ?? 600;

      // Set running
      setCurrentStageIdx(i);
      setStages((prev) =>
        prev.map((s) => s.id === stageId ? { ...s, status: 'RUNNING' } : s)
      );

      await new Promise<void>((res) => {
        stageTimerRef.current = setTimeout(res, dur);
      });

      // Set complete
      setStages((prev) =>
        prev.map((s) => s.id === stageId ? { ...s, status: 'COMPLETE', durationMs: dur } : s)
      );
    }

    // Fetch result
    const result = await fetchRunResult(rid);
    setRunResult(result);
    setPageState('complete');
  }, []);

  const handleRunAssurance = async () => {
    setPageState('running');
    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: 'WAITING' })));
    setCurrentStageIdx(-1);
    setStartMs(() => Date.now());

    try {
      const { run_id } = await startRun({
        workspaceId: MOCK_WORKSPACE.id,
        checks: Array.from(selectedChecks),
        scenarioId: selectedScenario ?? undefined,
        thresholds: Object.fromEntries(
          activeThresholds.map((t) => [t.metric, t.value])
        ),
      });
      setRunId(run_id);
      await runStages(run_id);
    } catch {
      setPageState('configure');
    }
  };

  const handleReset = () => {
    if (stageTimerRef.current) clearTimeout(stageTimerRef.current);
    setPageState('configure');
    setStages(INITIAL_STAGES);
    setCurrentStageIdx(-1);
    setRunResult(null);
    setRunId(null);
  };

  // ── Derived ──
  const totalElapsedMs = stages
    .filter((s) => s.status === 'COMPLETE')
    .reduce((acc, s) => acc + (s.durationMs ?? 0), 0);

  const completedCount = stages.filter((s) => s.status === 'COMPLETE').length;
  const progressPct = Math.round((completedCount / stages.length) * 100);

  return (
    <div className="space-y-8 max-w-5xl">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <PlayCircle className="w-5 h-5 text-slate-500" />
            <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Assurance Run</h1>
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-sm tracking-wider uppercase flex items-center gap-1">
              <FlaskConical className="w-2.5 h-2.5" />
              Prototype / Controlled Demo
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Execute reproducible integrity checks against the selected workspace.
          </p>
        </div>
        {pageState !== 'configure' && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 rounded-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* ── SECTION 1: Run context bar ───────────────────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-sm px-5 py-4">
        <div className="text-[10px] font-bold tracking-[0.15em] text-slate-600 uppercase mb-3">
          Run Context
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-3">
          {[
            { label: 'Workspace',     value: 'SIH26228 Demo Workspace' },
            { label: 'Dataset',       value: 'reference-dataset' },
            { label: 'Model',         value: 'baseline-model.onnx' },
            { label: 'Baseline',      value: 'RUN-2026-0038' },
            { label: 'Configuration', value: 'CFG-8A91' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-[9px] font-bold tracking-widest text-slate-600 uppercase mb-0.5">
                {label}
              </div>
              <div className="font-mono text-xs text-slate-300">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════ CONFIGURE STATE ═══════════════════ */}
      {pageState === 'configure' && (
        <>
          {/* ── SECTION 2: Check selection ─────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold tracking-[0.15em] text-slate-600 uppercase">
                Check Selection
              </div>
              <button
                onClick={() => setSelectedChecks(new Set(CHECK_DEFS.map((c) => c.id)))}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Select all
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {CHECK_DEFS.map((def) => (
                <CheckCard
                  key={def.id}
                  def={def}
                  selected={selectedChecks.has(def.id)}
                  onToggle={() => toggleCheck(def.id)}
                />
              ))}
            </div>
          </div>

          {/* ── SECTION 3: Thresholds ─────────────────────────────────────── */}
          {activeThresholds.length > 0 && (
            <div>
              <div className="text-[10px] font-bold tracking-[0.15em] text-slate-600 uppercase mb-3">
                Thresholds
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-sm divide-y divide-slate-800/60">
                {activeThresholds.map((t) => (
                  <div key={t.metric} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1">
                      <div className="text-sm text-slate-300 font-medium">{t.metric}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{t.label}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        defaultValue={t.value}
                        step={0.01}
                        min={0}
                        className="w-20 text-right font-mono text-sm bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-xs text-slate-500 font-mono">{t.unit || '—'}</span>
                    </div>
                    <Tip text={t.tooltip}>
                      <Info className="w-3.5 h-3.5 text-slate-600 hover:text-slate-400 transition-colors" />
                    </Tip>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SECTION 4: Controlled scenario ────────────────────────────── */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-[10px] font-bold tracking-[0.15em] text-slate-600 uppercase">
                Controlled Demo Scenario
              </div>
              <div className="flex items-center gap-1.5 bg-amber-500/8 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-sm text-[9px] font-bold tracking-wider uppercase">
                <FlaskConical className="w-2.5 h-2.5" />
                Prototype / Controlled Demo
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/15 rounded-sm px-4 py-3 mb-4 flex gap-2 text-xs text-amber-400/80">
              <TriangleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <span>
                The following scenarios introduce controlled, non-destructive conditions for
                demonstration purposes. None simulate a real cyberattack. Original registered
                assets are not modified.
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {SCENARIOS.map((s) => (
                <ScenarioCard
                  key={s.id}
                  scenario={s}
                  selected={selectedScenario === s.id}
                  onSelect={() => setSelectedScenario(s.id)}
                  onDeselect={() => setSelectedScenario(null)}
                />
              ))}
            </div>
          </div>

          {/* ── SECTION 5: Pre-run summary + run button ───────────────────── */}
          <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
            {/* Summary row */}
            <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap gap-x-8 gap-y-2">
              {[
                { label: 'Checks selected',         value: selectedChecks.size },
                { label: 'Controlled scenario',      value: selectedScenario ? '1 selected' : 'None' },
                { label: 'Baseline',                 value: 'RUN-2026-0038 (available)' },
                { label: 'Execution mode',           value: 'Offline / Local' },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-[9px] font-bold tracking-widest text-slate-600 uppercase">
                    {label}
                  </span>
                  <span className="font-mono text-xs text-slate-300 mt-0.5">{value}</span>
                </div>
              ))}
            </div>

            {/* Run button */}
            <div className="px-5 py-4 flex items-center gap-4">
              <button
                onClick={handleRunAssurance}
                disabled={selectedChecks.size === 0}
                className={`flex items-center gap-2.5 px-6 py-3 text-sm font-bold rounded-sm border transition-all
                  ${selectedChecks.size === 0
                    ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-900/30 active:scale-[0.98]'
                  }`}
              >
                <PlayCircle className="w-4 h-4" />
                Run Assurance
              </button>
              {selectedChecks.size === 0 && (
                <span className="text-xs text-slate-500">Select at least one check to proceed.</span>
              )}
              {selectedScenario && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400/80 ml-auto">
                  <FlaskConical className="w-3.5 h-3.5" />
                  Controlled anomaly scenario will be triggered
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════ RUNNING STATE ═══════════════════ */}
      {pageState === 'running' && (
        <div className="space-y-6">
          {/* Progress header */}
          <div className="bg-slate-900 border border-blue-500/20 rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-sm font-semibold text-slate-200">
                  Assurance run in progress
                </span>
                {runId && (
                  <span className="font-mono text-xs text-slate-500">{runId}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <ElapsedTimer startMs={startMs} />
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-5 py-3 border-b border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>{completedCount} of {stages.length} stages</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Stages list */}
            <div className="px-4 py-3 space-y-0.5">
              {stages.map((stage, i) => (
                <StageRow key={stage.id} stage={stage} isCurrent={i === currentStageIdx} />
              ))}
            </div>

            {/* Total so far */}
            <div className="px-5 py-3 border-t border-slate-800 font-mono text-xs text-slate-600 flex gap-4">
              <span>Run ID: {runId ?? '—'}</span>
              <span>·</span>
              <span>Elapsed: {(totalElapsedMs / 1000).toFixed(1)}s</span>
              {selectedScenario && (
                <>
                  <span>·</span>
                  <span className="text-amber-500">Controlled anomaly active</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ COMPLETE STATE ═══════════════════ */}
      {pageState === 'complete' && runResult && (
        <div className="space-y-6">
          {/* Result hero */}
          <div
            className={`border rounded-sm overflow-hidden
              ${runResult.status === 'PASS'
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : runResult.status === 'WARNING'
                ? 'border-amber-500/25 bg-amber-500/5'
                : 'border-red-500/30 bg-red-500/5'
              }`}
          >
            <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-sm flex items-center justify-center
                    ${runResult.status === 'PASS'
                      ? 'bg-emerald-500/15'
                      : runResult.status === 'WARNING'
                      ? 'bg-amber-500/15'
                      : 'bg-red-500/15'
                    }`}
                >
                  <ShieldCheck
                    className={`w-5 h-5 ${
                      runResult.status === 'PASS'
                        ? 'text-emerald-400'
                        : runResult.status === 'WARNING'
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  />
                </div>
                <div>
                  <div className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-0.5">
                    Assurance Complete
                  </div>
                  <div
                    className={`text-2xl font-bold tracking-tight ${
                      runResult.status === 'PASS'
                        ? 'text-emerald-400'
                        : runResult.status === 'WARNING'
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {runResult.status === 'WARNING' ? 'REVIEW REQUIRED' : runResult.status}
                  </div>
                  {runResult.controlledScenarioTriggered && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400/70 mt-1">
                      <FlaskConical className="w-3 h-3" />
                      Controlled anomaly scenario triggered
                    </div>
                  )}
                </div>
              </div>
              <StatusBadge
                status={runResult.status === 'WARNING' ? 'WARNING' : runResult.status === 'PASS' ? 'PASS' : 'FAIL'}
                size="lg"
              />
            </div>

            {/* Result metrics */}
            <div className="border-t border-slate-800/60 px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { label: 'Checks executed', value: runResult.checksExecuted, color: 'text-slate-200' },
                { label: 'Warnings',         value: runResult.warnings,       color: 'text-amber-400' },
                { label: 'Critical',          value: runResult.critical,       color: 'text-red-400' },
                { label: 'New findings',      value: runResult.newFindings,    color: 'text-amber-300' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="text-[9px] font-bold tracking-widest text-slate-600 uppercase mb-1">
                    {label}
                  </div>
                  <div className={`text-2xl font-mono font-bold ${color}`}>{value}</div>
                </div>
              ))}
            </div>

            {/* Run ID strip */}
            <div className="border-t border-slate-800/60 px-6 py-2.5 flex items-center gap-4 font-mono text-[10px] text-slate-600 bg-slate-950/30">
              <span>Run ID: {runResult.runId}</span>
              <span>·</span>
              <span>Duration: {((totalElapsedMs) / 1000).toFixed(1)}s</span>
              <span>·</span>
              <span>Workspace: {MOCK_WORKSPACE.id}</span>
            </div>
          </div>

          {/* Completed stages summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-sm">
            <div className="px-5 py-3 border-b border-slate-800 text-[10px] font-bold tracking-wider text-slate-600 uppercase">
              Execution Trace
            </div>
            <div className="px-4 py-3 space-y-0.5">
              {stages.map((stage) => (
                <StageRow key={stage.id} stage={stage} isCurrent={false} />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div>
            <div className="text-[10px] font-bold tracking-[0.15em] text-slate-600 uppercase mb-3">
              Next Steps
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/findings')}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 border border-blue-500 text-white rounded-sm transition-colors shadow-lg shadow-blue-900/20"
              >
                <Activity className="w-4 h-4" />
                View Findings
              </button>
              <button
                onClick={() => navigate('/run')}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-sm transition-colors"
              >
                <GitCompare className="w-4 h-4" />
                Compare with Baseline
              </button>
              <button
                onClick={() => navigate('/provenance')}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-sm transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                View Provenance
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Export JSON Report
              </button>
              <button
                onClick={() => navigate('/findings')}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-sm transition-colors"
              >
                <FileText className="w-4 h-4" />
                View Full Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Run;
