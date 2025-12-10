/**
 * Modal - Re-export from @unicornlove/ui
 *
 * Note: Uses ResponsiveModal from @unicornlove/ui internally
 * Provides backward-compatible props (isOpen, onClose) mapped to the new API
 */
import { ResponsiveModal, type ResponsiveModalProps } from '@unicornlove/ui';
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
  ...props
}: ModalProps) => {
  // Support both isOpen and open props for backward compatibility
  const modalOpen = open ?? isOpen ?? false;

  // Handle both onClose and onOpenChange callbacks
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
    if (!newOpen && onClose) {
      onClose();
    }
  };

  return (
    <ResponsiveModal
      open={modalOpen}
      onOpenChange={handleOpenChange}
      title={title}
      size={size}
    >
      {children}
    </ResponsiveModal>
  );
};

export default Modal;
export type { ModalProps };
