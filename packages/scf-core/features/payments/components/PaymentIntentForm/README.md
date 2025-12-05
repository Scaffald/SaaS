# PaymentIntentForm

A reusable React component for collecting payment information using Stripe Payment Intents. This component handles the secure payment form UI, Stripe Elements integration, and payment confirmation flow.

## Features

- **Cross-platform**: Works on web (via Stripe Elements) and native (shows redirect message)
- **Automatic configuration**: Fetches Stripe publishable key from backend via `useStripeConfig`
- **Error handling**: Displays clear error messages for payment failures
- **Loading states**: Shows appropriate loading indicators during initialization
- **Test mode indicator**: Automatically displays when Stripe is in test mode
- **Customizable**: Supports custom submit labels and descriptions

## Usage

### Basic Example

```tsx
import { PaymentIntentForm } from "@app/core/features/payments/components/PaymentIntentForm";

function MyPaymentFlow() {
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const handlePaymentSuccess = async (id: string) => {
    setPaymentIntentId(id);
    // Call your backend to confirm the payment
    await api.payments.confirmPayment.mutate({ paymentIntentId: id });
  };

  if (!clientSecret) {
    return <div>Loading payment form...</div>;
  }

  return (
    <PaymentIntentForm
      clientSecret={clientSecret}
      amountCents={5000} // $50.00
      description="Monthly subscription"
      submitLabel="Subscribe"
      onSuccess={handlePaymentSuccess}
    />
  );
}
```

### With Success Fee Payment

```tsx
import { PaymentIntentForm } from "@app/core/features/payments/components/PaymentIntentForm";
import { api } from "@app/core/utils/api";

function HirePaymentModal({ applicationId, organizationId, workerUserId }) {
  const createSuccessFee = api.successFees.createSuccessFee.useMutation();
  const confirmPayment = api.successFees.confirmUpfrontPayment.useMutation();

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    await confirmPayment.mutateAsync({
      successFeeId: successFeeId,
      paymentIntentId,
    });
  };

  // After creating success fee and getting clientSecret...
  return (
    <PaymentIntentForm
      clientSecret={clientSecret}
      amountCents={upfrontAmountCents}
      description={`Charge ${upfrontPercentage}% upfront success fee`}
      submitLabel="Charge & Confirm Hire"
      onSuccess={handlePaymentSuccess}
      disabled={!legalAccepted}
    />
  );
}
```

### With Background Check Payment

```tsx
import { PaymentIntentForm } from "@app/core/features/payments/components/PaymentIntentForm";

function BackgroundCheckPayment({ backgroundCheckId, paymentIntentId, clientSecret }) {
  const confirmCheck = api.backgroundChecks.confirmCheckPayment.useMutation();

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    await confirmCheck.mutateAsync({
      background_check_id: backgroundCheckId,
      payment_intent_id: paymentIntentId,
    });
  };

  return (
    <PaymentIntentForm
      clientSecret={clientSecret}
      amountCents={packageCostCents}
      description="Background check package"
      submitLabel="Pay & Start Check"
      onSuccess={handlePaymentSuccess}
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `clientSecret` | `string` | Yes | - | Stripe Payment Intent client secret |
| `amountCents` | `number` | Yes | - | Payment amount in cents (e.g., 5000 = $50.00) |
| `description` | `string` | No | - | Optional description shown above payment form |
| `submitLabel` | `string` | No | `"Pay now"` | Custom label for submit button |
| `onSuccess` | `(paymentIntentId: string, intent?: PaymentIntent) => void \| Promise<void>` | Yes | - | Callback when payment succeeds |
| `disabled` | `boolean` | No | `false` | Disables the submit button |

## Platform Support

### Web
- Full Stripe Elements integration
- Secure payment form with card input
- Real-time validation
- 3D Secure support

### Native (iOS/Android)
- Shows redirect message
- Instructs user to complete payment on web
- Displays payment amount

## Error Handling

The component automatically handles:
- Missing Stripe configuration
- Payment confirmation failures
- Network errors
- Invalid payment methods

All errors are displayed inline within the form.

## Testing

See `__tests__/PaymentIntentForm.test.tsx` for test examples. When testing components that use `PaymentIntentForm`, mock the Stripe dependencies:

```tsx
vi.mock("@stripe/stripe-js");
vi.mock("@stripe/react-stripe-js");
vi.mock("@app/core/features/payments/hooks/useStripeConfig");
```

## Related Components

- `useStripeConfig` - Hook for fetching Stripe configuration
- `PaymentIntentForm.web.tsx` - Web-specific implementation
- `PaymentIntentForm.native.tsx` - Native-specific implementation

## See Also

- [Stripe Payment Intents Documentation](https://stripe.com/docs/payments/payment-intents)
- [Stripe Elements Documentation](https://stripe.com/docs/stripe-js/react)

