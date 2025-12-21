import { beforeEach, describe, expect, it } from 'vitest'

import {
  buildBraingridPayload,
  getBraingridConfig,
  type FeedbackRow,
} from '../feedback-sync.ts';

type DenoEnv = {
  get: (key: string) => string | undefined
  set: (key: string, value: string) => void
  delete: (key: string) => void
}

const envStore = new Map<string, string>()

const denoEnv: DenoEnv = {
  get: (key) => envStore.get(key),
  set: (key, value) => envStore.set(key, value),
  delete: (key) => envStore.delete(key),
}

beforeEach(() => {
  envStore.clear()
  const globalWithDeno = globalThis as unknown as { Deno?: { env?: DenoEnv } }
  globalWithDeno.Deno ??= {}
  globalWithDeno.Deno.env = denoEnv
})

describe('getBraingridConfig', () => {
  it('returns null when required environment variables are missing', () => {
    const config = getBraingridConfig()
    expect(config).toBeNull()
  })

  it('returns configuration when env variables are set', () => {
    denoEnv.set('BRAINGRID_API_URL', 'https://example.com/api')
    denoEnv.set('BRAINGRID_API_KEY', 'secret-key')
    denoEnv.set('BRAINGRID_PROJECT_ID', 'project-123')

    const config = getBraingridConfig()
    expect(config).toEqual({
      apiUrl: 'https://example.com/api',
      apiKey: 'secret-key',
      projectId: 'project-123',
    })
  })
})

describe('buildBraingridPayload', () => {
  const feedbackRow: FeedbackRow = {
    id: 'feedback-id',
    user_id: 'user-123',
    user_email: 'user@example.com',
    user_name: 'Test User',
    feedback_type: 'feature',
    feedback_text: 'Add an integrated calendar view to manage shifts seamlessly.',
    screenshot_path: 'user-123/2024-01-01-screenshot.png',
    page_url: '/dashboard/schedule',
    page_title: 'Schedule',
    user_agent: 'Chrome/1.0',
    browser_name: 'Chrome',
    browser_version: '120.0',
    operating_system: 'macOS',
    screen_resolution: '1440x900',
    viewport_size: '1280x720',
    braingrid_feature_id: null,
    braingrid_sync_status: 'pending',
    braingrid_sync_error: null,
    braingrid_synced_at: null,
    sync_retry_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  it('constructs payload title and description with metadata', () => {
    const payload = buildBraingridPayload(feedbackRow, 'project-abc')

    expect(payload.title).toMatch(/FEATURE/)
    expect(payload.description).toContain('---- Context ----')
    expect(payload.description).toContain('Schedule')
    expect(payload.description).toContain('user@example.com')
    expect(payload.description).toContain('Screenshot: user-123/2024-01-01-screenshot.png')
    expect(payload.metadata.project_id).toBe('project-abc')
    expect(payload.metadata.browser_info?.name).toBe('Chrome')
  })

  it('omits screenshot entry when path is not provided', () => {
    const payload = buildBraingridPayload(
      { ...feedbackRow, screenshot_path: null, browser_name: null },
      undefined,
    )

    expect(payload.metadata.screenshot_path).toBeNull()
    expect(payload.description).not.toContain('Screenshot:')
    expect(payload.metadata.project_id).toBeUndefined()
  })
})


