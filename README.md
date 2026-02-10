
# OmniSearch AI

OmniSearch AI is a cutting-edge interface leveraging Google's Gemini models. It features **Deep Thinking** (reasoning capabilities), **Web Grounding** (real-time search), **Voice Transcription**, and full **Model Context Protocol (MCP)** support for tool interoperability.

## Features

- **Deep Thinking Mode**: Uses `gemini-3-pro-preview` with extended thinking budgets for complex reasoning.
- **Web Search Grounding**: Real-time factual checks using Google Search tools.
- **MCP Client & Server**:
  - Connect to external MCP servers to give the AI new tools (weather, database, etc.).
  - Expose OmniSearch itself as an MCP tool to other agents.
- **Voice Interface**: Record and transcribe audio seamlessly.
- **Headless Mode**: Run the backend logic as a standalone MCP server over stdio.

## Prerequisites

- **OS**: Linux (Ubuntu, Debian, Fedora, Arch, etc.), macOS, or Windows (WSL recommended).
- **Node.js**: v18.0.0 or higher (required for native fetch in headless mode).
- **npm** or **yarn**.

## Installation

1.  **Clone or Download** the project files into a directory.

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

## Environment Configuration

This application requires a Google GenAI API key.

1.  Create a `.env` file in the root directory:
    ```bash
    touch .env
    ```

2.  Add your API Key to the `.env` file:
    ```env
    GEMINI_API_KEY=your_actual_google_api_key_here
    ```

## Running the Web App

We use [Parcel](https://parceljs.org/) for a zero-config development server.

1.  **Start the Development Server**:
    ```bash
    npm start
    ```

2.  **Open in Browser**:
    Navigate to `http://localhost:1234`.

## Running in Headless Mode (MCP Server)

You can run OmniSearch AI as a standalone MCP server that communicates via `stdio`. This allows you to connect it to other MCP clients (like Claude Desktop or other AI agents) without running the web UI.

1.  **Run the Headless Script**:
    ```bash
    npm run headless
    ```

2.  **Usage**:
    The server accepts JSON-RPC 2.0 messages via stdin.

### API Reference & Examples

The headless server supports the following JSON-RPC 2.0 methods:

#### 1. Initialize
Handshake to establish connection and capabilities.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "0.1.0",
    "capabilities": {},
    "clientInfo": {
      "name": "client-name",
      "version": "1.0.0"
    }
  },
  "id": 1
}
```

#### 2. Initialized Notification
Sent after initialization to confirm the connection is ready.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized",
  "params": {}
}
```

#### 3. List Tools
Retrieves the list of available tools exposed by OmniSearch AI.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 2
}
```

**Response (Example):**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "consult_omnisearch",
        "description": "Query the OmniSearch AI...",
        "inputSchema": { ... }
      },
      {
        "name": "transcribe_audio",
        "description": "Transcribe audio data...",
        "inputSchema": { ... }
      }
    ]
  },
  "id": 2
}
```

#### 4. Call Tool (`consult_omnisearch`)
Queries the AI model. You can enable `use_thinking` for complex reasoning or `use_search` for web grounding.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "consult_omnisearch",
    "arguments": {
      "query": "Who won the 2024 F1 championship?",
      "use_search": true,
      "use_thinking": false
    }
  },
  "id": 3
}
```

#### 5. Call Tool (`transcribe_audio`)
Transcribes base64-encoded audio data.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "transcribe_audio",
    "arguments": {
      "audio_base64": "UklGRi..."
    }
  },
  "id": 4
}
```

## Building for Production (Web)

To create an optimized build for deployment:

```bash
npm run build
```

The output will be generated in the `dist/` directory.

## Project Structure

- `App.tsx`: Main application controller and layout.
- `headless.ts`: Entry point for headless MCP server.
- `services/geminiService.ts`: Core logic for interacting with Gemini API.
- `services/internalMcpServer.ts`: Logic for exposing the app capabilities via MCP.
- `components/`: UI components.

## Troubleshooting

- **Microphone issues**: Ensure your browser allows microphone access for localhost.
- **API Errors**: Check the console. Verify your `GEMINI_API_KEY` in the `.env` file is valid and has access to `gemini-3-pro-preview` models.
- **Headless Mode**: Ensure you are using Node.js v18+ for native `fetch` support, or the request might fail.
