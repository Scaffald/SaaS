import { useToast } from "@scaffald/ui";
import { useRequestWorkerDeletionMutation } from "@scf/core/utils/account-deletion-sdk-hooks";
import { AlertTriangle, Trash2 } from "lucide-react-native";
import { useState } from "react";
import {
  Button,
  Card,
  Input,
  Modal,
  ModalHeader,
  ModalContent,
  ModalActions,
  Text,
  TextArea,
  Row,
  Stack,
} from "@scaffald/ui";

export function AccountDeletionPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const toast = useToast();

  const deletionMutation = useRequestWorkerDeletionMutation({
    onSuccess: () => {
      toast.show({
        title: "Account deletion requested",
        message:
          "Your account deletion request has been submitted. You will be logged out shortly.",
        duration: 5000,
      });
      setIsOpen(false);
      setReason("");
      setConfirmText("");
      // In production, redirect to logout or show confirmation page
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: "Deletion request failed",
        message:
          error.message ||
          "Failed to submit deletion request. Please try again.",
        variant: "error",
      });
    },
  });

  const handleDelete = () => {
    if (confirmText !== "DELETE") {
      toast.show({
        title: "Confirmation required",
        message: 'Please type "DELETE" to confirm account deletion.',
        variant: "error",
      });
      return;
    }

    deletionMutation.mutate({
      reason: reason || undefined,
    });
  };

  return (
    <Card
      variant="outlined"
      padding="md"
      style={{ borderColor: "#fca5a5", backgroundColor: "#fef2f2" }}
    >
      <Stack gap={12}>
        <Row align="center" gap={8}>
          <AlertTriangle color="#ef4444" size={20} />
          <Text style={{ color: "#ef4444" }}>Delete Account</Text>
        </Row>

        <Text style={{ color: "#414e62" }}>
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </Text>

        <Text style={{ color: "#414e62" }}>
          • All payment data will be anonymized • Your profile will be removed •
          You will lose access to all organizations and teams
        </Text>

        <Button
          variant="outline"
          style={{ borderColor: "#f87171" }}
          color="error"
          iconStart={Trash2}
          onPress={() => setIsOpen(true)}
        >
          Request Account Deletion
        </Button>

        <Modal visible={isOpen} onClose={() => setIsOpen(false)} width={500}>
          <ModalHeader
            title="Delete Your Account?"
            onClose={() => setIsOpen(false)}
          />
          <ModalContent>
            <Stack gap={16}>
              <Text style={{ color: "#414e62" }}>
                This action cannot be undone. All your data will be permanently
                deleted or anonymized.
              </Text>

              <Stack gap={8}>
                <Text>Reason (optional)</Text>
                <TextArea
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Help us improve by sharing why you're deleting your account..."
                  style={{ minHeight: 80 }}
                />
              </Stack>

              <Stack gap={8}>
                <Text>Type "DELETE" to confirm</Text>
                <Input
                  value={confirmText}
                  onChangeText={setConfirmText}
                  placeholder="DELETE"
                  style={{
                    borderColor:
                      confirmText === "DELETE" ? "#86efac" : "#f87171",
                  }}
                />
              </Stack>
            </Stack>
          </ModalContent>
          <ModalActions
            orientation="right"
            secondaryAction={{
              label: "Cancel",
              onPress: () => {
                setIsOpen(false);
                setConfirmText("");
                setReason("");
              },
              disabled: deletionMutation.isPending,
            }}
            primaryAction={{
              label: deletionMutation.isPending
                ? "Deleting..."
                : "Delete Account",
              onPress: handleDelete,
              disabled: confirmText !== "DELETE" || deletionMutation.isPending,
              color: "error",
            }}
          />
        </Modal>
      </Stack>
    </Card>
  );
}
