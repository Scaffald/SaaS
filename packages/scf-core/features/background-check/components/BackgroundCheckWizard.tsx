import { useMemo } from "react";
import { Button, ScrollView, Separator, Text, Row, Stack, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

import { useBackgroundCheckForm } from "../hooks/useBackgroundCheckForm";
import { ConsentStep } from "./ConsentStep";
import { DocumentChecklistStep } from "./DocumentChecklistStep";
import { PackageSelectionStep } from "./PackageSelectionStep";
import { PaymentStep } from "./PaymentStep";
import { ProgressIndicator } from "./ProgressIndicator";

export function BackgroundCheckWizard() {
  const {
    steps,
    currentStep,
    currentStepIndex,
    packagesQuery,
    selectedPackage,
    state,
    isSubmitting,
    submitError,
    selectPackage,
    updateConsent,
    upsertDocument,
    removeDocument,
    updatePayment,
    goToStep,
    nextStep,
    previousStep,
    paymentSession,
    createPaymentSession,
    confirmPaymentSession,
    isCreatingPaymentSession,
  } = useBackgroundCheckForm();

  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";

  const requiredDocuments = useMemo(() => {
    const raw = (
      selectedPackage as unknown as
        | { metadata?: { required_documents?: unknown[] } }
        | undefined
    )?.metadata?.required_documents;
    if (Array.isArray(raw)) {
      return raw.map((item) => String(item));
    }
    return [];
  }, [selectedPackage]);

  const renderStepContent = () => {
    switch (currentStep) {
      case "packages":
        return (
          <PackageSelectionStep
            packages={packagesQuery.data}
            selectedPackageId={state.selectedPackageId}
            onSelect={selectPackage}
            isLoading={packagesQuery.isLoading}
            onContinue={() => nextStep()}
          />
        );
      case "consent":
        return (
          <ConsentStep
            consent={state.consent}
            onChange={updateConsent}
            onContinue={() => nextStep()}
          />
        );
      case "documents":
        return (
          <DocumentChecklistStep
            requiredDocuments={requiredDocuments}
            documents={state.documents}
            onToggleDocument={(documentType, provided) => {
              if (provided) {
                upsertDocument({
                  documentType,
                  storagePath: `pending://${documentType}`,
                  fileName: `${documentType}-pending`,
                  mimeType: "application/octet-stream",
                  fileSize: 0,
                });
              } else {
                removeDocument(`pending://${documentType}`);
              }
            }}
            onContinue={() => nextStep()}
          />
        );
      case "payment":
        return (
          <PaymentStep
            payment={state.payment}
            selectedPackage={selectedPackage}
            onUpdatePayment={updatePayment}
            paymentSession={paymentSession}
            isCreatingSession={isCreatingPaymentSession}
            isConfirmingPayment={isSubmitting}
            submitError={submitError}
            onCreatePaymentSession={createPaymentSession}
            onPaymentSuccess={async (paymentIntentId) => {
              await confirmPaymentSession(paymentIntentId);
              goToStep("confirmation");
            }}
          />
        );
      case "confirmation":
        return (
          <Stack gap={16} flex={1}>
            <Stack gap={8}>
              <Text color={colors.text[t].secondary}>Background Check Submitted</Text>
              <Text color={colors.text[t].secondary}>
                We've started your background check request. We'll notify you
                when results are ready.
              </Text>
            </Stack>

            <Stack
              gap={8}
              backgroundColor={colors.bg[t].muted}
              padding="md"
              borderRadius={16}
            >
              <Text color={colors.text[t].secondary}>Summary</Text>
              <Text color={colors.text[t].secondary}>
                Package: {selectedPackage?.display_name ?? "Pending"}
              </Text>
              <Text color={colors.text[t].secondary}>
                Cost: $
                {state.payment.costCents
                  ? (state.payment.costCents / 100).toFixed(2)
                  : "—"}
              </Text>
              <Text color={colors.text[t].secondary}>Payment: {state.payment.paidBy}</Text>
            </Stack>

            <Button
              size="md"
              color="primary"
              onPress={() => goToStep("packages")}
            >
              Start another background check
            </Button>
          </Stack>
        );
      default:
        return null;
    }
  };

  return (
    <Stack flex={1} backgroundColor={colors.bg[t].default}>
      <Stack
        padding="md"
        gap={12}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border[t].default }}
        backgroundColor={colors.bg[t].default}
      >
        <Stack gap={4}>
          <Text color={colors.text[t].secondary}>Initiate Background Check</Text>
          <Text color={colors.text[t].secondary}>
            Complete the steps below to start your background check.
          </Text>
        </Stack>

        <ProgressIndicator steps={steps} currentStep={currentStep} />
      </Stack>

      {submitError && (
        <Stack
          backgroundColor={t === 'dark' ? colors.error[900] : colors.error[50]}
          padding="sm"
          style={{ borderBottomWidth: 1, borderBottomColor: t === 'dark' ? colors.error[400] : colors.error[300] }}
        >
          <Text color={t === 'dark' ? colors.error[300] : colors.error[600]}>
            We couldn't submit your background check: {submitError.message}
          </Text>
        </Stack>
      )}

      <ScrollView style={{ flex: 1 }}>
        <Stack gap={16} flex={1} paddingHorizontal={16} paddingBottom={24}>
          {renderStepContent()}
        </Stack>
      </ScrollView>

      <Separator />

      <Row padding="md" justify="space-between" backgroundColor={colors.bg[t].default}>
        <Button
          size="md"
          disabled={currentStepIndex === 0 || currentStep === "confirmation"}
          onPress={previousStep}
        >
          Back
        </Button>
        {currentStep !== "confirmation" && (
          <Text color={colors.text[t].secondary}>
            Step {currentStepIndex + 1} of {steps.length}
          </Text>
        )}
      </Row>
    </Stack>
  );
}
