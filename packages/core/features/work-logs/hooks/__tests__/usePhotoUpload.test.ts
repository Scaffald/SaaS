import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastController } from '@tamagui/toast';

import { usePhotoUpload } from '../usePhotoUpload';
import * as api from '@app/core/utils/api';
import type { ResolvedWorkLogPhoto } from '../../types/photos';

const mockUseUtils = vi.fn(() => ({
  workLogs: {
    getById: {
      invalidate: vi.fn(),
    },
  },
}));

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
    useUtils: mockUseUtils,
  },
}));

vi.mock('@tamagui/toast', () => ({
  useToastController: vi.fn(() => ({
    show: vi.fn(),
  })),
}));

const mockUploadToSignedUrl = vi.fn().mockResolvedValue({ error: null });
const mockCreateSignedUrl = vi.fn().mockResolvedValue({
  data: { signedUrl: 'https://example.com/signed-url.jpg' },
  error: null,
});

vi.mock('@app/core/utils/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        uploadToSignedUrl: mockUploadToSignedUrl,
        createSignedUrl: mockCreateSignedUrl,
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
    mockUploadToSignedUrl.mockResolvedValue({ error: null });
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed-url.jpg' },
      error: null,
    });
    mockUseUtils.mockReturnValue({
      workLogs: {
        getById: {
          invalidate: vi.fn().mockResolvedValue(undefined),
        },
      },
    });
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
    vi.mocked(mockUseUtils).mockReturnValue({
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

  it('uploads photo successfully (web)', async () => {
    const mockFile = new File(['test image data'], 'test.jpg', {
      type: 'image/jpeg',
    });
    const mockUploadResponse = {
      filePath: 'work-log-1/test.jpg',
      token: 'upload-token',
      photo: {
        id: 'photo-2',
        file_path: 'work-log-1/test.jpg',
      },
    };

    mockUploadMutation.mockResolvedValue(mockUploadResponse);

    const mockInvalidate = vi.fn().mockResolvedValue(undefined);
    vi.mocked(mockUseUtils).mockReturnValue({
      workLogs: {
        getById: {
          invalidate: mockInvalidate,
        },
      },
    } as never);

    const { result } = renderHook(() =>
      usePhotoUpload({ workLogId: 'work-log-1' }),
    );

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    await act(async () => {
      await result.current.uploadPhoto({
        candidate: {
          platform: 'web',
          id: 'candidate-1',
          fileName: 'test.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          file: mockFile,
        },
      });
    });

    expect(mockUploadMutation).toHaveBeenCalled();
    expect(mockInvalidate).toHaveBeenCalled();
  });

  // Note: Native upload test skipped due to complexity of mocking expo-image-manipulator
  // The native upload flow is tested via integration tests

  it('handles upload error and shows toast', async () => {
    const mockFile = new File(['test image data'], 'test.jpg', {
      type: 'image/jpeg',
    });

    const uploadError = new Error('Upload failed');
    mockUploadMutation.mockRejectedValue(uploadError);

    const mockToast = vi.fn();
    vi.mocked(useToastController).mockReturnValue({
      show: mockToast,
    } as never);

    const { result } = renderHook(() =>
      usePhotoUpload({ workLogId: 'work-log-1' }),
    );

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    await act(async () => {
      await result.current.uploadPhoto({
        candidate: {
          platform: 'web',
          id: 'candidate-1',
          fileName: 'test.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          file: mockFile,
        },
      });
    });

    await waitFor(() => {
      expect(result.current.uploadError).toBe('Upload failed');
      expect(mockToast).toHaveBeenCalledWith('Upload Failed', {
        message: 'Upload failed',
        type: 'error',
      });
    });
  });

  it('prevents upload when workLogId is missing', async () => {
    const mockFile = new File(['test image data'], 'test.jpg', {
      type: 'image/jpeg',
    });

    const { result } = renderHook(() => usePhotoUpload());

    await act(async () => {
      await expect(
        result.current.uploadPhoto({
          candidate: {
            platform: 'web',
            id: 'candidate-1',
            fileName: 'test.jpg',
            mimeType: 'image/jpeg',
            size: 1024,
            file: mockFile,
          },
        }),
      ).rejects.toThrow('Work log must be saved before uploading photos');
    });
  });

  it('prevents upload when max photos reached', async () => {
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

    const mockFile = new File(['test image data'], 'test.jpg', {
      type: 'image/jpeg',
    });

    const { result } = renderHook(() =>
      usePhotoUpload({ workLogId: 'work-log-1', maxPhotos: 10 }),
    );

    await waitFor(() => {
      expect(result.current.canUploadMore).toBe(false);
    });

    await act(async () => {
      await expect(
        result.current.uploadPhoto({
          candidate: {
            platform: 'web',
            id: 'candidate-1',
            fileName: 'test.jpg',
            mimeType: 'image/jpeg',
            size: 1024,
            file: mockFile,
          },
        }),
      ).rejects.toThrow('Maximum of 10 photos reached');
    });
  });

  it('tracks upload progress', async () => {
    const mockFile = new File(['test image data'], 'test.jpg', {
      type: 'image/jpeg',
    });
    const mockUploadResponse = {
      filePath: 'work-log-1/test.jpg',
      token: 'upload-token',
      photo: {
        id: 'photo-2',
        file_path: 'work-log-1/test.jpg',
      },
    };

    mockUploadMutation.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockUploadResponse), 100);
        }),
    );

    const mockInvalidate = vi.fn().mockResolvedValue(undefined);
    vi.mocked(mockUseUtils).mockReturnValue({
      workLogs: {
        getById: {
          invalidate: mockInvalidate,
        },
      },
    } as never);

    const { result } = renderHook(() =>
      usePhotoUpload({ workLogId: 'work-log-1' }),
    );

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    const uploadPromise = act(async () => {
      await result.current.uploadPhoto({
        candidate: {
          platform: 'web',
          id: 'candidate-1',
          fileName: 'test.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          file: mockFile,
        },
      });
    });

    // Check that upload state changes
    await waitFor(() => {
      expect(result.current.isUploading).toBe(true);
    });

    await uploadPromise;

    await waitFor(() => {
      expect(result.current.isUploading).toBe(false);
      expect(result.current.uploadProgress).toBe(0);
    });
  });

  it('handles storage upload error', async () => {
    const mockFile = new File(['test image data'], 'test.jpg', {
      type: 'image/jpeg',
    });
    const mockUploadResponse = {
      filePath: 'work-log-1/test.jpg',
      token: 'upload-token',
      photo: {
        id: 'photo-2',
        file_path: 'work-log-1/test.jpg',
      },
    };

    mockUploadMutation.mockResolvedValue(mockUploadResponse);
    mockUploadToSignedUrl.mockResolvedValue({
      error: { message: 'Storage error' },
    });

    const mockToast = vi.fn();
    vi.mocked(useToastController).mockReturnValue({
      show: mockToast,
    } as never);

    const { result } = renderHook(() =>
      usePhotoUpload({ workLogId: 'work-log-1' }),
    );

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    await act(async () => {
      await result.current.uploadPhoto({
        candidate: {
          platform: 'web',
          id: 'candidate-1',
          fileName: 'test.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          file: mockFile,
        },
      });
    });

    await waitFor(() => {
      expect(result.current.uploadError).toBeTruthy();
      expect(mockToast).toHaveBeenCalledWith('Upload Failed', {
        message: expect.stringContaining('Storage error'),
        type: 'error',
      });
    });
  });

  it('handles update photo error', async () => {
    const updateError = new Error('Update failed');
    mockUpdateMetadataMutation.mockRejectedValue(updateError);

    const { result } = renderHook(() =>
      usePhotoUpload({ workLogId: 'work-log-1' }),
    );

    await act(async () => {
      await expect(
        result.current.updatePhoto('photo-1', {
          caption: 'Updated caption',
        }),
      ).rejects.toThrow('Update failed');
    });
  });

  it('handles delete photo error', async () => {
    const deleteError = new Error('Delete failed');
    mockDeleteMutation.mockRejectedValue(deleteError);

    const { result } = renderHook(() =>
      usePhotoUpload({ workLogId: 'work-log-1' }),
    );

    await act(async () => {
      await expect(
        result.current.deletePhoto('photo-1'),
      ).rejects.toThrow('Delete failed');
    });
  });

  it('does not update photo when workLogId is missing', async () => {
    const { result } = renderHook(() => usePhotoUpload());

    await act(async () => {
      await result.current.updatePhoto('photo-1', {
        caption: 'Updated caption',
      });
    });

    expect(mockUpdateMetadataMutation).not.toHaveBeenCalled();
  });

  it('does not delete photo when workLogId is missing', async () => {
    const { result } = renderHook(() => usePhotoUpload());

    await act(async () => {
      await result.current.deletePhoto('photo-1');
    });

    expect(mockDeleteMutation).not.toHaveBeenCalled();
  });

  it('handles loading state', () => {
    const mockQueryLoading = {
      data: undefined,
      isLoading: true,
    };

    vi.mocked(api.api.workLogs.getById.useQuery).mockReturnValue(
      mockQueryLoading as never,
    );

    const { result } = renderHook(() =>
      usePhotoUpload({ workLogId: 'work-log-1' }),
    );

    expect(result.current.isLoadingPhotos).toBe(true);
  });
});

