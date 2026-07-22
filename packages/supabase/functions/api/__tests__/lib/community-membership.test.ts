import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { mergeMembership } from "../../lib/community-membership.ts";

const COMMUNITIES = [
  { id: "a", name: "Electricians" },
  { id: "b", name: "Plumbers" },
  { id: "c", name: "Carpenters" },
];

Deno.test("mergeMembership marks communities present in the id set as is_member: true", () => {
  const result = mergeMembership(COMMUNITIES, new Set(["b"]));

  assertEquals(result.map((c) => c.is_member), [false, true, false]);
  // Original fields are preserved.
  assertEquals(result[1].name, "Plumbers");
});

Deno.test("mergeMembership accepts a plain iterable, not just a Set", () => {
  const result = mergeMembership(COMMUNITIES, ["a", "c"]);

  assertEquals(result.map((c) => c.is_member), [true, false, true]);
});

Deno.test("mergeMembership marks everything false when the id set is empty (e.g. unauthenticated viewer)", () => {
  const result = mergeMembership(COMMUNITIES, []);

  assertEquals(result.every((c) => c.is_member === false), true);
});

Deno.test("mergeMembership returns an empty array for an empty community list", () => {
  const result = mergeMembership([], ["a", "b"]);

  assertEquals(result, []);
});
