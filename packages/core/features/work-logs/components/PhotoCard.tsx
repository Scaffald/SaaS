import { useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Button,
  Image,
  Input,
  Separator,
  Spinner,
  SizableText,
  View,
  Select,
} from "tamagui";
import {
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Check,
  X,
  Tag,
} from "@tamagui/lucide-icons";

import type { ResolvedWorkLogPhoto, WorkLogPhotoType } from "../types/photos";

const PHOTO_TYPE_OPTIONS: Array<{
  value: Exclude<WorkLogPhotoType, null>;
  label: string;
}> = [
  { value: "before", label: "Before" },
  { value: "progress", label: "Progress" },
  { value: "after", label: "After" },
  { value: "general", label: "General" },
];

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${
    units[exponent]
  }`;
};

const formatDate = (iso: string | null): string | null => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString();
};

export interface PhotoCardProps {
  photo: ResolvedWorkLogPhoto;
  disabled?: boolean;
  onUpdateCaption?: (photoId: string, caption: string | null) => Promise<void> | void;
  onUpdatePhotoType?: (
    photoId: string,
    photoType: WorkLogPhotoType,
  ) => Promise<void> | void;
  onToggleVisibility?: (
    photoId: string,
    showOnProfile: boolean,
  ) => Promise<void> | void;
  onDelete?: (photoId: string) => Promise<void> | void;
}

export function PhotoCard({
  photo,
  disabled = false,
  onUpdateCaption,
  onUpdatePhotoType,
  onToggleVisibility,
  onDelete,
}: PhotoCardProps) {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(photo.caption ?? "");
  const [isSavingCaption, setIsSavingCaption] = useState(false);
  const [, setIsUpdatingType] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const canToggleVisibility = Boolean(onToggleVisibility);
  const canEditCaption = Boolean(onUpdateCaption);
  const canChangeType = Boolean(onUpdatePhotoType);
  const canDelete = Boolean(onDelete);

  useEffect(() => {
    setCaptionDraft(photo.caption ?? "");
  }, [photo.caption]);

  const typeOption = useMemo(() => {
    if (!photo.photoType) return null;
    return PHOTO_TYPE_OPTIONS.find((option) => option.value === photo.photoType) ?? null;
  }, [photo.photoType]);

  const handleSaveCaption = async () => {
    if (!onUpdateCaption) {
      setIsEditingCaption(false);
      return;
    }
    setIsSavingCaption(true);
    try {
      const nextCaption = captionDraft.trim();
      await onUpdateCaption(photo.id, nextCaption.length ? nextCaption : null);
      setIsEditingCaption(false);
    } finally {
      setIsSavingCaption(false);
    }
  };

  const handleCancelCaption = () => {
    setCaptionDraft(photo.caption ?? "");
    setIsEditingCaption(false);
  };

  const handleUpdateType = async (nextValue: WorkLogPhotoType) => {
    if (!onUpdatePhotoType) {
      return;
    }
    setIsUpdatingType(true);
    try {
      await onUpdatePhotoType(photo.id, nextValue);
    } finally {
      setIsUpdatingType(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!onToggleVisibility) {
      return;
    }
    await onToggleVisibility(photo.id, !photo.showOnProfile);
  };

  const handleDelete = async () => {
    if (!onDelete) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(photo.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <YStack
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$4"
      overflow="hidden"
      bg="$color2"
      width="100%"
    >
      <View position="relative" aspectRatio={4 / 3} bg="$color3">
        {photo.signedUrl ? (
          <Image
            source={{ uri: photo.signedUrl }}
            width="100%"
            height="100%"
            resizeMode="cover"
          />
        ) : (
          <YStack
            position="absolute"
            justify="center"
            items="center"
            t={0}
            r={0}
            b={0}
            l={0}
            bg="$color3"
          >
            <Spinner color="$color10" />
          </YStack>
        )}
        {(photo.isRefreshingUrl || isDeleting) && (
          <YStack
            position="absolute"
            t={0}
            r={0}
            b={0}
            l={0}
            bg="rgba(0,0,0,0.35)"
            items="center"
            justify="center"
            gap="$2"
          >
            <Spinner color="white" size="large" />
            <SizableText color="white" size="$3">
              {isDeleting ? "Removing…" : "Refreshing…"}
            </SizableText>
          </YStack>
        )}
      </View>

      <YStack gap="$3" p="$3">
        <XStack items="center" justify="space-between" gap="$3">
          <XStack gap="$2" items="center">
            <Tag size={16} color="$color10" />
            <Text fontWeight="600" fontSize="$3">
              {typeOption?.label ?? "Uncategorized"}
            </Text>
          </XStack>
          <XStack gap="$2">
            {canToggleVisibility ? (
              <Button
                size="$2"
                variant="outlined"
                icon={photo.showOnProfile ? Eye : EyeOff}
                disabled={disabled}
                onPress={handleToggleVisibility}
              >
                {photo.showOnProfile ? "Public" : "Private"}
              </Button>
            ) : (
              <Text fontSize="$2" color="$color10">
                {photo.showOnProfile ? "Visible on profile" : "Hidden from profile"}
              </Text>
            )}
            {canDelete ? (
              <Button
                size="$2"
                variant="outlined"
                icon={Trash2}
                disabled={disabled || isDeleting}
                onPress={handleDelete}
              >
                Delete
              </Button>
            ) : null}
          </XStack>
        </XStack>

        <YStack gap="$2">
          <Text fontWeight="600" fontSize="$3">
            Caption
          </Text>
          {canEditCaption && isEditingCaption ? (
            <YStack gap="$2">
              <Input
                value={captionDraft}
                onChangeText={setCaptionDraft}
                placeholder="Add an optional caption"
                multiline
                numberOfLines={Platform.select({ web: undefined, default: 3 })}
              />
              <XStack gap="$2">
                <Button
                  size="$2"
                  icon={Check}
                  disabled={isSavingCaption}
                  onPress={handleSaveCaption}
                >
                  Save
                </Button>
                <Button
                  size="$2"
                  icon={X}
                  variant="outlined"
                  disabled={isSavingCaption}
                  onPress={handleCancelCaption}
                >
                  Cancel
                </Button>
              </XStack>
            </YStack>
          ) : canEditCaption ? (
            <XStack gap="$2" items="center">
              <Text flex={1} color={photo.caption ? "$color12" : "$color9"}>
                {photo.caption ?? "No caption provided."}
              </Text>
              <Button
                size="$2"
                icon={Edit3}
                variant="outlined"
                disabled={disabled}
                onPress={() => setIsEditingCaption(true)}
              >
                Edit
              </Button>
            </XStack>
          ) : (
            <Text flex={1} color={photo.caption ? "$color12" : "$color9"}>
              {photo.caption ?? "No caption provided."}
            </Text>
          )}
        </YStack>

        <Separator />

        <YStack gap="$2">
          <Text fontWeight="600" fontSize="$3">
            Photo Type
          </Text>
          {canChangeType ? (
            <Select
              value={(photo.photoType ?? "general") as Exclude<WorkLogPhotoType, null>}
              onValueChange={(value) =>
                handleUpdateType(value as WorkLogPhotoType)
              }
              disablePreventBodyScroll
            >
              <Select.Trigger width="100%" disabled={disabled}>
                <Select.Value placeholder="Choose category" />
              </Select.Trigger>
              <Select.Content>
                {PHOTO_TYPE_OPTIONS.map((option, index) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    index={index}
                  >
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          ) : (
            <Text color="$color10">
              {typeOption?.label ?? "Uncategorized"}
            </Text>
          )}
        </YStack>

        <Separator />

        <YStack gap="$1">
          <Text fontWeight="600" fontSize="$3">
            Details
          </Text>
          <Text fontSize="$2" color="$color11">
            Size: {formatBytes(photo.fileSizeBytes)}
          </Text>
          {photo.takenAt ? (
            <Text fontSize="$2" color="$color11">
              Taken: {formatDate(photo.takenAt) ?? "Unknown"}
            </Text>
          ) : null}
          {photo.createdAt ? (
            <Text fontSize="$2" color="$color11">
              Uploaded: {formatDate(photo.createdAt) ?? "Unknown"}
            </Text>
          ) : null}
        </YStack>
      </YStack>
    </YStack>
  );
}

