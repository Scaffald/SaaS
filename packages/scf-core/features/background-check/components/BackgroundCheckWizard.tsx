import { useMemo } from 'react'
import { Button, ScrollView, Separator, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

import { useBackgroundCheckForm } from '../hooks/useBackgroundCheckForm'
import { ConsentStep } from './ConsentStep'
import { DocumentChecklistStep } from './DocumentChecklistStep'
import { PackageSelectionStep } from './PackageSelectionStep'
import { PaymentStep } from './PaymentStep'
import { ProgressIndicator } from './ProgressIndicator'

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
  } = useBackgroundCheckForm()

  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const requiredDocuments = useMemo(() => {
    const raw = (
      selectedPackage as unknown as { metadata?: { required_documents?: unknown[] } } | undefined
    )?.metadata?.required_documents
    if (Array.isArray(raw)) {
      return raw.map((item) => String(item))
    }
    return []
  }, [selectedPackage])

  const renderStepContent = () => {
    switch (currentStep) {
      case 'packages':
        return (
          <PackageSelectionStep
            packages={packagesQuery.data}
            selectedPackageId={state.selectedPackageId}
            onSelect={selectPackage}
            isLoading={packagesQuery.isLoading}
            onContinue={() => nextStep()}
          />
        )
      case 'consent':
        return (
          <ConsentStep
            consent={state.consent}
            onChange={updateConsent}
            onContinue={() => nextStep()}
          />
        )
      case 'documents':
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
                  mimeType: 'application/octet-stream',
                  fileSize: 0,
                })
              } else {
                removeDocument(`pending://${documentType}`)
              }
            }}
            onContinue={() => nextStep()}
          />
        )
      case 'payment':
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
              await confirmPaymentSession(paymentIntentId)
              goToStep('confirmation')
            }}
          />
        )
      case 'confirmation':
        return (
          <Stack gap={16} flex={1}>
            <Stack gap={8}>
              <Text color={colors.text[t].secondary}>Background Check Submitted</Text>
              <Text color={colors.text[t].secondary}>
                We've started your background check request. We'll notify you when results are
                ready.
              </Text>
            </Stack>

            <Stack gap={8} backgroundColor={colors.bg[t].muted} padding="md" borderRadius={16}>
              <Text color={colors.text[t].secondary}>Summary</Text>
              <Text color={colors.text[t].secondary}>
                Package: {selectedPackage?.display_name ?? 'Pending'}
              </Text>
              <Text color={colors.text[t].secondary}>
                Cost: ${state.payment.costCents ? (state.payment.costCents / 100).toFixed(2) : '—'}
              </Text>
              <Text color={colors.text[t].secondary}>Payment: {state.payment.paidBy}</Text>
            </Stack>

            <Button size="md" color="primary" onPress={() => goToStep('packages')}>
              Start another background check
            </Button>
          </Stack>
        )
      default:
        return null
    }
  }

  // The route's own `ScreenHeader` names the screen and says what it is for
  // (#830); this drew the same two lines again a few pixels lower.
  return (
    <Stack gap={16}>
      <ProgressIndicator steps={steps} currentStep={currentStep} />

      {submitError && (
        <Row
          gap={8}
          align="center"
          wrap
          padding="sm"
          borderRadius={8}
          borderWidth={1}
          borderColor={colors.border[t].error}
          style={{ backgroundColor: colors.bg[t].subtle }}
        >
          <Text style={{ color: colors.text[t].secondary, flex: 1, minWidth: 0 }}>
            We couldn't submit your background check: {submitError.message}
          </Text>
        </Row>
      )}

      {/* The page scrolls; a second scroll view here boxed the wizard inside
          the profile shell. */}
      <Stack gap={16}>{renderStepContent()}</Stack>

      <Separator />

      <Row justify="space-between" align="center" gap={12} wrap>
        <Button
          size="md"
          disabled={currentStepIndex === 0 || currentStep === 'confirmation'}
          onPress={previousStep}
        >
          Back
        </Button>
        {currentStep !== 'confirmation' && (
          <Text color={colors.text[t].secondary}>
            Step {currentStepIndex + 1} of {steps.length}
          </Text>
        )}
      </Row>
    </Stack>
  )
}
