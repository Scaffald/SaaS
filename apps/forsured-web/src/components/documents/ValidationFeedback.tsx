/**
 * ValidationFeedback Component (REQ-167)
 * Displays real-time validation feedback for OCR fields
 */

import React from 'react';
import { ValidationResult } from '../../types/ocr.types';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface ValidationFeedbackProps {
  validationResult: ValidationResult | null;
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({ validationResult }) => {
  if (!validationResult) {
    return null;
  }

  const { isValid, errors, warnings } = validationResult;

  // Success state: valid with no warnings
  if (isValid && warnings.length === 0) {
    return (
      <div
        data-testid="success-section"
        className="rounded-md bg-green-50 p-4 border border-green-200"
        role="alert"
      >
        <div className="flex">
          <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">All fields are valid</h3>
            <p className="text-sm text-green-700 mt-1">
              You can save these changes and trigger compliance re-evaluation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Errors Section */}
      {errors.length > 0 && (
        <div
          data-testid="error-section"
          className="rounded-md bg-red-50 p-4 border border-red-200"
          role="alert"
          aria-live="polite"
        >
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {errors.length} {errors.length === 1 ? 'error' : 'errors'} found
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc space-y-1 pl-5">
                  {errors.map((error, index) => (
                    <li key={`${error.field}-${index}`}>{error.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div
          data-testid="warning-section"
          className="rounded-md bg-yellow-50 p-4 border border-yellow-200"
          role="alert"
          aria-live="polite"
        >
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                {warnings.length} {warnings.length === 1 ? 'warning' : 'warnings'}
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc space-y-1 pl-5">
                  {warnings.map((warning, index) => (
                    <li key={`${warning.field}-${index}`}>{warning.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
