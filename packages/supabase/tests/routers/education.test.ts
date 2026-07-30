/**
 * Profile education router coverage.
 */

import { assert, assertEquals, assertExists } from '../shared/assert.ts';

import {
  callTRPCEndpoint,
  loadCachedTokens,
} from '../shared/setup.ts';
import { requireAuthSetup } from '../shared/test-context.ts';

type EducationEntry = {
  id?: string;
  university_id?: string | null;
  institution_name: string;
  is_verified?: boolean | null;
  degree_type?: string | null;
  custom_degree_type?: string | null;
  field_of_study?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  expected_graduation_date?: string | null;
  is_current?: boolean | null;
  gpa?: number | string | null;
  description?: string | null;
  location?: string | null;
};

interface SaveEducationPayload {
  education_level?: string | null;
  education_entries: EducationEntry[];
}

interface SaveEducationResponse {
  success: boolean;
  education_entries: EducationEntry[];
}

async function fetchEducationData(token: string): Promise<EducationEntry[]> {
  const response = await callTRPCEndpoint(
    "profile.getEducation",
    undefined,
    {
      authToken: token,
    },
  );

  const data = response[0]?.result?.data as EducationEntry[] | undefined;
  return data ?? [];
}

async function fetchEducationLevel(token: string): Promise<string | null> {
  const response = await callTRPCEndpoint(
    "profile.getEducationLevel",
    undefined,
    {
      authToken: token,
    },
  );

  const data = response[0]?.result?.data as { education_level: string | null } | undefined;
  return data?.education_level ?? null;
}

async function saveEducation(
  token: string,
  payload: SaveEducationPayload,
): Promise<SaveEducationResponse> {
  const response = await callTRPCEndpoint(
    "profile.saveEducation",
    payload,
    {
      authToken: token,
      type: "mutation",
    },
  );

  const data = response[0]?.result?.data as SaveEducationResponse | undefined;
  assertExists(data, "Save education response should include data");
  assert(data.success, "Save education mutation should succeed");
  return data;
}

async function restoreEducation(
  token: string,
  entries: EducationEntry[],
  level: string | null,
): Promise<void> {
  await callTRPCEndpoint(
    "profile.saveEducation",
    {
      education_level: level,
      education_entries: entries,
    },
    {
      authToken: token,
      type: "mutation",
    },
  );
}

Deno.test({
  name: "Profile education - manual institution entries persist with verification flag",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const authToken = tokens.regular.token;

    const originalEntries = await fetchEducationData(authToken);
    const originalLevel = await fetchEducationLevel(authToken);

    const manualEntry: EducationEntry = {
      institution_name: `Manual Integration University ${crypto.randomUUID().slice(0, 8)}`,
      university_id: null,
      degree_type: "Bachelor Degree",
      field_of_study: "Integration Studies",
      start_date: "2018-01-01",
      end_date: null,
      expected_graduation_date: "2026-05-01",
      is_current: true,
      description: "Integration test manual entry",
      gpa: 3.5,
    };

    try {
      const result = await saveEducation(authToken, {
        education_level: originalLevel,
        education_entries: [manualEntry],
      });

      const saved = result.education_entries[0];
      assertExists(saved, "Saved manual entry should be present");
      assertEquals(saved.institution_name, manualEntry.institution_name);
      assertEquals(saved.university_id, null);
      assertEquals(saved.is_verified, false);
      assertEquals(saved.expected_graduation_date, "2026-05-01");
      assertEquals(saved.is_current, true);
    } finally {
      await restoreEducation(authToken, originalEntries, originalLevel);
    }
  },
});

