/**
 * Mock OCR Service for ACORD 25 Certificate of Insurance extraction
 * REQ-125: Mock OCR & Document Parsing Engine for ACORD 25 Forms
 *
 * This is a pattern-based mock service for MVP. In Phase 2, this will be
 * replaced with AWS Textract or similar OCR service.
 */

import type { OCRInput, OCRResult, InsuranceCarrier } from '../types/acord25';

/**
 * Carrier detection patterns for identifying insurance companies
 */
const CARRIER_PATTERNS: Record<InsuranceCarrier, RegExp[]> = {
  'Travelers': [
    /travelers/i,
    /travelers\s+(?:insurance|indemnity|casualty)/i,
    /the\s+travelers\s+companies/i,
  ],
  'Liberty Mutual': [
    /liberty\s+mutual/i,
    /liberty\s+insurance/i,
    /lmig/i, // Liberty Mutual Insurance Group
  ],
  'Hartford': [
    /hartford/i,
    /the\s+hartford/i,
    /hartford\s+(?:fire|insurance|casualty)/i,
  ],
  'Unknown': [],
};

/**
 * Mock OCR Service
 * Extracts text from PDF and detects insurance carrier
 */
export class MockOCRService {
  /**
   * Extract text from PDF document
   * In MVP, this simulates OCR by returning mock/template text
   */
  async extractText(input: OCRInput): Promise<OCRResult> {
    // Simulate OCR processing delay
    await this.simulateProcessing();

    // For MVP, we'll use mock text extraction
    // In Phase 2, this would integrate with pdf.js or AWS Textract
    const rawText = await this.mockExtractPDFText(input);

    // Detect carrier from text
    const { carrier, confidence } = this.detectCarrier(rawText, input.carrierHint);

    return {
      documentId: input.documentId,
      rawText,
      detectedCarrier: carrier,
      carrierConfidence: confidence,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Detect insurance carrier from document text
   */
  private detectCarrier(
    text: string,
    hint?: InsuranceCarrier
  ): { carrier: InsuranceCarrier; confidence: number } {
    // If hint provided, check if it matches
    if (hint && hint !== 'Unknown') {
      const patterns = CARRIER_PATTERNS[hint];
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return { carrier: hint, confidence: 95 };
        }
      }
    }

    // Try to detect from text
    for (const [carrierName, patterns] of Object.entries(CARRIER_PATTERNS)) {
      if (carrierName === 'Unknown') continue;

      for (const pattern of patterns) {
        if (pattern.test(text)) {
          // Calculate confidence based on how early in document and clarity of match
          const confidence = this.calculateCarrierConfidence(text, pattern);
          return { carrier: carrierName as InsuranceCarrier, confidence };
        }
      }
    }

    return { carrier: 'Unknown', confidence: 0 };
  }

  /**
   * Calculate confidence score for carrier detection
   */
  private calculateCarrierConfidence(text: string, pattern: RegExp): number {
    const match = text.match(pattern);
    if (!match) return 0;

    const matchIndex = match.index || 0;
    const textLength = text.length;

    // Higher confidence if match is in first 500 characters (header area)
    if (matchIndex < 500) {
      return 95;
    } else if (matchIndex < 1000) {
      return 85;
    } else if (matchIndex < textLength / 2) {
      return 75;
    }

    return 60;
  }

  /**
   * Mock PDF text extraction
   * In Phase 2, this will use pdf.js or AWS Textract
   */
  private async mockExtractPDFText(input: OCRInput): Promise<string> {
    // For MVP, if we have a PDF buffer, we simulate extraction
    // In reality, we would use pdf.js here

    // For now, return empty string - will be populated by test data
    // or actual PDF processing in integration
    if (input.pdfPath) {
      // In Phase 2: load PDF from path and extract text
      return '';
    }

    if (input.pdfBuffer) {
      // In Phase 2: extract text from buffer using pdf.js
      return '';
    }

    return '';
  }

  /**
   * Simulate OCR processing delay
   */
  private async simulateProcessing(): Promise<void> {
    // Simulate 500-1500ms processing time
    const delay = 500 + Math.random() * 1000;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Validate that document appears to be an ACORD 25 form
   */
  validateACORD25Format(text: string): { isValid: boolean; confidence: number } {
    // Check for ACORD 25 markers
    const acord25Markers = [
      /ACORD\s*25/i,
      /CERTIFICATE\s+OF\s+(?:LIABILITY\s+)?INSURANCE/i,
      /PRODUCER/i,
      /INSURED/i,
      /COVERAGES/i,
      /GENERAL\s+LIABILITY/i,
      /POLICY\s+NUMBER/i,
      /POLICY\s+(?:EFF|EFFECTIVE)/i,
    ];

    let matchCount = 0;
    for (const marker of acord25Markers) {
      if (marker.test(text)) {
        matchCount++;
      }
    }

    // Need at least 4 markers to be confident it's ACORD 25
    const isValid = matchCount >= 4;
    const confidence = Math.min(100, (matchCount / acord25Markers.length) * 100);

    return { isValid, confidence };
  }

  /**
   * Extract specific field from text using pattern
   */
  extractField(text: string, pattern: RegExp): string | null {
    const match = text.match(pattern);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract all matches for a pattern (e.g., multiple policy numbers)
   */
  extractAllMatches(text: string, pattern: RegExp): string[] {
    const matches: string[] = [];
    let match;

    const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');

    while ((match = globalPattern.exec(text)) !== null) {
      if (match[1]) {
        matches.push(match[1].trim());
      }
    }

    return matches;
  }
}

/**
 * Singleton instance
 */
export const mockOCRService = new MockOCRService();
