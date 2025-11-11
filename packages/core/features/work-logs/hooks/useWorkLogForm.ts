import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNetInfo } from "@react-native-community/netinfo";
import { useToastController } from "@tamagui/toast";

import { api } from "@app/core/utils/api";
import { useWorkLogLocation } from "@app/core/utils/location/useWorkLogLocation";

import {
  type CreateWorkLogInput,
  type UpdateWorkLogInput,
  createWorkLogSchema,
  hasTimeEntriesOverlap,
} from "../schemas";
import { useOfflineWorkLogs } from "./useOfflineWorkLogs";
import type { OfflineWorkLog } from "../types/offline";

const DEFAULT_TIME_ENTRY = {
  start: "",
  end: "",
};

const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateTotalHours = (entries: Array<{ start: string; end: string }>): number => {
  return entries.reduce((total, entry) => {
    const [startHour, startMinute] = entry.start.split(":").map(Number);
    const [endHour, endMinute] = entry.end.split(":").map(Number);

    if (
      Number.isNaN(startHour) ||
      Number.isNaN(startMinute) ||
      Number.isNaN(endHour) ||
      Number.isNaN(endMinute)
    ) {
      return total;
    }

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (endMinutes <= startMinutes) {
      return total;
    }

    return total + (endMinutes - startMinutes) / 60;
  }, 0);
};

const buildUpdatePayloadFromCreate = (
  input: CreateWorkLogInput,
): UpdateWorkLogInput["payload"] => {
  return {
    entryType: input.entryType,
    logDate: input.logDate,
    timeEntries: input.timeEntries,
    workDescription: input.workDescription,
    tasksCompleted: input.tasksCompleted,
    skillsUsed: input.skillsUsed,
    visibility: input.visibility,
    showOnProfile: input.showOnProfile,
    showDateRangeOnProfile: input.showDateRangeOnProfile,
    gpsCapture: input.gpsCapture,
  };
};

export interface UseWorkLogFormOptions {
  /**
   * Seed values for the form (e.g. editing an existing work log draft)
   */
  initialValues?: Partial<CreateWorkLogInput>;
  /**
   * Existing work log identifier (when editing a saved record)
   */
  workLogId?: string | null;
  /**
   * Automatically persist changes (defaults to true)
   */
  autoSaveEnabled?: boolean;
  /**
   * Callback executed after successful submission
   */
  onSubmitSuccess?: (workLogId: string) => void;
}

export type AutoSaveStatus =
  | { state: "idle"; message?: string | null }
  | { state: "saving"; message?: string | null }
  | { state: "saved"; message?: string | null; savedAt: string }
  | { state: "error"; message: string }
  | { state: "invalid"; message?: string | null };

export interface UseWorkLogFormReturn {
  form: ReturnType<typeof useForm<CreateWorkLogInput>>;
  timeEntryFields: ReturnType<
    typeof useFieldArray<CreateWorkLogInput, "timeEntries">
  >["fields"];
  addTimeEntry: () => void;
  removeTimeEntry: (index: number) => void;
  totalHours: number;
  overlapDetected: boolean;
  autoSaveStatus: AutoSaveStatus;
  submit: () => Promise<void>;
  isSubmitting: boolean;
  workLogId: string | null;
  location: ReturnType<typeof useWorkLogLocation>;
  captureLocation: () => Promise<void>;
  projectOptionsQuery: ReturnType<typeof api.workLogs.getProjectOptions.useQuery>;
  organizationFilter: string | null;
  setOrganizationFilter: (organizationId: string | null) => void;
  skillsQuery: ReturnType<typeof api.profile.skills.getUserSkills.useQuery>;
  pendingOfflineDraft: OfflineWorkLog | null;
}

