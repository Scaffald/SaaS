/**
 * CCPA Compliance REST Routes
 *
 * Endpoints for CCPA data subject rights and compliance management.
 */
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";

const ccpaRouter = new Hono();

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key);
}

// ============================================================
// USER ENDPOINTS
// ============================================================

/**
 * GET /v1/ccpa/data-summary
 * Returns a summary of data categories collected for the current user.
 */
ccpaRouter.get("/data-summary", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const supabase = c.get("supabase");

  // Collect counts from key tables
  const [profileRes, eduRes, skillsRes, expRes, certsRes, workLogsRes, appsRes, connectionsRes, bgChecksRes, idVerRes, assessmentsRes, reviewsRes, feedbackRes] =
    await Promise.all([
      supabase.schema("core").from("profiles").select("id,display_name,email_visible").eq("id", user.id).maybeSingle(),
      supabase.schema("core").from("education").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.schema("core").from("profile_skills").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.schema("core").from("work_experience").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.schema("core").from("certifications").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.schema("core").from("work_logs").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.schema("core").from("applications").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.schema("core").from("connections").select("id", { count: "exact" }).or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
      supabase.schema("core").from("background_checks").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.schema("core").from("id_verifications").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.schema("core").from("personality_assessments").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.schema("core").from("reviews").select("id", { count: "exact" }).eq("reviewer_user_id", user.id),
      supabase.schema("core").from("feedback").select("id", { count: "exact" }).eq("user_id", user.id),
    ]);

  const eduCount = eduRes.count ?? 0;
  const skillsCount = skillsRes.count ?? 0;
  const expCount = expRes.count ?? 0;
  const certsCount = certsRes.count ?? 0;
  const workLogsCount = workLogsRes.count ?? 0;
  const appsCount = appsRes.count ?? 0;
  const connectionsCount = connectionsRes.count ?? 0;
  const bgChecksCount = bgChecksRes.count ?? 0;
  const idVerCount = idVerRes.count ?? 0;
  const assessmentsCount = assessmentsRes.count ?? 0;
  const reviewsCount = reviewsRes.count ?? 0;
  const feedbackCount = feedbackRes.count ?? 0;

  const hasProfile = Boolean(profileRes.data);
  const professionalCount = eduCount + skillsCount + expCount + certsCount + workLogsCount;
  const sensitiveCount = bgChecksCount + idVerCount + assessmentsCount;
  const commsCount = reviewsCount + feedbackCount;

  const categories = [
    {
      id: "personal_information",
      label: "Personal Information",
      description: "Name, email, phone, address, account info",
      hasData: hasProfile,
    },
    {
      id: "professional_information",
      label: "Professional Information",
      description: "Education, skills, work experience, certifications, work logs",
      hasData: professionalCount > 0,
      itemCount: professionalCount,
    },
    {
      id: "usage_information",
      label: "Usage Information",
      description: "Profile views, applications, connections",
      hasData: appsCount > 0 || connectionsCount > 0,
      itemCount: appsCount + connectionsCount,
    },
    {
      id: "sensitive_information",
      label: "Sensitive Information",
      description: "Background checks, ID verification, assessments",
      hasData: sensitiveCount > 0,
      itemCount: sensitiveCount,
    },
    {
      id: "communications",
      label: "Communications",
      description: "Reviews and platform feedback",
      hasData: commsCount > 0,
      itemCount: commsCount,
    },
  ];

  return c.json({ categories });
});

/**
 * GET /v1/ccpa/my-requests
 * Returns paginated list of the current user's CCPA requests.
 */
ccpaRouter.get("/my-requests", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const supabase = c.get("supabase");
  const limit = parseInt(c.req.query("limit") ?? "20", 10);
  const offset = parseInt(c.req.query("offset") ?? "0", 10);
  const status = c.req.query("status");

  let query = supabase
    .schema("core")
    .from("ccpa_requests")
    .select("id,request_type,status,submitted_at,deadline_at,extended_deadline_at,completed_at")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) return c.json({ error: "Failed to load requests" }, 500);

  const requests = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    type: row.request_type,
    status: row.status,
    created_at: row.submitted_at,
    deadline_at: row.deadline_at,
    extended_deadline_at: row.extended_deadline_at,
    completed_at: row.completed_at,
  }));

  return c.json({ requests, total: count ?? 0 });
});

/**
 * GET /v1/ccpa/connected-apps
 * Returns connected OAuth applications. Returns empty list (feature not yet implemented).
 */
ccpaRouter.get("/connected-apps", (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);
  return c.json([]);
});

/**
 * GET /v1/ccpa/my-opt-outs
 * Returns the current user's opt-out status for all categories.
 */
