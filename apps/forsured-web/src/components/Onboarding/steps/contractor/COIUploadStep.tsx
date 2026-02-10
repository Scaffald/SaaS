// src/components/onboarding/steps/contractor/COIUploadStep.tsx
// Contractor Onboarding - COI Upload Step (Optional)
import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Stack, Row, Text, H2, Button } from '@unicornlove/beyond-ui';

interface COIUploadStepProps {
  onComplete: (data: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

function COIUploadStep({ onComplete, initialData = {}, isLoading = false }: COIUploadStepProps) {
  const documents = initialData.documents || {};
  const [glCoi, setGlCoi] = useState<File | null>(documents.glCoi || null);
  const [wcCoi, setWcCoi] = useState<File | null>(documents.wcCoi || null);
  const [autoCoi, setAutoCoi] = useState<File | null>(documents.autoCoi || null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0] || null;
    setter(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onComplete({
      documents: {
        glCoi: glCoi || undefined,
        wcCoi: wcCoi || undefined,
        autoCoi: autoCoi || undefined,
      },
    });
  };

  const uploadButtonStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    border: '1px solid var(--color-gray-8)',
    borderRadius: 16,
    cursor: 'pointer',
    backgroundColor: 'var(--color-background)',
  };

  return (
    <Stack>
      <H2 style={{ marginBottom: 8 }}>Upload Certificates of Insurance (Optional)</H2>
      <Text style={{ marginBottom: 24, color: 'var(--color-text-secondary)' }}>
        You can skip this step and upload certificates later. PDF files only.
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 24 }}>
          <Stack style={{ gap: 16 }}>
            <Stack>
              <Text style={{ marginBottom: 8, display: 'block', fontWeight: 500 }}>General Liability COI</Text>
              <Row style={{ alignItems: 'center', gap: 16 }}>
                <label style={uploadButtonStyle}>
                  <Upload size={16} />
                  <Text>{glCoi ? glCoi.name : 'Choose PDF file'}</Text>
                  <input
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(e, setGlCoi)}
                  />
                </label>
                {glCoi && (
                  <Row style={{ alignItems: 'center', gap: 8 }}>
                    <FileText size={16} color="var(--color-text-secondary)" />
                    <Text style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{glCoi.name}</Text>
                  </Row>
                )}
              </Row>
            </Stack>

            <Stack>
              <Text style={{ marginBottom: 8, display: 'block', fontWeight: 500 }}>Workers Compensation COI</Text>
              <Row style={{ alignItems: 'center', gap: 16 }}>
                <label style={uploadButtonStyle}>
                  <Upload size={16} />
                  <Text>{wcCoi ? wcCoi.name : 'Choose PDF file'}</Text>
                  <input
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(e, setWcCoi)}
                  />
                </label>
                {wcCoi && (
                  <Row style={{ alignItems: 'center', gap: 8 }}>
                    <FileText size={16} color="var(--color-text-secondary)" />
                    <Text style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{wcCoi.name}</Text>
                  </Row>
                )}
              </Row>
            </Stack>

            <Stack>
              <Text style={{ marginBottom: 8, display: 'block', fontWeight: 500 }}>Auto Liability COI</Text>
              <Row style={{ alignItems: 'center', gap: 16 }}>
                <label style={uploadButtonStyle}>
                  <Upload size={16} />
                  <Text>{autoCoi ? autoCoi.name : 'Choose PDF file'}</Text>
                  <input
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(e, setAutoCoi)}
                  />
                </label>
                {autoCoi && (
                  <Row style={{ alignItems: 'center', gap: 8 }}>
                    <FileText size={16} color="var(--color-text-secondary)" />
                    <Text style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{autoCoi.name}</Text>
                  </Row>
                )}
              </Row>
            </Stack>
          </Stack>

          <Stack style={{ marginTop: 24 }}>
            <Button
              onPress={handleSubmit}
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
}

export default COIUploadStep;
