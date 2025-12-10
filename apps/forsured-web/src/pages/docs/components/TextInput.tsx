// src/pages/docs/components/TextInput.tsx
import React from 'react';
import ComponentDocumentationTemplate from '../Components';

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
      code: `<TextInput label="Username" value={username} onChange={setUsername} placeholder="Enter your username" />`,
      render: <input type="text" placeholder="Enter your username" className="border p-2 rounded" />,
    },
    {
      title: 'Password Input',
      code: `<TextInput label="Password" type="password" value={password} onChange={setPassword} />`,
      render: <input type="password" placeholder="Enter your password" className="border p-2 rounded" />,
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
