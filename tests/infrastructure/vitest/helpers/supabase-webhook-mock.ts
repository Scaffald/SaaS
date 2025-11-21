import type {
  PaymentTransactionRow,
  StripeSettingsRow,
  StripeWebhookSupabaseClient,
} from "../../../packages/supabase/functions/stripe-webhook/handler";

type StripeWebhookMockConfig = {
  stripeSettings?: Partial<StripeSettingsRow>;
  secrets?: Record<string, string>;
  transactions?: PaymentTransactionRow[];
};

function cloneTransaction(row: PaymentTransactionRow): PaymentTransactionRow {
  return {
    ...row,
    metadata: row.metadata ? { ...row.metadata } : null,
  };
}

export function createStripeWebhookSupabaseMock(config: StripeWebhookMockConfig = {}) {
  const stripeSettings: StripeSettingsRow = {
    api_key_secret_id: null,
    webhook_secret_id: null,
    ...config.stripeSettings,
  };

  const secrets = { ...config.secrets };
  const paymentTransactions = new Map<string, PaymentTransactionRow>();

  for (const row of config.transactions ?? []) {
    paymentTransactions.set(row.id, cloneTransaction(row));
  }

  type SchemaApi = ReturnType<StripeWebhookSupabaseClient["schema"]>;

  const client: StripeWebhookSupabaseClient = {
    schema(schemaName: string) {
      if (schemaName !== "core") {
        throw new Error(`Unsupported schema requested: ${schemaName}`);
      }

      const schemaApi: SchemaApi = {
        from(table: "stripe_settings" | "payment_transactions") {
          if (table === "stripe_settings") {
            return {
              select() {
                const result = { data: { ...stripeSettings }, error: null };
                return {
                  eq() {
                    return {
                      async maybeSingle() {
                        return result;
                      },
                    };
                  },
                };
              },
            };
          }

          return {
            select() {
              return {
                eq(_column: string, value: unknown) {
                  const intentId = String(value);
                  const existing = [...paymentTransactions.values()].find(
                    (row) => row.stripe_payment_intent_id === intentId,
                  );
                  const result = { data: existing ? cloneTransaction(existing) : null, error: null };
                  return {
                    async maybeSingle() {
                      return result;
                    },
                  };
                },
              };
            },
            update(values: Record<string, unknown>) {
              return {
                async eq(_column: string, id: unknown) {
                  const existing = paymentTransactions.get(String(id));
                  if (existing) {
                    paymentTransactions.set(String(id), {
                      ...existing,
                      ...values,
                      metadata: (values.metadata as Record<string, unknown> | null | undefined) ?? existing.metadata,
                    });
                  }

                  return { error: null };
                },
              };
            },
          };
        },
        rpc(functionName: string, payload: Record<string, unknown>) {
          if (functionName !== "get_secret_value") {
            return Promise.resolve({ data: null, error: { message: `Unknown RPC: ${functionName}` } });
          }

          const id = String(payload.p_secret_id ?? "");
          return Promise.resolve({ data: secrets[id] ?? null, error: null });
        },
      };

      return schemaApi;
    },
  };

  function getTransaction(id: string) {
    const row = paymentTransactions.get(id);
    return row ? cloneTransaction(row) : null;
  }

  return { client, getTransaction };
}
