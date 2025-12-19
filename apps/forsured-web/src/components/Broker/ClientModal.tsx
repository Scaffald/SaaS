import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { YStack, XStack, Text, H2, Input, Card, Label } from '@unicornlove/ui';
import { BrokerClient, ClientType, RiskLevel } from '../../types';
import Button from '../Common/Button';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Partial<BrokerClient>) => Promise<void>;
  client?: BrokerClient;
}

export default function ClientModal({
  isOpen,
  onClose,
  onSave,
  client,
}: ClientModalProps) {
  const [formData, setFormData] = useState<Partial<BrokerClient>>({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    client_type: 'general_contractor',
    risk_level: 'medium',
    status: 'active',
    notes: '',
    compliance_score: 0,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (client) {
      setFormData({
        company_name: client.company_name,
        contact_name: client.contact_name,
        contact_email: client.contact_email,
        contact_phone: client.contact_phone || '',
        client_type: client.client_type,
        risk_level: client.risk_level,
        status: client.status,
        notes: client.notes || '',
        compliance_score: client.compliance_score || 0,
      });
    } else {
      setFormData({
        company_name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        client_type: 'general_contractor',
        risk_level: 'medium',
        status: 'active',
        notes: '',
        compliance_score: 0,
      });
    }
    setError(null);
    setValidationErrors({});
  }, [client, isOpen]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.company_name?.trim()) {
      errors.company_name = 'Company name is required';
    }

    if (!formData.contact_name?.trim()) {
      errors.contact_name = 'Contact name is required';
    }

    if (!formData.contact_email?.trim()) {
      errors.contact_email = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      errors.contact_email = 'Invalid email format';
    }

    if (formData.contact_phone && !/^[\d\s\-\(\)\+]+$/.test(formData.contact_phone)) {
      errors.contact_phone = 'Invalid phone number format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('[ClientModal] Error saving client:', err);
      setError(err instanceof Error ? err.message : 'Failed to save client');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <YStack
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="rgba(0, 0, 0, 0.5)"
      alignItems="center"
      justifyContent="center"
      zIndex={1000}
      padding="$4"
    >
      <Card
        backgroundColor="$background"
        borderRadius="$4"
        padding="$6"
        maxWidth={600}
        width="100%"
        maxHeight="90vh"
        overflow="auto"
      >
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
          <H2 fontSize="$6" fontWeight="600" color="$color12">
            {client ? 'Edit Client' : 'Add New Client'}
          </H2>
          <Button
            variant="ghost"
            size="sm"
            onPress={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </Button>
        </XStack>

        {error && (
          <Card
            backgroundColor="$red3"
            borderColor="$red7"
            borderWidth={1}
            padding="$3"
            marginBottom="$4"
            borderRadius="$3"
          >
            <Text color="$red11" fontSize="$3">
              {error}
            </Text>
          </Card>
        )}

        <YStack gap="$4">
          <YStack gap="$2">
            <Label htmlFor="company_name" color="$color11" fontSize="$3" fontWeight="500">
              Company Name *
            </Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, company_name: text }))
              }
              placeholder="Enter company name"
              borderColor={validationErrors.company_name ? '$red7' : '$borderColor'}
            />
            {validationErrors.company_name && (
              <Text color="$red11" fontSize="$2">
                {validationErrors.company_name}
              </Text>
            )}
          </YStack>

          <YStack gap="$2">
            <Label htmlFor="contact_name" color="$color11" fontSize="$3" fontWeight="500">
              Contact Name *
            </Label>
            <Input
              id="contact_name"
              value={formData.contact_name}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, contact_name: text }))
              }
              placeholder="Enter contact name"
              borderColor={validationErrors.contact_name ? '$red7' : '$borderColor'}
            />
            {validationErrors.contact_name && (
              <Text color="$red11" fontSize="$2">
                {validationErrors.contact_name}
              </Text>
            )}
          </YStack>

          <YStack gap="$2">
            <Label htmlFor="contact_email" color="$color11" fontSize="$3" fontWeight="500">
              Contact Email *
            </Label>
            <Input
              id="contact_email"
              value={formData.contact_email}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, contact_email: text }))
              }
              placeholder="contact@company.com"
              borderColor={validationErrors.contact_email ? '$red7' : '$borderColor'}
            />
            {validationErrors.contact_email && (
              <Text color="$red11" fontSize="$2">
                {validationErrors.contact_email}
              </Text>
            )}
          </YStack>

          <YStack gap="$2">
            <Label htmlFor="contact_phone" color="$color11" fontSize="$3" fontWeight="500">
              Contact Phone
            </Label>
            <Input
              id="contact_phone"
              value={formData.contact_phone}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, contact_phone: text }))
              }
              placeholder="(555) 123-4567"
              borderColor={validationErrors.contact_phone ? '$red7' : '$borderColor'}
            />
            {validationErrors.contact_phone && (
              <Text color="$red11" fontSize="$2">
                {validationErrors.contact_phone}
              </Text>
            )}
          </YStack>

          <YStack gap="$2">
            <Label htmlFor="client_type" color="$color11" fontSize="$3" fontWeight="500">
              Client Type *
            </Label>
            <XStack
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              overflow="hidden"
            >
              <select
                id="client_type"
                value={formData.client_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    client_type: e.target.value as ClientType,
                  }))
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  color: 'var(--color12)',
                }}
              >
                <option value="general_contractor">General Contractor</option>
                <option value="subcontractor">Subcontractor</option>
              </select>
            </XStack>
          </YStack>

          <YStack gap="$2">
            <Label htmlFor="risk_level" color="$color11" fontSize="$3" fontWeight="500">
              Risk Level
            </Label>
            <XStack
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              overflow="hidden"
            >
              <select
                id="risk_level"
                value={formData.risk_level}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    risk_level: e.target.value as RiskLevel,
                  }))
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  color: 'var(--color12)',
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </XStack>
          </YStack>

          <YStack gap="$2">
            <Label htmlFor="notes" color="$color11" fontSize="$3" fontWeight="500">
              Notes
            </Label>
            <XStack
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              overflow="hidden"
            >
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Add any notes about this client..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  color: 'var(--color12)',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </XStack>
          </YStack>
        </YStack>

        <XStack gap="$3" marginTop="$6" justifyContent="flex-end">
          <Button variant="outlined" onPress={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving...' : client ? 'Update Client' : 'Add Client'}
          </Button>
        </XStack>
      </Card>
    </YStack>
  );
}
