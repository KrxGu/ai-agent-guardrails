import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { guardTools, createSimplePolicy, ConsoleAuditSink, createDefaultContext } from 'ai-agent-guardrails';
import { getMcpClient } from './mcpClient';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Define the policy: require approval for write/admin operations
 */
const policy = createSimplePolicy({
  // Optionally specify an allowlist (if empty, all tools are allowed by default)
  // allowlist: ['search_docs', 'create_issue', 'send_email'],
  
  // Optionally specify a denylist (block these tools entirely)
  denylist: ['delete_resource'], // Block the dangerous delete tool
  
  // Require approval for write and admin operations
  requireApprovalForRisk: ['write', 'admin'],
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    console.log('[chat route] Received messages:', messages.length);

    // Get MCP client and tools
    const mcp = await getMcpClient();
    const mcpTools = await mcp.tools();

    console.log('[chat route] Available MCP tools:', Object.keys(mcpTools));

    // Create a guard context for this request
    const ctx = createDefaultContext();
    console.log('[chat route] Guard context created:', ctx.requestId);

    // Wrap tools with guardrails
    const tools = guardTools(mcpTools, {
      policy,
      ctx,
      audit: new ConsoleAuditSink(),
      timeoutMs: 10_000, // 10 second timeout per tool
    });

    // Stream text response with guarded tools
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages,
      tools: tools as any, // Type assertion to handle AI SDK version differences
      maxSteps: 5, // Limit agent loop steps
    });

    // Return as UI message stream for useChat
    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('[chat route] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
