# Code Mate 🤖

An **agentic VS Code extension** powered by local LLMs (Ollama + Llama 3.2). Code Mate provides intelligent coding agents that debug, generate, explain, review, and refactor your code — all running locally, no cloud API keys needed.

## Features

| Agent | Shortcut | Description |
|-------|----------|-------------|
| 💬 **Chat** | `Ctrl+Shift+M` | Free-form coding assistant |
| 🔍 **Explain** | `Ctrl+Shift+E` | Explains selected code or full file |
| 🐛 **Debug** | `Ctrl+Shift+B` | Reads VS Code diagnostics → suggests fixes |
| ⚡ **Generate** | `Ctrl+Shift+G` | Generates code from natural language |
| 📋 **Review** | Right-click | Code review with severity ratings |
| ♻️ **Refactor** | Right-click | Suggests cleaner alternatives |

### Key Capabilities

- **Streaming responses** — word-by-word, like ChatGPT
- **Context-aware** — reads your active file, selection, and VS Code diagnostics
- **Right-click context menu** — Code Mate submenu with all agents
- **Code block actions** — Copy / Insert at Cursor
- **Model picker** — switch between any Ollama model
- **Status bar** — shows connection state + active model
- **Fully local** — no data leaves your machine

## Prerequisites

1. [Ollama](https://ollama.com/) installed and running
2. A model pulled (e.g. `ollama pull llama3.2`)

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/Aaryan7117/code-mate-gdsc.git

# 2. Install dependencies
cd code-mate-gdsc/vs-extension-code-mate/code-mate
npm install

# 3. Build
npm run build

# 4. Open in VS Code and press F5 to launch
code .
```

## Configuration

Open VS Code Settings → search "Code Mate":

| Setting | Default | Description |
|---------|---------|-------------|
| `codeMate.ollamaUrl` | `http://localhost:11434` | Ollama API endpoint |
| `codeMate.model` | `llama3.2` | Model to use |
| `codeMate.temperature` | `0.3` | Response creativity (0–2) |
| `codeMate.maxTokens` | `4096` | Max response length |

## Architecture

```
code-mate/
├── src/
│   ├── extension.ts              ← Entry point
│   ├── ollamaClient.ts           ← Ollama HTTP API client (streaming)
│   ├── ChatViewProvider.ts       ← Sidebar webview + chat UI
│   ├── agents/
│   │   └── agentManager.ts       ← Agent orchestration
│   └── context/
│       ├── workspaceContext.ts    ← Gathers editor context
│       └── promptBuilder.ts      ← Agent-specific prompts
├── resources/
│   └── icon.svg                  ← Activity bar icon
├── package.json
├── tsconfig.json
└── webpack.config.js
```

## License

MIT
