import { JSDOM } from "jsdom";
import { afterEach, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";

// Import Supabase mocks to register them
import "./mocks/supabase";

const dom = new JSDOM();
global.document = dom.window.document;
global.window = dom.window as any;

// Define __DEV__ as a global variable
global.__DEV__ = true;

// Set required environment variables for tests
if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
  process.env.EXPO_PUBLIC_SUPABASE_URL = "http://localhost:54321";
}
if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
}

// Mock window.matchMedia (common JSDOM issue)
if (!global.window.matchMedia) {
  global.window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Mock window.confirm (JSDOM doesn't implement it)
if (!global.window.confirm) {
  global.window.confirm = vi.fn(() => true);
}

// Clear localStorage before each test to prevent quota issues
beforeEach(() => {
  if (global.localStorage) {
    global.localStorage.clear();
  }
});

// Comprehensive cleanup after each test to prevent memory leaks
afterEach(() => {
  // Clean up React Testing Library renders
  cleanup();

  // Clear all mocks
  vi.clearAllMocks();

  // Reset all mocks to their initial state
  vi.resetAllMocks();

  // Clear all timers to prevent hanging
  vi.clearAllTimers();

  // Clear sessionStorage
  if (global.sessionStorage) {
    global.sessionStorage.clear();
  }

  // Clear any pending promises/microtasks by giving a small tick
  // This helps prevent "act" warnings and memory leaks
});

// Suppress known custom UI and React DOM prop warnings in tests
// These are component props (e.g. Beyond UI / legacy) that don't belong in DOM but are safe to suppress
const originalWarn = console.warn;
const originalError = console.error;

const CUSTOM_UI_PROPS = [
  "flexWrap",
  "pressStyle",
  "borderColor",
  "hoverStyle",
  "borderBottomWidth",
  "numberOfLines",
  "minW",
  "minH",
  "themeInverse",
  "chromeless",
  "padded",
  "bordered",
  "iconAfter",
  "onValueChange",
  "testID",
  "borderWidth",
  "borderRadius",
  "zIndex",
  "icon",
  "textAlign", // custom UI accepts textAlign but React warns when it reaches DOM
];

console.warn = (...args) => {
  const message = args[0]?.toString?.() ?? "";

  // Suppress custom UI prop warnings
  if (message.includes("React does not recognize the")) {
    if (CUSTOM_UI_PROPS.some((prop) => message.includes(`\`${prop}\``))) {
      return; // suppress
    }
  }

  // Suppress non-boolean attribute warnings
  if (
    message.includes("Received `true` for a non-boolean attribute") &&
    CUSTOM_UI_PROPS.some((prop) => message.includes(prop))
  ) {
    return; // suppress
  }

  // Suppress invalid value for prop warnings (icon, etc.)
  if (
    message.includes("Invalid value for prop") &&
    CUSTOM_UI_PROPS.some((prop) => message.includes(prop))
  ) {
    return; // suppress
  }

  // Pass through other warnings
  originalWarn(...args);
};

console.error = (...args) => {
  const message = args[0]?.toString?.() ?? "";

  // Suppress nested button hydration errors (component structure issue, not test issue)
  if (message.includes("<button> cannot contain a nested <button>")) {
    return; // suppress
  }

  // Suppress hydration errors from custom UI prop mismatches
  if (
    message.includes("In HTML") &&
    message.includes("This will cause a hydration error")
  ) {
    return; // suppress
  }

  // Pass through other errors
  originalError(...args);
};

// Global unhandled rejection and uncaught exception tracking
// These are reported by the async-error-reporter for better visibility
const unhandledErrors: Array<{ type: string; error: any; timestamp: number }> =
  [];

if (typeof global !== "undefined") {
  // Track unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    unhandledErrors.push({
      type: "UnhandledPromiseRejection",
      error: reason,
      timestamp: Date.now(),
    });
    originalError(
      `[Unhandled Rejection] ${
        reason instanceof Error ? reason.message : String(reason)
      }`,
    );
  });

  // Track uncaught exceptions
  process.on("uncaughtException", (error) => {
    unhandledErrors.push({
      type: "UncaughtException",
      error,
      timestamp: Date.now(),
    });
    originalError(`[Uncaught Exception] ${error.message}`);
  });

  // Expose errors for reporters
  (global as any).__unhandledErrors__ = unhandledErrors;
}

