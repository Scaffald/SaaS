import { renderHook, act } from '@testing-library/react-native'
import { describe, it, expect, vi } from 'vitest'
import { useDropdown } from '../useDropdown'

describe('useDropdown', () => {
  it('should initialize closed', () => {
    const { result } = renderHook(() => useDropdown())
    expect(result.current.isOpen).toBe(false)
  })

  it('should toggle open state', () => {
    const { result } = renderHook(() => useDropdown())
    
    act(() => {
      result.current.handleToggle()
    })
    
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.handleToggle()
    })
    
    expect(result.current.isOpen).toBe(false)
  })

  it('should not toggle if disabled', () => {
    const { result } = renderHook(() => useDropdown({ disabled: true }))
    
    act(() => {
      result.current.handleToggle()
    })
    
    expect(result.current.isOpen).toBe(false)
  })

  it('should handle dismiss', () => {
    const { result } = renderHook(() => useDropdown())
    
    act(() => {
      result.current.handleToggle() // Open it
    })
    expect(result.current.isOpen).toBe(true)
    
    act(() => {
      result.current.handleDismiss() // Dismiss it
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('should call onOpenChange in controlled mode', () => {
    const onOpenChange = vi.fn()
    const { result } = renderHook(() => useDropdown({ open: false, onOpenChange }))
    
    act(() => {
      result.current.handleToggle()
    })
    
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })
})
