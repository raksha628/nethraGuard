import React from 'react';
import type { Finding } from '../../types';
import StatusBadge from './StatusBadge';
import { AlertOctagon, Info } from 'lucide-react';

interface Props {
  finding: Finding;
  onClick?: () => void;
}

const FindingCard: React.FC<Props> = ({ finding, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-slate-900 border rounded-sm p-4 transition-all
        ${onClick ? 'cursor-pointer hover:border-slate-600 hover:shadow-md' : ''}
        ${finding.severity === 'FAIL' ? 'border-red-500/30 hover:border-red-500/50' : 'border-slate-800'}
      `}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          {finding.severity === 'FAIL' ? (
            <AlertOctagon className="w-5 h-5 text-red-500" />
          ) : (
            <Info className="w-5 h-5 text-slate-500" />
          )}
          <h4 className="font-semibold text-slate-200">{finding.title}</h4>
        </div>
        <StatusBadge status={finding.severity} />
      </div>
      
      <div className="text-sm text-slate-400 mb-4 line-clamp-2">
        {finding.description}
      </div>

      <div className="flex justify-between items-center text-xs font-mono text-slate-500 border-t border-slate-800/50 pt-3">
        <span>CAT: {finding.category}</span>
        <span>ID: {finding.id}</span>
      </div>
    </div>
  );
};

export default FindingCard;
