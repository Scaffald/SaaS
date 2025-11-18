import { useCallback, useState } from "react";
import { api } from "@app/core/utils/api";
import type { ApplicationStatus } from "../../mock-data/ats-mock-data";

// Map UI status to database status
const STATUS_MAP: Record<ApplicationStatus, string> = {
  new: "pending",
  screen: "reviewing",
  inquired: "inquired",
  interview: "interview",
  offer: "offer",
  hired: "hired",
  rejected: "rejected",
};

interface StatusChangeParams {
  applicationId: string;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
  reason?: string;
}

interface UseApplicationStatusChangeReturn {
  changeStatus: (params: StatusChangeParams) => Promise<void>;
  isChanging: boolean;
  error: Error | null;
  pendingChange: StatusChangeParams | null;
  setPendingChange: (params: StatusChangeParams | null) => void;
  confirmChange: (reason?: string) => Promise<void>;
  cancelChange: () => void;
}

export const useApplicationStatusChange =
  (): UseApplicationStatusChangeReturn => {
    const [isChanging, setIsChanging] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [pendingChange, setPendingChange] = useState<
      StatusChangeParams | null
    >(null);

    const utils = api.useUtils();
    const updateMutation = api.applications.update.useMutation({
      onSuccess: () => {
        // Invalidate applications query to refetch
        utils.applications.getUserApplications.invalidate();
      },
      onError: (err: Error) => {
        setError(err);
      },
      onSettled: () => {
        setIsChanging(false);
      },
    });

    const isCriticalChange = useCallback(
      (toStatus: ApplicationStatus): boolean => {
        return toStatus === "rejected" || toStatus === "hired";
      },
      [],
    );

    const isValidTransition = useCallback(
      (from: ApplicationStatus, to: ApplicationStatus): boolean => {
        // Define valid transitions
        const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> =
          {
            new: ["screen", "rejected"],
            screen: ["inquired", "interview", "rejected"],
            inquired: ["interview", "offer", "rejected"],
            interview: ["offer", "rejected"],
            offer: ["hired", "rejected"],
            hired: [], // Terminal state
            rejected: [], // Terminal state
          };

        return validTransitions[from]?.includes(to) || false;
      },
      [],
    );

    const changeStatus = useCallback(
      async (params: StatusChangeParams) => {
        const { applicationId, fromStatus, toStatus } = params;

        // Validate transition
        if (!isValidTransition(fromStatus, toStatus)) {
          setError(
            new Error(`Invalid transition from ${fromStatus} to ${toStatus}`),
          );
          return;
        }

        // If critical change, show confirmation modal
        if (isCriticalChange(toStatus)) {
          setPendingChange(params);
          return;
        }

        // Otherwise, proceed immediately
        setIsChanging(true);
        setError(null);

        try {
          await updateMutation.mutateAsync({
            application_id: applicationId,
            status: STATUS_MAP[toStatus] as
              | "pending"
              | "reviewing"
              | "inquired"
              | "interview"
              | "offer"
              | "hired"
              | "rejected"
              | "withdrawn",
          });
        } catch (err) {
          setError(err as Error);
        }
      },
      [isValidTransition, isCriticalChange, updateMutation],
    );

    const confirmChange = useCallback(
      async (_reason?: string) => {
        if (!pendingChange) return;

        setIsChanging(true);
        setError(null);

        try {
          await updateMutation.mutateAsync({
            application_id: pendingChange.applicationId,
            status: STATUS_MAP[pendingChange.toStatus] as
              | "pending"
              | "reviewing"
              | "interview"
              | "offer"
              | "hired"
              | "rejected"
              | "withdrawn",
            // Note: The current tRPC schema doesn't include a reason field
            // This would need to be added to the database schema if required
          });

          setPendingChange(null);
        } catch (err) {
          setError(err as Error);
        }
      },
      [pendingChange, updateMutation],
    );

    const cancelChange = useCallback(() => {
      setPendingChange(null);
    }, []);

    return {
      changeStatus,
      isChanging,
      error,
      pendingChange,
      setPendingChange,
      confirmChange,
      cancelChange,
    };
  };
