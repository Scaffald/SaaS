import * as React from 'react'
import { Avatar, Text, YStack } from 'tamagui'

import type { DataTableColumn } from './DataTable'
import { DataTable } from './DataTable'
import { makeData, type Person } from './utils/makeData'

const columns: DataTableColumn<Person>[] = [
  {
    key: 'avatar',
    header: 'Avatar',
    sortable: false,
    searchable: false,
    width: '$7',
    align: 'center',
    renderCell: (value) => (
      <Avatar circular size="$3">
        <Avatar.Image accessibilityLabel="Profile image" src={String(value ?? '')} />
        <Avatar.Fallback backgroundColor="$gray6" />
      </Avatar>
    ),
  },
  {
    key: 'firstName',
    header: 'First name',
    align: 'start',
    filterValue: (row) => `${row.firstName} ${row.lastName}`,
  },
  {
    key: 'lastName',
    header: 'Last name',
    align: 'start',
  },
  {
    key: 'age',
    header: 'Age',
    align: 'center',
    width: '$8',
    renderCell: (value) => <Text>{value as number}</Text>,
  },
  {
    key: 'visits',
    header: 'Visits',
    align: 'end',
    width: '$9',
    renderCell: (value) => <Text>{value as number}</Text>,
  },
  {
    key: 'status',
    header: 'Status',
    align: 'center',
    width: '$10',
    renderCell: (value) => <Text textTransform="capitalize">{String(value ?? '')}</Text>,
  },
  {
    key: 'progress',
    header: 'Progress',
    align: 'end',
    width: '$9',
    renderCell: (value) => <Text>{`${value as number}%`}</Text>,
  },
]

export function SortableTable() {
  const [data, setData] = React.useState<Person[]>([])

  React.useEffect(() => {
    setData(makeData(250))
  }, [])

  return (
    <DataTable
      data={data}
      columns={columns}
      pageSize={10}
      defaultSort={{ key: 'firstName', desc: false }}
      searchPlaceholder="Search people by name or status"
      searchableColumns={['firstName', 'lastName', 'status']}
      renderEmptyState={({ totalItems }) => (
        <YStack alignItems="center" gap="$2" padding="$6">
          <Text fontWeight="$6" fontSize="$5">
            {totalItems === 0 ? 'Loading people…' : 'No people found'}
          </Text>
          <Text color="$gray11" fontSize="$3">
            {totalItems === 0
              ? 'Generating sample data for the table.'
              : 'Try a different search term.'}
          </Text>
        </YStack>
      )}
    />
  )
}

SortableTable.fileName = 'SortableTable'
