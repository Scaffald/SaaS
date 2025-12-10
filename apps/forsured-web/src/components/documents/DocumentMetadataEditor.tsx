/**
 * DocumentMetadataEditor Component (REQ-167)
 * Main component for reviewing and correcting OCR extraction results
 */

import React, { useState, useEffect } from 'react';
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
      <div className="space-y-6">
        {fieldsToRender.map((fieldName) => {
          const field = fields[fieldName];
          if (fieldName === 'coverageLimits') return null; // Handle separately

          const error = validationResult.errors.find(
            (e) => e.field.toLowerCase() === fieldName.toLowerCase()
          );

          return (
            <div key={fieldName}>
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
                  onClick={() => handleMarkAsReviewed(fieldName)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Mark as Reviewed
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Document Metadata Editor</h1>
            <p className="text-sm text-gray-500 mt-1">
              Extracted: {new Date(document.extractionResult?.extractedAt || '').toLocaleString()}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {unreviewedFieldsCount > 0 && (
              <div className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {unreviewedFieldsCount} field{unreviewedFieldsCount !== 1 ? 's' : ''} need review
              </div>
            )}
            {isEvaluating && (
              <div className="flex items-center text-blue-600">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                <span className="text-sm">Evaluating compliance...</span>
              </div>
            )}
            {document.complianceStatus && !isEvaluating && (
              <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                {document.complianceStatus.status}
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={!validationResult.isValid || isSaving}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                validationResult.isValid && !isSaving
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save & Re-evaluate
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Left Panel: Document Preview */}
          <div className="h-full overflow-auto">
            <DocumentPreview
              documentUrl={document.fileUrl}
              fileName={document.fileName}
              fileType={document.fileType}
            />
          </div>

          {/* Right Panel: Fields and Validation */}
          <div className="h-full overflow-auto space-y-6">
            {/* Filter Controls */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyFlagged}
                  onChange={(e) => setShowOnlyFlagged(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Show only flagged fields ({flaggedFields.length})
                </span>
              </label>
            </div>

            {/* Validation Feedback */}
            <ValidationFeedback validationResult={validationResult} />

            {/* Fields */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {renderFieldSection()}
            </div>

            {/* Audit History */}
            <AuditHistoryPanel auditHistory={document.auditHistory} />
          </div>
        </div>
      </div>
    </div>
  );
};
