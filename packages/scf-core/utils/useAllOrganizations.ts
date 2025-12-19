/* c8 ignore file */

import { api } from './api';

/**
 * Hook for fetching all organizations (admin view)
 *
 * This hook is used in the office context where super admins
 * can create/manage jobs for any organization, regardless of
 * their membership status.
 *
 * For regular users fetching organizations they belong to,
 * use `useOrganizations()` instead.
 */
export const useAllOrganizations = () => {
  return api.office.getOrganizations.useQuery();
};
