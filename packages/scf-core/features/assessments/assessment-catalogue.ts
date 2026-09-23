/**
 * The assessments this app offers, and whether the viewer has done them.
 *
 * Every screen that lists assessments was writing its own copy of the list:
 * the hub had four cards with marketing descriptions and no status at all,
 * Home had a carousel with three of the four and its own titles, and the
 * completion flags were read three different ways because the status
 * endpoints disagree about whether the answer is `isCompleted`,
 * `data.isCompleted`, `complete` or `selected`.
 *
 * One list, one normaliser, one set of names.
 */

import { ROUTES } from '@scf/core/constants/routes'
import {
  useIPIPStatus,
  useLuscherTest1Status,
} from '@scf/core/utils/personality-assessment-sdk-hooks'
import { useOccupationStatus, useRIASECStatus } from '@scf/core/utils/onet-sdk-hooks'

export interface AssessmentEntry {
  key: string
  /** What it is called, everywhere. */
  title: string
  /** What taking it proves, in the worker's terms — not what it measures. */
  proves: string
  /** Honest order of magnitude, from the copy the hub already carried. */
  estimate: string
  complete: boolean
  /** Where "Begin" goes. */
  route: string
  /** Where "Review" goes, when results have their own screen. */
  resultsRoute?: string
}

/**
 * The four status endpoints answer in four shapes. Rather than each caller
 * guessing, every known spelling of "done" is checked here once.
 */
export function readCompleted(status: unknown): boolean {
  if (!status || typeof status !== 'object') return false
  const record = status as Record<string, unknown>
  const inner = (record.data ?? {}) as Record<string, unknown>
  return (
    record.isCompleted === true ||
    record.complete === true ||
    record.completed === true ||
    record.selected === true ||
    inner.isCompleted === true ||
    inner.complete === true ||
    inner.completed === true
  )
}

export function useAssessmentCatalogue(): { entries: AssessmentEntry[]; isLoading: boolean } {
  const { data: pulse, isLoading: loadingPulse } = useLuscherTest1Status()
  const { data: ipip, isLoading: loadingIPIP } = useIPIPStatus()
  const { data: riasec, isLoading: loadingRIASEC } = useRIASECStatus()
  const { data: occupation, isLoading: loadingOccupation } = useOccupationStatus()

  const isLoading = loadingPulse || loadingIPIP || loadingRIASEC || loadingOccupation

  const entries: AssessmentEntry[] = [
    {
      key: 'ipip',
      title: 'Personality profile',
      proves: 'How you work, across the five traits employers ask about.',
      estimate: 'About 12 minutes',
      complete: readCompleted(ipip),
      route: ROUTES.ASSESSMENTS.IPIP.path,
      resultsRoute: ROUTES.ASSESSMENTS.IPIP.RESULTS.path,
    },
    {
      key: 'riasec',
      title: 'Career interests',
      proves: 'The kind of work that suits you, matched to real occupations.',
      estimate: 'About 3 minutes',
      complete: readCompleted(riasec),
      route: ROUTES.ASSESSMENTS.RIASEC.path,
    },
    {
      key: 'occupation',
      title: 'Occupation preferences',
      proves: 'The trades you want, ranked — this is what job matching reads.',
      estimate: 'About 4 minutes',
      complete: readCompleted(occupation),
      route: ROUTES.ASSESSMENTS.OCCUPATION.path,
    },
    {
      key: 'pulse',
      title: 'Weekly pulse',
      proves: 'How this week went. Short, and it repeats.',
      estimate: 'About 2 minutes',
      complete: readCompleted(pulse),
      route: ROUTES.ASSESSMENTS.LUSCHER.path,
    },
  ]

  return { entries, isLoading }
}