ccpaRouter.get("/my-opt-outs", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .schema("core")
    .from("ccpa_opt_outs")
    .select("category,opted_out_at,source")
    .eq("user_id", user.id);

  if (error) return c.json({ error: "Failed to load opt-out status" }, 500);

  const rows = data ?? [];
  const optOuts = rows.map((row: Record<string, unknown>) => ({
    category: row.category,
    opted_out: true,
    opted_out_at: row.opted_out_at,
    source: row.source === "gpc" ? "gpc" : "user",
  }));

  const hasGPCOptOut = rows.some(
    (row: Record<string, unknown>) => row.source === "gpc"
  );

  return c.json({ optOuts, hasGPCOptOut });
});

/**
 * POST /v1/ccpa/opt-outs
 * Set or clear opt-out for a given category.
 * Body: { category: string, optOut: boolean }
 */
ccpaRouter.post("/opt-outs", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const supabase = c.get("supabase");
  const body = await c.req.json();
  const { category, optOut } = body;

  if (!category) return c.json({ error: "category is required" }, 400);

  if (optOut) {
    const { error } = await supabase.schema("core").from("ccpa_opt_outs").upsert(
      {
        user_id: user.id,
        category,
        source: "user_request",
        metadata: {},
      },
      { onConflict: "user_id,category", ignoreDuplicates: true }
    );
    if (error) return c.json({ error: "Failed to set opt-out" }, 500);
  } else {
    const { error } = await supabase
      .schema("core")
      .from("ccpa_opt_outs")
      .delete()
      .eq("user_id", user.id)
      .eq("category", category);
    if (error) return c.json({ error: "Failed to clear opt-out" }, 500);
  }

  return c.json({ category, opted_out: optOut });
});

/**
 * POST /v1/ccpa/requests
 * Submit a CCPA data request (access, deletion, or correction).
 * Body: { type: 'export' | 'deletion' | 'correction', categories?: string[], correctionDetails?: string }
 */
ccpaRouter.post("/requests", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const supabase = c.get("supabase");
  const body = await c.req.json();
  const { type, categories, correctionDetails } = body;

  // Map component type names to DB request_type values
  const typeMap: Record<string, string> = {
    export: "access",
    deletion: "deletion",
    correction: "correction",
  };

  const requestType = typeMap[type];
  if (!requestType) return c.json({ error: "Invalid request type" }, 400);

  // Check for duplicate active requests
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: existing } = await supabase
    .schema("core")
    .from("ccpa_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("request_type", requestType)
    .in("status", ["pending", "in_progress"])
    .gte("submitted_at", thirtyDaysAgo.toISOString())
    .maybeSingle();

  if (existing) {
    return c.json({ error: "You already have an active request of this type" }, 409);
  }

  const metadata: Record<string, unknown> = {};
  if (categories?.length) metadata.categories = categories;
  if (correctionDetails) metadata.correctionDetails = correctionDetails;

  const { data: request, error } = await supabase
    .schema("core")
    .from("ccpa_requests")
    .insert({
      user_id: user.id,
      request_type: requestType,
      status: "pending",
      verification_method: requestType === "deletion" ? "enhanced" : "email",
      metadata,
    })
    .select("id,status,deadline_at,submitted_at")
    .single();

  if (error || !request) {
    return c.json({ error: error?.message ?? "Failed to create request" }, 500);
  }

  return c.json({
    id: request.id,
    status: request.status,
    deadline_at: request.deadline_at,
    submitted_at: request.submitted_at,
  }, 201);
});

// ============================================================
// ADMIN ENDPOINTS (office role)
// ============================================================

/**
 * GET /v1/ccpa/compliance-metrics
 * Returns compliance metrics for the CCPA admin dashboard.
 */
