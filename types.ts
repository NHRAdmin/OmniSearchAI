
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface GroundingSource {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  sources?: GroundingSource[];
  isDeepSearch?: boolean; // Renamed from isThinking to be more specific to the feature
  toolInvocations?: ToolInvocation[];
}

export interface ToolInvocation {
  toolName: string;
  args: any;
  result?: any;
  status: 'calling' | 'success' | 'error';
}

export type ModelId = 'gemini-3-pro-preview' | 'gemini-3-flash-preview';
export type SearchMode = 'standard' | 'deep';

export interface AppState {
  model: ModelId;
  searchMode: SearchMode;
  isRecording: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  mcpServers: MCPServer[];
  showMCPManager: boolean;
}

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  status: 'connected' | 'disconnected' | 'connecting';
  tools: MCPTool[];
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}
