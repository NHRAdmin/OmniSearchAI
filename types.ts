
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
  isThinking?: boolean;
  toolInvocations?: ToolInvocation[];
}

export interface ToolInvocation {
  toolName: string;
  args: any;
  result?: any;
  status: 'calling' | 'success' | 'error';
}

export interface AppState {
  isThinkingMode: boolean;
  isWebSearchEnabled: boolean;
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
