import React from 'react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
}

const MetricCard: React.FC<Props> = ({ title, value, subtitle, icon, trend }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-sm p-4 relative overflow-hidden shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-slate-400 text-xs font-semibold tracking-wider uppercase">{title}</h3>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-mono text-slate-100">{value}</span>
        {trend && (
          <span className={`text-xs font-medium ${trend.positive ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && (
        <div className="mt-2 text-xs text-slate-500">{subtitle}</div>
      )}
    </div>
  );
};

export default MetricCard;
