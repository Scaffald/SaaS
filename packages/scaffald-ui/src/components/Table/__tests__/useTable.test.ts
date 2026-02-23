import { renderHook, act } from '@testing-library/react-native'
import { describe, it, expect, vi } from 'vitest'
import { useTable } from '../useTable'

const mockColumns = [
  { id: 'name', title: 'Name' },
  { id: 'age', title: 'Age' }
]

const mockData = [
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 25 },
  { id: '3', name: 'Charlie', age: 35 }
]

describe('useTable', () => {
  it('should initialize with default data', () => {
    const { result } = renderHook(() => useTable({ columns: mockColumns, data: mockData }))
    expect(result.current.displayData).toEqual(mockData)
    expect(result.current.visibleColumns).toEqual(mockColumns)
  })

  it('should filter data based on search value', () => {
    const { result } = renderHook(() => useTable({ columns: mockColumns, data: mockData }))
    
    act(() => {
      result.current.handleSearchChange('Bob')
    })
    
    expect(result.current.displayData).toHaveLength(1)
    expect(result.current.displayData[0].name).toBe('Bob')
  })

  it('should sort data based on column', () => {
    const { result } = renderHook(() => useTable({ columns: mockColumns, data: mockData }))
    
    act(() => {
      result.current.handleSort('age', 'asc')
    })
    
    expect(result.current.displayData[0].name).toBe('Bob') // 25
    expect(result.current.displayData[2].name).toBe('Charlie') // 35
    
    act(() => {
      result.current.handleSort('age', 'desc')
    })
    
    expect(result.current.displayData[0].name).toBe('Charlie') // 35
  })

  it('should handle row selection', () => {
    const { result } = renderHook(() => useTable({ columns: mockColumns, data: mockData }))
    
    act(() => {
      result.current.handleRowSelect('1', true)
    })
    
    expect(result.current.selectionConfig.selectedIds.has('1')).toBe(true)
    
    act(() => {
      result.current.handleSelectAll(true)
    })
    
    expect(result.current.selectionConfig.selectedIds.size).toBe(3)
    expect(result.current.selectionConfig.allSelected).toBe(true)
  })
})
