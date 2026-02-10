
import { processPrompt, transcribeAudio } from './geminiService';

export const OMNISEARCH_TOOL_SCHEMA = {
  name: "consult_omnisearch",
  description: "Query the OmniSearch AI with deep thinking and web grounding capabilities. Returns text answer and sources.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "The user's question or prompt" },
      use_thinking: { type: "boolean", description: "Enable deep thinking (reasoning-heavy, slower)" },
      use_search: { type: "boolean", description: "Enable web search grounding" }
    },
    required: ["query"]
  }
};

export const TRANSCRIBE_TOOL_SCHEMA = {
  name: "transcribe_audio",
  description: "Transcribe audio data into text using Gemini models.",
  inputSchema: {
    type: "object",
    properties: {
      audio_base64: { type: "string", description: "Base64 encoded audio data (webm/mp3/wav/pcm)" }
    },
    required: ["audio_base64"]
  }
};

export class InternalMCPServer {
  static getTools() {
    return [OMNISEARCH_TOOL_SCHEMA, TRANSCRIBE_TOOL_SCHEMA];
  }

  static async handleRequest(request: any) {
    // Handle JSON-RPC structure loosely
    const method = request.method;
    const params = request.params || {};

    if (method === 'tools/list') {
      return { tools: this.getTools() };
    }
    
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      
      if (name === 'consult_omnisearch') {
        const result = await processPrompt(args.query, {
          useThinking: args.use_thinking ?? false,
          useWebSearch: args.use_search ?? true
        });
        
        // Format response for MCP
        // We include sources in the text or as a separate block if the client supports it.
        // Standard MCP returns content list.
        let finalText = result.text;
        if (result.sources && result.sources.length > 0) {
            finalText += "\n\nSources:\n" + result.sources.map(s => s.web ? `- ${s.web.title}: ${s.web.uri}` : '').join('\n');
        }

        return {
          content: [
            { type: "text", text: finalText }
          ]
        };
      }
      
      if (name === 'transcribe_audio') {
        const text = await transcribeAudio(args.audio_base64);
        return {
          content: [{ type: "text", text }]
        };
      }
      
      throw new Error(`Unknown tool: ${name}`);
    }
    
    // Simple Ping/Initialize support
    if (method === 'initialize') {
        return {
            protocolVersion: "0.1.0",
            serverInfo: {
                name: "OmniSearch-Web-Client",
                version: "1.0.0"
            },
            capabilities: {
                tools: {}
            }
        };
    }

    if (method === 'notifications/initialized') {
        return {};
    }
    
    throw new Error(`Method not supported: ${method}`);
  }
}
