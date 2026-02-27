import { extractPlainText } from '@scaffald/ui'
import type { JSONContent } from '@tiptap/core'

import type { Employer } from '../components/EmployerCard'

export interface EmployerFilters {
  searchQuery: string
  selectedIndustries: string[]
}

const toLowerCase = (value: string): string => value.toLowerCase()

const getEmployerDescription = (employer: Employer): string => {
  if (!employer.description) {
    return ''
  }

  if (typeof employer.description === 'string') {
    return employer.description
  }

  return extractPlainText(employer.description as JSONContent)
}

export const filterEmployers = (
  employers: Employer[],
  { searchQuery, selectedIndustries }: EmployerFilters
): Employer[] => {
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const hasQuery = normalizedQuery.length > 0
  const hasSelectedIndustries = selectedIndustries.length > 0

  if (!hasQuery && !hasSelectedIndustries) {
    return employers
  }

  return employers.filter((employer) => {
    const employerIndustry = employer.industries?.name ?? ''

    if (hasQuery) {
      const descriptionText = getEmployerDescription(employer)
      const matchesSearch =
        employer.name.toLowerCase().includes(normalizedQuery) ||
        descriptionText.toLowerCase().includes(normalizedQuery) ||
        employerIndustry.toLowerCase().includes(normalizedQuery)

      if (!matchesSearch) {
        return false
      }
    }

    if (hasSelectedIndustries) {
      return selectedIndustries.includes(employerIndustry)
    }

    return true
  })
}

export const getAvailableIndustries = (employers: Employer[]): string[] => {
  const uniqueIndustries = new Set<string>()

  for (const employer of employers) {
    if (employer.industries?.name) {
      uniqueIndustries.add(employer.industries.name)
    }
  }

  return Array.from(uniqueIndustries).sort((a, b) => toLowerCase(a).localeCompare(toLowerCase(b)))
}

export const getSelectedIndustryCounts = (
  employers: Employer[],
  selectedIndustries: string[]
): Record<string, number> => {
  if (selectedIndustries.length === 0) {
    return {}
  }

  const counts = selectedIndustries.reduce<Record<string, number>>((accumulator, industry) => {
    accumulator[industry] = 0
    return accumulator
  }, {})

  for (const employer of employers) {
    const employerIndustry = employer.industries?.name

    if (!employerIndustry) {
      continue
    }

    if (counts[employerIndustry] === undefined) {
      continue
    }

    counts[employerIndustry] += 1
  }

  return counts
}
