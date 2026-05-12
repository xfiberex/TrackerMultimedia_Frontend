import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { renderHook } from '@testing-library/react'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('debounces value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    )

    expect(result.current).toBe('initial')

    rerender({ value: 'updated' })
    expect(result.current).toBe('initial') // Still debounced

    vi.advanceTimersByTime(300)
    expect(result.current).toBe('updated') // Now updated
  })

  it('clears timer on unmount', () => {
    const { unmount } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: 'test' } }
    )

    unmount()
    // Should not throw
    vi.advanceTimersByTime(300)
  })
})
