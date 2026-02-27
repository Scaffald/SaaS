/**
 * Forsured Deletion Handler - CCPA Right to Delete Implementation
 * CCPA Compliance Implementation
 *
 * Handles CCPA deletion requests for Forsured-specific data.
 * Implements data retention requirements:
 * - Financial records (policies): 7 years (anonymize user_id)
 * - Compliance records: 5 years (anonymize user_id)
 * - Documents: Delete immediately
 * - Tasks: Delete if sole participant, anonymize otherwise
 *
 * Called via webhook from Scaffald when a user requests data deletion.
 */

import type { CCPAServiceResponse, DeletionResult } from './types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Deletion scope options
 */
export interface DeletionScope {
  userProfile: boolean;
  documents: boolean;
  tasks: boolean;
  projects: boolean;
  policies: boolean;
  complianceRecords: boolean;
  brokerAcknowledgements: boolean;
}

/**
 * Deletion confirmation to send back to Scaffald
 */
export interface ForsuredDeletionConfirmation {
  app_id: string;
  app_name: string;
  request_id: string;
  user_id: string;
  processed_at: string;
  deletion_summary: {
    deleted_records: Record<string, number>;
    anonymized_records: Record<string, number>;
    retained_records: Array<{
      table: string;
      count: number;
      reason: string;
      retention_until: string;
    }>;
  };
  errors: string[];
  success: boolean;
}

/**
 * Records that cannot be deleted due to retention requirements
 */
interface RetentionRecord {
  table: string;
  count: number;
  reason: string;
  retention_until: string;
}

// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================

// Supabase client - injected at initialization
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClient: any = null;

/**
 * Initialize the Forsured deletion handler with a Supabase client
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initializeForsuredDeletionHandler(client: any): void {
  supabaseClient = client;
}

/**
 * Forsured Deletion Handler Service
 * Handles CCPA deletion requests with proper retention
 */
export class ForsuredDeletionHandlerService {
  private readonly APP_ID = 'forsured';
  private readonly APP_NAME = 'Forsured Insurance Compliance';

  // Retention periods in years
  private readonly FINANCIAL_RETENTION_YEARS = 7;
  private readonly COMPLIANCE_RETENTION_YEARS = 5;
  private readonly PROJECT_RETENTION_YEARS = 7;

