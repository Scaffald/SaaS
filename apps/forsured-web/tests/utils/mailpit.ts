/**
 * Mailpit Email Testing Utilities
 * 
 * Helper functions for testing email flows in Playwright tests.
 * Uses Mailpit API to capture and verify emails sent during tests.
 */

const MAILPIT_URL = process.env.MAILPIT_URL || 'http://127.0.0.1:54324';

export interface MailpitEmail {
  id: string;
  from: string;
  to: string[];
  subject: string;
  body: {
    text?: string;
    html?: string;
  };
}

/**
 * Get the latest email from Mailpit for a specific recipient
 * 
 * @param recipient - Email address to check
 * @param timeoutMs - Maximum time to wait for email (default: 10000ms)
 * @returns Latest email or null if not found
 */
export async function getLatestEmail(
  recipient: string,
  timeoutMs = 10000
): Promise<MailpitEmail | null> {
  const startTime = Date.now();
  const pollInterval = 500;

  while (Date.now() - startTime < timeoutMs) {
    try {
      // Get list of emails from Mailpit
      const response = await fetch(`${MAILPIT_URL}/api/v1/messages`, {
        signal: AbortSignal.timeout(Math.min(2000, timeoutMs - (Date.now() - startTime))),
      });

      if (!response.ok) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        continue;
      }

      const data = await response.json();
      const emails = data.messages || [];

      // Filter emails for this recipient
      const recipientEmails = emails.filter((email: { To: { Address: string }[] }) =>
        email.To?.some((to: { Address: string }) => to.Address.toLowerCase() === recipient.toLowerCase())
      );

      if (!recipientEmails.length) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        continue;
      }

      // Get the latest email (first in list)
      const latestEmail = recipientEmails[0];
      const emailResponse = await fetch(
        `${MAILPIT_URL}/api/v1/message/${latestEmail.ID}`,
        {
          signal: AbortSignal.timeout(Math.min(2000, timeoutMs - (Date.now() - startTime))),
        }
      );

      if (!emailResponse.ok) {
        throw new Error(`Failed to fetch email details: ${emailResponse.status}`);
      }

      const emailData = await emailResponse.json();

      return {
        id: emailData.ID,
        from: emailData.From?.Address || '',
        to: emailData.To?.map((to: { Address: string }) => to.Address) || [],
        subject: emailData.Subject || '',
        body: {
          text: emailData.Text || '',
          html: emailData.HTML || '',
        },
      };
    } catch (error) {
      // If timeout, return null
      if (error instanceof Error && error.name === 'TimeoutError') {
        return null;
      }
      // Otherwise, wait and retry
      if (Date.now() - startTime + pollInterval < timeoutMs) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        continue;
      }
      return null;
    }
  }

  return null;
}

/**
 * Extract magic link from email HTML body
 * 
 * @param emailHtml - HTML content of the email
 * @returns Magic link URL or null if not found
 */
export function extractMagicLinkFromEmail(emailHtml: string): string | null {
  // Look for magic link in email HTML
  // Supabase magic links redirect to emailRedirectTo with hash fragments
  // Format: https://.../auth/callback#access_token=...&type=magiclink
  // Or: https://...?token=...&type=magiclink (older format)
  // Or: http://.../auth/v1/verify?token=...&type=magiclink&redirect_to=...
  
  // Try Supabase verify endpoint format first (most common)
  const verifyLinkMatch = emailHtml.match(/href="([^"]*(?:\/auth\/v1\/(?:verify|confirm)|token_hash)[^"]*)"/i);
  if (verifyLinkMatch?.[1]) {
    // Decode HTML entities (&amp; -> &)
    return verifyLinkMatch[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
  }
  
  // Try hash fragment format (newer Supabase format)
  const hashLinkMatch = emailHtml.match(/href="([^"]*\/auth\/callback[^"]*#access_token[^"]*)"/i);
  if (hashLinkMatch?.[1]) {
    // Decode HTML entities
    return hashLinkMatch[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
  }
  
  // Try query param format (older format)
  const queryLinkMatch = emailHtml.match(/href="([^"]*(?:token|otp|magic)[^"]*)"/i);
  if (queryLinkMatch?.[1]) {
    // Decode HTML entities
    return queryLinkMatch[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
  }

  // Also check plain text
  const textMatch = emailHtml.match(/(https?:\/\/[^\s]*(?:token|otp|magic|access_token)[^\s]*)/i);
  if (textMatch?.[1]) {
    // Decode HTML entities
    return textMatch[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
  }

  return null;
}

/**
 * Clear all emails from Mailpit (useful for test cleanup)
 */
export async function clearMailpit(): Promise<void> {
  try {
    await fetch(`${MAILPIT_URL}/api/v1/messages`, {
      method: 'DELETE',
    });
  } catch (error) {
    // Ignore errors - Mailpit might not support DELETE or might be unavailable
    console.warn('[Mailpit] Failed to clear emails:', error);
  }
}

