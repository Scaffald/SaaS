import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Stack, Row, Text, H2, Input, Card } from '@scaffald/ui';
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

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    marginBottom: 8,
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: 'var(--color-background)',
  };

  const getInputBorderColor = (fieldName: string) => {
    return validationErrors[fieldName] ? 'var(--color-red-7)' : 'var(--color-border)';
  };

  return (
    <Stack
      style={{
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
        padding: 16,
      }}
    >
      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 12,
          padding: 24,
          maxWidth: 600,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 24 }}>
          <H2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}>
            {client ? 'Edit Client' : 'Add New Client'}
          </H2>
          <Button
            variant="ghost"
            onPress={onClose}
            aria-label="Close modal"
            style={{ padding: 8 }}
          >
            <X size={20} />
          </Button>
        </Row>

        {error && (
          <Card
            style={{
              backgroundColor: 'var(--color-red-3)',
              border: '1px solid var(--color-red-7)',
              padding: 12,
              marginBottom: 16,
              borderRadius: 8,
            }}
          >
            <Text size="sm" style={{ color: 'var(--color-red-11)' }}>
              {error}
            </Text>
          </Card>
        )}

        <Stack gap={16}>
          <Stack gap={8}>
            <label htmlFor="company_name" style={labelStyle}>
              Company Name *
            </label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, company_name: e.target.value }))
              }
              placeholder="Enter company name"
              style={{ ...inputStyle, borderColor: getInputBorderColor('company_name') }}
            />
            {validationErrors.company_name && (
              <Text size="xs" style={{ color: 'var(--color-red-11)' }}>
                {validationErrors.company_name}
              </Text>
            )}
          </Stack>

          <Stack gap={8}>
            <label htmlFor="contact_name" style={labelStyle}>
              Contact Name *
            </label>
            <Input
              id="contact_name"
              value={formData.contact_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contact_name: e.target.value }))
              }
              placeholder="Enter contact name"
              style={{ ...inputStyle, borderColor: getInputBorderColor('contact_name') }}
            />
            {validationErrors.contact_name && (
              <Text size="xs" style={{ color: 'var(--color-red-11)' }}>
                {validationErrors.contact_name}
              </Text>
            )}
          </Stack>

          <Stack gap={8}>
            <label htmlFor="contact_email" style={labelStyle}>
              Contact Email *
            </label>
            <Input
              id="contact_email"
              value={formData.contact_email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contact_email: e.target.value }))
              }
              placeholder="contact@company.com"
              style={{ ...inputStyle, borderColor: getInputBorderColor('contact_email') }}
            />
            {validationErrors.contact_email && (
              <Text size="xs" style={{ color: 'var(--color-red-11)' }}>
                {validationErrors.contact_email}
              </Text>
            )}
          </Stack>

          <Stack gap={8}>
            <label htmlFor="contact_phone" style={labelStyle}>
              Contact Phone
            </label>
            <Input
              id="contact_phone"
              value={formData.contact_phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))
              }
              placeholder="(555) 123-4567"
              style={{ ...inputStyle, borderColor: getInputBorderColor('contact_phone') }}
            />
            {validationErrors.contact_phone && (
              <Text size="xs" style={{ color: 'var(--color-red-11)' }}>
                {validationErrors.contact_phone}
              </Text>
            )}
          </Stack>

          <Stack gap={8}>
            <label htmlFor="client_type" style={labelStyle}>
              Client Type *
            </label>
            <select
              id="client_type"
              value={formData.client_type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  client_type: e.target.value as ClientType,
                }))
              }
              style={inputStyle}
            >
              <option value="general_contractor">General Contractor</option>
              <option value="subcontractor">Subcontractor</option>
            </select>
          </Stack>

          <Stack gap={8}>
            <label htmlFor="risk_level" style={labelStyle}>
              Risk Level
            </label>
            <select
              id="risk_level"
              value={formData.risk_level}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  risk_level: e.target.value as RiskLevel,
                }))
              }
              style={inputStyle}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Stack>

          <Stack gap={8}>
            <label htmlFor="notes" style={labelStyle}>
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Add any notes about this client..."
              rows={4}
              style={{
                ...inputStyle,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </Stack>
        </Stack>

        <Row gap={12} justifyContent="flex-end" style={{ marginTop: 24 }}>
          <Button variant="outlined" onPress={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving...' : client ? 'Update Client' : 'Add Client'}
          </Button>
        </Row>
      </Card>
    </Stack>
  );
}
