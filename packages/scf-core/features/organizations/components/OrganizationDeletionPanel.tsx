import { useToast, useThemeContext } from "@scaffald/ui";
import { useRequestOrganizationDeletionMutation } from "@scf/core/utils/account-deletion-sdk-hooks";
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
import { colors } from "@scaffald/ui/tokens";

type OrganizationDeletionPanelProps = {
  organizationId: string;
};

export function OrganizationDeletionPanel({
  organizationId,
}: OrganizationDeletionPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const toast = useToast();
  const { theme } = useThemeContext();

  const deletionMutation = useRequestOrganizationDeletionMutation({
    onSuccess: () => {
      toast.show({
        title: "Organization deletion requested",
        message:
          "The organization deletion request has been submitted. All members will be notified.",
        duration: 5000,
      });
      setIsOpen(false);
      setReason("");
      setConfirmText("");
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
        message: 'Please type "DELETE" to confirm organization deletion.',
        variant: "error",
      });
      return;
    }

    deletionMutation.mutate({
      organizationId,
      reason: reason || undefined,
    });
  };

  return (
    <Card
      variant="outlined"
      style={{
        borderColor: theme === "light" ? colors.error[300] : colors.error[700],
        backgroundColor:
          theme === "light" ? colors.error[50] : colors.error[900],
      }}
      padding="md"
    >
      <Stack gap={12}>
        <Row align="center" gap={8}>
          <AlertTriangle
            color={theme === "light" ? colors.error[700] : colors.error[300]}
            size={20}
          />
          <Text
            style={{
              color: theme === "light" ? colors.error[700] : colors.error[300],
            }}
          >
            Delete Organization
          </Text>
        </Row>

        <Text style={{ color: colors.text[theme].secondary }}>
          Permanently delete this organization and all associated data. This
          action cannot be undone.
        </Text>

        <Text style={{ color: colors.text[theme].secondary }}>
          • All payment data will be anonymized • All payment methods will be
          removed from Stripe • Organization members will lose access • All jobs
          and applications will be archived
        </Text>

        <Button
          variant="outline"
          style={{
            borderColor:
              theme === "light" ? colors.error[300] : colors.error[700],
          }}
          color="error"
          iconStart={Trash2}
          onPress={() => setIsOpen(true)}
        >
          Request Organization Deletion
        </Button>

        <Modal visible={isOpen} onClose={() => setIsOpen(false)} width={500}>
          <ModalHeader
            title="Delete This Organization?"
            onClose={() => setIsOpen(false)}
          />
          <ModalContent>
            <Stack gap={16}>
              <Text
                style={{
                  color:
                    theme === "light" ? colors.error[700] : colors.error[300],
                }}
              >
                This action cannot be undone. All organization data will be
                permanently deleted or anonymized.
              </Text>

              <Stack gap={8}>
                <Text>Reason (optional)</Text>
                <TextArea
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Help us improve by sharing why you're deleting this organization..."
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
                      confirmText === "DELETE"
                        ? theme === "light"
                          ? colors.green[300]
                          : colors.green[700]
                        : theme === "light"
                        ? colors.error[300]
                        : colors.error[700],
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
                : "Delete Organization",
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
