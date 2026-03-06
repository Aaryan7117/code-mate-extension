import * as vscode from 'vscode';

export interface WorkspaceContextData {
    /** The currently selected text, if any */
    selectedText: string | null;
    /** Full content of the active file */
    fileContent: string | null;
    /** Language ID of the active file (e.g. 'typescript', 'python') */
    language: string | null;
    /** File path of the active file */
    filePath: string | null;
    /** File name only */
    fileName: string | null;
    /** VS Code diagnostics (errors/warnings) for the active file */
    diagnostics: DiagnosticInfo[];
    /** Workspace folder name */
    workspaceName: string | null;
}

export interface DiagnosticInfo {
    message: string;
    severity: 'error' | 'warning' | 'info' | 'hint';
    line: number;
    source: string | undefined;
    code: string | number | undefined;
}

/**
 * Gathers rich context from the current VS Code workspace
 */
export function getWorkspaceContext(): WorkspaceContextData {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return {
            selectedText: null,
            fileContent: null,
            language: null,
            filePath: null,
            fileName: null,
            diagnostics: [],
            workspaceName: vscode.workspace.workspaceFolders?.[0]?.name || null,
        };
    }

    const document = editor.document;
    const selection = editor.selection;
    const selectedText = selection.isEmpty ? null : document.getText(selection);

    // Gather diagnostics for this file
    const rawDiagnostics = vscode.languages.getDiagnostics(document.uri);
    const diagnostics: DiagnosticInfo[] = rawDiagnostics.map(d => ({
        message: d.message,
        severity: mapSeverity(d.severity),
        line: d.range.start.line + 1,
        source: d.source,
        code: typeof d.code === 'object' ? d.code.value : d.code,
    }));

    const filePath = document.fileName;
    const parts = filePath.replace(/\\/g, '/').split('/');
    const fileName = parts[parts.length - 1];

    return {
        selectedText,
        fileContent: document.getText(),
        language: document.languageId,
        filePath,
        fileName,
        diagnostics,
        workspaceName: vscode.workspace.workspaceFolders?.[0]?.name || null,
    };
}

function mapSeverity(severity: vscode.DiagnosticSeverity): DiagnosticInfo['severity'] {
    switch (severity) {
        case vscode.DiagnosticSeverity.Error: return 'error';
        case vscode.DiagnosticSeverity.Warning: return 'warning';
        case vscode.DiagnosticSeverity.Information: return 'info';
        case vscode.DiagnosticSeverity.Hint: return 'hint';
    }
}

/**
 * Format diagnostics into a readable string for the LLM
 */
export function formatDiagnostics(diagnostics: DiagnosticInfo[]): string {
    if (diagnostics.length === 0) { return 'No errors or warnings.'; }

    return diagnostics
        .map(d => `[${d.severity.toUpperCase()}] Line ${d.line}: ${d.message}${d.source ? ` (${d.source})` : ''}`)
        .join('\n');
}
