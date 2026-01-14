// src/components/admin/EnumEditor.tsx
import React, { useState, useEffect } from 'react';
import { Stack, Row, Text, H3, Card, Button, Input, Label } from '@unicornlove/beyond-ui';

interface EnumValue {
  id: string;
  enum_type: string;
  value: string;
  display_name: string;
  sort_order: number;
  is_active: boolean;
}

interface EnumEditorProps {
  enumValue?: EnumValue;
  onSubmit: (data: Partial<EnumValue>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function EnumEditor({ enumValue, onSubmit, onCancel, isLoading = false }: EnumEditorProps) {
  const [value, setValue] = useState(enumValue?.value || '');
  const [displayName, setDisplayName] = useState(enumValue?.display_name || '');
  const [sortOrder, setSortOrder] = useState(enumValue?.sort_order || 0);
  const [isActive, setIsActive] = useState(enumValue?.is_active || true);

  useEffect(() => {
    if (enumValue) {
      setValue(enumValue.value);
      setDisplayName(enumValue.display_name);
      setSortOrder(enumValue.sort_order);
      setIsActive(enumValue.is_active);
    }
  }, [enumValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ value, display_name: displayName, sort_order: sortOrder, is_active: isActive });
  };

  return (
    <Card style={{ padding: 16, borderWidth: 1, borderRadius: 12, backgroundColor: 'var(--color-background)' }}>
      <H3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{enumValue ? 'Edit Enum Value' : 'Add New Enum Value'}</H3>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 16 }}>
          <Stack style={{ gap: 8 }}>
            <Label>Value</Label>
            <Input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              disabled={!!enumValue}
            />
          </Stack>
          <Stack style={{ gap: 8 }}>
            <Label>Display Name</Label>
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </Stack>
          <Stack style={{ gap: 8 }}>
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={sortOrder.toString()}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              required
            />
          </Stack>
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <Label>Is Active</Label>
          </Row>
          <Row style={{ justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="outlined" onPress={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {enumValue ? 'Save Changes' : 'Add Value'}
            </Button>
          </Row>
        </Stack>
      </form>
    </Card>
  );
}

export default EnumEditor;
