import { ControlledAddressForm } from "@scf/core/forms";
import {
  useGeneralInfo,
  useUpdateGeneralInfoMutationWithSync,
  useUploadAvatarMutation,
} from "@scf/core/utils/profile-general-sdk-hooks";
import { getAvatarUrl } from "@scf/core/utils/supabase/storage";
import { isValidPhoneNumber } from "@scf/schemas/common/phone";
import { useQueryClient } from "@tanstack/react-query";
import {
  AvatarImagePicker,
  Button,
  DashboardWidget,
  extractPlainText,
  PhoneNumberInput,
  RichTextEditor,
  SkeletonForm,
} from "@scaffald/ui";
import { useSafeToast } from "@scf/core/hooks/useSafeToast";
import { zodResolver } from "@hookform/resolvers/zod";
import type { JSONContent } from "@tiptap/core";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Input,
  Spinner,
  Text,
  Row,
  Stack,
  Modal,
  ModalHeader,
  ModalContent,
  ModalActions,
} from "@scaffald/ui";
import {
  type GeneralProfileFormData,
  generalProfileDefaults,
  generalProfileSchema,
} from "./config";
import { invalidateProfileQueries } from "./utils/profile-sync";
import {
  completeProfileSync,
  failProfileSync,
  resetProfileSyncError,
  startProfileSync,
  useAdaptiveProfileSync,
} from "./utils/profile-sync-store";

/**
 * Profile General Left Component
 * Form for editing general profile information
 */
