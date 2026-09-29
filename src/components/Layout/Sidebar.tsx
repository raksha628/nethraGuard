import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  FolderOpen,
  PlaySquare,
  AlertTriangle,
  Link as LinkIcon,
  FileText,
  Settings,
  Wifi,
} from 'lucide-react';

const navItems = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/workspace', label: 'Workspace', icon: FolderOpen },
  { path: '/run', label: 'Assurance Run', icon: PlaySquare },
  { path: '/findings', label: 'Findings', icon: AlertTriangle },
  { path: '/provenance', label: 'Provenance', icon: LinkIcon },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border gap-2.5">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
        <div>
          <div className="font-bold text-sm tracking-wide text-slate-100 leading-none">NETRA-Guard</div>
          <div className="text-[9px] text-slate-500 tracking-widest mt-0.5">CV ASSURANCE</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 px-2 space-y-0.5 overflow-y-auto">
        <div className="text-[9px] font-bold text-slate-600 tracking-[0.15em] mb-3 px-3 uppercase">
          Navigation
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-sm transition-colors duration-100 gap-2.5
              ${
                isActive
                  ? 'bg-sidebar-active text-blue-400'
                  : 'text-slate-400 hover:bg-sidebar-active/50 hover:text-slate-200'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono text-slate-500 tracking-wider">LOCAL / OFFLINE</span>
          <Wifi className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <div className="text-[9px] text-slate-600 font-mono uppercase tracking-wider">
          Prototype Build v0.1.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
