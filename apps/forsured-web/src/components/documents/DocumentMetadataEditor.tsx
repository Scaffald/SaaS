/**
 * DocumentMetadataEditor Component (REQ-167)
 * Main component for reviewing and correcting OCR extraction results
 */

import React, { useState, useEffect } from 'react';
import { Stack, Row, Text, H1, Card, Button, Checkbox } from '@unicornlove/beyond-ui';
import { OCRFieldDisplay } from './OCRFieldDisplay';
import { ValidationFeedback } from './ValidationFeedback';
import { DocumentPreview } from './DocumentPreview';
import { AuditHistoryPanel } from './AuditHistoryPanel';
import { OCRExtractionResult, OCRField, CoverageLimit, createOCRField } from '../../types/ocr.types';
import { Document } from '../../types/document.types';
import { validateAllFields, FieldValidators } from '../../utils/validation';
import { Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface DocumentMetadataEditorProps {
  document: Document;
  onSave: (updatedFields: Partial<OCRExtractionResult>) => Promise<void>;
  onEvaluateCompliance: () => Promise<void>;
  approvedCarriers?: string[];
}

export const DocumentMetadataEditor: React.FC<DocumentMetadataEditorProps> = ({
  document,
  onSave,
  onEvaluateCompliance,
  approvedCarriers = ['State Farm', 'Allstate', 'Progressive', 'Travelers', 'Nationwide'],
}) => {
  const [fields, setFields] = useState<FieldValidators>({
    policyNumber: createOCRField('', 0),
    effectiveDate: createOCRField('', 0),
    expirationDate: createOCRField('', 0),
    carrierName: createOCRField('', 0),
    coverageLimits: createOCRField([] as CoverageLimit[], 0),
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showOnlyFlagged, setShowOnlyFlagged] = useState(false);

  // Initialize fields from document extraction
  useEffect(() => {
    if (document.extractionResult) {
      setFields({
        policyNumber: document.extractionResult.policyNumber,
        effectiveDate: document.extractionResult.effectiveDate,
        expirationDate: document.extractionResult.expirationDate,
        carrierName: document.extractionResult.carrierName,
        coverageLimits: document.extractionResult.coverageLimits,
      });
    }
  }, [document]);

  const validationResult = validateAllFields(fields, approvedCarriers);

  const unreviewedFieldsCount = Object.values(fields).filter(
    (field) => field.reviewRequired && !field.reviewed
  ).length;

  const flaggedFields = Object.entries(fields).filter(([, field]) => field.reviewRequired);

  const handleFieldChange = (fieldName: keyof FieldValidators, value: string) => {
    setFields((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        edited: value !== prev[fieldName].originalValue,
      },
    }));
  };

  const handleRevert = (fieldName: keyof FieldValidators) => {
    setFields((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value: prev[fieldName].originalValue,
        edited: false,
      },
    }));
  };

  const handleMarkAsReviewed = (fieldName: keyof FieldValidators) => {
    setFields((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        reviewed: true,
      },
    }));
  };

  const handleSave = async () => {
    if (!validationResult.isValid) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        policyNumber: fields.policyNumber,
        effectiveDate: fields.effectiveDate,
        expirationDate: fields.expirationDate,
        carrierName: fields.carrierName,
        coverageLimits: fields.coverageLimits,
      });

      setIsEvaluating(true);
      await onEvaluateCompliance();
      setIsEvaluating(false);
    } catch (error) {
      console.error('Failed to save and evaluate:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderFieldSection = () => {
    const fieldsToRender = showOnlyFlagged
      ? flaggedFields.map(([name]) => name as keyof FieldValidators)
      : (Object.keys(fields) as Array<keyof FieldValidators>);

    return (
      <Stack gap="lg">
        {fieldsToRender.map((fieldName) => {
          const field = fields[fieldName];
          if (fieldName === 'coverageLimits') return null; // Handle separately

          const error = validationResult.errors.find(
            (e) => e.field.toLowerCase() === fieldName.toLowerCase()
          );

          return (
            <Stack key={fieldName}>
              <OCRFieldDisplay
                label={fieldName.replace(/([A-Z])/g, ' $1').trim()}
                field={field as OCRField<string>}
                onChange={(value) => handleFieldChange(fieldName, value)}
                onRevert={() => handleRevert(fieldName)}
                error={error?.message}
                type={fieldName.includes('Date') ? 'date' : 'text'}
              />
              {field.reviewRequired && !field.reviewed && (
                <button
                  style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: 'var(--color-teal-9)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                  }}
                  onClick={() => handleMarkAsReviewed(fieldName)}
                >
                  Mark as Reviewed
                </button>
              )}
            </Stack>
          );
        })}
      </Stack>
    );
  };

  return (
    <Stack style={{ height: '100vh', flexDirection: 'column', backgroundColor: 'var(--color-gray-2)' }}>
      {/* Header */}
      <Stack
        style={{
          backgroundColor: 'var(--color-background)',
          borderBottomWidth: 1,
          borderBottomStyle: 'solid',
          borderBottomColor: 'var(--color-border)',
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingTop: '16px',
          paddingBottom: '16px',
        }}
      >
        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack>
            <H1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Document Metadata Editor
            </H1>
            <Text style={{ fontSize: '14px', color: 'var(--color-gray-10)', marginTop: '4px' }}>
              Extracted:{' '}
              {new Date(document.extractionResult?.extractedAt || '').toLocaleString()}
            </Text>
          </Stack>
          <Row style={{ alignItems: 'center', gap: '16px' }}>
            {unreviewedFieldsCount > 0 && (
              <Row
                style={{
                  alignItems: 'center',
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                  backgroundColor: 'var(--color-red-2)',
                  color: 'var(--color-red-11)',
                  borderRadius: '9999px',
                  fontSize: '14px',
                }}
              >
                <AlertCircle size={16} style={{ marginRight: '4px' }} />
                {unreviewedFieldsCount} field{unreviewedFieldsCount !== 1 ? 's' : ''} need review
              </Row>
            )}
            {isEvaluating && (
              <Row style={{ alignItems: 'center', color: 'var(--color-teal-9)', gap: '8px' }}>
                <Loader2 size={16} className="animate-spin" />
                <Text style={{ fontSize: '14px' }}>Evaluating compliance...</Text>
              </Row>
            )}
            {document.complianceStatus && !isEvaluating && (
              <Row
                style={{
                  alignItems: 'center',
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                  backgroundColor: 'var(--color-green-2)',
                  color: 'var(--color-green-11)',
                  borderRadius: '9999px',
                  fontSize: '14px',
                }}
              >
                <CheckCircle size={16} style={{ marginRight: '4px' }} />
                {document.complianceStatus.status}
              </Row>
            )}
            <Button
              onPress={handleSave}
              disabled={!validationResult.isValid || isSaving}
              style={{
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingTop: '8px',
                paddingBottom: '8px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor:
                  validationResult.isValid && !isSaving ? 'var(--color-teal-9)' : 'var(--color-gray-6)',
                color: validationResult.isValid && !isSaving ? 'white' : 'var(--color-gray-10)',
                cursor: validationResult.isValid && !isSaving ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <Text>Saving...</Text>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <Text>Save & Re-evaluate</Text>
                </>
              )}
            </Button>
          </Row>
        </Row>
      </Stack>

      {/* Main Content */}
      <Stack style={{ flex: 1, overflow: 'hidden' }}>
        <Row
          style={{
            height: '100%',
            flexWrap: 'wrap',
            gap: '24px',
            padding: '24px',
          }}
        >
          {/* Left Panel: Document Preview */}
          <Stack style={{ flex: 1, height: '100%', overflow: 'auto', minWidth: '50%' }}>
            <DocumentPreview
              documentUrl={document.fileUrl}
              fileName={document.fileName}
              fileType={document.fileType}
            />
          </Stack>

          {/* Right Panel: Fields and Validation */}
          <Stack style={{ flex: 1, height: '100%', overflow: 'auto', gap: '24px', minWidth: '50%' }}>
            {/* Filter Controls */}
            <Card
              style={{
                backgroundColor: 'var(--color-background)',
                borderRadius: '8px',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'var(--color-border)',
                padding: '16px',
              }}
            >
              <Row style={{ alignItems: 'center', cursor: 'pointer' }}>
                <Checkbox
                  checked={showOnlyFlagged}
                  onCheckedChange={(checked) => setShowOnlyFlagged(checked === true)}
                />
                <Text style={{ marginLeft: '8px', fontSize: '14px', color: 'var(--color-gray-11)' }}>
                  Show only flagged fields ({flaggedFields.length})
                </Text>
              </Row>
            </Card>

            {/* Validation Feedback */}
            <ValidationFeedback validationResult={validationResult} />

            {/* Fields */}
            <Card
              style={{
                backgroundColor: 'var(--color-background)',
                borderRadius: '8px',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'var(--color-border)',
                padding: '24px',
              }}
            >
              {renderFieldSection()}
            </Card>

            {/* Audit History */}
            <AuditHistoryPanel auditHistory={document.auditHistory} />
          </Stack>
        </Row>
      </Stack>
    </Stack>
  );
};
