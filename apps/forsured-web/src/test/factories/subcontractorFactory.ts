/**
 * Subcontractor Factory
 *
 * Creates real subcontractor records in the database for testing.
 * No mocking of owned code
 */

import { CreatedTestData, testSupabase } from "../testDb";
import { FactoryOptions, testId } from "./index";

export interface TestSubcontractor {
  id: string;
  name: string;
  company: string;
  organization_id: string;
  status?: string;
  risk_level?: string;
  compliance_score?: number;
  contact_info?: Record<string, string>;
  trade_type?: string;
  created_at: string;
}

interface CreateSubcontractorOptions extends FactoryOptions {
  name?: string;
  company?: string;
  organizationId?: string;
  status?: "active" | "inactive" | "pending" | "suspended";
  riskLevel?: "low" | "medium" | "high" | "critical";
  complianceScore?: number;
  tradeType?: string;
  email?: string;
  phone?: string;
}

/**
 * Create a test subcontractor with defaults
 */
export async function createTestSubcontractor(
  options: CreateSubcontractorOptions = {},
): Promise<TestSubcontractor> {
  // Get a valid organization ID if not provided
  let organizationId = options.organizationId;
  if (!organizationId) {
    const { data: org } = await testSupabase
      .schema("core" as never)
      .from("organizations")
      .select("id")
      .limit(1)
      .single();

    if (!org) {
      throw new Error("No organization found for test subcontractor");
    }
    organizationId = org.id;
  }

  const id = testId("sub");
  const subcontractorData = {
    name: options.name || `Test Contact ${id}`,
    company: options.company || `Test Company ${id}`,
    organization_id: organizationId,
    status: options.status || "active",
    risk_level: options.riskLevel || "low",
    compliance_score: options.complianceScore,
    trade_type: options.tradeType,
    contact_info: {
      email: options.email || `test-${id}@example.com`,
      phone: options.phone || "555-0100",
    },
  };

  const { data: result, error } = await testSupabase
    .schema("forsured" as never)
    .from("subcontractors")
    .insert(subcontractorData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test subcontractor: ${error.message}`);
  }

  // Track for cleanup
  if (options.track !== false && options.tracker) {
    options.tracker.subcontractors.push(result.id);
  }

  return result as TestSubcontractor;
}

/**
 * Create a subcontractor with project invitation
 */
export async function createTestSubcontractorWithInvitation(
  projectId: string,
  options: CreateSubcontractorOptions & {
    invitationStatus?: "invited" | "active" | "declined" | "removed";
  } = {},
): Promise<{ subcontractor: TestSubcontractor; invitation: any }> {
  const subcontractor = await createTestSubcontractor(options);

  const { data: invitation, error } = await testSupabase
    .schema("forsured" as never)
    .from("project_subcontractors")
    .insert({
      project_id: projectId,
      subcontractor_id: subcontractor.id,
      status: options.invitationStatus || "invited",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create invitation: ${error.message}`);
  }

  // Track for cleanup
  if (options.track !== false && options.tracker && invitation?.id) {
    options.tracker.invitations.push(invitation.id);
  }

  return { subcontractor, invitation };
}

/**
 * Create multiple subcontractors with different risk levels for testing
 */
export async function createTestSubcontractorsByRiskLevel(
  organizationId: string,
  options: FactoryOptions = {},
): Promise<TestSubcontractor[]> {
  const riskLevels: Array<{
    level: "low" | "medium" | "high" | "critical";
    score: number;
  }> = [
    { level: "low", score: 95 },
    { level: "medium", score: 75 },
    { level: "high", score: 55 },
    { level: "critical", score: 30 },
  ];

  const subcontractors: TestSubcontractor[] = [];

  for (const { level, score } of riskLevels) {
    const sub = await createTestSubcontractor({
      organizationId,
      riskLevel: level,
      complianceScore: score,
      company: `${
        level.charAt(0).toUpperCase() + level.slice(1)
      } Risk Contractors`,
      ...options,
    });
    subcontractors.push(sub);
  }

  return subcontractors;
}

/**
 * Get an existing test subcontractor or create one
 */
export async function getOrCreateTestSubcontractor(
  options: CreateSubcontractorOptions = {},
): Promise<TestSubcontractor> {
  // Try to find existing subcontractor first
  let query = testSupabase
    .schema("forsured" as never)
    .from("subcontractors")
    .select("*");

  if (options.organizationId) {
    query = query.eq("organization_id", options.organizationId);
  }

  const { data: existing } = await query.limit(1).single();

  if (existing) {
    return existing as TestSubcontractor;
  }

  // Create new if none exists
  return createTestSubcontractor(options);
}
