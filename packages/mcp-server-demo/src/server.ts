#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// IMPORTANT: Never use stdout for logs in stdio servers. Use stderr only.
const log = (...args: any[]) => console.error('[mcp-server-demo]', ...args);

const server = new McpServer({
  name: 'mcp-server-demo',
  version: '0.0.1',
});

// Tool 1: Search docs (read-only, safe)
server.registerTool(
  'search_docs',
  {
    title: 'Search Documentation',
    description: 'Search a small in-memory documentation set and return matching snippets.',
    inputSchema: {
      query: z.string().min(1).describe('Search query string'),
    },
  },
  async ({ query }) => {
    log('search_docs called with query:', query);
    
    const docs = [
      { id: '1', text: 'Vercel AI SDK supports tool calling and MCP tool adapters.' },
      { id: '2', text: 'Approval is required for destructive operations like delete, write, billing.' },
      { id: '3', text: 'Guardrails can wrap tools and enforce budgets, timeouts, and auditing.' },
      { id: '4', text: 'MCP servers enable dynamic tool discovery and execution.' },
      { id: '5', text: 'Production deployments should use HTTP transport instead of stdio.' },
    ];
    
    const hits = docs.filter(d => d.text.toLowerCase().includes(query.toLowerCase()));
    const text = hits.length
      ? hits.map(h => `[${h.id}] ${h.text}`).join('\n\n')
      : 'No matches found for your query.';
    
    return { content: [{ type: 'text', text }] };
  }
);

// Tool 2: Create issue (write operation, requires approval)
server.registerTool(
  'create_issue',
  {
    title: 'Create Issue',
    description: 'Simulate creating an issue in a repository (write action). Returns a fake issue ID.',
    inputSchema: {
      repo: z.string().min(1).describe('Repository name (e.g., vercel/next.js)'),
      title: z.string().min(1).describe('Issue title'),
      body: z.string().min(1).describe('Issue body/description'),
    },
  },
  async ({ repo, title, body }) => {
    log('create_issue called:', { repo, title, body: body.substring(0, 50) + '...' });
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const issueId = `ISSUE-${Date.now()}`;
    const text = `✓ Created issue ${issueId} in ${repo}\n\nTitle: ${title}\nBody: ${body}`;
    
    return { content: [{ type: 'text', text }] };
  }
);

// Tool 3: Delete resource (admin operation, should be blocked in prod)
server.registerTool(
  'delete_resource',
  {
    title: 'Delete Resource',
    description: 'Delete a resource (destructive admin operation). Use with extreme caution.',
    inputSchema: {
      resourceId: z.string().min(1).describe('Resource ID to delete'),
      confirmDelete: z.boolean().describe('Must be true to confirm deletion'),
    },
  },
  async ({ resourceId, confirmDelete }) => {
    log('delete_resource called:', { resourceId, confirmDelete });
    
    if (!confirmDelete) {
      throw new Error('Deletion not confirmed. Set confirmDelete to true.');
    }
    
    // Simulate destructive operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const text = `⚠️  Deleted resource: ${resourceId}\n\nThis is a destructive operation that cannot be undone.`;
    
    return { content: [{ type: 'text', text }] };
  }
);

// Tool 4: Send email (write operation)
server.registerTool(
  'send_email',
  {
    title: 'Send Email',
    description: 'Send an email to a recipient (write action, requires approval).',
    inputSchema: {
      to: z.string().email().describe('Recipient email address'),
      subject: z.string().min(1).describe('Email subject'),
      body: z.string().min(1).describe('Email body'),
    },
  },
  async ({ to, subject, body }) => {
    log('send_email called:', { to, subject });
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const text = `✓ Email sent successfully!\n\nTo: ${to}\nSubject: ${subject}\nBody: ${body}`;
    
    return { content: [{ type: 'text', text }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log('MCP server connected via stdio transport');
}

main().catch(err => {
  console.error('[mcp-server-demo] Fatal error:', err);
  process.exit(1);
});
