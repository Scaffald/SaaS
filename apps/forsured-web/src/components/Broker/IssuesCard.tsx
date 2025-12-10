import React from 'react';
import { XCircle, ChevronRight } from 'lucide-react';

interface IssuesCardProps {
  count: number;
  onClick?: () => void;
}

export default function IssuesCard({ count, onClick }: IssuesCardProps) {
  return (
    <div
      className="bg-surface rounded-lg border-2 border-error-200 bg-error-50 p-6 cursor-pointer hover:shadow-md transition-all duration-200"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-error-100">
            <XCircle className="text-error-600" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-secondary">
              Critical Issues
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-3xl font-bold text-error-600">{count}</span>
            </div>
          </div>
        </div>
        <ChevronRight className="text-text-tertiary" size={20} />
      </div>
      <div className="mt-4">
        <p className="text-xs text-text-secondary">Policy issues to address</p>
      </div>
    </div>
  );
}
