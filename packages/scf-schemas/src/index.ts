/**
 * @scf/schemas - Shared validation schemas
 *
 * Single source of truth for validation schemas used across:
 * - Frontend (React Hook Form)
 * - Backend (tRPC, Supabase Functions)
 *
 * This ensures frontend and backend always use identical validation logic
 */

// Application schemas
export * from './applications/index.ts';
// CMS schemas
export * from './cms/welcome-slides.schema.ts';
// Common schemas
export * from './common/index.ts';
// Feedback schemas
export * from './feedback/index.ts';
// Inquiry schemas
export * from './inquiries/index.ts';
// Job schemas
export * from './jobs/index.ts';
// Organization schemas
export * from './organizations/index.ts';
// Profile schemas
export * from './profile/index.ts';

// Project schemas
export * from './projects/index.ts';
// Team management schemas
export * from './teams/index.ts';
// Webhook schemas
export * from './webhooks/index.ts';
// Work log schemas
export * from './work-logs/index.ts';
