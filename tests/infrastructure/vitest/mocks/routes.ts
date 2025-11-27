import { vi } from 'vitest';

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
  OFFICE: {
    CMS: {
      JOBS: {
        EDIT: '/office/cms/jobs/:id/edit',
      },
    },
  },
  DASHBOARD: {
    PROFILE: {
      GENERAL: { path: '/dashboard/profile/general' },
      SKILLS: { path: '/dashboard/profile/skills' },
      EMPLOYMENT: { path: '/dashboard/profile/employment' },
      EDUCATION: { path: '/dashboard/profile/education' },
      CERTIFICATIONS: { path: '/dashboard/profile/certifications' },
    },
  },
};

export default {
  ROUTES,
  buildPath,
};
