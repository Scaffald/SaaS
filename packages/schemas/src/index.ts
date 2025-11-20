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
export * from './applications'
// CMS schemas
export * from './cms/welcome-slides.schema'
// Common schemas
export * from './common'
// Feedback schemas
export * from './feedback'
// Inquiry schemas
export * from './inquiries'
// Job schemas
export * from './jobs'
// Organization schemas
export * from './organizations'
// Profile schemas
export * from './profile'

// Project schemas
export * from './projects'
// Team management schemas
export * from './teams'
