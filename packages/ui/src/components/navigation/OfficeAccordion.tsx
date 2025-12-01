import { ChevronDown } from '@tamagui/lucide-icons'
import { Link } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Accordion, Button, Paragraph, XStack, YStack } from 'tamagui'

type AccordionItemLink = {
  key: string
  label: string
  href: string
  description?: string
}

export type OfficeAccordionSection = {
  key: string
  title: string
  description?: string
  links: AccordionItemLink[]
  defaultOpen?: boolean
}

export type OfficeAccordionProps = {
  sections: OfficeAccordionSection[]
  currentPath: string
  ariaLabel?: string
}

const isPathActive = (currentPath: string, targetHref: string) => {
  if (!targetHref) return false
  if (currentPath === targetHref) return true

  const base = targetHref.split('/:')[0]
  if (!base) return false

  return currentPath === base || currentPath.startsWith(`${base}/`)
}

export const OfficeAccordion = ({
  sections,
  currentPath,
  ariaLabel = 'Office quick links',
}: OfficeAccordionProps) => {
  const defaultKeys = useMemo(
    () => sections.filter((section) => section.defaultOpen).map((section) => section.key),
    [sections]
  )
  const [openKeys, setOpenKeys] = useState<string[]>(defaultKeys)

  const handleValueChange = useCallback((value: string[]) => {
    setOpenKeys(value)
  }, [])

  return (
    <Accordion
      type="multiple"
      value={openKeys}
      onValueChange={handleValueChange}
      aria-label={ariaLabel}
    >
      {sections.map((section) => (
        <Accordion.Item
          key={section.key}
          value={section.key}
          borderBottomWidth={1}
          borderColor="$borderColor"
        >
          <Accordion.Trigger px="$4" py="$3" bg="$color2" pressStyle={{ bg: '$color3' }}>
            {({ open }: { open: boolean }) => (
              <XStack items="center" justify="space-between" gap="$2">
                <YStack gap="$1">
                  <Paragraph fontWeight="700">{section.title}</Paragraph>
                  {section.description ? (
                    <Paragraph size="$2" color="$color11">
                      {section.description}
                    </Paragraph>
                  ) : null}
                </YStack>
                <ChevronDown size={16} rotate={open ? '180deg' : '0deg'} />
              </XStack>
            )}
          </Accordion.Trigger>
          <Accordion.Content px="$4" py="$3" bg="$color1">
            <YStack gap="$2">
              {section.links.map((link) => {
                const active = isPathActive(currentPath, link.href)
                return (
                  <Link key={link.key} href={link.href} asChild>
                    <Button
                      variant={active ? undefined : 'outlined'}
                      size="$3"
                      aria-selected={active}
                      borderColor={active ? '$color9' : '$borderColor'}
                      bg={active ? '$color9' : 'transparent'}
                      hoverStyle={{
                        bg: active ? '$color9' : '$color3',
                      }}
                      pressStyle={{
                        bg: active ? '$color9' : '$color4',
                      }}
                    >
                      <XStack items="center" justify="space-between" flex={1}>
                        <YStack gap="$1" items="flex-start" flex={1}>
                          <Paragraph fontWeight="600" color={active ? '$color1' : '$color11'}>
                            {link.label}
                          </Paragraph>
                          {link.description ? (
                            <Paragraph size="$2" color={active ? '$color2' : '$color11'}>
                              {link.description}
                            </Paragraph>
                          ) : null}
                        </YStack>
                      </XStack>
                    </Button>
                  </Link>
                )
              })}
            </YStack>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion>
  )
}
