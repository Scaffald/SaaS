import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { MessageCircle } from "@tamagui/lucide-icons";

import {
  Button,
  FieldError,
  Image,
  Input,
  Paragraph,
  ResponsiveModal,
  ScrollView,
  Separator,
  Text,
  UploadSurface,
  XStack,
  YStack,
} from "@app/ui";
import {
  FEEDBACK_ALLOWED_MIME_TYPES,
  FEEDBACK_MAX_LENGTH,
  FEEDBACK_MIN_LENGTH,
} from "@app/schemas/feedback/feedback.schema";
import type { UploadSelection } from "@app/ui";
import { useFeedbackContext } from "./hooks/useFeedbackContext";
import {
  type FeedbackFormValues,
  type FeedbackScreenshotSource,
  useFeedbackForm,
} from "./hooks/useFeedbackForm";
import { useFeedbackSubmit } from "./hooks/useFeedbackSubmit";

const INSTRUCTIONS = `Help us improve by providing detailed feedback. For bugs, describe what you expected versus what happened. For feature requests, explain the problem you're trying to solve.`;

const ACCEPT_TYPES = FEEDBACK_ALLOWED_MIME_TYPES.join(",");

function formatCharacterCounter(current: number) {
  return `${current.toLocaleString()} / ${FEEDBACK_MAX_LENGTH.toLocaleString()} characters (${FEEDBACK_MIN_LENGTH.toLocaleString()} minimum)`;
}

function toScreenshotSource(selection: UploadSelection): FeedbackScreenshotSource {
  if (selection.platform === "web") {
    return {
      kind: "web",
      file: selection.file,
    };
  }

  return {
    kind: "native",
    uri: selection.asset.uri,
    name: selection.asset.name ?? "feedback-screenshot",
    mimeType: selection.asset.type ?? "image/png",
    size: selection.asset.size,
  };
}

