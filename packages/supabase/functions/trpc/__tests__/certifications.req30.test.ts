import {
  assertEquals,
  assertExists,
} from "jsr:@std/assert";
import {
  callTRPCEndpoint,
  createAdminClient,
  loadCachedTokens,
} from "./setup.ts";

const admin = createAdminClient();
const tokens = await loadCachedTokens();

if (!tokens) {
  throw new Error(
    "Cached auth tokens not found. Run pnpm supa functions tests (auth.test.ts) to generate tokens before executing REQ-30 certification tests.",
  );
}

const REGULAR_TOKEN = tokens.regular.token;
const REGULAR_USER_ID = tokens.regular.userId;

interface CertificationRow {
  id: string;
  slug: string;
  title: string;
  depth: number;
}

interface CertificationChain {
  prefix: string;
  top: CertificationRow;
  category: CertificationRow;
  leaf: CertificationRow;
}

async function createCertificationChain(): Promise<CertificationChain> {
  const prefix = `req30-${crypto.randomUUID()}`.toLowerCase();
  const topSlug = `${prefix}-top`;
  const topTitle = `REQ-30 Top ${prefix}`;
  const categorySlug = `${prefix}-category`;
  const categoryTitle = `REQ-30 Category ${prefix}`;
  const leafSlug = `${prefix}-leaf`;
  const leafTitle = `REQ-30 Leaf ${prefix}`;

  const { data: top, error: topError } = await admin
    .schema("data")
    .from("certifications")
    .insert({
      slug: topSlug,
      title: topTitle,
      description: "REQ-30 automated test top-level certification",
      depth: 0,
      hierarchy_path: topSlug,
      sort_order: 9900,
      is_active: true,
    })
    .select()
    .single();

  if (topError || !top) {
    throw new Error(`Failed to seed top-level certification: ${topError?.message}`);
  }

  const { data: category, error: categoryError } = await admin
    .schema("data")
    .from("certifications")
    .insert({
      slug: categorySlug,
      title: categoryTitle,
      description: "REQ-30 automated test category certification",
      depth: 1,
      parent_id: top.id,
      hierarchy_path: `${topSlug}.${categorySlug}`,
      sort_order: 9901,
      is_active: true,
    })
    .select()
    .single();

  if (categoryError || !category) {
    throw new Error(`Failed to seed category certification: ${categoryError?.message}`);
  }

  const { data: leaf, error: leafError } = await admin
    .schema("data")
    .from("certifications")
    .insert({
      slug: leafSlug,
      title: leafTitle,
      description: "REQ-30 automated test depth-2 certification",
      depth: 2,
      parent_id: category.id,
      hierarchy_path: `${topSlug}.${categorySlug}.${leafSlug}`,
      sort_order: 9902,
      is_active: true,
    })
    .select()
    .single();

  if (leafError || !leaf) {
    throw new Error(`Failed to seed leaf certification: ${leafError?.message}`);
  }

  return {
    prefix,
    top,
    category,
    leaf,
  };
}

async function clearUserCertifications(certificationIds: string[]) {
  if (!certificationIds.length) {
    return;
  }

  await admin
    .schema("core")
    .from("user_certifications")
    .delete()
    .eq("user_id", REGULAR_USER_ID)
    .in("certification_id", certificationIds);
}

async function cleanupCertificationChain(chain: CertificationChain) {
  const ids = [chain.leaf.id, chain.category.id, chain.top.id];
  await clearUserCertifications(ids);

  for (const id of ids) {
    await admin.schema("data").from("certifications").delete().eq("id", id);
  }
}

function extractResultData<T>(response: unknown[]): T | null {
  const payload = response?.[0] as {
    result?: { data?: T };
  };
  return payload?.result?.data ?? null;
}

function extractError(response: unknown[]) {
  const payload = response?.[0] as { error?: { data?: { code?: string }; message?: string } };
  return payload?.error ?? null;
}

