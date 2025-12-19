import { describe, expect, it } from 'vitest';

import { getStatusColor, getStatusLabel } from '../status-formatting';

describe('getStatusLabel', () => {
  it('returns correct label for draft status', () => {
    expect(getStatusLabel('draft')).toBe('Draft');
  });

  it('returns correct label for pending_verification status', () => {
    expect(getStatusLabel('pending_verification')).toBe('Awaiting Verification');
  });

  it('returns correct label for verified status', () => {
    expect(getStatusLabel('verified')).toBe('Verified');
  });

  it('returns correct label for disputed status', () => {
    expect(getStatusLabel('disputed')).toBe('Disputed');
  });

  it("returns 'Unknown' for null status", () => {
    expect(getStatusLabel(null)).toBe('Unknown');
  });

  it("returns 'Unknown' for undefined status", () => {
    expect(getStatusLabel(undefined)).toBe('Unknown');
  });

  it('formats unknown status by replacing underscores', () => {
    expect(getStatusLabel('unknown_status')).toBe('unknown status');
  });
});

describe('getStatusColor', () => {
  it('returns correct color for draft status', () => {
    expect(getStatusColor('draft')).toBe('$color10');
  });

  it('returns correct color for pending_verification status', () => {
    expect(getStatusColor('pending_verification')).toBe('$orange10');
  });

  it('returns correct color for verified status', () => {
    expect(getStatusColor('verified')).toBe('$green10');
  });

  it('returns correct color for disputed status', () => {
    expect(getStatusColor('disputed')).toBe('$red10');
  });

  it('returns default gray color for null status', () => {
    expect(getStatusColor(null)).toBe('$gray10');
  });

  it('returns default gray color for undefined status', () => {
    expect(getStatusColor(undefined)).toBe('$gray10');
  });

  it('returns default color for unknown status', () => {
    expect(getStatusColor('unknown_status')).toBe('$color10');
  });
});

