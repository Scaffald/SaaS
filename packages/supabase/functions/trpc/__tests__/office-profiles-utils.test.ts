import {
  assertEquals,
  assertFalse,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  parseNudgeHistory,
  parseUIPreferences,
} from "../routers/office/profiles.router.ts";

Deno.test("parseUIPreferences normalizes ghost profile fields", () => {
  const parsed = parseUIPreferences({
    is_ghost_profile: true,
    ghost_profile_marked_at: "2025-01-04T00:00:00Z",
    ghost_profile_completion_score: 40,
  });

  assertEquals(parsed.is_ghost_profile, true);
  assertEquals(parsed.ghost_profile_completion_score, 40);
});

Deno.test("parseNudgeHistory defaults when data missing", () => {
  const parsed = parseNudgeHistory(null);
  assertEquals(Object.keys(parsed.dismissed ?? {}).length, 0);
  assertEquals(parsed.reminders?.length ?? 0, 0);

  const withReminder = parseNudgeHistory({
    reminders: [{ sentAt: "2025-01-01T00:00:00Z" }],
  });
  assertFalse(withReminder.reminders === undefined);
  assertEquals(withReminder.reminders?.length, 1);
});

