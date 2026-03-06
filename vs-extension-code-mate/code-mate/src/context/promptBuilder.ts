import { WorkspaceContextData, formatDiagnostics } from './workspaceContext';

export type AgentType = 'explain' | 'debug' | 'generate' | 'review' | 'refactor' | 'chat';

const SYSTEM_PROMPTS: Record<AgentType, string> = {
    explain: `You are Code Mate, an expert code explainer embedded in VS Code. 
Your job is to explain code clearly and concisely.
- Break down complex logic step by step
- Explain the purpose, inputs, outputs, and side effects
- Mention any design patterns or algorithms used
- Use markdown formatting with code blocks when referencing specific parts
- Keep explanations practical and developer-friendly`,

    debug: `You are Code Mate, an expert debugger embedded in VS Code.
Your job is to analyze code errors and bugs, then suggest fixes.
- Analyze the provided error messages and diagnostics
- Identify the root cause of each issue
- Provide specific, actionable fixes with code examples
- Explain WHY the error occurs, not just how to fix it
- If multiple issues exist, prioritize by severity
- Wrap fix code in \`\`\`language blocks so the developer can copy them
- If you suggest a code change, clearly show the before/after`,

    generate: `You are Code Mate, an expert code generator embedded in VS Code.
Your job is to generate clean, production-ready code from natural language descriptions.
- Write well-structured, documented code
- Follow best practices for the target language
- Include error handling where appropriate
- Add brief inline comments for complex logic
- Use the context of the current file to match coding style
- Return ONLY the code wrapped in \`\`\`language blocks unless explanation is needed`,

    review: `You are Code Mate, a senior code reviewer embedded in VS Code.
Your job is to review code for quality, bugs, security, and performance.
Structure your review as:
1. **Summary** — one-line verdict
2. **Issues Found** — list each with severity (🔴 Critical, 🟡 Warning, 🔵 Info)
3. **Suggestions** — improvements with code examples
4. **What's Good** — positive observations
Be constructive, specific, and actionable.`,

    refactor: `You are Code Mate, a refactoring expert embedded in VS Code.
Your job is to suggest cleaner, more efficient alternatives to the provided code.
- Identify code smells and anti-patterns
- Provide refactored versions with explanations
- Show before/after comparisons
- Preserve functionality while improving readability and performance
- Wrap all code in \`\`\`language blocks`,

    chat: `You are Code Mate, an intelligent coding assistant embedded in VS Code.
You help developers with coding questions, debugging, architecture decisions, and more.
- Use the workspace context provided to give relevant answers
- Format code in \`\`\`language blocks
- Be concise but thorough
- If you reference specific files or lines, mention them clearly`,
};

/**
 * Build a complete prompt for the LLM, combining context + user query + agent system prompt
 */
export function buildPrompt(
    agentType: AgentType,
    userQuery: string,
    context: WorkspaceContextData
): { prompt: string; systemPrompt: string } {
    const systemPrompt = SYSTEM_PROMPTS[agentType];
    const contextBlock = buildContextBlock(agentType, context);
    const prompt = contextBlock ? `${contextBlock}\n\n${userQuery}` : userQuery;

    return { prompt, systemPrompt };
}

function buildContextBlock(agentType: AgentType, ctx: WorkspaceContextData): string {
    const parts: string[] = [];

    // File metadata
    if (ctx.fileName) {
        parts.push(`**File:** \`${ctx.fileName}\` (${ctx.language || 'unknown'})`);
    }

    // Selected code (priority for explain, debug, review, refactor)
    if (ctx.selectedText) {
        parts.push(`**Selected Code:**\n\`\`\`${ctx.language || ''}\n${ctx.selectedText}\n\`\`\``);
    } else if (ctx.fileContent && ['explain', 'review', 'chat', 'debug', 'refactor'].includes(agentType)) {
        // Send full file for most agents if no selection
        const maxLen = agentType === 'chat' ? 4000 : 8000;
        const truncated = ctx.fileContent.length > maxLen
            ? ctx.fileContent.substring(0, maxLen) + '\n// ... (truncated)'
            : ctx.fileContent;
        parts.push(`**Full File:**\n\`\`\`${ctx.language || ''}\n${truncated}\n\`\`\``);
    }

    // Diagnostics (especially important for debug agent)
    if (agentType === 'debug' && ctx.diagnostics.length > 0) {
        parts.push(`**Diagnostics:**\n${formatDiagnostics(ctx.diagnostics)}`);
    }

    // File content for generate agent (to match coding style)
    if (agentType === 'generate' && ctx.fileContent) {
        const snippet = ctx.fileContent.substring(0, 2000);
        parts.push(`**Current file context (for style matching):**\n\`\`\`${ctx.language || ''}\n${snippet}\n\`\`\``);
    }

    if (parts.length === 0) { return ''; }
    return `---\n**Workspace Context:**\n${parts.join('\n\n')}\n---`;
}
