/**
 * Table component stories
 */

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { View, StyleSheet } from 'react-native'
import {
  Table,
  TableCell,
  TableColumnHeader,
  ExpandedTableRow,
} from '../../../components/Table'
import { spacing } from '../../../tokens/spacing'
import type { TableColumn } from '../../../components/Table'

const meta = {
  title: 'Components/Table',
  component: Table,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

// Mock data
const mockColumns: TableColumn[] = [
  { id: 'name', title: 'Name', sortable: true, width: 191 },
  { id: 'email', title: 'Email', sortable: true, width: 191 },
  { id: 'role', title: 'Role', width: 191 },
  { id: 'status', title: 'Status', width: 143 },
  { id: 'actions', title: 'Actions', width: 157 },
  { id: 'more', title: '', width: 92 },
]

const mockData = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'Inactive',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Editor',
    status: 'Active',
  },
]

// Basic table
export const Default: Story = {
  render: () => {
    const [searchValue, setSearchValue] = useState('')

    return (
      <View style={styles.container}>
        <Table
          columns={mockColumns}
          data={mockData}
          searchable
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          actions={[
            { label: 'Export', onPress: () => console.log('Export') },
            { label: 'Add New', onPress: () => console.log('Add New') },
          ]}
          pagination={{ totalPages: 5, currentPage: 1 }}
        />
      </View>
    )
  },
}

// Table with all cell types
export const CellTypes: Story = {
  render: () => (
    <View style={styles.container}>
      <View style={styles.section}>
        <TableCell type="interactive-default" text="Interactive Default" />
        <TableCell type="interactive-hover" text="Interactive Hover" />
        <TableCell type="interactive-focused" text="Interactive Focused" />
        <TableCell type="interactive-error" text="Interactive Error" />
      </View>

      <View style={styles.section}>
        <TableCell type="text-default" text="Text Cell" description="With description" />
        <TableCell type="text-default" text="With Checkbox" showCheckbox checked={false} />
        <TableCell type="text-default" text="With Radio" showRadio radioChecked={false} />
        <TableCell type="text-default" text="With Switch" showSwitch switchChecked={false} />
      </View>

      <View style={styles.section}>
        <TableCell type="status" statusType="success" statusLabel="Active" />
        <TableCell type="status" statusType="error" statusLabel="Error" />
        <TableCell type="status" statusType="warning" statusLabel="Warning" />
      </View>

      <View style={styles.section}>
        <TableCell type="checkbox-only" checked={false} />
        <TableCell type="radio-only" checked={false} />
        <TableCell type="switch-only" checked={false} />
      </View>

      <View style={styles.section}>
        <TableCell type="icon-open" />
        <TableCell type="icon-close" />
        <TableCell type="more" />
      </View>

      <View style={styles.section}>
        <TableCell type="progress-bar" progress={70} />
        <TableCell type="rating" rating={4} />
      </View>

      <View style={styles.section}>
        <TableCell
          type="labels"
          labels={['Beyond UI', 'Figma', 'React']}
          maxLabels={2}
        />
      </View>

      <View style={styles.section}>
        <TableCell type="empty" width={60} />
      </View>
    </View>
  ),
}

// Table with sorting
export const WithSorting: Story = {
  render: () => {
    const [sortConfig, setSortConfig] = useState<{ columnId: string | null; direction: 'asc' | 'desc' | null }>({
      columnId: null,
      direction: null,
    })

    return (
      <View style={styles.container}>
        <Table
          columns={mockColumns}
          data={mockData}
          sortConfig={sortConfig}
          onSort={(columnId, direction) => setSortConfig({ columnId, direction })}
        />
      </View>
    )
  },
}

// Table with selection
export const WithSelection: Story = {
  render: () => {
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const columnsWithSelection: TableColumn[] = [
      { id: 'select', title: '', showCheckbox: true, width: 40 },
      ...mockColumns,
    ]

    return (
      <View style={styles.container}>
        <Table
          columns={columnsWithSelection}
          data={mockData}
          selectableRows
          selectionConfig={{
            selectedIds: new Set(selectedIds),
            mode: 'multiple',
            allSelected: selectedIds.length === mockData.length,
            indeterminate: selectedIds.length > 0 && selectedIds.length < mockData.length,
          }}
          onRowSelect={setSelectedIds}
        />
      </View>
    )
  },
}

// Table with expansion
export const WithExpansion: Story = {
  render: () => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

    const dataWithExpansion = mockData.map((row) => ({
      ...row,
      expandedData: {
        title: row.name,
        items: [
          { label: 'Full Address', value: '123 Main St, City, State 12345' },
          { label: 'CEO', value: row.name },
          { label: 'Website', value: 'www.example.com' },
        ],
      },
    }))

    return (
      <View style={styles.container}>
        <Table
          columns={mockColumns}
          data={dataWithExpansion}
          expandableRows
          expansionConfig={{
            expandedIds,
            allowMultiple: true,
          }}
          onRowExpand={(rowId, expanded) => {
            const newExpanded = new Set(expandedIds)
            if (expanded) {
              newExpanded.add(rowId)
            } else {
              newExpanded.delete(rowId)
            }
            setExpandedIds(newExpanded)
          }}
        />
      </View>
    )
  },
}

