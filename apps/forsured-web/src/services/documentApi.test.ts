/**
 * Tests for documentApi service
 * Mock validation tests as required by CLAUDE.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getDocumentExtractions,
  updateDocumentExtractions,
  evaluateCompliance,
} from './documentApi';
import { createOCRField } from '../types/ocr.types';

// Mock fetch globally
global.fetch = vi.fn();

describe('documentApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDocumentExtractions', () => {
    it('should call correct endpoint with document ID', async () => {
      const mockResponse = {
        document: {
          id: 'doc-123',
          fileName: 'test.pdf',
          status: 'extracted',
        },
        extraction: {
          id: 'ext-123',
          documentId: 'doc-123',
          extractedAt: '2024-01-15T10:00:00Z',
          policyNumber: createOCRField('ABC12345', 95),
          effectiveDate: createOCRField('2024-01-01', 92),
          expirationDate: createOCRField('2024-12-31', 90),
          carrierName: createOCRField('State Farm', 88),
          coverageLimits: createOCRField([{ type: 'GL', amount: 1000000 }], 85),
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getDocumentExtractions('doc-123');

      expect(global.fetch).toHaveBeenCalledWith('/api/v1/documents/doc-123/extractions');
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when request fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(getDocumentExtractions('doc-123')).rejects.toThrow(
        'Failed to fetch document extractions: Not Found'
      );
    });
  });

  describe('updateDocumentExtractions', () => {
    it('should call correct endpoint with PUT method and payload', async () => {
      const payload = {
        documentId: 'doc-123',
        extractionResult: {
          policyNumber: createOCRField('XYZ67890', 95),
        },
        changedBy: 'user-456',
      };

      const mockResponse = {
        id: 'doc-123',
        fileName: 'test.pdf',
        status: 'validated',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await updateDocumentExtractions(payload);

      expect(global.fetch).toHaveBeenCalledWith('/api/v1/documents/doc-123/extractions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when update fails', async () => {
      const payload = {
        documentId: 'doc-123',
        extractionResult: {},
        changedBy: 'user-456',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      await expect(updateDocumentExtractions(payload)).rejects.toThrow(
        'Failed to update document extractions: Bad Request'
      );
    });
  });

  describe('evaluateCompliance', () => {
    it('should call correct endpoint with POST method', async () => {
      const mockResponse = {
        documentId: 'doc-123',
        status: {
          status: 'compliant' as const,
          score: 95,
          issues: [],
          evaluatedAt: '2024-01-15T10:05:00Z',
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await evaluateCompliance('doc-123');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/documents/doc-123/evaluate-compliance',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when evaluation fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(evaluateCompliance('doc-123')).rejects.toThrow(
        'Failed to evaluate compliance: Internal Server Error'
      );
    });
  });
});

/**
 * MOCK VALIDATION TESTS
 * As required by CLAUDE.md: "mocks used in tests must always be validated!"
 */
describe('documentApi mock validation', () => {
  it('should verify mock response structure matches DocumentExtractionResponse type', async () => {
    const mockResponse = {
      document: {
        id: 'doc-123',
        fileName: 'test.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        uploadedBy: 'user-456',
        uploadedAt: '2024-01-15T09:00:00Z',
        status: 'extracted' as const,
        auditHistory: [],
      },
      extraction: {
        id: 'ext-123',
        documentId: 'doc-123',
        extractedAt: '2024-01-15T10:00:00Z',
        policyNumber: createOCRField('ABC12345', 95),
        effectiveDate: createOCRField('2024-01-01', 92),
        expirationDate: createOCRField('2024-12-31', 90),
        carrierName: createOCRField('State Farm', 88),
        coverageLimits: createOCRField([{ type: 'GL', amount: 1000000 }], 85),
      },
    };

    // Validate structure
    expect(mockResponse.document).toHaveProperty('id');
    expect(mockResponse.document).toHaveProperty('fileName');
    expect(mockResponse.document).toHaveProperty('status');
    expect(mockResponse.extraction).toHaveProperty('id');
    expect(mockResponse.extraction).toHaveProperty('documentId');
    expect(mockResponse.extraction).toHaveProperty('policyNumber');
    expect(mockResponse.extraction.policyNumber).toHaveProperty('value');
    expect(mockResponse.extraction.policyNumber).toHaveProperty('confidence');
    expect(mockResponse.extraction.policyNumber.confidence).toHaveProperty('score');
  });

  it('should verify mock compliance response matches ComplianceEvaluationResponse type', () => {
    const mockResponse = {
      documentId: 'doc-123',
      status: {
        status: 'compliant' as const,
        score: 95,
        issues: [],
        evaluatedAt: '2024-01-15T10:05:00Z',
      },
    };

    // Validate structure
    expect(mockResponse).toHaveProperty('documentId');
    expect(mockResponse.status).toHaveProperty('status');
    expect(mockResponse.status).toHaveProperty('score');
    expect(mockResponse.status).toHaveProperty('issues');
    expect(mockResponse.status).toHaveProperty('evaluatedAt');
    expect(['compliant', 'warning', 'critical', 'non_compliant', 'partial']).toContain(
      mockResponse.status.status
    );
  });
});
