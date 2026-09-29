import React from 'react';

interface Props {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

const SectionHeader: React.FC<Props> = ({ title, description, actions }) => {
  return (
    <div className="flex justify-between items-end mb-6 pb-4 border-b border-slate-800">
      <div>
        <h2 className="text-xl font-semibold text-slate-100 tracking-tight">{title}</h2>
        {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
      </div>
      {actions && (
        <div className="flex gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
