/**
 * Modal - Wrapper using Beyond UI Modal
 * Migrated from Tamagui to Beyond UI
 *
 * Provides backward-compatible props (isOpen, onClose) mapped to the new API
 */
import { Modal as BeyondModal, ModalHeader, ModalContent } from '@unicornlove/beyond-ui';
import type { ReactNode } from 'react';

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
  ...props
}: ModalProps) => {
  // Support both isOpen and open props for backward compatibility
  const modalOpen = open ?? isOpen ?? false;

  // Handle both onClose and onOpenChange callbacks
  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <BeyondModal
      open={modalOpen}
      onClose={handleClose}
      closeOnOverlayClick={closeOnOverlayClick}
    >
      {title && <ModalHeader title={title} onClose={handleClose} />}
      <ModalContent>{children}</ModalContent>
    </BeyondModal>
  );
};

export default Modal;
export type { ModalProps };
