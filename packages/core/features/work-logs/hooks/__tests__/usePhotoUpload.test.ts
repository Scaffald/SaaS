import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastController } from '@tamagui/toast';

import { usePhotoUpload } from '../usePhotoUpload';
import * as api from '@app/core/utils/api';
import type { ResolvedWorkLogPhoto } from '../../types/photos';

vi.mock('@app/core/utils/api', () => ({
  api: {
    workLogs: {
      getById: {
        useQuery: vi.fn(),
      },
      uploadPhoto: {
        useMutation: vi.fn(),
      },
      updatePhotoMetadata: {
        useMutation: vi.fn(),
      },
      updatePhotoVisibility: {
        useMutation: vi.fn(),
      },
      deletePhoto: {
        useMutation: vi.fn(),
      },
    },
  },
  useUtils: vi.fn(() => ({
    workLogs: {
      getById: {
        invalidate: vi.fn(),
      },
    },
  })),
}));

vi.mock('@tamagui/toast', () => ({
  useToastController: vi.fn(() => ({
    show: vi.fn(),
  })),
}));

vi.mock('@app/core/utils/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        uploadToSignedUrl: vi.fn().mockResolvedValue({ error: null }),
      })),
    },
  },
}));

describe('usePhotoUpload', () => {
  const mockGetByIdQuery = {
    data: {
      id: 'work-log-1',
      photos: [
        {
          id: 'photo-1',
          work_log_id: 'work-log-1',
          file_path: 'path/to/photo.jpg',
          caption: 'Test photo',
          display_order: 0,
          show_on_profile: false,
        },
      ],
    },
    isLoading: false,
  };

  const mockUploadMutation = vi.fn();
  const mockUpdateMetadataMutation = vi.fn();
  const mockUpdateVisibilityMutation = vi.fn();
  const mockDeleteMutation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.api.workLogs.getById.useQuery).mockReturnValue(
      mockGetByIdQuery as never,
    );
    vi.mocked(api.api.workLogs.uploadPhoto.useMutation).mockReturnValue({
      mutateAsync: mockUploadMutation,
    } as never);
    vi.mocked(api.api.workLogs.updatePhotoMetadata.useMutation).mockReturnValue({
      mutateAsync: mockUpdateMetadataMutation,
    } as never);
    vi.mocked(api.api.workLogs.updatePhotoVisibility.useMutation).mockReturnValue({
      mutateAsync: mockUpdateVisibilityMutation,
    } as never);
    vi.mocked(api.api.workLogs.deletePhoto.useMutation).mockReturnValue({
      mutateAsync: mockDeleteMutation,
    } as never);
  });

  it('loads photos for work log', () => {
    const { result } = renderHook(() =>
      usePhotoUpload({ workLogId: 'work-log-1' }),
    );

    expect(result.current.isReady).toBe(true);
    expect(result.current.photos.length).toBe(1);
    expect(result.current.photos[0]?.id).toBe('photo-1');
  });

  it('returns not ready when workLogId is missing', () => {
    const { result } = renderHook(() => usePhotoUpload());

    expect(result.current.isReady).toBe(false);
  });

  it('calculates storage usage', () => {
    const mockQueryWithPhotos = {
      data: {
        id: 'work-log-1',
        photos: [
          {
            id: 'photo-1',
            work_log_id: 'work-log-1',
            file_path: 'path/to/photo1.jpg',
            file_size_bytes: 1024 * 1024,
          },
          {
            id: 'photo-2',
            work_log_id: 'work-log-1',
            file_path: 'path/to/photo2.jpg',
            file_size_bytes: 512 * 1024,
          },
        ],
      },
      isLoading: false,
    };

    vi.mocked(api.api.workLogs.getById.useQuery).mockReturnValue(
      mockQueryWithPhotos as never,
    );

    const { result } = renderHook(() =>
      usePhotoUpload({ workLogId: 'work-log-1' }),
    );

    expect(result.current.storageUsage.usedBytes).toBe(1536 * 1024);
    expect(result.current.storageUsage.limitBytes).toBe(100 * 1024 * 1024);
  });

  it('checks if more photos can be uploaded', () => {
    const mockQueryWithMaxPhotos = {
      data: {
        id: 'work-log-1',
        photos: Array.from({ length: 9 }, (_, i) => ({
          id: `photo-${i}`,
          work_log_id: 'work-log-1',
          file_path: `path/to/photo${i}.jpg`,
        })),
      },
      isLoading: false,
    };

    vi.mocked(api.api.workLogs.getById.useQuery).mockReturnValue(
      mockQueryWithMaxPhotos as never,
    );

    const { result } = renderHook(() =>
      usePhotoUpload({ workLogId: 'work-log-1', maxPhotos: 10 }),
    );

    expect(result.current.canUploadMore).toBe(true);
  });

  it('prevents upload when max photos reached', () => {
    const mockQueryWithMaxPhotos = {
      data: {
        id: 'work-log-1',
        photos: Array.from({ length: 10 }, (_, i) => ({
          id: `photo-${i}`,
          work_log_id: 'work-log-1',
          file_path: `path/to/photo${i}.jpg`,
        })),
      },
      isLoading: false,
    };

    vi.mocked(api.api.workLogs.getById.useQuery).mockReturnValue(
      mockQueryWithMaxPhotos as never,
    );

    const { result } = renderHook(() =>
      usePhotoUpload({ workLogId: 'work-log-1', maxPhotos: 10 }),
    );

    expect(result.current.canUploadMore).toBe(false);
  });

  it('updates photo metadata', async () => {
    mockUpdateMetadataMutation.mockResolvedValue({
      id: 'photo-1',
      caption: 'Updated caption',
    });

    const { result } = renderHook(() =>
      usePhotoUpload({ workLogId: 'work-log-1' }),
    );

    await act(async () => {
      await result.current.updatePhoto('photo-1', {
        caption: 'Updated caption',
        displayOrder: 1,
      });
    });

    expect(mockUpdateMetadataMutation).toHaveBeenCalledWith({
      workLogId: 'work-log-1',
      photoId: 'photo-1',
      caption: 'Updated caption',
      displayOrder: 1,
    });
  });

  it('toggles photo visibility', async () => {
    mockUpdateVisibilityMutation.mockResolvedValue({
      id: 'photo-1',
      show_on_profile: true,
    });

    const { result } = renderHook(() =>
      usePhotoUpload({ workLogId: 'work-log-1' }),
    );

    await act(async () => {
      await result.current.togglePhotoVisibility('photo-1', true);
    });

    expect(mockUpdateVisibilityMutation).toHaveBeenCalledWith({
      workLogId: 'work-log-1',
      photoId: 'photo-1',
      showOnProfile: true,
    });
  });

  it('deletes photo', async () => {
    mockDeleteMutation.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      usePhotoUpload({ workLogId: 'work-log-1' }),
    );

    await act(async () => {
      await result.current.deletePhoto('photo-1');
    });

    expect(mockDeleteMutation).toHaveBeenCalledWith({
      workLogId: 'work-log-1',
      photoId: 'photo-1',
    });
  });

  it('refreshes photos', async () => {
    const mockInvalidate = vi.fn().mockResolvedValue(undefined);
    vi.mocked(api.useUtils).mockReturnValue({
      workLogs: {
        getById: {
          invalidate: mockInvalidate,
        },
      },
    } as never);

    const { result } = renderHook(() =>
      usePhotoUpload({ workLogId: 'work-log-1' }),
    );

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockInvalidate).toHaveBeenCalledWith({ workLogId: 'work-log-1' });
  });
});

