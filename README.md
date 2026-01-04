# AI Agent Guardrails

Security middleware for Vercel AI SDK that adds production-grade controls to agent tool calling.

## Overview

When you deploy AI agents to production, you need more than prompt engineering. This package provides a tool firewall that wraps AI SDK tools with:

- Policy enforcement (allowlists, denylists, approval requirements)
- Budget controls (call limits, timeouts, execution time caps)
- Audit logging (structured events with stable schema)
- Automatic redaction (PII and secrets removed from logs)

Works with AI SDK's native tool calling and Model Context Protocol (MCP) servers. No changes to your agent logic required.

## The Problem

Shipping agents safely means solving several problems at once:

**Policy Enforcement**: Prevent prompt injection attacks from calling forbidden tools. Block dangerous operations like database deletions or bulk emails.

**Cost Controls**: Stop runaway loops that burn through API budgets. Cap execution time for hanging tools.

**Audit Trails**: Record every tool call attempt (successful or blocked) for compliance reviews and incident response.

**Human Oversight**: Pause execution before destructive actions. Let users approve high-risk operations like billing changes or data deletion.

## Installation

```bash
pnpm add ai-agent-guardrails ai zod
```

## Quick Start

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { guardTools, createSimplePolicy, ConsoleAuditSink } from 'ai-agent-guardrails';

const policy = createSimplePolicy({
  denylist: ['delete_database'],
  requireApprovalForRisk: ['write', 'admin'],
});

const tools = guardTools(myTools, {
  policy,
  audit: new ConsoleAuditSink(),
  timeoutMs: 10_000,
});

const result = streamText({
  model: openai('gpt-4o-mini'),
  messages,
  tools,
});
```

## Core Features

### Policy Enforcement

Define which tools can execute and under what conditions:

```typescript
const policy = createSimplePolicy({
  allowlist: ['search', 'read_docs'],    // Only these tools allowed (whitelist mode)
  denylist: ['delete', 'drop_table'],     // These are always blocked
  requireApprovalForRisk: ['write', 'admin'],  // Pause for user approval
});
```

Policies are checked before tool execution. Denied tools never reach the underlying implementation.

### Budget Controls

Limit execution to prevent cost overruns:

```typescript
const ctx = createDefaultContext();
ctx.maxToolCalls = 5;         // Stop after 5 tool calls
ctx.maxDurationMs = 30_000;   // Hard timeout at 30 seconds

const tools = guardTools(myTools, { policy, ctx });
```

When limits are exceeded, the request terminates immediately with a `budget_exceeded` audit event.

### Human Approval Gates

Integrates with AI SDK's approval mechanism. Mark tools as requiring approval and the framework pauses execution:

```typescript
const policy = createSimplePolicy({
  requireApprovalForRisk: ['write', 'admin'],
});

// In your React UI:
const { addToolApprovalResponse } = useChat();

addToolApprovalResponse({ id: toolCallId, approved: true }); // or false to deny
```

### Audit Logging

Every tool interaction generates a structured audit event:

```typescript
import { InMemoryAuditSink, ConsoleAuditSink, FileAuditSink } from 'ai-agent-guardrails';

// Development: log to console
const audit = new ConsoleAuditSink();

// Testing: accumulate in memory
const audit = new InMemoryAuditSink();
const events = audit.getEvents();

// Production: append to JSONL file
const audit = new FileAuditSink('./audit.jsonl');
```

Event types: `tool_call_attempted`, `tool_call_blocked`, `tool_call_needs_approval`, `tool_call_executed`, `tool_call_timeout`, `budget_exceeded`.

### Redaction

Strip sensitive data from logs before writing:

```typescript
import { createDefaultRedactor, createFieldRedactor, composeRedactors } from 'ai-agent-guardrails';

// Pattern-based: API keys, tokens, emails, SSNs
const redactor = createDefaultRedactor();

// Field-based: remove specific keys from objects
const redactor = createFieldRedactor(['password', 'apiKey', 'secret']);

// Combine multiple strategies
const redactor = composeRedactors(
  createDefaultRedactor(),
  createFieldRedactor(['internalId'])
);

const tools = guardTools(myTools, { policy, redactor });
```

Redaction applies only to audit sinks. Tool execution sees the original unredacted data.

## Model Context Protocol (MCP)

The package works with MCP servers without modification:

```typescript
import { createMCPClient } from '@ai-sdk/mcp';
import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';
import { guardTools, createSimplePolicy } from 'ai-agent-guardrails';

const mcp = await createMCPClient({
  transport: new Experimental_StdioMCPTransport({
    command: 'node',
    args: ['./mcp-server.js'],
  }),
});

const mcpTools = await mcp.tools();

const tools = guardTools(mcpTools, {
  policy: createSimplePolicy({ requireApprovalForRisk: ['write', 'admin'] }),
  audit: new ConsoleAuditSink(),
});

