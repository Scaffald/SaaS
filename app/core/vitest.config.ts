import { defineConfig, mergeConfig } from 'vitest/config'

import { createWorkspaceVitestConfig } from '../../vitest.workspace'

export default defineConfig(async () => {
  const baseConfig = await createWorkspaceVitestConfig({ environment: 'jsdom' })

  return mergeConfig(baseConfig, {
    test: {
      clearMocks: true,
    },
  })
})
