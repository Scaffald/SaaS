import {
  useWorkLog,
  useUploadWorkLogPhotoMutation,
  useUpdateWorkLogPhotoMetadataMutation,
  useUpdateWorkLogPhotoVisibilityMutation,
  useDeleteWorkLogPhotoMutation,
} from '@scf/core/utils/work-logs-sdk-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@scf/core/utils/supabase/client';
import { useToast } from '@unicornlove/beyond-ui';
import { Buffer } from 'buffer';
import type * as ImageManipulator from 'expo-image-manipulator';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UploadWorkLogPhotoInput } from '@scf/schemas';
import { deleteWorkLogPhotoSchema, updateWorkLogPhotoSchema } from '@scf/schemas';
import type { ResolvedWorkLogPhoto, WorkLogPhoto } from '../types/photos';

const WORK_LOG_PHOTO_BUCKET = 'work-log-photos';
const DEFAULT_MAX_PHOTOS = 10;
const STORAGE_LIMIT_BYTES = 100 * 1024 * 1024; // 100MB default from requirements
const SIGNED_URL_TTL_SECONDS = 60 * 5;
const MAX_IMAGE_DIMENSION = 1920;
const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB pre-compression requirement

interface BaseUploadCandidate {
  id: string;
  fileName: string;
  mimeType: UploadWorkLogPhotoInput["contentType"];
  size: number;
  caption?: string | null;
  photoType?: UploadWorkLogPhotoInput["photoType"];
  showOnProfile?: boolean;
}

export interface WebUploadCandidate extends BaseUploadCandidate {
  platform: 'web';
  file: File;
}

export interface NativeUploadCandidate extends BaseUploadCandidate {
  platform: 'native';
  uri: string;
  width?: number | null;
  height?: number | null;
}

export type UploadCandidate = WebUploadCandidate | NativeUploadCandidate;

export interface UploadPhotoOptions {
  candidate: UploadCandidate;
}

export interface UpdatePhotoOptions {
  caption?: string | null;
  photoType?: UploadWorkLogPhotoInput["photoType"];
  displayOrder?: number;
}

export interface UsePhotoUploadOptions {
  workLogId?: string | null;
  maxPhotos?: number;
}

export interface UsePhotoUploadReturn {
  isReady: boolean;
  photos: ResolvedWorkLogPhoto[];
  isLoadingPhotos: boolean;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  storageUsage: {
    usedBytes: number;
    limitBytes: number;
  };
  maxPhotos: number;
  canUploadMore: boolean;
  uploadPhoto: (options: UploadPhotoOptions) => Promise<void>;
  updatePhoto: (photoId: string, updates: UpdatePhotoOptions) => Promise<void>;
  togglePhotoVisibility: (
    photoId: string,
    showOnProfile: boolean,
  ) => Promise<void>;
  deletePhoto: (photoId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

type SignedUrlCache = Record<
  string,
  {
    url: string;
    expiresAt: number;
    isRefreshing: boolean;
  }
>;

const toWorkLogPhoto = (record: Record<string, unknown>): WorkLogPhoto => {
  return {
    id: String(record.id),
    workLogId: String(record.work_log_id ?? record.workLogId ?? ""),
    filePath: String(record.file_path ?? ""),
    mediumPath: (record.medium_path as string | null | undefined) ?? null,
    thumbnailPath: (record.thumbnail_path as string | null | undefined) ?? null,
    caption: (record.caption as string | null | undefined) ?? null,
    photoType: (record.photo_type as WorkLogPhoto["photoType"]) ?? null,
    displayOrder: Number(record.display_order ?? 0),
    showOnProfile: Boolean(record.show_on_profile),
    fileSizeBytes: Number(record.file_size_bytes ?? 0),
    takenAt: (record.taken_at as string | null | undefined) ?? null,
    createdAt: (record.created_at as string | null | undefined) ?? null,
    updatedAt: (record.updated_at as string | null | undefined) ?? null,
  };
};

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create canvas context.");
  }
  return { canvas, context };
};

const clampQuality = (quality: number) => {
  if (quality > 0.95) return 0.95;
  if (quality < 0.35) return 0.35;
  return quality;
};

