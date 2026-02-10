
import React from 'react';
import { GroundingSource } from '../types';

interface GroundingSourcesProps {
  sources: GroundingSource[];
}

const GroundingSources: React.FC<GroundingSourcesProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-slate-800">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
        <i className="fa-solid fa-magnifying-glass text-[10px]"></i> Sources
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, idx) => (
          source.web ? (
            <a
              key={idx}
              href={source.web.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-2 py-1 rounded-md transition-colors border border-slate-700 flex items-center gap-1 max-w-[200px] truncate"
            >
              <i className="fa-solid fa-link text-[10px]"></i>
              {source.web.title || source.web.uri}
            </a>
          ) : null
        ))}
      </div>
    </div>
  );
};

export default GroundingSources;
