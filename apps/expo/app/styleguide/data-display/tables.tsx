// @ts-nocheck
import React from 'react'
import { Paragraph, YStack } from '@app/ui'
import { DataTable } from '@app/ui'
import type { DataTableColumn } from '@app/ui'
import { StyleguidePage } from '../_components/StyleguidePage'
import { AnchorHeading } from '../_components/AnchorHeading'

const rows = [
  { id: 1, name: 'Safety Training', status: 'Complete', owner: 'Morgan' },
  { id: 2, name: 'Annual Review', status: 'Pending', owner: 'Kai' },
  { id: 3, name: 'Equipment Audit', status: 'In progress', owner: 'Reese' },
]

const columns: DataTableColumn<(typeof rows)[number]>[] = [
  { header: 'Program', accessorKey: 'name' },
  { header: 'Status', accessorKey: 'status' },
  { header: 'Owner', accessorKey: 'owner' },
]

export default function TablesPage() {
  return (
    <StyleguidePage
      title="Tables"
      description="Striped, bordered, and condensed table variations backed by DataTable component."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="tables-default"
          title="Default table"
          description="DataTable with alternating row colors."
        />
        <DataTable data={rows} columns={columns} striped bordered caption="Compliance programs" />
        <Paragraph fontSize={12} color="$color10">
          DataTable lives in packages/ui/src/components/table and supports virtualization for large
          data sets.
        </Paragraph>
      </YStack>
    </StyleguidePage>
  )
}
