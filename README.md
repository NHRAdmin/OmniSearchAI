
# OmniSearch AI

OmniSearch AI is a cutting-edge interface leveraging Google's Gemini models. It features **Deep Thinking** (reasoning capabilities), **Web Grounding** (real-time search), **Voice Transcription**, and full **Model Context Protocol (MCP)** support for tool interoperability.

## Features

- **Deep Thinking Mode**: Uses `gemini-3-pro-preview` with extended thinking budgets for complex reasoning.
- **Web Search Grounding**: Real-time factual checks using Google Search tools.
- **MCP Client & Server**:
  - Connect to external MCP servers to give the AI new tools (weather, database, etc.).
  - Expose OmniSearch itself as an MCP tool to other agents.
- **Voice Interface**: Record and transcribe audio seamlessly.

## Prerequisites

- **OS**: Linux (Ubuntu, Debian, Fedora, Arch, etc.), macOS, or Windows (WSL recommended).
- **Node.js**: v16.0.0 or higher.
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
    *Note: The application looks specifically for `GEMINI_API_KEY`.*

## Running Locally

We use [Parcel](https://parceljs.org/) for a zero-config development server that automatically handles TypeScript, React, and environment variables.

1.  **Start the Development Server**:
    ```bash
    npm start
    ```

2.  **Open in Browser**:
    Navigate to `http://localhost:1234` (or the port displayed in your terminal).

## Building for Production

To create an optimized build for deployment:

```bash
npm run build
```

The output will be generated in the `dist/` directory.

## Project Structure

- `App.tsx`: Main application controller and layout.
- `services/geminiService.ts`: Core logic for interacting with Gemini API.
- `services/internalMcpServer.ts`: Logic for exposing the app capabilities via MCP.
- `components/`: UI components (ChatBubble, MCPManager, etc.).

## Troubleshooting

- **Microphone issues**: Ensure your browser allows microphone access for localhost.
- **API Errors**: Check the browser console. If you see 403/400 errors, verify your `GEMINI_API_KEY` in the `.env` file is valid and has access to `gemini-3-pro-preview` models.