ccpaRouter.get("/compliance-metrics", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const supabaseAdmin = getServiceClient();

  // Get all requests from the last 30 days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const { data: requests, error } = await supabaseAdmin
    .schema("core")
    .from("ccpa_requests")
    .select("*")
    .gte("submitted_at", startDate.toISOString());

  if (error) return c.json({ error: "Failed to load metrics" }, 500);

  const allRequests = requests ?? [];
  const totalRequests = allRequests.length;
  const pendingRequests = allRequests.filter((r: Record<string, unknown>) => r.status === "pending").length;
  const processingRequests = allRequests.filter((r: Record<string, unknown>) => r.status === "in_progress").length;
  const completedRequests = allRequests.filter((r: Record<string, unknown>) => r.status === "completed");
  const overdueRequests = allRequests.filter((r: Record<string, unknown>) => {
    if (!["pending", "in_progress"].includes(r.status as string)) return false;
    const deadline = ((r.extended_deadline_at ?? r.deadline_at) as string);
    return new Date(deadline) < new Date();
  });

  let avgProcessingDays = 0;
  if (completedRequests.length > 0) {
    const totalDays = completedRequests.reduce((sum: number, r: Record<string, unknown>) => {
      const submitted = new Date(r.submitted_at as string);
      const completed = new Date(r.completed_at as string);
      return sum + (completed.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);
    avgProcessingDays = totalDays / completedRequests.length;
  }

  const complianceRate = totalRequests > 0
    ? (completedRequests.length + allRequests.filter((r: Record<string, unknown>) => r.status === "cancelled").length) / totalRequests
    : 1;

  return c.json({
    total_requests: totalRequests,
    pending_requests: pendingRequests,
    processing_requests: processingRequests,
    completed_requests: completedRequests.length,
    average_processing_days: avgProcessingDays,
    compliance_rate: complianceRate,
    overdue_count: overdueRequests.length,
  });
});

/**
 * GET /v1/ccpa/admin-requests
 * Returns paginated list of all CCPA requests for admin review.
 */
ccpaRouter.get("/admin-requests", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const supabaseAdmin = getServiceClient();

  const status = c.req.query("status");
  const type = c.req.query("type");
  const priority = c.req.query("priority");
  const limit = parseInt(c.req.query("limit") ?? "50", 10);
  const offset = parseInt(c.req.query("offset") ?? "0", 10);

  let query = supabaseAdmin
    .schema("core")
    .from("ccpa_requests")
    .select(
      'id,user_id,request_type,status,submitted_at,updated_at,completed_at,deadline_at,extended_deadline_at,metadata',
      { count: "exact" }
    )
    .order("deadline_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (type) {
    const typeMap: Record<string, string> = { export: "access", deletion: "deletion", correction: "correction", opt_out: "opt_out" };
    const dbType = typeMap[type] ?? type;
    query = query.eq("request_type", dbType);
  }

  const { data, error, count } = await query;
  if (error) return c.json({ error: "Failed to load requests" }, 500);

  // Get user emails via auth admin API
  const rows = data ?? [];
  const userIds = [...new Set(rows.map((r: Record<string, unknown>) => r.user_id as string))];

  const userMap: Record<string, { email: string; display_name: string }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .schema("core")
      .from("profiles")
      .select("id,email_visible,display_name")
      .in("id", userIds);

    for (const p of profiles ?? []) {
      userMap[p.id] = { email: p.email_visible ?? "", display_name: p.display_name ?? "" };
    }
  }

  const requests = rows.map((row: Record<string, unknown>) => {
    const deadline = ((row.extended_deadline_at ?? row.deadline_at) as string);
    const daysElapsed = Math.floor(
      (Date.now() - new Date(row.submitted_at as string).getTime()) / (1000 * 60 * 60 * 24)
    );
    const isOverdue = deadline ? new Date(deadline) < new Date() && ["pending", "in_progress"].includes(row.status as string) : false;

    // Map DB type back to component type
    const typeReverseMap: Record<string, string> = { access: "export", deletion: "deletion", correction: "correction", opt_out: "opt_out" };
    const componentType = typeReverseMap[row.request_type as string] ?? (row.request_type as string);

    // Determine priority based on overdue/days elapsed
    let prio = "low";
    if (isOverdue) prio = "urgent";
    else if (daysElapsed > 30) prio = "high";
    else if (daysElapsed > 15) prio = "medium";

    return {
      id: row.id,
      user_id: row.user_id,
      user_email: userMap[row.user_id as string]?.email ?? "",
      user_name: userMap[row.user_id as string]?.display_name ?? "Unknown User",
      type: componentType,
      status: row.status,
      created_at: row.submitted_at,
      updated_at: row.updated_at,
      completed_at: row.completed_at ?? null,
      priority: priority && priority !== "all" ? priority : prio,
      days_elapsed: daysElapsed,
      is_overdue: isOverdue,
    };
  });

  return c.json({ requests, total: count ?? 0 });
});

/**
 * POST /v1/ccpa/requests/:id/process
 * Trigger processing for a CCPA request (admin action).
 */
ccpaRouter.post("/requests/:id/process", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const requestId = c.req.param("id");
  const supabaseAdmin = getServiceClient();

  const { data: request, error: fetchError } = await supabaseAdmin
    .schema("core")
    .from("ccpa_requests")
    .select("id,status")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    return c.json({ error: "CCPA request not found" }, 404);
  }

  if (!["pending", "in_progress"].includes(request.status)) {
    return c.json({ error: `Cannot process request with status '${request.status}'` }, 400);
  }

  // Update status to in_progress
  const { error: updateError } = await supabaseAdmin
    .schema("core")
    .from("ccpa_requests")
    .update({ status: "in_progress", updated_at: new Date().toISOString() })
    .eq("id", requestId);

  if (updateError) return c.json({ error: "Failed to process request" }, 500);

  return c.json({ success: true, requestId, status: "in_progress" });
});

export default ccpaRouter;
