import { createInterface } from 'readline';
import { InternalMCPServer } from './services/internalMcpServer';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Ensure API_KEY is present
if (!process.env.API_KEY) {
  console.error("Error: API_KEY is not set in environment variables.");
  (process as any).exit(1);
}

// Log startup to stderr so we don't pollute stdout (used for JSON-RPC)
console.error("OmniSearch AI Headless MCP Server starting...");

const rl = createInterface({
  input: (process as any).stdin,
  output: (process as any).stdout,
  terminal: false
});

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const request = JSON.parse(trimmed);
    
    // Process the request using the Internal MCP Server logic
    let result;
    let error;

    try {
        result = await InternalMCPServer.handleRequest(request);
    } catch (e: any) {
        error = {
            code: -32603, // Internal error code
            message: e.message || "Internal Server Error"
        };
    }

    // Construct JSON-RPC 2.0 Response
    const response: any = {
        jsonrpc: "2.0",
        id: request.id
    };

    if (error) {
        response.error = error;
    } else {
        response.result = result;
    }

    // Send response to stdout
    console.log(JSON.stringify(response));

  } catch (parseError) {
    console.error("Failed to parse input line:", trimmed);
    // Note: If we can't parse JSON, we can't reliably get the ID to respond with an error.
  }
});