export function ProfileGeneralLeft() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const originalDataRef = useRef<GeneralProfileFormData | null>(null);
  const toast = useSafeToast();
  const queryClient = useQueryClient();
  const syncStatus = useAdaptiveProfileSync(300);
  const isSyncing = syncStatus === "syncing";

  // Fetch and update profile data using SDK
  const { data: profileData, isLoading: isLoadingProfile } = useGeneralInfo();
  const updateProfileMutation = useUpdateGeneralInfoMutationWithSync();

  const uploadAvatarMutation = useUploadAvatarMutation({
    onMutate: () => {
      resetProfileSyncError();
      startProfileSync();
    },
    onSuccess: async (data: { avatarPath: string }) => {
      toast.show("Avatar Uploaded", {
        message: "Your avatar has been uploaded successfully!",
      });
      setValue("avatar_path", data.avatarPath);
      await invalidateProfileQueries(queryClient);
    },
    onError: (error: unknown) => {
      console.error("Error uploading avatar:", error);
      failProfileSync();
      toast.show("Upload Error", {
        message:
          error instanceof Error
            ? error.message
            : "Failed to upload avatar. Please try again.",
      });
    },
    onSettled: (_data: { avatarPath: string } | undefined, error: unknown) => {
      if (!error) {
        completeProfileSync();
      }
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    setValue,
    trigger,
    setError,
    clearErrors,
  } = useForm<GeneralProfileFormData>({
    resolver: zodResolver(generalProfileSchema),
    defaultValues: generalProfileDefaults,
    mode: "onChange", // Real-time validation
  });

  const avatarPath = watch("avatar_path");

  // Reset form when profile data is loaded
  useEffect(() => {
    if (profileData) {
      const formData = profileData as unknown as GeneralProfileFormData;
      reset(formData);
      originalDataRef.current = formData;

      if (profileData.phone && !isValidPhoneNumber(profileData.phone)) {
        setError("phone", {
          type: "manual",
          message:
            "Your current phone number is invalid. Please enter a valid phone number.",
        });
      } else {
        clearErrors("phone");
      }

      void trigger("phone");
    }
  }, [profileData, reset, setError, clearErrors, trigger]);

  const phoneValue = watch("phone");

  useEffect(() => {
    if (!phoneValue) {
      clearErrors("phone");
      return;
    }

    if (isValidPhoneNumber(phoneValue)) {
      clearErrors("phone");
    }
  }, [phoneValue, clearErrors]);

  // Debug: Log form state changes
  useEffect(() => {
    console.log("📊 Form state updated:", {
      isDirty,
      hasErrors: Object.keys(errors).length > 0,
      errorCount: Object.keys(errors).length,
      errors: errors,
    });
  }, [isDirty, errors]);

  // Browser navigation guard - prevent data loss on page close/navigation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const onSubmit = async (data: GeneralProfileFormData) => {
    console.log("🟢 Form submission started");
    console.log("📋 Form data:", JSON.stringify(data, null, 2));
    console.log("✅ Form validation passed");

    setIsLoading(true);
    try {
      await updateProfileMutation.mutateAsync(data);
      console.log("✅ Profile updated successfully");
    } catch (error) {
      console.error("❌ Profile update failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onError = (validationErrors: typeof errors) => {
    console.log("❌ Form validation failed");
    console.log(
      "📋 Validation errors:",
      JSON.stringify(validationErrors, null, 2)
    );
    console.log("📊 Form state:", {
      isDirty,
      isValid: Object.keys(validationErrors).length === 0,
      errorCount: Object.keys(validationErrors).length,
    });
  };

  if (isLoadingProfile) {
    return (
      <Stack gap={16} padding="md">
        <SkeletonForm fields={6} />
      </Stack>
    );
  }

  return (
    <DashboardWidget>
      <Stack gap={16}>
        {/* Avatar Section */}
        <Stack gap={12} align="center">
          <Text>Profile Photo</Text>
          <AvatarImagePicker
            value={getAvatarUrl(avatarPath) || ""}
            onImageSelect={async (imageUri) => {
              if (imageUri) {
                // Convert image to base64 for upload
                try {
                  const [metadata] = imageUri.split(",");
                  const mimeMatch = metadata?.match(
                    /^data:(image\/[a-zA-Z+]+);base64$/
                  );
                  const contentType = mimeMatch ? mimeMatch[1] : "image/jpeg";

                  const extension = (() => {
                    if (contentType === "image/png") return "png";
                    if (contentType === "image/webp") return "webp";
                    return "jpg";
                  })();

                  uploadAvatarMutation.mutate({
                    file: imageUri,
                    fileName: `avatar-${Date.now()}.${extension}`,
                    contentType,
                  });
                } catch (error) {
                  console.error("Error processing image:", error);
                  toast.show("Error", {
                    message: "Failed to process image. Please try again.",
                  });
                }
              } else {
                // Clear avatar
                setValue("avatar_path", "");
              }
            }}
            size={120}
            disabled={uploadAvatarMutation.isPending}
            onCropError={(message) =>
              toast.show("Error", {
                message,
              })
            }
            placeholder="Upload Avatar"
          />
          {uploadAvatarMutation.isPending && (
            <Text style={{ color: "#414e62" }}>Uploading avatar...</Text>
          )}
        </Stack>

        {/* Name Fields */}
        <Row gap={12}>
          <Stack gap={8} flex={1}>
            <Text>First Name *</Text>
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="First name"
                  value={field.value}
                  onChangeText={field.onChange}
                  accessibilityLabel="First name"
                  aria-required="true"
                  aria-invalid={!!errors.first_name}
                  aria-describedby={
                    errors.first_name ? "first_name-error" : undefined
                  }
                />
              )}
            />
            {errors.first_name && (
              <Text
                id="first_name-error"
                style={{ color: "#ef4444" }}
                role="alert"
              >
                {errors.first_name.message}
              </Text>
            )}
          </Stack>

          <Stack gap={8} flex={1}>
            <Text>Last Name *</Text>
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="Last name"
                  value={field.value}
                  onChangeText={field.onChange}
                  accessibilityLabel="Last name"
                  aria-required="true"
                  aria-invalid={!!errors.last_name}
                  aria-describedby={
                    errors.last_name ? "last_name-error" : undefined
                  }
                />
              )}
            />
            {errors.last_name && (
              <Text
                id="last_name-error"
                style={{ color: "#ef4444" }}
                role="alert"
              >
                {errors.last_name.message}
              </Text>
            )}
          </Stack>
        </Row>

        {/* About Section - Rich Text Editor */}
        <Stack gap={8}>
          <Text>About</Text>
          <Controller
            name="about"
            control={control}
            render={({ field }) => {
              const stringValue =
                typeof field.value === "string"
                  ? field.value
                  : field.value != null
                  ? extractPlainText(field.value as JSONContent)
                  : "";

              return (
                <RichTextEditor
                  value={stringValue}
                  onChange={field.onChange}
                  showCharacterCount
                  minHeight={150}
                  error={errors.about?.message}
                />
              );
            }}
          />
        </Stack>

        {/* Contact Information */}
        <Stack gap={8}>
          <Text>Phone</Text>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneNumberInput
                value={field.value || ""}
                onChange={field.onChange}
                error={errors.phone?.message}
                defaultCountry="US"
              />
            )}
          />
        </Stack>

        <Stack gap={8}>
          <Text>Email (Read-only)</Text>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="Email address"
                value={field.value}
                onChangeText={() => {}}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false}
                style={{ opacity: 0.7 }}
              />
            )}
          />
          <Text style={{ color: "#414e62" }}>
            Email changes must be made through account settings
          </Text>
        </Stack>

        {/* Home Address with Smart Autocomplete */}
        <ControlledAddressForm
          control={control}
          name="address"
          setValue={setValue}
          trigger={trigger}
          label="Home Address"
          placeholder="Search for your home address..."
          error={
            errors.address?.street?.message || errors.address?.city?.message
          }
        />

        {/* Action Buttons */}
        <Row justify="flex-end" gap={12} paddingTop={16}>
          <Button
            variant="outline"
            disabled={!isDirty}
            onPress={() => setShowCancelDialog(true)}
            style={{ opacity: !isDirty ? 0.5 : 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            color="primary"
            onPress={handleSubmit(onSubmit, onError)}
            disabled={!isDirty || isLoading || Object.keys(errors).length > 0}
            style={{
              opacity:
                !isDirty || isLoading || Object.keys(errors).length > 0
                  ? 0.5
                  : 1,
            }}
          >
            {isSyncing ? (
              <Row gap={8} align="center">
                <Spinner size="sm" />
                <Text>Saving...</Text>
              </Row>
            ) : (
              "Save Changes"
            )}
          </Button>
        </Row>

        {/* Cancel Confirmation Dialog */}
        <Modal
          visible={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
        >
          <ModalHeader title="Discard Changes?" />
          <ModalContent>
            <Text>
              You have unsaved changes. Are you sure you want to discard them?
            </Text>
          </ModalContent>
          <ModalActions
            primaryAction={{
              label: "Discard Changes",
              onPress: () => {
                if (originalDataRef.current) {
                  reset(originalDataRef.current);
                  setShowCancelDialog(false);
                }
              },
              color: "error",
            }}
            secondaryAction={{
              label: "Keep Editing",
              onPress: () => setShowCancelDialog(false),
            }}
          />
        </Modal>
      </Stack>
    </DashboardWidget>
  );
}
