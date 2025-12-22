// src/services/emailService.ts
// ForSured Email Service - Browser-Safe Client
//
// This service provides email sending capabilities by calling the
// Supabase Edge Function 'send-email'. The actual email sending
// (using @bernierllc/email-manager with SendGrid) happens server-side.
//
// Email templates supported:
// - broker-invitation: Invite new brokers to the platform
// - welcome: Welcome new users after signup
// - onboarding-complete: Confirm onboarding completion
// - breach-notification: CCPA-compliant breach notifications

import { supabase } from '../lib/supabase';

// Feature flag - when false, uses mock mode (logs but doesn't send)
const USE_REAL_EMAIL = import.meta.env.VITE_USE_REAL_EMAIL === 'true';

// App configuration
const APP_URL = import.meta.env.VITE_APP_URL || 'https://app.forsured.com';

// =============================================================================
// TYPES
// =============================================================================

export type EmailTemplate =
  | 'broker-invitation'
  | 'welcome'
  | 'onboarding-complete'
  | 'breach-notification';

export interface SendResult {
  success: boolean;
  messageId?: string;
  provider: string;
  sentAt: Date;
  error?: string;
}

interface EdgeFunctionResponse {
  success: boolean;
  messageId?: string;
  provider: string;
  sentAt: string;
  error?: string;
}

// =============================================================================
// EMAIL SERVICE CLASS
// =============================================================================

class ForSuredEmailService {
  /**
   * Send an email via the Supabase Edge Function
   */
  private async sendEmail(
    template: EmailTemplate,
    to: string | string[],
    context: Record<string, unknown>
  ): Promise<SendResult> {
    // In development without real email, just mock
    if (!USE_REAL_EMAIL) {
      return this.mockSend(template, to);
    }

    try {
      const { data, error } = await supabase.functions.invoke<EdgeFunctionResponse>('send-email', {
        body: { template, to, context },
      });

      if (error) {
        console.error('[ForSuredEmail] Edge Function error:', error);
        return {
          success: false,
          provider: 'edge-function-error',
          sentAt: new Date(),
          error: error.message,
        };
      }

      if (!data) {
        return {
          success: false,
          provider: 'no-response',
          sentAt: new Date(),
          error: 'No response from email function',
        };
      }

      return {
        success: data.success,
        messageId: data.messageId,
        provider: data.provider,
        sentAt: new Date(data.sentAt),
        error: data.error,
      };
    } catch (err) {
      console.error('[ForSuredEmail] Error calling Edge Function:', err);
      return {
        success: false,
        provider: 'client-error',
        sentAt: new Date(),
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Mock send for development/testing
   */
  private mockSend(template: EmailTemplate, to: string | string[]): SendResult {
    const recipients = Array.isArray(to) ? to : [to];
    console.log('[ForSuredEmail] MOCK: Would send email');
    console.log('[ForSuredEmail] MOCK: Template:', template);
    console.log('[ForSuredEmail] MOCK: To:', recipients.join(', '));

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      provider: 'mock',
      sentAt: new Date(),
    };
  }

  /**
   * Send a broker invitation email
   */
  async sendBrokerInvitation(options: {
    email: string;
    name?: string;
    invitationCode: string;
    expiresAt: Date;
    brokerageName?: string;
  }): Promise<SendResult> {
    const context = {
      user: { name: options.name || '' },
      invitationCode: options.invitationCode,
      brokerageName: options.brokerageName || null,
      signupUrl: `${APP_URL}/signup?type=broker&code=${options.invitationCode}`,
      expiresAt: options.expiresAt.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };

    return this.sendEmail('broker-invitation', options.email, context);
  }

  /**
   * Send a welcome email after signup
   */
  async sendWelcomeEmail(options: {
    email: string;
    name: string;
    userType: 'gc' | 'contractor' | 'broker';
  }): Promise<SendResult> {
    const userTypeLabels = {
      gc: 'General Contractor',
      contractor: 'Contractor',
      broker: 'Insurance Broker',
    };

    const userTypeActions = {
      gc: 'Add your first project and invite subcontractors',
      contractor: 'Connect with a general contractor or upload your COI',
      broker: 'Add your clients and manage their policies',
    };

    const context = {
      user: { name: options.name },
      userType: userTypeLabels[options.userType],
      userTypeAction: userTypeActions[options.userType],
      dashboardUrl: `${APP_URL}/${options.userType}`,
      helpUrl: `${APP_URL}/${options.userType}/help/getting-started`,
    };

    return this.sendEmail('welcome', options.email, context);
  }

  /**
   * Send onboarding complete email
   */
  async sendOnboardingCompleteEmail(options: {
    email: string;
    name: string;
    userType: 'gc' | 'contractor' | 'broker';
    companyName: string;
  }): Promise<SendResult> {
    const userTypeLabels = {
      gc: 'General Contractor',
      contractor: 'Contractor',
      broker: 'Insurance Broker',
    };

    const context = {
      user: { name: options.name, email: options.email },
      userType: userTypeLabels[options.userType],
      companyName: options.companyName,
      dashboardUrl: `${APP_URL}/${options.userType}`,
    };

    return this.sendEmail('onboarding-complete', options.email, context);
  }

  /**
   * Send breach notification email (CCPA compliance)
   */
  async sendBreachNotificationEmail(options: {
    email: string;
    whatHappened: string;
    dataTypesExposed: string[];
    containmentActions: string;
    breachNumber: string;
  }): Promise<SendResult> {
    const context = {
      whatHappened: options.whatHappened,
      dataTypesExposed: options.dataTypesExposed.join(', '),
      containmentActions: options.containmentActions,
      resetPasswordUrl: `${APP_URL}/reset-password`,
      moreInfoUrl: `${APP_URL}/security/breach/${options.breachNumber}`,
    };

    return this.sendEmail('breach-notification', options.email, context);
  }
}

// =============================================================================
// SINGLETON INSTANCE & EXPORTS
// =============================================================================

export const emailService = new ForSuredEmailService();

// Convenience exports
export const sendBrokerInvitation = (options: Parameters<typeof emailService.sendBrokerInvitation>[0]) =>
  emailService.sendBrokerInvitation(options);

export const sendWelcomeEmail = (options: Parameters<typeof emailService.sendWelcomeEmail>[0]) =>
  emailService.sendWelcomeEmail(options);

export const sendOnboardingCompleteEmail = (options: Parameters<typeof emailService.sendOnboardingCompleteEmail>[0]) =>
  emailService.sendOnboardingCompleteEmail(options);

export const sendBreachNotificationEmail = (options: Parameters<typeof emailService.sendBreachNotificationEmail>[0]) =>
  emailService.sendBreachNotificationEmail(options);
