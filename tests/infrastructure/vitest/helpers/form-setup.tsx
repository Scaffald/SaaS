import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { UseFormProps } from 'react-hook-form';

/**
 * Test helper to render components with React Hook Form context
 */
export function FormTestWrapper<T extends Record<string, unknown>>({
  children,
  formOptions,
}: {
  children: ReactNode;
  formOptions?: UseFormProps<T>;
}) {
  const methods = useForm<T>(formOptions);
  return <FormProvider {...methods}>{children}</FormProvider>;
}

