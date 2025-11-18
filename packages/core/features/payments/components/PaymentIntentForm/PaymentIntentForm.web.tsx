import { useMemo, useState } from "react";
import type { StripeElementsOptions, PaymentIntent } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Button, Text, XStack, YStack } from "@app/ui";
import { Card } from "tamagui";

import { useStripeConfig } from "../../hooks/useStripeConfig";

type PaymentIntentFormProps = {
  clientSecret: string;
  amountCents: number;
  description?: string;
  submitLabel?: string;
  onSuccess: (paymentIntentId: string, intent?: PaymentIntent | null) => void | Promise<void>;
  disabled?: boolean;
};

export function PaymentIntentForm(props: PaymentIntentFormProps) {
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
      <Card p="$3" bg="$color2" borderColor="$borderColor" borderWidth={1}>
        <Text fontSize="$3" color="$color11">
          Preparing secure payment form…
        </Text>
      </Card>
    );
  }

  if (!config.publishableKey) {
    return (
      <Card p="$3" bg="$red2" borderColor="$red6" borderWidth={1}>
        <Text color="$red11">
          Stripe publishable key is missing. Contact support to configure payments.
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
    [],
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
      (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")
    ) {
      await onSuccess(paymentIntent.id, paymentIntent);
    } else {
      setErrorMessage("Payment did not complete. Please try again.");
      setIsSubmitting(false);
    }
  };

  const amountLabel = currencyFormatter.format(amountCents / 100);

  return (
    <Card p="$4" borderColor="$borderColor" borderWidth={1} gap="$3">
      <YStack gap="$1">
        <XStack justify="space-between" items="center">
          <Text fontSize="$4" fontWeight="600">
            Charge amount
          </Text>
          <Text fontSize="$5" fontWeight="700">
            {amountLabel}
          </Text>
        </XStack>
        {description ? (
          <Text fontSize="$3" color="$color11">
            {description}
          </Text>
        ) : null}
        {testMode && (
          <Text fontSize="$2" color="$orange11">
            Stripe test mode is active. Use test card numbers only.
          </Text>
        )}
      </YStack>

      <PaymentElement />

      {errorMessage ? (
        <Text color="$red10" fontSize="$3">
          {errorMessage}
        </Text>
      ) : null}

      <Button
        size="$4"
        theme="blue"
        disabled={disabled || isSubmitting || !stripe || !elements}
        onPress={handleSubmit}
      >
        {isSubmitting ? "Processing…" : submitLabel}
      </Button>
    </Card>
  );
}


