/**
 * ConnectionDialog - Scaffald connection dialog using Tamagui
 */
import React from 'react';
import { YStack, XStack, Text } from '@unicornlove/ui';
import { Modal } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';
import { X } from 'lucide-react';

interface ConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (companyId: string) => void;
  onCreateNew: () => void;
  scaffaldCompany?: {
    id: string;
    name: string;
    address: string;
    memberSince: string;
  };
  isLoading?: boolean;
}

function ConnectionDialog({
  isOpen,
  onClose,
  onConnect,
  onCreateNew,
  scaffaldCompany,
  isLoading = false,
}: ConnectionDialogProps) {
  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Connect Your Scaffald Company"
      size="medium"
    >
      <YStack gap="$4">
        {scaffaldCompany && (
          <YStack
            backgroundColor="$blue2"
            padding="$4"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$blue6"
            gap="$2"
          >
            <Text fontSize="$2" color="$blue11" mb="$2">
              We found a company associated with your Scaffald account:
            </Text>
            <XStack alignItems="center" gap="$2">
              <Text role="img" aria-label="company" fontSize="$6">🏢</Text>
              <YStack>
                <Text fontWeight="600">{scaffaldCompany.name}</Text>
                <Text fontSize="$1" color="$color10">
                  {scaffaldCompany.address}
                </Text>
                <Text fontSize="$1" color="$color10">
                  Member since: {scaffaldCompany.memberSince}
                </Text>
              </YStack>
            </XStack>
          </YStack>
        )}

        <Text mb="$4">Connecting this company will:</Text>
        <YStack gap="$2" mb="$6" paddingLeft="$4">
          <Text fontSize="$2" color="$color11">• Import your existing projects</Text>
          <Text fontSize="$2" color="$color11">• Sync contractor relationships</Text>
          <Text fontSize="$2" color="$color11">• Share compliance data</Text>
        </YStack>

        <XStack justifyContent="flex-end" gap="$3">
          <CoreButton
            variant="secondary"
            onPress={onCreateNew}
            disabled={isLoading}
          >
            Create New Company Instead
          </CoreButton>
          <CoreButton
            variant="primary"
            onPress={() => scaffaldCompany && onConnect(scaffaldCompany.id)}
            disabled={isLoading || !scaffaldCompany}
          >
            Connect This Company
          </CoreButton>
        </XStack>
      </YStack>
    </Modal>
  );
}

export default ConnectionDialog;
