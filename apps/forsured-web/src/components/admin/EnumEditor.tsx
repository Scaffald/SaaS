// src/components/admin/EnumEditor.tsx
import React, { useState, useEffect } from 'react';
// import { Button, Input as TextInput, Checkbox } from '@unicornlove/ui'; // Assuming these components exist

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
    <div className="enum-editor p-4 border rounded-lg shadow-sm bg-white">
      <h3 className="text-lg font-semibold mb-4">{enumValue ? 'Edit Enum Value' : 'Add New Enum Value'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          {/* <TextInput
            label="Value"
            value={value}
            onChange={setValue}
            required
            disabled={!!enumValue} // Disable editing value for existing enums
          /> */}
          <label>Value</label>
          <input type="text" value={value} onChange={(e) => setValue(e.target.value)} required disabled={!!enumValue} />
        </div>
        <div className="mb-4">
          {/* <TextInput
            label="Display Name"
            value={displayName}
            onChange={setDisplayName}
            required
          /> */}
          <label>Display Name</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>
        <div className="mb-4">
          {/* <TextInput
            label="Sort Order"
            value={sortOrder.toString()}
            onChange={(val) => setSortOrder(parseInt(val))}
            type="number"
            required
          /> */}
          <label>Sort Order</label>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value))} required />
        </div>
        <div className="mb-4">
          {/* <Checkbox
            label="Is Active"
            checked={isActive}
            onChange={setIsActive}
          /> */}
          <label>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Is Active
          </label>
        </div>
        <div className="flex justify-end space-x-2">
          {/* <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {enumValue ? 'Save Changes' : 'Add Value'}
          </Button> */}
          <button onClick={onCancel} disabled={isLoading}>Cancel</button>
          <button type="submit" disabled={isLoading}>{enumValue ? 'Save Changes' : 'Add Value'}</button>
        </div>
      </form>
    </div>
  );
}

export default EnumEditor;
