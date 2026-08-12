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
import { useToast } from "@scaffald/ui";
import { useUnsavedChangesPrompt } from "@scf/core/utils/platform";
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
import { buildGeneralInfoPatch } from "./utils/general-info-patch";
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
  const queryClient = useQueryClient();
  const syncStatus = useAdaptiveProfileSync(300);
  const isSyncing = syncStatus === "syncing";

  // Fetch and update profile data using SDK
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useGeneralInfo();
  const toast = useToast();
  const updateProfileMutation = useUpdateGeneralInfoMutationWithSync();

  const uploadAvatarMutation = useUploadAvatarMutation({
    onMutate: () => {
      resetProfileSyncError();
      startProfileSync();
    },
    onSuccess: async (data: { avatarPath: string }) => {
      toast.show({
        title: "Avatar Uploaded",
        message: "Your avatar has been uploaded successfully!",
        variant: "success",
      });
      setValue("avatar_path", data.avatarPath);
      await invalidateProfileQueries(queryClient);
    },
    onError: (error: unknown) => {
      console.error("Error uploading avatar:", error);
      failProfileSync();
      toast.show({
        title: "Upload Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to upload avatar. Please try again.",
        variant: "error",
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
    formState: { errors, isDirty, dirtyFields },
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

  useUnsavedChangesPrompt(isDirty);

  const onSubmit = async (data: GeneralProfileFormData) => {
    // Send only what the user actually changed — see buildGeneralInfoPatch for
    // why submitting the whole object was destructive (#580).
    const changed = buildGeneralInfoPatch(data, dirtyFields);

    if (Object.keys(changed).length === 0) return;


    setIsLoading(true);
    try {
      await updateProfileMutation.mutateAsync(changed);
    } finally {
      // Errors surface through the mutation's onError toast; swallowing them
      // here would double-report.
      setIsLoading(false);
    }
  };

  // Validation failures used to be console.logged only, so a rejected submit
  // looked to the user like the button had simply done nothing.
  const onInvalid = () => {
    toast.show({
      title: "Check your details",
      message: "Some fields need fixing before this can be saved.",
      variant: "error",
    });
  };

  if (isLoadingProfile) {
    return (
      <Stack gap={16} padding="md">
        <SkeletonForm fields={6} />
      </Stack>
    );
  }

  // A failed load must not render an editable empty form. Every input would sit
  // at its default, and the first edit would submit blanks over real data.
  if (isProfileError) {
    return (
      <DashboardWidget>
        <Stack gap={12} padding="md" align="center">
          <Text weight="semibold">Couldn't load your profile</Text>
          <Text style={{ color: "#414e62", textAlign: "center" }}>
            {profileError instanceof Error && profileError.message
              ? profileError.message
              : "Check your connection and try again."}
          </Text>
          <Button variant="outline" onPress={() => void refetchProfile()}>
            Retry
          </Button>
        </Stack>
      </DashboardWidget>
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
                  toast.show({
                    title: "Error",
                    message: "Failed to process image. Please try again.",
                    variant: "error",
                  });
                }
              } else {
                // shouldDirty, or Save stays disabled and the avatar can never
                // be removed — react-hook-form's setValue does not dirty the
                // form by default, and there is no other clear path (#591).
                setValue("avatar_path", "", { shouldDirty: true });
              }
            }}
            size={120}
            disabled={uploadAvatarMutation.isPending}
            onCropError={(message) =>
              toast.show({
                title: "Error",
                message,
                variant: "error",
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

        {/* Headline — one line, shown on the profile header, community posts and
            search results. Worth 20 points of Profile Strength via the Identity
            component, which until #585 no editor could satisfy. */}
        <Stack gap={8}>
          <Text>Headline</Text>
          <Controller
            name="headline"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="e.g. Journeyman Electrician, commercial fit-outs"
                value={field.value ?? ""}
                onChangeText={field.onChange}
                accessibilityLabel="Headline"
                aria-invalid={!!errors.headline}
                aria-describedby={errors.headline ? "headline-error" : undefined}
              />
            )}
          />
          {errors.headline ? (
            <Text id="headline-error" style={{ color: "#ef4444" }} role="alert">
              {errors.headline.message}
            </Text>
          ) : (
            <Text style={{ color: "#414e62" }}>
              A short summary of what you do. Shown next to your name.
            </Text>
          )}
        </Stack>

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
                // `editable={false}` alone does not reach the DOM on web — the
                // rendered input came back readOnly:false, disabled:false, so it
                // was focusable and typable while looking disabled (#591).
                readOnly
                aria-readonly="true"
                aria-label="Email address, read-only"
                focusable={false}
                tabIndex={-1}
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
            onPress={handleSubmit(onSubmit, onInvalid)}
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
                <Spinner variant="ios" size="sm" />
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