// Create a comprehensive Supabase mock that supports the full query builder API
function createSupabaseQueryBuilder() {
  // Default response that can be overridden in tests
  const defaultResponse = { data: null, error: null };
  const basePromise = Promise.resolve(defaultResponse);

  // Create builder object first so we can reference it in methods
  const builder: Record<string, unknown> = {};

  // Helper to create chainable methods that return the builder
  const createChainableMethod = () => {
    const fn = vi.fn();
    fn.mockReturnValue(builder);
    return fn;
  };

  // Query builder methods - all return the builder for chaining
  builder.select = createChainableMethod();
  builder.from = createChainableMethod();
  builder.insert = createChainableMethod();
  builder.update = createChainableMethod();
  builder.upsert = createChainableMethod();
  builder.delete = createChainableMethod();

  // Filter methods
  builder.eq = createChainableMethod();
  builder.neq = createChainableMethod();
  builder.gt = createChainableMethod();
  builder.gte = createChainableMethod();
  builder.lt = createChainableMethod();
  builder.lte = createChainableMethod();
  builder.like = createChainableMethod();
  builder.ilike = createChainableMethod();
  builder.is = createChainableMethod();
  builder.in = createChainableMethod();
  builder.contains = createChainableMethod();
  builder.containedBy = createChainableMethod();
  builder.rangeGt = createChainableMethod();
  builder.rangeGte = createChainableMethod();
  builder.rangeLt = createChainableMethod();
  builder.rangeLte = createChainableMethod();
  builder.rangeAdjacent = createChainableMethod();
  builder.overlaps = createChainableMethod();
  builder.textSearch = createChainableMethod();
  builder.match = createChainableMethod();
  builder.not = createChainableMethod();
  builder.or = createChainableMethod();
  builder.filter = createChainableMethod();

  // Ordering and pagination
  builder.order = createChainableMethod();
  builder.limit = createChainableMethod();
  builder.range = createChainableMethod();
  builder.abortSignal = createChainableMethod();
  builder.single = createChainableMethod();
  builder.maybeSingle = createChainableMethod();
  builder.csv = createChainableMethod();
  builder.geojson = createChainableMethod();
  builder.explain = createChainableMethod();
  builder.rollback = createChainableMethod();

  // Make the builder thenable (promise-like) - can be awaited
  // This allows: await supabase.schema().from().select().in()
  // biome-ignore lint/suspicious/noThenProperty: Intentionally creating thenable object for Supabase mock
  builder.then = basePromise.then.bind(basePromise);
  builder.catch = basePromise.catch.bind(basePromise);
  if (basePromise.finally) {
    builder.finally = basePromise.finally.bind(basePromise);
  }

  return builder;
}

function createSupabaseSchemaBuilder() {
  const queryBuilder = createSupabaseQueryBuilder();

  // RPC builder that supports both patterns:
  // 1. schema().rpc() - returns a promise-like object directly
  // 2. schema().rpc().returns() - returns a promise after .returns()
  const rpcPromise = Promise.resolve({ data: null, error: null });
  const rpcBuilder = {
    returns: vi.fn().mockResolvedValue({ data: null, error: null }),
    // biome-ignore lint/suspicious/noThenProperty: Intentionally creating thenable object for Supabase RPC mock
    then: rpcPromise.then.bind(rpcPromise),
    catch: rpcPromise.catch.bind(rpcPromise),
    finally: rpcPromise.finally?.bind(rpcPromise),
  };

  return {
    from: vi.fn().mockReturnValue(queryBuilder),
    rpc: vi.fn().mockReturnValue(rpcBuilder),
  };
}

// Create the main Supabase client mock
const mockSupabaseClient = {
  schema: vi.fn().mockReturnValue(createSupabaseSchemaBuilder()),
  from: vi.fn().mockReturnValue(createSupabaseQueryBuilder()),
  rpc: vi.fn().mockReturnValue(createSupabaseQueryBuilder()),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: null },
      unsubscribe: vi.fn(),
    }),
  },
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({
      status: "SUBSCRIBED",
      unsubscribe: vi.fn(),
    }),
  }),
};

// Mock the Supabase client module
vi.mock("@scf/core/utils/supabase/client", () => ({
  supabase: mockSupabaseClient,
}));
