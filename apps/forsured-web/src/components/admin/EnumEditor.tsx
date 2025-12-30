// src/components/admin/EnumEditor.tsx
import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, H3, Card, Button, Input, Label } from '@unicornlove/ui';

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
    <Card padding="$4" borderWidth={1} borderRadius="$4" elevation={1} backgroundColor="$background">
      <H3 fontSize="$6" fontWeight="600" mb="$4">{enumValue ? 'Edit Enum Value' : 'Add New Enum Value'}</H3>
      <form onSubmit={handleSubmit}>
        <YStack gap="$4">
          <YStack gap="$2">
            <Label>Value</Label>
            <Input
              type="text"
              value={value}
              onChangeText={setValue}
              required
              disabled={!!enumValue}
            />
          </YStack>
          <YStack gap="$2">
            <Label>Display Name</Label>
            <Input
              type="text"
              value={displayName}
              onChangeText={setDisplayName}
              required
            />
          </YStack>
          <YStack gap="$2">
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={sortOrder.toString()}
              onChangeText={(val) => setSortOrder(parseInt(val) || 0)}
              required
            />
          </YStack>
          <XStack alignItems="center" gap="$2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <Label>Is Active</Label>
          </XStack>
          <XStack justifyContent="flex-end" gap="$2">
            <Button variant="outlined" onPress={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {enumValue ? 'Save Changes' : 'Add Value'}
            </Button>
          </XStack>
        </YStack>
      </form>
    </Card>
  );
}

export default EnumEditor;
