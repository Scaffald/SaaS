import React, { ReactNode } from 'react';

export interface ComponentShowcaseProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function ComponentShowcase({
  title,
  description,
  children,
  className = '',
}: ComponentShowcaseProps) {
  return (
    <div
      className={`bg-surface rounded-xl border border-border shadow-sm ${className}`}
      id={title.toLowerCase().replace(/\s+/g, '-')}
    >
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        {description && (
          <p className="text-sm text-text-secondary mt-1">{description}</p>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-center justify-center flex-wrap gap-4 p-8 bg-bg-secondary rounded-lg border border-border min-h-[120px]">
          {children}
        </div>
      </div>
    </div>
  );
}
