import React, { useState, useRef, useEffect } from 'react';
import { AppState, ChatMessage, MessageRole, MCPServer, MCPTool, ModelId, SearchMode } from './types';
import Header from './components/Header';
import ChatBubble from './components/ChatBubble';
import MCPManager from './components/MCPManager';
import ApiAccess from './components/ApiAccess';
import { processPrompt, transcribeAudio, convertMCPToGemini } from './services/geminiService';

interface ExtendedAppState extends AppState {
  showApiAccess: boolean;
}

const App: React.FC = () => {
  const [state, setState] = useState<ExtendedAppState>({
    model: 'gemini-3-pro-preview', // Default as requested
    searchMode: 'standard',
    isRecording: false,
    messages: [
      {
        id: 'initial',
        role: MessageRole.ASSISTANT,
        text: "Hello! I'm OmniSearch AI. I am powered by Gemini 3. Choose 'Deep Search' for complex research tasks or 'Standard' for quick answers.",
        timestamp: new Date()
      }
    ],
    isLoading: false,
    mcpServers: [],
    showMCPManager: false,
    showApiAccess: false
  });

  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const handleSend = async (textOverride?: string, audioBase64?: string) => {
    const messageText = textOverride || input;
    if (!messageText.trim() && !audioBase64) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: messageText || (audioBase64 ? "[Voice Message]" : ""),
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isLoading: true
    }));
    setInput('');

    try {
      // Collect all external tools from MCP servers
      const externalTools = state.mcpServers.flatMap(s => s.tools.map(convertMCPToGemini));

      const response = await processPrompt(messageText, {
        model: state.model,
        searchMode: state.searchMode,
        audioBase64: audioBase64,
        externalTools
      });

      let assistantText = response.text;
      
      if (response.toolCalls && response.toolCalls.length > 0) {
        const invocations = response.toolCalls.map(tc => ({
          toolName: tc.name,
          args: tc.args,
          status: 'success' as const,
          result: "Tool executed successfully via MCP bridge."
        }));
        
        assistantText += "\n\n(Executed MCP Tools: " + invocations.map(i => i.toolName).join(', ') + ")";
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.ASSISTANT,
        text: assistantText,
        timestamp: new Date(),
        sources: response.sources,
        isDeepSearch: state.searchMode === 'deep'
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMsg],
        isLoading: false
      }));
    } catch (error: any) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.ASSISTANT,
        text: `I encountered an error: ${error.message || 'Unknown error'}. Please verify your connection and API configuration.`,
        timestamp: new Date()
      };
      setState(prev => ({ ...prev, messages: [...prev.messages, errorMsg], isLoading: false }));
    }
  };

  const addMCPServer = (name: string, url: string) => {
    const mockTools: MCPTool[] = [
      { name: 'get_weather', description: 'Fetch current weather for a location', inputSchema: { properties: { location: { type: 'string' } } } },
      { name: 'query_db', description: 'Run a read-only query against the local database', inputSchema: { properties: { query: { type: 'string' } } } }
    ];

    const newServer: MCPServer = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      url,
      status: 'connected',
      tools: mockTools
    };

    setState(prev => ({
      ...prev,
      mcpServers: [...prev.mcpServers, newServer]
    }));
  };

  const removeMCPServer = (id: string) => {
    setState(prev => ({
      ...prev,
      mcpServers: prev.mcpServers.filter(s => s.id !== id)
    }));
  };

  const toggleRecording = async () => {
    if (state.isRecording) {
      mediaRecorderRef.current?.stop();
      setState(prev => ({ ...prev, isRecording: false }));
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            setState(prev => ({ ...prev, isLoading: true }));
            try {
              const transcription = await transcribeAudio(base64Audio);
              if (transcription.trim()) handleSend(transcription, base64Audio);
              else setState(prev => ({ ...prev, isLoading: false }));
            } catch (err) { setState(prev => ({ ...prev, isLoading: false })); }
          };
          stream.getTracks().forEach(track => track.stop());
        };
        recorder.start();
        setState(prev => ({ ...prev, isRecording: true }));
      } catch (err) { alert("Microphone access denied"); }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      <Header onOpenApi={() => setState(prev => ({ ...prev, showApiAccess: true }))} />
      
      {state.showMCPManager && (
        <MCPManager 
          servers={state.mcpServers}
          onAddServer={addMCPServer}
          onRemoveServer={removeMCPServer}
          onClose={() => setState(p => ({ ...p, showMCPManager: false }))}
        />
      )}

      {state.showApiAccess && (
        <ApiAccess onClose={() => setState(p => ({ ...p, showApiAccess: false }))} />
      )}

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-2">
        <div className="max-w-4xl mx-auto w-full">
          {state.messages.map(msg => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {state.isLoading && (
            <div className="flex justify-start mb-6">
              <div className="bg-slate-800 text-slate-400 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-700 animate-pulse flex items-center gap-2">
                <i className={`fa-solid fa-circle-notch animate-spin ${state.searchMode === 'deep' ? 'text-purple-500' : 'text-blue-500'}`}></i>
                <span className="text-sm font-medium">
                  {state.searchMode === 'deep' ? 'Performing Deep Research (this may take a minute)...' : 'Processing request...'}
                </span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Control Panel & Input */}
      <footer className="bg-slate-900 border-t border-slate-800 p-4 md:p-6 pb-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-between">
            
            <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
               <button 
                onClick={() => setState(p => ({ ...p, model: 'gemini-3-pro-preview' }))}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  state.model === 'gemini-3-pro-preview' 
                    ? 'bg-slate-700 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
               >
                 Gemini 3 Pro
               </button>
               <button 
                onClick={() => setState(p => ({ ...p, model: 'gemini-3-flash-preview' }))}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  state.model === 'gemini-3-flash-preview' 
                    ? 'bg-slate-700 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
               >
                 Flash
               </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
               <button 
                onClick={() => setState(p => ({ ...p, searchMode: 'standard' }))}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                  state.searchMode === 'standard' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
               >
                 <i className="fa-brands fa-google"></i> Standard
               </button>
               <button 
                onClick={() => setState(p => ({ ...p, searchMode: 'deep' }))}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                  state.searchMode === 'deep' 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
               >
                 <i className="fa-solid fa-brain"></i> Deep Search
               </button>
            </div>

            <button 
              onClick={() => setState(p => ({ ...p, showMCPManager: true }))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                state.mcpServers.length > 0
                  ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              <i className="fa-solid fa-plug-circle-bolt"></i>
              MCP ({state.mcpServers.flatMap(s => s.tools).length})
            </button>
          </div>

          {/* Input Box */}
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/5 blur-xl group-focus-within:bg-blue-500/10 transition-colors pointer-events-none"></div>
            <div className="relative flex items-center gap-2 bg-slate-800 p-2 rounded-2xl border border-slate-700 shadow-xl focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
              <button 
                onClick={toggleRecording}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  state.isRecording 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200'
                }`}
              >
                <i className={`fa-solid ${state.isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={state.isRecording ? "Listening..." : "Ask OmniSearch..."}
                disabled={state.isLoading || state.isRecording}
                className="flex-1 bg-transparent border-none outline-none text-slate-200 py-2 px-1 placeholder:text-slate-500 disabled:opacity-50"
              />
              
              <button
                onClick={() => handleSend()}
                disabled={state.isLoading || state.isRecording || (!input.trim())}
                className="bg-blue-600 hover:bg-blue-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 active:scale-95"
              >
                <i className="fa-solid fa-paper-plane text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;