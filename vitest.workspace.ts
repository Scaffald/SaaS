import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { UserConfig } from 'vitest/config';

const workspaceRoot = dirname(fileURLToPath(import.meta.url));

export type WorkspaceVitestOptions = {
  environment?: 'node' | 'jsdom';
};

export const createWorkspaceVitestConfig = async (
  options: WorkspaceVitestOptions = {},
): Promise<UserConfig> => {
  const { default: tsconfigPaths } = await import('vite-tsconfig-paths');

  return {
    plugins: [
      tsconfigPaths({
        projects: [resolve(workspaceRoot, 'tsconfig.base.json')],
      }),
    ],
    test: {
      environment: options.environment ?? 'node',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
      },
    },
  };
};

export default createWorkspaceVitestConfig();
