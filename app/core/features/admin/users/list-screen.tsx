import { useMemo, useState, useDeferredValue, useEffect } from 'react'

import { BadgeCheck, Search } from '@tamagui/lucide-icons'

import {
  Button,
  Input,
  Paragraph,
  ScrollView,
  Separator,
  Spinner,
  Text,
  XStack,
  YStack,
  useTheme,
} from '@app/ui'
import { createAdminUsersHooks, type RouterOutputs } from '@app/core/utils/api'
import { Link } from 'solito/link'

import { formatBoolean, formatDate } from './formatters'

type SearchResult = RouterOutputs['admin']['users']['search']['results'][number]

const PAGE_SIZE = 20

type VerificationAwareCellProps = {
  value: string
  verified: boolean
}

const VerificationAwareCell = ({ value, verified }: VerificationAwareCellProps) => {
  const theme = useTheme()
  return (
    <XStack gap="$1" alignItems="center">
      <Text>{value}</Text>
      {verified ? <BadgeCheck size={14} color={theme.green10.val} aria-label="Verified" /> : null}
    </XStack>
  )
}

const hasVerifiedField = (fields: string[], verification: SearchResult['verification']) =>
  fields.some((field) => verification.fields.includes(field))

const columns = [
  {
    key: 'name',
    label: 'Name',
    getValue: (row: SearchResult) => row.displayName || row.fullName || '—',
    fields: ['basic.display_name', 'basic.full_name'],
  },
  {
    key: 'email',
    label: 'Email',
    getValue: (row: SearchResult) => row.email ?? '—',
    fields: ['contact.email'],
  },
  {
    key: 'phone',
    label: 'Phone',
    getValue: (row: SearchResult) => row.phone ?? '—',
    fields: ['contact.phone'],
  },
  {
    key: 'openToWork',
    label: 'Open to work',
    getValue: (row: SearchResult) => formatBoolean(row.openToWork),
    fields: ['availability.open_to_work'],
  },
  {
    key: 'updatedAt',
    label: 'Updated',
    getValue: (row: SearchResult) => formatDate(row.updatedAt),
    fields: [],
  },
]

export type AdminUsersListScreenProps = {
  organizationId?: string | null
}

export const AdminUsersListScreen = ({ organizationId }: AdminUsersListScreenProps) => {
  const hooks = useMemo(() => createAdminUsersHooks(organizationId ?? null), [organizationId])
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearch = useDeferredValue(searchTerm)
  const [page, setPage] = useState(0)
  const offset = page * PAGE_SIZE

  useEffect(() => {
    setPage(0)
  }, [deferredSearch])

  const searchQuery = hooks.useSearch({
    query: deferredSearch.trim() ? deferredSearch.trim() : undefined,
    limit: PAGE_SIZE,
    offset,
  })

  const searchData = searchQuery.data as RouterOutputs['admin']['users']['search'] | undefined
  const results = searchData?.results ?? []
  const total = searchData?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const isUnauthorized = searchQuery.error?.data?.code === 'FORBIDDEN'

  return (
    <YStack flex={1} gap="$4">
      <XStack gap="$3" alignItems="center">
        <XStack
          flex={1}
          borderWidth={1}
          borderColor="$color5"
          borderRadius="$6"
          paddingHorizontal="$3"
          paddingVertical="$2"
          alignItems="center"
          gap="$2"
        >
          <Search size={18} color="var(--color-gray10)" />
          <Input
            flex={1}
            borderWidth={0}
            backgroundColor="transparent"
            placeholder="Search by name, username, or email"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </XStack>
        <Paragraph size="$3">{total ? `${total} users` : 'No users found'}</Paragraph>
      </XStack>

      {searchQuery.isPending ? (
        <XStack justifyContent="center" padding="$4">
          <Spinner size="large" />
        </XStack>
      ) : isUnauthorized ? (
        <Paragraph color="$red10">
          You do not have permission to view this organization&apos;s members. Confirm you are
          assigned an admin role for the selected organization.
        </Paragraph>
      ) : searchQuery.error ? (
        <Paragraph color="$red10">{searchQuery.error.message}</Paragraph>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          borderRadius="$4"
          borderWidth={1}
          borderColor="$color5"
        >
          <YStack minWidth={800} flex={1}>
            <XStack backgroundColor="$color3" paddingVertical="$2" paddingHorizontal="$3" gap="$3">
              {columns.map((column) => (
                <Text key={column.key} flex={1} fontWeight="700">
                  {column.label}
                </Text>
              ))}
            </XStack>
            <Separator />
            {results.map((row) => {
              const href = `/admin/users/${row.id}${organizationId ? `?organizationId=${organizationId}` : ''}`
              return (
                <YStack key={row.id}>
                  <Link href={href}>
                    <XStack
                      tag="a"
                      paddingVertical="$3"
                      paddingHorizontal="$3"
                      gap="$3"
                      alignItems="center"
                      hoverStyle={{ backgroundColor: '$color2' }}
                      pressStyle={{ backgroundColor: '$color3' }}
                      cursor="pointer"
                    >
                      {columns.map((column) => (
                        <XStack key={column.key} flex={1}>
                          <VerificationAwareCell
                            value={column.getValue(row)}
                            verified={
                              column.fields.length
                                ? hasVerifiedField(column.fields, row.verification)
                                : false
                            }
                          />
                        </XStack>
                      ))}
                    </XStack>
                  </Link>
                  <Separator />
                </YStack>
              )
            })}
            {!results.length ? (
              <XStack padding="$4" justifyContent="center">
                <Paragraph>No results found.</Paragraph>
              </XStack>
            ) : null}
          </YStack>
        </ScrollView>
      )}

      {totalPages > 1 ? (
        <XStack justifyContent="space-between" alignItems="center">
          <Paragraph>
            Page {page + 1} of {totalPages}
          </Paragraph>
          <XStack gap="$2">
            <Button
              disabled={page === 0}
              onPress={() => setPage((current) => Math.max(0, current - 1))}
            >
              Previous
            </Button>
            <Button
              disabled={page + 1 >= totalPages}
              onPress={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
            >
              Next
            </Button>
          </XStack>
        </XStack>
      ) : null}
    </YStack>
  )
}
