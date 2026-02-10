
import React, { useState } from 'react';
import { InternalMCPServer, OMNISEARCH_TOOL_SCHEMA, TRANSCRIBE_TOOL_SCHEMA } from '../services/internalMcpServer';

interface ApiAccessProps {
  onClose: () => void;
}

const ApiAccess: React.FC<ApiAccessProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'test'>('docs');
  const [requestJson, setRequestJson] = useState(JSON.stringify({
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "consult_omnisearch",
      arguments: {
        query: "Explain the latest advancements in quantum computing",
        use_thinking: true,
        use_search: true
      }
    },
    id: 1
  }, null, 2));
  
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRun = async () => {
    try {
      setIsLoading(true);
      setResponse('');
      const req = JSON.parse(requestJson);
      const result = await InternalMCPServer.handleRequest(req);
      setResponse(JSON.stringify({
        jsonrpc: "2.0",
        result,
        id: req.id
      }, null, 2));
    } catch (e: any) {
      setResponse(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: e.message },
        id: JSON.parse(requestJson)?.id || null
      }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
             <div className="bg-emerald-500/10 p-2 rounded-lg">
                <i className="fa-solid fa-server text-emerald-400 text-xl"></i>
             </div>
             <div>
                <h2 className="text-xl font-bold text-white">OmniSearch MCP Server</h2>
                <p className="text-xs text-slate-400">Expose app capabilities to external models</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50">
            <button 
                onClick={() => setActiveTab('docs')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'docs' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5' : 'text-slate-400 hover:text-slate-200'}`}
            >
                <i className="fa-solid fa-book mr-2"></i> API Definitions
            </button>
            <button 
                onClick={() => setActiveTab('test')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'test' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5' : 'text-slate-400 hover:text-slate-200'}`}
            >
                <i className="fa-solid fa-terminal mr-2"></i> Test Console
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950 p-6">
            {activeTab === 'docs' && (
                <div className="space-y-8">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <p className="text-sm text-blue-200">
                            <i className="fa-solid fa-circle-info mr-2"></i>
                            Use these JSON schemas to configure other MCP-capable agents (like Claude Desktop or custom bots) to use OmniSearch as a tool.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {[OMNISEARCH_TOOL_SCHEMA, TRANSCRIBE_TOOL_SCHEMA].map((tool, idx) => (
                            <div key={idx} className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900">
                                <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
                                    <code className="text-emerald-400 font-bold font-mono">{tool.name}</code>
                                    <button 
                                        onClick={() => copyToClipboard(JSON.stringify(tool, null, 2))}
                                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                                    >
                                        Copy JSON
                                    </button>
                                </div>
                                <div className="p-4">
                                    <p className="text-slate-400 text-sm mb-4">{tool.description}</p>
                                    <div className="relative">
                                        <pre className="bg-slate-950 rounded-xl p-4 text-xs text-slate-300 font-mono overflow-x-auto custom-scrollbar border border-slate-800">
                                            {JSON.stringify(tool.inputSchema, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'test' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                    <div className="flex flex-col h-full">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Request (JSON-RPC)</label>
                        <textarea
                            value={requestJson}
                            onChange={(e) => setRequestJson(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-sm text-slate-200 outline-none focus:border-emerald-500/50 resize-none"
                            spellCheck={false}
                        />
                        <button 
                            onClick={handleRun}
                            disabled={isLoading}
                            className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-play"></i>}
                            Execute Request
                        </button>
                    </div>

                    <div className="flex flex-col h-full">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Response</label>
                        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-sm text-slate-300 overflow-auto custom-scrollbar relative">
                            {response ? (
                                <pre>{response}</pre>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-700 pointer-events-none">
                                    Waiting for execution...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ApiAccess;
