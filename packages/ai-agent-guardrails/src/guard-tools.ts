import type { GuardToolsOptions, ToolLike, GuardContext } from './types.js';
import { createDefaultContext, withTimeout } from './utils.js';

/**
 * Wrap a toolset with guardrails enforcement
 *
 * This is the main entry point for the guardrails package. It wraps AI SDK tools
 * with policy enforcement, budget checks, timeouts, and audit logging.
 *
 * @example
 * ```ts
 * const tools = guardTools(mcpTools, {
 *   policy: createSimplePolicy({ requireApprovalForRisk: ['write', 'admin'] }),
 *   audit: new ConsoleAuditSink(),
 *   timeoutMs: 10_000,
 * });
 * ```
 */
export function guardTools<T extends Record<string, ToolLike>>(
  tools: T,
  opts: GuardToolsOptions
): T {
  const ctx = opts.ctx ?? createDefaultContext();
  const audit = opts.audit;
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const redactor = opts.redactor;

  const wrapped: Record<string, ToolLike> = {};

  for (const [toolName, tool] of Object.entries(tools)) {
    const originalExecute = tool.execute;

    // Set needsApproval based on policy decision
    const needsApproval =
      tool.needsApproval ??
      (async (input: unknown) => {
        try {
          const { risk, reason } = await opts.policy.classify(toolName, input);
          const decision = await opts.policy.decide({ toolName, input, ctx, risk, reason });

          return Boolean((decision as any).needsApproval);
        } catch (error) {
          // Fail closed: require approval on error
          return true;
        }
      });

    wrapped[toolName] = {
      ...tool,
      needsApproval,
      execute: originalExecute
        ? async (input: any) => {
            const timestamp = Date.now();

            // Redact input before logging if redactor is provided
            const redactedInput = redactor ? redactor.redact(input) : input;

            audit?.emit({
              type: 'tool_call_attempted',
              toolName,
              input: redactedInput,
              requestId: ctx.requestId,
              timestamp,
            });

            // Check tool call budget
            ctx.toolCalls += 1;
            if (ctx.toolCalls > ctx.maxToolCalls) {
              const reason = `Tool budget exceeded (maxToolCalls=${ctx.maxToolCalls})`;
              audit?.emit({
                type: 'budget_exceeded',
                reason,
                requestId: ctx.requestId,
                timestamp: Date.now(),
              });
              throw new Error(reason);
            }

            // Check elapsed time budget
            if (ctx.maxDurationMs) {
              const elapsed = Date.now() - ctx.startTime;
              if (elapsed > ctx.maxDurationMs) {
                const reason = `Time budget exceeded (maxDurationMs=${ctx.maxDurationMs})`;
                audit?.emit({
                  type: 'budget_exceeded',
                  reason,
                  requestId: ctx.requestId,
                  timestamp: Date.now(),
                });
                throw new Error(reason);
              }
            }

            // Classify and decide
            const { risk, reason } = await opts.policy.classify(toolName, input);
            const decision = await opts.policy.decide({ toolName, input, ctx, risk, reason });

            // Block if not allowed
            if (!decision.allow) {
              audit?.emit({
                type: 'tool_call_blocked',
                toolName,
                reason: decision.reason,
                requestId: ctx.requestId,
                timestamp: Date.now(),
              });
              throw new Error(`Tool call blocked: ${decision.reason}`);
            }

            // Log if approval is needed (AI SDK will handle the actual approval flow)
            if ((decision as any).needsApproval) {
              audit?.emit({
                type: 'tool_call_needs_approval',
                toolName,
                reason: (decision as any).reason ?? 'approval required',
                requestId: ctx.requestId,
                timestamp: Date.now(),
              });
            }

            // Execute with timeout
            const t0 = Date.now();
            try {
              const result = await withTimeout(originalExecute(input), timeoutMs);
              
              // Redact output if redactor is provided
              const redactedResult = redactor ? redactor.redact(result) : result;
              
              audit?.emit({
                type: 'tool_call_executed',
                toolName,
                durationMs: Date.now() - t0,
                requestId: ctx.requestId,
                timestamp: Date.now(),
              });
              
              return result; // Return original result, not redacted (redaction is for logging only)
            } catch (error: any) {
              if (error.message?.includes('timed out')) {
                audit?.emit({
                  type: 'tool_call_timeout',
                  toolName,
                  timeoutMs,
                  requestId: ctx.requestId,
                  timestamp: Date.now(),
                });
              }
              throw error;
            }
          }
        : undefined,
    };
  }

  return wrapped as T;
}
