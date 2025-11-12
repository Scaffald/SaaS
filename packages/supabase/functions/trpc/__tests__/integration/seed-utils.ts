import type { SupabaseClient } from "@supabase/supabase-js";

import {
  TEST_USERS,
  createAdminClient,
  createTestClient,
  loadCachedTokens,
} from "../setup.ts";

interface ProfileDefaults {
  displayName: string;
  firstName: string;
  lastName: string;
}

interface EnsureUserRecordsOptions {
  defaults: ProfileDefaults;
}

async function ensureUserRecords(
  admin: SupabaseClient,
  userId: string,
  { defaults }: EnsureUserRecordsOptions,
): Promise<void> {
  const now = new Date().toISOString();

  const { data: existingUsers, error: readUsersError } = await admin
    .schema("core")
    .from("users")
    .select("id, display_name")
    .eq("id", userId)
    .limit(1);

  if (readUsersError) {
    throw new Error(
      `Failed to read core.users for ${userId}: ${readUsersError.message}`,
    );
  }

  const currentUser = existingUsers?.[0];

  if (!currentUser) {
    const username = `integration-${userId.slice(0, 8)}`;
    const { error: insertUserError } = await admin
      .schema("core")
      .from("users")
      .insert({
        id: userId,
        username,
        slug: username,
        display_name: defaults.displayName,
        created_at: now,
        updated_at: now,
      });

    if (insertUserError) {
      throw new Error(
        `Failed to insert core.users row for ${userId}: ${insertUserError.message}`,
      );
    }
  } else if (!currentUser.display_name) {
    const { error: updateUserError } = await admin
      .schema("core")
      .from("users")
      .update({
        display_name: defaults.displayName,
        updated_at: now,
      })
      .eq("id", userId);

    if (updateUserError) {
      throw new Error(
        `Failed to update core.users row for ${userId}: ${updateUserError.message}`,
      );
    }
  }

  const { data: existingProfiles, error: readProfileError } = await admin
    .schema("core")
    .from("profile")
    .select("user_id, first_name, last_name")
    .eq("user_id", userId)
    .limit(1);

  if (readProfileError) {
    throw new Error(
      `Failed to read core.profile for ${userId}: ${readProfileError.message}`,
    );
  }

  const currentProfile = existingProfiles?.[0];

  if (!currentProfile) {
    const { error: insertProfileError } = await admin
      .schema("core")
      .from("profile")
      .insert({
        user_id: userId,
        first_name: defaults.firstName,
        last_name: defaults.lastName,
        created_at: now,
        updated_at: now,
      });

    if (insertProfileError) {
      throw new Error(
        `Failed to insert core.profile row for ${userId}: ${insertProfileError.message}`,
      );
    }
  } else {
    const updates: Record<string, unknown> = {};
    if (!currentProfile.first_name) {
      updates.first_name = defaults.firstName;
    }
    if (!currentProfile.last_name) {
      updates.last_name = defaults.lastName;
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = now;

      const { error: updateProfileError } = await admin
        .schema("core")
        .from("profile")
        .update(updates)
        .eq("user_id", userId);

      if (updateProfileError) {
        throw new Error(
          `Failed to update core.profile row for ${userId}: ${updateProfileError.message}`,
        );
      }
    }
  }
}

export async function ensurePublicWorker(): Promise<{ userId: string }> {
  const tokens = await loadCachedTokens();
  if (!tokens) {
    throw new Error(
      "Cached auth tokens not found. Run auth tests before calling worker endpoints.",
    );
  }

  const admin = createAdminClient();
  await ensureUserRecords(admin, tokens.regular.userId, {
    defaults: {
      displayName: "Integration Worker",
      firstName: "Integration",
      lastName: "Worker",
    },
  });

  return { userId: tokens.regular.userId };
}

async function getOrCreateOfficeAdminAuth(): Promise<{
  token: string;
  userId: string;
  email: string;
}> {
  const adminClient = createAdminClient();
  const adminEmail = TEST_USERS.admin.email;
  const adminPassword = TEST_USERS.admin.password;

  const testClient = createTestClient();

  const attemptSignIn = async () => {
    const { data, error } = await testClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (error) {
      return { token: null, userId: null };
    }

    return {
      token: data.session?.access_token ?? null,
      userId: data.user?.id ?? null,
    };
  };

  let { token, userId } = await attemptSignIn();

  if (!token || !userId) {
    const { data, error } = await adminClient.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        first_name: "Test",
        last_name: "Admin",
        name: "Integration Admin",
      },
    });

    if (error) {
      throw new Error(`Failed to create admin user: ${error.message}`);
    }

    userId = data.user?.id ?? null;
    if (!userId) {
      throw new Error("Admin user creation did not return a user id");
    }

    const retry = await attemptSignIn();
    token = retry.token;
    userId = retry.userId;
  }

  if (!token || !userId) {
    throw new Error("Unable to obtain auth token for admin user");
  }

  return { token, userId, email: adminEmail };
}

