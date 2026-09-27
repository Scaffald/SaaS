import {
  useAccountCredits,
  useCreditLedger,
} from "@scf/core/utils/payments-sdk-hooks";
import type { CreditLedgerEntry } from "@scaffald/sdk";
import { DollarSign } from "lucide-react-native";
import { useThemeContext } from "@scaffald/ui";
import { Card, Spinner, Text, Row, Stack } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

/**
 * Account credits, read-only.
 *
 * This panel used to offer "Add Credits" — an amount field and a
 * "Continue to Payment" button calling `depositCredits`. That endpoint creates
 * a real Stripe PaymentIntent and, with a saved card, charges it immediately
 * (`confirm: Boolean(paymentMethodId)`, api/routes/payments.ts). What it never
 * did was issue any credit: both credit-table usages in the deployed api are
 * `.select()`, `stripe-webhook` only flips `payment_transactions.status`, and
 * the sole code that writes `account_credits` / `credit_ledger` lives in the
 * legacy, undeployed trpc router. The panel then showed "Your account credits
 * have been updated successfully" against a balance that had not moved.
 *
 * The client half was never finished either — `_handleDepositSubmit` was
 * declared, left as a comment saying the webhook would handle it, and never
 * referenced by anything.
 *
 * So the affordance is gone rather than left to take money for nothing (#928).
 * Reading the balance and the ledger works, and is kept.
 *
 * To restore deposits, the crediting has to exist first: port it from
 * trpc/routers/payments.router.ts into the deployed api and fire it on a
 * CONFIRMED payment, not at intent creation. `depositCredits` is deliberately
 * left in the SDK and the API — nothing about the server contract changes
 * here, only that this screen stops inviting it.
 */
type OrganizationCreditsPanelProps = {
  organizationId: string;
};

const formatCurrency = (cents: number, currency = "usd"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
};

export function OrganizationCreditsPanel({
  organizationId,
}: OrganizationCreditsPanelProps) {
  const { theme } = useThemeContext();

  const creditsQuery = useAccountCredits(organizationId);

  const ledgerQuery = useCreditLedger({ organizationId, limit: 10 });

  const credits = creditsQuery.data;
  const isLoading = creditsQuery.isLoading;

  if (isLoading) {
    return (
      <Card bordered padding="md">
        <Stack gap={12} align="center" paddingVertical={16}>
          <Spinner variant="ios" size="lg" />
          <Text style={{ color: colors.text[theme].secondary }}>
            Loading account credits…
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Card bordered padding="md">
      <Stack gap={12}>
        <Row justify="space-between" align="center">
          <Stack flex={1} minWidth={0}>
            <Text>Account Credits</Text>
            <Text style={{ color: colors.text[theme].secondary }}>
              Pre-funded balance for automatic payments
            </Text>
          </Stack>
        </Row>

        {/* Balance Display */}
        <Card
          padding="md"
          style={{ backgroundColor: colors.bg[theme].subtle }}
          borderColor={colors.border[theme].default}
          borderWidth={1}
        >
          <Row gap={12} align="center">
            <DollarSign
              size={32}
              color={theme === "light" ? colors.green[700] : colors.green[300]}
            />
            <Stack flex={1}>
              <Text style={{ color: colors.text[theme].secondary }}>
                Current Balance
              </Text>
              <Text
                style={{
                  color:
                    theme === "light" ? colors.green[700] : colors.green[300],
                }}
              >
                {formatCurrency(credits?.balanceCents ?? 0, credits?.currency)}
              </Text>
            </Stack>
          </Row>
        </Card>

          {/* Recent Transactions */}
          {ledgerQuery.data && ledgerQuery.data.items.length > 0 && (
            <Stack gap={8}>
              <Text>Recent Transactions</Text>
              <Stack gap={4}>
                {ledgerQuery.data.items
                  .slice(0, 5)
                  .map((entry: CreditLedgerEntry) => (
                    <Row
                      key={entry.id}
                      justify="space-between"
                      align="center"
                      padding="xs"
                      style={{ backgroundColor: colors.bg[theme].subtle }}
                      borderRadius={8}
                    >
                      <Stack flex={1}>
                        <Text>
                          {entry.description ?? entry.transactionType}
                        </Text>
                        <Text style={{ color: colors.text[theme].secondary }}>
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </Text>
                      </Stack>
                      <Text
                        style={{
                          color:
                            entry.direction === "credit"
                              ? theme === "light"
                                ? colors.green[700]
                                : colors.green[300]
                              : theme === "light"
                              ? colors.error[700]
                              : colors.error[300],
                        }}
                      >
                        {entry.direction === "credit" ? "+" : "-"}
                        {formatCurrency(
                          entry.amountCents ?? 0,
                          entry.currency ?? "USD"
                        )}
                      </Text>
                    </Row>
                  ))}
              </Stack>
            </Stack>
          )}
      </Stack>
    </Card>
  );
}
