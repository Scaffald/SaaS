import type { Event } from "@sentry/types";
import * as Sentry from "@sentry/deno";
import { TRPCError } from "@trpc/server";

const APP_ENV = Deno.env.get("APP_ENV") ?? "development";
const SENTRY_DSN = Deno.env.get("SENTRY_DENO_DSN");
const SENTRY_RELEASE =
  Deno.env.get("SENTRY_RELEASE") ?? Deno.env.get("RELEASE_VERSION") ?? undefined;
const TRACES_SAMPLE_RATE = 0.25;
const SLOW_OPERATION_THRESHOLD_MS = 2000;

type SeverityLevel =
  | "fatal"
  | "error"
  | "warning"
  | "log"
  | "info"
  | "debug"
  | "critical";

interface TrpcErrorContext {
  procedure: string;
  input?: unknown;
  userId?: string;
  userEmail?: string;
}

const SENSITIVE_KEY_FRAGMENTS = [
  "password",
  "token",
  "secret",
  "apikey",
  "api_key",
  "access",
  "refresh",
  "authorization",
  "auth",
  "creditcard",
  "card",
];

let initialized = false;

const isSentryEnabled = () => {
  return initialized && Boolean(Sentry.getCurrentHub().getClient());
};

const tagSlowOperations = (event: Event) => {
  const duration = event.contexts?.trace?.duration;
  if (typeof duration === "number" && duration > SLOW_OPERATION_THRESHOLD_MS) {
    event.tags = {
      ...event.tags,
      slow_operation: "true",
    };
  }
  return event;
};

const scrubSensitiveData = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubSensitiveData(item));
  }

  if (typeof value !== "object") {
    return value;
  }

  const entries = Object.entries(
    value as Record<string, unknown>,
  ).map(([key, item]) => {
    const lowerKey = key.toLowerCase();
    const containsSensitiveFragment = SENSITIVE_KEY_FRAGMENTS.some((fragment) =>
      lowerKey.includes(fragment)
    );

    if (containsSensitiveFragment) {
      return [key, "[REDACTED]"] as const;
    }

    return [key, scrubSensitiveData(item)] as const;
  });

  return Object.fromEntries(entries);
};

const getTrpcErrorSeverity = (code: TRPCError["code"]): SeverityLevel => {
  switch (code) {
    case "INTERNAL_SERVER_ERROR":
    case "TIMEOUT":
      return "error";
    case "BAD_REQUEST":
    case "CONFLICT":
    case "NOT_FOUND":
    case "PRECONDITION_FAILED":
      return "warning";
    case "UNAUTHORIZED":
    case "FORBIDDEN":
      return "info";
    default:
      return "warning";
  }
};

export const initSentry = () => {
  if (initialized) {
    return;
  }

  if (APP_ENV === "development" || !SENTRY_DSN) {
    console.log("[Sentry] Disabled in development");
    initialized = true;
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: APP_ENV,
    enableTracing: true,
    tracesSampleRate: TRACES_SAMPLE_RATE,
    release: SENTRY_RELEASE,
    beforeSend(event: Event) {
      return tagSlowOperations(event);
    },
  });

  initialized = true;
};

export const captureTRPCError = (
  error: unknown,
  context: TrpcErrorContext,
) => {
  if (!isSentryEnabled()) {
    return;
  }

  if (error instanceof TRPCError) {
    const severity = getTrpcErrorSeverity(error.code);

    if (severity === "info") {
      return;
    }

    Sentry.captureException(error, {
      level: severity,
      contexts: {
        trpc: {
          procedure: context.procedure,
          code: error.code,
          input: scrubSensitiveData(context.input),
        },
      },
      user: context.userId
        ? {
          id: context.userId,
          email: context.userEmail,
        }
        : undefined,
    });
    return;
  }

  Sentry.captureException(error, {
    level: "error",
    contexts: {
      trpc: {
        procedure: context.procedure,
        input: scrubSensitiveData(context.input),
      },
    },
    user: context.userId
      ? {
        id: context.userId,
        email: context.userEmail,
      }
      : undefined,
  });
};

export const withSentryTransaction = async <T>(
  name: string,
  operation: () => Promise<T> | T,
  options: { op?: string } = {},
): Promise<T> => {
  if (!isSentryEnabled()) {
    return await Promise.resolve(operation());
  }

  const transaction = Sentry.startTransaction({
    name,
    op: options.op ?? "task",
  });

  try {
    const result = await Promise.resolve(operation());
    transaction.setStatus("ok");
    return result;
  } catch (error) {
    transaction.setStatus("internal_error");
    throw error;
  } finally {
    transaction.finish();
  }
};

export { Sentry };

