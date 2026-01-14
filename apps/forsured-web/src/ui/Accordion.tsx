/**
 * Accordion wrapper - migrated from Tamagui to Beyond UI
 * Provides backwards-compatible API for existing code
 *
 * Note: Beyond UI uses compound components pattern, but this wrapper
 * maintains the items array API for backwards compatibility.
 */
import React, { ReactNode } from 'react';
import {
  Accordion as BeyondAccordion,
  type AccordionMode,
  type AccordionValue,
} from '@unicornlove/beyond-ui';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

export default function Accordion({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className = '',
}: AccordionProps) {
  // Map our props to Beyond UI's props
  const mode: AccordionMode = allowMultiple ? 'multiple' : 'single';
  const defaultValue: AccordionValue = allowMultiple
    ? defaultOpen
    : defaultOpen[0] || '';

  return (
    <BeyondAccordion mode={mode} defaultValue={defaultValue}>
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <BeyondAccordion.Item
            key={item.id}
            value={item.id}
            disabled={item.disabled}
          >
            <BeyondAccordion.Trigger icon={Icon ? <Icon size={20} /> : undefined}>
              {item.title}
            </BeyondAccordion.Trigger>
            <BeyondAccordion.Content>{item.content}</BeyondAccordion.Content>
          </BeyondAccordion.Item>
        );
      })}
    </BeyondAccordion>
  );
}
