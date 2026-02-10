/**
 * Root tRPC Router
 *
 * Combines all individual tRPC routers into a unified root router.
 * Exports AppRouter type for client-side type inference.
 */

import { createTRPCRouter } from "./trpc";
import { organizationRouter } from "./routers/organization";
import { taskRouter } from "./routers/task";
import { projectRouter } from "./routers/project";
import { documentRouter } from "./routers/document";
import { documentsRouter } from "./routers/documents";
import { healthRouter } from "./routers/health";
import { policiesRouter } from "./routers/policies";
import { participantsRouter } from "./routers/participants";
import { teamMembersRouter } from "./routers/teamMembers";
import { clientProfileRouter } from "./routers/clientProfile";
import { notificationRouter } from "./routers/notification";
import { notificationsProxyRouter } from "./routers/notificationsProxy";
import { userSetTypesRouter } from "./routers/userSetTypes";
import { complianceRequirementsRouter } from "./routers/complianceRequirements";
import { complianceDependenciesRouter } from "./routers/complianceDependencies";
import { bulkOperationsRouter } from "./routers/bulkOperations";
import { ccpaAdminRouter } from "./routers/ccpaAdmin";
import { genericInvitationsRouter } from "./routers/genericInvitations";
import { manualUsersRouter } from "./routers/manualUsers";
import { userMergeRouter } from "./routers/userMerge";
import { feedbackRouter } from "./routers/feedback";

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
  documents: documentsRouter,
  policies: policiesRouter,
  participants: participantsRouter,
  teamMembers: teamMembersRouter,
  clientProfile: clientProfileRouter,
  notification: notificationRouter,
  notifications: notificationsProxyRouter,
  userSetTypes: userSetTypesRouter,
  complianceRequirements: complianceRequirementsRouter,
  complianceDependencies: complianceDependenciesRouter,
  bulkOperations: bulkOperationsRouter,
  ccpaAdmin: ccpaAdminRouter,
  genericInvitations: genericInvitationsRouter,
  manualUsers: manualUsersRouter,
  userMerge: userMergeRouter,
  feedback: feedbackRouter,
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
