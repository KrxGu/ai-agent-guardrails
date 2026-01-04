import type { Redactor } from './types.js';

/**
 * Default patterns for secret detection
 */
const DEFAULT_SECRET_PATTERNS = [
  /\b(sk-[a-zA-Z0-9]{48})\b/g, // OpenAI API keys
  /\b(sk_live_[a-zA-Z0-9]{24,})\b/g, // Stripe live keys
  /\b(sk_test_[a-zA-Z0-9]{24,})\b/g, // Stripe test keys
  /\b([a-zA-Z0-9_-]{40})\b/g, // GitHub tokens (40 chars)
  /\b(ghp_[a-zA-Z0-9]{36})\b/g, // GitHub personal access tokens
  /\b(gho_[a-zA-Z0-9]{36})\b/g, // GitHub OAuth tokens
  /\b(AKIA[0-9A-Z]{16})\b/g, // AWS access keys
  /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g, // Private keys
  /\b([a-zA-Z0-9_-]{32,})\b/g, // Generic long tokens
];

/**
 * Default patterns for PII detection
 */
const DEFAULT_PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b\d{16}\b/g, // Credit card numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
];

/**
 * Create a regex-based redactor
 */
export function createRegexRedactor(patterns: RegExp[], replacement = '[REDACTED]'): Redactor {
  return {
    redact(value: unknown): unknown {
      if (typeof value === 'string') {
        let redacted = value;
        for (const pattern of patterns) {
          redacted = redacted.replace(pattern, replacement);
        }
        return redacted;
      }

      if (Array.isArray(value)) {
        return value.map(item => this.redact(item));
      }

      if (value && typeof value === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
          result[key] = this.redact(val);
        }
        return result;
      }

      return value;
    },
  };
}

/**
 * Create a default redactor with common secret and PII patterns
 */
export function createDefaultRedactor(): Redactor {
  return createRegexRedactor([...DEFAULT_SECRET_PATTERNS, ...DEFAULT_PII_PATTERNS]);
}

/**
 * Field-based redactor that redacts specific fields
 */
export function createFieldRedactor(fieldsToRedact: string[], replacement = '[REDACTED]'): Redactor {
  const fieldSet = new Set(fieldsToRedact.map(f => f.toLowerCase()));

  return {
    redact(value: unknown): unknown {
      if (Array.isArray(value)) {
        return value.map(item => this.redact(item));
      }

      if (value && typeof value === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
          if (fieldSet.has(key.toLowerCase())) {
            result[key] = replacement;
          } else {
            result[key] = this.redact(val);
          }
        }
        return result;
      }

      return value;
    },
  };
}

/**
 * Composite redactor that chains multiple redactors
 */
export function composeRedactors(...redactors: Redactor[]): Redactor {
  return {
    redact(value: unknown): unknown {
      let result = value;
      for (const redactor of redactors) {
        result = redactor.redact(result);
      }
      return result;
    },
  };
}
