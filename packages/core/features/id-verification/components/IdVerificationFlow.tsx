import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, ShieldCheck, ShieldQuestion } from "@tamagui/lucide-icons";
import { Button, Card, ScrollView, Spinner, Text, XStack, YStack } from "tamagui";
import { useToastController } from "@tamagui/toast";

import { PaymentIntentForm } from "@app/core/features/payments/components/PaymentIntentForm";
import { api } from "@app/core/utils/api";
import { useUser } from "@app/core/utils/useUser";

type PricingRow = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  metadata?: Record<string, unknown>;
};

type PaymentSession = {
  paymentIntentId: string;
  clientSecret: string;
  amountCents: number;
};

const formatCurrency = (cents?: number | null) => {
  if (typeof cents !== "number") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
};

const formatDuration = (value?: string | null) => {
  if (!value) return null;
  return formatDistanceToNow(new Date(value), { addSuffix: true });
};

export function IdVerificationFlow() {
  const { user } = useUser();
  const toast = useToastController();

  const pricingQuery = api.idVerification.getPricing.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const currentVerificationQuery =
    api.idVerification.getCurrentVerification.useQuery(undefined, {
      staleTime: 60 * 1000,
    });

  const requestVerification = api.idVerification.requestVerification.useMutation();
  const confirmVerification = api.idVerification.confirmVerificationPayment.useMutation();

  const [selectedPricingId, setSelectedPricingId] = useState<string | null>(null);
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const pricingOptions: PricingRow[] = useMemo(() => pricingQuery.data ?? [], [pricingQuery.data]);

  useEffect(() => {
    if (!selectedPricingId && pricingOptions.length > 0) {
      setSelectedPricingId(pricingOptions[0]?.id ?? null);
    }
  }, [pricingOptions, selectedPricingId]);

  useEffect(() => {
    setPaymentSession(null);
    setRequestError(null);
  }, [selectedPricingId]);

  const selectedPricing = pricingOptions.find((row) => row.id === selectedPricingId) ?? null;

  const statusCard = renderStatusCard(currentVerificationQuery);

  const handleCreatePaymentSession = async () => {
    if (!user) {
      toast.show("Sign in required", {
        message: "Please sign in again before starting verification.",
        type: "error",
      });
      return;
    }

    if (!selectedPricing) {
      toast.show("Select a plan", {
        message: "Choose a verification option to continue.",
      });
      return;
    }

    setRequestError(null);

    try {
      const response = await requestVerification.mutateAsync({
        workerUserId: user.id,
        pricingId: selectedPricing.id,
      });
      setPaymentSession(response);
      toast.show("Secure payment ready", {
        message: "Enter your card details below to continue.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start payment. Try again.";
      setRequestError(message);
      toast.show("Payment setup failed", { message, type: "error" });
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      await confirmVerification.mutateAsync({ paymentIntentId });
      toast.show("Verification scheduled", {
        message: "We’re creating your Persona inquiry now.",
      });
      setPaymentSession(null);
      void currentVerificationQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to confirm payment with Stripe.";
      toast.show("Payment confirmation failed", { message, type: "error" });
    }
  };

  return (
    <YStack flex={1} bg="$background">
      <ScrollView flex={1}>
        <YStack gap="$4" px="$4" pb="$8">
          {statusCard}

          <Card p="$4" bordered>
            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="600">
                Why verify your identity?
              </Text>
              <Text color="$color11">
                Verified profiles are highlighted across search, inquiries, and background checks,
                giving organizations confidence that you are who you say you are.
              </Text>
              <YStack gap="$1" mt="$2">
                <Text color="$color11">• Badge displayed on your profile and worker cards</Text>
                <Text color="$color11">• Valid for 6 months with automated reminders</Text>
                <Text color="$color11">• Powered by Persona, the same provider used by banks</Text>
              </YStack>
            </YStack>
          </Card>

          <PricingSection
            pricingOptions={pricingOptions}
            selectedPricingId={selectedPricingId}
            onSelectPlan={setSelectedPricingId}
            isLoading={pricingQuery.isLoading}
          />

          <PaymentSection
            selectedPricing={selectedPricing}
            paymentSession={paymentSession}
            isRequesting={requestVerification.isPending}
            isConfirming={confirmVerification.isPending}
            requestError={requestError}
            onCreateSession={handleCreatePaymentSession}
            onResetSession={() => {
              if (!confirmVerification.isPending) {
                setPaymentSession(null);
                setRequestError(null);
              }
            }}
            onPaymentSuccess={handlePaymentSuccess}
          />

          <Card p="$4" bordered>
            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="600">
                What happens after payment?
              </Text>
              <Text color="$color11">
                We automatically create a Persona inquiry using your Scaffald profile details.
                You’ll receive an email and in-app notification with a secure link to upload your
                government ID and selfie. Most verifications finish within a few minutes.
              </Text>
              <YStack gap="$1">
                <Text color="$color11">1. Complete the Persona flow on web or mobile</Text>
                <Text color="$color11">2. Persona confirms the authenticity of your ID</Text>
                <Text color="$color11">3. Your badge updates instantly across the platform</Text>
              </YStack>
            </YStack>
          </Card>

          <Card p="$4" bordered bg="$blue2" borderColor="$blue6">
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="600" color="$blue12">
                Need help?
              </Text>
              <Text color="$blue11">
                Email support@scaffald.com if you run into issues with Persona, need an invoice, or
                want to request a bulk verification plan for your organization.
              </Text>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  );
}

function renderStatusCard(
  queryReturn: ReturnType<typeof api.idVerification.getCurrentVerification.useQuery>,
) {
  if (queryReturn.isLoading) {
    return (
      <Card p="$4" bordered>
        <YStack gap="$2" items="center">
          <Spinner size="small" />
          <Text color="$color11">Loading your verification badge…</Text>
        </YStack>
      </Card>
    );
  }

  if (queryReturn.isError) {
    return (
      <Card p="$4" bordered bg="$red2" borderColor="$red6">
        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="600" color="$red12">
            Unable to load badge
          </Text>
          <Text color="$red11">
            {queryReturn.error?.message ?? "Please refresh to try loading your verification badge."}
          </Text>
        </YStack>
      </Card>
    );
  }

  const badge = queryReturn.data;
  if (!badge) {
    return (
      <Card p="$4" bordered>
        <YStack gap="$2">
          <XStack gap="$2" items="center">
            <ShieldQuestion size={24} color="$orange10" />
            <Text fontSize="$5" fontWeight="600">
              No verification on file
            </Text>
          </XStack>
          <Text color="$color11">
            Purchase a verification to unlock the “Verified Identity” badge on your profile.
          </Text>
        </YStack>
      </Card>
    );
  }

  const isExpired = badge.badgeStatus === "expired";
  const isRevoked = badge.badgeStatus === "revoked";
  const iconColor = isRevoked ? "$red10" : isExpired ? "$orange10" : "$green10";
  const title =
    badge.badgeStatus === "active"
      ? "Verification active"
      : isExpired
        ? "Verification expired"
        : "Verification revoked";
  const subtitle =
    badge.badgeStatus === "active"
      ? `Valid until ${formatDate(badge.badgeExpiresAt)} (${formatDuration(
          badge.badgeExpiresAt,
        )})`
      : badge.badgeStatus === "expired"
        ? `Expired on ${formatDate(badge.badgeExpiresAt)}`
        : "Contact support to resolve revocation.";

  return (
    <Card p="$4" bordered>
      <YStack gap="$2">
        <XStack gap="$2" items="center">
          <ShieldCheck size={24} color={iconColor} />
          <Text fontSize="$5" fontWeight="600" color={isRevoked ? "$red12" : "$color12"}>
            {title}
          </Text>
        </XStack>
        <Text color="$color11">{subtitle}</Text>
        <Text color="$color10">
          Verified on {formatDate(badge.verifiedAt)} • Level: {badge.verificationLevel ?? "N/A"}
        </Text>
      </YStack>
    </Card>
  );
}

type PricingSectionProps = {
  pricingOptions: PricingRow[];
  selectedPricingId: string | null;
  onSelectPlan: (id: string) => void;
  isLoading: boolean;
};

function PricingSection({
  pricingOptions,
  selectedPricingId,
  onSelectPlan,
  isLoading,
}: PricingSectionProps) {
  if (isLoading) {
    return (
      <Card p="$4" bordered>
        <YStack gap="$2" items="center">
          <Spinner size="small" />
          <Text color="$color11">Loading verification options…</Text>
        </YStack>
      </Card>
    );
  }

  if (pricingOptions.length === 0) {
    return (
      <Card p="$4" bordered bg="$color2" borderColor="$borderColor">
        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            Verification temporarily unavailable
          </Text>
          <Text color="$color11">
            Pricing hasn’t been published yet. Check back soon or contact support@scaffald.com.
          </Text>
        </YStack>
      </Card>
    );
  }

  return (
    <YStack gap="$2">
      <Text fontSize="$5" fontWeight="600">
        Choose a verification option
      </Text>
      <YStack gap="$3">
        {pricingOptions.map((plan) => {
          const isActive = plan.id === selectedPricingId;
          return (
            <Card
              key={plan.id}
              p="$4"
              bordered
              animation="quick"
              bg={isActive ? "$blue2" : "$color1"}
              borderColor={isActive ? "$blue8" : "$borderColor"}
              onPress={() => onSelectPlan(plan.id)}
            >
              <YStack gap="$2">
                <XStack justify="space-between" items="center">
                  <Text fontSize="$4" fontWeight="600">
                    {plan.name}
                  </Text>
                  <Text fontSize="$5" fontWeight="700">
                    {formatCurrency(plan.priceCents)}
                  </Text>
                </XStack>
                {plan.description && (
                  <Text color="$color11" fontSize="$3">
                    {plan.description}
                  </Text>
                )}
                <Button
                  size="$3"
                  theme={isActive ? "blue" : undefined}
                  variant={isActive ? undefined : "outlined"}
                  onPress={() => onSelectPlan(plan.id)}
                >
                  {isActive ? "Selected" : "Select this option"}
                </Button>
              </YStack>
            </Card>
          );
        })}
      </YStack>
    </YStack>
  );
}

type PaymentSectionProps = {
  selectedPricing: PricingRow | null;
  paymentSession: PaymentSession | null;
  isRequesting: boolean;
  isConfirming: boolean;
  requestError: string | null;
  onCreateSession: () => void;
  onResetSession: () => void;
  onPaymentSuccess: (paymentIntentId: string) => void;
};

function PaymentSection({
  selectedPricing,
  paymentSession,
  isRequesting,
  isConfirming,
  requestError,
  onCreateSession,
  onResetSession,
  onPaymentSuccess,
}: PaymentSectionProps) {
  return (
    <YStack gap="$3">
      <YStack gap="$1">
        <Text fontSize="$5" fontWeight="600">
          Secure payment
        </Text>
        <Text color="$color11">
          Charges are non-refundable and processed via Stripe. Your badge will update immediately
          after Persona confirms your identity.
        </Text>
      </YStack>

      {requestError && (
        <YStack gap="$2" p="$3" bg="$red2" borderColor="$red6" borderWidth={1} rounded="$4">
          <XStack gap="$2" items="center">
            <AlertCircle size={18} color="$red11" />
            <Text color="$red11">{requestError}</Text>
          </XStack>
        </YStack>
      )}

      {!paymentSession && (
        <Button
          size="$4"
          theme="blue"
          disabled={!selectedPricing || isRequesting || isConfirming}
          onPress={onCreateSession}
        >
          {isRequesting ? "Preparing secure checkout…" : "Continue to payment"}
        </Button>
      )}

      {paymentSession && (
        <YStack gap="$3">
          <PaymentIntentForm
            clientSecret={paymentSession.clientSecret}
            amountCents={paymentSession.amountCents}
            description={selectedPricing?.name ?? "Identity verification"}
            submitLabel={isConfirming ? "Processing…" : "Pay & verify"}
            disabled={isConfirming}
            onSuccess={onPaymentSuccess}
          />
          <Button
            size="$3"
            variant="outlined"
            disabled={isConfirming}
            onPress={onResetSession}
          >
            Start over
          </Button>
        </YStack>
      )}
    </YStack>
  );
}


