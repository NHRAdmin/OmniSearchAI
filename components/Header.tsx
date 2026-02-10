
import React from 'react';

interface HeaderProps {
  onOpenApi?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenApi }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <i className="fa-solid fa-bolt-lightning text-white text-lg"></i>
        </div>
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          OmniSearch AI
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {onOpenApi && (
          <button 
            onClick={onOpenApi}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-2"
          >
            <i className="fa-solid fa-code"></i>
            API
          </button>
        )}
        <div className="text-xs font-medium px-2 py-1 rounded bg-slate-800 text-slate-400 uppercase tracking-widest border border-slate-700">
          v1.0.0
        </div>
      </div>
    </header>
  );
};

export default Header;
