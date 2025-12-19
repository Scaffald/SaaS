/**
 * Forsured Data Collector - CCPA Integration with Scaffald
 * REQ-3: CCPA Compliance Implementation
 *
 * Collects Forsured-specific data for CCPA requests initiated via Scaffald.
 * This service responds to Scaffald webhooks to contribute Forsured data
 * to the central CCPA export process.
 *
 * Data Categories:
 * - Insurance policies -> 'financial' CCPA category
 * - Compliance records -> 'professional' CCPA category
 * - Documents -> 'professional' CCPA category
 * - Tasks -> 'usage' CCPA category
 */

import type { CCPAServiceResponse } from './types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * CCPA data categories as defined by CCPA regulations
 */
export type CCPADataCategory =
  | 'identifiers'
  | 'financial'
  | 'professional'
  | 'commercial'
  | 'internet_activity'
  | 'geolocation'
  | 'audio_visual'
  | 'inferences'
  | 'sensitive_personal_info'
  | 'usage';

/**
 * Forsured data export structure for CCPA
 */
export interface ForsuredDataExport {
  export_id: string;
  app_id: string;
  app_name: string;
  exported_at: string;
  user_id: string;

  // Categorized data
  categories: {
    category: CCPADataCategory;
    data_type: string;
    records: Array<Record<string, unknown>>;
    record_count: number;
    collection_source: string;
    business_purpose: string;
    retention_period: string;
  }[];

  // Summary
  total_records: number;
  data_types_included: string[];
}

/**
 * Options for data collection
 */
export interface DataCollectionOptions {
  includeMetadata?: boolean;
  limitRecords?: number;
  categories?: CCPADataCategory[];
}

// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================

// Supabase client - injected at initialization
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClient: any = null;

/**
 * Initialize the Forsured data collector with a Supabase client
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initializeForsuredDataCollector(client: any): void {
  supabaseClient = client;
}

/**
 * Forsured Data Collector Service
 * Collects all Forsured-specific data for CCPA exports
 */
export class ForsuredDataCollectorService {
  private readonly APP_ID = 'forsured';
  private readonly APP_NAME = 'Forsured Insurance Compliance';

