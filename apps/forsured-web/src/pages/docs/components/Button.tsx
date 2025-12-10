// src/pages/docs/components/Button.tsx
import React from 'react';
import ComponentDocumentationTemplate from '../Components';

function ButtonDoc() {
  const props = [
    { name: 'children', type: 'React.ReactNode', description: 'The content of the button.' },
    { name: 'onClick', type: '() => void', description: 'Callback fired when the button is clicked.' },
    { name: 'variant', type: "'primary' | 'secondary' | 'ghost'", description: 'The visual style of the button.', default: 'primary' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", description: 'The size of the button.', default: 'md' },
    { name: 'disabled', type: 'boolean', description: 'If true, the button will be disabled.', default: 'false' },
    { name: 'loading', type: 'boolean', description: 'If true, a loading spinner will be shown.', default: 'false' },
  ];

  const examples = [
    {
      title: 'Primary Button',
      code: `<Button variant="primary" onClick={() => alert('Clicked!')}>Click Me</Button>`,
      render: <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => alert('Clicked!')}>Click Me</button>,
    },
    {
      title: 'Secondary Button',
      code: `<Button variant="secondary" onClick={() => alert('Clicked!')}>Click Me</Button>`,
      render: <button className="px-4 py-2 border border-gray-300 rounded" onClick={() => alert('Clicked!')}>Click Me</button>,
    },
  ];

  return (
    <ComponentDocumentationTemplate
      name="Button"
      description="A clickable button component used for actions and links."
      props={props}
      examples={examples}
    />
  );
}

export default ButtonDoc;