  /**
   * Handle CCPA deletion request for a user
   *
   * @param userId - User ID to delete data for
   * @param requestId - CCPA request ID from Scaffald
   * @param scope - What data to delete (defaults to all)
   * @returns Deletion confirmation
   */
  async handleCCPADeletion(
    userId: string,
    requestId: string,
    scope?: Partial<DeletionScope>
  ): Promise<CCPAServiceResponse<ForsuredDeletionConfirmation>> {
    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      // Default scope: delete/anonymize everything
      const deletionScope: DeletionScope = {
        userProfile: scope?.userProfile ?? true,
        documents: scope?.documents ?? true,
        tasks: scope?.tasks ?? true,
        projects: scope?.projects ?? true,
        policies: scope?.policies ?? true,
        complianceRecords: scope?.complianceRecords ?? true,
        brokerAcknowledgements: scope?.brokerAcknowledgements ?? true,
      };

      const deletedRecords: Record<string, number> = {};
      const anonymizedRecords: Record<string, number> = {};
      const retainedRecords: RetentionRecord[] = [];
      const errors: string[] = [];

      // 1. Delete user profile (immediate deletion allowed)
      if (deletionScope.userProfile) {
        const profileResult = await this.deleteUserProfile(userId);
        if (profileResult.success) {
          deletedRecords['user_profiles'] = profileResult.count;
        } else if (profileResult.error) {
          errors.push(profileResult.error);
        }
      }

      // 2. Delete documents (immediate deletion allowed)
      if (deletionScope.documents) {
        const docsResult = await this.deleteDocuments(userId);
        if (docsResult.success) {
          deletedRecords['documents'] = docsResult.count;
        } else if (docsResult.error) {
          errors.push(docsResult.error);
        }
      }

      // 3. Handle tasks (delete if sole participant, anonymize otherwise)
      if (deletionScope.tasks) {
        const tasksResult = await this.processTasks(userId);
        deletedRecords['tasks'] = tasksResult.deleted;
        anonymizedRecords['tasks'] = tasksResult.anonymized;
        if (tasksResult.error) {
          errors.push(tasksResult.error);
        }
      }

      // 4. Anonymize compliance scores (5-year retention)
      if (deletionScope.complianceRecords) {
        const scoresResult = await this.anonymizeComplianceScores(userId);
        anonymizedRecords['compliance_scores'] = scoresResult.count;
        if (scoresResult.count > 0) {
          retainedRecords.push({
            table: 'compliance_scores',
            count: scoresResult.count,
            reason: 'Compliance audit trail (5-year retention)',
            retention_until: this.getRetentionDate(this.COMPLIANCE_RETENTION_YEARS),
          });
        }
        if (scoresResult.error) {
          errors.push(scoresResult.error);
        }

        // Anonymize compliance issues
        const issuesResult = await this.anonymizeComplianceIssues(userId);
        anonymizedRecords['compliance_issues'] = issuesResult.count;
        if (issuesResult.count > 0) {
          retainedRecords.push({
            table: 'compliance_issues',
            count: issuesResult.count,
            reason: 'Compliance audit trail (5-year retention)',
            retention_until: this.getRetentionDate(this.COMPLIANCE_RETENTION_YEARS),
          });
        }
        if (issuesResult.error) {
          errors.push(issuesResult.error);
        }
      }

      // 5. Anonymize insurance policies (7-year retention required)
      if (deletionScope.policies) {
        const policiesResult = await this.anonymizeInsurancePolicies(userId);
        anonymizedRecords['insurance_policies'] = policiesResult.count;
        if (policiesResult.count > 0) {
          retainedRecords.push({
            table: 'insurance_policies',
            count: policiesResult.count,
            reason: 'Financial/insurance records (7-year regulatory retention)',
            retention_until: this.getRetentionDate(this.FINANCIAL_RETENTION_YEARS),
          });
        }
        if (policiesResult.error) {
          errors.push(policiesResult.error);
        }
      }

      // 6. Anonymize projects (7-year retention)
      if (deletionScope.projects) {
        const projectsResult = await this.anonymizeProjects(userId);
        anonymizedRecords['projects'] = projectsResult.count;
        if (projectsResult.count > 0) {
          retainedRecords.push({
            table: 'projects',
            count: projectsResult.count,
            reason: 'Project records (7-year retention)',
            retention_until: this.getRetentionDate(this.PROJECT_RETENTION_YEARS),
          });
        }
        if (projectsResult.error) {
          errors.push(projectsResult.error);
        }
      }

      // 7. Handle broker acknowledgements
      if (deletionScope.brokerAcknowledgements) {
        const ackResult = await this.processBrokerAcknowledgements(userId);
        deletedRecords['broker_acknowledgements'] = ackResult.deleted;
        anonymizedRecords['broker_acknowledgements'] = ackResult.anonymized;
        if (ackResult.error) {
          errors.push(ackResult.error);
        }
      }

      // Log the deletion for audit trail
      await this.logDeletion(userId, requestId, deletedRecords, anonymizedRecords);

      const confirmation: ForsuredDeletionConfirmation = {
        app_id: this.APP_ID,
        app_name: this.APP_NAME,
        request_id: requestId,
        user_id: userId,
        processed_at: new Date().toISOString(),
        deletion_summary: {
          deleted_records: deletedRecords,
          anonymized_records: anonymizedRecords,
          retained_records: retainedRecords,
        },
        errors,
        success: errors.length === 0,
      };

      return {
        success: errors.length === 0,
        data: confirmation,
        error: errors.length > 0 ? {
          code: 'PARTIAL_DELETION',
          message: `Completed with ${errors.length} error(s)`,
          details: { errors },
        } : undefined,
      };
    } catch (error) {
      console.error('[ForsuredDeletionHandler] Deletion error:', error);
      return {
        success: false,
        error: {
          code: 'DELETION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // ===========================================================================
  // DELETION METHODS
  // ===========================================================================

  private async deleteUserProfile(userId: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const { data, error } = await supabaseClient
        .schema('forsured')
        .from('user_profiles')
        .delete()
        .eq('user_id', userId)
        .select('id');

      if (error) {
        return { success: false, count: 0, error: `Failed to delete user profile: ${error.message}` };
      }

      return { success: true, count: data?.length || 0 };
    } catch (error) {
      return { success: false, count: 0, error: `User profile deletion error: ${error}` };
    }
  }

  private async deleteDocuments(userId: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      // Get document IDs first for storage cleanup
      const { data: docs } = await supabaseClient
        .schema('forsured')
        .from('documents')
        .select('id, storage_path')
        .eq('uploaded_by', userId);

      if (docs && docs.length > 0) {
        // Delete from storage (if paths exist)
        const storagePaths = docs
          .filter((d: { storage_path?: string }) => d.storage_path)
          .map((d: { storage_path: string }) => d.storage_path);

        if (storagePaths.length > 0) {
          await supabaseClient.storage
            .from('documents')
            .remove(storagePaths);
        }
      }

      // Delete document records
      const { data, error } = await supabaseClient
        .schema('forsured')
        .from('documents')
        .delete()
        .eq('uploaded_by', userId)
        .select('id');

      if (error) {
        return { success: false, count: 0, error: `Failed to delete documents: ${error.message}` };
      }

      return { success: true, count: data?.length || 0 };
    } catch (error) {
      return { success: false, count: 0, error: `Document deletion error: ${error}` };
    }
  }

  private async processTasks(userId: string): Promise<{ deleted: number; anonymized: number; error?: string }> {
    try {
      // Get tasks where user is involved
      const { data: tasks } = await supabaseClient
        .schema('forsured')
        .from('tasks')
        .select('id, assigned_to, created_by')
        .or(`assigned_to.eq.${userId},created_by.eq.${userId}`);

      if (!tasks || tasks.length === 0) {
        return { deleted: 0, anonymized: 0 };
      }

      let deleted = 0;
      let anonymized = 0;

      for (const task of tasks) {
        const isSoleParticipant =
          (task.assigned_to === userId && task.created_by === userId) ||
          (task.assigned_to === userId && !task.created_by) ||
          (!task.assigned_to && task.created_by === userId);

        if (isSoleParticipant) {
          // Delete task entirely
          await supabaseClient
            .schema('forsured')
            .from('tasks')
            .delete()
            .eq('id', task.id);
          deleted++;
        } else {
          // Anonymize user's involvement
          const updates: Record<string, string | null> = {};
          if (task.assigned_to === userId) {
            updates.assigned_to = null;
          }
          if (task.created_by === userId) {
            updates.created_by = null;
          }

          await supabaseClient
            .schema('forsured')
            .from('tasks')
            .update(updates)
            .eq('id', task.id);
          anonymized++;
        }
      }

      return { deleted, anonymized };
    } catch (error) {
      return { deleted: 0, anonymized: 0, error: `Task processing error: ${error}` };
    }
  }

  // ===========================================================================
  // ANONYMIZATION METHODS (For records with retention requirements)
  // ===========================================================================

  private async anonymizeComplianceScores(userId: string): Promise<{ count: number; error?: string }> {
    try {
      const { data, error } = await supabaseClient
        .schema('forsured')
        .from('compliance_scores')
        .update({
          user_id: null,
          anonymized_at: new Date().toISOString(),
          anonymization_reason: 'ccpa_deletion_request',
        })
        .eq('user_id', userId)
        .select('id');

      if (error) {
        return { count: 0, error: `Failed to anonymize compliance scores: ${error.message}` };
      }

      return { count: data?.length || 0 };
    } catch (error) {
      return { count: 0, error: `Compliance scores anonymization error: ${error}` };
    }
  }

  private async anonymizeComplianceIssues(userId: string): Promise<{ count: number; error?: string }> {
    try {
      // Get projects associated with the user
      const { data: userProjects } = await supabaseClient
        .schema('forsured')
        .from('projects')
        .select('id')
        .or(`created_by.eq.${userId},manager_id.eq.${userId}`);

      if (!userProjects || userProjects.length === 0) {
        return { count: 0 };
      }

      const projectIds = userProjects.map((p: { id: string }) => p.id);

      // Anonymize issues by removing user-identifying information
      const { data, error } = await supabaseClient
        .schema('forsured')
        .from('compliance_issues')
        .update({
          reported_by: null,
          resolved_by: null,
          anonymized_at: new Date().toISOString(),
        })
        .in('project_id', projectIds)
        .or(`reported_by.eq.${userId},resolved_by.eq.${userId}`)
        .select('id');

      if (error) {
        return { count: 0, error: `Failed to anonymize compliance issues: ${error.message}` };
      }

      return { count: data?.length || 0 };
    } catch (error) {
      return { count: 0, error: `Compliance issues anonymization error: ${error}` };
    }
  }

  private async anonymizeInsurancePolicies(userId: string): Promise<{ count: number; error?: string }> {
    try {
      // Get projects where user is manager/creator
      const { data: userProjects } = await supabaseClient
        .schema('forsured')
        .from('projects')
        .select('id')
        .or(`created_by.eq.${userId},manager_id.eq.${userId}`);

      if (!userProjects || userProjects.length === 0) {
        return { count: 0 };
      }

      const projectIds = userProjects.map((p: { id: string }) => p.id);

      // Anonymize policies (keep financial data, remove user association)
      const { data, error } = await supabaseClient
        .schema('forsured')
        .from('insurance_policies')
        .update({
          uploaded_by: null,
          contact_name: '[REDACTED]',
          contact_email: '[REDACTED]',
          contact_phone: '[REDACTED]',
          anonymized_at: new Date().toISOString(),
          anonymization_reason: 'ccpa_deletion_request',
        })
        .in('project_id', projectIds)
        .eq('uploaded_by', userId)
        .select('id');

      if (error) {
        return { count: 0, error: `Failed to anonymize policies: ${error.message}` };
      }

      return { count: data?.length || 0 };
    } catch (error) {
      return { count: 0, error: `Policy anonymization error: ${error}` };
    }
  }

  private async anonymizeProjects(userId: string): Promise<{ count: number; error?: string }> {
    try {
      const { data, error } = await supabaseClient
        .schema('forsured')
        .from('projects')
        .update({
          created_by: null,
          manager_id: null,
          manager_name: '[REDACTED]',
          manager_email: '[REDACTED]',
          anonymized_at: new Date().toISOString(),
        })
        .or(`created_by.eq.${userId},manager_id.eq.${userId}`)
        .select('id');

      if (error) {
        return { count: 0, error: `Failed to anonymize projects: ${error.message}` };
      }

      return { count: data?.length || 0 };
    } catch (error) {
      return { count: 0, error: `Project anonymization error: ${error}` };
    }
  }

  private async processBrokerAcknowledgements(userId: string): Promise<{ deleted: number; anonymized: number; error?: string }> {
    try {
      // Get acknowledgements where user is involved
      const { data: acks } = await supabaseClient
        .schema('forsured')
        .from('broker_acknowledgements')
        .select('id, broker_user_id, client_user_id')
        .or(`broker_user_id.eq.${userId},client_user_id.eq.${userId}`);

      if (!acks || acks.length === 0) {
        return { deleted: 0, anonymized: 0 };
      }

      let deleted = 0;
      let anonymized = 0;

      for (const ack of acks) {
        const isBothParties = ack.broker_user_id === userId && ack.client_user_id === userId;

        if (isBothParties) {
          // Delete entirely if user is both parties (shouldn't happen, but handle it)
          await supabaseClient
            .schema('forsured')
            .from('broker_acknowledgements')
            .delete()
            .eq('id', ack.id);
          deleted++;
        } else {
          // Anonymize user's side of the relationship
          const updates: Record<string, string | null> = {};
          if (ack.broker_user_id === userId) {
            updates.broker_user_id = null;
            updates.broker_name = '[REDACTED]';
            updates.broker_email = '[REDACTED]';
          }
          if (ack.client_user_id === userId) {
            updates.client_user_id = null;
            updates.client_name = '[REDACTED]';
            updates.client_email = '[REDACTED]';
          }

          await supabaseClient
            .schema('forsured')
            .from('broker_acknowledgements')
            .update({
              ...updates,
              anonymized_at: new Date().toISOString(),
            })
            .eq('id', ack.id);
          anonymized++;
        }
      }

      return { deleted, anonymized };
    } catch (error) {
      return { deleted: 0, anonymized: 0, error: `Broker acknowledgement processing error: ${error}` };
    }
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  private getRetentionDate(years: number): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() + years);
    return date.toISOString();
  }

  private async logDeletion(
    userId: string,
    requestId: string,
    deletedRecords: Record<string, number>,
    anonymizedRecords: Record<string, number>
  ): Promise<void> {
    try {
      await supabaseClient.from('audit_log').insert({
        category: 'compliance',
        action: 'forsured_ccpa_deletion_processed',
        severity: 'high',
        user_id: userId,
        resource_type: 'ccpa_request',
        record_id: requestId,
        metadata: {
          request_id: requestId,
          app_id: this.APP_ID,
          deletion_type: 'ccpa_right_to_delete',
          deleted_records: deletedRecords,
          anonymized_records: anonymizedRecords,
        },
        status: 'success',
      });
    } catch (error) {
      console.error('[ForsuredDeletionHandler] Failed to log deletion:', error);
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE & CONVENIENCE METHODS
// =============================================================================

export const forsuredDeletionHandler = new ForsuredDeletionHandlerService();

/**
 * Handle CCPA deletion request for a user
 */
export const handleCCPADeletion = (
  userId: string,
  requestId: string,
  scope?: Partial<DeletionScope>
) => forsuredDeletionHandler.handleCCPADeletion(userId, requestId, scope);
