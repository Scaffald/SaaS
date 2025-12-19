// src/components/onboarding/steps/contractor/COIUploadStep.tsx
// REQ-126: Contractor Onboarding - COI Upload Step (Optional)
import { useState } from 'react';
import { YStack, XStack, Text } from 'tamagui';
import { Button } from '@unicornlove/ui';
import { Heading2, BodyText, Label } from '@unicornlove/ui';
import { Upload, FileText } from '@unicornlove/ui';

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

  return (
    <YStack>
      <Heading2 marginBottom="$2">Upload Certificates of Insurance (Optional)</Heading2>
      <BodyText marginBottom="$6" color="$color10">
        You can skip this step and upload certificates later. PDF files only.
      </BodyText>
      <YStack tag="form" onSubmit={handleSubmit} gap="$6">
        <YStack gap="$4">
          <YStack>
            <Label marginBottom="$2" display="block">General Liability COI</Label>
            <XStack alignItems="center" gap="$4">
              <XStack
                tag="label"
                flexDirection="row"
                alignItems="center"
                gap="$2"
                paddingHorizontal="$4"
                paddingVertical="$2"
                borderWidth={1}
                borderColor="$gray8"
                borderRadius="$4"
                cursor="pointer"
                hoverStyle={{ backgroundColor: '$gray3' }}
              >
                <Upload size={16} />
                <Text>{glCoi ? glCoi.name : 'Choose PDF file'}</Text>
                <input
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(e, setGlCoi)}
                />
              </XStack>
              {glCoi && (
                <XStack alignItems="center" gap="$2">
                  <FileText size={16} color="$color10" />
                  <Text fontSize="$3" color="$color10">{glCoi.name}</Text>
                </XStack>
              )}
            </XStack>
          </YStack>

          <YStack>
            <Label marginBottom="$2" display="block">Workers Compensation COI</Label>
            <XStack alignItems="center" gap="$4">
              <XStack
                tag="label"
                flexDirection="row"
                alignItems="center"
                gap="$2"
                paddingHorizontal="$4"
                paddingVertical="$2"
                borderWidth={1}
                borderColor="$gray8"
                borderRadius="$4"
                cursor="pointer"
                hoverStyle={{ backgroundColor: '$gray3' }}
              >
                <Upload size={16} />
                <Text>{wcCoi ? wcCoi.name : 'Choose PDF file'}</Text>
                <input
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(e, setWcCoi)}
                />
              </XStack>
              {wcCoi && (
                <XStack alignItems="center" gap="$2">
                  <FileText size={16} color="$color10" />
                  <Text fontSize="$3" color="$color10">{wcCoi.name}</Text>
                </XStack>
              )}
            </XStack>
          </YStack>

          <YStack>
            <Label marginBottom="$2" display="block">Auto Liability COI</Label>
            <XStack alignItems="center" gap="$4">
              <XStack
                tag="label"
                flexDirection="row"
                alignItems="center"
                gap="$2"
                paddingHorizontal="$4"
                paddingVertical="$2"
                borderWidth={1}
                borderColor="$gray8"
                borderRadius="$4"
                cursor="pointer"
                hoverStyle={{ backgroundColor: '$gray3' }}
              >
                <Upload size={16} />
                <Text>{autoCoi ? autoCoi.name : 'Choose PDF file'}</Text>
                <input
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(e, setAutoCoi)}
                />
              </XStack>
              {autoCoi && (
                <XStack alignItems="center" gap="$2">
                  <FileText size={16} color="$color10" />
                  <Text fontSize="$3" color="$color10">{autoCoi.name}</Text>
                </XStack>
              )}
            </XStack>
          </YStack>
        </YStack>

        <YStack marginTop="$6">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </YStack>
      </YStack>
    </YStack>
  );
}

export default COIUploadStep;
