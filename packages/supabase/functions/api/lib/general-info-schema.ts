import { z } from "@hono/zod-openapi";

/**
 * Request body for PATCH /v1/profiles/general.
 *
 * Extracted from routes/profiles.ts so it can be unit-tested without standing up
 * the edge runtime.
 *
 * Every field is optional — the client sends only what the user changed — but a
 * field that IS present must be well-formed. Before #587 the handler did
 * `await c.req.json() as Record<string, unknown>` and wrote whatever keys it
 * found straight to core.users / core.profile: no length caps, no type checks,
 * no shape check on address. The client-side zod schema was the only enforcement
 * anywhere, so any non-browser caller bypassed validation entirely.
 *
 * Limits mirror packages/scf-core/features/profile/config/general-schema.ts. If
 * you change one, change the other — schema-copies-in-sync.test.ts exists
 * because this repo has been bitten by exactly that drift before.
 */
export const generalAddressSchema = z.object({
  street: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zip: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const updateGeneralSchema = z
  .object({
    first_name: z.string().min(1).max(50),
    last_name: z.string().min(1).max(50),
    // Scored by the Identity component of core.v_profile_completion_scores, and
    // until #585 there was no editor anywhere that could set it (#585).
    headline: z.string().max(120).nullable(),
    // TipTap sends JSONContent; older rows hold plain strings. Both are stored
    // as-is, so both have to be accepted.
    about: z.union([z.string().max(1500), z.record(z.unknown())]).nullable(),
    phone: z.string().max(32),
    avatar_path: z.string().max(500),
    address: generalAddressSchema.nullable(),
  })
  .partial()
  .strict();

export type UpdateGeneralInput = z.infer<typeof updateGeneralSchema>;
