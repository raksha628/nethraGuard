import React from 'react';
import type { Status } from '../../types';
import { CheckCircle2, AlertCircle, XCircle, HelpCircle } from 'lucide-react';

interface Props {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
}

const config: Record<Status, { label: string; colors: string; icon: React.ElementType }> = {
  PASS: {
    label: 'PASS',
    colors: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2,
  },
  WARNING: {
    label: 'WARNING',
    colors: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    icon: AlertCircle,
  },
  FAIL: {
    label: 'FAIL',
    colors: 'bg-red-500/10 text-red-400 border-red-500/30',
    icon: XCircle,
  },
  'NOT RUN': {
    label: 'NOT RUN',
    colors: 'bg-slate-700/30 text-slate-400 border-slate-600/30',
    icon: HelpCircle,
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

const iconSizes = { sm: 'w-3 h-3', md: 'w-3.5 h-3.5', lg: 'w-4 h-4' };

const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const { label, colors, icon: Icon } = config[status];
  return (
    <span
      className={`inline-flex items-center font-semibold tracking-wide rounded-sm border ${colors} ${sizeClasses[size]}`}
    >
      <Icon className={iconSizes[size]} />
      {label}
    </span>
  );
};

export default StatusBadge;
