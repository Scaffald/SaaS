import { useState } from 'react'
import { YStack, XStack, Text, Input, DataTable, Button } from '@app/ui'
import { Select, Adapt, Sheet } from 'tamagui'
import { api } from '@app/core/utils/api'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Plus, Trash2, Pencil } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'

type University = {
  id: string
  name: string
  slug: string
  country: string
  alpha_two_code: string
  state_province: string | null
  domains: string[]
  web_pages: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

const columnHelper = createColumnHelper<University>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <Text numberOfLines={1} ellipsizeMode="tail">
        {info.getValue()}
      </Text>
    ),
  }),
  columnHelper.accessor('country', {
    header: 'Country',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('state_province', {
    header: 'State/Province',
    cell: (info) => info.getValue() || '-',
  }),
  columnHelper.accessor('alpha_two_code', {
    header: 'Code',
    cell: (info) => info.getValue().toUpperCase(),
  }),
  columnHelper.accessor('domains', {
    header: 'Domains',
    cell: (info) => {
      const domains = info.getValue()
      if (!domains || domains.length === 0) return '-'
      return (
        <Text numberOfLines={1} ellipsizeMode="tail">
          {domains.join(', ')}
        </Text>
      )
    },
  }),
  columnHelper.accessor('created_at', {
    header: 'Created',
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
]

interface OfficeUniversitiesListProps {
  onEdit: (university: University) => void
  onRefresh?: () => void
}

export function OfficeUniversitiesList({ onEdit, onRefresh }: OfficeUniversitiesListProps) {
  const toast = useToastController()
  const [search, setSearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  const { data, isLoading, refetch } = api.office.universities.getUniversities.useQuery({
    page,
    pageSize,
    search: search || undefined,
    country: selectedCountry === 'all' ? undefined : selectedCountry,
    sortBy: 'name',
    sortOrder: 'asc',
  })

  const { data: countriesData } = api.office.universities.getCountries.useQuery()

  const deleteMutation = api.office.universities.deleteUniversity.useMutation({
    onSuccess: () => {
      toast.show('Success', {
        message: 'University deleted successfully',
      })
      refetch()
      onRefresh?.()
    },
    // biome-ignore lint/suspicious/noExplicitAny: tRPC error type
    onError: (error: any) => {
      toast.show('Error', {
        message: error.message || 'Failed to delete university',
      })
    },
  })

  const handleDelete = async (university: University) => {
    if (confirm(`Are you sure you want to delete "${university.name}"?`)) {
      await deleteMutation.mutateAsync({ id: university.id })
    }
  }

  const universities = data?.universities ?? []
  const totalPages = data?.totalPages ?? 1

  const countries = [
    { value: 'all', label: 'All Countries' },
    ...(countriesData?.countries.map((c: { country: string; count: number }) => ({
      value: c.country,
      label: `${c.country} (${c.count})`,
    })) ?? []),
  ]

  return (
    <YStack flex={1} bg="$background" height="100vh">
      {/* Header */}
      <YStack
        p="$4"
        gap="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        bg="$background"
      >
        <XStack gap="$4" items="center" flexWrap="wrap">
          <Text fontSize="$8" fontWeight="bold">
            Universities
          </Text>
          <XStack flex={1} gap="$3" items="center" minW={300}>
            <Input
              flex={1}
              placeholder="Search universities..."
              value={search}
              onChangeText={setSearch}
            />
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <Select.Trigger minWidth={200}>
                <Select.Value placeholder="Filter by country" />
              </Select.Trigger>

              <Adapt when="sm" platform="touch">
                <Sheet native modal dismissOnSnapToBottom>
                  <Sheet.Frame>
                    <Sheet.ScrollView>
                      <Adapt.Contents />
                    </Sheet.ScrollView>
                  </Sheet.Frame>
                  <Sheet.Overlay />
                </Sheet>
              </Adapt>

              <Select.Content zIndex={200000}>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  {countries.map((country, index) => (
                    <Select.Item key={country.value} value={country.value} index={index}>
                      <Select.ItemText>{country.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select>
          </XStack>
          <Button icon={Plus} onPress={() => onEdit({} as University)} themeInverse>
            Create University
          </Button>
        </XStack>

        {/* Stats */}
        {data && (
          <XStack gap="$4" flexWrap="wrap">
            <Text fontSize="$2" color="$color11">
              Total: {data.total} universities
            </Text>
            <Text fontSize="$2" color="$color11">
              Page {data.page} of {data.totalPages}
            </Text>
          </XStack>
        )}
      </YStack>

      {/* Table - with scroll */}
      <YStack flex={1} overflow="hidden">
        <DataTable
          columns={
            [
              ...columns,
              columnHelper.display({
                id: 'actions',
                header: 'Actions',
                cell: (info) => {
                  const university = info.row.original
                  return (
                    <XStack gap="$2">
                      <Button
                        size="$2"
                        variant="outlined"
                        icon={Pencil}
                        onPress={() => onEdit(university)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="$2"
                        variant="outlined"
                        theme="red"
                        icon={Trash2}
                        onPress={() => handleDelete(university)}
                      >
                        Delete
                      </Button>
                    </XStack>
                  )
                },
              }),
            ] as ColumnDef<unknown, unknown>[]
          }
          data={universities}
          isLoading={isLoading}
          onRowClick={(university) => onEdit(university as University)}
          pageSize={pageSize}
          emptyMessage="No universities found"
        />
      </YStack>

      {/* Pagination */}
      {totalPages > 1 && (
        <XStack
          p="$4"
          gap="$3"
          items="center"
          justify="center"
          borderTopWidth={1}
          borderTopColor="$borderColor"
        >
          <Button size="$3" disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <Text>
            Page {page} of {totalPages}
          </Text>
          <Button
            size="$3"
            disabled={page >= totalPages}
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </XStack>
      )}
    </YStack>
  )
}
