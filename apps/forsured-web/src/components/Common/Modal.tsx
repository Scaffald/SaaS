/**
 * Modal - Wrapper using Beyond UI Modal
 * Migrated from Tamagui to Beyond UI
 *
 * Features:
 * - Backward-compatible props (isOpen, onClose) mapped to the new API
 * - Focus trap for accessibility (keyboard users stay within modal)
 * - Smooth entrance/exit animations
 * - Escape key to close
 */
import { useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  Modal as BeyondModal,
  ModalHeader,
  ModalContent,
  useFocusTrap,
  FadeTransition,
  ScaleTransition,
} from '@unicornlove/beyond-ui';

export interface ModalProps {
  /** Whether the modal is open (alias for 'open' prop) */
  isOpen?: boolean;
  /** Whether the modal is open */
  open?: boolean;
  /** Callback when modal should close */
  onClose?: () => void;
  /** Callback when modal open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Modal title displayed in header */
  title?: string;
  /** Modal content */
  children: ReactNode;
  /** Size variant */
  size?: 'small' | 'medium' | 'large' | 'full';
  /** Whether to close on overlay click (mapped to onOpenChange) */
  closeOnOverlayClick?: boolean;
  /** Disable animations (for reduced motion preference) */
  disableAnimations?: boolean;
}

const Modal = ({
  isOpen,
  open,
  onClose,
  onOpenChange,
  title = '',
  children,
  size = 'medium',
  closeOnOverlayClick = true,
  disableAnimations = false,
}: ModalProps) => {
  // Support both isOpen and open props for backward compatibility
  const modalOpen = open ?? isOpen ?? false;

  // Handle both onClose and onOpenChange callbacks
  const handleClose = useCallback(() => {
    if (onOpenChange) {
      onOpenChange(false);
    }
    if (onClose) {
      onClose();
    }
  }, [onOpenChange, onClose]);

  // Focus trap for accessibility - keeps focus within modal when open
  const { containerRef } = useFocusTrap({
    active: modalOpen,
    returnFocusOnDeactivate: true,
  });

  // Handle Escape key to close modal
  useEffect(() => {
    if (!modalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, handleClose]);

  // Don't render anything if modal is closed (for animation purposes we still render the wrapper)
  if (!modalOpen && disableAnimations) {
    return null;
  }

  const modalContent = (
    <BeyondModal
      open={modalOpen}
      onClose={handleClose}
      closeOnOverlayClick={closeOnOverlayClick}
    >
      <div ref={containerRef as React.RefObject<HTMLDivElement>}>
        {title && <ModalHeader title={title} onClose={handleClose} />}
        <ModalContent>{children}</ModalContent>
      </div>
    </BeyondModal>
  );

  // Return with animations unless disabled
  if (disableAnimations) {
    return modalContent;
  }

  return (
    <FadeTransition visible={modalOpen} duration="fast" unmountOnHide={false}>
      <ScaleTransition visible={modalOpen} fromScale={0.95} unmountOnHide={false}>
        {modalContent}
      </ScaleTransition>
    </FadeTransition>
  );
};

export default Modal;
export type { ModalProps };
