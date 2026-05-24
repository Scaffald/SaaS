import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useImportData } from '../useImportData'
import { TestQueryWrapper } from '@test-helpers/test-utils'

// useImportData (the local wrapper) delegates to the SDK hook
// useImportData re-exported from '@scf/core/utils/profile-import-sdk-hooks'.
// Mock that surface so the wrapper sees a controlled query result.
const useQueryMock = vi.fn()

vi.mock('@scf/core/utils/profile-import-sdk-hooks', () => ({
  useImportData: (...args: unknown[]) => useQueryMock(...args),
}))

describe('useImportData', () => {
  beforeEach(() => {
    useQueryMock.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('normalizes import payload into typed sections', () => {
    const rawResponse = {
      payload: {
        general: [
          {
            first_name: 'Jane',
            last_name: 'Doe',
            headline: 'Electrician',
            summary: 'Experienced professional',
            confidence_score: 0.7,
          },
        ],
        experience: [
          {
            id: 42,
            job_title: 'Lead Electrician',
            company_name: 'Voltage Works',
            start_date: '2021-01-01',
            end_date: null,
            is_current: true,
            confidence_score: 0.85,
          },
        ],
        education: [
          {
            degree: 'BSc Electrical Engineering',
            institution: 'Tech University',
            start_date: '2015-09-01',
            end_date: '2019-06-01',
            confidence_score: 0.9,
          },
        ],
        skills: [
          {
            id: 'skill-1',
            name: 'Wiring',
            taxonomy: 'onet',
            confidence_score: 0.95,
          },
        ],
        certifications: [
          {
            id: 'cert-1',
            name: 'OSHA Certification',
            issuer: 'OSHA',
            issue_date: '2020-04-01',
            confidence_score: 0.88,
          },
        ],
      },
      source: 'resume',
      storedAt: '2025-11-11T10:00:00Z',
      expiresAt: '2025-11-12T10:00:00Z',
    }

    useQueryMock.mockReturnValue({
      data: rawResponse,
      // SDK hook returns isPending (the wrapper destructures isPending → isLoading).
      isPending: false,
      refetch: vi.fn(),
      isError: false,
    })

    const { result } = renderHook(() => useImportData(), { wrapper: TestQueryWrapper })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.importData).toEqual({
      general: {
        id: 'general',
        title: 'General Info',
        items: [
          {
            id: 'general-0',
            firstName: 'Jane',
            lastName: 'Doe',
            headline: 'Electrician',
            summary: 'Experienced professional',
            confidenceScore: 0.7,
            raw: rawResponse.payload.general[0],
          },
        ],
      },
      experience: {
        id: 'experience',
        title: 'Experience',
        items: [
          {
            // Positional fallback id; implementation ignores item.id in input.
            id: 'experience-0',
            jobTitle: 'Lead Electrician',
            companyName: 'Voltage Works',
            startDate: '2021-01-01',
            endDate: null,
            isCurrent: true,
            confidenceScore: 0.85,
            raw: rawResponse.payload.experience[0],
          },
        ],
      },
      education: {
        id: 'education',
        title: 'Education',
        items: [
          {
            id: 'education-0',
            degree: 'BSc Electrical Engineering',
            institution: 'Tech University',
            startDate: '2015-09-01',
            endDate: '2019-06-01',
            confidenceScore: 0.9,
            raw: rawResponse.payload.education[0],
          },
        ],
      },
      skills: {
        id: 'skills',
        title: 'Skills',
        items: [
          {
            // Current normalization uses item.name as the dedup id
            // (not item.id). Matches implementation at hooks/useImportData.ts.
            id: 'Wiring',
            name: 'Wiring',
            confidenceScore: 0.95,
            taxonomy: 'onet',
            raw: rawResponse.payload.skills[0],
          },
        ],
      },
      certifications: {
        id: 'certifications',
        title: 'Certifications',
        items: [
          {
            // Positional fallback id; implementation uses 'certification-N' (singular).
            id: 'certification-0',
            name: 'OSHA Certification',
            issuer: 'OSHA',
            issueDate: '2020-04-01',
            confidenceScore: 0.88,
            raw: rawResponse.payload.certifications[0],
          },
        ],
      },
    })

    expect(result.current.metadata).toEqual(rawResponse)
  })

  it('returns null import data when payload is missing', () => {
    useQueryMock.mockReturnValue({
      data: null,
      // SDK hook returns isPending (the wrapper destructures isPending → isLoading).
      isPending: false,
      refetch: vi.fn(),
      isError: false,
    })

    const { result } = renderHook(() => useImportData(), { wrapper: TestQueryWrapper })

    expect(result.current.importData).toBeNull()
  })
})