const compressWebImage = async (
  file: File,
): Promise<{
  data: Uint8Array;
  mimeType: UploadWorkLogPhotoInput["contentType"];
  size: number;
}> => {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = objectUrl;
    });

    const maxDimension = Math.max(image.width, image.height);
    const scale = maxDimension > MAX_IMAGE_DIMENSION
      ? MAX_IMAGE_DIMENSION / maxDimension
      : 1;

    const targetWidth = Math.round(image.width * scale);
    const targetHeight = Math.round(image.height * scale);

    const { canvas, context } = createCanvas(targetWidth, targetHeight);
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    let currentMime: UploadWorkLogPhotoInput["contentType"] =
      file.type === "image/png" || file.type === "image/webp"
        ? (file.type as UploadWorkLogPhotoInput["contentType"])
        : 'image/jpeg';
    let quality = clampQuality(
      file.type === "image/png" || file.type === "image/webp" ? 0.92 : 0.85,
    );

    const toBlob = (): Promise<Blob> =>
      new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Unable to process image."));
              return;
            }
            resolve(blob);
          },
          currentMime,
          quality,
        );
      });

    let blob = await toBlob();

    if (blob.size > MAX_FILE_BYTES && currentMime !== "image/jpeg") {
      currentMime = 'image/jpeg';
      quality = 0.85;
      blob = await toBlob();
    }

    while (blob.size > MAX_FILE_BYTES && quality > 0.4) {
      quality = Number((quality - 0.05).toFixed(2));
      blob = await toBlob();
    }

    if (blob.size > MAX_FILE_BYTES) {
      throw new Error("Unable to reduce photo below 2MB limit.");
    }

    const arrayBuffer = await blob.arrayBuffer();
    return {
      data: new Uint8Array(arrayBuffer),
      mimeType: currentMime,
      size: blob.size,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const compressNativeImage = async (
  candidate: NativeUploadCandidate,
): Promise<{
  data: Uint8Array;
  mimeType: UploadWorkLogPhotoInput["contentType"];
  size: number;
}> => {
  const manipulator: typeof import("expo-image-manipulator") = await import(
    "expo-image-manipulator"
  );

  const actions: ImageManipulator.Action[] = [];

  const width = candidate.width ?? null;
  const height = candidate.height ?? null;

  if (width && height) {
    const maxDimension = Math.max(width, height);
    if (maxDimension > MAX_IMAGE_DIMENSION) {
      const scale = MAX_IMAGE_DIMENSION / maxDimension;
      actions.push({
        resize: {
          width: Math.round(width * scale),
          height: Math.round(height * scale),
        },
      });
    }
  }

  let format: UploadWorkLogPhotoInput["contentType"] = candidate.mimeType;
  if (
    format !== "image/jpeg" && format !== "image/png" && format !== "image/webp"
  ) {
    format = 'image/jpeg';
  }

  const saveFormat = format === "image/png"
    ? manipulator.SaveFormat.PNG
    : format === "image/webp"
    ? manipulator.SaveFormat.WEBP
    : manipulator.SaveFormat.JPEG;

  let compress = saveFormat === manipulator.SaveFormat.PNG ? 1 : 0.85;
  let result = await manipulator.manipulateAsync(candidate.uri, actions, {
    compress,
    format: saveFormat,
    base64: true,
  });

  const estimateSize = (base64?: string | null) =>
    base64 ? Math.floor((base64.length * 3) / 4) : 0;

  let size = estimateSize(result.base64);

  if (size > MAX_FILE_BYTES && saveFormat !== manipulator.SaveFormat.JPEG) {
    compress = 0.85;
    result = await manipulator.manipulateAsync(candidate.uri, actions, {
      compress,
      format: manipulator.SaveFormat.JPEG,
      base64: true,
    });
    size = estimateSize(result.base64);
    format = 'image/jpeg';
  }

  while (size > MAX_FILE_BYTES && compress > 0.4) {
    compress = Number.parseFloat((compress - 0.05).toFixed(2));
    result = await manipulator.manipulateAsync(candidate.uri, actions, {
      compress,
      format: manipulator.SaveFormat.JPEG,
      base64: true,
    });
    size = estimateSize(result.base64);
    format = 'image/jpeg';
  }

  if (size > MAX_FILE_BYTES) {
    throw new Error("Unable to reduce photo below 2MB limit.");
  }

  const base64Payload = result.base64 ?? '';
  const byteArray = Uint8Array.from(Buffer.from(base64Payload, 'base64'));
  return {
    data: byteArray,
    mimeType: format,
    size,
  };
};

const mergePhoto = (
  photo: WorkLogPhoto,
  cache: SignedUrlCache,
): ResolvedWorkLogPhoto => {
  const cached = cache[photo.id];
  return {
    ...photo,
    signedUrl: cached?.url ?? null,
    isRefreshingUrl: cached?.isRefreshing ?? false,
  };
};

export const usePhotoUpload = ({
  workLogId,
  maxPhotos = DEFAULT_MAX_PHOTOS,
}: UsePhotoUploadOptions = {}): UsePhotoUploadReturn => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const isReady = Boolean(workLogId);

  const { data: workLogData, isLoading: isLoadingPhotos } = useWorkLog(
    workLogId ?? undefined,
    {
      enabled: isReady,
      staleTime: 30_000,
    },
  );

  const uploadMutation = useUploadWorkLogPhotoMutation();
  const updateMetadataMutation = useUpdateWorkLogPhotoMetadataMutation();
  const updateVisibilityMutation = useUpdateWorkLogPhotoVisibilityMutation();
  const deletePhotoMutation = useDeleteWorkLogPhotoMutation();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [signedUrlCache, setSignedUrlCache] = useState<SignedUrlCache>({});

  const photos: WorkLogPhoto[] = useMemo(() => {
    if (!workLogData?.photos || !Array.isArray(workLogData.photos)) {
      return [];
    }

    return (workLogData.photos as Record<string, unknown>[])
      .map((record) => toWorkLogPhoto(record))
      .sort((a, b) => {
        if (a.displayOrder === b.displayOrder) {
          return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
        }
        return a.displayOrder - b.displayOrder;
      });
  }, [workLogData?.photos]);

  const storageUsage = useMemo(() => {
    const used = photos.reduce(
      (total, photo) => total + Number(photo.fileSizeBytes ?? 0),
      0,
    );
    return {
      usedBytes: used,
      limitBytes: STORAGE_LIMIT_BYTES,
    };
  }, [photos]);

  const canUploadMore = photos.length < maxPhotos;

  const refresh = useCallback(async () => {
    if (!workLogId) {
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['workLogs', 'detail', workLogId] });
  }, [queryClient, workLogId]);

  const ensureSignedUrls = useCallback(
    async (currentPhotos: WorkLogPhoto[]) => {
      if (!currentPhotos.length) {
        return;
      }

      const updates: SignedUrlCache = {};
      const now = Date.now();

      await Promise.all(
        currentPhotos.map(async (photo) => {
          const cached = signedUrlCache[photo.id];
          if (
            cached && cached.expiresAt - now > 30_000 && cached.url &&
            !cached.isRefreshing
          ) {
            return;
          }

          try {
            setSignedUrlCache((previous) => ({
              ...previous,
              [photo.id]: {
                url: previous[photo.id]?.url ?? null,
                expiresAt: previous[photo.id]?.expiresAt ?? 0,
                isRefreshing: true,
              },
            }));

            const { data, error } = await supabase.storage
              .from(WORK_LOG_PHOTO_BUCKET)
              .createSignedUrl(photo.filePath, SIGNED_URL_TTL_SECONDS);

            if (error || !data?.signedUrl) {
              throw error ?? new Error("Could not create photo URL.");
            }

            updates[photo.id] = {
              url: data.signedUrl,
              expiresAt: now + SIGNED_URL_TTL_SECONDS * 1000,
              isRefreshing: false,
            };
          } catch (error) {
            console.warn("[usePhotoUpload] Failed to create signed URL", {
              photoId: photo.id,
              error,
            });
            updates[photo.id] = {
              url: signedUrlCache[photo.id]?.url ?? null,
              expiresAt: signedUrlCache[photo.id]?.expiresAt ?? now,
              isRefreshing: false,
            };
          }
        }),
      );

      if (Object.keys(updates).length > 0) {
        setSignedUrlCache((previous) => ({ ...previous, ...updates }));
      }
    },
    [signedUrlCache],
  );

  useEffect(() => {
    if (!photos.length) {
      return;
    }
    void ensureSignedUrls(photos);
  }, [ensureSignedUrls, photos]);

  const resolvedPhotos: ResolvedWorkLogPhoto[] = useMemo(
    () => photos.map((photo) => mergePhoto(photo, signedUrlCache)),
    [photos, signedUrlCache],
  );

  const runUpload = useCallback(
    async ({ candidate }: UploadPhotoOptions) => {
      if (!workLogId) {
        throw new Error(
          "Work log must be saved before uploading photos. Please wait for the auto-save to complete.",
        );
      }

      if (!canUploadMore) {
        throw new Error("Maximum of 10 photos reached for this work log.");
      }

      setUploadError(null);
      setIsUploading(true);
      setUploadProgress(5);

      try {
        let payload: {
          data: Uint8Array;
          mimeType: UploadWorkLogPhotoInput["contentType"];
          size: number;
        };

        if (candidate.platform === "web") {
          payload = await compressWebImage(candidate.file);
        } else {
          payload = await compressNativeImage(candidate);
        }

        setUploadProgress(30);

        const uploadResponse = await uploadMutation.mutateAsync({
          workLogId,
          fileName: candidate.fileName,
          fileSizeBytes: payload.size,
          contentType: payload.mimeType,
          caption: candidate.caption ?? undefined,
          photoType: candidate.photoType ?? undefined,
          showOnProfile: candidate.showOnProfile ?? undefined,
        });

        setUploadProgress(55);

        const uploadPath = uploadResponse.filePath ??
          uploadResponse.photo?.file_path ??
          `${workLogId}/${candidate.fileName}`;

        const { error: storageError } = await supabase.storage
          .from(WORK_LOG_PHOTO_BUCKET)
          .uploadToSignedUrl(uploadPath, uploadResponse.token, payload.data, {
            contentType: payload.mimeType,
            upsert: false,
          });

        if (storageError) {
          throw new Error(
            storageError.message ?? "Failed to upload photo to storage.",
          );
        }

        setUploadProgress(85);
        await refresh();
        setUploadProgress(100);
        toast.show({
          title: "Photo Uploaded",
          message: "Your work log photo has been uploaded successfully.",
          variant: 'success',
        });
      } finally {
        setTimeout(() => setUploadProgress(0), 400);
        setIsUploading(false);
      }
    },
    [canUploadMore, refresh, toast, uploadMutation, workLogId],
  );

  const uploadPhoto = useCallback(
    async (options: UploadPhotoOptions) => {
      try {
        await runUpload(options);
      } catch (error) {
        console.error("[usePhotoUpload] Upload failed", error);
        const message = error instanceof Error
          ? error.message
          : 'Unable to upload photo. Please try again.';
        setUploadError(message);
        toast.show({
          title: "Upload Failed",
          variant: 'error',
        });
      }
    },
    [runUpload, toast],
  );

  const updatePhoto = useCallback(
    async (photoId: string, updates: UpdatePhotoOptions) => {
      if (!workLogId) {
        return;
      }

      const payload = {
        photoId,
        workLogId,
        caption: typeof updates.caption === "string"
          ? updates.caption
          : (updates.caption ?? undefined),
        photoType: typeof updates.photoType === "string"
          ? updates.photoType
          : undefined,
        displayOrder: updates.displayOrder,
      };

      const validation = updateWorkLogPhotoSchema.safeParse(payload);

      if (!validation.success) {
        throw validation.error;
      }

      await updateMetadataMutation.mutateAsync(validation.data);
      await refresh();
    },
    [refresh, updateMetadataMutation, workLogId],
  );

  const togglePhotoVisibility = useCallback(
    async (photoId: string, showOnProfile: boolean) => {
      await updateVisibilityMutation.mutateAsync({
        photoId,
        showOnProfile,
      });
      await refresh();
    },
    [refresh, updateVisibilityMutation],
  );

  const deletePhoto = useCallback(
    async (photoId: string) => {
      if (!workLogId) {
        return;
      }

      const validation = deleteWorkLogPhotoSchema.safeParse({
        photoId,
        workLogId,
      });

      if (!validation.success) {
        throw validation.error;
      }

      await deletePhotoMutation.mutateAsync(validation.data);
      setSignedUrlCache((previous) => {
        const next = { ...previous };
        delete next[photoId];
        return next;
      });
      await refresh();
      toast.show({
          title: "Photo Deleted",
          message: "The photo has been removed from this work log.",
          variant: 'info',
        });
    },
    [deletePhotoMutation, refresh, toast, workLogId],
  );

  return {
    isReady,
    photos: resolvedPhotos,
    isLoadingPhotos,
    isUploading,
    uploadProgress,
    uploadError,
    storageUsage,
    maxPhotos,
    canUploadMore,
    uploadPhoto,
    updatePhoto,
    togglePhotoVisibility,
    deletePhoto,
    refresh,
  };
};