Deno.test({
  name: "Profile education - rejects GPA outside valid range",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const authToken = tokens.regular.token;
    const originalEntries = await fetchEducationData(authToken);
    const originalLevel = await fetchEducationLevel(authToken);

    const invalidEntry: EducationEntry = {
      institution_name: "Invalid GPA University",
      university_id: null,
      degree_type: "Associate Degree",
      start_date: "2020-01-01",
      end_date: "2022-01-01",
      is_current: false,
      gpa: 4.5,
    };

    const response = await callTRPCEndpoint(
      "profile.saveEducation",
      {
        education_level: originalLevel,
        education_entries: [invalidEntry],
      },
      {
        authToken,
        type: "mutation",
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected validation error for invalid GPA");
    assertEquals(error.data?.code, "BAD_REQUEST");
    assert(
    String(error.message).includes("Number must be less than or equal to 4"),
    "GPA validation message should mention upper bound",
    );

    await restoreEducation(authToken, originalEntries, originalLevel);
  },
});

Deno.test({
  name: "Profile education - saving with catalog institution marks entry as verified",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const authToken = tokens.regular.token;
    const originalEntries = await fetchEducationData(authToken);
    const originalLevel = await fetchEducationLevel(authToken);

    const searchResponse = await callTRPCEndpoint(
      "office.universities.searchUniversities",
      {
        query: "State",
        country: "United States",
        limit: 1,
      },
      {
        authToken,
      },
    );

    const universities = searchResponse[0]?.result?.data as
      | { universities?: Array<{ id: string; name: string }> }
      | undefined;

    assertExists(
      universities?.universities,
      "University search should return results",
    );
    const university = universities.universities[0];
    assertExists(university, "University search should yield at least one entry");

    const catalogEntry: EducationEntry = {
      institution_name: university.name,
      university_id: university.id,
      degree_type: "Master Degree",
      start_date: "2016-01-01",
      end_date: "2018-05-01",
      is_current: false,
      description: "Catalog integration test entry",
    };

    try {
      const result = await saveEducation(authToken, {
        education_level: originalLevel,
        education_entries: [catalogEntry],
      });

      const saved = result.education_entries[0];
      assertExists(saved, "Catalog entry should be persisted");
      assertEquals(saved.university_id, university.id);
      assertEquals(saved.is_verified, true);
      assertEquals(saved.institution_name, university.name);
    } finally {
      await restoreEducation(authToken, originalEntries, originalLevel);
    }
  },
});

Deno.test({
  name: "Profile education - current entries persist expected graduation date without end date",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const authToken = tokens.regular.token;
    const originalEntries = await fetchEducationData(authToken);
    const originalLevel = await fetchEducationLevel(authToken);

    const currentEntry: EducationEntry = {
      institution_name: `Current Program ${crypto.randomUUID().slice(0, 6)}`,
      university_id: null,
      degree_type: "Other",
      custom_degree_type: "International Diploma",
      start_date: "2024-01-01",
      end_date: null,
      is_current: true,
      expected_graduation_date: "2026-06-01",
      gpa: 3.2,
    };

    try {
      const result = await saveEducation(authToken, {
        education_level: originalLevel,
        education_entries: [currentEntry],
      });

      const saved = result.education_entries[0];
      assertExists(saved, "Current entry should be persisted");
      assertEquals(saved.is_current, true);
      assertEquals(saved.end_date, null);
      assertEquals(saved.expected_graduation_date, "2026-06-01");
      assertEquals(saved.degree_type, "International Diploma");
    } finally {
      await restoreEducation(authToken, originalEntries, originalLevel);
    }
  },
});

Deno.test({
  name: "Profile education - rejects missing end date when entry not current",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const authToken = tokens.regular.token;
    const originalEntries = await fetchEducationData(authToken);
    const originalLevel = await fetchEducationLevel(authToken);

    const invalidEntry: EducationEntry = {
      institution_name: "Incomplete Dates University",
      start_date: "2022-01-01",
      end_date: null,
      is_current: false,
    };

    const response = await callTRPCEndpoint(
      "profile.saveEducation",
      {
        education_level: originalLevel,
        education_entries: [invalidEntry],
      },
      {
        authToken,
        type: "mutation",
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected validation error for missing end date");
  assertEquals(error.data?.code, "INTERNAL_SERVER_ERROR");
  assert(
    String(error.message).includes("End date is required unless currently enrolled"),
    "Missing end date message should be surfaced",
  );
    assert(
      String(error.message).includes("End date is required unless currently enrolled"),
      "Missing end date error should be returned",
    );

    await restoreEducation(authToken, originalEntries, originalLevel);
  },
});

