/**
 * The rows behind the Office home's two preview cards (#1201): the screening
 * queue and open reports, a few items each, with "View all" to the queue.
 *
 * Kept out of office-overview.tsx so they can be tested without React Native.
 */
import { ROUTES } from '@scf/core/constants/routes'
import {
  isTerminal,
  slaLabel,
  slaState,
  type TimedCheck,
} from '@scf/core/features/background-check/check-sla'
import { isOpenReport } from './office-overview-counts'
import { workerLabel } from './worker-label'

export interface PreviewRow {
  key: string
  /** Who or what is waiting. */
  title: string
  /** What it is about: package and organisation, community and licence. */
  detail: string | null
  /** Which queue it came from, so a mixed list reads. */
  tag: string
  /** "3d over", "due today" — only where the queue makes a promise. */
  note: string | null
  attention: boolean
  route: string
}

export interface PreviewCheck extends TimedCheck {
  id: string
  worker?: {
    display_name?: string | null
    username?: string | null
    email?: string | null
  } | null
  package?: { display_name?: string | null } | null
  organization?: { name?: string | null } | null
}

export interface PreviewVerification {
  membership_id: string
  display_name: string | null
  email: string | null
  community_name: string
  verification_data?: { license_type?: string | null; state?: string | null } | null
  joined_at: string
}

export interface PreviewReport {
  id: string
  status: string
  violationType: string
  workerName: string | null
  organizationName: string | null
  createdAt: string
}

const joinDetail = (parts: Array<string | null | undefined>): string | null => {
  const kept = parts.filter((part): part is string => Boolean(part?.trim()))
  return kept.length > 0 ? kept.join(' · ') : null
}

const waitingSince = (check: TimedCheck): number => {
  const t = new Date(check.updated_at ?? check.created_at).getTime()
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY
}

/**
 * Open background checks first, the longest-waiting at the top — the order a
 * processor works them in — then people waiting on community verification,
 * oldest first. Checks are only passed in for someone who holds the
 * background-check admin role; for anyone else that queue is not theirs.
 */
export function screeningPreviewRows(
  checks: PreviewCheck[],
  verifications: PreviewVerification[],
  limit: number,
  now: number = Date.now()
): PreviewRow[] {
  const checkRows = checks
    .filter((check) => !isTerminal(check.status))
    .sort((a, b) => waitingSince(a) - waitingSince(b))
    .map(
      (check): PreviewRow => ({
        key: `check-${check.id}`,
        title: workerLabel(check.worker ?? {}),
        detail: joinDetail([check.package?.display_name, check.organization?.name]),
        tag: 'Background check',
        note: slaLabel(check, now),
        attention: slaState(check, now) === 'over',
        route: ROUTES.OFFICE.ATS.CHECKS.ADMIN.path,
      })
    )

  const verificationRows = [...verifications]
    .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())
    .map(
      (item): PreviewRow => ({
        key: `verification-${item.membership_id}`,
        title: item.display_name || item.email || 'Unnamed member',
        detail: joinDetail([
          item.community_name,
          joinDetail([item.verification_data?.license_type, item.verification_data?.state]),
        ]),
        tag: 'Trade licence',
        note: null,
        attention: false,
        route: ROUTES.OFFICE.COMMUNITIES.VERIFICATION.path,
      })
    )

  return [...checkRows, ...verificationRows].slice(0, Math.max(0, limit))
}

/** off_platform_hire → "Off-platform hire". */
export function violationTypeLabel(type: string): string {
  const words = type.split('_').filter(Boolean)
  if (words.length === 0) return 'Report'
  const phrase = words.join(' ').replace(/^off platform/, 'off-platform')
  return phrase.charAt(0).toUpperCase() + phrase.slice(1)
}

/** Open reports, newest first: who it is about, and against which employer. */
export function openReportRows(reports: PreviewReport[], limit: number): PreviewRow[] {
  return reports
    .filter(isOpenReport)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, Math.max(0, limit))
    .map((report) => ({
      key: `report-${report.id}`,
      title: report.workerName || report.organizationName || 'Unnamed party',
      detail: report.workerName ? report.organizationName : null,
      tag: violationTypeLabel(report.violationType),
      note: report.status === 'under_review' ? 'under review' : null,
      attention: report.status === 'confirmed',
      route: ROUTES.OFFICE.VIOLATIONS.path,
    }))
}
