# Vercel Ecosystem Integration Guide

This document outlines how to get **Agent Guardrails** officially visible in Vercel's ecosystem.

---

## Deliverable A: PR to AI SDK Docs (Community Middleware Listing)

### Goal
Add Agent Guardrails to the AI SDK documentation as a recommended community middleware for production agent deployments.

### Target Repository
`vercel/ai` - https://github.com/vercel/ai

### Target File
Likely location: `docs/content/docs/ai-sdk-core/middleware.mdx` or similar community middleware section.

### Proposed Addition

```markdown
### Agent Guardrails

Production-grade tool firewall for AI agents with approval gates, budgets, and audit logging.

**Features:**
- Policy-based tool allowlists and denylists
- Human approval gates for high-risk operations
- Budget enforcement (max tool calls, time limits, per-tool timeouts)
- Automatic redaction of secrets and PII in logs
- Structured audit events compatible with OpenTelemetry

**Installation:**

\`\`\`bash
pnpm add ai-agent-guardrails
\`\`\`

**Example:**

\`\`\`typescript
import { guardTools, createSimplePolicy } from 'ai-agent-guardrails';

const policy = createSimplePolicy({
  denylist: ['delete_database'],
  requireApprovalForRisk: ['write', 'admin'],
});

const tools = guardTools(mcpTools, {
  policy,
  audit: new ConsoleAuditSink(),
  timeoutMs: 10_000,
});

const result = streamText({
  model: openai('gpt-4o-mini'),
  messages,
  tools, // Use guarded tools
});
\`\`\`

**Links:**
- [GitHub](https://github.com/yourusername/agent-guardrails-mcp)
- [npm](https://www.npmjs.com/package/ai-agent-guardrails)
- [Demo](https://agent-guardrails-demo.vercel.app)

**⚠️ Important:** Always use allowlists in production. Test approval flows thoroughly before deploying.
```

---

## Deliverable B: PR to AI SDK Examples Repository

### Goal
Add a complete example application showcasing secure agent deployment with guardrails.

### Target Repository
`vercel/ai` - https://github.com/vercel/ai/tree/main/examples

### Proposed Example Structure

```
examples/
  next-agent-guardrails/
    app/
      api/
        chat/
          route.ts          # API route with guardrails
      page.tsx              # Chat UI with approval flow
    package.json
    README.md
    .env.example
```

### Example README.md Template

```markdown
# Secure Agent with Approval Guardrails

This example demonstrates a production-ready AI agent with:

- ✅ Tool execution approval gates
- ✅ Budget enforcement (max tool calls, timeouts)
- ✅ Audit logging
- ✅ Secret redaction
- ✅ MCP tool integration

## Features

### 1. Policy-Based Tool Control

Tools are classified by risk level:
- **Read**: Safe, no approval needed
- **Write**: Requires user approval
- **Admin**: Blocked or requires approval

### 2. Human-in-the-Loop Approval

The UI shows an approval card when a tool requires confirmation:

[Screenshot: Approval UI]

### 3. Audit Logging

Every tool call is logged with structured events:

\`\`\`json
{
  "type": "tool_call_executed",
  "toolName": "create_issue",
  "durationMs": 245,
  "requestId": "req_abc123",
  "timestamp": 1704412800000
}
\`\`\`

## Setup

1. Install dependencies:

\`\`\`bash
pnpm install
\`\`\`

2. Set your OpenAI API key:

\`\`\`bash
cp .env.example .env.local
# Add OPENAI_API_KEY=sk-...
\`\`\`

3. Run the development server:

\`\`\`bash
pnpm dev
\`\`\`

4. Open http://localhost:3000

## Try It Out

**Safe prompt (no approval):**
> "Search docs for AI SDK"

**Requires approval:**
> "Create an issue in vercel/next.js titled 'Test guardrails'"

**Blocked:**
> "Delete resource abc123"

## Key Files

- `app/api/chat/route.ts` - Guardrails setup and policy
- `app/page.tsx` - Approval UI with `addToolApprovalResponse`
- `ai-agent-guardrails` - Core middleware package

## Production Deployment

### Vercel

Deploy with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vercel/ai/tree/main/examples/next-agent-guardrails)

### Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key

### Security Checklist

- [ ] Use allowlists for tools in production
- [ ] Set conservative budgets (`maxToolCalls`, `maxDurationMs`)
- [ ] Enable audit logging and export to SIEM
- [ ] Review approval flows regularly
- [ ] Test prompt injection scenarios

## Learn More

- [AI SDK Documentation](https://sdk.vercel.ai)
- [Agent Guardrails GitHub](https://github.com/KrxGu/ai-agent-guardrails)
- [Threat Model](https://github.com/KrxGu/ai-agent-guardrails/blob/main/docs/THREAT_MODEL.md)
```

