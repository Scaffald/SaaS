import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { useScaffaldJobsClient } from "./jobs-sdk-context";
import type {
  PaymentAnalytics,
  TransactionsListParams,
  TransactionsListResponse,
  TransactionExportResponse,
  PaymentMethod,
  SetupIntentResponse,
  SavePaymentMethodParams,
  TransactionReceipt,
  AccountCredits,
  DepositCreditsParams,
  DepositCreditsResponse,
  CreditLedgerResponse,
} from "@scaffald/sdk";

export function usePaymentAnalytics(
  options?: UseQueryOptions<PaymentAnalytics, Error>
) {
  const client = useScaffaldJobsClient();
  return useQuery<PaymentAnalytics, Error>({
    queryKey: ["payments", "analytics"],
    queryFn: async () => {
      if (!client) throw new Error("Missing Scaffald client");
      return client.payments.getAnalytics();
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 60 * 1000,
    ...options,
  });
}

export function usePaymentTransactions(
  params?: TransactionsListParams,
  options?: UseQueryOptions<TransactionsListResponse, Error>
) {
  const client = useScaffaldJobsClient();
  return useQuery<TransactionsListResponse, Error>({
    queryKey: ["payments", "transactions", params],
    queryFn: async () => {
      if (!client) throw new Error("Missing Scaffald client");
      return client.payments.listTransactions(params);
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useExportTransactions(
  params?: TransactionsListParams & { format?: "csv" | "json" },
  options?: UseQueryOptions<TransactionExportResponse, Error>
) {
  const client = useScaffaldJobsClient();
  return useQuery<TransactionExportResponse, Error>({
    queryKey: ["payments", "export", params],
    queryFn: async () => {
      if (!client) throw new Error("Missing Scaffald client");
      return client.payments.exportTransactions(params);
    },
    enabled: false, // Only fetch when explicitly triggered
    ...options,
  });
}

export function usePaymentMethod(
  organizationId: string,
  options?: UseQueryOptions<PaymentMethod | null, Error>
) {
  const client = useScaffaldJobsClient();
  return useQuery<PaymentMethod | null, Error>({
    queryKey: ["payments", "payment-method", organizationId],
    queryFn: async () => {
      if (!client) throw new Error("Missing Scaffald client");
      return client.payments.getPaymentMethod(organizationId);
    },
    enabled: !!client && Boolean(organizationId) && options?.enabled !== false,
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useDeletePaymentMethodMutation(
  options?: UseMutationOptions<{ ok: boolean }, Error, string>
) {
  const client = useScaffaldJobsClient();
  return useMutation<{ ok: boolean }, Error, string>({
    mutationFn: async (methodId) => {
      if (!client) throw new Error("Missing Scaffald client");
      return client.payments.deletePaymentMethod(methodId);
    },
    ...options,
  });
}

export function useCreateSetupIntentMutation(
  options?: UseMutationOptions<SetupIntentResponse, Error, string>
) {
  const client = useScaffaldJobsClient();
  return useMutation<SetupIntentResponse, Error, string>({
    mutationFn: async (organizationId) => {
      if (!client) throw new Error("Missing Scaffald client");
      return client.payments.createSetupIntent(organizationId);
    },
    ...options,
  });
}

export function useSavePaymentMethodMutation(
  options?: UseMutationOptions<PaymentMethod, Error, SavePaymentMethodParams>
) {
  const client = useScaffaldJobsClient();
  return useMutation<PaymentMethod, Error, SavePaymentMethodParams>({
    mutationFn: async (params) => {
      if (!client) throw new Error("Missing Scaffald client");
      return client.payments.savePaymentMethod(params);
    },
    ...options,
  });
}

export function useTransactionReceipt(
  transactionId: string,
  options?: Omit<
    UseQueryOptions<TransactionReceipt, Error>,
    "queryKey" | "queryFn"
  >
) {
  const client = useScaffaldJobsClient();
  return useQuery<TransactionReceipt, Error>({
    queryKey: ["payments", "receipt", transactionId],
    queryFn: async () => {
      if (!client) throw new Error("Missing Scaffald client");
      return client.payments.generateReceipt(transactionId);
    },
    enabled: !!client && Boolean(transactionId) && options?.enabled !== false,
    ...options,
  });
}

export function useAccountCredits(
  organizationId: string,
  options?: UseQueryOptions<AccountCredits, Error>
) {
  const client = useScaffaldJobsClient();
  return useQuery<AccountCredits, Error>({
    queryKey: ["payments", "credits", organizationId],
    queryFn: async () => {
      if (!client) throw new Error("Missing Scaffald client");
      return client.payments.getAccountCredits(organizationId);
    },
    enabled: !!client && Boolean(organizationId) && options?.enabled !== false,
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useDepositCreditsMutation(
  options?: UseMutationOptions<
    DepositCreditsResponse,
    Error,
    DepositCreditsParams
  >
) {
  const client = useScaffaldJobsClient();
  return useMutation<DepositCreditsResponse, Error, DepositCreditsParams>({
    mutationFn: async (params) => {
      if (!client) throw new Error("Missing Scaffald client");
      return client.payments.depositCredits(params);
    },
    ...options,
  });
}

export function useCreditLedger(
  params: {
    organizationId: string;
    limit?: number;
    offset?: number;
    transactionType?: string;
  },
  options?: UseQueryOptions<CreditLedgerResponse, Error>
) {
  const client = useScaffaldJobsClient();
  return useQuery<CreditLedgerResponse, Error>({
    queryKey: ["payments", "credit-ledger", params],
    queryFn: async () => {
      if (!client) throw new Error("Missing Scaffald client");
      return client.payments.getCreditLedger(params);
    },
    enabled:
      !!client && Boolean(params.organizationId) && options?.enabled !== false,
    staleTime: 30 * 1000,
    ...options,
  });
}
