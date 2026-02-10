import { useMemo } from 'react'
import { Button, ScrollView, Separator, Text, Row, Stack } from '@unicornlove/beyond-ui'

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

  const requiredDocuments = useMemo(() => {
    const raw = selectedPackage?.metadata?.required_documents
    if (Array.isArray(raw)) {
      return raw.map((item) => String(item))
    }
    return []
  }, [selectedPackage?.metadata])

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
          <Stack gap="$4" flex={1}>
            <Stack gap="$2">
              <Text fontSize="$6" fontWeight="bold" color="$color12">
                Background Check Submitted
              </Text>
              <Text fontSize="$3" color="$color11">
                We’ve started your background check request. We’ll notify you when results are
                ready.
              </Text>
            </Stack>

            <Stack gap="$2" backgroundColor="$color2" padding="$4" borderRadius="$4">
              <Text fontSize="$4" fontWeight="bold" color="$color12">
                Summary
              </Text>
              <Text fontSize="$3" color="$color11">
                Package: {selectedPackage?.display_name ?? 'Pending'}
              </Text>
              <Text fontSize="$3" color="$color11">
                Cost: ${state.payment.costCents ? (state.payment.costCents / 100).toFixed(2) : '—'}
              </Text>
              <Text fontSize="$3" color="$color11">
                Payment: {state.payment.paidBy}
              </Text>
            </Stack>

            <Button size="$4" theme="blue" onPress={() => goToStep('packages')}>
              Start another background check
            </Button>
          </Stack>
        )
      default:
        return null
    }
  }

  return (
    <Stack flex={1} backgroundColor="$background">
      <Stack
        padding="$4"
        gap="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        backgroundColor="$background"
      >
        <Stack gap="$1">
          <Text fontSize="$7" fontWeight="bold" color="$color12">
            Initiate Background Check
          </Text>
          <Text fontSize="$3" color="$color11">
            Complete the steps below to start your background check.
          </Text>
        </Stack>

        <ProgressIndicator steps={steps} currentStep={currentStep} />
      </Stack>

      {submitError && (
        <Stack
          backgroundColor="$red3"
          padding="$3"
          borderBottomWidth={1}
          borderBottomColor="$red7"
        >
          <Text color="$red11">
            We couldn’t submit your background check: {submitError.message}
          </Text>
        </Stack>
      )}

      <ScrollView flex={1}>
        <Stack gap="$4" flex={1} paddingHorizontal="$4" paddingBottom="$6">
          {renderStepContent()}
        </Stack>
      </ScrollView>

      <Separator />

      <Row padding="$4" justifyContent="space-between" backgroundColor="$background">
        <Button
          size="$4"
          disabled={currentStepIndex === 0 || currentStep === 'confirmation'}
          onPress={previousStep}
        >
          Back
        </Button>
        {currentStep !== 'confirmation' && (
          <Text fontSize="$2" color="$color9">
            Step {currentStepIndex + 1} of {steps.length}
          </Text>
        )}
      </Row>
    </Stack>
  )
}
