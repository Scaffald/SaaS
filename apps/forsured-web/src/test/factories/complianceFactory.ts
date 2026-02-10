/**
 * Compliance Factory
 *
 * Creates real compliance records in the database for testing.
 * No mocking of owned code
 */

import { CreatedTestData, testSupabase } from "../testDb";
import { FactoryOptions, testId } from "./index";

export interface TestComplianceScore {
  id: string;
  project_id: string;
  subcontractor_id: string;
  organization_id: string;
  score: number;
  status: string;
  gaps?: any;
  last_evaluated: string;
  created_at: string;
}

export interface TestComplianceIssue {
  id: string;
  project_id: string;
  subcontractor_id: string;
  organization_id: string;
  type: string;
  severity: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
}

interface CreateComplianceScoreOptions extends FactoryOptions {
  projectId: string;
  subcontractorId: string;
  organizationId: string;
  score?: number;
  status?: "compliant" | "warning" | "critical" | "pending";
  gaps?: any;
}

interface CreateComplianceIssueOptions extends FactoryOptions {
  projectId: string;
  subcontractorId: string;
  organizationId: string;
  type?: string;
  severity?: "info" | "warning" | "error" | "critical";
  title?: string;
  description?: string;
  status?: "open" | "in_progress" | "resolved" | "dismissed";
}

/**
 * Create a test compliance score
 */
export async function createTestComplianceScore(
  options: CreateComplianceScoreOptions,
): Promise<TestComplianceScore> {
  const scoreData = {
    project_id: options.projectId,
    subcontractor_id: options.subcontractorId,
    organization_id: options.organizationId,
    score: options.score ?? 75,
    status: options.status || "warning",
    gaps: options.gaps || [],
    last_evaluated: new Date().toISOString(),
  };

  const { data: result, error } = await testSupabase
    .schema("forsured" as never)
    .from("compliance_scores")
    .insert(scoreData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test compliance score: ${error.message}`);
  }

  // Track for cleanup
  if (options.track !== false && options.tracker) {
    options.tracker.complianceScores.push(result.id);
  }

  return result as TestComplianceScore;
}

/**
 * Create a test compliance issue
 */
export async function createTestComplianceIssue(
  options: CreateComplianceIssueOptions,
): Promise<TestComplianceIssue> {
  const issueData = {
    project_id: options.projectId,
    subcontractor_id: options.subcontractorId,
    organization_id: options.organizationId,
    type: options.type || "coverage_gap",
    severity: options.severity || "warning",
    title: options.title || `Test Issue ${testId()}`,
    description: options.description,
    status: options.status || "open",
  };

  const { data: result, error } = await testSupabase
    .schema("forsured" as never)
    .from("compliance_issues")
    .insert(issueData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test compliance issue: ${error.message}`);
  }

  // Track for cleanup
  if (options.track !== false && options.tracker) {
    options.tracker.complianceIssues.push(result.id);
  }

  return result as TestComplianceIssue;
}

/**
 * Create multiple compliance issues with different severities
 */
export async function createTestComplianceIssuesBySeverity(
  projectId: string,
  subcontractorId: string,
  organizationId: string,
  options: FactoryOptions = {},
): Promise<TestComplianceIssue[]> {
  const severities: Array<{
    severity: "info" | "warning" | "error" | "critical";
    title: string;
  }> = [
    { severity: "info", title: "Minor documentation missing" },
    { severity: "warning", title: "Policy expiring soon" },
    { severity: "error", title: "Coverage below minimum" },
    { severity: "critical", title: "Policy expired" },
  ];

  const issues: TestComplianceIssue[] = [];

  for (const { severity, title } of severities) {
    const issue = await createTestComplianceIssue({
      projectId,
      subcontractorId,
      organizationId,
      severity,
      title,
      ...options,
    });
    issues.push(issue);
  }

  return issues;
}

/**
 * Create a complete compliance scenario for testing
 * Includes score and related issues
 */
export async function createTestComplianceScenario(
  options: {
    projectId: string;
    subcontractorId: string;
    organizationId: string;
    score?: number;
    issueCount?: number;
    criticalIssues?: boolean;
  } & FactoryOptions,
): Promise<{
  score: TestComplianceScore;
  issues: TestComplianceIssue[];
}> {
  // Determine status based on score
  let status: "compliant" | "warning" | "critical" | "pending" = "warning";
  const score = options.score ?? 75;
  if (score >= 90) status = "compliant";
  else if (score >= 70) status = "warning";
  else if (score >= 50) status = "warning";
  else status = "critical";

  const complianceScore = await createTestComplianceScore({
    projectId: options.projectId,
    subcontractorId: options.subcontractorId,
    organizationId: options.organizationId,
    score,
    status,
    tracker: options.tracker,
    track: options.track,
  });

  const issues: TestComplianceIssue[] = [];
  const issueCount = options.issueCount ?? 2;

  for (let i = 0; i < issueCount; i++) {
    const severity = options.criticalIssues && i === 0 ? "critical" : "warning";
    const issue = await createTestComplianceIssue({
      projectId: options.projectId,
      subcontractorId: options.subcontractorId,
      organizationId: options.organizationId,
      severity,
      title: `Test Issue ${i + 1}`,
      tracker: options.tracker,
      track: options.track,
    });
    issues.push(issue);
  }

  return { score: complianceScore, issues };
}
