import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { updateGeneralSchema } from "../../lib/general-info-schema.ts";

Deno.test("accepts an empty patch", () => {
  const result = updateGeneralSchema.safeParse({});
  assert(result.success);
  assertEquals(result.data, {});
});

Deno.test("accepts a single-field patch", () => {
  const result = updateGeneralSchema.safeParse({ first_name: "Zach" });
  assert(result.success);
  assertEquals(result.data, { first_name: "Zach" });
});

Deno.test("accepts a full, well-formed body", () => {
  const result = updateGeneralSchema.safeParse({
    first_name: "Zach",
    last_name: "Servideo",
    phone: "+1 (424) 280-2876",
    avatar_path: "avatars/abc.jpg",
    about: "Builder.",
    address: {
      street: "10 Central Street",
      city: "Ipswich",
      state: "MA",
      zip: "01938",
      country: "United States",
    },
  });
  assert(result.success);
});

// The handler used to write whatever it was handed. These are the writes that
// were previously accepted (#587).
Deno.test("rejects an over-long first name", () => {
  const result = updateGeneralSchema.safeParse({ first_name: "a".repeat(51) });
  assert(!result.success);
});

Deno.test("rejects an empty first name", () => {
  const result = updateGeneralSchema.safeParse({ first_name: "" });
  assert(!result.success);
});

Deno.test("rejects an about over 1500 characters", () => {
  const result = updateGeneralSchema.safeParse({ about: "a".repeat(1501) });
  assert(!result.success);
});

Deno.test("rejects a non-string first name", () => {
  const result = updateGeneralSchema.safeParse({ first_name: 42 });
  assert(!result.success);
});

Deno.test("rejects an address that is not an object", () => {
  const result = updateGeneralSchema.safeParse({ address: "10 Central St" });
  assert(!result.success);
});

Deno.test("rejects an out-of-range latitude", () => {
  const result = updateGeneralSchema.safeParse({
    address: { latitude: 120, longitude: 0 },
  });
  assert(!result.success);
});

Deno.test("rejects unknown keys rather than silently dropping them", () => {
  // strict() matters: `role` or `id` arriving here must be a 400, not a no-op
  // that lulls a caller into thinking it worked.
  const result = updateGeneralSchema.safeParse({
    first_name: "Zach",
    role: "admin",
  });
  assert(!result.success);
});

Deno.test("accepts TipTap JSONContent for about", () => {
  const result = updateGeneralSchema.safeParse({
    about: { type: "doc", content: [{ type: "paragraph" }] },
  });
  assert(result.success);
});

Deno.test("accepts a null about and a null address", () => {
  const result = updateGeneralSchema.safeParse({ about: null, address: null });
  assert(result.success);
});

Deno.test("accepts a deliberately cleared avatar", () => {
  // Clearing the avatar sends "" — it must not be mistaken for absent (#591).
  const result = updateGeneralSchema.safeParse({ avatar_path: "" });
  assert(result.success);
  assertEquals(result.data, { avatar_path: "" });
});

Deno.test("reports the offending field so the client can point at it", () => {
  const result = updateGeneralSchema.safeParse({ last_name: "b".repeat(80) });
  assert(!result.success);
  assertEquals(result.error.issues[0].path, ["last_name"]);
});
