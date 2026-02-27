/**
 * User roles hook - uses SDK (auth.getUserRoles) when client is available.
 * Migrated from tRPC api.auth.getUserRoles to scaffald-sdk.
 */

export { useUserRolesSdk as useUserRoles } from '../auth-sdk-hooks'
