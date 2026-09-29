import React, { useState } from 'react';
import {
  FileText,
  Eye,
  AlertCircle,
  FileJson,
  FileCode2,
  CheckCircle2,
  Activity,
  Info
} from 'lucide-react';
import Drawer from '../components/UI/Drawer';
import { MOCK_WORKSPACE, MOCK_RUNS } from '../mockData';
import { RICH_FINDINGS } from '../mockData/findings';

const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<boolean>(false);

  // We use the singular mock run result for the prototype demo
  const run = MOCK_RUNS[1] || MOCK_RUNS[0]; // index 1 is RUN-2026-0042
  const workspace = MOCK_WORKSPACE;
  const warningsCount = RICH_FINDINGS.filter(f => f.severity === 'WARNING').length;

  const handleExportJson = () => {
    // Generate a structured JSON payload for the prototype
    const payload = {
      project: 'NETRA-Guard',
      version: '0.1.0-prototype',
      runId: run.id,
      timestamp: new Date().toISOString(),
      workspace: workspace.name,
      summary: run.summary,
      findings: RICH_FINDINGS,
      provenanceStatus: 'VALID'
    };
    
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netra_guard_report_${run.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="pb-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5 mb-1">
          <FileText className="w-5 h-5 text-slate-500" />
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Reports</h1>
        </div>
        <p className="text-sm text-slate-400">Export reproducible assurance evidence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* ── Report Card ──────────────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-sm font-semibold text-slate-200">{run.id}</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-bold border text-amber-400 border-amber-500/20 bg-amber-500/10">
                <AlertCircle className="w-3 h-3" />
                REVIEW
              </span>
            </div>
            <div className="text-xs text-slate-400 mb-4 font-mono">
              {new Date().toLocaleDateString()} · {new Date().toLocaleTimeString()}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Workspace</span>
                <span className="text-slate-300 font-medium truncate ml-4">{workspace.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Warnings</span>
                <span className="text-amber-400 font-mono">{warningsCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Checks executed</span>
                <span className="text-slate-300 font-mono">4</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Ledger Status</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> VALID
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-slate-950/50 space-y-3 flex-1">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedReport(true)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> View Summary
              </button>
              <button
                onClick={handleExportJson}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors"
              >
                <FileJson className="w-3.5 h-3.5" /> Export JSON
              </button>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 justify-center">
              <FileCode2 className="w-3.5 h-3.5" />
              HTML/PDF export — Planned / Stretch
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 border border-blue-500/20 bg-blue-500/5 rounded-sm flex gap-3 text-sm text-blue-400/80">
        <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
        <p>JSON export is the primary prototype export format. It contains the complete structured findings schema and cryptographic evidence required for automated integration into security information systems.</p>
      </div>

      {/* ── Report Preview Drawer ────────────────────────────────────────── */}
      <Drawer
        isOpen={selectedReport}
        onClose={() => setSelectedReport(false)}
        title="Assurance Report Preview"
        subtitle={run.id}
        width="w-[700px]"
      >
        <div className="space-y-8 text-sm">
          {/* Header */}
          <div className="text-center pb-6 border-b border-slate-800">
            <h2 className="text-2xl font-semibold text-slate-100 tracking-tight">NETRA-Guard</h2>
            <div className="text-slate-400 font-mono mt-2">COMPUTER-VISION ASSURANCE REPORT</div>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded text-xs font-bold uppercase">
              <Activity className="w-3.5 h-3.5" /> Review Required
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            {/* Meta */}
            <div>
              <div className="section-label">Report Metadata</div>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-xs text-slate-500">Project</span>
                  <span className="text-xs font-medium text-slate-300">NETRA-Guard</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-xs text-slate-500">Version</span>
                  <span className="text-xs font-mono text-slate-300">0.1.0-prototype</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-xs text-slate-500">Run ID</span>
                  <span className="text-xs font-mono text-blue-400">{run.id}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-xs text-slate-500">Timestamp</span>
                  <span className="text-xs font-mono text-slate-300">{new Date().toISOString()}</span>
                </div>
              </div>
            </div>

            {/* Context */}
            <div>
              <div className="section-label">Execution Context</div>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-xs text-slate-500">Workspace</span>
                  <span className="text-xs font-medium text-slate-300 truncate max-w-[150px]">{workspace.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-xs text-slate-500">Assets Loaded</span>
                  <span className="text-xs font-mono text-slate-300">6 (Dataset, Model)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-xs text-slate-500">Checks Executed</span>
                  <span className="text-xs font-mono text-slate-300">4</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-xs text-slate-500">Checks Skipped</span>
                  <span className="text-xs font-mono text-slate-300">0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hashes */}
          <div>
            <div className="section-label">Asset Hashes</div>
            <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-3">
              <div>
                <div className="text-[10px] text-slate-500 uppercase mb-1">Reference Dataset (reference-dataset)</div>
                <div className="text-xs font-mono text-slate-400 break-all">a83f2c14e09d3a5b7f1c8e22d6b90f4c31a7d6e9f0a2b3c4d5e6f7a8b9c091c2</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase mb-1">Baseline Model (baseline-model.onnx)</div>
                <div className="text-xs font-mono text-slate-400 break-all">3f12a94c7e85d2b1f6a3c8e0d4b7f9a2c1e3d5f7a9b0c2d4e6f8a0b2c4d6e8b1</div>
              </div>
            </div>
          </div>

          {/* Findings Summary */}
          <div>
            <div className="section-label">Findings Summary ({RICH_FINDINGS.length})</div>
            <div className="space-y-2">
              {RICH_FINDINGS.map((f) => (
                <div key={f.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${f.severity === 'PASS' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="font-mono text-xs text-slate-400 w-24">{f.id}</span>
                    <span className="text-xs text-slate-200">{f.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{f.evidence.length} evidence items</span>
                </div>
              ))}
            </div>
          </div>

          {/* Provenance */}
          <div className="flex items-start gap-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-emerald-400 mb-1">Provenance Status: VALID</div>
              <p className="text-xs text-emerald-400/80 leading-relaxed">
                Hash chain integrity verified. All artifacts and configuration parameters for this run are cryptographically linked to the workspace ledger.
              </p>
            </div>
          </div>

          {/* Software Versions */}
          <div>
            <div className="section-label">Software Versions</div>
            <div className="grid grid-cols-3 gap-2 bg-slate-950 border border-slate-800 rounded p-3 text-xs">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase">Engine</span>
                <span className="font-mono text-slate-300">v0.1.0-alpha</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase">ONNX Runtime</span>
                <span className="font-mono text-slate-300">1.17.1</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase">Torch</span>
                <span className="font-mono text-slate-300">2.2.0</span>
              </div>
            </div>
          </div>

          {/* Limitations */}
          <div className="p-4 border-l-2 border-amber-500 bg-slate-900 text-xs text-slate-400 leading-relaxed">
            <strong className="block text-slate-300 mb-2 font-semibold">Limitations</strong>
            NETRA-Guard is an assurance prototype. Results demonstrate selected checks and controlled test scenarios and should not be interpreted as security certification. Evidence references contained in this report refer to local workspace objects.
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default Reports;
