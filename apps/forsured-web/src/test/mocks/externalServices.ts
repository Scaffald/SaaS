/**
 * External Services Mock Boundary
 *
 * Only mock external third-party services
 *
 * This file defines the ONLY mocks allowed for external services.
 * We only mock external third-party services, never our own code.
 *
 * ALLOWED mocks (external services we don't own):
 * - SendGrid (email)
 * - Stripe (payments)
 * - External OCR APIs
 * - Third-party auth providers (Scaffald)
 *
 * NOT ALLOWED (use real implementations):
 * - Supabase/PostgreSQL (our database)
 * - tRPC endpoints (our API)
 * - Internal services (our business logic)
 * - Utility functions (our code)
 */

import { vi } from "vitest";

// =============================================================================
// SendGrid Mock
// =============================================================================

interface MockEmailCall {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
  timestamp: Date;
}

// Track all email sends for assertions
const sentEmails: MockEmailCall[] = [];

/**
 * Mock SendGrid email sending
 * This is the ONLY mock we use for email services
 */
export const mockSendGrid = {
  send: vi.fn(
    async (
      msg: {
        to: string;
        from?: string;
        subject: string;
        html: string;
        text?: string;
      },
    ) => {
      sentEmails.push({
        to: msg.to,
        from: msg.from,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        timestamp: new Date(),
      });
      return [{ statusCode: 202, body: "Accepted" }];
    },
  ),
  setApiKey: vi.fn(),
};

/**
 * Get all emails sent during test
 */
export function getSentEmails(): MockEmailCall[] {
  return [...sentEmails];
}

/**
 * Get last sent email
 */
export function getLastSentEmail(): MockEmailCall | undefined {
  return sentEmails[sentEmails.length - 1];
}

/**
 * Find email sent to specific address
 */
export function findEmailTo(email: string): MockEmailCall | undefined {
  return sentEmails.find((e) => e.to === email);
}

/**
 * Find emails with subject containing text
 */
export function findEmailsBySubject(subjectContains: string): MockEmailCall[] {
  return sentEmails.filter((e) => e.subject.includes(subjectContains));
}

/**
 * Clear sent emails (call in beforeEach)
 */
export function clearSentEmails(): void {
  sentEmails.length = 0;
  mockSendGrid.send.mockClear();
}

/**
 * Assert email was sent
 */
export function assertEmailSent(
  to: string,
  subjectContains?: string,
): MockEmailCall {
  const email = findEmailTo(to);
  if (!email) {
    throw new Error(
      `No email sent to ${to}. Sent emails: ${
        sentEmails.map((e) => e.to).join(", ") || "none"
      }`,
    );
  }
  if (subjectContains && !email.subject.includes(subjectContains)) {
    throw new Error(
      `Email to ${to} has subject "${email.subject}", expected to contain "${subjectContains}"`,
    );
  }
  return email;
}

/**
 * Assert no email was sent
 */
export function assertNoEmailsSent(): void {
  if (sentEmails.length > 0) {
    throw new Error(
      `Expected no emails, but ${sentEmails.length} were sent to: ${
        sentEmails.map((e) => e.to).join(", ")
      }`,
    );
  }
}

// =============================================================================
// Stripe Mock (if needed)
// =============================================================================

interface MockStripeEvent {
  type: string;
  data: {
    object: any;
  };
  timestamp: Date;
}

const stripeEvents: MockStripeEvent[] = [];

/**
 * Mock Stripe webhook handler
 */
export const mockStripe = {
  webhooks: {
    constructEvent: vi.fn((payload: string, sig: string, secret: string) => {
      // Parse the payload and return as event
      const event = JSON.parse(payload);
      stripeEvents.push({
        type: event.type,
        data: event.data,
        timestamp: new Date(),
      });
      return event;
    }),
  },
  customers: {
    create: vi.fn(async (data: any) => ({
      id: `cus_test_${Date.now()}`,
      email: data.email,
      name: data.name,
    })),
    retrieve: vi.fn(async (id: string) => ({
      id,
      email: "test@example.com",
      name: "Test Customer",
    })),
  },
  paymentIntents: {
    create: vi.fn(async (data: any) => ({
      id: `pi_test_${Date.now()}`,
      amount: data.amount,
      currency: data.currency,
      status: "succeeded",
    })),
  },
};

/**
 * Clear Stripe events
 */
export function clearStripeEvents(): void {
  stripeEvents.length = 0;
}

// =============================================================================
// OCR Service Mock (for document scanning)
// =============================================================================

interface MockOCRResult {
  text: string;
  confidence: number;
  fields: Record<string, string>;
}

/**
 * Mock OCR service for document scanning
 */
export const mockOCRService = {
  extractText: vi.fn(async (fileBuffer: Buffer): Promise<MockOCRResult> => ({
    text: "Mock extracted text from document",
    confidence: 0.95,
    fields: {
      policyNumber: "POL-123456",
      expirationDate: "2025-12-31",
      coverageAmount: "$1,000,000",
    },
  })),
  validateDocument: vi.fn(async (fileBuffer: Buffer) => ({
    valid: true,
    documentType: "insurance_certificate",
  })),
};

/**
 * Clear OCR mock calls
 */
export function clearOCRMocks(): void {
  mockOCRService.extractText.mockClear();
  mockOCRService.validateDocument.mockClear();
}

// =============================================================================
// Helper to clear all external service mocks
// =============================================================================

/**
 * Clear all external service mocks
 * Call this in beforeEach to reset state between tests
 */
export function clearAllExternalMocks(): void {
  clearSentEmails();
  clearStripeEvents();
  clearOCRMocks();
}
