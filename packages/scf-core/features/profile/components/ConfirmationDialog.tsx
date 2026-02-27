import {
  Modal,
  ModalHeader,
  ModalActions,
  ModalContent,
  Text,
} from "@scaffald/ui";

interface ConfirmationDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
}

/**
 * Simple confirmation dialog using scaffald-ui Modal primitives.
 * Replaces the old ConfirmationModal usage that expected dialog-style props.
 */
export function ConfirmationDialog({
  visible,
  onClose,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <Modal visible={visible} onClose={onClose}>
      <ModalHeader title={title} onClose={onClose} />
      <ModalContent>
        <Text>{message}</Text>
      </ModalContent>
      <ModalActions
        primaryAction={{ label: confirmLabel, onPress: onConfirm }}
        secondaryAction={{
          label: cancelLabel,
          onPress: onClose,
          variant: "outline",
          color: "gray",
        }}
      />
    </Modal>
  );
}
