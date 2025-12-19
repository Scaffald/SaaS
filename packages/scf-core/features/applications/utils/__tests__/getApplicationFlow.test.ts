import { describe, expect, it } from 'vitest'
import { getApplicationFlow, type JobForFlowSelection } from '../getApplicationFlow'

describe('getApplicationFlow', () => {
  const baseJob: JobForFlowSelection = {
    id: 'job-1',
    title: 'Test Job',
    organization: {
      name: 'Test Organization',
    },
  }

  it("returns 'quick' for jobs with no custom questions and no required attachments", () => {
    const job: JobForFlowSelection = {
      ...baseJob,
      custom_application_questions: undefined,
      required_attachments: undefined,
    }

    expect(getApplicationFlow(job)).toBe('quick')
  })

  it("returns 'quick' for jobs with empty custom questions array and no required attachments", () => {
    const job: JobForFlowSelection = {
      ...baseJob,
      custom_application_questions: [],
      required_attachments: undefined,
    }

    expect(getApplicationFlow(job)).toBe('quick')
  })

  it("returns 'quick' for jobs with optional attachments only", () => {
    const job: JobForFlowSelection = {
      ...baseJob,
      custom_application_questions: [],
      required_attachments: {
        cover_letter: { required: false },
        portfolio: { required: false },
      },
    }

    expect(getApplicationFlow(job)).toBe('quick')
  })

  it("returns 'full' for jobs with custom questions", () => {
    const job: JobForFlowSelection = {
      ...baseJob,
      custom_application_questions: [
        {
          id: 'q1',
          question: 'Why are you interested?',
          type: 'long_text',
          required: true,
        },
      ],
      required_attachments: undefined,
    }

    expect(getApplicationFlow(job)).toBe('full')
  })

  it("returns 'full' for jobs with required resume", () => {
    const job: JobForFlowSelection = {
      ...baseJob,
      custom_application_questions: undefined,
      required_attachments: {
        resume: { required: true },
      },
    }

    expect(getApplicationFlow(job)).toBe('full')
  })

  it("returns 'full' for jobs with required cover letter", () => {
    const job: JobForFlowSelection = {
      ...baseJob,
      custom_application_questions: undefined,
      required_attachments: {
        cover_letter: { required: true },
      },
    }

    expect(getApplicationFlow(job)).toBe('full')
  })

  it("returns 'full' for jobs with required portfolio", () => {
    const job: JobForFlowSelection = {
      ...baseJob,
      custom_application_questions: undefined,
      required_attachments: {
        portfolio: { required: true },
      },
    }

    expect(getApplicationFlow(job)).toBe('full')
  })

  it("returns 'full' for jobs with both custom questions and required attachments", () => {
    const job: JobForFlowSelection = {
      ...baseJob,
      custom_application_questions: [
        {
          id: 'q1',
          question: 'Tell us about yourself',
          type: 'long_text',
          required: true,
        },
      ],
      required_attachments: {
        resume: { required: true },
        cover_letter: { required: true },
      },
    }

    expect(getApplicationFlow(job)).toBe('full')
  })

  it("returns 'full' for jobs with multiple custom questions", () => {
    const job: JobForFlowSelection = {
      ...baseJob,
      custom_application_questions: [
        {
          id: 'q1',
          question: 'Question 1',
          type: 'short_text',
          required: true,
        },
        {
          id: 'q2',
          question: 'Question 2',
          type: 'long_text',
          required: false,
        },
      ],
      required_attachments: undefined,
    }

    expect(getApplicationFlow(job)).toBe('full')
  })

  it("returns 'full' for jobs with multiple required attachments", () => {
    const job: JobForFlowSelection = {
      ...baseJob,
      custom_application_questions: undefined,
      required_attachments: {
        resume: { required: true },
        cover_letter: { required: true },
        portfolio: { required: true },
      },
    }

    expect(getApplicationFlow(job)).toBe('full')
  })

  it('handles jobs with null organization', () => {
    const job: JobForFlowSelection = {
      ...baseJob,
      organization: null,
      custom_application_questions: undefined,
      required_attachments: undefined,
    }

    expect(getApplicationFlow(job)).toBe('quick')
  })

  it('handles jobs with undefined organization', () => {
    const job: JobForFlowSelection = {
      ...baseJob,
      organization: undefined,
      custom_application_questions: undefined,
      required_attachments: undefined,
    }

    expect(getApplicationFlow(job)).toBe('quick')
  })
})

