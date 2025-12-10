/**
 * OCRFieldDisplay Component (REQ-167)
 * Displays OCR extracted field with confidence indicator and edit capability
 */

import React from 'react';
import { OCRField } from '../../types/ocr.types';

interface OCRFieldDisplayProps {
  label: string;
  field: OCRField<string>;
  onChange: (value: string) => void;
  onRevert?: () => void;
  error?: string;
  disabled?: boolean;
  type?: 'text' | 'date' | 'number';
}

export const OCRFieldDisplay: React.FC<OCRFieldDisplayProps> = ({
  label,
  field,
  onChange,
  onRevert,
  error,
  disabled = false,
  type = 'text',
}) => {
  const getConfidenceColor = () => {
    if (field.confidence.level === 'high') return 'bg-green-100 text-green-800';
    if (field.confidence.level === 'medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceBorderColor = () => {
    if (field.confidence.level === 'high') return 'border-green-300';
    if (field.confidence.level === 'medium') return 'border-yellow-300';
    return 'border-red-300';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {field.reviewRequired && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              Review Required
            </span>
          )}
          {field.edited && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              Edited
            </span>
          )}
        </label>
        <div
          data-testid="confidence-indicator"
          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getConfidenceColor()}`}
        >
          {field.confidence.score}%
        </div>
      </div>

      <input
        type={type}
        value={field.value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`block w-full rounded-md shadow-sm sm:text-sm
          ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : `border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${getConfidenceBorderColor()}`}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          border-2 px-3 py-2`}
        aria-label={label}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${label}-error` : undefined}
      />

      {error && (
        <p id={`${label}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}

      {field.edited && onRevert && (
        <button
          type="button"
          onClick={onRevert}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
          disabled={disabled}
        >
          Revert to Original
        </button>
      )}
    </div>
  );
};