const result = streamText({ model, messages, tools });
```

MCP tool metadata (like risk levels) can be used by your policy to make decisions.

## API Reference

### guardTools(tools, options)

Wraps an AI SDK toolset with policy enforcement and audit logging.

**Parameters:**
- `tools`: Record<string, CoreTool> - AI SDK tool definitions
- `options`:
  - `policy`: GuardPolicy - Decision logic for tool classification
  - `ctx?`: GuardContext - Budget tracking (defaults created if omitted)
  - `audit?`: AuditSink - Event sink for structured logs
  - `timeoutMs?`: number - Per-tool execution timeout (default: 15000ms)
  - `redactor?`: Redactor - PII/secret removal before logging

**Returns:** Record<string, CoreTool> - Wrapped toolset with identical interface

### createSimplePolicy(options)

Constructs a policy from allowlist/denylist rules.

**Parameters:**
- `allowlist?`: string[] - Tools permitted (whitelist mode when present)
- `denylist?`: string[] - Tools always blocked
- `requireApprovalForRisk?`: Risk[] - Risk levels requiring approval

**Returns:** GuardPolicy

### createDefaultContext(requestId?)

Generates a guard context with default budget limits.

**Parameters:**
- `requestId?`: string - Request identifier (generated if omitted)

**Returns:** GuardContext with:
- `maxToolCalls`: 8
- `maxDurationMs`: 60000 (60 seconds)

### Audit Sinks

**InMemoryAuditSink**
- `emit(event)` - Store event in memory
- `getEvents()` - Retrieve all events
- `getEventsForRequest(requestId)` - Filter by request
- `clear()` - Empty the event store

**ConsoleAuditSink**
- `emit(event)` - Print JSON to console.log

**FileAuditSink(filePath)**
- `emit(event)` - Append JSONL line to file
- `close()` - Flush and close file stream

### Redactors

**createDefaultRedactor()**
Matches common patterns: API keys, bearer tokens, emails, SSNs, credit cards.

**createFieldRedactor(fields, replacement?)**
Removes specified field names from objects (case-insensitive).

**createRegexRedactor(patterns, replacement?)**
Redacts text matching custom regex patterns.

**composeRedactors(...redactors)**
Chains multiple redactors in sequence.

## Demo Application

The repository includes a working Next.js application demonstrating all features:

```bash
git clone https://github.com/KrxGu/ai-agent-guardrails
cd ai-agent-guardrails
pnpm install
pnpm build
echo "OPENAI_API_KEY=sk-..." > apps/demo-next/.env.local
pnpm -C apps/demo-next dev
```

Open http://localhost:3000 and test:

- "Search docs for AI SDK" (executes immediately)
- "Create an issue in vercel/next.js titled 'Test'" (requires approval)
- "Delete resource abc123" (blocked by policy)

The demo includes:
- Chat interface with approval UI
- MCP server with tools at different risk levels
- Live audit log display
- Budget enforcement

## How It Works

```
User Message
    |
    v
AI SDK streamText
    |
    v
guardTools() wrapper
    |-- Policy checks (allowlist/denylist/approval)
    |-- Budget enforcement (call count, duration)
    |-- Timeout handling
    |
    v
Tool execution (if permitted)
    |
    v
Audit log (redacted)
```

When a tool call is requested:

1. Policy evaluates the tool name and determines action (allow/deny/approval)
2. Budget is checked against limits (maxToolCalls, maxDurationMs)
3. If approval needed, execution pauses and UI receives approval request
4. If allowed, tool executes with timeout enforcement
5. All decisions and outcomes are logged to audit sink with redaction applied

## Security Model

### Threats Addressed

**Prompt Injection**: Policy denylists block forbidden tools regardless of model output. Approval gates add human review for sensitive operations.

**Budget Exhaustion**: Hard limits on tool calls and execution duration prevent runaway loops and slow tools from burning resources.

**Secret Exposure**: Redactors strip PII and credentials from audit logs before writing. Pattern matching catches API keys, tokens, emails, SSNs.

**Unauthorized Actions**: Approval gates pause execution before destructive operations (deletes, billing changes, external API calls).

### Known Limitations

- Model response text is not filtered (only tool execution is controlled)
- Approval happens client-side (attacker controlling UI could auto-approve)
- Budgets are per-request (high request volume requires upstream rate limiting)
- Redaction is pattern-based (novel secret formats may not be caught)
- No schema validation yet (tool arguments not validated against expected types)

## Future Work

- Schema validation with Zod
- Per-tool concurrency limits
- OpenTelemetry span export
- MCP schema fingerprinting to detect drift
- Vendoring mode for static tool generation
- React hooks for client-side policy management

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT

## Acknowledgments

Built with [Vercel AI SDK](https://sdk.vercel.ai) and [Model Context Protocol](https://modelcontextprotocol.io).
