/**
 * DocumentMetadataEditor Component (REQ-167)
 * Main component for reviewing and correcting OCR extraction results
 */

import { useState, useEffect } from 'react';
import { YStack, XStack, Text, H1, Card, Button, Spinner, Checkbox } from '@unicornlove/ui';
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
      <YStack gap="$6">
        {fieldsToRender.map((fieldName) => {
          const field = fields[fieldName];
          if (fieldName === 'coverageLimits') return null; // Handle separately

          const error = validationResult.errors.find(
            (e) => e.field.toLowerCase() === fieldName.toLowerCase()
          );

          return (
            <YStack key={fieldName}>
              <OCRFieldDisplay
                label={fieldName.replace(/([A-Z])/g, ' $1').trim()}
                field={field as OCRField<string>}
                onChange={(value) => handleFieldChange(fieldName, value)}
                onRevert={() => handleRevert(fieldName)}
                error={error?.message}
                type={fieldName.includes('Date') ? 'date' : 'text'}
              />
              {field.reviewRequired && !field.reviewed && (
                <Text
                  as="button"
                  mt="$2"
                  fontSize="$3"
                  color="$teal9"
                  hoverStyle={{ color: '$teal11' }}
                  textDecorationLine="underline"
                  onClick={() => handleMarkAsReviewed(fieldName)}
                  cursor="pointer"
                >
                  Mark as Reviewed
                </Text>
              )}
            </YStack>
          );
        })}
      </YStack>
    );
  };

  return (
    <YStack height="100vh" flexDirection="column" backgroundColor="$gray2">
      {/* Header */}
      <YStack
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        paddingHorizontal="$6"
        paddingVertical="$4"
      >
        <XStack alignItems="center" justifyContent="space-between">
          <YStack>
            <H1 fontSize="$7" fontWeight="600" color="$color12">
              Document Metadata Editor
            </H1>
            <Text fontSize="$3" color="$color10" mt="$1">
              Extracted:{' '}
              {new Date(document.extractionResult?.extractedAt || '').toLocaleString()}
            </Text>
          </YStack>
          <XStack alignItems="center" gap="$4">
            {unreviewedFieldsCount > 0 && (
              <XStack
                alignItems="center"
                paddingHorizontal="$3"
                paddingVertical="$1"
                backgroundColor="$red2"
                color="$red11"
                borderRadius={9999}
                fontSize="$3"
              >
                <AlertCircle size={16} mr="$1" />
                {unreviewedFieldsCount} field{unreviewedFieldsCount !== 1 ? 's' : ''} need review
              </XStack>
            )}
            {isEvaluating && (
              <XStack alignItems="center" color="$teal9" gap="$2">
                <Spinner size="small" color="$teal9" />
                <Text fontSize="$3">Evaluating compliance...</Text>
              </XStack>
            )}
            {document.complianceStatus && !isEvaluating && (
              <XStack
                alignItems="center"
                paddingHorizontal="$3"
                paddingVertical="$1"
                backgroundColor="$green2"
                color="$green11"
                borderRadius={9999}
                fontSize="$3"
              >
                <CheckCircle size={16} mr="$1" />
                {document.complianceStatus.status}
              </XStack>
            )}
            <Button
              onClick={handleSave}
              disabled={!validationResult.isValid || isSaving}
              paddingHorizontal="$4"
              paddingVertical="$2"
              borderRadius="$4"
              fontSize="$3"
              fontWeight="500"
              backgroundColor={
                validationResult.isValid && !isSaving ? '$teal9' : '$gray6'
              }
              color={validationResult.isValid && !isSaving ? 'white' : '$color10'}
              hoverStyle={{
                backgroundColor:
                  validationResult.isValid && !isSaving ? '$teal10' : '$gray6',
              }}
              disabledStyle={{
                cursor: 'not-allowed',
              }}
              gap="$2"
            >
              {isSaving ? (
                <>
                  <Spinner size="small" color="white" />
                  <Text>Saving...</Text>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <Text>Save & Re-evaluate</Text>
                </>
              )}
            </Button>
          </XStack>
        </XStack>
      </YStack>

      {/* Main Content */}
      <YStack flex={1} overflow="hidden">
        <XStack
          height="100%"
          flexWrap="wrap"
          $lg={{ flexWrap: 'nowrap' }}
          gap="$6"
          padding="$6"
        >
          {/* Left Panel: Document Preview */}
          <YStack flex={1} height="100%" overflow="auto" $lg={{ minWidth: '50%' }}>
            <DocumentPreview
              documentUrl={document.fileUrl}
              fileName={document.fileName}
              fileType={document.fileType}
            />
          </YStack>

          {/* Right Panel: Fields and Validation */}
          <YStack flex={1} height="100%" overflow="auto" gap="$6" $lg={{ minWidth: '50%' }}>
            {/* Filter Controls */}
            <Card
              backgroundColor="$background"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
              padding="$4"
            >
              <XStack alignItems="center" cursor="pointer">
                <Checkbox
                  checked={showOnlyFlagged}
                  onCheckedChange={(checked) => setShowOnlyFlagged(checked === true)}
                />
                <Text ml="$2" fontSize="$3" color="$color11">
                  Show only flagged fields ({flaggedFields.length})
                </Text>
              </XStack>
            </Card>

            {/* Validation Feedback */}
            <ValidationFeedback validationResult={validationResult} />

            {/* Fields */}
            <Card
              backgroundColor="$background"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
              padding="$6"
            >
              {renderFieldSection()}
            </Card>

            {/* Audit History */}
            <AuditHistoryPanel auditHistory={document.auditHistory} />
          </YStack>
        </XStack>
      </YStack>
    </YStack>
  );
};
