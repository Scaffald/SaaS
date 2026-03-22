import {
  Button,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { PaymentIntent, StripeElementsOptions } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMemo, useState } from "react";
import { Card } from "@scaffald/ui";

import { useStripeConfig } from "../../hooks/useStripeConfig";

type PaymentIntentFormProps = {
  clientSecret: string;
  amountCents: number;
  description?: string;
  submitLabel?: string;
  onSuccess: (
    paymentIntentId: string,
    intent?: PaymentIntent | null
  ) => void | Promise<void>;
  disabled?: boolean;
};

export function PaymentIntentForm(props: PaymentIntentFormProps) {
  const { theme } = useThemeContext();
  const { clientSecret, amountCents } = props;
  const config = useStripeConfig(Boolean(clientSecret));

  const stripePromise = useMemo(() => {
    if (!config.publishableKey) return null;
    return loadStripe(config.publishableKey);
  }, [config.publishableKey]);

  const options: StripeElementsOptions | null = useMemo(() => {
    if (!clientSecret) return null;
    return {
      clientSecret,
      appearance: {
        theme: "flat",
        labels: "floating",
        variables: {
          colorText: "hsl(206,6%,25%)",
          colorDanger: "hsl(359,72%,55%)",
          borderRadius: "8px",
        },
      },
    };
  }, [clientSecret]);

  if (config.isLoading || !options || !stripePromise) {
    return (
      <Card
        padding="sm"
        style={{
          backgroundColor: colors.bg[theme].subtle,
          borderColor: colors.border[theme].default,
        }}
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
          borderColor:
            theme === "light" ? colors.error[300] : colors.error[700],
        }}
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

  return (
    <Elements key={clientSecret} stripe={stripePromise} options={options}>
      <PaymentIntentFormInner
        {...props}
        amountCents={amountCents}
        testMode={config.testMode}
      />
    </Elements>
  );
}

type InnerProps = PaymentIntentFormProps & {
  testMode: boolean;
};

function PaymentIntentFormInner({
  amountCents,
  description,
  submitLabel = "Pay now",
  onSuccess,
  disabled,
  testMode,
}: InnerProps) {
  const { theme } = useThemeContext();
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }),
    []
  );

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message ?? "Unable to confirm payment. Try again.");
      setIsSubmitting(false);
      return;
    }

    if (
      paymentIntent &&
      (paymentIntent.status === "succeeded" ||
        paymentIntent.status === "processing")
    ) {
      await onSuccess(paymentIntent.id, paymentIntent);
    } else {
      setErrorMessage("Payment did not complete. Please try again.");
      setIsSubmitting(false);
    }
  };

  const amountLabel = currencyFormatter.format(amountCents / 100);

  return (
    <Card
      padding="md"
      style={{ borderColor: colors.border[theme].default }}
      borderWidth={1}
    >
      <Stack gap={12}>
        <Stack gap={4}>
          <Row justify="space-between" align="center">
            <Text>Charge amount</Text>
            <Text>{amountLabel}</Text>
          </Row>
          {description ? (
            <Text style={{ color: colors.text[theme].secondary }}>
              {description}
            </Text>
          ) : null}
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
              borderColor:
                theme === "light" ? colors.error[300] : colors.error[700],
            }}
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

        <Button
          size="md"
          color="primary"
          disabled={disabled || isSubmitting || !stripe || !elements}
          onPress={handleSubmit}
        >
          {isSubmitting ? (
            <Row gap={8} align="center">
              <Spinner variant="ios" size="sm" color="gray" />
              <Text>Processing…</Text>
            </Row>
          ) : (
            submitLabel
          )}
        </Button>
      </Stack>
    </Card>
  );
}
