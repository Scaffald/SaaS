import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, Link } from 'expo-router'
import type { Href } from 'expo-router'
import { ScaffaldLogo } from '@app/core/assets'
import {
  Anchor,
  Button,
  H1,
  Paragraph,
  ScrollView,
  Separator,
  Text,
  XStack,
  YStack,
  useTheme,
  Input,
  Sheet,
  Adapt,
  ListItem,
} from 'tamagui'
import { Menu, Search, ExternalLink } from '@tamagui/lucide-icons'
import { useStyleguideContext } from './StyleguideContext'
import type { ReactNode } from 'react'

export type StyleguideShellProps = {
  title: string
  description?: string
  badge?: ReactNode
  children: ReactNode
}

export function StyleguideShell({ title, description, badge, children }: StyleguideShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const theme = useTheme()
  const { navGroups, approvalQueue, searchIndex, searchQuery, setSearchQuery } =
    useStyleguideContext()
  const [navOpen, setNavOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const filteredSearch = useMemo(() => {
    if (!searchQuery) return []
    const query = searchQuery.toLowerCase()
    return searchIndex
      .filter((entry) =>
        [entry.title, entry.description, ...(entry.keywords ?? [])]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query)),
      )
      .slice(0, 8)
  }, [searchIndex, searchQuery])

  const navContent = (
    <YStack gap="$3" padding="$4" width={260}>
      {navGroups.map((group) => (
        <YStack key={group.id} gap="$2">
          <Text fontWeight="700" color="$gray10">
            {group.title}
          </Text>
          <YStack borderRadius="$4" backgroundColor="$gray2">
            {group.items.map((item) => {
              const active = pathname === item.path
              const href = item.path as Href
              return (
                <Link
                  key={item.slug}
                  href={href}
                  asChild
                  style={{ textDecoration: 'none' }}
                >
                  <ListItem
                    pressTheme
                    backgroundColor={active ? '$accent3' : 'transparent'}
                    hoverTheme
                    paddingVertical="$2"
                    borderRadius="$4"
                  >
                    <Text color={active ? '$accent11' : '$color'} fontWeight={active ? '700' : '500'}>
                      {item.title}
                    </Text>
                    {item.description && (
                      <Text fontSize={12} color="$gray9">
                        {item.description}
                      </Text>
                    )}
                  </ListItem>
                </Link>
              )
            })}
          </YStack>
        </YStack>
      ))}
    </YStack>
  )

  return (
    <YStack flex={1} backgroundColor="$gray1">
      <Anchor href="#main-content" position="absolute" left={-999} focusStyle={{ left: 12, top: 12 }}>
        Skip to content
      </Anchor>
      <XStack
        alignItems="center"
        justifyContent="space-between"
        padding="$4"
        borderBottomWidth={1}
        borderColor="$gray5"
        backgroundColor="$colorTransparent"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <XStack alignItems="center" gap="$3">
          <Button
            onPress={() => setNavOpen(true)}
            backgroundColor="transparent"
            color="$color"
            size="$3"
            chromeless
            $gtSm={{ display: 'none' }}
          >
            <Menu size={20} />
          </Button>
          <Link href="/styleguide" asChild>
            <XStack alignItems="center" gap="$2">
              <ScaffaldLogo height={24} />
              <Text fontWeight="700" fontSize={16}>
                Scaffald Styleguide
              </Text>
              {approvalQueue.length > 0 && (
                <XStack
                  backgroundColor="$yellow8"
                  paddingHorizontal="$2"
                  paddingVertical={2}
                  borderRadius="$3"
                >
                  <Text fontSize={11} fontWeight="700" color="$yellow12">
                    {approvalQueue.length} pending
                  </Text>
                </XStack>
              )}
            </XStack>
          </Link>
        </XStack>

        <XStack alignItems="center" gap="$3" flex={1} justifyContent="flex-end">
          <XStack
            alignItems="center"
            backgroundColor="$gray2"
            borderRadius="$5"
            paddingHorizontal="$3"
            gap="$2"
            width="60%"
            $sm={{ display: 'none' }}
          >
            <Search size={16} color={theme.gray10.val} />
            <Input
              flex={1}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search components, tokens, docs"
              backgroundColor="transparent"
              ref={searchInputRef}
            />
          </XStack>
          <Anchor href="https://github.com/scaffald/scf-neue" target="_blank">
            <XStack alignItems="center" gap="$1">
              <ExternalLink size={16} />
              <Text>Monorepo</Text>
            </XStack>
          </Anchor>
        </XStack>
      </XStack>

      {filteredSearch.length > 0 && (
        <YStack
          position="absolute"
          right={32}
          top={76}
          width={360}
          maxHeight={320}
          borderWidth={1}
          borderColor="$gray5"
          borderRadius="$6"
          backgroundColor="$color"
          shadowColor="rgba(0,0,0,0.15)"
          shadowRadius={12}
          overflow="hidden"
          $sm={{ display: 'none' }}
        >
          {filteredSearch.map((entry) => (
            <Link key={entry.path + entry.title} href={entry.path as Href} asChild>
              <ListItem
                padding="$3"
                hoverTheme
                onPress={() => {
                  router.push(entry.path as Href)
                  setSearchQuery('')
                }}
              >
                <YStack>
                  <Text fontWeight="600">{entry.title}</Text>
                  {entry.description && (
                    <Text fontSize={12} color="$gray9">
                      {entry.description}
                    </Text>
                  )}
                </YStack>
              </ListItem>
            </Link>
          ))}
        </YStack>
      )}

      <XStack flex={1}>
        <YStack
          width={280}
          borderRightWidth={1}
          borderColor="$gray5"
          display="none"
          $gtSm={{ display: 'flex' }}
          maxHeight="100vh"
          position="sticky"
          top={72}
          bottom={0}
        >
          <ScrollView>{navContent}</ScrollView>
        </YStack>

        <ScrollView flex={1} id="main-content">
          <YStack padding="$6" gap="$4" maxWidth={960} marginHorizontal="auto">
            <YStack gap="$2">
              <XStack alignItems="center" gap="$3">
                <H1>{title}</H1>
                {badge}
              </XStack>
              {description && <Paragraph color="$gray11">{description}</Paragraph>}
            </YStack>
            <Separator />
            {children}
          </YStack>
        </ScrollView>
      </XStack>

      <Adapt when="sm" platform="native">
        <Sheet modal snapPoints={[80]} open={navOpen} onOpenChange={setNavOpen}>
          <Sheet.Frame padding="$4">
            <Sheet.ScrollView>{navContent}</Sheet.ScrollView>
          </Sheet.Frame>
        </Sheet>
      </Adapt>
    </YStack>
  )
}
