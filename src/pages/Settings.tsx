import React from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Shield,
  Activity,
  FlaskConical,
  Wifi,
  WifiOff,
  Info,
  Lock,
  HardDrive,
  CloudOff,
  FileWarning,
  Check
} from 'lucide-react';
import { MOCK_MODE } from '../services/api';

const Settings: React.FC = () => {
  return (
    <div className="space-y-8 pb-10 max-w-4xl">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="pb-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5 mb-1">
          <SettingsIcon className="w-5 h-5 text-slate-500" />
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Settings</h1>
        </div>
        <p className="text-sm text-slate-400">Environment and configuration defaults.</p>
      </div>

      <div className="space-y-6">
        {/* ── Local Runtime ────────────────────────────────────────────────── */}
        <section className="bg-slate-900 border border-slate-800 rounded-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200">Local Runtime</h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">API Base URL</label>
              <input 
                type="text" 
                value="http://localhost:8000" 
                disabled 
                className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-xs text-slate-400 font-mono opacity-75"
              />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">Connection Status</label>
              <div className="flex items-center gap-2 h-[34px] px-3 bg-slate-950 border border-slate-800 rounded-sm">
                {MOCK_MODE ? (
                  <><WifiOff className="w-3.5 h-3.5 text-amber-500" /> <span className="text-xs text-amber-500 font-medium">Mock Mode (Local Data)</span></>
                ) : (
                  <><Wifi className="w-3.5 h-3.5 text-emerald-500" /> <span className="text-xs text-emerald-500 font-medium">Connected to local engine</span></>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">Application Version</label>
              <div className="text-xs font-mono text-slate-300">0.1.0-prototype</div>
            </div>
            <div>
              <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">Environment</label>
              <div className="text-xs font-mono text-slate-300">development / isolated</div>
            </div>
          </div>
        </section>

        {/* ── Assurance Defaults ───────────────────────────────────────────── */}
        <section className="bg-slate-900 border border-slate-800 rounded-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-200">Assurance Defaults</h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">Distribution Threshold (PSI)</label>
              <input 
                type="number" 
                value="0.20" 
                disabled 
                className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-xs text-slate-400 font-mono opacity-75"
              />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">Sample Size</label>
              <select disabled className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-xs text-slate-400 opacity-75">
                <option>Use full dataset</option>
                <option>Limit to 10,000</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">Enabled Checks</label>
              <div className="flex flex-wrap gap-2">
                {['Data Integrity', 'Model Integrity', 'Distribution Shift', 'Robustness Probing'].map(check => (
                  <span key={check} className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300">
                    <Check className="w-3 h-3 text-emerald-500" /> {check}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Demo Configuration ────────────────────────────────────────────── */}
        <section className="bg-slate-900 border border-slate-800 rounded-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200">Demo Configuration</h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">Demo Workspace</label>
              <div className="text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 opacity-75">
                SIH26228 Demo Workspace
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">Controlled Scenario Mode</label>
              <div className="text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 opacity-75">
                Enabled (Allows simulated anomaly triggers)
              </div>
            </div>
          </div>
        </section>

        {/* ── Security & Privacy ────────────────────────────────────────────── */}
        <section className="bg-slate-900 border border-slate-800 rounded-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-200">Security & Privacy</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 bg-slate-950 border border-slate-800 p-3 rounded-sm">
              <CloudOff className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-slate-200 mb-0.5">Offline-first</div>
                <div className="text-[10px] text-slate-500 leading-relaxed">No external API calls are made during assurance runs.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-950 border border-slate-800 p-3 rounded-sm">
              <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-slate-200 mb-0.5">No cloud API dependency</div>
                <div className="text-[10px] text-slate-500 leading-relaxed">System is designed to operate in air-gapped environments.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-950 border border-slate-800 p-3 rounded-sm">
              <HardDrive className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-slate-200 mb-0.5">Uploads remain in local workspace</div>
                <div className="text-[10px] text-slate-500 leading-relaxed">Registered assets are persisted only to the local disk.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-950 border border-slate-800 p-3 rounded-sm">
              <FileWarning className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-slate-200 mb-0.5">Uploaded files are treated as untrusted</div>
                <div className="text-[10px] text-slate-500 leading-relaxed">Parsing utilizes safe, bounds-checked deserialization.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Disclaimer ────────────────────────────────────────────────────── */}
        <div className="p-4 border-l-2 border-slate-500 bg-slate-900 flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong className="block text-slate-300 font-semibold mb-1">Prototype Disclaimer</strong>
            NETRA-Guard is an assurance prototype. Results demonstrate selected checks and controlled test scenarios and should not be interpreted as security certification.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Settings;
