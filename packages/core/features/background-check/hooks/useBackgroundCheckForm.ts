import { useCallback, useEffect, useMemo, useState } from 'react'

import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

type RouterInputs = inferRouterInputs<AppRouter>
type RouterOutputs = inferRouterOutputs<AppRouter>
type BackgroundCheckPackage = RouterOutputs['backgroundChecks']['listPackages'][number]

export type BackgroundCheckWizardStep =
  | 'packages'
  | 'consent'
  | 'documents'
  | 'payment'
  | 'confirmation'

const WIZARD_STEPS: BackgroundCheckWizardStep[] = [
  'packages',
  'consent',
  'documents',
  'payment',
  'confirmation',
]

export type BackgroundCheckPaidBy = RouterInputs['backgroundChecks']['initiate']['paid_by']

export interface ConsentDetails {
  acceptsDisclosure: boolean
  signature: string
  signedAt?: string
  ipAddress?: string
  userAgent?: string
}

export interface DocumentDraft {
  id?: string
  storagePath: string
  documentType: string
  fileName: string
  mimeType: string
  fileSize: number
  uploadedAt?: string
}

export interface PaymentDetails {
  costCents: number
  paidBy: BackgroundCheckPaidBy
  paymentMethodId?: string
  status?: 'pending' | 'succeeded' | 'failed'
}

export interface BackgroundCheckFormState {
  selectedPackageId?: string
  consent: ConsentDetails
  documents: DocumentDraft[]
  payment: PaymentDetails
  metadata: Record<string, unknown>
  checkId?: string
}

const DEFAULT_CONSENT: ConsentDetails = {
  acceptsDisclosure: false,
  signature: '',
}

type PaymentSession = {
  backgroundCheckId: string
  paymentIntentId: string
  clientSecret: string
  amountCents: number
}

