/**
 * SimpleModal - A reliable, accessible modal component
 *
 * This modal uses simple DOM elements instead of React Native Modal,
 * avoiding issues with focus trap re-renders and touch event conflicts.
 *
 * Features:
 * - Works reliably on both web (mouse) and mobile (touch)
 * - Escape key to close
 * - Click outside to close (configurable)
 * - Focus trap for accessibility
 * - Proper ARIA attributes
 * - Smooth animations
 *
 * @example
 * ```tsx
 * <SimpleModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="My Modal"
 *   description="Optional description"
 * >
 *   <p>Modal content here</p>
 * </SimpleModal>
 * ```
 */

import { useEffect, useRef, useCallback, type ReactNode, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import { Stack, Row, Text } from '@scaffald/ui';

export interface SimpleModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal description (shown below title) */
  description?: string;
  /** Icon to show next to title */
  icon?: ReactNode;
  /** Modal content */
  children: ReactNode;
  /** Width of the modal (default: 520) */
  width?: number | string;
  /** Whether clicking outside closes the modal (default: true) */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes the modal (default: true) */
  closeOnEscape?: boolean;
  /** Whether to show the close button in header (default: true) */
  showCloseButton?: boolean;
  /** Footer content (buttons, etc.) */
  footer?: ReactNode;
  /** Test ID for testing */
  testID?: string;
}

// Get all focusable elements within a container
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)) as HTMLElement[];
}

export function SimpleModal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  width = 520,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  footer,
  testID,
}: SimpleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus trap and focus management
  useEffect(() => {
    if (!isOpen) return;

    // Store previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element in modal
    const focusFirst = () => {
      if (modalRef.current) {
        const focusables = getFocusableElements(modalRef.current);
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          // Focus the modal itself if no focusable elements
          modalRef.current.focus();
        }
      }
    };

    // Small delay to ensure modal is rendered
    const timeoutId = setTimeout(focusFirst, 10);

    // Handle tab key for focus trap
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !modalRef.current) return;

      const focusables = getFocusableElements(modalRef.current);
      if (focusables.length === 0) return;

      const firstElement = focusables[0];
      const lastElement = focusables[focusables.length - 1];

      if (event.shiftKey) {
        // Shift+Tab: if on first element, go to last
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element, go to first
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('keydown', handleKeyDown);

      // Return focus to previously focused element
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      // Only close if clicking directly on the backdrop, not on modal content
      if (closeOnBackdropClick && event.target === event.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdropClick, onClose]
  );

  // Handle backdrop touch (for mobile)
  const handleBackdropTouch = useCallback(
    (event: React.TouchEvent) => {
      // Only close if touching directly on the backdrop, not on modal content
      if (closeOnBackdropClick && event.target === event.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdropClick, onClose]
  );

  // Prevent clicks/touches on modal content from propagating to backdrop
  const handleContentClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  const handleContentTouch = useCallback((event: React.TouchEvent) => {
    event.stopPropagation();
  }, []);

  if (!isOpen) return null;

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
    // Animation
    animation: 'simpleModalFadeIn 150ms ease-out',
  };

  const modalStyle: CSSProperties = {
    backgroundColor: 'var(--color-surface, var(--color-background, white))',
    borderRadius: 16,
    width: typeof width === 'number' ? `${width}px` : width,
    maxWidth: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    border: '1px solid var(--color-border, #e5e5e5)',
    // Animation
    animation: 'simpleModalScaleIn 150ms ease-out',
  };

  const headerStyle: CSSProperties = {
    padding: '20px 24px',
    borderBottom: '1px solid var(--color-border, #e5e5e5)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    backgroundColor: 'inherit',
  };

  const closeButtonStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 8,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-muted)',
    transition: 'background-color 150ms',
  };

  const contentStyle: CSSProperties = {
    padding: 24,
    backgroundColor: 'inherit',
  };

  const footerStyle: CSSProperties = {
    padding: '16px 24px',
    borderTop: '1px solid var(--color-border, #e5e5e5)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    backgroundColor: 'inherit',
  };

  return (
    <>
      {/* CSS animation keyframes */}
      <style>
        {`
          @keyframes simpleModalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes simpleModalScaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}
      </style>

      {/* Overlay/Backdrop */}
      <div
        style={overlayStyle}
        onClick={handleBackdropClick}
        onTouchEnd={handleBackdropTouch}
        data-testid={testID ? `${testID}-overlay` : undefined}
      >
        {/* Modal Content */}
        <div
          ref={modalRef}
          style={modalStyle}
          onClick={handleContentClick}
          onTouchEnd={handleContentTouch}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? `${testID || 'modal'}-title` : undefined}
          aria-describedby={description ? `${testID || 'modal'}-description` : undefined}
          tabIndex={-1}
          data-testid={testID}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div style={headerStyle}>
              <Row alignItems="center" gap={12} style={{ flex: 1 }}>
                {icon && (
                  <div style={{ flexShrink: 0 }}>
                    {icon}
                  </div>
                )}
                <Stack gap={4} style={{ flex: 1 }}>
                  {title && (
                    <Text
                      id={`${testID || 'modal'}-title`}
                      size="lg"
                      weight="bold"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {title}
                    </Text>
                  )}
                  {description && (
                    <Text
                      id={`${testID || 'modal'}-description`}
                      size="sm"
                      muted
                    >
                      {description}
                    </Text>
                  )}
                </Stack>
              </Row>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  style={closeButtonStyle}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div style={contentStyle}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div style={footerStyle}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default SimpleModal;
