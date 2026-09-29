import React, { useState, useEffect } from 'react';
import { MOCK_WORKSPACE, MOCK_RUNS } from '../../mockData';
import { Server, ShieldAlert, Circle } from 'lucide-react';

const TopBar: React.FC = () => {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const latestRun = MOCK_RUNS[MOCK_RUNS.length - 1];

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 shrink-0 gap-4">
      {/* Left: workspace + run */}
      <div className="flex items-center gap-5 text-sm min-w-0">
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] text-slate-600 font-bold tracking-widest uppercase">Workspace</span>
          <span className="font-mono text-xs text-slate-300 truncate">{MOCK_WORKSPACE.name}</span>
        </div>
        <div className="w-px h-7 bg-slate-800 shrink-0" />
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-600 font-bold tracking-widest uppercase">Latest Run</span>
          <span className="font-mono text-xs text-slate-300">{latestRun.id}</span>
        </div>
      </div>

      {/* Right: badges + clock */}
      <div className="flex items-center gap-4 shrink-0">
        {/* API Status */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <Server className="w-3.5 h-3.5" />
          <span className="text-[10px] font-mono">API: LOCAL</span>
          <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
        </div>

        {/* Demo badge */}
        <div className="flex items-center gap-1.5 bg-amber-500/8 text-amber-400 px-2.5 py-1 rounded-sm border border-amber-500/20">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold tracking-wide">PROTOTYPE / CONTROLLED DEMO</span>
        </div>

        <div className="w-px h-7 bg-slate-800" />

        {/* Clock */}
        <div className="font-mono text-xs text-slate-500">
          {time.toISOString().replace('T', ' ').substring(0, 19)} UTC
        </div>
      </div>
    </header>
  );
};

export default TopBar;
