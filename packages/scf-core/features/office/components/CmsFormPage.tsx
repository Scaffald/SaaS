import type { ReactNode } from 'react'
import { ScreenHeader, Stack } from '@scaffald/ui'
import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'

/**
 * The page around a CMS create or edit form (#1098).
 *
 * The four create pages (projects, organizations, teams, universities) each
 * laid themselves out differently: a centred 800px stack with a small sans
 * title, a full-bleed tinted ScrollView with no gaps between fields, a lone
 * select on white with no title, and a widget whose border ran to the screen
 * edges at 390. One shell for all of them: the office gutter, a ScreenHeader,
 * and a single readable column.
 */
export function CmsFormPage({
  title,
  tip,
  kicker = 'Content management',
  children,
}: {
  title: string
  tip?: string
  kicker?: string
  children: ReactNode
}) {
  return (
    <OfficeLayout
      leftContent={
        <Stack gap={16}>
          <ScreenHeader kicker={kicker} title={title} tip={tip} />
          <Stack gap={16} style={{ maxWidth: 720, width: '100%' }}>
            {children}
          </Stack>
        </Stack>
      }
      leftContainerProps={{ minWidth: '100%' }}
    />
  )
}
