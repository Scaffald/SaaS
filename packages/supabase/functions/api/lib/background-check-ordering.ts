/**
 * Whether background checks can be ordered here at all (#1267).
 *
 * A paid check has to reach the screening provider, and nothing submits one
 * yet (#1267 part 2). With a live Stripe key that would take real money for a
 * check that waits forever, so ordering opens only where the money is practice
 * money (a Stripe test key, or the mock) — dev, for NationSearch's QA — or once
 * the provider integration is switched on with the function secret
 * `BACKGROUND_CHECK_PROVIDER_LIVE=1`. No key configured is closed too.
 *
 * Fails closed: if the Stripe settings cannot be read, ordering is closed.
 */

import {
  loadStripeMode,
  type StripeMode,
} from "../../_shared/id-verification-api.ts";

export const ORDERING_CLOSED = "ordering_closed";

export function orderingOpenFor(mode: StripeMode, providerLive: boolean) {
  if (mode === "mock" || mode === "test") return true;
  return mode === "live" && providerLive;
}

export async function orderingIsOpen(
  // deno-lint-ignore no-explicit-any
  admin: any,
): Promise<boolean> {
  try {
    return orderingOpenFor(
      await loadStripeMode(admin),
      Deno.env.get("BACKGROUND_CHECK_PROVIDER_LIVE") === "1",
    );
  } catch (e) {
    console.error(
      `[background-checks] could not read the Stripe mode: ${
        (e as Error).message
      }`,
    );
    return false;
  }
}
