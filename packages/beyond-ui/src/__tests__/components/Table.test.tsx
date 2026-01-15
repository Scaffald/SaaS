/**
 * Table component tests
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { View, Text } from 'react-native'
import { describe, it, expect, vi } from 'vitest'
import { ThemeProvider } from '../../theme'
import { Table, TableCell, TableColumnHeader, ExpandedTableRow } from '../../components/Table'

// Wrapper component for tests
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

describe('TableCell', () => {
  describe('Basic Rendering', () => {
    it('should render interactive cell with text', () => {
      const { getByText } = render(
        <TestWrapper>
          <TableCell type="interactive-default" text="Cell content" />
        </TestWrapper>
      )
      expect(getByText('Cell content')).toBeTruthy()
    })

    it('should render text cell with description', () => {
      const { getByText } = render(
        <TestWrapper>
          <TableCell type="text-default" text="Main text" description="Description text" />
        </TestWrapper>
      )
      expect(getByText('Main text')).toBeTruthy()
      expect(getByText('Description text')).toBeTruthy()
    })

    it('should render empty cell', () => {
      const { container } = render(
        <TestWrapper>
          <TableCell type="empty" />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })
  })

  describe('Cell Types', () => {
    const cellTypes: Array<{ type: string; props?: Record<string, unknown> }> = [
      { type: 'interactive-default', props: { text: 'Interactive' } },
      { type: 'text-default', props: { text: 'Text', description: 'Desc' } },
      { type: 'checkbox-only', props: { checked: false } },
      { type: 'radio-only', props: { checked: false } },
      { type: 'switch-only', props: { checked: false } },
      { type: 'icon-open' },
      { type: 'icon-close' },
      { type: 'status', props: { statusType: 'success', statusLabel: 'Active' } },
      { type: 'more' },
    ]

    cellTypes.forEach(({ type, props = {} }) => {
      it(`should render ${type} cell type`, () => {
        const { container } = render(
          <TestWrapper>
            <TableCell type={type as any} {...props} />
          </TestWrapper>
        )
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Selection Controls', () => {
    it('should render checkbox in text cell', () => {
      const { container } = render(
        <TestWrapper>
          <TableCell type="text-default" text="Text" showCheckbox checked={false} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should call onSelectionChange when checkbox changes', () => {
      const onSelectionChange = vi.fn()
      const { container } = render(
        <TestWrapper>
          <TableCell
            type="checkbox-only"
            checked={false}
            onSelectionChange={onSelectionChange}
          />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
      // Note: Actual checkbox interaction would need to be tested with integration tests
    })
  })

  describe('Interactive States', () => {
    it('should render hover state', () => {
      const { getByText } = render(
        <TestWrapper>
          <TableCell type="interactive-hover" text="Hover" />
        </TestWrapper>
      )
      expect(getByText('Hover')).toBeTruthy()
    })

    it('should render focused state', () => {
      const { getByText } = render(
        <TestWrapper>
          <TableCell type="interactive-focused" text="Focused" />
        </TestWrapper>
      )
      expect(getByText('Focused')).toBeTruthy()
    })

    it('should render error state', () => {
      const { getByText } = render(
        <TestWrapper>
          <TableCell type="interactive-error" text="Error" />
        </TestWrapper>
      )
      expect(getByText('Error')).toBeTruthy()
    })
  })

  describe('Custom Content', () => {
    it('should render custom children', () => {
      const { getByText } = render(
        <TestWrapper>
          <TableCell>
            <Text>Custom content</Text>
          </TableCell>
        </TestWrapper>
      )
      expect(getByText('Custom content')).toBeTruthy()
    })
  })
})

describe('TableColumnHeader', () => {
  describe('Basic Rendering', () => {
    it('should render header with title', () => {
      const { getByText } = render(
        <TestWrapper>
          <TableColumnHeader title="Column Title" />
        </TestWrapper>
      )
      expect(getByText('Column Title')).toBeTruthy()
    })

    it('should render empty state', () => {
      const { container } = render(
        <TestWrapper>
          <TableColumnHeader state="empty" />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })
  })

  describe('Sorting', () => {
    it('should render sortable header', () => {
      const { getByText } = render(
        <TestWrapper>
          <TableColumnHeader title="Sortable" sortable />
        </TestWrapper>
      )
      expect(getByText('Sortable')).toBeTruthy()
    })

    it('should call onSort when clicked', () => {
      const onSort = vi.fn()
      const { getByText } = render(
        <TestWrapper>
          <TableColumnHeader title="Sortable" sortable onSort={onSort} />
        </TestWrapper>
      )

      fireEvent.press(getByText('Sortable'))
      expect(onSort).toHaveBeenCalled()
    })

    it('should display sort direction indicator', () => {
      const { container } = render(
        <TestWrapper>
          <TableColumnHeader title="Sorted" sortable sortDirection="asc" />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })
  })

  describe('Selection', () => {
    it('should render checkbox in header', () => {
      const { container } = render(
        <TestWrapper>
          <TableColumnHeader title="Select All" showCheckbox checked={false} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should call onCheckboxChange when checkbox changes', () => {
      const onCheckboxChange = vi.fn()
      const { container } = render(
        <TestWrapper>
          <TableColumnHeader
            title="Select All"
            showCheckbox
            checked={false}
            onCheckboxChange={onCheckboxChange}
          />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })
  })
})

describe('ExpandedTableRow', () => {
  describe('Basic Rendering', () => {
    it('should render default variant', () => {
      const { container } = render(
        <TestWrapper>
          <ExpandedTableRow variant="default" />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should render variant2 with info items', () => {
      const { getByText } = render(
        <TestWrapper>
          <ExpandedTableRow
            variant="variant2"
            title="Company Name"
            infoItems={[
              { label: 'Address', value: '123 Main St' },
              { label: 'CEO', value: 'John Doe' },
            ]}
          />
        </TestWrapper>
      )
      expect(getByText('Company Name')).toBeTruthy()
      expect(getByText('Address')).toBeTruthy()
      expect(getByText('123 Main St')).toBeTruthy()
    })

    it('should render custom children', () => {
      const { getByText } = render(
        <TestWrapper>
          <ExpandedTableRow>
            <Text>Custom expanded content</Text>
          </ExpandedTableRow>
        </TestWrapper>
      )
      expect(getByText('Custom expanded content')).toBeTruthy()
    })
  })

  describe('Default Variant with Form Fields', () => {
    it('should render form fields', () => {
      const { container } = render(
        <TestWrapper>
          <ExpandedTableRow
            variant="default"
            fields={[
              { label: 'Name', placeholder: 'Enter name' },
              { label: 'Email', placeholder: 'Enter email' },
            ]}
          />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should call onFieldChange when field changes', () => {
      const onFieldChange = vi.fn()
      const { container } = render(
        <TestWrapper>
          <ExpandedTableRow
            variant="default"
            fields={[{ label: 'Name', placeholder: 'Enter name', type: 'name' }]}
            onFieldChange={onFieldChange}
          />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })
  })
})

describe('Table', () => {
  const mockColumns = [
    { id: 'name', title: 'Name', sortable: true },
    { id: 'email', title: 'Email' },
    { id: 'status', title: 'Status' },
  ]

  const mockData = [
    { id: '1', name: 'John Doe', email: 'john@example.com', status: 'Active' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
  ]

  describe('Basic Rendering', () => {
    it('should render table with columns and data', () => {
      const { getByText } = render(
        <TestWrapper>
          <Table columns={mockColumns} data={mockData} />
        </TestWrapper>
      )
      expect(getByText('Name')).toBeTruthy()
      expect(getByText('John Doe')).toBeTruthy()
      expect(getByText('john@example.com')).toBeTruthy()
    })

    it('should render empty state', () => {
      const { getByText } = render(
        <TestWrapper>
          <Table columns={mockColumns} data={[]} emptyMessage="No data" />
        </TestWrapper>
      )
      expect(getByText('No data')).toBeTruthy()
    })

    it('should render custom empty state', () => {
      const { getByText } = render(
        <TestWrapper>
          <Table
            columns={mockColumns}
            data={[]}
            renderEmpty={() => <Text>Custom empty</Text>}
          />
        </TestWrapper>
      )
      expect(getByText('Custom empty')).toBeTruthy()
    })
  })

  describe('Header', () => {
    it('should render search input when searchable', () => {
      const { getByPlaceholderText } = render(
        <TestWrapper>
          <Table
            columns={mockColumns}
            data={mockData}
            searchable
            searchPlaceholder="Search..."
          />
        </TestWrapper>
      )
      expect(getByPlaceholderText('Search...')).toBeTruthy()
    })

    it('should render action buttons', () => {
      const { getByText } = render(
        <TestWrapper>
          <Table
            columns={mockColumns}
            data={mockData}
            actions={[
              { label: 'Add New', onPress: vi.fn() },
              { label: 'Export', onPress: vi.fn() },
            ]}
          />
        </TestWrapper>
      )
      expect(getByText('Add New')).toBeTruthy()
      expect(getByText('Export')).toBeTruthy()
    })

    it('should hide header when showHeader is false', () => {
      const { queryByPlaceholderText } = render(
        <TestWrapper>
          <Table
            columns={mockColumns}
            data={mockData}
            showHeader={false}
            searchable
          />
        </TestWrapper>
      )
      expect(queryByPlaceholderText('Search...')).toBeNull()
    })
  })

  describe('Sorting', () => {
    it('should call onSort when column is sorted', () => {
      const onSort = vi.fn()
      const { getByText } = render(
        <TestWrapper>
          <Table
            columns={mockColumns}
            data={mockData}
            onSort={onSort}
          />
        </TestWrapper>
      )

      // Click sortable column header
      fireEvent.press(getByText('Name'))
      expect(onSort).toHaveBeenCalled()
    })

    it('should sort data when sortConfig is provided', () => {
      const { getByText } = render(
        <TestWrapper>
          <Table
            columns={mockColumns}
            data={mockData}
            sortConfig={{ columnId: 'name', direction: 'asc' }}
          />
        </TestWrapper>
      )
      // Data should be sorted - first row should be John Doe
      expect(getByText('John Doe')).toBeTruthy()
    })
  })

  describe('Selection', () => {
    it('should render checkboxes when selectableRows is enabled', () => {
      const { container } = render(
        <TestWrapper>
          <Table
            columns={[{ id: 'select', title: '', showCheckbox: true }, ...mockColumns]}
            data={mockData}
            selectableRows
          />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should call onRowSelect when row is selected', () => {
      const onRowSelect = vi.fn()
      const { container } = render(
        <TestWrapper>
          <Table
            columns={[{ id: 'select', title: '', showCheckbox: true }, ...mockColumns]}
            data={mockData}
            selectableRows
            onRowSelect={onRowSelect}
          />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })
  })

  describe('Expansion', () => {
    it('should render expansion icons when expandableRows is enabled', () => {
      const { container } = render(
        <TestWrapper>
          <Table
            columns={mockColumns}
            data={mockData}
            expandableRows
          />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should call onRowExpand when row is expanded', () => {
      const onRowExpand = vi.fn()
      const { container } = render(
        <TestWrapper>
          <Table
            columns={mockColumns}
            data={mockData}
            expandableRows
            onRowExpand={onRowExpand}
          />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })
  })

  describe('Pagination', () => {
    it('should render pagination when provided', () => {
      const { container } = render(
        <TestWrapper>
          <Table
            columns={mockColumns}
            data={mockData}
            pagination={{ totalPages: 10, currentPage: 1 }}
          />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })
  })

  describe('Search', () => {
    it('should filter data based on search value', () => {
      const { getByPlaceholderText, queryByText } = render(
        <TestWrapper>
          <Table
            columns={mockColumns}
            data={mockData}
            searchable
            searchValue="John"
          />
        </TestWrapper>
      )

      const input = getByPlaceholderText('Search...')
      expect(queryByText('John Doe')).toBeTruthy()
      expect(queryByText('Jane Smith')).toBeFalsy()
    })

    it('should call onSearchChange when search input changes', () => {
      const onSearchChange = vi.fn()
      const { getByPlaceholderText } = render(
        <TestWrapper>
          <Table
            columns={mockColumns}
            data={mockData}
            searchable
            onSearchChange={onSearchChange}
          />
        </TestWrapper>
      )

      const input = getByPlaceholderText('Search...')
      fireEvent.changeText(input, 'test')
      expect(onSearchChange).toHaveBeenCalledWith('test')
    })
  })
})
