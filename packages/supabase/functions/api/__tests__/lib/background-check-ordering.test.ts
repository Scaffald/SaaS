import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  orderingIsOpen,
  orderingOpenFor,
} from "../../lib/background-check-ordering.ts";
import { loadStripeMode } from "../../../_shared/id-verification-api.ts";

// A stand-in for the admin client: just enough of the stripe_settings lookup
// and the Vault RPC that loadStripeMode makes.
function fakeAdmin(
  secret: string | null,
  opts: { failSettings?: boolean } = {},
) {
  return {
    schema: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve(
                opts.failSettings
                  ? { data: null, error: { message: "boom" } }
                  : {
                    data: secret === null ? null : { api_key_secret_id: "s1" },
                    error: null,
                  },
              ),
          }),
        }),
      }),
      rpc: () => Promise.resolve({ data: secret, error: null }),
    }),
  };
}

function withEnv(
  vars: Record<string, string | undefined>,
  fn: () => Promise<void>,
) {
  return async () => {
    const saved = Object.fromEntries(
      Object.keys(vars).map((k) => [k, Deno.env.get(k)]),
    );
    for (const [k, v] of Object.entries(vars)) {
      if (v === undefined) Deno.env.delete(k);
      else Deno.env.set(k, v);
    }
    try {
      await fn();
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) Deno.env.delete(k);
        else Deno.env.set(k, v);
      }
    }
  };
}

const NO_MOCK = { STRIPE_MOCK_MODE: undefined };

Deno.test("practice money is open; real money waits for the provider", () => {
  assertEquals(orderingOpenFor("mock", false), true);
  assertEquals(orderingOpenFor("test", false), true);
  assertEquals(orderingOpenFor("live", false), false);
  assertEquals(orderingOpenFor("live", true), true);
  assertEquals(orderingOpenFor("unconfigured", false), false);
  assertEquals(orderingOpenFor("unconfigured", true), false);
});

Deno.test(
  "a Stripe test key reads as test",
  withEnv(NO_MOCK, async () => {
    // deno-lint-ignore no-explicit-any
    assertEquals(await loadStripeMode(fakeAdmin("sk_test_abc") as any), "test");
    // deno-lint-ignore no-explicit-any
    assertEquals(await loadStripeMode(fakeAdmin("rk_test_abc") as any), "test");
  }),
);

Deno.test(
  "a live key, or any key not marked test, reads as live",
  withEnv(NO_MOCK, async () => {
    // deno-lint-ignore no-explicit-any
    assertEquals(await loadStripeMode(fakeAdmin("sk_live_abc") as any), "live");
    // deno-lint-ignore no-explicit-any
    assertEquals(await loadStripeMode(fakeAdmin("whatever") as any), "live");
  }),
);

Deno.test(
  "no key configured reads as unconfigured",
  withEnv(NO_MOCK, async () => {
    // deno-lint-ignore no-explicit-any
    assertEquals(await loadStripeMode(fakeAdmin(null) as any), "unconfigured");
  }),
);

Deno.test(
  "a live key closes ordering until the provider flag is set",
  withEnv(
    { ...NO_MOCK, BACKGROUND_CHECK_PROVIDER_LIVE: undefined },
    async () => {
      assertEquals(await orderingIsOpen(fakeAdmin("sk_live_abc")), false);
      Deno.env.set("BACKGROUND_CHECK_PROVIDER_LIVE", "1");
      assertEquals(await orderingIsOpen(fakeAdmin("sk_live_abc")), true);
    },
  ),
);

Deno.test(
  "a test key keeps ordering open for QA",
  withEnv(
    { ...NO_MOCK, BACKGROUND_CHECK_PROVIDER_LIVE: undefined },
    async () => {
      assertEquals(await orderingIsOpen(fakeAdmin("sk_test_abc")), true);
    },
  ),
);

Deno.test(
  "unreadable settings close ordering",
  withEnv(NO_MOCK, async () => {
    assertEquals(
      await orderingIsOpen(fakeAdmin("sk_test_abc", { failSettings: true })),
      false,
    );
  }),
);
