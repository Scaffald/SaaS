import {
  useUploadResumeMutation,
  useParseResumeMutation,
} from "@scf/core/utils/resume-sdk-hooks";
import { FileUpload, ResponsiveModal, useThemeContext } from "@scaffald/ui";
import { colors, namedSpacing } from "@scaffald/ui/tokens";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  UploadCloud,
} from "lucide-react-native";
import { useToast } from "@scaffald/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { Button, Paragraph, Spinner, Text, Row, Stack } from "@scaffald/ui";
import { useQueryClient } from "@tanstack/react-query";

const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx";
const MAX_FILE_BYTES = 1024 * 1024;

type UploadStatus =
  | "idle"
  | "selecting"
  | "uploading"
  | "parsing"
  | "success"
  | "error";

type UploadCandidate =
  | {
      kind: "web";
      name: string;
      size: number;
      type: string;
      file: File;
    }
  | {
      kind: "native";
      name: string;
      size: number;
      type: string;
      getBase64: () => Promise<string>;
    };

export interface ResumeUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: (resumeId: string) => void;
}

export function ResumeUploadModal({
  open,
  onOpenChange,
  onUploadComplete,
}: ResumeUploadModalProps) {
  const { theme } = useThemeContext();
  const toast = useToast();
  const queryClient = useQueryClient();
  const uploadResumeMutation = useUploadResumeMutation();
  const parseResumeMutation = useParseResumeMutation();

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const uploadSequenceRef = useRef(0);

  const resetState = useCallback(() => {
    uploadSequenceRef.current += 1;
    activeCandidateRef.current = null;
    setStatus("idle");
    setErrorMessage(null);
    setFileName(null);
    uploadResumeMutation.reset();
    parseResumeMutation.reset();
  }, [parseResumeMutation, uploadResumeMutation]);

  const wasOpenRef = useRef<boolean>(open);

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      resetState();
    }

    wasOpenRef.current = open;
  }, [open, resetState]);

  const showProgress = status === "uploading" || status === "parsing";

  const shouldShowProgressIndicators =
    status === "uploading" ||
    status === "parsing" ||
    status === "success" ||
    status === "error";

  const progressValue = useMemo(() => {
    switch (status) {
      case "uploading":
        return 0.35;
      case "parsing":
        return 0.75;
      case "success":
        return 1;
      case "error":
        return 1;
      default:
        return 0;
    }
  }, [status]);

  const progressColor = useMemo(() => {
    if (status === "error") {
      return colors.error[500];
    }
    if (status === "success") {
      return colors.success[500];
    }
    return colors.info[500];
  }, [status]);

  const progressLabel = useMemo(() => {
    switch (status) {
      case "uploading":
        return "Uploading resume...";
      case "parsing":
        return "Parsing resume with AI...";
      case "success":
        return "Resume uploaded successfully.";
      default:
        return null;
    }
  }, [status]);

  const handleUploadError = useCallback(
    (message: string) => {
      setStatus("error");
      setErrorMessage(message);
      toast.show({
        title: "Resume Import Failed",
        message: "An error occurred while importing your resume.",
        variant: "error",
      });
    },
    [toast]
  );

  const validateFileSize = useCallback(
    (size: number): boolean => {
      if (size > MAX_FILE_BYTES) {
        handleUploadError(
          "File size exceeds 1MB limit. Please upload a smaller file."
        );
        return false;
      }
      return true;
    },
    [handleUploadError]
  );

  const activeCandidateRef = useRef<UploadCandidate | null>(null);

  const beginUpload = useCallback(
    async (nextCandidate: UploadCandidate) => {
      const sequence = uploadSequenceRef.current + 1;
      uploadSequenceRef.current = sequence;
      activeCandidateRef.current = nextCandidate;

      try {
        setStatus("uploading");
        console.debug("[ResumeUploadModal] preparing upload request");
        const base64 =
          nextCandidate.kind === "web"
            ? await fileToDataUrl(nextCandidate.file)
            : await nextCandidate.getBase64();
        console.debug("[ResumeUploadModal] obtained base64", {
          length: base64.length,
          kind: nextCandidate.kind,
        });
        if (sequence !== uploadSequenceRef.current) {
          return;
        }

        console.debug("[ResumeUploadModal] sending upload to resume.upload");
        const uploadResponse = await uploadResumeMutation.mutateAsync({
          fileData: base64,
          fileName: nextCandidate.name,
          fileSize: nextCandidate.size,
          mimeType: nextCandidate.type,
        });
        console.debug("[ResumeUploadModal] upload stored, starting AI parsing");

        if (sequence !== uploadSequenceRef.current) {
          return;
        }

        setStatus("parsing");
        await parseResumeMutation.mutateAsync({
          resumeId: uploadResponse.resumeId,
          sections: [
            "general",
            "experience",
            "education",
            "skills",
            "certifications",
            "employment",
          ],
        });
        console.debug(
          "[ResumeUploadModal] parsing completed, updating dashboard"
        );

        if (sequence !== uploadSequenceRef.current) {
          return;
        }

        await queryClient.invalidateQueries({
          queryKey: ["resume", "has-uploaded"],
        });

        if (sequence !== uploadSequenceRef.current) {
          return;
        }

        setStatus("success");
        console.debug(
          "[ResumeUploadModal] parsing complete, preparing review wizard"
        );
        toast.show({
          title: "Resume Imported",
          message:
            "Review the parsed details before saving them to your profile.",
          variant: "success",
        });
        console.debug("[ResumeUploadModal] redirecting to review experience");
        onUploadComplete?.(uploadResponse.resumeId);
        onOpenChange(false);
      } catch (error) {
        if (sequence !== uploadSequenceRef.current) {
          return;
        }
        console.error("[ResumeUploadModal] Upload error", error);
        const message =
          error instanceof Error
            ? error.message
            : "Unable to process resume. Please try again.";
        handleUploadError(message);
      } finally {
        if (sequence === uploadSequenceRef.current) {
          activeCandidateRef.current = null;
          setFileName(null);
        }
      }
    },
    [
      handleUploadError,
      onOpenChange,
      onUploadComplete,
      parseResumeMutation,
      toast,
      uploadResumeMutation,
      queryClient,
    ]
  );

  const handleWebFileSelect = useCallback(
    (file: File) => {
      console.debug("[ResumeUploadModal] handleWebFileSelect", {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      const mimeType = file.type || guessMimeTypeFromName(file.name);
      if (
        !ACCEPTED_MIME_TYPES.includes(
          mimeType as (typeof ACCEPTED_MIME_TYPES)[number]
        )
      ) {
        handleUploadError("Please upload a PDF or Word document.");
        return;
      }

      if (!validateFileSize(file.size)) {
        return;
      }

      const nextCandidate: UploadCandidate = {
        kind: "web",
        name: file.name,
        size: file.size,
        type: mimeType,
        file,
      };
      setFileName(file.name);
      void beginUpload(nextCandidate);
    },
    [beginUpload, handleUploadError, validateFileSize]
  );

  const handleNativePick = useCallback(async () => {
    try {
      setStatus("selecting");
      const { getDocumentAsync } = await import("expo-document-picker");
      const result = await getDocumentAsync({
        type: ACCEPTED_MIME_TYPES as unknown as string[],
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setStatus("idle");
        return;
      }

      const asset = result.assets?.[0];
      const uri = asset?.uri;
      const name = asset?.name ?? "resume";
      const mimeType = asset?.mimeType ?? "application/pdf";

      if (!uri) {
        handleUploadError("Unable to access selected file. Please try again.");
        setStatus("idle");
        return;
      }

      const FileSystem = await import("expo-file-system");
      const info = await FileSystem.getInfoAsync(uri);
      const infoSize =
        info.exists && "size" in info && typeof info.size === "number"
          ? info.size
          : undefined;
      const size = typeof asset?.size === "number" ? asset.size : infoSize ?? 0;

      if (!validateFileSize(size)) {
        setStatus("idle");
        return;
      }

      const getBase64 = async () => {
        const contents = await FileSystem.readAsStringAsync(uri, {
          encoding: "base64",
        });
        return `data:${mimeType};base64,${contents}`;
      };

      const nextCandidate: UploadCandidate = {
        kind: "native",
        name,
        size,
        type: mimeType,
        getBase64,
      };
      setFileName(name);
      setStatus("idle");
      void beginUpload(nextCandidate);
    } catch (error) {
      console.error("[ResumeUploadModal] Native picker error", error);
      handleUploadError("Failed to open document picker. Please try again.");
      setStatus("idle");
    }
  }, [beginUpload, handleUploadError, validateFileSize]);

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Import Resume"
      size="md"
    >
      <Stack gap={namedSpacing.md}>
        <Paragraph color={colors.text[theme].secondary}>
          Upload a PDF or Word document under 1MB. We'll extract your
          experience, education, skills, and preferences so you can confirm the
          details before saving them to your profile.
        </Paragraph>

        {Platform.OS === "web" ? (
          <FileUpload
            accept={ACCEPTED_EXTENSIONS}
            maxSize={MAX_FILE_BYTES}
            label="Upload resume"
            helperText="Accepted formats: PDF, DOC, DOCX (max 1MB)"
            emptyMessage="Drag & drop or browse to import your resume."
            onFilesSelected={(files) => {
              const file = files[0];
              if (file) {
                handleWebFileSelect(file);
              }
            }}
            onFileRemove={() => {
              uploadSequenceRef.current += 1;
              activeCandidateRef.current = null;
              setStatus("idle");
              setErrorMessage(null);
              setFileName(null);
            }}
            disabled={status === "uploading" || status === "parsing"}
            error={status === "error" ? errorMessage ?? undefined : undefined}
          />
        ) : (
          <Stack gap={namedSpacing.sm}>
            <Button
              size="md"
              iconStart={UploadCloud}
              disabled={status === "uploading" || status === "parsing"}
              onPress={handleNativePick}
            >
              Choose File
            </Button>
            {fileName ? (
              <Text color={colors.text[theme].secondary}>Selected file: {fileName}</Text>
            ) : (
              <Text color={colors.text[theme].secondary}>
                Supported formats: PDF, DOC, DOCX. Maximum size: 1MB.
              </Text>
            )}
            {status === "error" && errorMessage ? (
              <Row gap={8} align="center">
                <AlertCircle color={colors.fg[theme].error} size={18} />
                <Text color={colors.fg[theme].error}>{errorMessage}</Text>
              </Row>
            ) : null}
          </Stack>
        )}

        {shouldShowProgressIndicators && progressValue > 0 && (
          <Stack
            gap={8}
            backgroundColor={colors.bg[theme].subtle}
            padding="sm"
            borderRadius={12}
          >
            <Stack
              height={8}
              backgroundColor={colors.bg[theme].emphasis}
              borderRadius={16}
              style={{ overflow: "hidden" }}
            >
              <Stack
                height="100%"
                width={`${Math.round(progressValue * 100)}%`}
                backgroundColor={progressColor}
              />
            </Stack>
            <Row gap={8} align="center">
              {status === "success" ? (
                <CheckCircle2 color={colors.fg[theme].success} size={18} />
              ) : status === "error" ? (
                <AlertCircle color={colors.fg[theme].error} size={18} />
              ) : (
                <Spinner variant="ios" size="sm" color="primary" />
              )}
              <Text color={status === "error" ? colors.error[600] : colors.text[theme].primary}>
                {progressLabel ?? "Processing resume..."}
              </Text>
            </Row>
          </Stack>
        )}

        {status === "success" && (
          <Row
            gap={12}
            align="center"
            backgroundColor={colors.success[50]}
            padding="sm"
            borderRadius={12}
          >
            <CheckCircle2 color={colors.fg[theme].success} size={24} />
            <Text color={colors.success[600]}>
              Resume uploaded successfully. Redirecting...
            </Text>
          </Row>
        )}

        {status === "error" && errorMessage && (
          <Row
            gap={12}
            align="center"
            backgroundColor={colors.error[50]}
            padding="sm"
            borderRadius={12}
          >
            <AlertCircle color={colors.fg[theme].error} size={24} />
            <Text color={colors.error[600]}>{errorMessage}</Text>
          </Row>
        )}

        <Row gap={8} justify="flex-end">
          <Button
            size="sm"
            variant="outline"
            disabled={showProgress}
            onPress={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled
            iconStart={showProgress ? Loader2 : undefined}
            color={status === "error" ? "error" : "primary"}
            variant="outline"
          >
            {showProgress
              ? "Working..."
              : status === "error"
              ? "Upload Failed"
              : "Waiting for file"}
          </Button>
        </Row>
      </Stack>
    </ResponsiveModal>
  );
}

function guessMimeTypeFromName(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "doc") {
    return "application/msword";
  }
  if (extension === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return "application/pdf";
}

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  if (typeof btoa === "function") {
    return `data:${file.type || guessMimeTypeFromName(file.name)};base64,${btoa(
      binary
    )}`;
  }

  const maybeBuffer = (globalThis as Record<string, unknown>).Buffer as
    | { from(input: Uint8Array): { toString(encoding: "base64"): string } }
    | undefined;
  if (maybeBuffer) {
    return `data:${
      file.type || guessMimeTypeFromName(file.name)
    };base64,${maybeBuffer.from(bytes).toString("base64")}`;
  }

  throw new Error("Unable to encode file data.");
}
