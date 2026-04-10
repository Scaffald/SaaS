import { describe, expect, it, vi } from 'vitest';
import { invalidateProfileQueries } from '../profile-sync';

describe("invalidateProfileQueries", () => {
  it("invokes all invalidate hooks successfully", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryClient = { invalidateQueries } as never;

    await invalidateProfileQueries(queryClient);

    // Should be called once for each query key group (11 total)
    expect(invalidateQueries).toHaveBeenCalledTimes(11);
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.any(Array) }),
    );
  });

  it("still resolves when some invalidations reject", async () => {
    const invalidateQueries = vi.fn()
      .mockResolvedValue(undefined)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue(undefined);

    const queryClient = { invalidateQueries } as never;

    // Suppress unhandled rejection warnings since Promise.allSettled handles them
    const originalConsoleError = console.error;
    console.error = vi.fn();

    await expect(invalidateProfileQueries(queryClient)).resolves
      .toBeUndefined();

    expect(invalidateQueries).toHaveBeenCalled();

    // Restore console.error
    console.error = originalConsoleError;
  });
});