---

## What Makes These PRs Acceptable

### ✅ Minimal Surface Area
- No new dependencies in core AI SDK
- Optional middleware, doesn't affect existing functionality
- Self-contained example

### ✅ Stable APIs Only
- Uses public AI SDK APIs (`streamText`, `tools`, `needsApproval`)
- Uses documented MCP integration (`@ai-sdk/mcp`)
- No private or experimental APIs (except `Experimental_StdioMCPTransport` which is documented)

### ✅ No Vercel Internal Infrastructure
- Runs on any Node.js hosting
- No Vercel-specific features required
- Works with any AI SDK provider (OpenAI, Anthropic, etc.)

---

## Pre-PR Checklist

Before submitting, ensure:

- [ ] Package published to npm
- [ ] Demo deployed to Vercel
- [ ] README includes clear examples
- [ ] Threat model documented
- [ ] Tests pass (if applicable)
- [ ] No breaking changes to AI SDK
- [ ] Compatible with latest AI SDK version
- [ ] License is MIT or compatible

---

## Submission Process

### Step 1: Prepare Package

1. Publish to npm:
   ```bash
   cd packages/ai-agent-guardrails
   npm publish --access public
   ```

2. Deploy demo:
   ```bash
   vercel --prod
   ```

3. Add badges to README:
   ```markdown
   [![npm version](https://img.shields.io/npm/v/ai-agent-guardrails.svg)](https://www.npmjs.com/package/ai-agent-guardrails)
   [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
   ```

### Step 2: Fork and Branch

```bash
git clone https://github.com/vercel/ai
cd ai
git checkout -b add-agent-guardrails-middleware
```

### Step 3: Make Changes

**For docs PR:**
- Add middleware section to docs
- Include code examples
- Add links to npm and demo

**For examples PR:**
- Copy example to `examples/next-agent-guardrails/`
- Ensure it builds and runs
- Add screenshot to README

### Step 4: Test

```bash
# For docs
pnpm build

# For example
cd examples/next-agent-guardrails
pnpm install
pnpm build
pnpm dev # Test locally
```

### Step 5: Commit and Push

```bash
git add .
git commit -m "docs: add agent guardrails community middleware"
# or
git commit -m "examples: add secure agent with approval guardrails"

git push origin add-agent-guardrails-middleware
```

### Step 6: Open PR

**Title:**
- Docs: `docs: add agent guardrails community middleware`
- Example: `examples: add secure agent with approval guardrails`

**Description Template:**

```markdown
## What

Adds [Agent Guardrails](https://github.com/KrxGu/ai-agent-guardrails) to:
- [ ] Community middleware documentation
- [ ] Example applications

## Why

Production AI agents need:
1. Policy enforcement (allowlists, denylists)
2. Approval gates for high-risk operations
3. Budget controls (cost, time, call limits)
4. Audit logging for compliance

This middleware solves the "CTO problem" of shipping agents safely.

## Demo

[Live Demo](https://agent-guardrails-demo.vercel.app)

## Testing

- [x] Example builds successfully
- [x] All features work as documented
- [x] No breaking changes to AI SDK
- [x] Works with latest AI SDK version

## Related

- npm: https://www.npmjs.com/package/ai-agent-guardrails
- GitHub: https://github.com/KrxGu/ai-agent-guardrails
- Threat Model: [THREAT_MODEL.md](link)
```

---

## Timeline

1. **Week 1:** Finish core features, tests, docs
2. **Week 2:** Publish to npm, deploy demo, gather feedback
3. **Week 3:** Submit docs PR to vercel/ai
4. **Week 4:** Submit examples PR (if docs PR is well-received)

---

## Success Metrics

- [ ] PR merged into vercel/ai
- [ ] Listed in AI SDK docs
- [ ] Featured in Vercel blog or newsletter
- [ ] Used in production by at least 3 companies
- [ ] 100+ npm downloads/week
- [ ] 50+ GitHub stars

---

## Support & Maintenance

### Responding to PR Feedback

- Address all reviewer comments within 48 hours
- Keep changes minimal and focused
- Add tests if requested
- Update docs based on feedback

### Post-Merge Maintenance

- Monitor GitHub issues
- Release bug fixes promptly
- Keep AI SDK compatibility up to date
- Add community-requested features

---

## Contact

If you have questions about the submission process:

- AI SDK Discord: https://discord.gg/vercel
- Twitter: [@vercel](https://twitter.com/vercel)
- GitHub Discussions: https://github.com/vercel/ai/discussions

---

**Document Version:** 1.0  
**Last Updated:** January 4, 2026
