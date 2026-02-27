import { renderHook, act } from '@testing-library/react-native'
import { describe, it, expect, vi } from 'vitest'
import { useSearchSelect } from '../useSearchSelect'

const mockOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'orange', label: 'Orange' },
]

describe('useSearchSelect', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useSearchSelect({ options: mockOptions }))
    expect(result.current.isOpen).toBe(false)
    expect(result.current.searchQuery).toBe('')
    expect(result.current.filteredOptions).toEqual(mockOptions)
  })

  it('should filter options based on search query', () => {
    const { result } = renderHook(() => useSearchSelect({ options: mockOptions }))
    
    act(() => {
      result.current.setSearchQuery('app')
    })
    
    expect(result.current.filteredOptions).toHaveLength(1)
    expect(result.current.filteredOptions[0].value).toBe('apple')
  })

  it('should handle single selection', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useSearchSelect({ 
      options: mockOptions,
      onChange
    }))
    
    act(() => {
      result.current.handleSelect('banana')
    })
    
    expect(onChange).toHaveBeenCalledWith('banana')
    expect(result.current.isOpen).toBe(false)
  })

  it('should handle multiple selection', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useSearchSelect({ 
      options: mockOptions,
      multiple: true,
      value: ['apple'],
      onChange
    }))
    
    act(() => {
      result.current.handleSelect('banana')
    })
    
    expect(onChange).toHaveBeenCalledWith(['apple', 'banana'])
    // Should stay open when multiple
  })

  it('should toggle open state', () => {
    const { result } = renderHook(() => useSearchSelect({ options: mockOptions }))
    
    expect(result.current.isOpen).toBe(false)
    
    act(() => {
      result.current.handleToggle()
    })
    
    expect(result.current.isOpen).toBe(true)
    
    act(() => {
      result.current.handleClose()
    })
    
    expect(result.current.isOpen).toBe(false)
  })
})
