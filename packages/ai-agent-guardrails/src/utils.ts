import type { GuardContext } from './types.js';

/**
 * Generate a unique request ID
 */
function cryptoRandomId(): string {
  // Use crypto.randomUUID() in Node 20+ and modern browsers
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `req_${Math.random().toString(16).slice(2)}`;
}

/**
 * Create a default guard context with budget limits
 */
export function createDefaultContext(requestId?: string): GuardContext {
  return {
    requestId: requestId ?? cryptoRandomId(),
    toolCalls: 0,
    maxToolCalls: 8,
    startTime: Date.now(),
    maxDurationMs: 60_000, // 60 seconds default
  };
}

/**
 * Wrap a promise with a timeout
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);

    promise
      .then(value => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}
