// src/pages/docs/components/Modal.tsx
import React from 'react';
import { View, Text } from '@unicornlove/ui';
import ComponentDocumentationTemplate from '../Components';

function ModalDoc() {
  const props = [
    { name: 'isOpen', type: 'boolean', description: 'Controls the visibility of the modal.' },
    { name: 'onClose', type: '() => void', description: 'Callback fired when the modal is requested to be closed.' },
    { name: 'title', type: 'string', description: 'The title displayed in the modal header.' },
    { name: 'children', type: 'React.ReactNode', description: 'The content of the modal body.' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", description: 'The size of the modal.', default: 'md' },
    { name: 'hideCloseButton', type: 'boolean', description: 'If true, the close button will not be rendered.', default: 'false' },
  ];

  const examples = [
    {
      title: 'Basic Modal',
      code: `
const [isOpen, setIsOpen] = useState(false);
return (
  <>
    <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Example Modal">
      <p>This is the content of the modal.</p>
    </Modal>
  </>
);
      `,
      render: (
        <View
          padding="$4"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
          backgroundColor="$background"
        >
          <Text color="$color11">Modal content would be here (simulated open).</Text>
        </View>
      ),
    },
  ];

  return (
    <ComponentDocumentationTemplate
      name="Modal"
      description="A dialog box that overlays the current page, used to display critical information or prompt for user input."
      props={props}
      examples={examples}
    />
  );
}

export default ModalDoc;
