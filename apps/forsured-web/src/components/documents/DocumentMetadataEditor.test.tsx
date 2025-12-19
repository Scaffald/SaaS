/**
 * Tests for DocumentMetadataEditor component (REQ-167)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { DocumentMetadataEditor } from './DocumentMetadataEditor';
import { Document } from '../../types/document.types';
import { createOCRField } from '../../types/ocr.types';

const mockDocument: Document = {
  id: 'doc-123',
  fileName: 'test-policy.pdf',
  fileSize: 1024,
  fileType: 'application/pdf',
  fileUrl: 'https://example.com/test.pdf',
  uploadedBy: 'user-456',
  uploadedAt: '2024-01-15T09:00:00Z',
  status: 'extracted',
  auditHistory: [],
  extractionResult: {
    id: 'ext-123',
    documentId: 'doc-123',
    extractedAt: '2024-01-15T10:00:00Z',
    policyNumber: createOCRField('ABC12345', 95),
    effectiveDate: createOCRField('2024-01-01', 92),
    expirationDate: createOCRField('2024-12-31', 90),
    carrierName: createOCRField('State Farm', 88),
    coverageLimits: createOCRField([{ type: 'General Liability', amount: 1000000 }], 85),
  },
};

describe('DocumentMetadataEditor', () => {
  it('should render document metadata editor with all sections', () => {
    const onSave = vi.fn();
    const onEvaluateCompliance = vi.fn();

    render(
      <DocumentMetadataEditor
        document={mockDocument}
        onSave={onSave}
        onEvaluateCompliance={onEvaluateCompliance}
      />
    );

    expect(screen.getByText('Document Metadata Editor')).toBeInTheDocument();
    expect(screen.getByText(/Policy Number/i)).toBeInTheDocument();
    expect(screen.getByText(/Effective Date/i)).toBeInTheDocument();
    expect(screen.getByText(/Expiration Date/i)).toBeInTheDocument();
    expect(screen.getByText(/Carrier Name/i)).toBeInTheDocument();
  });

  it('should display extracted field values', () => {
    const onSave = vi.fn();
    const onEvaluateCompliance = vi.fn();

    render(
      <DocumentMetadataEditor
        document={mockDocument}
        onSave={onSave}
        onEvaluateCompliance={onEvaluateCompliance}
      />
    );

    expect(screen.getByDisplayValue('ABC12345')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-12-31')).toBeInTheDocument();
    expect(screen.getByDisplayValue('State Farm')).toBeInTheDocument();
  });

  it('should call onSave and onEvaluateCompliance when save button is clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onEvaluateCompliance = vi.fn().mockResolvedValue(undefined);

    render(
      <DocumentMetadataEditor
        document={mockDocument}
        onSave={onSave}
        onEvaluateCompliance={onEvaluateCompliance}
      />
    );

    const saveButton = screen.getByText('Save & Re-evaluate');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
      expect(onEvaluateCompliance).toHaveBeenCalled();
    });
  });

  it('should disable save button when validation fails', () => {
    const documentWithInvalidData = {
      ...mockDocument,
      extractionResult: {
        ...mockDocument.extractionResult!,
        policyNumber: createOCRField('', 95), // Empty - invalid
      },
    };

    const onSave = vi.fn();
    const onEvaluateCompliance = vi.fn();

    render(
      <DocumentMetadataEditor
        document={documentWithInvalidData}
        onSave={onSave}
        onEvaluateCompliance={onEvaluateCompliance}
      />
    );

    const saveButton = screen.getByText('Save & Re-evaluate');
    expect(saveButton).toBeDisabled();
  });

  it('should show flagged fields count when low confidence fields exist', () => {
    const documentWithLowConfidence = {
      ...mockDocument,
      extractionResult: {
        ...mockDocument.extractionResult!,
        policyNumber: createOCRField('ABC12345', 65), // Low confidence
      },
    };

    const onSave = vi.fn();
    const onEvaluateCompliance = vi.fn();

    render(
      <DocumentMetadataEditor
        document={documentWithLowConfidence}
        onSave={onSave}
        onEvaluateCompliance={onEvaluateCompliance}
      />
    );

    expect(screen.getByText(/need review/i)).toBeInTheDocument();
  });

  it('should filter to show only flagged fields when checkbox is checked', () => {
    const documentWithLowConfidence = {
      ...mockDocument,
      extractionResult: {
        ...mockDocument.extractionResult!,
        policyNumber: createOCRField('ABC12345', 65), // Low confidence - flagged
        carrierName: createOCRField('State Farm', 95), // High confidence - not flagged
      },
    };

    const onSave = vi.fn();
    const onEvaluateCompliance = vi.fn();

    render(
      <DocumentMetadataEditor
        document={documentWithLowConfidence}
        onSave={onSave}
        onEvaluateCompliance={onEvaluateCompliance}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // After filtering, should still see policy number (flagged)
    expect(screen.getByDisplayValue('ABC12345')).toBeInTheDocument();
  });

  it('should display document preview section', () => {
    const onSave = vi.fn();
    const onEvaluateCompliance = vi.fn();

    render(
      <DocumentMetadataEditor
        document={mockDocument}
        onSave={onSave}
        onEvaluateCompliance={onEvaluateCompliance}
      />
    );

    expect(screen.getByText('test-policy.pdf')).toBeInTheDocument();
  });

  it('should display audit history section', () => {
    const documentWithAudit = {
      ...mockDocument,
      auditHistory: [
        {
          id: 'audit-1',
          fieldName: 'policyNumber',
          oldValue: 'OLD123',
          newValue: 'ABC12345',
          confidenceAtEdit: 95,
          changedBy: 'user-456',
          changedAt: '2024-01-15T11:00:00Z',
        },
      ],
    };

    const onSave = vi.fn();
    const onEvaluateCompliance = vi.fn();

    render(
      <DocumentMetadataEditor
        document={documentWithAudit}
        onSave={onSave}
        onEvaluateCompliance={onEvaluateCompliance}
      />
    );

    expect(screen.getByText(/Audit History/i)).toBeInTheDocument();
  });
});
