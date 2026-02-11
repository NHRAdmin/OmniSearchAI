import { GoogleGenAI, Type, GenerateContentResponse, FunctionDeclaration } from "@google/genai";
import { MessageRole, GroundingSource, MCPTool, ModelId, SearchMode } from "../types";

// Updated to use process.env.OMNI_API_KEY as requested
const getClient = () => new GoogleGenAI({ apiKey: process.env.OMNI_API_KEY });

export async function processPrompt(
  prompt: string,
  options: {
    model: ModelId;
    searchMode: SearchMode;
    audioBase64?: string;
    externalTools?: FunctionDeclaration[];
  }
) {
  // Route to Deep Research Agent if selected
  if (options.searchMode === 'deep') {
    try {
      console.log("Attempting Deep Research via Interactions API...");
      return await performDeepResearch(prompt);
    } catch (error: any) {
      console.warn("Deep Research Interactions API failed. Falling back to Gemini 3 Pro with Thinking Config.", error.message);
      // Fall through to standard generation logic below, which handles 'deep' mode via thinkingConfig
    }
  }

  const ai = getClient();
  
  // Base configuration for Standard Mode & Fallback Deep Mode
  const config: any = {
    tools: [{ googleSearch: {} }] // OmniSearch is a search engine, search is always enabled.
  };

  // Configure Deep Search Agent capabilities (Fallback or Manual Selection)
  if (options.searchMode === 'deep') {
    // Deep Search implies high thinking budget and specific persona
    config.thinkingConfig = { thinkingBudget: 32768 };
    config.systemInstruction = "You are a Deep Search Agent. Your goal is to provide comprehensive, well-researched, and accurate answers. Use the search tool to verify facts and gather in-depth information. Think critically about the user's request before responding.";
  } else {
    // Standard search instruction
    config.systemInstruction = "You are OmniSearch, a helpful AI search assistant. Provide concise and accurate answers using the search tool.";
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
    model: options.model,
    contents: { parts },
    config
  });

  // Check for tool calls (MCP tools)
  const toolCalls = response.functionCalls;
  const text = response.text || (toolCalls ? "Executing tools..." : "No response generated.");
  
  // Map grounding chunks to GroundingSource interface
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

/**
 * Implements the Deep Research loop using the REST Interactions API directly.
 * This is more robust against SDK version mismatches for preview features.
 */
async function performDeepResearch(prompt: string) {
  const apiKey = process.env.OMNI_API_KEY;
  if (!apiKey) throw new Error("OMNI_API_KEY missing");

  // Endpoint for the preview feature
  const baseUrl = "https://generativelanguage.googleapis.com/v1beta/interactions";

  console.log("Initializing Deep Research Interaction (REST)...");

  // 1. Start the interaction
  const createResponse = await fetch(`${baseUrl}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: prompt,
      agent: 'deep-research-pro-preview-12-2025',
      background: true
    })
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    let errorMessage = `API Error ${createResponse.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorMessage;
    } catch (e) {}
    throw new Error(errorMessage);
  }

  const interaction = await createResponse.json();
  const interactionId = interaction.id; // The API returns the ID directly in the response root often, or resource name.
  
  // Note: The docs say "The API returns a partial Interaction object... use the id property"
  if (!interactionId) {
    throw new Error("Did not receive an Interaction ID from the API.");
  }

  console.log(`Research started. ID: ${interactionId}`);

  // 2. Polling loop
  while (true) {
    // Poll every 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Get status
    const pollResponse = await fetch(`${baseUrl}/${interactionId}?key=${apiKey}`);
    
    if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        throw new Error(`Polling failed: ${pollResponse.status} ${errorText}`);
    }

    const currentStatus = await pollResponse.json();
    const status = currentStatus.status?.toLowerCase();
    console.log(`Research status: ${status}`);

    if (status === 'completed' || status === 'succeeded') {
      const outputs = currentStatus.outputs || [];
      const lastOutput = outputs.length > 0 ? outputs[outputs.length - 1] : null;
      
      const text = lastOutput?.text || "Research completed, but no text output was returned.";
      
      return {
        text,
        sources: [], // Deep research sources are embedded in the text/citations usually
        toolCalls: []
      };
    } else if (status === 'failed') {
      const failMsg = currentStatus.error?.message || "Unknown error";
      throw new Error(`Deep Research Task Failed: ${failMsg}`);
    }
  }
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