  /**
   * Collect all Forsured data for a user
   *
   * @param userId - User ID to collect data for
   * @param options - Collection options
   * @returns Structured data export
   */
  async collectForsuredData(
    userId: string,
    options: DataCollectionOptions = {}
  ): Promise<CCPAServiceResponse<ForsuredDataExport>> {
    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      // Collect data from all Forsured tables
      const [
        userProfile,
        insurancePolicies,
        complianceScores,
        complianceIssues,
        documents,
        tasks,
        projects,
        brokerAcknowledgements,
      ] = await Promise.all([
        this.getUserProfile(userId),
        this.getInsurancePolicies(userId),
        this.getComplianceScores(userId),
        this.getComplianceIssues(userId),
        this.getDocuments(userId),
        this.getTasks(userId),
        this.getProjects(userId),
        this.getBrokerAcknowledgements(userId),
      ]);

      // Build categorized data export
      const categories: ForsuredDataExport['categories'] = [];
      const dataTypesIncluded: string[] = [];
      let totalRecords = 0;

      // User Profile -> identifiers category
      if (userProfile) {
        categories.push({
          category: 'identifiers',
          data_type: 'user_profile',
          records: [this.sanitizeUserProfile(userProfile)],
          record_count: 1,
          collection_source: 'User registration and profile updates',
          business_purpose: 'Account management and authentication',
          retention_period: 'Active account + 90 days after deletion',
        });
        dataTypesIncluded.push('user_profile');
        totalRecords += 1;
      }

      // Insurance Policies -> financial category
      if (insurancePolicies.length > 0) {
        categories.push({
          category: 'financial',
          data_type: 'insurance_policies',
          records: insurancePolicies.map(p => this.sanitizePolicy(p)),
          record_count: insurancePolicies.length,
          collection_source: 'Policy uploads and broker submissions',
          business_purpose: 'Insurance compliance verification',
          retention_period: '7 years from policy expiration (regulatory requirement)',
        });
        dataTypesIncluded.push('insurance_policies');
        totalRecords += insurancePolicies.length;
      }

      // Compliance Scores -> inferences category
      if (complianceScores.length > 0) {
        categories.push({
          category: 'inferences',
          data_type: 'compliance_scores',
          records: complianceScores.map(s => this.sanitizeComplianceScore(s)),
          record_count: complianceScores.length,
          collection_source: 'Automated compliance analysis',
          business_purpose: 'Risk assessment and compliance monitoring',
          retention_period: '5 years (compliance audit trail)',
        });
        dataTypesIncluded.push('compliance_scores');
        totalRecords += complianceScores.length;
      }

      // Compliance Issues -> professional category
      if (complianceIssues.length > 0) {
        categories.push({
          category: 'professional',
          data_type: 'compliance_issues',
          records: complianceIssues.map(i => this.sanitizeComplianceIssue(i)),
          record_count: complianceIssues.length,
          collection_source: 'Compliance verification process',
          business_purpose: 'Insurance requirement enforcement',
          retention_period: '5 years (compliance audit trail)',
        });
        dataTypesIncluded.push('compliance_issues');
        totalRecords += complianceIssues.length;
      }

      // Documents -> professional category
      if (documents.length > 0) {
        categories.push({
          category: 'professional',
          data_type: 'documents',
          records: documents.map(d => this.sanitizeDocument(d)),
          record_count: documents.length,
          collection_source: 'User uploads',
          business_purpose: 'Insurance certificate storage and verification',
          retention_period: '7 years from upload date',
        });
        dataTypesIncluded.push('documents');
        totalRecords += documents.length;
      }

      // Tasks -> usage category
      if (tasks.length > 0) {
        categories.push({
          category: 'usage',
          data_type: 'tasks',
          records: tasks.map(t => this.sanitizeTask(t)),
          record_count: tasks.length,
          collection_source: 'Platform activity',
          business_purpose: 'Task management and workflow tracking',
          retention_period: 'Project duration + 1 year',
        });
        dataTypesIncluded.push('tasks');
        totalRecords += tasks.length;
      }

      // Projects -> commercial category
      if (projects.length > 0) {
        categories.push({
          category: 'commercial',
          data_type: 'projects',
          records: projects.map(p => this.sanitizeProject(p)),
          record_count: projects.length,
          collection_source: 'User input and GC invitations',
          business_purpose: 'Construction project insurance management',
          retention_period: '7 years from project completion',
        });
        dataTypesIncluded.push('projects');
        totalRecords += projects.length;
      }

      // Broker Acknowledgements -> professional category
      if (brokerAcknowledgements.length > 0) {
        categories.push({
          category: 'professional',
          data_type: 'broker_acknowledgements',
          records: brokerAcknowledgements.map(a => this.sanitizeAcknowledgement(a)),
          record_count: brokerAcknowledgements.length,
          collection_source: 'Broker verification process',
          business_purpose: 'Broker-client relationship verification',
          retention_period: '7 years (professional records)',
        });
        dataTypesIncluded.push('broker_acknowledgements');
        totalRecords += brokerAcknowledgements.length;
      }

      const dataExport: ForsuredDataExport = {
        export_id: `FORSURED-EXP-${Date.now()}`,
        app_id: this.APP_ID,
        app_name: this.APP_NAME,
        exported_at: new Date().toISOString(),
        user_id: userId,
        categories,
        total_records: totalRecords,
        data_types_included: dataTypesIncluded,
      };

      // Log export for audit trail
      await this.logDataCollection(userId, dataExport.export_id);

      return {
        success: true,
        data: dataExport,
      };
    } catch (error) {
      console.error('[ForsuredDataCollector] Collection error:', error);
      return {
        success: false,
        error: {
          code: 'COLLECTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // ===========================================================================
  // DATA RETRIEVAL METHODS
  // ===========================================================================

  private async getUserProfile(userId: string) {
    const { data, error } = await supabaseClient
      .schema('forsured')
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[ForsuredDataCollector] Failed to get user profile:', error);
      return null;
    }
    return data;
  }

  private async getInsurancePolicies(userId: string) {
    // Get policies where user is associated (via projects they manage or participate in)
    const { data: userProjects } = await supabaseClient
      .schema('forsured')
      .from('projects')
      .select('id')
      .or(`created_by.eq.${userId},manager_id.eq.${userId}`);

    if (!userProjects || userProjects.length === 0) {
      return [];
    }

    const projectIds = userProjects.map((p: { id: string }) => p.id);

    const { data, error } = await supabaseClient
      .schema('forsured')
      .from('insurance_policies')
      .select('*, policy_provisions(*), policy_endorsements(*)')
      .in('project_id', projectIds);

    if (error) {
      console.error('[ForsuredDataCollector] Failed to get policies:', error);
      return [];
    }
    return data || [];
  }

  private async getComplianceScores(userId: string) {
    const { data, error } = await supabaseClient
      .schema('forsured')
      .from('compliance_scores')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('[ForsuredDataCollector] Failed to get compliance scores:', error);
      return [];
    }
    return data || [];
  }

  private async getComplianceIssues(userId: string) {
    // Get issues from projects user is involved with
    const { data: userProjects } = await supabaseClient
      .schema('forsured')
      .from('projects')
      .select('id')
      .or(`created_by.eq.${userId},manager_id.eq.${userId}`);

    if (!userProjects || userProjects.length === 0) {
      return [];
    }

    const projectIds = userProjects.map((p: { id: string }) => p.id);

    const { data, error } = await supabaseClient
      .schema('forsured')
      .from('compliance_issues')
      .select('*')
      .in('project_id', projectIds);

    if (error) {
      console.error('[ForsuredDataCollector] Failed to get compliance issues:', error);
      return [];
    }
    return data || [];
  }

  private async getDocuments(userId: string) {
    const { data, error } = await supabaseClient
      .schema('forsured')
      .from('documents')
      .select('*')
      .eq('uploaded_by', userId);

    if (error) {
      console.error('[ForsuredDataCollector] Failed to get documents:', error);
      return [];
    }
    return data || [];
  }

  private async getTasks(userId: string) {
    const { data, error } = await supabaseClient
      .schema('forsured')
      .from('tasks')
      .select('*')
      .or(`assigned_to.eq.${userId},created_by.eq.${userId}`);

    if (error) {
      console.error('[ForsuredDataCollector] Failed to get tasks:', error);
      return [];
    }
    return data || [];
  }

  private async getProjects(userId: string) {
    const { data, error } = await supabaseClient
      .schema('forsured')
      .from('projects')
      .select('*')
      .or(`created_by.eq.${userId},manager_id.eq.${userId}`);

    if (error) {
      console.error('[ForsuredDataCollector] Failed to get projects:', error);
      return [];
    }
    return data || [];
  }

  private async getBrokerAcknowledgements(userId: string) {
    const { data, error } = await supabaseClient
      .schema('forsured')
      .from('broker_acknowledgements')
      .select('*')
      .or(`broker_user_id.eq.${userId},client_user_id.eq.${userId}`);

    if (error) {
      console.error('[ForsuredDataCollector] Failed to get broker acknowledgements:', error);
      return [];
    }
    return data || [];
  }

  // ===========================================================================
  // SANITIZATION METHODS (Remove sensitive internal fields)
  // ===========================================================================

  private sanitizeUserProfile(profile: Record<string, unknown>): Record<string, unknown> {
    const {
      // Remove internal fields
      internal_notes,
      admin_flags,
      ...sanitized
    } = profile;
    return sanitized;
  }

  private sanitizePolicy(policy: Record<string, unknown>): Record<string, unknown> {
    return {
      id: policy.id,
      policy_number: policy.policy_number,
      policy_type: policy.policy_type,
      provider_name: policy.provider_name,
      coverage_amount: policy.coverage_amount,
      effective_date: policy.effective_date,
      expiration_date: policy.expiration_date,
      status: policy.status,
      created_at: policy.created_at,
      // Include provisions and endorsements without internal IDs
      provisions: Array.isArray(policy.policy_provisions)
        ? (policy.policy_provisions as Array<Record<string, unknown>>).map(p => ({
            provision_type: p.provision_type,
            description: p.description,
            amount: p.amount,
          }))
        : [],
      endorsements: Array.isArray(policy.policy_endorsements)
        ? (policy.policy_endorsements as Array<Record<string, unknown>>).map(e => ({
            endorsement_type: e.endorsement_type,
            description: e.description,
          }))
        : [],
    };
  }

  private sanitizeComplianceScore(score: Record<string, unknown>): Record<string, unknown> {
    return {
      score_type: score.score_type,
      score_value: score.score_value,
      factors: score.factors,
      calculated_at: score.calculated_at,
    };
  }

  private sanitizeComplianceIssue(issue: Record<string, unknown>): Record<string, unknown> {
    return {
      id: issue.id,
      issue_type: issue.issue_type,
      severity: issue.severity,
      description: issue.description,
      status: issue.status,
      created_at: issue.created_at,
      resolved_at: issue.resolved_at,
    };
  }

  private sanitizeDocument(doc: Record<string, unknown>): Record<string, unknown> {
    return {
      id: doc.id,
      file_name: doc.file_name,
      file_type: doc.file_type,
      file_size: doc.file_size,
      document_type: doc.document_type,
      uploaded_at: doc.uploaded_at,
      // Don't include file_url to prevent unauthorized access
    };
  }

  private sanitizeTask(task: Record<string, unknown>): Record<string, unknown> {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      created_at: task.created_at,
      completed_at: task.completed_at,
    };
  }

