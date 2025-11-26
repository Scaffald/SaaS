import { vi } from 'vitest';

const mockRoutes = {
  ROUTES: {
    OFFICE: {
      CMS: {
        JOBS: {
          EDIT: '/office/cms/jobs/:id/edit',
        },
      },
    },
  },
  buildPath: vi.fn((path, params) => {
    if (!params) {
      return path;
    }
    return Object.entries(params).reduce(
      (acc, [key, value]) => acc.replace(`:${key}`, String(value)),
      path,
    );
  }),
};

vi.mock('@app/core/constants/routes', () => mockRoutes);
