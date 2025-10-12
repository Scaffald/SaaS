/**
 * @app/schemas - Shared validation schemas
 *
 * Single source of truth for validation schemas used across:
 * - Frontend (React Hook Form)
 * - Backend (tRPC, Supabase Functions)
 *
 * This ensures frontend and backend always use identical validation logic
 */

// Common schemas
export * from "./common";

// Profile schemas
export * from "./profile";

// Job schemas
export * from "./jobs";

// Application schemas
export * from "./applications";

// Organization schemas
export * from "./organizations";
