import {
  ResponsiveSelect,
  type UploadSelection,
  UploadSurface,
} from "@scaffald/ui";
import { Camera, ImagePlus, UploadCloud } from "lucide-react-native";
import { useToast } from "@scaffald/ui";
import { randomUUID } from "expo-crypto";
import { useCallback, useMemo, useState } from "react";
import { Platform } from "react-native";
import { View } from "react-native";
import {
  Button,
  Checkbox,
  Input,
  Separator,
  Spinner,
  Text,
  Row,
  Stack,
} from "@scaffald/ui";
import { type UploadCandidate, usePhotoUpload } from "../hooks/usePhotoUpload";
import type { WorkLogPhotoType } from "../types/photos";
import { PhotoGallery } from "./PhotoGallery";

type PhotoCategory = Exclude<WorkLogPhotoType, null>;

const PHOTO_TYPE_OPTIONS: Array<{ value: PhotoCategory; label: string }> = [
  { value: "before", label: "Before" },
  { value: "progress", label: "Progress" },
  { value: "after", label: "After" },
  { value: "general", label: "General" },
];

const DEFAULT_PHOTO_NAME = (suffix: string) => `work-log-photo-${suffix}.jpg`;

const formatStorageSummary = (used: number, limit: number) => {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "unit",
    unit: "megabyte",
    unitDisplay: "short",
    maximumFractionDigits: 1,
  });
  return `${formatter.format(used / 1_000_000)} / ${formatter.format(
    limit / 1_000_000
  )}`;
};

export interface PhotoUploadProps {
  workLogId?: string | null;
}

