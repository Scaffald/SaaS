import { describe, expect, it, vi } from 'vitest';

vi.mock('@scf/core/utils/work-logs-sdk-hooks', () => ({
  useWorkLogProjectOptions: vi.fn(),
  useCreateWorkLogMutation: vi.fn(),
  useUpdateWorkLogMutation: vi.fn(),
}));
vi.mock('@scf/core/utils/profile-skills-sdk-hooks', () => ({
  useUserSkills: vi.fn(),
}));
vi.mock('@scf/core/utils/location/useWorkLogLocation', () => ({
  useWorkLogLocation: vi.fn(),
}));
vi.mock('@react-native-community/netinfo', () => ({
  useNetInfo: vi.fn(),
}));
vi.mock('@scaffald/ui', () => ({
  useToast: vi.fn(),
}));
vi.mock('../useOfflineWorkLogs', () => ({
  useOfflineWorkLogs: vi.fn(),
}));

import { calculateTotalHours } from '../useWorkLogForm';

describe('calculateTotalHours', () => {
  it('returns 0 for an empty list', () => {
    expect(calculateTotalHours([])).toBe(0);
  });

  it('ignores empty-string entries (fresh unfilled row)', () => {
    expect(calculateTotalHours([{ start: '', end: '' }])).toBe(0);
  });

  it('ignores partial input while typing', () => {
    expect(calculateTotalHours([{ start: '08', end: '16:30' }])).toBe(0);
    expect(calculateTotalHours([{ start: '08:', end: '16:30' }])).toBe(0);
    expect(calculateTotalHours([{ start: '08:00', end: '16' }])).toBe(0);
  });

  it('computes the default entry as 8.5 hours', () => {
    expect(calculateTotalHours([{ start: '08:00', end: '16:30' }])).toBe(8.5);
  });

  it('sums multiple entries', () => {
    expect(
      calculateTotalHours([
        { start: '08:00', end: '12:00' },
        { start: '13:00', end: '17:30' },
      ])
    ).toBe(8.5);
  });

  it('ignores entries where end is not after start', () => {
    expect(calculateTotalHours([{ start: '16:30', end: '08:00' }])).toBe(0);
    expect(calculateTotalHours([{ start: '08:00', end: '08:00' }])).toBe(0);
  });

  it('skips invalid entries but keeps valid ones', () => {
    expect(
      calculateTotalHours([
        { start: '', end: '' },
        { start: '08:00', end: '10:15' },
      ])
    ).toBe(2.25);
  });

  it('never returns NaN', () => {
    const cases = [
      [{ start: '', end: '16:30' }],
      [{ start: 'ab:cd', end: '16:30' }],
      [{ start: '08:00', end: '' }],
    ];
    for (const entries of cases) {
      expect(Number.isNaN(calculateTotalHours(entries))).toBe(false);
    }
  });
});
