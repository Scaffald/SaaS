/**
 * Seeding helpers to manage deterministic test data for router suites.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "./setup.ts";

export type SeedClient = SupabaseClient;

export function createSeedClient(): SeedClient {
  return createAdminClient();
}

export async function withSeedClient<T>(
  handler: (client: SeedClient) => Promise<T>,
): Promise<T> {
  const client = createSeedClient();
  return await handler(client);
}

export async function truncateTables(
  client: SeedClient,
  tables: string[],
): Promise<void> {
  for (const table of tables) {
    const { error } = await client.from(table).delete().neq("id", null);

    if (error) {
      throw new Error(`Failed to truncate ${table}: ${error.message}`);
    }
  }
}

export async function insertRows<T extends Record<string, unknown>>(
  client: SeedClient,
  table: string,
  rows: T[],
): Promise<T[]> {
  const { data, error } = await client.from(table).insert(rows).select();

  if (error) {
    throw new Error(`Failed to insert rows into ${table}: ${error.message}`);
  }

  return data as T[];
}
