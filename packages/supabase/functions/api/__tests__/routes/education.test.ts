/**
 * Education save (#1357).
 *
 * A new education entry could not be saved: the form's blank dates arrived as
 * `''` (invalid for DATE), `custom_degree_type` is not a column, and existing
 * and new rows went out in one bulk upsert, so the new row's id was sent as
 * NULL. Each was a 500.
 *
 * The first block pins the row-building rules; the second saves through the
 * real route handler against the local database, signed in as the seeded API
 * test user (run `pnpm supa start`; seed 002a_seed-api-test-user.sql).
 */
import {
  assert,
  assertEquals,
  assertFalse,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { prepareEducationWrites } from "../../lib/education-entries.ts";
import {
  createTestSupabaseClient,
  getAuthToken,
  TEST_SUPABASE_SERVICE_KEY,
  TEST_SUPABASE_URL,
} from "../setup.ts";
import { createClient } from "@supabase/supabase-js";
import educationApp from "../../routes/education.ts";

const USER_ID = "00000000-0000-0000-0000-000000000010";
const NOW = "2026-11-17T00:00:00.000Z";

Deno.test("education rows: blank dates and text become null", () => {
  const { inserts } = prepareEducationWrites(
    [{
      institution_name: "  Denver Trade School ",
      start_date: "2024-09-01",
      end_date: "",
      expected_graduation_date: "  ",
      field_of_study: "",
      description: "",
      location: "",
    }],
    USER_ID,
    NOW,
  );

  assertEquals(inserts.length, 1);
  const [row] = inserts;
  assertEquals(row.institution_name, "Denver Trade School");
  assertEquals(row.start_date, "2024-09-01");
  assertEquals(row.end_date, null);
  assertEquals(row.expected_graduation_date, null);
  assertEquals(row.field_of_study, null);
  assertEquals(row.description, null);
  assertEquals(row.location, null);
  assertEquals(row.user_id, USER_ID);
});

Deno.test("education rows: only real columns, custom degree folded into degree_type", () => {
  const { inserts } = prepareEducationWrites(
    [{
      institution_name: "X",
      degree_type: "Other",
      custom_degree_type: "Journeyman Lineworker",
      // Columns the client may echo back that are not writable here.
      user_id: "11111111-1111-1111-1111-111111111111",
      created_at: "2020-01-01",
    } as never],
    USER_ID,
    NOW,
  );

  const [row] = inserts;
  assertEquals(row.degree_type, "Journeyman Lineworker");
  assertFalse("custom_degree_type" in row);
  assertFalse("created_at" in row);
  assertEquals(row.user_id, USER_ID);
});

Deno.test("education rows: a standard degree ignores a stale custom name", () => {
  const { inserts } = prepareEducationWrites(
    [{
      institution_name: "X",
      degree_type: "Bachelor Degree",
      custom_degree_type: "left over",
    }],
    USER_ID,
    NOW,
  );
  assertEquals(inserts[0].degree_type, "Bachelor Degree");
});

Deno.test("education rows: new rows carry no id key, existing rows keep theirs", () => {
  const existing = "22222222-2222-2222-2222-222222222222";
  const { updates, inserts } = prepareEducationWrites(
    [
      { id: existing, institution_name: "Old" },
      { institution_name: "New" },
    ],
    USER_ID,
    NOW,
  );

  assertEquals(updates.map((u) => u.id), [existing]);
  assertEquals(inserts.length, 1);
  assertFalse("id" in inserts[0]);
});

Deno.test({
  name:
    "POST /v1/profiles/education - adds a new entry beside an existing one (#1357)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const token = await getAuthToken("test@example.com", "test123456");
    if (!token) {
      throw new Error(
        "Test user not found. Run pnpm supa start / db reset to seed 002a_seed-api-test-user.sql",
      );
    }
    // Keep the edge runtime out of it: the handler under test is this
    // checkout's, called in-process against the real local database.
    const service = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_KEY);
    const userDb = createTestSupabaseClient(token);
    const { data: me } = await userDb.auth.getUser(token);
    const userId = me.user?.id;
    assert(userId, "could not resolve the test user's id");

    const marker = `edu-1357-${crypto.randomUUID()}`;
    const { data: seeded, error: seedError } = await service
      .schema("core")
      .from("user_education")
      .insert({
        user_id: userId,
        institution_name: `${marker}-existing`,
        start_date: "2018-09-01",
        end_date: "2022-05-01",
      })
      .select()
      .single();
    if (seedError) throw seedError;

    try {
      const post = (body: unknown) =>
        educationApp.request("/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

      // Exactly what the form sends for a fresh entry next to a loaded one.
      const res = await post({
        education_entries: [
          {
            id: seeded.id,
            institution_name: `${marker}-existing renamed`,
            start_date: "2018-09-01",
            end_date: "2022-05-01",
            is_current: false,
            is_verified: false,
          },
          {
            institution_name: `${marker}-new`,
            is_verified: false,
            degree_type: "Other",
            custom_degree_type: "Lineworker Certificate",
            field_of_study: "",
            start_date: "2024-09-01",
            end_date: "",
            expected_graduation_date: "",
            is_current: true,
            description: "",
            location: "",
          },
        ],
      });
      const body = await res.json();
      assertEquals(res.status, 200, JSON.stringify(body));
      assertEquals(body.success, true);
      assertEquals(body.education_entries.length, 2);

      const { data: rows, error } = await service
        .schema("core")
        .from("user_education")
        .select("*")
        .eq("user_id", userId)
        .like("institution_name", `${marker}%`)
        .order("institution_name");
      if (error) throw error;

      assertEquals(rows.length, 2);
      const [existing, created] = rows;
      assertEquals(existing.id, seeded.id);
      assertEquals(existing.institution_name, `${marker}-existing renamed`);
      assert(created.id, "new row got an id");
      assertEquals(created.degree_type, "Lineworker Certificate");
      assertEquals(created.start_date, "2024-09-01");
      assertEquals(created.end_date, null);
      assertEquals(created.expected_graduation_date, null);
    } finally {
      await service
        .schema("core")
        .from("user_education")
        .delete()
        .like("institution_name", `${marker}%`);
    }
  },
});
