# 🚀 Quick Setup Guide

Get the demo running in **5 minutes**!

---

## Prerequisites

- Node.js 20+
- pnpm 10+
- OpenAI API key

---

## Step 1: Clone or Navigate

```bash
cd /Users/krishgupta/Desktop/Temp_Work/Packages/ai-agent-guardrails
```

---

## Step 2: Install Dependencies

```bash
pnpm install
```

This installs all workspace dependencies.

---

## Step 3: Build Packages

```bash
# Build guardrails package
pnpm -C packages/ai-agent-guardrails build

# Build MCP server
pnpm -C packages/mcp-server-demo build
```

**Expected output:**
```
✓ ESM Build success
✓ DTS Build success
```

---

## Step 4: Add OpenAI API Key

```bash
cd apps/demo-next
echo "OPENAI_API_KEY=sk-your-key-here" > .env.local
```

**Or manually edit:**
```bash
nano apps/demo-next/.env.local
```

Add:
```
OPENAI_API_KEY=sk-proj-...
```

---

## Step 5: Start Dev Server

```bash
pnpm -C apps/demo-next dev
```

**Expected output:**
```
▲ Next.js 16.1.1
- Local:        http://localhost:3000
```

---

## Step 6: Test the Demo

Open http://localhost:3000 in your browser.

### Test Prompts

**1. Safe (no approval):**
```
Search docs for AI SDK
```
✅ Should execute immediately and return results.

---

**2. Write operation (requires approval):**
```
Create an issue in vercel/next.js titled "Test guardrails" with body "This is a test"
```
⚠️ Should show an approval card with Approve/Deny buttons.

---

**3. Blocked operation:**
```
Delete resource abc123
```
❌ Should be blocked immediately with error message.

---

**4. Budget exhaustion:**
```
Keep calling search_docs 20 times
```
🚫 Should stop after 8 tool calls (default `maxToolCalls`).

---

## Troubleshooting

### Error: "Cannot find module 'ai-agent-guardrails'"

**Solution:** Build the guardrails package:
```bash
pnpm -C packages/ai-agent-guardrails build
```

---

### Error: "Cannot connect to MCP server"

**Solution:** Build the MCP server:
```bash
pnpm -C packages/mcp-server-demo build
```

Verify the server exists:
```bash
ls packages/mcp-server-demo/dist/server.js
```

---

### Error: "OPENAI_API_KEY is not set"

**Solution:** Check your `.env.local` file:
```bash
cat apps/demo-next/.env.local
```

Should contain:
```
OPENAI_API_KEY=sk-...
```

---

### Port 3000 already in use

**Solution:** Kill the process or use a different port:
```bash
pnpm -C apps/demo-next dev -- --port 3001
```

---

## Verify Installation

### Check Build Output

```bash
# Guardrails package
ls packages/ai-agent-guardrails/dist/
# Should see: index.js, index.d.ts, index.js.map

# MCP server
ls packages/mcp-server-demo/dist/
# Should see: server.js, server.js.map
```

---

### Check Console Output

When you send a message, you should see audit logs in the terminal:

```
[audit] {
  "type": "tool_call_attempted",
  "toolName": "search_docs",
  "input": { "query": "AI SDK" },
  "requestId": "req_abc123",
  "timestamp": 1704412800000
}

[audit] {
  "type": "tool_call_executed",
  "toolName": "search_docs",
  "durationMs": 245,
  "requestId": "req_abc123",
  "timestamp": 1704412800245
}
```

---

## Next Steps

Once the demo is working:

1. **Experiment with policies:**
   - Edit `apps/demo-next/app/api/chat/route.ts`
   - Change `denylist`, `allowlist`, or `requireApprovalForRisk`
   - Restart dev server to see changes

2. **Try custom tools:**
   - Add new tools to `packages/mcp-server-demo/src/server.ts`
   - Rebuild: `pnpm -C packages/mcp-server-demo build`

3. **Test redaction:**
   - Add `redactor` option in route.ts
   - Send a message with "sk-test-key-123"
   - Check console logs (should be `[REDACTED]`)

4. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm build` | Build all packages |
| `pnpm -C packages/ai-agent-guardrails build` | Build guardrails only |
| `pnpm -C packages/mcp-server-demo build` | Build MCP server only |
| `pnpm -C apps/demo-next dev` | Start demo app |
| `pnpm -C apps/demo-next build` | Production build |

---

## File Locations

| File | Purpose |
|------|---------|
| `apps/demo-next/.env.local` | OpenAI API key |
| `apps/demo-next/app/api/chat/route.ts` | Guardrails policy and config |
| `apps/demo-next/app/page.tsx` | UI with approval buttons |
| `packages/ai-agent-guardrails/src/` | Core middleware code |
| `packages/mcp-server-demo/src/server.ts` | MCP tools |

---

## Getting Help

- **GitHub Issues:** https://github.com/KrxGu/ai-agent-guardrails/issues
- **Documentation:** [README.md](README.md)
- **Threat Model:** [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md)

---

**Happy coding! 🎉**
