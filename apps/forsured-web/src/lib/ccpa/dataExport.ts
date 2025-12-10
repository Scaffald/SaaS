/**
 * Data Export Service - CCPA Right to Know Implementation
 * REQ-131: CCPA Compliance Implementation
 *
 * Implements CCPA "Right to Know" by allowing users to export all their personal data.
 * Response time: 45 days (extendable to 90 days)
 * Export formats: JSON, CSV, PDF
 */

import type {
  UserDataExport,
  CCPAServiceResponse,
  ExportFormat,
} from './types';

// Supabase client - will be injected
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClient: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initializeDataExportService(client: any) {
  supabaseClient = client;
}

/**
 * Data Export Service
 * Handles CCPA Right to Know requests
 */
export class DataExportService {
  /**
   * Export all user data for CCPA Right to Know request
   *
   * @param userId - User ID to export data for
   * @param requestId - Privacy request ID
   * @param format - Export format (json, csv, pdf)
   * @returns User data export
   */
  async exportUserData(
    userId: string,
    requestId: string,
    format: ExportFormat = 'json'
  ): Promise<CCPAServiceResponse<UserDataExport>> {
    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      // 1. Get user profile data
      const userData = await this.getUserProfile(userId);
      if (!userData) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        };
      }

      // 2. Get all related data
      const [
        projects,
        policies,
        documents,
        tasks,
        activityLogs,
        relationships,
        complianceScores,
      ] = await Promise.all([
        this.getUserProjects(userId),
        this.getUserPolicies(userId),
        this.getUserDocuments(userId),
        this.getUserTasks(userId),
        this.getUserActivityLogs(userId),
        this.getUserRelationships(userId),
        this.getUserComplianceScores(userId),
      ]);

      // 3. Build data export
      const dataExport: UserDataExport = {
        export_id: `EXP-${Date.now()}`,
        exported_at: new Date().toISOString(),
        consumer: {
          user_id: userData.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          company: userData.company,
          role: userData.role,
          created_at: userData.created_at,
        },
        profile_data: this.sanitizeUserData(userData),
        projects: projects.map(p => this.sanitizeProjectData(p)),
        policies: policies.map(p => this.sanitizePolicyData(p)),
        documents: documents.map(d => this.sanitizeDocumentData(d)),
        tasks: tasks.map(t => this.sanitizeTaskData(t)),
        activity_logs: activityLogs,
        relationships: relationships,
        inferences: {
          compliance_scores: complianceScores,
        },
        collection_sources: [
          'Direct from user (profile, uploads)',
          'Platform usage (activity logs)',
          'Document extraction (OCR/AI processing)',
        ],
        business_purposes: [
          'Account management',
          'Service delivery (insurance compliance tracking)',
          'Compliance verification',
          'Communication with project stakeholders',
          'Security and fraud prevention',
        ],
        third_parties: [
          'Vercel (frontend hosting)',
          'Supabase (database)',
          'AWS S3 (document storage)',
          'AWS Textract/OpenAI (document processing)',
          'SendGrid (transactional emails)',
        ],
        retention_periods: {
          user_profile: 'Active account + 90 days after deletion',
          project_data: '7 years (insurance industry standard)',
          policy_data: '7 years from policy expiration',
          documents: '7 years from upload date',
          activity_logs: '2 years',
        },
      };

      // 4. Update privacy request with export info
      await this.updatePrivacyRequestWithExport(requestId, format);

      // 5. Log the export for audit trail
      await this.logDataExport(userId, requestId);

      return {
        success: true,
        data: dataExport,
      };
    } catch (error) {
      console.error('Data export error:', error);
      return {
        success: false,
        error: {
          code: 'EXPORT_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Generate export file (JSON, CSV, or PDF)
   *
   * @param dataExport - User data export
   * @param format - Export format
   * @returns File content as string
   */
  async generateExportFile(
    dataExport: UserDataExport,
    format: ExportFormat
  ): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(dataExport, null, 2);

      case 'csv':
        return this.convertToCSV(dataExport);

      case 'pdf':
        // TODO: Implement PDF generation (requires PDF library)
        throw new Error('PDF export not yet implemented');

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Upload export file to secure storage (S3)
   *
   * @param fileContent - Export file content
   * @param format - File format
   * @param requestId - Privacy request ID
   * @returns S3 URL
   */
  async uploadExportFile(
    fileContent: string,
    format: ExportFormat,
    requestId: string
  ): Promise<string> {
    // TODO: Implement S3 upload when storage is configured
    // For now, return a placeholder URL
    const fileName = `exports/${requestId}.${format}`;
    console.log(`Would upload to S3: ${fileName} (${fileContent.length} bytes)`);

    // Placeholder URL
    return `https://forsured-exports.s3.amazonaws.com/${fileName}`;
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  /**
   * Get user profile data
   */
  private async getUserProfile(userId: string) {
    const { data, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }

    return data;
  }

  /**
   * Get user projects
   */
  private async getUserProjects(userId: string) {
    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .or(`created_by.eq.${userId},manager_id.eq.${userId}`);

    if (error) {
      console.error('Failed to get user projects:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user policies
   */
  private async getUserPolicies(userId: string) {
    // Get policies from projects user is associated with
    const { data, error } = await supabaseClient
      .from('policies')
      .select('*, projects!inner(*)')
      .or(`projects.created_by.eq.${userId},projects.manager_id.eq.${userId}`);

    if (error) {
      console.error('Failed to get user policies:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user documents
   */
  private async getUserDocuments(userId: string) {
    const { data, error } = await supabaseClient
      .from('documents')
      .select('*')
      .eq('uploaded_by', userId);

    if (error) {
      console.error('Failed to get user documents:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user tasks
   */
  private async getUserTasks(userId: string) {
    const { data, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .or(`assigned_to.eq.${userId},created_by.eq.${userId}`);

    if (error) {
      console.error('Failed to get user tasks:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user activity logs (limited to last 2 years)
   */
  private async getUserActivityLogs(userId: string) {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const { data, error } = await supabaseClient
      .from('audit_log')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', twoYearsAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000); // Limit to prevent excessive data

    if (error) {
      console.error('Failed to get user activity logs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user relationships (GC-subcontractor, broker-client)
   */
  private async getUserRelationships(userId: string) {
    // TODO: Implement when relationships table exists
    return [];
  }

  /**
   * Get user compliance scores
   */
  private async getUserComplianceScores(userId: string) {
    // TODO: Implement when compliance_scores table exists
    return [];
  }

  /**
   * Sanitize user data (remove sensitive fields)
   */
  private sanitizeUserData(userData: any) {
    const { password_hash, ...sanitized } = userData;
    return sanitized;
  }

  /**
   * Sanitize project data (redact other users' PII)
   */
  private sanitizeProjectData(projectData: any) {
    // Return only data relevant to the requesting user
    return {
      id: projectData.id,
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
      created_at: projectData.created_at,
      // Remove other users' personal information
    };
  }

  /**
   * Sanitize policy data
   */
  private sanitizePolicyData(policyData: any) {
    return {
      id: policyData.id,
      policy_number: policyData.policy_number,
      provider: policyData.provider,
      coverage_amount: policyData.coverage_amount,
      effective_date: policyData.effective_date,
      expiration_date: policyData.expiration_date,
    };
  }

  /**
   * Sanitize document data
   */
  private sanitizeDocumentData(documentData: any) {
    return {
      id: documentData.id,
      file_name: documentData.file_name,
      file_type: documentData.file_type,
      file_size: documentData.file_size,
      uploaded_at: documentData.uploaded_at,
      // Don't include file_url to prevent unauthorized access
    };
  }

  /**
   * Sanitize task data
   */
  private sanitizeTaskData(taskData: any) {
    return {
      id: taskData.id,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      due_date: taskData.due_date,
      created_at: taskData.created_at,
    };
  }

  /**
   * Convert data export to CSV format
   */
  private convertToCSV(dataExport: UserDataExport): string {
    const sections: string[] = [];

    // Consumer Information
    sections.push('=== CONSUMER INFORMATION ===');
    sections.push(this.objectToCSV(dataExport.consumer));

    // Projects
    if (dataExport.projects && dataExport.projects.length > 0) {
      sections.push('\n=== PROJECTS ===');
      sections.push(this.arrayToCSV(dataExport.projects));
    }

    // Policies
    if (dataExport.policies && dataExport.policies.length > 0) {
      sections.push('\n=== INSURANCE POLICIES ===');
      sections.push(this.arrayToCSV(dataExport.policies));
    }

    // Documents
    if (dataExport.documents && dataExport.documents.length > 0) {
      sections.push('\n=== DOCUMENTS ===');
      sections.push(this.arrayToCSV(dataExport.documents));
    }

    // Collection Sources
    sections.push('\n=== DATA COLLECTION SOURCES ===');
    sections.push(dataExport.collection_sources.join('\n'));

    // Business Purposes
    sections.push('\n=== BUSINESS PURPOSES ===');
    sections.push(dataExport.business_purposes.join('\n'));

    // Third Parties
    sections.push('\n=== THIRD PARTY RECIPIENTS ===');
    sections.push(dataExport.third_parties.join('\n'));

    return sections.join('\n');
  }

  /**
   * Convert object to CSV row
   */
  private objectToCSV(obj: Record<string, any>): string {
    const headers = Object.keys(obj);
    const values = Object.values(obj).map(v =>
      v === null || v === undefined ? '' : String(v)
    );

    return [
      headers.join(','),
      values.map(v => `"${v}"`).join(','),
    ].join('\n');
  }

  /**
   * Convert array of objects to CSV
   */
  private arrayToCSV(arr: Array<Record<string, any>>): string {
    if (arr.length === 0) return '';

    const headers = Object.keys(arr[0]);
    const rows = arr.map(obj =>
      headers
        .map(key => {
          const value = obj[key];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value);
        })
        .map(v => `"${v}"`)
        .join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Update privacy request with export file info
   */
  private async updatePrivacyRequestWithExport(
    requestId: string,
    format: ExportFormat
  ): Promise<void> {
    const { error } = await supabaseClient
      .from('privacy_requests')
      .update({
        export_format: format,
        export_generated_at: new Date().toISOString(),
        export_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        status: 'completed',
        completed_date: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      console.error('Failed to update privacy request:', error);
    }
  }

  /**
   * Log data export for audit trail
   */
  private async logDataExport(userId: string, requestId: string): Promise<void> {
    await supabaseClient.from('audit_log').insert({
      category: 'compliance',
      action: 'data_export_generated',
      severity: 'medium',
      user_id: userId,
      resource_type: 'privacy_request',
      record_id: requestId,
      metadata: {
        request_id: requestId,
        export_type: 'ccpa_right_to_know',
      },
      status: 'success',
    });
  }
}

// =============================================================================
// SINGLETON INSTANCE & CONVENIENCE METHODS
// =============================================================================

export const dataExportService = new DataExportService();

/**
 * Export user data for CCPA Right to Know request
 *
 * @param userId - User ID to export data for
 * @param requestId - Privacy request ID
 * @param format - Export format (json, csv, pdf)
 * @returns User data export
 */
export const exportUserData = (
  userId: string,
  requestId: string,
  format: ExportFormat = 'json'
) => dataExportService.exportUserData(userId, requestId, format);

/**
 * Generate export file content
 *
 * @param dataExport - User data export
 * @param format - Export format
 * @returns File content as string
 */
export const generateExportFile = (
  dataExport: UserDataExport,
  format: ExportFormat
) => dataExportService.generateExportFile(dataExport, format);
