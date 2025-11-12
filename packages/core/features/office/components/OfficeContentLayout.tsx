import type { ReactNode } from 'react'
import { usePathname } from 'expo-router'
import {
  DashboardLayout,
  H2,
  Paragraph,
  QuickLinksSidebar,
  OfficeTabs,
  OfficeAccordion,
  type OfficeTabsItem,
  type OfficeAccordionSection,
  YStack,
} from '@app/ui'

export interface OfficeContentLayoutProps {
  title: string
  description?: string
  tabs: OfficeTabsItem[]
  accordionSections: OfficeAccordionSection[]
  children: ReactNode
  currentPath?: string
  rightContentHeading?: string
}

export const OfficeContentLayout = ({
  title,
  description,
  tabs,
  accordionSections,
  children,
  currentPath,
  rightContentHeading,
}: OfficeContentLayoutProps) => {
  const pathname = currentPath ?? usePathname()

  return (
    <DashboardLayout
      leftContent={
        <YStack gap="$4" px="$4" py="$4">
          <YStack gap="$2">
            <H2>{title}</H2>
            {description ? (
              <Paragraph size="$4" color="$color11">
                {description}
              </Paragraph>
            ) : null}
          </YStack>

          {tabs.length > 0 ? <OfficeTabs items={tabs} currentPath={pathname ?? ''} /> : null}

          {children}
        </YStack>
      }
      rightContent={
        accordionSections.length === 0 ? null : (
          <QuickLinksSidebar enabled={false}>
            <YStack gap="$3">
              {rightContentHeading ? (
                <Paragraph fontWeight="700" size="$4">
                  {rightContentHeading}
                </Paragraph>
              ) : null}
              <OfficeAccordion sections={accordionSections} currentPath={pathname ?? ''} />
            </YStack>
          </QuickLinksSidebar>
        )
      }
    />
  )
}


