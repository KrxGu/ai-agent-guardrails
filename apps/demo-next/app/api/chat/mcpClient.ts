import { createMCPClient } from '@ai-sdk/mcp';
import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';
import path from 'node:path';

declare global {
  // eslint-disable-next-line no-var
  var __mcpClientPromise: ReturnType<typeof createMCPClient> | undefined;
}

/**
 * Get or create a singleton MCP client connected to our demo server via stdio
 */
export async function getMcpClient() {
  if (!globalThis.__mcpClientPromise) {
    // Path to the built MCP server
    const serverPath = path.resolve(
      process.cwd(),
      '..',
      '..',
      'packages',
      'mcp-server-demo',
      'dist',
      'server.js'
    );

    console.log('[mcpClient] Connecting to MCP server at:', serverPath);

    globalThis.__mcpClientPromise = createMCPClient({
      transport: new Experimental_StdioMCPTransport({
        command: 'node',
        args: [serverPath],
      }),
    });
  }
  return globalThis.__mcpClientPromise;
}
