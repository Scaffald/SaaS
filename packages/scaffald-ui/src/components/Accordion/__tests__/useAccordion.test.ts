import { renderHook, act } from '@testing-library/react-native'
import { describe, it, expect, vi } from 'vitest'
import { useAccordion } from '../useAccordion'

describe('useAccordion', () => {
  it('should initialize with default single value', () => {
    const { result } = renderHook(() => useAccordion({ mode: 'single' }))
    expect(result.current.value).toBe('')
    expect(result.current.mode).toBe('single')
  })

  it('should initialize with default multiple value', () => {
    const { result } = renderHook(() => useAccordion({ mode: 'multiple' }))
    expect(result.current.value).toEqual([])
    expect(result.current.mode).toBe('multiple')
  })

  it('should handle single mode selection', () => {
    const { result } = renderHook(() => useAccordion({ mode: 'single' }))
    
    act(() => {
      result.current.onValueChange('item-1')
    })
    
    expect(result.current.value).toBe('item-1')

    // clicking same item again should deselect
    act(() => {
      result.current.onValueChange('item-1')
    })
    
    expect(result.current.value).toBe('')
  })

  it('should handle multiple mode selection', () => {
    const { result } = renderHook(() => useAccordion({ mode: 'multiple' }))
    
    act(() => {
      result.current.onValueChange('item-1')
    })
    
    expect(result.current.value).toEqual(['item-1'])

    act(() => {
      result.current.onValueChange('item-2')
    })
    
    expect(result.current.value).toEqual(['item-1', 'item-2'])

    // clicking item-1 again should deselect it
    act(() => {
      result.current.onValueChange('item-1')
    })
    
    expect(result.current.value).toEqual(['item-2'])
  })

  it('should handle controlled mode', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useAccordion({ mode: 'single', value: 'item-1', onValueChange: onChange }))
    
    expect(result.current.value).toBe('item-1')
    
    act(() => {
      result.current.onValueChange('item-2')
    })
    
    expect(onChange).toHaveBeenCalledWith('item-2')
    // Value shouldn't change internally because it's controlled
    expect(result.current.value).toBe('item-1')
  })
})
