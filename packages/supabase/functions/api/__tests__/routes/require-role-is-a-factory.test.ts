/**
 * `requireRole` must return its middleware synchronously.
 *
 * It is used as `app.use("*", requireRole("office", "platform"))`, so Hono
 * receives whatever the call evaluates to. While the factory was declared
 * `async`, that was a Promise — and every route mounting it answered
 * `{"error":"handler is not a function"}` for every verb.
 *
 * Twelve route files mount it: office-jobs, office-users, office-organizations,
 * office-storage, office-universities, office-certifications,
 * background-checks-admin, legal-agreements, notifications-admin,
 * id-verification, oauth-management and stripe-settings. Confirmed against a
 * live local API — /v1/office/users and /v1/office/organizations returned the
 * handler error before this and real rows after.
 *
 * TypeScript cannot catch it: Hono's `use()` accepts a broad handler type, and
 * `Promise<MiddlewareHandler>` slips through. Hence a runtime test.
 */

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { requireRole } from "../../middleware/auth.ts";

Deno.test("requireRole returns a function, not a Promise", () => {
  const middleware = requireRole("office", "platform");

  assertEquals(
    typeof middleware,
    "function",
    "requireRole must be a synchronous factory — Hono cannot call a Promise",
  );
  assert(
    !(middleware instanceof Promise),
    "requireRole returned a Promise; every route mounting it will 500",
  );
});

Deno.test("the middleware it returns is itself async and takes (c, next)", () => {
  const middleware = requireRole("office");

  assertEquals(middleware.length, 2, "middleware must accept (c, next)");
  assertEquals(
    middleware.constructor.name,
    "AsyncFunction",
    "the inner middleware does async work and must stay async",
  );
});

Deno.test("the scope argument is optional", () => {
  assertEquals(typeof requireRole("office"), "function");
  assertEquals(typeof requireRole("office", "platform"), "function");
});
