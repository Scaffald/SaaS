import { useEffect, useState } from 'react'
import {
  fetchLegalDocuments,
  LEGAL_DOCUMENTS_FALLBACK,
  type LegalDocType,
  type LegalDocumentInfo,
} from './fetchLegalDocuments'

/**
 * Current published metadata for one legal document — display only (the
 * terms/privacy page subtitles). Resolves synchronously to the static
 * fallback, then updates once /v1/legal answers; unauthenticated-safe.
 */
export function useLegalDocumentInfo(docType: LegalDocType): LegalDocumentInfo {
  const fallback = LEGAL_DOCUMENTS_FALLBACK.find((d) => d.doc_type === docType) as LegalDocumentInfo
  const [doc, setDoc] = useState<LegalDocumentInfo>(fallback)

  useEffect(() => {
    let cancelled = false
    fetchLegalDocuments().then((docs) => {
      if (cancelled) return
      const match = docs.find((d) => d.doc_type === docType)
      if (match) setDoc(match)
    })
    return () => {
      cancelled = true
    }
  }, [docType])

  return doc
}
