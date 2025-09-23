import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('syncJobSources', () => {
  it('logs the placeholder implementation message', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const { syncJobSources } = await import('../index')

    await syncJobSources()

    expect(infoSpy).toHaveBeenCalledWith('Job sourcing sync is not implemented yet.')
    infoSpy.mockRestore()
  })
})

describe('cli run entrypoint', () => {
  beforeEach(() => {
    vi.resetModules()
    process.exitCode = undefined
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = undefined
  })

  it('invokes the sync routine when the script loads', async () => {
    const syncJobSources = vi.fn().mockResolvedValue(undefined)
    vi.doMock('../index', () => ({ syncJobSources }))

    await import('../run')

    expect(syncJobSources).toHaveBeenCalledTimes(1)
    expect(process.exitCode).toBeUndefined()
  })

  it('reports errors and sets the exit code when the sync fails', async () => {
    const error = new Error('boom')
    const syncJobSources = vi.fn().mockRejectedValue(error)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.doMock('../index', () => ({ syncJobSources }))

    await import('../run')
    await Promise.resolve()

    expect(syncJobSources).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledWith('Failed to run job sourcing sync.', error)
    expect(process.exitCode).toBe(1)
  })
})
