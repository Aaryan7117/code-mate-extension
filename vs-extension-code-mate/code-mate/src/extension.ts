import * as vscode from 'vscode';
import { OllamaClient } from './ollamaClient';
import { AgentManager } from './agents/agentManager';
import { ChatViewProvider } from './ChatViewProvider';
import { AgentType } from './context/promptBuilder';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('Code Mate is now active!');

    // Initialize core services
    const ollama = new OllamaClient();
    const agentManager = new AgentManager(ollama);

    // Create sidebar chat view provider
    const chatProvider = new ChatViewProvider(context.extensionUri, agentManager);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ChatViewProvider.viewType,
            chatProvider,
            { webviewOptions: { retainContextWhenHidden: true } }
        )
    );

    // Status bar item (shows Ollama connection status)
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'codeMate.chat';
    context.subscriptions.push(statusBarItem);
    updateStatusBar(ollama);

    // Periodically check Ollama status
    const statusInterval = setInterval(() => updateStatusBar(ollama), 30000);
    context.subscriptions.push({ dispose: () => clearInterval(statusInterval) });

    // Register commands
    const commands: [string, () => void][] = [
        ['codeMate.chat', () => {
            vscode.commands.executeCommand('codeMate.chatView.focus');
        }],
        ['codeMate.explain', () => chatProvider.triggerAgent('explain')],
        ['codeMate.debug', () => chatProvider.triggerAgent('debug')],
        ['codeMate.generate', () => chatProvider.triggerAgent('generate')],
        ['codeMate.review', () => chatProvider.triggerAgent('review')],
        ['codeMate.refactor', () => chatProvider.triggerAgent('refactor')],
        ['codeMate.selectModel', async () => {
            try {
                const models = await ollama.listModels();
                if (models.length === 0) {
                    vscode.window.showWarningMessage('No models found. Pull a model first: ollama pull llama3.2');
                    return;
                }
                const items = models.map(m => ({
                    label: m.name,
                    description: `${(m.size / 1e9).toFixed(1)} GB`,
                }));
                const picked = await vscode.window.showQuickPick(items, {
                    placeHolder: 'Select an Ollama model',
                });
                if (picked) {
                    await vscode.workspace.getConfiguration('codeMate').update('model', picked.label, true);
                    vscode.window.showInformationMessage(`Code Mate model set to: ${picked.label}`);
                    updateStatusBar(ollama);
                }
            } catch {
                vscode.window.showErrorMessage('Failed to list models. Is Ollama running?');
            }
        }],
    ];

    for (const [id, handler] of commands) {
        context.subscriptions.push(vscode.commands.registerCommand(id, handler));
    }
}

async function updateStatusBar(ollama: OllamaClient): Promise<void> {
    const running = await ollama.isRunning();
    const model = vscode.workspace.getConfiguration('codeMate').get<string>('model', 'llama3.2');

    if (running) {
        statusBarItem.text = `$(hubot) Code Mate (${model})`;
        statusBarItem.tooltip = `Code Mate — Connected to Ollama (${model})`;
        statusBarItem.backgroundColor = undefined;
    } else {
        statusBarItem.text = `$(hubot) Code Mate ⚠`;
        statusBarItem.tooltip = 'Code Mate — Ollama not running. Click to open chat.';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }

    statusBarItem.show();
}

export function deactivate() { }
