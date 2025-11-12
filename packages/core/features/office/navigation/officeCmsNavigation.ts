import { ROUTES } from '@app/core/constants/routes'
import type { OfficeAccordionSection, OfficeTabsItem } from '@app/ui'

export const CMS_TABS: OfficeTabsItem[] = [
  {
    key: 'cms-manage-users',
    label: 'Manage Users',
    href: ROUTES.OFFICE_CMS.path,
  },
  {
    key: 'cms-jobs',
    label: ROUTES.OFFICE_CMS_JOBS.title,
    href: ROUTES.OFFICE_CMS_JOBS.path,
  },
  {
    key: 'cms-teams',
    label: ROUTES.OFFICE_CMS_TEAMS.title,
    href: ROUTES.OFFICE_CMS_TEAMS.path,
  },
  {
    key: 'cms-universities',
    label: ROUTES.OFFICE_CMS_UNIVERSITIES.title,
    href: ROUTES.OFFICE_CMS_UNIVERSITIES.path,
  },
  {
    key: 'cms-organizations',
    label: ROUTES.OFFICE_CMS_ORGANIZATIONS.title,
    href: ROUTES.OFFICE_CMS_ORGANIZATIONS.path,
  },
  {
    key: 'cms-welcome',
    label: ROUTES.OFFICE_CMS_WELCOME.title,
    href: ROUTES.OFFICE_CMS_WELCOME.path,
  },
  {
    key: 'cms-applications',
    label: ROUTES.OFFICE_ATS.title,
    href: ROUTES.OFFICE_ATS.path,
  },
]

export const CMS_ACCORDION_SECTIONS: OfficeAccordionSection[] = [
  {
    key: 'cms-users',
    title: 'Manage Users',
    defaultOpen: true,
    links: [
      {
        key: 'users-overview',
        label: 'Overview',
        href: ROUTES.OFFICE_CMS.path,
      },
      {
        key: 'users-directory',
        label: 'User Directory',
        href: ROUTES.OFFICE_CMS_WORKERS.path,
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
        href: ROUTES.OFFICE_CMS_JOBS.path,
      },
      {
        key: 'jobs-create',
        label: 'Create Job',
        href: ROUTES.OFFICE_CMS_JOBS_CREATE.path,
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
        href: ROUTES.OFFICE_CMS_TEAMS.path,
      },
      {
        key: 'teams-create',
        label: 'Create Team',
        href: ROUTES.OFFICE_CMS_TEAMS_CREATE.path,
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
        href: ROUTES.OFFICE_CMS_UNIVERSITIES.path,
      },
      {
        key: 'universities-create',
        label: 'Create University',
        href: ROUTES.OFFICE_CMS_UNIVERSITIES_CREATE.path,
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
        href: ROUTES.OFFICE_CMS_ORGANIZATIONS.path,
      },
      {
        key: 'organizations-create',
        label: 'Create Organization',
        href: ROUTES.OFFICE_CMS_ORGANIZATIONS_CREATE.path,
      },
    ],
  },
  {
    key: 'cms-welcome',
    title: 'CMS Content',
    links: [
      {
        key: 'welcome-list',
        label: 'Welcome Slides',
        href: ROUTES.OFFICE_CMS_WELCOME.path,
      },
      {
        key: 'welcome-create',
        label: 'Create Slide',
        href: ROUTES.OFFICE_CMS_WELCOME_CREATE.path,
      },
    ],
  },
  {
    key: 'cms-ats',
    title: 'Applications & Background Checks',
    links: [
      {
        key: 'ats-dashboard',
        label: 'Applications Dashboard',
        href: ROUTES.OFFICE_ATS.path,
      },
      {
        key: 'ats-background-checks',
        label: 'Background Checks',
        href: ROUTES.OFFICE_ATS_CHECKS.path,
      },
      {
        key: 'ats-request',
        label: 'Request Background Check',
        href: ROUTES.OFFICE_ATS_CHECKS_REQUEST.path,
      },
    ],
  },
]


