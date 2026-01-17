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

    const transformedMessages = messages.map((msg: any) => {
      if (msg.role === 'user' && msg.parts) {
        const textContent = msg.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('');
        return { role: 'user', content: textContent };
      }
      return msg;
    });

    const mcp = await getMcpClient();
    const mcpTools = await mcp.tools();

    const ctx = createDefaultContext();

    const tools = guardTools(mcpTools as any, {
      policy,
      ctx,
      audit: new ConsoleAuditSink(),
      timeoutMs: 10_000,
    });

    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: transformedMessages,
      tools: tools as any,
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