export const useWorkLogForm = ({
  initialValues,
  workLogId: initialWorkLogId = null,
  autoSaveEnabled = true,
  onSubmitSuccess,
}: UseWorkLogFormOptions = {}): UseWorkLogFormReturn => {
  const toast = useToastController();
  const netInfo = useNetInfo();
  const isOnline =
    netInfo.isConnected !== false && netInfo.isInternetReachable !== false;

  const [workLogId, setWorkLogId] = useState<string | null>(initialWorkLogId);
  const [offlineDraftId, setOfflineDraftId] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({
    state: "idle",
  });
  const [organizationFilter, setOrganizationFilter] = useState<string | null>(
    null,
  );

  const lastSavedPayloadRef = useRef<CreateWorkLogInput | null>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  const defaultValues: CreateWorkLogInput = {
    projectId: initialValues?.projectId ?? "",
    entryType: initialValues?.entryType ?? "daily",
    logDate:
      initialValues?.logDate ?? formatDateToISO(new Date()),
    timeEntries:
      initialValues?.timeEntries && initialValues.timeEntries.length > 0
        ? initialValues.timeEntries
        : [DEFAULT_TIME_ENTRY],
    workDescription: initialValues?.workDescription ?? "",
    tasksCompleted: initialValues?.tasksCompleted ?? [],
    skillsUsed: initialValues?.skillsUsed ?? [],
    visibility: initialValues?.visibility ?? "private",
    showOnProfile: initialValues?.showOnProfile ?? false,
    showDateRangeOnProfile: initialValues?.showDateRangeOnProfile ?? false,
    gpsCapture: initialValues?.gpsCapture,
  };

  const form = useForm<CreateWorkLogInput>({
    resolver: zodResolver(createWorkLogSchema),
    defaultValues,
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  const timeEntriesArray = useFieldArray({
    control,
    name: "timeEntries",
  });

  const watchedValues = useWatch({
    control,
  });

  const sanitizedTimeEntries = useMemo(
    () =>
      (watchedValues.timeEntries ?? []).filter(
        (entry): entry is { start: string; end: string } =>
          typeof entry?.start === "string" && typeof entry?.end === "string",
      ),
    [watchedValues.timeEntries],
  );

  const totalHours = useMemo(
    () => calculateTotalHours(sanitizedTimeEntries),
    [sanitizedTimeEntries],
  );

  const overlapDetected = useMemo(() => {
    if (sanitizedTimeEntries.length < 2) {
      return false;
    }
    return hasTimeEntriesOverlap(sanitizedTimeEntries);
  }, [sanitizedTimeEntries]);

  const projectOptionsQuery = api.workLogs.getProjectOptions.useQuery(
    organizationFilter ? { organizationId: organizationFilter } : undefined,
    {
      staleTime: 30_000,
    },
  );

  const skillsQuery = api.profile.skills.getUserSkills.useQuery(undefined, {
    staleTime: 60 * 1000,
  });

  const {
    queueWorkLog,
    mutateOfflineWorkLog,
    markWorkLogForSync,
    offlineWorkLogs,
  } = useOfflineWorkLogs();

  const location = useWorkLogLocation();

  const pendingOfflineDraft = useMemo(() => {
    if (!offlineDraftId) {
      return null;
    }

    return offlineWorkLogs.find((draft) => draft.id === offlineDraftId) ?? null;
  }, [offlineDraftId, offlineWorkLogs]);

  const buildCreatePayload = useCallback((): CreateWorkLogInput | null => {
    const parseResult = createWorkLogSchema.safeParse(form.getValues());
    if (!parseResult.success) {
      setAutoSaveStatus({
        state: "invalid",
        message: parseResult.error.issues[0]?.message ?? "Please complete the required fields.",
      });
      return null;
    }
    return parseResult.data;
  }, [form]);

  const createWorkLogMutation = api.workLogs.create.useMutation({
    onError: (error: Error) => {
      setAutoSaveStatus({
        state: "error",
        message: error.message ?? "Failed to save work log draft.",
      });
    },
  });

  const updateWorkLogMutation = api.workLogs.update.useMutation({
    onError: (error: Error) => {
      setAutoSaveStatus({
        state: "error",
        message: error.message ?? "Failed to update work log draft.",
      });
    },
  });

  const performAutoSave = useCallback(
    async (payload: CreateWorkLogInput) => {
      if (isSavingRef.current) {
        return;
      }

      const previousPayload = lastSavedPayloadRef.current;
      if (previousPayload && JSON.stringify(previousPayload) === JSON.stringify(payload)) {
        return;
      }

      isSavingRef.current = true;
      setAutoSaveStatus({ state: "saving" });

      try {
        if (!isOnline) {
          const offlinePayload = workLogId
            ? ({
                kind: "update" as const,
                input: {
                  workLogId,
                  payload: buildUpdatePayloadFromCreate(payload),
                },
              })
            : ({
                kind: "create" as const,
                input: payload,
              });

          if (offlineDraftId) {
            await mutateOfflineWorkLog(offlineDraftId, (current) => ({
              ...current,
              payload: offlinePayload,
              syncStatus: "pending",
              lastError: null,
            }));
            await markWorkLogForSync(offlineDraftId, "queued");
          } else {
            const draft = await queueWorkLog({
              payload: offlinePayload,
              initialStatus: "pending",
            });
            setOfflineDraftId(draft.id);
          }

          const savedAt = new Date().toISOString();
          setAutoSaveStatus({
            state: "saved",
            message: "Draft saved offline",
            savedAt,
          });
          lastSavedPayloadRef.current = payload;
          return;
        }

        if (!workLogId) {
          const created = await createWorkLogMutation.mutateAsync(payload);
          if (created?.id) {
            setWorkLogId(created.id);
          }
        } else {
          await updateWorkLogMutation.mutateAsync({
            workLogId,
            payload: buildUpdatePayloadFromCreate(payload),
          });
        }

        const savedAt = new Date().toISOString();
        setAutoSaveStatus({
          state: "saved",
          message: "Draft saved",
          savedAt,
        });
        lastSavedPayloadRef.current = payload;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to auto-save work log.";
        setAutoSaveStatus({ state: "error", message });

        if (!isOnline && payload) {
          // fallback to offline queue to prevent data loss
          try {
            const offlinePayload = workLogId
              ? ({
                  kind: "update" as const,
                  input: {
                    workLogId,
                    payload: buildUpdatePayloadFromCreate(payload),
                  },
                })
              : ({
                  kind: "create" as const,
                  input: payload,
                });

            const draft = await queueWorkLog({
              payload: offlinePayload,
              initialStatus: "pending",
            });
            setOfflineDraftId(draft.id);
          } catch (queueError) {
            console.error("[useWorkLogForm] Unable to queue offline draft", queueError);
          }
        }
      } finally {
        isSavingRef.current = false;
      }
    },
    [
      isOnline,
      workLogId,
      offlineDraftId,
      createWorkLogMutation,
      updateWorkLogMutation,
      queueWorkLog,
      mutateOfflineWorkLog,
      markWorkLogForSync,
    ],
  );

  useEffect(() => {
    if (!autoSaveEnabled) {
      return;
    }

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      const payload = buildCreatePayload();
      if (!payload) {
        return;
      }

      void performAutoSave(payload);
    }, 500);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [autoSaveEnabled, watchedValues, buildCreatePayload, performAutoSave]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const addTimeEntry = useCallback(() => {
    timeEntriesArray.append(DEFAULT_TIME_ENTRY);
  }, [timeEntriesArray]);

  const removeTimeEntry = useCallback(
    (index: number) => {
      if (timeEntriesArray.fields.length <= 1) {
        return;
      }
      timeEntriesArray.remove(index);
    },
    [timeEntriesArray],
  );

  const submitHandler = handleSubmit(async (values) => {
    const payload = createWorkLogSchema.safeParse(values);
    if (!payload.success) {
      toast.show("Unable to submit", {
        message: payload.error.issues[0]?.message ?? "Please resolve validation errors and try again.",
        type: "error",
      });
      setAutoSaveStatus({
        state: "invalid",
        message:
          payload.error.issues[0]?.message ?? "Please resolve validation errors and try again.",
      });
      return;
    }

    try {
      if (!isOnline) {
        const offlinePayload = workLogId
          ? ({
              kind: "update" as const,
              input: {
                workLogId,
                payload: buildUpdatePayloadFromCreate(payload.data),
              },
            })
          : ({
              kind: "create" as const,
              input: payload.data,
            });

        const draft = await queueWorkLog({
          payload: offlinePayload,
          initialStatus: "pending",
        });
        setOfflineDraftId(draft.id);

        toast.show("Saved offline", {
          message: "You're offline. We'll sync the work log when you're back online.",
          type: "info",
        });
        return;
      }

      let currentId = workLogId;
      if (!currentId) {
        const created = await createWorkLogMutation.mutateAsync(payload.data);
        currentId = created?.id ?? null;
        if (created?.id) {
          setWorkLogId(created.id);
        }
      } else {
        await updateWorkLogMutation.mutateAsync({
          workLogId: currentId,
          payload: buildUpdatePayloadFromCreate(payload.data),
        });
      }

      if (currentId) {
        onSubmitSuccess?.(currentId);
      }

      toast.show("Work Log Saved", {
        message: "Your work log draft has been saved successfully.",
        type: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save work log.";
      toast.show("Save Failed", {
        message,
        type: "error",
      });
      setAutoSaveStatus({
        state: "error",
        message,
      });
    }
  });

  const submit = useCallback(() => submitHandler(), [submitHandler]);

  const captureLocation = useCallback(async () => {
    const result = await location.requestLocation();
    if (!result) {
      toast.show("Location", {
        message: "Unable to capture location. Check permissions and try again.",
        type: "error",
      });
      return;
    }

    form.setValue("gpsCapture", {
      latitude: result.latitude,
      longitude: result.longitude,
      accuracyMeters: result.accuracyMeters ?? undefined,
      capturedAt: result.capturedAt ?? undefined,
      deviceType: result.deviceType ?? undefined,
      permissionStatus: result.permissionStatus ?? undefined,
    });
  }, [form, location, toast]);

  return {
    form,
    timeEntryFields: timeEntriesArray.fields,
    addTimeEntry,
    removeTimeEntry,
    totalHours,
    overlapDetected,
    autoSaveStatus,
    submit,
    isSubmitting,
    workLogId,
    location,
    captureLocation,
    projectOptionsQuery,
    organizationFilter,
    setOrganizationFilter,
    skillsQuery,
    pendingOfflineDraft,
  };
};

