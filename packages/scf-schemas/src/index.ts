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
export * from './applications/index';
// CMS schemas
export * from './cms/welcome-slides.schema';
// Common schemas
export * from './common/index';
// Feedback schemas
export * from './feedback/index';
// Inquiry schemas
export * from './inquiries/index';
// Job schemas
export * from './jobs/index';
// Organization schemas
export * from './organizations/index';
// Profile schemas
export * from './profile/index';

// Project schemas
export * from './projects/index';
// Team management schemas
export * from './teams/index';
// Work log schemas
export * from './work-logs/index';
