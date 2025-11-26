import { vi } from 'vitest';

const mockPostHog = {
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  alias: vi.fn(),
  reset: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  has_opted_in_capturing: vi.fn(),
  has_opted_out_capturing: vi.fn(),
  get_distinct_id: vi.fn(() => 'mock-distinct-id'),
};

vi.mock('posthog-react-native', () => ({
  PostHog: vi.fn(() => mockPostHog),
}));