// Table with custom cell rendering
export const CustomCellRendering: Story = {
  render: () => {
    const columnsWithCustomRender: TableColumn[] = [
      { id: 'name', title: 'Name', sortable: true, width: 191 },
      {
        id: 'status',
        title: 'Status',
        width: 143,
        cellType: 'status',
        render: (value) => (
          <TableCell
            type="status"
            statusType={value === 'Active' ? 'success' : 'error'}
            statusLabel={String(value)}
          />
        ),
      },
      {
        id: 'progress',
        title: 'Progress',
        width: 191,
        cellType: 'progress-bar',
        render: () => <TableCell type="progress-bar" progress={75} />,
      },
      {
        id: 'actions',
        title: 'Actions',
        width: 157,
        render: () => (
          <TableCell
            type="actions"
            actions={[
              { icon: () => null, onPress: () => console.log('Share'), label: 'Share' },
              { icon: () => null, onPress: () => console.log('Edit'), label: 'Edit' },
              { icon: () => null, onPress: () => console.log('Delete'), label: 'Delete' },
            ]}
          />
        ),
      },
    ]

    const dataWithCustom = [
      { id: '1', name: 'John Doe', status: 'Active', progress: 75 },
      { id: '2', name: 'Jane Smith', status: 'Inactive', progress: 50 },
    ]

    return (
      <View style={styles.container}>
        <Table columns={columnsWithCustomRender} data={dataWithCustom} />
      </View>
    )
  },
}

// Expanded row variants
export const ExpandedRowVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <View style={styles.section}>
        <ExpandedTableRow
          variant="variant2"
          title="Company Name"
          infoItems={[
            { label: 'Full Address', value: '123 Main St, City, State 12345' },
            { label: 'CEO', value: 'John Doe' },
            { label: 'Website', value: 'www.example.com' },
            { label: 'Contact Person', value: 'Jane Smith' },
            { label: 'Contact Email', value: 'contact@example.com' },
            { label: 'Phone Number', value: '+1 (234) 567 123' },
          ]}
        />
      </View>

      <View style={styles.section}>
        <ExpandedTableRow
          variant="default"
          fields={[
            { label: 'Name', placeholder: 'Enter name', type: 'name' },
            { label: 'Email', placeholder: 'Enter email', type: 'email' },
            { label: 'Phone', placeholder: 'Enter phone', type: 'phone' },
          ]}
          columns={3}
        />
      </View>
    </View>
  ),
}

// Column header variants
export const ColumnHeaderVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <View style={styles.row}>
        <TableColumnHeader title="Default Header" />
        <TableColumnHeader title="Sortable" sortable />
        <TableColumnHeader title="Sorted Asc" sortable sortDirection="asc" />
        <TableColumnHeader title="Sorted Desc" sortable sortDirection="desc" />
      </View>

      <View style={styles.row}>
        <TableColumnHeader title="With Checkbox" showCheckbox checked={false} />
        <TableColumnHeader title="All Selected" showCheckbox checked={true} />
        <TableColumnHeader state="empty" width={169} />
      </View>
    </View>
  ),
}

// Full featured table
export const FullFeatured: Story = {
  render: () => {
    const [searchValue, setSearchValue] = useState('')
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
    const [sortConfig, setSortConfig] = useState<{ columnId: string | null; direction: 'asc' | 'desc' | null }>({
      columnId: null,
      direction: null,
    })

    const fullColumns: TableColumn[] = [
      { id: 'select', title: '', showCheckbox: true, width: 40 },
      { id: 'expand', title: '', width: 40 },
      { id: 'name', title: 'Name', sortable: true, width: 191 },
      { id: 'email', title: 'Email', sortable: true, width: 191 },
      { id: 'status', title: 'Status', width: 143 },
      { id: 'actions', title: 'Actions', width: 157 },
    ]

    const fullData = mockData.map((row) => ({
      ...row,
      expandedData: {
        title: row.name,
        items: [
          { label: 'Role', value: row.role },
          { label: 'Status', value: row.status },
        ],
      },
    }))

    return (
      <View style={styles.container}>
        <Table
          columns={fullColumns}
          data={fullData}
          searchable
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          actions={[
            { label: 'Export', onPress: () => console.log('Export') },
            { label: 'Add New', onPress: () => console.log('Add New') },
          ]}
          selectableRows
          selectionConfig={{
            selectedIds: new Set(selectedIds),
            mode: 'multiple',
            allSelected: selectedIds.length === fullData.length,
          }}
          onRowSelect={setSelectedIds}
          expandableRows
          expansionConfig={{
            expandedIds,
            allowMultiple: false,
          }}
          onRowExpand={(rowId, expanded) => {
            const newExpanded = new Set()
            if (expanded) {
              newExpanded.add(rowId)
            }
            setExpandedIds(newExpanded)
          }}
          sortConfig={sortConfig}
          onSort={(columnId, direction) => setSortConfig({ columnId, direction })}
          pagination={{ totalPages: 10, currentPage: 1, onPageChange: (page) => console.log('Page:', page) }}
        />
      </View>
    )
  },
}

const styles = StyleSheet.create({
  container: {
    width: 1220,
    padding: spacing[32],
  },
  section: {
    marginBottom: spacing[24],
  },
  row: {
    flexDirection: 'row',
    marginBottom: spacing[16],
  },
})
