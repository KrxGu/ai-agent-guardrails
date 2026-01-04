// Types
export type {
  Risk,
  GuardDecision,
  GuardContext,
  GuardPolicy,
  AuditEvent,
  AuditSink,
  GuardToolsOptions,
  ToolLike,
  Redactor,
} from './types.js';

// Core functions
export { guardTools } from './guard-tools.js';
export { createDefaultContext, withTimeout } from './utils.js';

// Policy utilities
export { createSimplePolicy, PolicyBuilder } from './policy.js';

// Audit sinks
export { InMemoryAuditSink, ConsoleAuditSink, FileAuditSink } from './audit.js';

// Redaction utilities
export {
  createRegexRedactor,
  createDefaultRedactor,
  createFieldRedactor,
  composeRedactors,
} from './redaction.js';
