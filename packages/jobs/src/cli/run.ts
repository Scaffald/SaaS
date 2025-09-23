import { syncJobSources } from './index'

void syncJobSources().catch((error) => {
  console.error('Failed to run job sourcing sync.', error)
  process.exitCode = 1
})
