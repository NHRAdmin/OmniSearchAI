import { GoogleGenAI, Type, GenerateContentResponse, FunctionDeclaration } from "@google/genai";
import { MessageRole, GroundingSource, MCPTool } from "../types";

// Updated to use process.env.API_KEY as per strict coding guidelines
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function processPrompt(
  prompt: string,
  options: {
    useThinking: boolean;
    useWebSearch: boolean;
    audioBase64?: string;
    externalTools?: FunctionDeclaration[];
  }
) {
  const ai = getClient();
  const modelName = options.useThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const config: any = {
    tools: []
  };
  
  if (options.useThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  if (options.useWebSearch) {
    config.tools.push({ googleSearch: {} });
  }

  if (options.externalTools && options.externalTools.length > 0) {
    config.tools.push({ functionDeclarations: options.externalTools });
  }

  const parts: any[] = [{ text: prompt }];
  
  if (options.audioBase64) {
    parts.push({
      inlineData: {
        mimeType: 'audio/webm',
        data: options.audioBase64
      }
    });
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config
  });

  // Check for tool calls (MCP tools)
  const toolCalls = response.functionCalls;
  const text = response.text || (toolCalls ? "Executing tools..." : "No response generated.");
  
  // Map grounding chunks to GroundingSource interface to fix type error
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources: GroundingSource[] = chunks.map(chunk => ({
    web: chunk.web ? {
      uri: chunk.web.uri || '',
      title: chunk.web.title || ''
    } : undefined
  }));

  return {
    text,
    sources,
    toolCalls
  };
}

export function convertMCPToGemini(mcpTool: MCPTool): FunctionDeclaration {
  return {
    name: mcpTool.name,
    description: mcpTool.description,
    parameters: {
      type: Type.OBJECT,
      properties: mcpTool.inputSchema.properties || {},
      required: mcpTool.inputSchema.required || []
    }
  };
}

export async function transcribeAudio(audioBase64: string): Promise<string> {
  const ai = getClient();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: "Transcribe the following audio exactly. If no speech is found, return an empty string." },
        {
          inlineData: {
            mimeType: 'audio/webm',
            data: audioBase64
          }
        }
      ]
    }
  });

  return response.text || "";
}