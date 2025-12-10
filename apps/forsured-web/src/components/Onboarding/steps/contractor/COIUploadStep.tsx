// src/components/onboarding/steps/contractor/COIUploadStep.tsx
// REQ-126: Contractor Onboarding - COI Upload Step (Optional)
import React, { useState } from 'react';
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
    <div className="coi-upload-step">
      <Heading2 className="mb-2">Upload Certificates of Insurance (Optional)</Heading2>
      <BodyText className="mb-6 text-gray-600">
        You can skip this step and upload certificates later. PDF files only.
      </BodyText>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">General Liability COI</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <Upload className="w-4 h-4" />
                <span>{glCoi ? glCoi.name : 'Choose PDF file'}</span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, setGlCoi)}
                />
              </label>
              {glCoi && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{glCoi.name}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Workers Compensation COI</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <Upload className="w-4 h-4" />
                <span>{wcCoi ? wcCoi.name : 'Choose PDF file'}</span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, setWcCoi)}
                />
              </label>
              {wcCoi && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{wcCoi.name}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Auto Liability COI</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <Upload className="w-4 h-4" />
                <span>{autoCoi ? autoCoi.name : 'Choose PDF file'}</span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, setAutoCoi)}
                />
              </label>
              {autoCoi && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{autoCoi.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default COIUploadStep;
