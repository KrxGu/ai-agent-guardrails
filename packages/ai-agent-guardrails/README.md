# ai-agent-guardrails

[![npm version](https://img.shields.io/npm/v/ai-agent-guardrails.svg)](https://www.npmjs.com/package/ai-agent-guardrails)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Security middleware for AI SDK that adds production-grade controls to agent tool calling.

## Features

- Policy Enforcement: Allowlists, denylists, and risk-based tool classification
- Human Approval Gates: Require user confirmation for high-risk operations
- Budget Controls: Max tool calls, time limits, per-tool timeouts
- Audit Logging: Structured events compatible with OpenTelemetry
- Secret Redaction: Automatic PII/secret removal from logs
- MCP Integration: Works with Model Context Protocol tools

## Installation

```bash
npm install ai-agent-guardrails ai zod
# or
pnpm add ai-agent-guardrails ai zod
```

## Quick Start

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { guardTools, createSimplePolicy, ConsoleAuditSink } from 'ai-agent-guardrails';

// Define policy
const policy = createSimplePolicy({
  denylist: ['delete_database'], // Block dangerous tools
  requireApprovalForRisk: ['write', 'admin'], // Require approval for these
});

// Wrap tools with guardrails
const tools = guardTools(myTools, {
  policy,
  audit: new ConsoleAuditSink(),
  timeoutMs: 10_000,
});

// Use in AI SDK
const result = streamText({
  model: openai('gpt-4o-mini'),
  messages,
  tools, // ← Guarded tools
});
```

## With MCP Tools

```typescript
import { createMCPClient } from '@ai-sdk/mcp';
import { guardTools, createSimplePolicy } from 'ai-agent-guardrails';

// Connect to MCP server
const mcp = await createMCPClient({ transport: ... });
const mcpTools = await mcp.tools();

// Apply guardrails
const policy = createSimplePolicy({
  requireApprovalForRisk: ['write', 'admin'],
});

const tools = guardTools(mcpTools, { policy });
```

## Approval Flow (React)

```tsx
'use client';

import { useChat } from '@ai-sdk/react';

export default function Chat() {
  const { messages, addToolApprovalResponse } = useChat();

  return (
    <>
      {messages.map(m =>
        m.parts?.map(part => {
          if (part.state === 'approval-requested') {
            return (
              <div>
                <p>Tool requires approval: {part.type}</p>
                <button onClick={() => addToolApprovalResponse({ id: part.approval.id, approved: true })}>
                  Approve
                </button>
                <button onClick={() => addToolApprovalResponse({ id: part.approval.id, approved: false })}>
                  Deny
                </button>
              </div>
            );
          }
        })
      )}
    </>
  );
}
```

## Budget Controls

```typescript
import { createDefaultContext } from 'ai-agent-guardrails';

const ctx = createDefaultContext();
ctx.maxToolCalls = 5; // Limit to 5 tool calls
ctx.maxDurationMs = 30_000; // 30 second timeout

const tools = guardTools(myTools, { policy, ctx });
```

## Audit Logging

```typescript
import { InMemoryAuditSink, ConsoleAuditSink, FileAuditSink } from 'ai-agent-guardrails';

// Console (dev)
const audit = new ConsoleAuditSink();

// Memory (testing)
const audit = new InMemoryAuditSink();
const events = audit.getEvents();

// File (production)
const audit = new FileAuditSink('./audit.jsonl');
```

## Redaction

```typescript
import { createDefaultRedactor, createFieldRedactor } from 'ai-agent-guardrails';

// Automatic pattern-based redaction
const redactor = createDefaultRedactor();

// Field-based redaction
const redactor = createFieldRedactor(['password', 'apiKey', 'secret']);

const tools = guardTools(myTools, { policy, redactor });
```

## Documentation

- [Full Documentation](https://github.com/KrxGu/ai-agent-guardrails)
- [Threat Model](https://github.com/KrxGu/ai-agent-guardrails/blob/main/docs/THREAT_MODEL.md)
- [Demo App](https://ai-agent-guardrails-o5udcrdq2-match-my-career.vercel.app)

## License

MIT © Krish Gupta
