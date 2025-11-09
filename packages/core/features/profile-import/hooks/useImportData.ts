import { useMemo } from 'react'
import { api } from '@app/core/utils/api'

export interface ImportSection<TItem> {
  id: string
  title: string
  items: TItem[]
}

export interface ImportExperienceItem {
  id: string
  jobTitle: string
  companyName: string
  startDate?: string | null
  endDate?: string | null
  isCurrent?: boolean
  confidenceScore?: number | null
  raw?: Record<string, unknown>
}

export interface ImportEducationItem {
  id: string
  degree?: string
  institution?: string
  startDate?: string | null
  endDate?: string | null
  confidenceScore?: number | null
  raw?: Record<string, unknown>
}

export interface ImportSkillItem {
  id: string
  name: string
  confidenceScore?: number | null
  taxonomy?: string
}

export interface ImportCertificationItem {
  id: string
  name: string
  issuer?: string
  issueDate?: string | null
  confidenceScore?: number | null
}

export interface ImportGeneralItem {
  id: string
  firstName?: string
  lastName?: string
  headline?: string
  summary?: string
  confidenceScore?: number | null
}

export interface ImportData {
  general: ImportSection<ImportGeneralItem>
  experience: ImportSection<ImportExperienceItem>
  education: ImportSection<ImportEducationItem>
  skills: ImportSection<ImportSkillItem>
  certifications: ImportSection<ImportCertificationItem>
}

export function useImportData() {
  const { data, isLoading, refetch, isError } = api.profile.import.getImportData.useQuery(undefined, {
    staleTime: 0,
  })

  const importData: ImportData | null = useMemo(() => {
    if (!data) return null

    return {
      general: {
        id: 'general',
        title: 'General Info',
        items: data.general?.map((item: Record<string, unknown>, index: number) => ({
          id: `general-${index}`,
          firstName: typeof item.first_name === 'string' ? item.first_name : undefined,
          lastName: typeof item.last_name === 'string' ? item.last_name : undefined,
          headline: typeof item.headline === 'string' ? item.headline : undefined,
          summary: typeof item.summary === 'string' ? item.summary : undefined,
          confidenceScore: typeof item.confidence_score === 'number' ? item.confidence_score : undefined,
          raw: item,
        })) ?? [],
      },
      experience: {
        id: 'experience',
        title: 'Experience',
        items: data.experience?.map((item: Record<string, unknown>, index: number) => ({
          id: String(item.id ?? `experience-${index}`),
          jobTitle: typeof item.job_title === 'string' ? item.job_title : '',
          companyName: typeof item.company_name === 'string' ? item.company_name : '',
          startDate: typeof item.start_date === 'string' ? item.start_date : null,
          endDate: typeof item.end_date === 'string' ? item.end_date : null,
          isCurrent: typeof item.is_current === 'boolean' ? item.is_current : null,
          confidenceScore: typeof item.confidence_score === 'number' ? item.confidence_score : undefined,
          raw: item,
        })) ?? [],
      },
      education: {
        id: 'education',
        title: 'Education',
        items: data.education?.map((item: Record<string, unknown>, index: number) => ({
          id: String(item.id ?? `education-${index}`),
          degree: typeof item.degree === 'string' ? item.degree : undefined,
          institution: typeof item.institution === 'string' ? item.institution : undefined,
          startDate: typeof item.start_date === 'string' ? item.start_date : null,
          endDate: typeof item.end_date === 'string' ? item.end_date : null,
          confidenceScore: typeof item.confidence_score === 'number' ? item.confidence_score : undefined,
          raw: item,
        })) ?? [],
      },
      skills: {
        id: 'skills',
        title: 'Skills',
        items: data.skills?.map((item: Record<string, unknown>, index: number) => ({
          id: String(item.id ?? item.name ?? `skill-${index}`),
          name: typeof item.name === 'string' ? item.name : 'Unknown Skill',
          confidenceScore: typeof item.confidence_score === 'number' ? item.confidence_score : undefined,
          taxonomy: typeof item.taxonomy === 'string' ? item.taxonomy : undefined,
        })) ?? [],
      },
      certifications: {
        id: 'certifications',
        title: 'Certifications',
        items: data.certifications?.map((item: Record<string, unknown>, index: number) => ({
          id: String(item.id ?? `certification-${index}`),
          name: typeof item.name === 'string' ? item.name : '',
          issuer: typeof item.issuer === 'string' ? item.issuer : undefined,
          issueDate: typeof item.issue_date === 'string' ? item.issue_date : null,
          confidenceScore: typeof item.confidence_score === 'number' ? item.confidence_score : undefined,
        })) ?? [],
      },
    }
  }, [data])

  return {
    importData,
    isLoading,
    isError,
    refetch,
  }
}