Deno.test({
  name: "REQ-30 certification router integration",
  sanitizeResources: false,
  sanitizeOps: false,
  permissions: { net: true, env: true, read: true, write: true },
  async fn(t) {
    await t.step("search returns multi-depth certifications when user has none", async () => {
      const chain = await createCertificationChain();

      try {
        await clearUserCertifications([chain.top.id, chain.category.id, chain.leaf.id]);

        const response = await callTRPCEndpoint(
          "profile.certifications.getTopLevelCertifications",
          { search: chain.prefix, limit: 10 },
          { authToken: REGULAR_TOKEN },
        );

        const data = extractResultData<{ certifications: CertificationRow[] }>(response);
        assertExists(data, "Expected certifications payload");
        assertEquals(data.certifications.length, 3, "Should return all depth levels");

        const depths = data.certifications.map((cert) => cert.depth).sort();
        assertEquals(depths, [0, 1, 2]);

        const leaf = data.certifications.find((cert) => cert.id === chain.leaf.id) as
          | (CertificationRow & { parent_title?: string | null })
          | undefined;
        assertExists(leaf, "Depth-2 certification should be present in search results");
        assertEquals(
          leaf?.parent_title,
          chain.category.title,
          "Leaf result should include its parent title for grouping",
        );
      } finally {
        await cleanupCertificationChain(chain);
      }
    });

    await t.step("addCertification inserts hierarchy and blocks duplicates", async () => {
      const chain = await createCertificationChain();

      try {
        await clearUserCertifications([chain.top.id, chain.category.id, chain.leaf.id]);

        const addResponse = await callTRPCEndpoint(
          "profile.certifications.addCertification",
          { certification_id: chain.leaf.id },
          { authToken: REGULAR_TOKEN, type: "mutation" },
        );

        const addResult = extractResultData<{ success: boolean }>(addResponse);
        assertExists(addResult, "Expected addCertification payload");
        assertEquals(addResult.success, true, "Mutation should succeed");

        const { data: createdRows } = await admin
          .schema("core")
          .from("user_certifications")
          .select("certification_id")
          .eq("user_id", REGULAR_USER_ID)
          .in("certification_id", [chain.top.id, chain.category.id, chain.leaf.id]);

        assertEquals(
          (createdRows ?? []).length,
          3,
          "All hierarchy levels should be present for the user",
        );

        const duplicateResponse = await callTRPCEndpoint(
          "profile.certifications.addCertification",
          { certification_id: chain.leaf.id },
          { authToken: REGULAR_TOKEN, type: "mutation" },
        );

        const duplicateError = extractError(duplicateResponse);
        assertExists(duplicateError, "Duplicate add should surface an error");
        assertEquals(duplicateError.data?.code, "BAD_REQUEST");
      } finally {
        await cleanupCertificationChain(chain);
      }
    });

    await t.step("search excludes owned certifications and tree reflects proof defaults", async () => {
      const chain = await createCertificationChain();

      try {
        await clearUserCertifications([chain.top.id, chain.category.id, chain.leaf.id]);

        await callTRPCEndpoint(
          "profile.certifications.addCertification",
          { certification_id: chain.leaf.id },
          { authToken: REGULAR_TOKEN, type: "mutation" },
        );

        const searchResponse = await callTRPCEndpoint(
          "profile.certifications.getTopLevelCertifications",
          { search: chain.prefix, limit: 10 },
          { authToken: REGULAR_TOKEN },
        );

        const searchData = extractResultData<{ certifications: CertificationRow[] }>(
          searchResponse,
        );
        assertExists(searchData, "Expected search payload");
        assertEquals(
          searchData.certifications.length,
          0,
          "Owned certifications should be excluded from search results",
        );

        const treeResponse = await callTRPCEndpoint(
          "profile.certifications.getUserCertificationTree",
          undefined,
          { authToken: REGULAR_TOKEN },
        );

        const tree = extractResultData<{
          depth0: Array<{ certification_id: string }>;
          depth1ByParent: Record<string, Array<{ certification_id: string }>>;
          depth2ByParent: Record<
            string,
            Array<{
              certification_id: string;
              credential_url: string | null;
              certificate_file_path: string | null;
              catalog: { depth: number };
            }>
          >;
        }>(treeResponse);

        assertExists(tree, "Expected certification tree payload");

        const depth0Entry = tree.depth0.find((item) =>
          item.certification_id === chain.top.id
        );
        assertExists(depth0Entry, "Top-level certification should appear in depth0 section");

        const depth1Values = Object.values(tree.depth1ByParent ?? {}).flat();
        const depth1Entry = depth1Values.find((item) =>
          item.certification_id === chain.category.id
        );
        assertExists(depth1Entry, "Category certification should appear in depth1 map");

        const depth2Values = Object.values(tree.depth2ByParent ?? {}).flat();
        const depth2Entry = depth2Values.find((item) =>
          item.certification_id === chain.leaf.id
        );
        assertExists(depth2Entry, "Specific certification should appear in depth2 map");
        assertEquals(depth2Entry?.catalog.depth, 2);
        assertEquals(depth2Entry?.credential_url, null);
        assertEquals(depth2Entry?.certificate_file_path, null);
      } finally {
        await cleanupCertificationChain(chain);
      }
    });

    await t.step("user_certifications enforces data.certifications foreign key", async () => {
      const randomCertId = crypto.randomUUID();

      const { error } = await admin
        .schema("core")
        .from("user_certifications")
        .insert({
          user_id: REGULAR_USER_ID,
          certification_id: randomCertId,
        });

      assertExists(error, "Insert with missing certification should fail with FK error");
      assertEquals(error.code, "23503");
    });
  },
});

