import { ROUTES } from '@scf/core/constants/routes'
import { i18n } from '@scf/core/locales'

interface OfficeTabsItem {
  key: string
  label: string
  href: string
}

interface OfficeAccordionSectionLink {
  key: string
  label: string
  href: string
}

interface OfficeAccordionSection {
  key: string
  title: string
  defaultOpen?: boolean
  links: OfficeAccordionSectionLink[]
}

export const CMS_TABS: OfficeTabsItem[] = [
  {
    key: 'cms-manage-users',
    label: 'Users',
    href: ROUTES.OFFICE.CMS.path,
  },
  {
    key: 'cms-jobs',
    label: i18n.t(ROUTES.OFFICE.CMS.JOBS.titleKey),
    href: ROUTES.OFFICE.CMS.JOBS.path,
  },
  {
    key: 'cms-teams',
    label: i18n.t(ROUTES.OFFICE.CMS.TEAMS.titleKey),
    href: ROUTES.OFFICE.CMS.TEAMS.path,
  },
  {
    key: 'cms-universities',
    label: i18n.t(ROUTES.OFFICE.CMS.UNIVERSITIES.titleKey),
    href: ROUTES.OFFICE.CMS.UNIVERSITIES.path,
  },
  {
    key: 'cms-organizations',
    label: i18n.t(ROUTES.OFFICE.CMS.ORGANIZATIONS.titleKey),
    href: ROUTES.OFFICE.CMS.ORGANIZATIONS.path,
  },
  {
    key: 'cms-applications',
    label: i18n.t(ROUTES.OFFICE.APPLICATIONS.titleKey),
    href: ROUTES.OFFICE.APPLICATIONS.path,
  },
]

export const CMS_ACCORDION_SECTIONS: OfficeAccordionSection[] = [
  {
    key: 'cms-users',
    title: 'Users',
    defaultOpen: true,
    links: [
      {
        key: 'users-overview',
        label: 'Overview',
        href: ROUTES.OFFICE.CMS.path,
      },
      {
        key: 'users-directory',
        label: 'User Directory',
        href: ROUTES.OFFICE.CMS.WORKERS.path,
      },
    ],
  },
  {
    key: 'cms-jobs',
    title: 'Job Management',
    links: [
      {
        key: 'jobs-list',
        label: 'Jobs Dashboard',
        href: ROUTES.OFFICE.CMS.JOBS.path,
      },
      {
        key: 'jobs-create',
        label: 'Create Job',
        href: ROUTES.OFFICE.CMS.JOBS.CREATE.path,
      },
    ],
  },
  {
    key: 'cms-teams',
    title: 'Teams',
    links: [
      {
        key: 'teams-list',
        label: 'Team Directory',
        href: ROUTES.OFFICE.CMS.TEAMS.path,
      },
      {
        key: 'teams-create',
        label: 'Create Team',
        href: ROUTES.OFFICE.CMS.TEAMS.CREATE.path,
      },
    ],
  },
  {
    key: 'cms-universities',
    title: 'Universities',
    links: [
      {
        key: 'universities-list',
        label: 'Universities',
        href: ROUTES.OFFICE.CMS.UNIVERSITIES.path,
      },
      {
        key: 'universities-create',
        label: 'Create University',
        href: ROUTES.OFFICE.CMS.UNIVERSITIES.CREATE.path,
      },
    ],
  },
  {
    key: 'cms-organizations',
    title: 'Organizations',
    links: [
      {
        key: 'organizations-list',
        label: 'Organizations',
        href: ROUTES.OFFICE.CMS.ORGANIZATIONS.path,
      },
      {
        key: 'organizations-create',
        label: 'Create Organization',
        href: ROUTES.OFFICE.CMS.ORGANIZATIONS.CREATE.path,
      },
    ],
  },
  {
    key: 'cms-ats',
    title: 'Applications & Scheduling',
    links: [
      {
        key: 'ats-dashboard',
        label: 'Applications Dashboard',
        href: ROUTES.OFFICE.APPLICATIONS.path,
      },
      {
        key: 'ats-background-checks',
        label: 'Background Checks',
        href: ROUTES.OFFICE.ATS.CHECKS.path,
      },
      {
        key: 'ats-request',
        label: 'Request Background Check',
        href: ROUTES.OFFICE.ATS.CHECKS.REQUEST.path,
      },
      {
        key: 'ats-scheduling',
        label: 'Interview Scheduling',
        href: ROUTES.OFFICE.ATS.SCHEDULING.path,
      },
      // These three existed as routes but appeared in no navigation, so they
      // were reachable only by typing the URL.
      {
        key: 'ats-id-verifications',
        label: 'ID Verifications',
        href: ROUTES.OFFICE.ATS.ID_VERIFICATIONS.path,
      },
      {
        key: 'ats-metrics',
        label: 'Hiring Metrics',
        href: ROUTES.OFFICE.ATS.METRICS.path,
      },
      {
        key: 'ats-self-schedule',
        label: 'Self-Schedule Preview',
        href: ROUTES.OFFICE.ATS.SELF_SCHEDULE.path,
      },
    ],
  },
  {
    key: 'cms-integrations',
    title: 'Integrations',
    links: [
      {
        key: 'integrations-hris',
        label: 'HRIS & Payroll',
        href: ROUTES.OFFICE.INTEGRATIONS.HRIS.path,
      },
      {
        key: 'integrations-bg-checks',
        label: 'Background Check Providers',
        href: ROUTES.OFFICE.INTEGRATIONS.BACKGROUND_CHECKS.path,
      },
    ],
  },
  {
    key: 'cms-compliance',
    title: 'Compliance & Reporting',
    links: [
      {
        key: 'compliance-eeo',
        label: 'EEO Reports',
        href: ROUTES.OFFICE.COMPLIANCE.EEO_REPORTS.path,
      },
      {
        key: 'compliance-project-hiring',
        label: 'Project Hiring',
        href: ROUTES.OFFICE.COMPLIANCE.PROJECT_HIRING.path,
      },
    ],
  },
]