export async function ensureOfficeAdminAccess(): Promise<{
  token: string;
  userId: string;
  email: string;
}> {
  const adminClient = createAdminClient();
  const adminAuth = await getOrCreateOfficeAdminAuth();

  await ensureUserRecords(adminClient, adminAuth.userId, {
    defaults: {
      displayName: "Integration Admin",
      firstName: "Test",
      lastName: "Admin",
    },
  });

  const now = new Date().toISOString();

  const { data: existingRoles, error: readRolesError } = await adminClient
    .schema("core")
    .from("roles")
    .select("id")
    .eq("name", "office")
    .eq("scope", "platform")
    .limit(1);

  if (readRolesError) {
    throw new Error(`Failed to read office role: ${readRolesError.message}`);
  }

  let roleId = existingRoles?.[0]?.id ?? null;

  if (!roleId) {
    const { data, error: insertRoleError } = await adminClient
      .schema("core")
      .from("roles")
      .insert({
        name: "office",
        scope: "platform",
        description: "Platform office administrator",
        created_at: now,
      })
      .select("id")
      .single();

    if (insertRoleError) {
      throw new Error(
        `Failed to insert office role: ${insertRoleError.message}`,
      );
    }

    roleId = data?.id ?? null;
  }

  if (!roleId) {
    throw new Error("Office role id could not be determined");
  }

  const { data: existingAssignments, error: readAssignmentsError } =
    await adminClient
      .schema("core")
      .from("role_assignments")
      .select("id")
      .eq("role_id", roleId)
      .eq("user_id", adminAuth.userId)
      .limit(1);

  if (readAssignmentsError) {
    throw new Error(
      `Failed to read existing role assignments: ${readAssignmentsError.message}`,
    );
  }

  if (!existingAssignments?.length) {
    const { error: insertAssignmentError } = await adminClient
      .schema("core")
      .from("role_assignments")
      .insert({
        role_id: roleId,
        user_id: adminAuth.userId,
        created_at: now,
      });

    if (insertAssignmentError && insertAssignmentError.code !== "23505") {
      throw new Error(
        `Failed to insert office role assignment: ${insertAssignmentError.message}`,
      );
    }
  }

  return adminAuth;
}

export interface SeededExternalJob {
  jobId: string;
  feedId: string;
  cleanup: () => Promise<void>;
}

export async function seedExternalJob(): Promise<SeededExternalJob> {
  const adminClient = createAdminClient();
  const feedId = crypto.randomUUID();
  const jobId = crypto.randomUUID();
  const now = new Date().toISOString();
  const feedName = `Integration Feed ${feedId.slice(0, 8)}`;

  const { error: feedError } = await adminClient
    .schema("core")
    .from("external_job_feeds")
    .insert({
      id: feedId,
      name: feedName,
      url: `https://example.com/${feedId}`,
      feed_type: "api",
      is_active: true,
      created_at: now,
      updated_at: now,
    });

  if (feedError && feedError.code !== "23505") {
    throw new Error(
      `Failed to insert external job feed ${feedId}: ${feedError.message}`,
    );
  }

  const { error: jobError } = await adminClient
    .schema("core")
    .from("external_jobs")
    .insert({
      id: jobId,
      feed_id: feedId,
      external_guid: `integration-${jobId}`,
      title: "Integration Test Role",
      description: "Seeded external job for integration tests.",
      company_name: "Integration Test Co.",
      job_location: "Test City, TS",
      job_type: "full-time",
      job_category: "Construction",
      posted_date: now,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

  if (jobError && jobError.code !== "23505") {
    throw new Error(
      `Failed to insert external job ${jobId}: ${jobError.message}`,
    );
  }

  return {
    jobId,
    feedId,
    cleanup: async () => {
      await adminClient
        .schema("core")
        .from("external_job_industries")
        .delete()
        .eq("external_job_id", jobId);

      await adminClient
        .schema("core")
        .from("external_job_skills")
        .delete()
        .eq("external_job_id", jobId);

      await adminClient
        .schema("core")
        .from("external_jobs")
        .delete()
        .eq("id", jobId);

      await adminClient
        .schema("core")
        .from("external_job_feeds")
        .delete()
        .eq("id", feedId);
    },
  };
}

