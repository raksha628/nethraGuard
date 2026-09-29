import React, { useState, useCallback, useRef } from 'react';
import {
  FolderOpen,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Copy,
  Check,
  Database,
  Cpu,
  UploadCloud,
  X,
  ShieldCheck,
  FileWarning,
  Clock,
  Hash,
  Tag,
  Info,
  FlaskConical,
} from 'lucide-react';
import Drawer from '../components/UI/Drawer';
import StatusBadge from '../components/UI/StatusBadge';
import type { Asset, AssetStatus, Status, WorkspaceHealthItem } from '../types';
import {
  fetchDemoWorkspace,
  fetchAssets,
  registerAsset,

} from '../services/api';
import { MOCK_WORKSPACE, MOCK_ASSETS, MOCK_WORKSPACE_HEALTH, DEMO_MANIFEST } from '../mockData';

// ─── Types local to this page ─────────────────────────────────────────────────

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';
type UploadState = 'idle' | 'hashing' | 'uploading' | 'done' | 'error';

interface DropFile {
  file: File;
  state: UploadState;
  error?: string;
  result?: Asset;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ASSET_STATUS_COLORS: Record<AssetStatus, string> = {
  REGISTERED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  BASELINE:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PENDING:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ERROR:      'bg-red-500/10 text-red-400 border-red-500/20',
};

const HEALTH_ICONS: Record<Status, React.ElementType> = {
  PASS:      CheckCircle2,
  WARNING:   AlertCircle,
  FAIL:      FileWarning,
  'NOT RUN': HelpCircle,
};

const HEALTH_COLORS: Record<Status, string> = {
  PASS:      'text-emerald-400',
  WARNING:   'text-amber-400',
  FAIL:      'text-red-400',
  'NOT RUN': 'text-slate-500',
};

function truncateHash(h: string, len = 8) {
  return h.length > 16 ? `${h.substring(0, len)}…${h.substring(h.length - 4)}` : h;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

/** Copyable monospace hash pill */
const HashPill: React.FC<{ hash: string }> = ({ hash }) => {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded group">
      {truncateHash(hash)}
      <button
        onClick={copy}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-slate-300"
        title="Copy full hash"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      </button>
    </span>
  );
};

/** Asset type icon */
const AssetIcon: React.FC<{ type: Asset['type'] }> = ({ type }) =>
  type === 'MODEL' ? (
    <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
  ) : (
    <Database className="w-4 h-4 text-blue-400 shrink-0" />
  );

/** Asset status chip */
const AssetStatusChip: React.FC<{ status: AssetStatus }> = ({ status }) => (
  <span
    className={`inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-sm border ${ASSET_STATUS_COLORS[status]}`}
  >
    {status}
  </span>
);

/** Asset detail drawer content */
const AssetDetailDrawer: React.FC<{ asset: Asset }> = ({ asset }) => {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'Display name', value: asset.displayName },
    { label: 'Internal ID', value: <span className="font-mono text-xs">{asset.internalId}</span> },
    { label: 'Asset type', value: asset.type },
    { label: 'Format', value: asset.format },
    { label: 'File size', value: asset.size },
    {
      label: 'SHA-256',
      value: (
        <span className="font-mono text-[11px] text-slate-400 break-all leading-relaxed">
          {asset.hash}
        </span>
      ),
    },
    {
      label: 'Registered',
      value: new Date(asset.registeredAt).toLocaleString('en-GB', { hour12: false }),
    },
    { label: 'Role', value: asset.role },
    {
      label: 'Status',
      value: <AssetStatusChip status={asset.assetStatus} />,
    },
    {
      label: 'Baseline relationship',
      value: asset.baselineRelationship ?? '—',
    },
  ];

  const meta = asset.metadata;
  const metaRows: { label: string; value: string }[] = [
    ...(meta.imageCount !== undefined
      ? [{ label: 'Image count', value: meta.imageCount.toLocaleString() }]
      : []),
    ...(meta.classCount !== undefined
      ? [{ label: 'Class count', value: String(meta.classCount) }]
      : []),
    ...(meta.splitInfo ? [{ label: 'Split info', value: meta.splitInfo }] : []),
    ...(meta.framework ? [{ label: 'Framework', value: meta.framework }] : []),
    ...(meta.inputShape ? [{ label: 'Input shape', value: meta.inputShape }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Main fields */}
      <div className="space-y-0 divide-y divide-slate-800">
        {rows.map(({ label, value }) => (
          <div key={label} className="py-3 grid grid-cols-[140px_1fr] gap-4 items-start">
            <span className="text-xs text-slate-500 pt-0.5">{label}</span>
            <span className="text-sm text-slate-200">{value}</span>
          </div>
        ))}
      </div>

      {/* Metadata section */}
      {metaRows.length > 0 && (
        <div>
          <div className="text-[10px] font-bold tracking-wider text-slate-600 uppercase mb-2">
            Metadata
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-sm p-3 space-y-2">
            {metaRows.map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-slate-500">{label}</span>
                <span className="font-mono text-slate-300">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Path safety note */}
      <div className="flex gap-2 text-xs text-slate-500 bg-slate-800/40 border border-slate-800 rounded-sm p-3">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
        <span>
          Filesystem paths are not exposed. Assets are identified by their internal ID and
          cryptographic hash only.
        </span>
      </div>
    </div>
  );
};

// ─── Upload / Register drop zone ──────────────────────────────────────────────

const ALLOWED_EXTS = ['.zip', '.tar.gz', '.tar', '.onnx', '.pt'];
const ALLOWED_FORMATS = 'YOLO (.zip / .tar.gz), COCO (.zip), ONNX (.onnx), PyTorch (.pt)';

const DropZone: React.FC<{
  onRegistered: (asset: Asset) => void;
}> = ({ onRegistered }) => {
  const [dragging, setDragging] = useState(false);
  const [drops, setDrops] = useState<DropFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAllowed = (name: string) =>
    ALLOWED_EXTS.some((ext) => name.toLowerCase().endsWith(ext)) ||
    name.toLowerCase().endsWith('.tar.gz');

  const processFile = useCallback(
    async (file: File) => {
      if (!isAllowed(file.name)) {
        setDrops((d) => [
          ...d,
          { file, state: 'error', error: `Format not supported: ${file.name.split('.').pop()?.toUpperCase()}` },
        ]);
        return;
      }
      const entry: DropFile = { file, state: 'hashing' };
      setDrops((d) => [...d, entry]);

      try {
        setDrops((d) =>
          d.map((x) => (x.file === file ? { ...x, state: 'uploading' } : x))
        );
        const result = await registerAsset(file);
        setDrops((d) =>
          d.map((x) => (x.file === file ? { ...x, state: 'done', result } : x))
        );
        onRegistered(result);
      } catch {
        setDrops((d) =>
          d.map((x) =>
            x.file === file ? { ...x, state: 'error', error: 'Registration failed.' } : x
          )
        );
      }
    },
    [onRegistered]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    Array.from(e.dataTransfer.files).forEach(processFile);
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(processFile);
    e.target.value = '';
  };

  const removeEntry = (file: File) =>
    setDrops((d) => d.filter((x) => x.file !== file));

  const STATE_LABEL: Record<UploadState, string> = {
    idle: '',
    hashing: 'Computing SHA-256…',
    uploading: 'Registering…',
    done: 'Registered',
    error: 'Error',
  };

  return (
    <div className="space-y-4">
      {/* Drop area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-sm flex flex-col items-center justify-center gap-3
          py-10 cursor-pointer transition-colors
          ${dragging
            ? 'border-blue-500/50 bg-blue-500/5'
            : 'border-slate-700 hover:border-slate-600 bg-slate-900/50 hover:bg-slate-800/30'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept=".zip,.tar,.onnx,.pt"
          onChange={onInput}
        />
        <UploadCloud className={`w-8 h-8 ${dragging ? 'text-blue-400' : 'text-slate-600'}`} />
        <div className="text-center">
          <div className="text-sm text-slate-300 font-medium">
            Drop a dataset or model file here
          </div>
          <div className="text-xs text-slate-500 mt-1">or click to browse</div>
        </div>
        <div className="text-[10px] text-slate-600 font-mono px-4 text-center leading-relaxed">
          {ALLOWED_FORMATS}
        </div>
      </div>

      {/* Notice */}
      <div className="flex gap-2 text-xs text-slate-500 bg-slate-800/30 border border-slate-800 rounded-sm p-3">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
        <span>
          Supported formats are limited to those implemented and tested in this prototype.
          Files are hashed locally before registration.
        </span>
      </div>

      {/* File list */}
      {drops.length > 0 && (
        <div className="space-y-2">
          {drops.map(({ file, state, error, result }) => (
            <div
              key={file.name + file.size}
              className={`flex items-start gap-3 p-3 rounded-sm border text-xs
                ${state === 'error'
                  ? 'bg-red-500/5 border-red-500/20'
                  : state === 'done'
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-slate-800/50 border-slate-700'
                }`}
            >
              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                {state === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {state === 'error' && <X className="w-4 h-4 text-red-400" />}
                {(state === 'hashing' || state === 'uploading') && (
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <div className="font-mono text-slate-300 truncate">{file.name}</div>
                <div className="text-slate-500 mt-0.5">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                  {error && <span className="text-red-400 ml-2">· {error}</span>}
                  {state !== 'idle' && !error && (
                    <span className="ml-2">{STATE_LABEL[state]}</span>
                  )}
                </div>
                {result && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Hash className="w-3 h-3 text-slate-600" />
                    <span className="font-mono text-[10px] text-slate-500">{truncateHash(result.hash, 12)}</span>
                  </div>
                )}
              </div>

              {/* Remove */}
              {(state === 'done' || state === 'error') && (
                <button
                  onClick={() => removeEntry(file)}
                  className="text-slate-600 hover:text-slate-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Workspace Health Panel ────────────────────────────────────────────────────

const HealthPanel: React.FC<{ items: WorkspaceHealthItem[] }> = ({ items }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
      <ShieldCheck className="w-4 h-4 text-slate-500" />
      <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
        Workspace Health
      </span>
    </div>
    <div className="divide-y divide-slate-800/60">
      {items.map((item) => {
        const Icon = HEALTH_ICONS[item.status];
        const color = HEALTH_COLORS[item.status];
        return (
          <div key={item.key} className="flex items-start gap-3 px-4 py-3">
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${color}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-300">{item.label}</div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono">{item.description}</div>
            </div>
            <StatusBadge status={item.status} size="sm" />
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Demo Workspace Card ──────────────────────────────────────────────────────

const DemoCard: React.FC<{
  onLoad: () => void;
  loadState: LoadState;
}> = ({ onLoad, loadState }) => (
  <div
    className={`bg-slate-900 border rounded-sm overflow-hidden transition-colors
      ${loadState === 'loaded'
        ? 'border-emerald-500/30'
        : 'border-slate-700 hover:border-slate-600'
      }`}
  >
    <div className="px-5 py-4 border-b border-slate-800/80 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-sm flex items-center justify-center shrink-0">
          <FolderOpen className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <div className="font-semibold text-slate-100 text-sm">SIH26228 Reference Workspace</div>
          <div className="text-xs text-slate-500 mt-0.5 leading-relaxed max-w-xl">
            {DEMO_MANIFEST.description}
          </div>
        </div>
      </div>
      <div className="shrink-0">
        {loadState === 'loaded' ? (
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Loaded
          </div>
        ) : (
          <StatusBadge status="PASS" size="sm" />
        )}
      </div>
    </div>

    {/* Contents */}
    <div className="px-5 py-4 border-b border-slate-800/80">
      <div className="text-[10px] font-bold tracking-wider text-slate-600 uppercase mb-3">
        Contains
      </div>
      <ul className="space-y-1.5">
        {DEMO_MANIFEST.contents.map((c) => (
          <li key={c} className="flex items-center gap-2 text-xs text-slate-400">
            <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
            {c}
          </li>
        ))}
      </ul>
    </div>

    {/* Footer / action */}
    <div className="px-5 py-3.5 flex items-center justify-between gap-4 bg-slate-950/30">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-slate-600">ws-SIH26228</span>
        <span className="text-slate-700">·</span>
        <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-wider">
          {loadState === 'loaded' ? 'Active' : 'Ready'}
        </span>
      </div>
      <button
        onClick={onLoad}
        disabled={loadState === 'loading' || loadState === 'loaded'}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-sm border transition-all
          ${loadState === 'loaded'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default'
            : loadState === 'loading'
            ? 'bg-blue-600/50 text-blue-300 border-blue-500/30 cursor-wait'
            : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 cursor-pointer'
          }`}
      >
        {loadState === 'loading' ? (
          <>
            <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-300 border-t-transparent animate-spin" />
            Loading…
          </>
        ) : loadState === 'loaded' ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Workspace Loaded
          </>
        ) : (
          <>
            <FolderOpen className="w-3.5 h-3.5" />
            Load Demo Workspace
          </>
        )}
      </button>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const Workspace: React.FC = () => {
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [health] = useState<WorkspaceHealthItem[]>(MOCK_WORKSPACE_HEALTH);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  const handleLoadDemo = async () => {
    setLoadState('loading');
    try {
      await fetchDemoWorkspace();
      const loadedAssets = await fetchAssets();
      setAssets(loadedAssets);
      setLoadState('loaded');
    } catch {
      setLoadState('error');
    }
  };

  const handleRegistered = (asset: Asset) => {
    setAssets((prev) => [...prev, asset]);
  };



  return (
    <div className="space-y-8">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <FolderOpen className="w-5 h-5 text-slate-500" />
            <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Workspace</h1>
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-sm tracking-wider uppercase flex items-center gap-1">
              <FlaskConical className="w-2.5 h-2.5" />
              Prototype / Controlled Demo
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Register the assets used for an assurance run.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">
              LOCAL / OFFLINE
            </span>
            <span className="text-slate-700">·</span>
            <span className="text-[10px] font-mono text-slate-600">
              {MOCK_WORKSPACE.id}
            </span>
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => setShowRegister(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-sm border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register Asset
          </button>
          <button
            onClick={handleLoadDemo}
            disabled={loadState === 'loading' || loadState === 'loaded'}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-sm border transition-colors
              ${loadState === 'loaded'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 cursor-default'
                : loadState === 'loading'
                ? 'border-blue-500/30 bg-blue-600/40 text-blue-300 cursor-wait'
                : 'border-blue-500 bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
              }`}
          >
            {loadState === 'loading' ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-300 border-t-transparent animate-spin" />
                Loading…
              </>
            ) : loadState === 'loaded' ? (
              <><CheckCircle2 className="w-3.5 h-3.5" />Loaded</>
            ) : (
              <><FolderOpen className="w-3.5 h-3.5" />Load Demo Workspace</>
            )}
          </button>
        </div>
      </div>

      {/* ── Section 1: Demo workspace card ──────────────────────────────────── */}
      <div>
        <div className="text-[10px] font-bold tracking-[0.15em] text-slate-600 uppercase mb-3">
          Demo Workspace
        </div>
        <DemoCard onLoad={handleLoadDemo} loadState={loadState} />
      </div>

      {/* ── Section 2 + Health: Assets table & health panel ─────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Asset table */}
        <div>
          <div className="text-[10px] font-bold tracking-[0.15em] text-slate-600 uppercase mb-3">
            Registered Assets
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50">
                  {['Asset', 'Type', 'Format', 'Size', 'SHA-256', 'Registered', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    {/* Asset name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AssetIcon type={asset.type} />
                        <span className="font-mono font-medium text-slate-200 group-hover:text-white transition-colors">
                          {asset.displayName}
                        </span>
                      </div>
                    </td>
                    {/* Type */}
                    <td className="px-4 py-3 text-slate-400">{asset.type}</td>
                    {/* Format */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-slate-400">{asset.format}</span>
                    </td>
                    {/* Size */}
                    <td className="px-4 py-3 font-mono text-slate-400">{asset.size}</td>
                    {/* Hash */}
                    <td className="px-4 py-3">
                      <HashPill hash={asset.hash} />
                    </td>
                    {/* Registered */}
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                      {formatDate(asset.registeredAt)}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <AssetStatusChip status={asset.assetStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {assets.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-sm">
                No assets registered. Load the demo workspace or register an asset.
              </div>
            )}
          </div>
          {/* Table footer note */}
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-600">
            <Info className="w-3 h-3" />
            Click any row to inspect full asset details. Click the hash to copy.
          </div>
        </div>

        {/* Health panel */}
        <div>
          <div className="text-[10px] font-bold tracking-[0.15em] text-slate-600 uppercase mb-3">
            Workspace Health
          </div>
          <HealthPanel items={health} />

          {/* Status legend */}
          <div className="mt-3 flex flex-col gap-1.5 text-[10px] text-slate-600 px-1">
            {(['PASS', 'WARNING', 'NOT RUN'] as Status[]).map((s) => {
              const Icon = HEALTH_ICONS[s];
              const color = HEALTH_COLORS[s];
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <Icon className={`w-3 h-3 ${color}`} />
                  <span>{s === 'NOT RUN' ? 'NOT RUN — item unavailable' : s}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Section 4: Register / Upload ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-bold tracking-[0.15em] text-slate-600 uppercase">
            Register an Asset
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600">
            <Tag className="w-3 h-3" />
            Supported: Dataset · Model
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-sm p-5">
          <DropZone onRegistered={handleRegistered} />
        </div>
      </div>

      {/* ── Asset detail drawer ───────────────────────────────────────────────── */}
      <Drawer
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        title={selectedAsset?.displayName ?? ''}
        subtitle={selectedAsset?.internalId}
      >
        {selectedAsset && <AssetDetailDrawer asset={selectedAsset} />}
      </Drawer>

      {/* ── Register asset drawer ─────────────────────────────────────────────── */}
      <Drawer
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        title="Register Asset"
        subtitle="Drop a file or browse to register a new asset"
      >
        <div className="space-y-4">
          <div className="flex gap-2 text-xs text-slate-500 bg-amber-500/8 border border-amber-500/20 rounded-sm p-3">
            <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
            <span>
              Mock mode is active. Files are not transmitted — a synthetic registration
              record will be created for demonstration purposes.
            </span>
          </div>
          <DropZone onRegistered={(a) => { handleRegistered(a); }} />
        </div>
      </Drawer>
    </div>
  );
};

export default Workspace;
