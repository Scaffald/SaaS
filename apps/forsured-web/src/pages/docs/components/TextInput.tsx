// src/pages/docs/components/TextInput.tsx
import React from 'react';
import ComponentDocumentationTemplate from '../Components';
import Input from '../../../components/Common/Input';

function TextInputDoc() {
  const props = [
    { name: 'label', type: 'string', description: 'The label for the input field.' },
    { name: 'value', type: 'string', description: 'The current value of the input.' },
    { name: 'onChange', type: '(value: string) => void', description: 'Callback fired when the input value changes.' },
    { name: 'placeholder', type: 'string', description: 'Placeholder text for the input field.' },
    { name: 'type', type: 'string', description: 'The type of the input (e.g., text, email, password).', default: 'text' },
    { name: 'required', type: 'boolean', description: 'If true, the input field is required.', default: 'false' },
    { name: 'disabled', type: 'boolean', description: 'If true, the input field will be disabled.', default: 'false' },
    { name: 'error', type: 'string', description: 'Error message to display below the input.' },
  ];

  const examples = [
    {
      title: 'Basic Text Input',
      code: `<Input label="Username" placeholder="Enter your username" />`,
      render: <Input label="Username" placeholder="Enter your username" />,
    },
    {
      title: 'Password Input',
      code: `<Input label="Password" type="password" placeholder="Enter your password" />`,
      render: <Input label="Password" type="password" placeholder="Enter your password" />,
    },
  ];

  return (
    <ComponentDocumentationTemplate
      name="TextInput"
      description="A flexible text input component for various data entry needs."
      props={props}
      examples={examples}
    />
  );
}

export default TextInputDoc;
