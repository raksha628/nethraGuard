import React from 'react';
import { Copy } from 'lucide-react';

interface Props {
  hash: string;
  truncate?: boolean;
}

const HashDisplay: React.FC<Props> = ({ hash, truncate = false }) => {
  const displayHash = truncate 
    ? `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}` 
    : hash;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
  };

  return (
    <div className="inline-flex items-center gap-2 bg-slate-950 px-2 py-1 rounded border border-slate-800 group">
      <span className="font-mono text-xs text-slate-400 select-all">{displayHash}</span>
      <button 
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 transition-opacity"
        title="Copy hash"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default HashDisplay;
