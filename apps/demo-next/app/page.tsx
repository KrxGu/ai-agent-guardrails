'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';

export default function Home() {
  const [input, setInput] = useState('');
  
  const { messages, sendMessage, status, addToolResult } = useChat();

  const isLoading = status === 'streaming' || status === 'submitted';

  // Handle tool approval - execute the tool and provide result
  const handleApprove = async (toolCallId: string, toolName: string, args: any) => {
    let result: any;
    switch (toolName) {
      case 'create_issue':
        result = {
          success: true,
          issueId: `ISSUE-${Date.now()}`,
          url: `https://github.com/${args?.repo}/issues/999`,
          message: `Created issue "${args?.title}" in ${args?.repo}`
        };
        break;
      case 'send_email':
        result = {
          success: true,
          messageId: `MSG-${Date.now()}`,
          message: `Email sent to ${args?.to}`
        };
        break;
      default:
        result = { success: true, message: `Tool ${toolName} executed successfully` };
    }
    
    try {
      await addToolResult({ toolCallId, tool: toolName, output: result });
    } catch (err) {
      console.error('Error adding tool result:', err);
    }
  };

  const handleDeny = async (toolCallId: string, toolName: string) => {
    console.log('[handleDeny] Denying tool:', toolName, 'id:', toolCallId);
    
    try {
      await addToolResult({ 
        toolCallId,
        tool: toolName, 
        output: { 
          success: false, 
          error: 'Tool execution denied by user',
          message: `User denied execution of ${toolName}`
        } 
      });
      console.log('[handleDeny] Denial result added');
    } catch (err) {
      console.error('[handleDeny] Error:', err);
    }
  };

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput('');
    await sendMessage({ role: 'user', parts: [{ type: 'text', text: message }] } as any);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl p-6 space-y-6">
        <header className="border-b border-neutral-800 pb-4">
          <h1 className="text-xl font-semibold text-white">Agent Guardrails for AI SDK + MCP</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Production-grade tool firewall with approval gates, budgets, and audit logging
          </p>
        </header>

        <div className="space-y-4 min-h-[500px] pb-24">
          {messages.length === 0 && (
            <div className="text-center text-neutral-500 py-16">
              <p className="mb-6 text-neutral-300">Try these prompts:</p>
              <div className="space-y-3 text-sm">
                <button 
                  className="block w-full max-w-md mx-auto text-left px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition-colors"
                  onClick={() => setInput('Search docs for AI SDK')}
                >
                  Search docs for AI SDK
                </button>
                <button 
                  className="block w-full max-w-md mx-auto text-left px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition-colors"
                  onClick={() => setInput("Create an issue in vercel/next.js titled 'Test guardrails'")}
                >
                  Create an issue in vercel/next.js
                </button>
                <button 
                  className="block w-full max-w-md mx-auto text-left px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition-colors"
                  onClick={() => setInput('Send an email to test@example.com')}
                >
                  Send an email to test@example.com
                </button>
                <button 
                  className="block w-full max-w-md mx-auto text-left px-4 py-3 rounded-lg bg-neutral-900 border border-red-900/50 hover:border-red-600 transition-colors text-red-400"
                  onClick={() => setInput('Delete resource abc123')}
                >
                  Delete resource abc123 <span className="text-red-500 text-xs">(blocked)</span>
                </button>
              </div>
            </div>
          )}

          {messages.map((m: any) => (
            <div key={m.id} className="space-y-2">
              {/* Role label */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-emerald-600 text-white'
                }`}>
                  {m.role === 'user' ? 'You' : 'Assistant'}
                </span>
              </div>

              {/* Message content */}
              <div className={`rounded-lg p-4 ${
                m.role === 'user' 
                  ? 'bg-neutral-900 border border-neutral-800' 
                  : 'bg-neutral-900/50 border border-neutral-800'
              }`}>
                {/* User messages have content string */}
                {m.content && typeof m.content === 'string' && (
                  <p className="text-neutral-100 whitespace-pre-wrap">{m.content}</p>
                )}

                {/* Assistant messages have parts array */}
                {m.parts && m.parts.map((part: any, idx: number) => {
                  // Text part
                  if (part.type === 'text') {
                    return (
                      <p key={idx} className="text-neutral-100 whitespace-pre-wrap">
                        {part.text}
                      </p>
                    );
                  }

                  // Step start (ignore)
                  if (part.type === 'step-start') {
                    return null;
                  }

                  // Tool invocation (handles both 'tool-*' and 'dynamic-tool' types)
                  if ((part.type && part.type.startsWith('tool-')) || part.type === 'dynamic-tool') {
                    const toolName = part.toolName || part.type?.replace('tool-', '') || 'unknown';
                    const toolCallId = part.toolCallId || `tool-${idx}`;

                    // Approval required
                    if (part.state === 'approval-requested') {
                      return (
                        <div key={toolCallId} className="mt-4 rounded-lg bg-amber-950/50 border border-amber-600/50 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-amber-400">⚠️</span>
                            <span className="font-semibold text-amber-300">Approval Required</span>
                          </div>
                          <div className="mb-3">
                            <span className="text-neutral-400 text-sm">Tool: </span>
                            <code className="text-amber-300 bg-amber-950 px-2 py-1 rounded text-sm">{toolName}</code>
                          </div>
                          <pre className="text-sm bg-black/50 p-3 rounded-lg overflow-auto text-amber-100 mb-4">
{JSON.stringify(part.args || part.input, null, 2)}
                          </pre>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              className="flex-1 rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-500 transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleApprove(toolCallId, toolName, part.args || part.input);
                              }}
                            >
                              ✓ Approve
                            </button>
                            <button
                              type="button"
                              className="flex-1 rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-500 transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeny(toolCallId, toolName);
                              }}
                            >
                              ✗ Deny
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Tool completed
                    if (part.state === 'output-available' || part.output || part.result) {
                      const rawOutput = part.output || part.result;
                      
                      // Extract text from MCP content format if present
                      let displayOutput: string;
                      if (rawOutput?.content && Array.isArray(rawOutput.content)) {
                        displayOutput = rawOutput.content
                          .filter((c: any) => c.type === 'text')
                          .map((c: any) => c.text)
                          .join('\n');
                      } else if (typeof rawOutput === 'string') {
                        displayOutput = rawOutput;
                      } else if (rawOutput) {
                        displayOutput = JSON.stringify(rawOutput, null, 2);
                      } else {
                        // State is output-available but no output yet - show success
                        displayOutput = '✓ Tool executed successfully (approved by user)';
                      }
                      return (
                        <div key={toolCallId} className="mt-4 rounded-lg bg-emerald-950/30 border border-emerald-700/50 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-emerald-400">✓</span>
                            <span className="font-medium text-emerald-300">Tool: {toolName}</span>
                          </div>
                          {(part.args || part.input) && (
                            <details className="mb-3">
                              <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300">
                                Show input
                              </summary>
                              <pre className="mt-2 text-xs bg-black/50 p-2 rounded text-neutral-400 overflow-auto">
{JSON.stringify(part.args || part.input, null, 2)}
                              </pre>
                            </details>
                          )}
                          <div className="bg-black/50 p-3 rounded-lg">
                            <p className="text-xs text-emerald-500 mb-2">Output:</p>
                            <pre className="text-sm text-emerald-100 overflow-auto whitespace-pre-wrap">
{displayOutput}
                            </pre>
                          </div>
                        </div>
                      );
                    }

                    // Tool in progress
                    return (
                      <div key={toolCallId} className="mt-4 rounded-lg bg-neutral-800/50 border border-neutral-700 p-4">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                          <span className="text-neutral-300">Calling {toolName}...</span>
                        </div>
                      </div>
                    );
                  }

                  // Fallback: show raw JSON (for debugging)
                  return (
                    <pre key={idx} className="mt-2 text-xs bg-neutral-800 p-3 rounded-lg overflow-auto text-neutral-300">
{JSON.stringify(part, null, 2)}
                    </pre>
                  );
                })}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-neutral-400 bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
              <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
              <span>Thinking...</span>
            </div>
          )}
        </div>

        {/* Fixed input at bottom */}
        <form onSubmit={onFormSubmit} className="fixed bottom-0 left-0 right-0 bg-black border-t border-neutral-800 p-4">
          <div className="mx-auto max-w-3xl flex gap-3">
            <input
              className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-lg bg-white text-black px-6 py-3 font-medium hover:bg-neutral-200 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
