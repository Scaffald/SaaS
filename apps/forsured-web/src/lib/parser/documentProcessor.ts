/**
 * Document Processing Integration Service
 * REQ-125: Mock OCR & Document Parsing Engine for ACORD 25 Forms
 *
 * Orchestrates OCR extraction, parsing, validation, and database storage
 */

import { mockOCRService } from '../ocr/mockOCRService'
import { acord25Parser } from './acord25Parser'
import type {
  OCRInput,
  ACORD25Extraction,
  PolicyData,
  AIExtractionRecord,
  CoverageType,
} from '../types/acord25'
import { supabase } from '../supabase'

export interface ProcessingResult {
  success: boolean
  extraction?: ACORD25Extraction
  policiesCreated?: string[] // IDs of created policy records
  extractionRecordId?: string
  error?: string
  processingTimeMs: number
}

/**
 * Document Processor
 * Handles end-to-end document processing pipeline
 */
export class DocumentProcessor {
  /**
   * Process ACORD 25 document through complete pipeline
   * 1. OCR extraction
   * 2. Text parsing
   * 3. Data validation
   * 4. Database storage
   */
  async processDocument(input: OCRInput): Promise<ProcessingResult> {
    const startTime = Date.now()

    try {
      // Step 1: Extract text via OCR
      console.log(`[DocumentProcessor] Starting OCR for document ${input.documentId}`)
      const ocrResult = await mockOCRService.extractText(input)

      // Validate ACORD 25 format
      const formatValidation = mockOCRService.validateACORD25Format(ocrResult.rawText)
      if (!formatValidation.isValid) {
        return {
          success: false,
          error: 'Document is not a recognized ACORD 25 certificate',
          processingTimeMs: Date.now() - startTime,
        }
      }

      // Step 2: Parse extracted text
      console.log(`[DocumentProcessor] Parsing ACORD 25 for document ${input.documentId}`)
      const extraction = await acord25Parser.parse({
        documentId: input.documentId,
        rawText: ocrResult.rawText,
        carrier: ocrResult.detectedCarrier,
      })

      // Step 3: Store extraction result in database
      const extractionRecord = await this.storeExtraction(extraction)

      // Step 4: Create policy records if extraction is high confidence
      let policiesCreated: string[] = []
      if (extraction.overall_confidence >= 60 && extraction.policy_number) {
        policiesCreated = await this.createPolicyRecords(extraction)
      }

      const processingTimeMs = Date.now() - startTime

      console.log(
        `[DocumentProcessor] Completed processing for ${input.documentId} in ${processingTimeMs}ms`
      )

      return {
        success: true,
        extraction,
        policiesCreated,
        extractionRecordId: extractionRecord.id,
        processingTimeMs,
      }
    } catch (error) {
      const processingTimeMs = Date.now() - startTime
      console.error('[DocumentProcessor] Error processing document:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown processing error',
        processingTimeMs,
      }
    }
  }

  /**
   * Store extraction result in ai_extractions table
   */
  private async storeExtraction(extraction: ACORD25Extraction): Promise<AIExtractionRecord> {
    const record = {
      document_id: extraction.document_id,
      extraction_type: 'acord_25',
      extraction_data: extraction,
      confidence_score: extraction.overall_confidence,
      requires_review: extraction.requires_manual_review,
    }

    const { data, error } = await supabase.schema('forsured').from('ai_extractions').insert(record).select().single()

    if (error) throw error
    return data as AIExtractionRecord
  }

  /**
   * Create policy records in policies table from extraction
   */
  private async createPolicyRecords(extraction: ACORD25Extraction): Promise<string[]> {
    const policyIds: string[] = []

    // We need a client_id to create policies
    // For MVP, we'll use a default or look up based on document
    const clientId = await this.resolveClientId(extraction.document_id)

    if (!clientId) {
      console.warn('[DocumentProcessor] Cannot create policies: no client_id')
      return policyIds
    }

    // Create a policy record for each coverage type
    for (const coverage of extraction.coverage_types) {
      if (!coverage.amount) continue

      const policyData = {
        client_id: clientId,
        policy_type: coverage.type,
        policy_number: extraction.policy_number || 'UNKNOWN',
        provider: extraction.carrier,
        coverage_amount: coverage.amount,
        start_date: this.toDateString(extraction.effective_date),
        end_date: this.toDateString(extraction.expiration_date),
        status: this.determinePolicyStatus(extraction.expiration_date),
        notes: this.buildPolicyNotes(extraction, coverage.type),
      }

      try {
        const { data: policy, error } = await supabase.schema('forsured').from('policies')
          .insert(policyData)
          .select()
          .single()

        if (error) throw error
        policyIds.push(policy.id)
        console.log(`[DocumentProcessor] Created policy ${policy.id} for ${coverage.type}`)
      } catch (error) {
        console.error(`[DocumentProcessor] Error creating policy for ${coverage.type}:`, error)
      }
    }

    return policyIds
  }

  /**
   * Resolve client ID from document
   * In MVP, returns a default client ID
   * In production, would look up based on document metadata
   */
  private async resolveClientId(_documentId: string): Promise<string | null> {
    // For MVP, try to find first client in database
    const { data: clients = [] } = await supabase.schema('forsured').from('clients').select('id').limit(1)

    if (clients.length > 0) {
      return clients[0].id
    }

    // If no clients exist, this is a problem for integration tests
    console.warn('[DocumentProcessor] No clients found in database')
    return null
  }

  /**
   * Convert ISO date to YYYY-MM-DD format
   */
  private toDateString(isoDate: string | null): string {
    if (!isoDate) return new Date().toISOString().split('T')[0]
    return isoDate.split('T')[0]
  }

  /**
   * Determine policy status based on expiration date
   */
  private determinePolicyStatus(expirationDate: string | null): 'active' | 'expired' | 'pending' {
    if (!expirationDate) return 'pending'

    const expiration = new Date(expirationDate)
    const now = new Date()

    if (expiration < now) return 'expired'
    return 'active'
  }

  /**
   * Build policy notes from extraction data
   */
  private buildPolicyNotes(extraction: ACORD25Extraction, _coverageType: CoverageType): string {
    const notes: string[] = []

    notes.push(
      `Extracted from ACORD 25 certificate (confidence: ${extraction.overall_confidence}%)`
    )

    // Add endorsement information
    if (extraction.endorsements.additional_insured.value) {
      notes.push('Additional Insured: Yes')
    }
    if (extraction.endorsements.waiver_of_subrogation.value) {
      notes.push('Waiver of Subrogation: Yes')
    }
    if (extraction.endorsements.primary_non_contributory.value) {
      notes.push('Primary and Non-Contributory: Yes')
    }

    // Add warnings if low confidence
    if (extraction.overall_confidence < 80) {
      notes.push('⚠️ Manual review recommended due to low confidence extraction')
    }

    // Add any errors
    if (extraction.errors.length > 0) {
      notes.push(`Extraction errors: ${extraction.errors.map((e) => e.message).join(', ')}`)
    }

    return notes.join(' | ')
  }

  /**
   * Update document status in document_versions table
   */
  async updateDocumentStatus(
    documentId: string,
    status: 'processing' | 'completed' | 'error',
    errorMessage?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.schema('forsured').from('document_versions')
        .update({
          status,
          error_message: errorMessage,
          processed_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      if (error) throw error
    } catch (error) {
      console.error('[DocumentProcessor] Error updating document status:', error)
    }
  }
}

/**
 * Singleton instance
 */
export const documentProcessor = new DocumentProcessor()
