/**
 * ConnectionDialog - Scaffald connection dialog using Beyond UI
 */
import React from 'react';
import { Stack, Row, Text, Modal, Button } from '@scaffald/ui';

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
      <Stack style={{ gap: '16px' }}>
        {scaffaldCompany && (
          <Stack
            style={{
              backgroundColor: 'var(--color-blue-2)',
              padding: '16px',
              borderRadius: '8px',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--color-blue-6)',
              gap: '8px',
            }}
          >
            <Text style={{ fontSize: '14px', color: 'var(--color-blue-11)', marginBottom: '8px' }}>
              We found a company associated with your Scaffald account:
            </Text>
            <Row style={{ alignItems: 'center', gap: '8px' }}>
              <Text role="img" aria-label="company" style={{ fontSize: '24px' }}>🏢</Text>
              <Stack>
                <Text style={{ fontWeight: 600 }}>{scaffaldCompany.name}</Text>
                <Text style={{ fontSize: '12px', color: 'var(--color-10)' }}>
                  {scaffaldCompany.address}
                </Text>
                <Text style={{ fontSize: '12px', color: 'var(--color-10)' }}>
                  Member since: {scaffaldCompany.memberSince}
                </Text>
              </Stack>
            </Row>
          </Stack>
        )}

        <Text style={{ marginBottom: '16px' }}>Connecting this company will:</Text>
        <Stack style={{ gap: '8px', marginBottom: '24px', paddingLeft: '16px' }}>
          <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>• Import your existing projects</Text>
          <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>• Sync contractor relationships</Text>
          <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>• Share compliance data</Text>
        </Stack>

        <Row style={{ justifyContent: 'flex-end', gap: '12px' }}>
          <Button
            variant="secondary"
            onPress={onCreateNew}
            disabled={isLoading}
          >
            Create New Company Instead
          </Button>
          <Button
            variant="primary"
            onPress={() => scaffaldCompany && onConnect(scaffaldCompany.id)}
            disabled={isLoading || !scaffaldCompany}
          >
            Connect This Company
          </Button>
        </Row>
      </Stack>
    </Modal>
  );
}

export default ConnectionDialog;
