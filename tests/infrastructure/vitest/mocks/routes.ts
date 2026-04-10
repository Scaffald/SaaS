import { vi } from 'vitest';

/**
 * Recursively flatten the ROUTES object into an array of { path, key } entries.
 */
function collectRoutes(obj: Record<string, unknown>, prefix = ''): Array<{ path: string; key: string }> {
  const results: Array<{ path: string; key: string }> = []
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'path') continue
    if (typeof value === 'object' && value !== null) {
      const node = value as Record<string, unknown>
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (typeof node.path === 'string') {
        results.push({ path: node.path, key: fullKey })
      }
      results.push(...collectRoutes(node, fullKey))
    }
  }
  return results
}

export const flattenRoutes = () => collectRoutes(ROUTES)

export const matchesRoute = (path: string, route: { path: string }) => {
  const pathParts = path.split('/')
  const routeParts = route.path.split('/')
  if (pathParts.length !== routeParts.length) return false
  return routeParts.every((part: string, i: number) => part.startsWith(':') || part === pathParts[i])
}

export const buildPath = vi.fn((path: string, params?: Record<string, string | number>) => {
  if (!params) {
    return path;
  }
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(`:${key}`, String(value)),
    path,
  );
});

export const ROUTES = {
  AUTH: {
    LOGIN: { path: '/auth' },
    VERIFY: { path: '/auth/verify' },
    SUCCESS: { path: '/auth/success' },
  },
  HOME: { path: '/' },
  DASHBOARD: {
    path: '/dashboard',
    PROFILE: {
      GENERAL: { path: '/dashboard/profile/general' },
      SKILLS: { path: '/dashboard/profile/skills' },
      EMPLOYMENT: { path: '/dashboard/profile/employment' },
      EDUCATION: { path: '/dashboard/profile/education' },
      CERTIFICATIONS: { path: '/dashboard/profile/certifications' },
    },
  },
  OFFICE: {
    path: '/office',
    APPLICATIONS: { path: '/office/applications' },
    TEAMS: { path: '/office/teams' },
    CMS: {
      path: '/office/cms',
      WORKERS: { path: '/office/cms/workers' },
      JOBS: {
        path: '/office/cms/jobs',
        CREATE: { path: '/office/cms/jobs/create' },
        EDIT: { path: '/office/cms/jobs/:id/edit' },
      },
      ORGANIZATIONS: {
        path: '/office/cms/organizations',
        CREATE: { path: '/office/cms/organizations/create' },
        EDIT: { path: '/office/cms/organizations/:id/edit' },
      },
      TEAMS: {
        path: '/office/cms/teams',
        DETAIL: { path: '/office/cms/teams/:id' },
      },
      PROJECTS: { path: '/office/cms/projects' },
      UNIVERSITIES: { path: '/office/cms/universities' },
    },
  },
  PROFILE: {
    path: '/profile',
    GENERAL: { path: '/profile/general' },
    SKILLS: { path: '/profile/skills' },
    EXPERIENCE: { path: '/profile/experience' },
    EDUCATION: { path: '/profile/education' },
    CERTIFICATIONS: { path: '/profile/certifications' },
  },
  JOBS: { path: '/jobs' },
  WORKERS: { path: '/workers' },
};

export default {
  ROUTES,
  buildPath,
};
