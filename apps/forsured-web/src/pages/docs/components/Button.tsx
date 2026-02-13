// src/pages/docs/components/Button.tsx
import React from 'react';
import { Box } from '@scaffald/ui';
import ComponentDocumentationTemplate from '../Components';
import Button from '../../../components/Common/Button';

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
      code: `<Button variant="primary" onPress={() => alert('Clicked!')}>Click Me</Button>`,
      render: (
        <Button variant="primary" onPress={() => alert('Clicked!')}>
          Click Me
        </Button>
      ),
    },
    {
      title: 'Secondary Button',
      code: `<Button variant="secondary" onPress={() => alert('Clicked!')}>Click Me</Button>`,
      render: (
        <Button variant="secondary" onPress={() => alert('Clicked!')}>
          Click Me
        </Button>
      ),
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
