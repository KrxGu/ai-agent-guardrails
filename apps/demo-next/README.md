# Agent Guardrails Demo

Next.js application demonstrating secure AI agent deployment with policy enforcement and approval gates.

## Features

- Policy-based tool control (allowlist/denylist/approval)
- Human-in-the-loop approval flow
- Budget enforcement (call limits, timeouts)
- Audit logging to console
- MCP tool integration

## Setup

Install dependencies:

```bash
pnpm install
```

Add OpenAI API key:

```bash
echo "OPENAI_API_KEY=sk-your-key" > .env.local
```

Run development server:

```bash
pnpm dev
```

Open http://localhost:3000

## Test Prompts

**Safe (no approval):**
```
Search docs for AI SDK
```

**Requires approval:**
```
Create an issue in vercel/next.js titled "Test"
```

**Blocked:**
```
Delete resource abc123
```

## Implementation

Key files:
- [app/api/chat/route.ts](app/api/chat/route.ts) - Guardrails configuration
- [app/page.tsx](app/page.tsx) - Approval UI
- [app/api/chat/mcpClient.ts](app/api/chat/mcpClient.ts) - MCP client

Uses published npm package: `ai-agent-guardrails@0.0.1`

## Deploy

Deploy to Vercel:

```bash
vercel --prod
```

Add OPENAI_API_KEY environment variable in Vercel dashboard.
