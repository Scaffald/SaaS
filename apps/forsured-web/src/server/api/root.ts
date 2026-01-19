/**
 * Root tRPC Router
 * REQ-286: Create tRPC Router Structure for Forsured
 * TASK-4: Create Root Router and API Handler Integration
 *
 * Combines all individual tRPC routers into a unified root router.
 * Exports AppRouter type for client-side type inference.
 */

import { createTRPCRouter } from './trpc';
import { organizationRouter } from './routers/organization';
import { taskRouter } from './routers/task';
import { projectRouter } from './routers/project';
import { documentRouter } from './routers/document';
import { documentsRouter } from './routers/documents'; // REQ-284
import { healthRouter } from './routers/health';
import { policiesRouter } from './routers/policies'; // REQ-280
import { participantsRouter } from './routers/participants'; // REQ-281
import { teamMembersRouter } from './routers/teamMembers'; // REQ-283
import { clientProfileRouter } from './routers/clientProfile'; // REQ-274
import { notificationRouter } from './routers/notification'; // REQ-264
import { notificationsProxyRouter } from './routers/notificationsProxy'; // Notifications modal/dropdown
import { userSetTypesRouter } from './routers/userSetTypes'; // REQ-4
import { complianceRequirementsRouter } from './routers/complianceRequirements'; // REQ-2
import { complianceDependenciesRouter } from './routers/complianceDependencies'; // REQ-2
import { bulkOperationsRouter } from './routers/bulkOperations'; // REQ-2, TASK-12
import { ccpaAdminRouter } from './routers/ccpaAdmin'; // REQ-6: CCPA Admin UI
import { genericInvitationsRouter } from './routers/genericInvitations'; // REQ-128: Flexible Invitation System
import { manualUsersRouter } from './routers/manualUsers'; // REQ-12: Manual user management
import { userMergeRouter } from './routers/userMerge'; // REQ-12: User merge workflow

/**
 * Root tRPC router
 *
 * Combines all domain-specific routers into a single router.
 * Add new routers here as they are created.
 */
export const appRouter = createTRPCRouter({
  health: healthRouter,
  organization: organizationRouter,
  task: taskRouter,
  project: projectRouter,
  document: documentRouter,
  documents: documentsRouter, // REQ-284: Document organization with filtering
  policies: policiesRouter, // REQ-280: Insurance policies and provisions
  participants: participantsRouter, // REQ-281: Participants tab compliance view
  teamMembers: teamMembersRouter, // REQ-283: Team member management UI
  clientProfile: clientProfileRouter, // REQ-274: Client profile with GC relationships
  notification: notificationRouter, // REQ-264: Task history notifications
  notifications: notificationsProxyRouter, // Notifications modal/dropdown (Edge Function proxy)
  userSetTypes: userSetTypesRouter, // REQ-4: Multi-industry user set types
  complianceRequirements: complianceRequirementsRouter, // REQ-2: Compliance requirements CRUD
  complianceDependencies: complianceDependenciesRouter, // REQ-2: Compliance dependencies management
  bulkOperations: bulkOperationsRouter, // REQ-2, TASK-12: Bulk import/export operations
  ccpaAdmin: ccpaAdminRouter, // REQ-6: CCPA Admin UI
  genericInvitations: genericInvitationsRouter, // REQ-128: Flexible Invitation System
  manualUsers: manualUsersRouter, // REQ-12: Manual user management
  userMerge: userMergeRouter, // REQ-12: User merge workflow
});

/**
 * Export type definition of API
 *
 * This type is used by the client to get full type safety and autocompletion
 * for all procedures in the API.
 *
 * Usage in client:
 * ```ts
 * import type { AppRouter } from './server/api/root';
 * const trpc = createTRPCProxyClient<AppRouter>({ ... });
 * ```
 */
export type AppRouter = typeof appRouter;
