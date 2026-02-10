
import { MCPTool, MCPServer } from "../types";

export class MCPClient {
  static async fetchTools(url: string): Promise<MCPTool[]> {
    try {
      // MCP usually uses JSON-RPC 2.0. This is a simplified fetch for a tools/list request.
      // In a real environment, this might be over SSE or WebSockets.
      const response = await fetch(`${url}/tools`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error("Failed to fetch tools from MCP server");
      const data = await response.json();
      return data.tools || [];
    } catch (e) {
      console.error("MCP fetch error:", e);
      // Fallback/Mock for demonstration if server isn't reachable
      return [];
    }
  }

  static async callTool(serverUrl: string, toolName: string, args: any): Promise<any> {
    // FIX: Changed 'url' to 'serverUrl' to match the function parameter
    const response = await fetch(`${serverUrl}/tools/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: toolName, arguments: args })
    });
    if (!response.ok) throw new Error("MCP Tool call failed");
    return await response.json();
  }
}
