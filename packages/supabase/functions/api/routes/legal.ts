/**
 * Legal documents REST API (public, unauthenticated)
 *
 * Exposes the currently-published legal document versions from
 * core.legal_documents (migration 342) so clients — including the logged-out
 * terms/privacy pages and native — can display the version and effective date
 * without embedding constants. The acceptance state itself is per-user and
 * lives on GET /v1/prerequisites/check.
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@supabase/supabase-js";

const app = new OpenAPIHono();

const legalDocumentSchema = z
  .object({
    doc_type: z.enum(["terms_of_service", "privacy_policy"]),
    version: z.string(),
    effective_at: z.string(),
    url: z.string(),
    title: z.string().nullable(),
  })
  .openapi("LegalDocument");

const legalDocumentsResponseSchema = z
  .object({
    documents: z.array(legalDocumentSchema),
  })
  .openapi("LegalDocumentsResponse");

const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi("ErrorResponse");

// Anon client: the table's RLS grants public SELECT; no auth required here.
function getAnonClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  return createClient(url, key);
}

const listRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Current legal document versions",
  description:
    "Returns the currently-published version of each legal document (Terms of Service, Privacy Policy). Public — no authentication required.",
  responses: {
    200: {
      content: {
        "application/json": { schema: legalDocumentsResponseSchema },
      },
      description: "Current legal documents",
    },
    500: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Internal server error",
    },
  },
});

app.openapi(listRoute, async (c) => {
  try {
    const supabase = getAnonClient();
    const { data, error } = await supabase
      .schema("core")
      .from("legal_documents")
      .select("doc_type, version, effective_at, url, title")
      .eq("is_current", true)
      .order("doc_type");

    if (error) {
      console.error("Failed to fetch legal documents:", error);
      return c.json(
        { error: "Failed to fetch legal documents", message: error.message },
        500,
      );
    }

    c.header("Cache-Control", "public, max-age=300");
    return c.json({ documents: data ?? [] });
  } catch (error) {
    console.error("Unexpected error in legal documents:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export default app;
