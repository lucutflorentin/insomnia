/**
 * Safe logging utilities — strip PII before forwarding to console / Sentry.
 *
 * Use logSafe(error, context) in catch blocks instead of console.error to avoid
 * leaking emails, phone numbers, passwords, or tokens into logs.
 */

const PII_KEY_PATTERN = /(password|passwordHash|token|secret|apiKey|email|phone|p256dh|auth)/i;
const REDACTED = '[REDACTED]';

function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[Truncated]';
  if (value == null) return value;
  if (typeof value === 'string') return value.length > 500 ? value.slice(0, 500) + '...' : value;
  if (typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((v) => redactValue(v, depth + 1));
  }

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (PII_KEY_PATTERN.test(key)) {
      out[key] = REDACTED;
    } else {
      out[key] = redactValue(val, depth + 1);
    }
  }
  return out;
}

function summarizeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message.replace(/[\w.-]+@[\w.-]+/g, '[EMAIL]'),
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    };
  }
  return { value: redactValue(error) };
}

/**
 * Safely log an error with optional context. PII keys are redacted.
 * Defaults to console.error; integrate with Sentry by adding a side effect.
 */
export function logSafe(scope: string, error: unknown, context?: Record<string, unknown>): void {
  const payload = {
    scope,
    error: summarizeError(error),
    ...(context ? { context: redactValue(context) as Record<string, unknown> } : {}),
  };
  console.error(`[${scope}]`, payload);
}
