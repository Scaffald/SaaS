import { useStripeConfig } from "@scf/core/features/payments/hooks/useStripeConfig";
import {
  useCreateSetupIntentMutation,
  useSavePaymentMethodMutation,
} from "@scf/core/utils/payments-sdk-hooks";
import {
  Button,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from "@scaffald/ui";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useToast } from "@scaffald/ui";
import { useMemo, useState } from "react";
import { Card } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

type SetupIntentFormProps = {
  organizationId: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export function SetupIntentForm({
  organizationId,
  onSuccess,
  onCancel,
}: SetupIntentFormProps) {
  const { theme } = useThemeContext();
  const toast = useToast();
  const config = useStripeConfig(true);

  const createSetupIntentMutation = useCreateSetupIntentMutation();

  const stripePromise = useMemo(() => {
    if (!config.publishableKey) return null;
    return loadStripe(config.publishableKey);
  }, [config.publishableKey]);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      const result = await createSetupIntentMutation.mutateAsync(
        organizationId
      );
      setClientSecret(result.clientSecret);
    } catch (error) {
      const _message =
        error instanceof Error
          ? error.message
          : "Failed to initialize payment form";
      toast.show({
        title: "Error",
        message: _message,
        variant: "error",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const options = useMemo(() => {
    if (!clientSecret) return null;
    return {
      clientSecret,
      appearance: {
        theme: "flat" as const,
        labels: "floating" as const,
        variables: {
          colorText: "hsl(206,6%,25%)",
          colorDanger: "hsl(359,72%,55%)",
          borderRadius: "8px",
        },
      },
    };
  }, [clientSecret]);

  if (config.isLoading || !stripePromise) {
    return (
      <Card
        padding="sm"
        style={{ backgroundColor: colors.bg[theme].subtle }}
        borderColor={colors.border[theme].default}
        borderWidth={1}
      >
        <Text style={{ color: colors.text[theme].secondary }}>
          Preparing secure payment form…
        </Text>
      </Card>
    );
  }

  if (!config.publishableKey) {
    return (
      <Card
        padding="sm"
        style={{
          backgroundColor:
            theme === "light" ? colors.error[50] : colors.error[900],
        }}
        borderColor={theme === "light" ? colors.error[300] : colors.error[700]}
        borderWidth={1}
      >
        <Text
          style={{
            color: theme === "light" ? colors.error[700] : colors.error[300],
          }}
        >
          Stripe publishable key is missing. Contact support to configure
          payments.
        </Text>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Stack gap={12}>
        <Text>Add Payment Method</Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          Click the button below to securely add a payment method for this
          organization.
        </Text>
        {config.testMode && (
          <Text
            style={{
              color:
                theme === "light" ? colors.yellow[700] : colors.yellow[300],
            }}
          >
            Stripe test mode is active. Use test card numbers only.
          </Text>
        )}
        <Row gap={8}>
          <Button
            size="md"
            color="primary"
            onPress={handleInitialize}
            disabled={isInitializing}
          >
            {isInitializing ? (
              <Row gap={8} align="center">
                <Spinner size="sm" color="primary" />
                <Text>Initializing…</Text>
              </Row>
            ) : (
              "Continue"
            )}
          </Button>
          <Button size="md" variant="outline" onPress={onCancel}>
            Cancel
          </Button>
        </Row>
      </Stack>
    );
  }

  if (!options) {
    return null;
  }

  return (
    <Elements key={clientSecret} stripe={stripePromise} options={options}>
      <SetupIntentFormInner
        organizationId={organizationId}
        onSuccess={onSuccess}
        onCancel={onCancel}
        testMode={config.testMode}
      />
    </Elements>
  );
}

type InnerProps = SetupIntentFormProps & {
  testMode: boolean;
};

function SetupIntentFormInner({
  organizationId,
  onSuccess,
  onCancel,
  testMode,
}: InnerProps) {
  const { theme } = useThemeContext();
  const stripe = useStripe();
  const elements = useElements();
  const savePaymentMethodMutation = useSavePaymentMethodMutation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message ?? "Unable to confirm setup. Try again.");
      setIsSubmitting(false);
      return;
    }

    if (
      setupIntent &&
      setupIntent.status === "succeeded" &&
      setupIntent.payment_method
    ) {
      try {
        await savePaymentMethodMutation.mutateAsync({
          organizationId,
          paymentMethodId:
            typeof setupIntent.payment_method === "string"
              ? setupIntent.payment_method
              : setupIntent.payment_method.id,
        });
        await onSuccess();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to save payment method";
        setErrorMessage(message);
        setIsSubmitting(false);
      }
    } else {
      setErrorMessage("Setup did not complete. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      padding="md"
      borderColor={colors.border[theme].default}
      borderWidth={1}
    >
      <Stack gap={12}>
        <Stack gap={4}>
          <Text>Add Payment Method</Text>
          {testMode && (
            <Text
              style={{
                color:
                  theme === "light" ? colors.yellow[700] : colors.yellow[300],
              }}
            >
              Stripe test mode is active. Use test card numbers only.
            </Text>
          )}
        </Stack>

        <PaymentElement />

        {errorMessage ? (
          <Card
            padding="sm"
            style={{
              backgroundColor:
                theme === "light" ? colors.error[50] : colors.error[900],
            }}
            borderColor={
              theme === "light" ? colors.error[300] : colors.error[700]
            }
            borderWidth={1}
          >
            <Row gap={8} align="center">
              <Text
                style={{
                  color:
                    theme === "light" ? colors.error[700] : colors.error[300],
                  flex: 1,
                }}
              >
                {errorMessage}
              </Text>
            </Row>
          </Card>
        ) : null}

        <Row gap={8}>
          <Button
            size="md"
            color="primary"
            disabled={isSubmitting || !stripe || !elements}
            onPress={handleSubmit}
            style={{ flex: 1 }}
          >
            {isSubmitting ? (
              <Row gap={8} align="center">
                <Spinner size="sm" color="primary" />
                <Text>Saving…</Text>
              </Row>
            ) : (
              "Save Payment Method"
            )}
          </Button>
          <Button size="md" variant="outline" onPress={onCancel}>
            Cancel
          </Button>
        </Row>
      </Stack>
    </Card>
  );
}
