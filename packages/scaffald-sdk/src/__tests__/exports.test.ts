/**
 * Verifies that all public exports are correctly exposed.
 * Prevents regressions when adding new hooks but forgetting to export them.
 */
import { describe, it, expect } from 'vitest'

// Import from the public react entry - this is what consumers use
import * as ReactSDK from '../react/index'

describe('@scaffald/sdk/react exports', () => {
  it('should export ScaffaldProvider', () => expect(ReactSDK.ScaffaldProvider).toBeDefined())
  it('should export useScaffald', () => expect(ReactSDK.useScaffald).toBeDefined())
  it('should export usePrerequisites', () => expect(ReactSDK.usePrerequisites).toBeDefined())
  it('should export useCompletePrerequisites', () =>
    expect(ReactSDK.useCompletePrerequisites).toBeDefined())
  it('should export useIndustries', () => expect(ReactSDK.useIndustries).toBeDefined())
  it('should export useJobs', () => expect(ReactSDK.useJobs).toBeDefined())
  it('should export useJob', () => expect(ReactSDK.useJob).toBeDefined())
  it('should export useCreateJob', () => expect(ReactSDK.useCreateJob).toBeDefined())
  it('should export useApplication', () => expect(ReactSDK.useApplication).toBeDefined())
  it('should export useCreateApplication', () =>
    expect(ReactSDK.useCreateApplication).toBeDefined())
  it('should export useTeams', () => expect(ReactSDK.useTeams).toBeDefined())
  it('should export useApiKeys', () => expect(ReactSDK.useApiKeys).toBeDefined())

  it('useCompletePrerequisites should be a function', () => {
    expect(typeof ReactSDK.useCompletePrerequisites).toBe('function')
  })

  it('usePrerequisites should be a function', () => {
    expect(typeof ReactSDK.usePrerequisites).toBe('function')
  })
})
