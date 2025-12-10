/**
 * AuditHistoryPanel Component (REQ-167)
 * Displays audit trail of field changes
 */

import React, { useState } from 'react';
import { AuditEntry } from '../../types/ocr.types';
import { History, ChevronDown, ChevronUp } from 'lucide-react';

interface AuditHistoryPanelProps {
  auditHistory: AuditEntry[];
}

export const AuditHistoryPanel: React.FC<AuditHistoryPanelProps> = ({ auditHistory }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatValue = (value: string | number | unknown[] | unknown): string => {
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (auditHistory.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center text-gray-500">
          <History className="h-5 w-5 mr-2" />
          <span className="text-sm">No audit history</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="audit-history-content"
      >
        <div className="flex items-center">
          <History className="h-5 w-5 text-gray-500 mr-2" />
          <span className="text-sm font-medium text-gray-900">
            Audit History ({auditHistory.length} {auditHistory.length === 1 ? 'entry' : 'entries'})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div id="audit-history-content" className="border-t border-gray-200">
          <div className="max-h-96 overflow-y-auto">
            {auditHistory.map((entry) => (
              <div
                key={entry.id}
                className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{entry.fieldName}</p>
                    <div className="mt-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">From:</span>{' '}
                        <span className="text-red-600">{formatValue(entry.oldValue)}</span>
                      </p>
                      <p>
                        <span className="font-medium">To:</span>{' '}
                        <span className="text-green-600">{formatValue(entry.newValue)}</span>
                      </p>
                    </div>
                    <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500">
                      <span>
                        <span className="font-medium">Changed by:</span> {entry.changedBy}
                      </span>
                      <span>
                        <span className="font-medium">Confidence:</span> {entry.confidenceAtEdit}%
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-400">{formatDate(entry.changedAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
