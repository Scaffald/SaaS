/**
 * @app/schemas - Shared validation schemas
 *
 * Single source of truth for validation schemas used across:
 * - Frontend (React Hook Form)
 * - Backend (tRPC, Supabase Functions)
 *
 * This ensures frontend and backend always use identical validation logic
 */

// Application schemas
export * from './applications.ts'
// CMS schemas
export * from './cms/welcome-slides.schema.ts'
// Common schemas
export * from './common.ts'
// Feedback schemas
export * from './feedback.ts'
// Inquiry schemas
export * from './inquiries.ts'
// Job schemas
export * from './jobs.ts'
// Organization schemas
export * from './organizations.ts'
// Profile schemas
export * from './profile.ts'

// Project schemas
export * from './projects.ts'
// Team management schemas
export * from './teams.ts'