  private sanitizeProject(project: Record<string, unknown>): Record<string, unknown> {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      project_type: project.project_type,
      start_date: project.start_date,
      end_date: project.end_date,
      created_at: project.created_at,
    };
  }

  private sanitizeAcknowledgement(ack: Record<string, unknown>): Record<string, unknown> {
    return {
      id: ack.id,
      acknowledgement_type: ack.acknowledgement_type,
      status: ack.status,
      acknowledged_at: ack.acknowledged_at,
      created_at: ack.created_at,
    };
  }

  // ===========================================================================
  // AUDIT LOGGING
  // ===========================================================================

  private async logDataCollection(userId: string, exportId: string): Promise<void> {
    try {
      await supabaseClient.from('audit_log').insert({
        category: 'compliance',
        action: 'forsured_ccpa_data_collected',
        severity: 'medium',
        user_id: userId,
        resource_type: 'ccpa_export',
        record_id: exportId,
        metadata: {
          export_id: exportId,
          app_id: this.APP_ID,
          collection_type: 'ccpa_data_export',
        },
        status: 'success',
      });
    } catch (error) {
      console.error('[ForsuredDataCollector] Failed to log collection:', error);
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE & CONVENIENCE METHODS
// =============================================================================

export const forsuredDataCollector = new ForsuredDataCollectorService();

/**
 * Collect all Forsured data for a user
 */
export const collectForsuredData = (
  userId: string,
  options?: DataCollectionOptions
) => forsuredDataCollector.collectForsuredData(userId, options);
