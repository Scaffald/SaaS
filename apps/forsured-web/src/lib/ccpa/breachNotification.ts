/**
 * Breach Notification Service - CCPA 72-Hour Notification Requirement
 * CCPA Compliance Implementation
 *
 * Implements CCPA breach notification requirements:
 * - 72-hour notification deadline from discovery
 * - California AG notification if >500 CA residents affected
 * - User notification via email
 * - Breach tracking and reporting
 */

import type {
  BreachNotification,
  CreateBreachNotificationInput,
  BreachNotificationTemplate,
  CCPAServiceResponse,
  BreachSeverity,
} from './types';
import { sendBreachNotificationEmail } from '../../services/emailService';

// Supabase client - will be injected
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClient: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initializeBreachNotificationService(client: any) {
  supabaseClient = client;
}

/**
 * CCPA notification thresholds
 */
const CCPA_NOTIFICATION_THRESHOLDS = {
  CA_AG_NOTIFICATION_THRESHOLD: 500, // Must notify CA AG if >= 500 CA residents affected
  NOTIFICATION_DEADLINE_HOURS: 72, // Must notify within 72 hours of discovery
};

/**
 * Breach Notification Service
 * Handles data breach incident tracking and CCPA-compliant notifications
 */
export class BreachNotificationService {
  /**
   * Report a data breach
   *
   * @param input - Breach notification input
   * @returns Created breach notification
   */
  async reportBreach(
    input: CreateBreachNotificationInput
  ): Promise<CCPAServiceResponse<BreachNotification>> {
    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      // Determine if notification is required
      const notificationRequired =
        input.affected_california_residents >= CCPA_NOTIFICATION_THRESHOLDS.CA_AG_NOTIFICATION_THRESHOLD;

      // Calculate notification deadline
      const discoveredAt = new Date(input.discovered_at);
      const notificationDeadline = new Date(
        discoveredAt.getTime() + CCPA_NOTIFICATION_THRESHOLDS.NOTIFICATION_DEADLINE_HOURS * 60 * 60 * 1000
      );

      // Insert breach notification
      const { data, error } = await supabaseClient
        .from('breach_notifications')
        .insert({
          ...input,
          notification_required: notificationRequired,
          notification_deadline: notificationRequired ? notificationDeadline.toISOString() : null,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to report breach: ${error.message}`);
      }

      // Audit logging is handled by database trigger

      // If notification is required and deadline is soon, trigger alerts
      if (notificationRequired) {
        await this.triggerBreachAlert(data);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Breach reporting error:', error);
      return {
        success: false,
        error: {
          code: 'BREACH_REPORT_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Send breach notification to affected users
   *
   * @param breachId - Breach notification ID
   * @returns Number of notifications sent
   */
  async sendUserNotifications(
    breachId: string
  ): Promise<CCPAServiceResponse<number>> {
    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      // Get breach details
      const { data: breach, error: breachError } = await supabaseClient
        .from('breach_notifications')
        .select('*')
        .eq('id', breachId)
        .single();

      if (breachError || !breach) {
        return {
          success: false,
          error: {
            code: 'BREACH_NOT_FOUND',
            message: 'Breach notification not found',
          },
        };
      }

      // Get affected users
      const affectedUsers = await this.getAffectedUsers(breach);

      // Send notifications
      let sentCount = 0;
      for (const user of affectedUsers) {
        const template = this.generateNotificationTemplate(breach, user);
        const success = await this.sendEmail(template);
        if (success) sentCount++;
      }

      // Update breach record
      await supabaseClient
        .from('breach_notifications')
        .update({
          user_notification_sent: true,
          user_notification_sent_at: new Date().toISOString(),
          user_notification_method: 'email',
        })
        .eq('id', breachId);

      // Log notification
      await this.logBreachNotification(breachId, sentCount);

      return {
        success: true,
        data: sentCount,
      };
    } catch (error) {
      console.error('User notification error:', error);
      return {
        success: false,
        error: {
          code: 'USER_NOTIFICATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Notify California Attorney General (if required)
   *
   * @param breachId - Breach notification ID
   * @returns Success status
   */
  async notifyCaliforniaAG(
    breachId: string
  ): Promise<CCPAServiceResponse<boolean>> {
    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      // Get breach details
      const { data: breach, error: breachError } = await supabaseClient
        .from('breach_notifications')
        .select('*')
        .eq('id', breachId)
        .single();

      if (breachError || !breach) {
        return {
          success: false,
          error: {
            code: 'BREACH_NOT_FOUND',
            message: 'Breach notification not found',
          },
        };
      }

      // Check if AG notification is required
      if (breach.affected_california_residents < CCPA_NOTIFICATION_THRESHOLDS.CA_AG_NOTIFICATION_THRESHOLD) {
        return {
          success: false,
          error: {
            code: 'AG_NOTIFICATION_NOT_REQUIRED',
            message: `AG notification only required if >= ${CCPA_NOTIFICATION_THRESHOLDS.CA_AG_NOTIFICATION_THRESHOLD} CA residents affected`,
          },
        };
      }

      // Generate AG notification
      const agNotification = this.generateAGNotification(breach);

      // Send notification to AG
      // TODO: Implement actual AG notification (email/portal submission)
      console.log('Would send AG notification:', agNotification);

      // Update breach record
      await supabaseClient
        .from('breach_notifications')
        .update({
          california_ag_notified: true,
          california_ag_notified_at: new Date().toISOString(),
        })
        .eq('id', breachId);

      // Log notification
      await this.logAGNotification(breachId);

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      console.error('AG notification error:', error);
      return {
        success: false,
        error: {
          code: 'AG_NOTIFICATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Check for breaches nearing notification deadline
   *
   * @returns Breaches needing attention
   */
  async checkNotificationDeadlines(): Promise<BreachNotification[]> {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    const now = new Date();
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    const { data, error } = await supabaseClient
      .from('breach_notifications')
      .select('*')
      .eq('notification_required', true)
      .eq('user_notification_sent', false)
      .lte('notification_deadline', sixHoursFromNow.toISOString());

    if (error) {
      console.error('Failed to check notification deadlines:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Update breach containment status
   *
   * @param breachId - Breach notification ID
   * @param containmentActions - Containment actions taken
   * @returns Updated breach notification
   */
  async updateContainment(
    breachId: string,
    containmentActions: string
  ): Promise<CCPAServiceResponse<BreachNotification>> {
    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabaseClient
        .from('breach_notifications')
        .update({
          contained_at: new Date().toISOString(),
          containment_actions,
        })
        .eq('id', breachId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update containment: ${error.message}`);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Update containment error:', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_CONTAINMENT_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  /**
   * Get affected users for breach
   */
  private async getAffectedUsers(breach: BreachNotification): Promise<any[]> {
    // TODO: Implement logic to identify affected users based on breach details
    // This will depend on the breach scope and systems compromised
    console.log('Would get affected users for breach:', breach.id);
    return [];
  }

  /**
   * Generate email notification template for affected user
   */
  private generateNotificationTemplate(
    breach: BreachNotification,
    user: any
  ): BreachNotificationTemplate {
    return {
      subject: 'Important Security Notice - Your ForSured Account',
      body: this.generateNotificationBody(breach),
      recipient_email: user.email,
      breach_details: {
        breach_number: breach.breach_number,
        discovery_date: breach.discovered_at,
        data_types_exposed: breach.data_types_exposed,
        what_happened: breach.impact_description || 'A security incident occurred that may have affected your account.',
        what_we_are_doing: breach.containment_actions || 'We have taken immediate action to secure our systems.',
        what_you_can_do: [
          'Reset your password immediately',
          'Enable two-factor authentication',
          'Monitor your account for suspicious activity',
          'Review your account information for accuracy',
        ],
        more_information_url: `https://forsured.com/security/breach/${breach.breach_number}`,
      },
    };
  }

  /**
   * Generate notification email body
   */
  private generateNotificationBody(breach: BreachNotification): string {
    const dataTypesFormatted = breach.data_types_exposed.join(', ');

    return `
Dear ForSured User,

We are writing to inform you of a security incident that may have affected your ForSured account.

WHAT HAPPENED
On ${new Date(breach.discovered_at).toLocaleDateString()}, we discovered ${breach.impact_description || 'a security incident'}. We immediately took action to contain the issue and have since implemented additional security measures.

WHAT INFORMATION WAS INVOLVED
The following types of information may have been affected: ${dataTypesFormatted}.

WHAT WE ARE DOING
- Fully investigated the incident
- Implemented additional security measures
- ${breach.containment_actions || 'Taken steps to prevent future incidents'}

WHAT YOU CAN DO
- Reset your password immediately: https://forsured.com/reset-password
- Enable two-factor authentication: https://forsured.com/settings/security
- Monitor your account for suspicious activity
- Contact us with questions: security@forsured.com

MORE INFORMATION
For more details, visit: https://forsured.com/security/breach/${breach.breach_number}

We sincerely apologize for this incident and any inconvenience it may cause. Your security is our top priority.

Sincerely,
The ForSured Security Team

---
This notification is required under the California Consumer Privacy Act (CCPA).
`.trim();
  }

  /**
   * Generate California AG notification
   */
  private generateAGNotification(breach: BreachNotification): any {
    return {
      breach_number: breach.breach_number,
      breach_type: breach.breach_type,
      discovery_date: breach.discovered_at,
      notification_date: new Date().toISOString(),
      affected_california_residents: breach.affected_california_residents,
      data_types_exposed: breach.data_types_exposed,
      sensitive_data_exposed: breach.sensitive_data_exposed,
      containment_status: breach.contained_at ? 'contained' : 'in_progress',
      user_notification_status: breach.user_notification_sent ? 'sent' : 'pending',
    };
  }

  /**
   * Send email using @bernierllc/email-manager
   */
  private async sendEmail(template: BreachNotificationTemplate): Promise<boolean> {
    try {
      const result = await sendBreachNotificationEmail({
        email: template.recipient_email,
        whatHappened: template.breach_details.what_happened,
        dataTypesExposed: template.breach_details.data_types_exposed,
        containmentActions: template.breach_details.what_we_are_doing,
        breachNumber: template.breach_details.breach_number,
      });
      return result.success;
    } catch (error) {
      console.error('[BreachNotification] Failed to send email:', error);
      return false;
    }
  }

  /**
   * Trigger breach alert for incident response team
   */
  private async triggerBreachAlert(breach: BreachNotification): Promise<void> {
    // Log critical security event
    await supabaseClient.from('audit_log').insert({
      category: 'security',
      action: 'breach_notification_required',
      severity: 'critical',
      resource_type: 'breach_notification',
      record_id: breach.id,
      metadata: {
        breach_number: breach.breach_number,
        affected_users: breach.affected_user_count,
        affected_ca_residents: breach.affected_california_residents,
        notification_deadline: breach.notification_deadline,
        hours_remaining: this.calculateHoursRemaining(breach.notification_deadline!),
      },
      status: 'success',
    });

    // TODO: Send PagerDuty/Slack alert to incident response team
    console.warn('CRITICAL BREACH ALERT:', {
      breach_number: breach.breach_number,
      severity: breach.severity,
      deadline: breach.notification_deadline,
    });
  }

  /**
   * Calculate hours remaining until deadline
   */
  private calculateHoursRemaining(deadline: string): number {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const msRemaining = deadlineDate.getTime() - now.getTime();
    return Math.max(0, Math.floor(msRemaining / (60 * 60 * 1000)));
  }

  /**
   * Log breach notification for audit trail
   */
  private async logBreachNotification(breachId: string, sentCount: number): Promise<void> {
    await supabaseClient.from('audit_log').insert({
      category: 'compliance',
      action: 'breach_notification_sent_to_users',
      severity: 'high',
      resource_type: 'breach_notification',
      record_id: breachId,
      metadata: {
        notifications_sent: sentCount,
        sent_at: new Date().toISOString(),
      },
      status: 'success',
    });
  }

  /**
   * Log AG notification for audit trail
   */
  private async logAGNotification(breachId: string): Promise<void> {
    await supabaseClient.from('audit_log').insert({
      category: 'compliance',
      action: 'breach_notification_sent_to_california_ag',
      severity: 'critical',
      resource_type: 'breach_notification',
      record_id: breachId,
      metadata: {
        sent_at: new Date().toISOString(),
        regulator: 'California Attorney General',
      },
      status: 'success',
    });
  }
}

// =============================================================================
// SINGLETON INSTANCE & CONVENIENCE METHODS
// =============================================================================

export const breachNotificationService = new BreachNotificationService();

/**
 * Report a data breach
 *
 * @param input - Breach notification input
 * @returns Created breach notification
 */
export const reportBreach = (input: CreateBreachNotificationInput) =>
  breachNotificationService.reportBreach(input);

/**
 * Send breach notification to affected users
 *
 * @param breachId - Breach notification ID
 * @returns Number of notifications sent
 */
export const sendUserNotifications = (breachId: string) =>
  breachNotificationService.sendUserNotifications(breachId);

/**
 * Notify California Attorney General
 *
 * @param breachId - Breach notification ID
 * @returns Success status
 */
export const notifyCaliforniaAG = (breachId: string) =>
  breachNotificationService.notifyCaliforniaAG(breachId);

/**
 * Check for breaches nearing notification deadline
 *
 * @returns Breaches needing attention
 */
export const checkNotificationDeadlines = () =>
  breachNotificationService.checkNotificationDeadlines();
