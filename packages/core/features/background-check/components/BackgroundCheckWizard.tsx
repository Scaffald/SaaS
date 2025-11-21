import { useMemo } from 'react'
import { Button, ScrollView, Separator, Text, XStack, YStack } from 'tamagui'

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
          <YStack gap="$4" flex={1}>
            <YStack gap="$2">
              <Text fontSize="$6" fontWeight="bold" color="$color12">
                Background Check Submitted
              </Text>
              <Text fontSize="$3" color="$color11">
                We’ve started your background check request. We’ll notify you when results are
                ready.
              </Text>
            </YStack>

            <YStack gap="$2" bg="$color2" p="$4" rounded="$4">
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
            </YStack>

            <Button size="$4" theme="blue" onPress={() => goToStep('packages')}>
              Start another background check
            </Button>
          </YStack>
        )
      default:
        return null
    }
  }

  return (
    <YStack flex={1} bg="$background">
      <YStack
        p="$4"
        gap="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        bg="$background"
      >
        <YStack gap="$1">
          <Text fontSize="$7" fontWeight="bold" color="$color12">
            Initiate Background Check
          </Text>
          <Text fontSize="$3" color="$color11">
            Complete the steps below to start your background check.
          </Text>
        </YStack>

        <ProgressIndicator steps={steps} currentStep={currentStep} />
      </YStack>

      {submitError && (
        <YStack bg="$red3" p="$3" borderBottomWidth={1} borderBottomColor="$red7">
          <Text color="$red11">
            We couldn’t submit your background check: {submitError.message}
          </Text>
        </YStack>
      )}

      <ScrollView flex={1}>
        <YStack gap="$4" flex={1} px="$4" pb="$6">
          {renderStepContent()}
        </YStack>
      </ScrollView>

      <Separator />

      <XStack p="$4" justify="space-between" bg="$background">
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
      </XStack>
    </YStack>
  )
}
