
import React, { useState } from 'react';
import { MCPServer, MCPTool } from '../types';

interface MCPManagerProps {
  servers: MCPServer[];
  onAddServer: (name: string, url: string) => void;
  onRemoveServer: (id: string) => void;
  onClose: () => void;
}

const MCPManager: React.FC<MCPManagerProps> = ({ servers, onAddServer, onRemoveServer, onClose }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && url) {
      onAddServer(name, url);
      setName('');
      setUrl('');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fa-solid fa-plug-circle-bolt text-blue-400"></i>
              MCP Tool Registry
            </h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-medium">Model Context Protocol</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Add Server Form */}
          <section>
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-plus text-[10px]"></i> Connect New Server
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Server Name (e.g. Weather API)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Endpoint URL (SSE/HTTP)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20">
                  Connect
                </button>
              </div>
            </form>
          </section>

          {/* Connected Servers */}
          <section>
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Active Connectors</h3>
            <div className="space-y-4">
              {servers.length === 0 ? (
                <div className="bg-slate-800/50 border border-dashed border-slate-700 p-8 rounded-2xl text-center">
                  <p className="text-slate-500 text-sm">No MCP servers connected yet.</p>
                </div>
              ) : (
                servers.map(server => (
                  <div key={server.id} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${server.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <h4 className="font-bold text-slate-200">{server.name}</h4>
                        <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-400 font-mono">{server.url}</span>
                      </div>
                      <button 
                        onClick={() => onRemoveServer(server.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {server.tools.map((tool, idx) => (
                        <div key={idx} className="bg-slate-900/50 border border-slate-700/50 p-3 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <i className="fa-solid fa-screwdriver-wrench text-blue-400 text-xs"></i>
                            <span className="text-xs font-bold text-slate-300">{tool.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{tool.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
        
        <div className="p-4 bg-slate-800/30 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500">
            The Model Context Protocol allows this app to communicate with external data sources securely.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MCPManager;