export function FeedbackWidget() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const context = useFeedbackContext();
  const { form, characterCount, isBelowMinimum, screenshot, setScreenshot, reset } =
    useFeedbackForm();
  const {
    submitFeedback,
    isSubmitting,
    isProcessingQueue,
    pendingCount,
    processQueue,
  } = useFeedbackSubmit();

  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  useEffect(() => {
    if (screenshot?.kind === "web") {
      const preview = URL.createObjectURL(screenshot.file);
      setScreenshotPreview(preview);
      return () => {
        URL.revokeObjectURL(preview);
      };
    }

    if (screenshot?.kind === "native") {
      setScreenshotPreview(screenshot.uri);
      return;
    }

    setScreenshotPreview(null);
  }, [screenshot]);

  const handleScreenshotSelect = async (selection: UploadSelection) => {
    setScreenshot(toScreenshotSource(selection));
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
  };

  const handleSubmit = async (values: FeedbackFormValues) => {
    await submitFeedback({
      formValues: values,
      context,
      screenshotSource: screenshot,
    });
    if (!isSubmitting) {
      reset();
      setIsModalOpen(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      reset();
    }
  };

  return (
    <>
      <YStack position="absolute" b="$4" r="$4" zi={1000}>
        <Button
          size="$6"
          circular
          icon={MessageCircle}
          bg="$blue9"
          color="$color1"
          elevation="$4"
          pressStyle={{ scale: 0.97 }}
          hoverStyle={{ bg: "$blue10" }}
          focusStyle={{ outlineColor: "$blue8" }}
          onPress={() => setIsModalOpen(true)}
        >
          Feedback
        </Button>
        {pendingCount > 0 ? (
          <YStack
            mt="$2"
            px="$3"
            py="$2"
            bg="$yellow4"
            borderWidth={1}
            borderColor="$yellow6"
            br="$3"
            maxWidth={220}
          >
            <Text fontSize="$2" color="$yellow10">
              {pendingCount === 1
                ? "1 submission will sync when you're online."
                : `${pendingCount} submissions will sync when you're online.`}
            </Text>
          </YStack>
        ) : null}
      </YStack>

      <ResponsiveModal
        open={isModalOpen}
        onOpenChange={handleOpenChange}
        title="Submit Feedback"
        size="medium"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$4" px="$2" py="$2">
            <Paragraph color="$color11">{INSTRUCTIONS}</Paragraph>

            <YStack gap="$2">
              <Text fontWeight="600">Feedback Type</Text>
              <Controller
                control={form.control}
                name="feedbackType"
                render={({ field: { value, onChange } }) => (
                  <XStack gap="$2">
                    {(["bug", "feature", "comment"] as const).map((type) => {
                      const isActive = value === type;
                      return (
                        <Button
                          key={type}
                          size="$3"
                          theme={isActive ? "blue" : undefined}
                          variant={isActive ? undefined : "outlined"}
                          onPress={() => onChange(type)}
                        >
                          {type === "bug"
                            ? "Bug Report"
                            : type === "feature"
                            ? "Feature Request"
                            : "General Comment"}
                        </Button>
                      );
                    })}
                  </XStack>
                )}
              />
              <FieldError message={form.formState.errors.feedbackType?.message} />
            </YStack>

            <YStack gap="$2">
              <Text fontWeight="600">Feedback Details</Text>
              <Controller
                control={form.control}
                name="feedbackText"
                render={({ field: { value, onBlur, onChange } }) => (
                  <Input
                    multiline
                    numberOfLines={6}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Describe your feedback in detail..."
                    bg="$color2"
                    borderColor={isBelowMinimum ? "$red7" : "$color6"}
                    textAlignVertical="top"
                    focusStyle={{
                      borderColor: "$blue7",
                      outlineColor: "$blue7",
                    }}
                  />
                )}
              />
              <XStack justify="space-between" items="center">
                <FieldError
                  message={
                    form.formState.errors.feedbackText?.message ??
                    (isBelowMinimum
                      ? `Please provide at least ${FEEDBACK_MIN_LENGTH} characters.`
                      : undefined)
                  }
                />
                <Text color={isBelowMinimum ? "$red9" : "$color9"} fontSize="$2">
                  {formatCharacterCounter(characterCount)}
                </Text>
              </XStack>
            </YStack>

            <YStack gap="$2">
              <Text fontWeight="600">Screenshot (optional)</Text>
              <UploadSurface
                accept={ACCEPT_TYPES}
                maxSizeBytes={5 * 1024 * 1024}
                onSelect={handleScreenshotSelect}
                onError={(message) => {
                  form.setError("feedbackText", { message });
                }}
              >
                {({ open, getInputProps, getRootProps, isDragActive, isProcessing }) => (
                  <YStack
                    {...getRootProps()}
                    borderWidth={1}
                    borderStyle="dashed"
                    px="$4"
                    py="$6"
                    items="center"
                    justify="center"
                    gap="$2"
                    bg="$color2"
                    borderColor={isDragActive ? "$blue7" : "$color6"}
                    br="$4"
                  >
                    <input {...getInputProps()} />
                    <Text fontWeight="600">
                      {isProcessing ? "Processing..." : "Drag & drop a screenshot"}
                    </Text>
                    <Text fontSize="$2" color="$color9">
                      Accepted formats: PNG, JPG, JPEG, GIF, WebP (max 5MB)
                    </Text>
                    <Button size="$2" mt="$2" onPress={open}>
                      Choose File
                    </Button>
                  </YStack>
                )}
              </UploadSurface>

              {screenshot ? (
                <YStack mt="$3" borderWidth={1} borderColor="$color6" overflow="hidden" br="$4">
                  {screenshotPreview ? (
                    <Image
                      source={{ uri: screenshotPreview }}
                      width="100%"
                      height={200}
                      resizeMode="cover"
                    />
                  ) : null}
                  <XStack
                    px="$3"
                    py="$2"
                    items="center"
                    justify="space-between"
                    bg="$color2"
                    gap="$2"
                  >
                    <YStack flex={1}>
                      <Text numberOfLines={1} fontWeight="600">
                        {screenshot.kind === "web"
                          ? screenshot.file.name
                          : screenshot.name}
                      </Text>
                      <Text fontSize="$2" color="$color9">
                        {screenshot.kind === "web"
                          ? screenshot.file.type || "image"
                          : screenshot.mimeType}
                      </Text>
                    </YStack>
                    <Button
                      size="$2"
                      variant="outlined"
                      onPress={handleRemoveScreenshot}
                    >
                      Remove
                    </Button>
                  </XStack>
                </YStack>
              ) : null}
            </YStack>

            <Separator />

            <XStack items="center" justify="space-between" gap="$3">
              <YStack gap="$1">
                <Text fontSize="$2" color="$color9">
                  Captured context:
                </Text>
                <Text fontSize="$2" color="$color10">
                  {context.pageUrl}
                </Text>
                <Text fontSize="$2" color="$color10">
                  {context.browserName
                    ? `${context.browserName} ${context.browserVersion ?? ""}`.trim()
                    : context.userAgent}
                </Text>
              </YStack>

              <Button
                size="$2"
                variant="outlined"
                onPress={() => {
                  void processQueue();
                }}
                disabled={isProcessingQueue}
              >
                {isProcessingQueue ? "Syncing…" : "Retry Pending"}
              </Button>
            </XStack>

            <Button
              size="$4"
              disabled={isSubmitting || isBelowMinimum || !form.formState.isValid}
              onPress={form.handleSubmit(handleSubmit)}
            >
              {isSubmitting ? "Submitting…" : "Submit Feedback"}
            </Button>
          </YStack>
        </ScrollView>
      </ResponsiveModal>
    </>
  );
}