export function useBackgroundCheckForm() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [state, setState] = useState<BackgroundCheckFormState>({
    consent: DEFAULT_CONSENT,
    documents: [],
    payment: {
      costCents: 0,
      paidBy: 'worker',
    },
    metadata: {},
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<Error | null>(null)
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null)

  const packagesQuery = api.backgroundChecks.listPackages.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  })

  const requestCheckMutation = api.backgroundChecks.requestCheck.useMutation()
  const confirmPaymentMutation = api.backgroundChecks.confirmCheckPayment.useMutation()
  const createUploadUrlMutation = api.backgroundChecks.createUploadUrl.useMutation()
  const addDocumentMetadataMutation = api.backgroundChecks.addDocumentMetadata.useMutation()

  const currentStep = WIZARD_STEPS[currentStepIndex]

  const selectedPackage = useMemo(() => {
    return packagesQuery.data?.find(
      (pkg: BackgroundCheckPackage) => pkg.id === state.selectedPackageId,
    )
  }, [packagesQuery.data, state.selectedPackageId])

  useEffect(() => {
    setPaymentSession(null)
  }, [state.selectedPackageId])

  useEffect(() => {
    if (selectedPackage?.retail_cost_cents != null) {
      setState((prev) => ({
        ...prev,
        payment: {
          ...prev.payment,
          costCents: selectedPackage.retail_cost_cents,
          paidBy: prev.payment.paidBy ?? 'worker',
        },
      }))
    }
  }, [selectedPackage?.id, selectedPackage?.retail_cost_cents])

  const selectPackage = useCallback((packageId: string) => {
    setState((prev) => ({
      ...prev,
      selectedPackageId: packageId,
    }))
  }, [])

  const updateConsent = useCallback((consent: Partial<ConsentDetails>) => {
    setState((prev) => ({
      ...prev,
      consent: {
        ...prev.consent,
        ...consent,
        signedAt: consent.signature
          ? new Date().toISOString()
          : prev.consent.signedAt,
      },
    }))
  }, [])

  const upsertDocument = useCallback((document: DocumentDraft) => {
    setState((prev) => {
      const existingIndex = prev.documents.findIndex(
        (item) =>
          item.storagePath === document.storagePath ||
          (item.id && item.id === document.id),
      )
      const nextDocuments = [...prev.documents]
      if (existingIndex >= 0) {
        nextDocuments[existingIndex] = { ...nextDocuments[existingIndex], ...document }
      } else {
        nextDocuments.push(document)
      }
      return {
        ...prev,
        documents: nextDocuments,
      }
    })
  }, [])

  const removeDocument = useCallback((storagePath: string) => {
    setState((prev) => ({
      ...prev,
      documents: prev.documents.filter((doc) => doc.storagePath !== storagePath),
    }))
  }, [])

  const updatePayment = useCallback((payment: Partial<PaymentDetails>) => {
    setState((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        ...payment,
      },
    }))
  }, [])

  const goToStep = useCallback((target: BackgroundCheckWizardStep) => {
    const index = WIZARD_STEPS.indexOf(target)
    if (index >= 0) {
      setCurrentStepIndex(index)
    }
  }, [])

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1))
  }, [])

  const previousStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  const requestDocumentUpload = useCallback(
    async (input: RouterInputs['backgroundChecks']['createUploadUrl']) => {
      const result = await createUploadUrlMutation.mutateAsync(input)
      return result
    },
    [createUploadUrlMutation],
  )

  const recordDocumentMetadata = useCallback(
    async (input: RouterInputs['backgroundChecks']['addDocumentMetadata']) => {
      const result = await addDocumentMetadataMutation.mutateAsync(input)
      if (result) {
        upsertDocument({
          id: result.id,
          storagePath: input.storage_path,
          documentType: input.document_type,
          fileName: input.file_name,
          mimeType: input.mime_type,
          fileSize: input.file_size,
          uploadedAt: new Date().toISOString(),
        })
      }
      return result
    },
    [addDocumentMetadataMutation, upsertDocument],
  )

  const createPaymentSession = useCallback(async () => {
    if (paymentSession) {
      return paymentSession
    }

    if (!state.selectedPackageId || !selectedPackage) {
      throw new Error('Select a background check package before paying.')
    }

    if (state.payment.paidBy !== 'worker') {
      throw new Error('Self-service background checks are currently billed to the worker.')
    }

    const metadata = {
      consent: state.consent,
      documents: state.documents.map((doc) => ({
        storagePath: doc.storagePath,
        documentType: doc.documentType,
        fileName: doc.fileName,
      })),
      ...state.metadata,
    }

    const response = await requestCheckMutation.mutateAsync({
      package_id: state.selectedPackageId,
      tier: (selectedPackage.slug as string | undefined) ??
        (selectedPackage.display_name as string | undefined) ??
        'custom',
      paid_by: 'worker',
      metadata,
    })

    setPaymentSession(response)
    return response
  }, [paymentSession, requestCheckMutation, selectedPackage, state.consent, state.documents, state.metadata, state.selectedPackageId, state.payment.paidBy])

  const confirmPaymentSession = useCallback(
    async (paymentIntentId: string) => {
      if (!paymentSession) {
        throw new Error('No payment session available.')
      }

      setIsSubmitting(true)
      setSubmitError(null)

      try {
        const record = await confirmPaymentMutation.mutateAsync({
          background_check_id: paymentSession.backgroundCheckId,
          payment_intent_id: paymentIntentId,
        })

        setState((prev) => ({
          ...prev,
          payment: {
            ...prev.payment,
            status: 'succeeded',
          },
          checkId: record?.id ?? paymentSession.backgroundCheckId,
        }))
        setPaymentSession(null)
        return record
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        setSubmitError(err)
        throw err
      } finally {
        setIsSubmitting(false)
      }
    },
    [confirmPaymentMutation, paymentSession],
  )

  return {
    steps: WIZARD_STEPS,
    currentStep,
    currentStepIndex,
    selectedPackage,
    packagesQuery,
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
    requestDocumentUpload,
    recordDocumentMetadata,
    paymentSession,
    createPaymentSession,
    confirmPaymentSession,
    isCreatingPaymentSession: requestCheckMutation.isPending,
  }
}
