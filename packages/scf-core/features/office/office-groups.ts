import { ROUTES } from '@scf/core/constants/routes'
import type { GroupPage, GroupPages } from '@scf/core/features/drawer/GroupTabs'

/**
 * A page in an Office tab's row. `owns` are further pages that light it
 * without a tab of their own: requesting a check lights Background checks.
 */
type OfficePage = GroupPage & { owns?: string[] }

type OfficeGroup = { owns: string[]; pages: OfficePage[] }

const { ATS, CMS, COMPLIANCE, COMMUNITIES } = ROUTES.OFFICE

/**
 * The Office tabs that hold more than one page, and those pages in order
 * (#1441). The Office folder tabs say which group you are in; this is the row
 * beneath that moves between a group's pages, the way Admin's Billing does
 * (`admin-groups.ts`). Overview, People, Jobs and Reports are one page each
 * (plus its create, edit and detail pages), so they have no row.
 *
 * Every page under `(admin)/office/` that is not a detail, create or edit
 * page is one tab here or a top-level Office tab; nothing else links to most
 * of them. Before this, `OfficeLayout` drew a row from the route tree whose
 * tabs did not navigate, so CMS opened on Users with no way on.
 */
const groups = (isCheckAdmin: boolean): OfficeGroup[] => [
  {
    // Screening. Community verification is a screening queue too, though it
    // lives under /office/communities. #1224 may fold the checks, ID and
    // community queues into one; this row then shrinks to that and Metrics.
    owns: [ATS.path, COMMUNITIES.VERIFICATION.path],
    pages: [
      // The review queue turns away staff without the check-admin role, so
      // they get no tab for it (#1297).
      ...(isCheckAdmin ? [{ href: ATS.CHECKS.ADMIN.path, titleKey: ATS.CHECKS.ADMIN.titleKey }] : []),
      {
        href: ATS.CHECKS.path,
        titleKey: ATS.CHECKS.titleKey,
        owns: [ATS.CHECKS.REQUEST.path, ...(isCheckAdmin ? [] : [ATS.CHECKS.ADMIN.path])],
      },
      { href: ATS.ID_VERIFICATIONS.path, titleKey: ATS.ID_VERIFICATIONS.titleKey },
      { href: ATS.SCHEDULING.path, titleKey: ATS.SCHEDULING.titleKey },
      { href: ATS.SELF_SCHEDULE.path, titleKey: ATS.SELF_SCHEDULE.titleKey },
      { href: ATS.METRICS.path, titleKey: ATS.METRICS.titleKey },
      { href: COMMUNITIES.VERIFICATION.path, titleKey: COMMUNITIES.VERIFICATION.titleKey },
    ],
  },
  {
    // Organizations, with the other kinds of account a CMS user manages.
    owns: [CMS.ORGANIZATIONS.path, CMS.TEAMS.path, CMS.PROJECTS.path, CMS.UNIVERSITIES.path],
    pages: [CMS.ORGANIZATIONS, CMS.TEAMS, CMS.PROJECTS, CMS.UNIVERSITIES].map(
      ({ path, titleKey }) => ({ href: path, titleKey })
    ),
  },
  {
    owns: [COMPLIANCE.path],
    pages: [COMPLIANCE.EEO_REPORTS, COMPLIANCE.PROJECT_HIRING].map(({ path, titleKey }) => ({
      href: path,
      titleKey,
    })),
  },
]

const under = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`)

/**
 * The pages of the Office group `pathname` sits in, and which one it is (the
 * page whose own path or `owns` is the longest prefix of it). Null outside
 * every group, so pages elsewhere that share OfficeLayout get no row.
 */
export function officeGroupPages(
  pathname: string | null | undefined,
  { isCheckAdmin = false }: { isCheckAdmin?: boolean } = {}
): GroupPages | null {
  if (!pathname) return null
  const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname
  const group = groups(isCheckAdmin).find((g) => g.owns.some((prefix) => under(path, prefix)))
  if (!group) return null

  let activeHref: string | null = null
  let bestLength = -1
  for (const page of group.pages) {
    for (const prefix of [page.href, ...(page.owns ?? [])]) {
      if (prefix.length > bestLength && under(path, prefix)) {
        activeHref = page.href
        bestLength = prefix.length
      }
    }
  }
  return { pages: group.pages.map(({ href, titleKey }) => ({ href, titleKey })), activeHref }
}