export function PhotoUpload({ workLogId }: PhotoUploadProps) {
  const toast = useToast();
  const {
    isReady,
    photos,
    isLoadingPhotos,
    isUploading,
    uploadProgress,
    uploadError,
    storageUsage,
    canUploadMore,
    maxPhotos,
    uploadPhoto,
    updatePhoto,
    togglePhotoVisibility,
    deletePhoto,
  } = usePhotoUpload({ workLogId });

  const [caption, setCaption] = useState("");
  const [photoType, setPhotoType] = useState<PhotoCategory>("general");
  const [showOnProfile, setShowOnProfile] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const usagePercent = useMemo(() => {
    if (storageUsage.limitBytes === 0) {
      return 0;
    }
    return Math.min(
      100,
      Math.round((storageUsage.usedBytes / storageUsage.limitBytes) * 100)
    );
  }, [storageUsage.limitBytes, storageUsage.usedBytes]);

  const resetForm = useCallback(() => {
    setCaption("");
    setPhotoType("general");
    setShowOnProfile(false);
  }, []);

  const ensureReady = useCallback(() => {
    if (!isReady) {
      toast.show({
        title: "Save Draft First",
        message:
          "Photos can be added after the work log draft has been saved. Please wait for auto-save to finish.",
        variant: "info",
      });
      return false;
    }
    if (!canUploadMore) {
      toast.show({
        title: "Photo Limit Reached",
        message: `You can upload up to ${maxPhotos} photos per work log.`,
        variant: "warning",
      });
      return false;
    }
    return true;
  }, [isReady, canUploadMore, maxPhotos, toast]);

  const buildCandidateFromSelection = useCallback(
    (selection: UploadSelection): UploadCandidate | null => {
      const file = selection.files[0];
      if (!file) {
        toast.show({
          title: "Upload Failed",
          message: "Unable to process the selected file.",
          variant: "error",
        });
        return null;
      }
      return {
        id: randomUUID(),
        platform: "web",
        file,
        fileName: file.name || DEFAULT_PHOTO_NAME(randomUUID().slice(0, 8)),
        mimeType: (file.type as UploadCandidate["mimeType"]) || "image/jpeg",
        size: file.size,
        caption: caption.trim() || undefined,
        photoType,
        showOnProfile,
      };
    },
    [caption, photoType, showOnProfile, toast]
  );

  const handleUploadSelection = useCallback(
    async (selection: UploadSelection) => {
      if (!ensureReady()) {
        return;
      }
      const candidate = buildCandidateFromSelection(selection);
      if (!candidate) return;
      await uploadPhoto({ candidate });
      resetForm();
    },
    [buildCandidateFromSelection, ensureReady, uploadPhoto, resetForm]
  );

  const handleCapturePhoto = useCallback(async () => {
    if (!ensureReady()) {
      return;
    }

    try {
      setIsCapturing(true);
      const ImagePicker = await import("expo-image-picker");
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        toast.show({
          title: "Camera Permission Required",
          message:
            "Camera access is needed to capture photos. Please enable it in your device settings.",
          variant: "warning",
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const candidate: UploadCandidate = {
        id: randomUUID(),
        platform: "native",
        uri: asset.uri,
        fileName:
          asset.fileName ??
          DEFAULT_PHOTO_NAME(randomUUID().replaceAll("-", "").slice(0, 10)),
        mimeType: (asset.type as UploadCandidate["mimeType"]) || "image/jpeg",
        size: asset.fileSize ?? 0,
        width: asset.width,
        height: asset.height,
        caption: caption.trim() || undefined,
        photoType,
        showOnProfile,
      };

      await uploadPhoto({ candidate });
      resetForm();
    } catch (error) {
      console.error("[PhotoUpload] Camera capture failed", error);
      toast.show({
        title: "Capture Failed",
        message: "Unable to capture photo. Please try again.",
        variant: "error",
      });
    } finally {
      setIsCapturing(false);
    }
  }, [
    caption,
    ensureReady,
    photoType,
    showOnProfile,
    toast,
    uploadPhoto,
    resetForm,
  ]);

  return (
    <Stack gap={16}>
      <Stack
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius={16}
        padding="md"
        gap={12}
        backgroundColor="$color2"
      >
        <Stack gap={8}>
          <Text>Work Log Photos</Text>
          <Text color="$gray11">
            Add up to {maxPhotos} photos documenting your work. Individual files
            must be 2MB or less.
          </Text>
        </Stack>

        <Stack gap={8}>
          <Row justify="space-between" align="center">
            <Text>Storage Usage</Text>
            <Text color="$gray11">
              {formatStorageSummary(
                storageUsage.usedBytes,
                storageUsage.limitBytes
              )}
            </Text>
          </Row>
          <View
            style={{
              height: 10,
              backgroundColor: "#e2e8f0",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${usagePercent}%`,
                backgroundColor: usagePercent > 90 ? "#ef4444" : "#3b82f6",
              }}
            />
          </View>
        </Stack>

        {!isReady ? (
          <Stack
            borderWidth={1}
            borderColor="$orange8"
            backgroundColor="$orange2"
            borderRadius={16}
            paddingHorizontal={12}
            paddingVertical={8}
            gap={8}
          >
            <Text color="$orange11">Draft not yet saved</Text>
            <Text color="$orange11">
              Photos can be added after the work log draft is saved. Keep
              filling out the form and we&apos;ll enable uploads automatically.
            </Text>
          </Stack>
        ) : (
          <Stack gap={12}>
            <Stack gap={8}>
              <Text>Photo Details</Text>
              <Input
                placeholder="Caption (optional)"
                value={caption}
                onChangeText={setCaption}
                multiline
              />
              <ResponsiveSelect
                value={photoType}
                onValueChange={(value) => setPhotoType(value as PhotoCategory)}
                placeholder="Choose photo type"
                options={PHOTO_TYPE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
              <Row gap={8} align="center">
                <Checkbox
                  checked={showOnProfile}
                  onChange={(value) => setShowOnProfile(Boolean(value))}
                  size="sm"
                />
                <Text>Show on my public profile when verified</Text>
              </Row>
            </Stack>

            <Separator />

            <UploadSurface
              disabled={isUploading || isCapturing || !canUploadMore}
              accept="image/jpeg,image/png,image/webp"
              maxSizeBytes={2 * 1024 * 1024}
              onError={(_message) =>
                toast.show({
                  title: "Upload Failed",
                  message: "Unable to process the selected file.",
                  variant: "error",
                })
              }
              onSelect={handleUploadSelection}
            >
              {({
                getRootProps,
                getInputProps,
                open,
                isDragActive,
                isProcessing,
              }) => (
                <Stack gap={12}>
                  <Stack
                    {...(getRootProps() as Record<string, unknown>)}
                    padding="md"
                    backgroundColor={isDragActive ? "$blue3" : "$color1"}
                    borderRadius={16}
                    borderWidth={2}
                    borderColor={isDragActive ? "$blue9" : "$borderColor"}
                    style={{ borderStyle: "dashed" }}
                    align="center"
                    justify="center"
                    gap={8}
                  >
                    {Platform.OS === "web" ? (
                      <input
                        {...(getInputProps() as Record<string, unknown>)}
                        style={{ display: "none" }}
                      />
                    ) : null}
                    <ImagePlus
                      size={32}
                      color={isDragActive ? "$blue11" : "$color10"}
                    />
                    <Text>Drag and drop photos here</Text>
                    <Text color="$gray11">
                      or tap below to browse your device
                    </Text>
                  </Stack>

                  <Row gap={8}>
                    <Button
                      style={{ flex: 1 }}
                      iconStart={UploadCloud}
                      size="sm"
                      disabled={isUploading || isProcessing || isCapturing}
                      onPress={open}
                    >
                      Choose From Device
                    </Button>
                    {Platform.OS !== "web" && (
                      <Button
                        style={{ flex: 1 }}
                        iconStart={Camera}
                        size="sm"
                        disabled={isUploading || isProcessing || isCapturing}
                        onPress={handleCapturePhoto}
                      >
                        {isCapturing ? "Opening…" : "Capture Photo"}
                      </Button>
                    )}
                  </Row>
                </Stack>
              )}
            </UploadSurface>

            {(isUploading || uploadProgress > 0) && (
              <Stack gap={8}>
                <Text color="$gray11">Upload progress</Text>
                <View
                  style={{
                    height: 8,
                    backgroundColor: "#e2e8f0",
                    borderRadius: 16,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${uploadProgress}%`,
                      backgroundColor: "#3b82f6",
                    }}
                  />
                </View>
              </Stack>
            )}

            {uploadError ? (
              <Stack
                borderWidth={1}
                borderColor="$red8"
                backgroundColor="$red3"
                borderRadius={16}
                paddingHorizontal={12}
                paddingVertical={8}
              >
                <Text color="$red11">{uploadError}</Text>
              </Stack>
            ) : null}
          </Stack>
        )}
      </Stack>

      {isLoadingPhotos ? (
        <Row gap={8} align="center">
          <Spinner />
          <Text>Loading photos…</Text>
        </Row>
      ) : (
        <PhotoGallery
          photos={photos}
          disabled={isUploading || isCapturing}
          onUpdateCaption={async (photoId, nextCaption) => {
            await updatePhoto(photoId, { caption: nextCaption ?? null });
          }}
          onUpdatePhotoType={async (photoId, nextType) => {
            await updatePhoto(photoId, { photoType: nextType ?? undefined });
          }}
          onToggleVisibility={togglePhotoVisibility}
          onDelete={deletePhoto}
        />
      )}
    </Stack>
  );
}
