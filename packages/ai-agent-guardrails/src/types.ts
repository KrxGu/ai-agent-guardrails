/**
 * Risk classification for tools
 */
export type Risk = 'read' | 'write' | 'admin';

/**
 * Decision outcome from policy evaluation
 */
export type GuardDecision =
  | { allow: true }
  | { allow: false; reason: string }
  | { allow: true; needsApproval: true; reason: string };

/**
 * Context passed through guard execution
 */
export type GuardContext = {
  requestId: string;
  toolCalls: number;
  maxToolCalls: number;
  startTime: number;
  maxDurationMs?: number;
};

/**
 * Tool-like interface that matches AI SDK tool structure
 */
export type ToolLike = {
  description?: string;
  inputSchema?: unknown;
  parameters?: unknown;
  needsApproval?: boolean | ((input: any) => boolean | Promise<boolean>);
  execute?: (input: any) => Promise<any>;
};

/**
 * Policy interface for classification and decision making
 */
export type GuardPolicy = {
  /**
   * Classify a tool call by risk level
   */
  classify: (
    toolName: string,
    input: unknown
  ) => Promise<{ risk: Risk; reason?: string }> | { risk: Risk; reason?: string };

  /**
   * Decide whether to allow, block, or require approval
   */
  decide: (args: {
    toolName: string;
    input: unknown;
    ctx: GuardContext;
    risk: Risk;
    reason?: string;
  }) => Promise<GuardDecision> | GuardDecision;
};

/**
 * Audit event types
 */
export type AuditEvent =
  | { type: 'tool_call_attempted'; toolName: string; input: unknown; requestId: string; timestamp: number }
  | { type: 'tool_call_blocked'; toolName: string; reason: string; requestId: string; timestamp: number }
  | {
      type: 'tool_call_needs_approval';
      toolName: string;
      reason: string;
      requestId: string;
      timestamp: number;
    }
  | {
      type: 'tool_call_executed';
      toolName: string;
      durationMs: number;
      requestId: string;
      timestamp: number;
    }
  | {
      type: 'tool_call_timeout';
      toolName: string;
      timeoutMs: number;
      requestId: string;
      timestamp: number;
    }
  | {
      type: 'budget_exceeded';
      reason: string;
      requestId: string;
      timestamp: number;
    };

/**
 * Audit sink interface for logging events
 */
export type AuditSink = {
  emit: (event: AuditEvent) => void | Promise<void>;
};

/**
 * Options for guardTools wrapper
 */
export type GuardToolsOptions = {
  policy: GuardPolicy;
  ctx?: GuardContext;
  audit?: AuditSink;
  timeoutMs?: number;
  redactor?: Redactor;
};

/**
 * Redactor interface for PII/secret removal
 */
export type Redactor = {
  redact: (value: unknown) => unknown;
};
