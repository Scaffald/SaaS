import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { Platform } from "react-native";

import {
  FEEDBACK_MAX_LENGTH,
  FEEDBACK_MIN_LENGTH,
  feedbackTextSchema,
  feedbackTypeSchema,
  type FeedbackType,
} from "@app/schemas/feedback/feedback.schema";
import { z } from "zod";

export type FeedbackScreenshotSource =
  | {
    kind: "web";
    file: File;
  }
  | {
    kind: "native";
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
  };

const feedbackFormSchema = z.object({
  feedbackType: feedbackTypeSchema,
  feedbackText: feedbackTextSchema,
});

export type FeedbackFormValues = {
  feedbackType: FeedbackType | undefined;
  feedbackText: string;
};

export interface UseFeedbackFormResult {
  form: UseFormReturn<FeedbackFormValues>;
  characterCount: number;
  minLength: number;
  maxLength: number;
  isBelowMinimum: boolean;
  screenshot: FeedbackScreenshotSource | null;
  setScreenshot: (source: FeedbackScreenshotSource | null) => void;
  reset: () => void;
}

export function useFeedbackForm(): UseFeedbackFormResult {
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      feedbackType: undefined,
      feedbackText: "",
    },
    mode: "onChange",
  });

  const [screenshot, setScreenshot] = useState<FeedbackScreenshotSource | null>(null);

  const feedbackText = form.watch("feedbackText") ?? "";

  const { characterCount, isBelowMinimum } = useMemo(() => {
    const length = feedbackText.length;
    return {
      characterCount: length,
      isBelowMinimum: length < FEEDBACK_MIN_LENGTH,
    };
  }, [feedbackText]);

  const reset = () => {
    form.reset({
      feedbackType: Platform.select({
        default: undefined,
      }),
      feedbackText: "",
    });
    setScreenshot(null);
  };

  return {
    form,
    characterCount,
    minLength: FEEDBACK_MIN_LENGTH,
    maxLength: FEEDBACK_MAX_LENGTH,
    isBelowMinimum,
    screenshot,
    setScreenshot,
    reset,
  };
}



