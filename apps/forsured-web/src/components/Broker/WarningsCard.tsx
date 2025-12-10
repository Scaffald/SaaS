import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';

interface WarningsCardProps {
  count: number;
  onClick?: () => void;
}

export default function WarningsCard({ count, onClick }: WarningsCardProps) {
  return (
    <div
      className="bg-surface rounded-lg border-2 border-warning-200 bg-warning-50 p-6 cursor-pointer hover:shadow-md transition-all duration-200"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-warning-100">
            <AlertTriangle className="text-warning-600" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-secondary">
              Warnings
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-3xl font-bold text-warning-600">
                {count}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight className="text-text-tertiary" size={20} />
      </div>
      <div className="mt-4">
        <p className="text-xs text-text-secondary">Suggestions and warnings</p>
      </div>
    </div>
  );
}
