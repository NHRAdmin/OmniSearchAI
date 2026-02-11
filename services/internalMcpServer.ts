
import { processPrompt, transcribeAudio } from './geminiService';
import { ModelId, SearchMode } from '../types';

export const OMNISEARCH_TOOL_SCHEMA = {
  name: "consult_omnisearch",
  description: "Query the OmniSearch AI. capable of Standard or Deep Search using Gemini models.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "The user's question or prompt" },
      model: { 
        type: "string", 
        enum: ["gemini-3-pro-preview", "gemini-3-flash-preview"],
        description: "The model to use. Default is gemini-3-pro-preview."
      },
      search_mode: { 
        type: "string", 
        enum: ["standard", "deep"],
        description: "Search mode. 'deep' uses extensive reasoning (thinking) and research. 'standard' is faster."
      }
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
    const method = request.method;
    const params = request.params || {};

    if (method === 'tools/list') {
      return { tools: this.getTools() };
    }
    
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      
      if (name === 'consult_omnisearch') {
        const model: ModelId = args.model || 'gemini-3-pro-preview';
        const searchMode: SearchMode = args.search_mode || 'standard';

        const result = await processPrompt(args.query, {
          model,
          searchMode,
        });
        
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
    
    if (method === 'initialize') {
        return {
            protocolVersion: "2024-11-05",
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