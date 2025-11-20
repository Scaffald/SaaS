/* c8 ignore file */

import { FieldError, FormWrapper } from '@app/ui'
import { createTsForm, createUniqueFieldSchema } from '@ts-react/form'
import type { ComponentProps, ReactNode } from 'react'
import { useFormContext } from 'react-hook-form'
import { Form, type FormProps, Input, Theme } from 'tamagui'
import { z } from 'zod'

// Create a basic TextField component
interface TextFieldProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  [key: string]: unknown
}

const TextField = ({ value, onChangeText, placeholder, ...props }: TextFieldProps) => {
  return <Input value={value} onChangeText={onChangeText} placeholder={placeholder} {...props} />
}

// Create unique field schemas that match what's used in the login screen
const EmailFieldSchema = createUniqueFieldSchema(
  z.string().email('Please enter a valid email address'),
  'email'
)
const TextFieldSchema = createUniqueFieldSchema(z.string(), 'text')

// Basic form fields using Tamagui Input
export const formFields = {
  text: {
    email: () => EmailFieldSchema,
    default: () => TextFieldSchema,
  },
}

// Mapping for the form - include both email and string types
const mapping = [
  [z.string().email(), TextField] as const,
  [z.string(), TextField] as const,
  [EmailFieldSchema, TextField] as const,
  [TextFieldSchema, TextField] as const,
] as const

const FormComponent = (props: FormProps) => {
  return (
    <Form asChild {...props} minW="100%">
      <FormWrapper tag="form">{props.children}</FormWrapper>
    </Form>
  )
}

const _SchemaForm = createTsForm(mapping, {
  FormComponent,
})

type SchemaFormChildRenderer = ComponentProps<typeof _SchemaForm>['children']

// SchemaForm is a higher-order component that wraps around the _SchemaForm component.
// It provides additional functionality for rendering a form with custom fields and a footer.
// The renderAfter prop allows for custom content to be rendered in the form's footer.
// The children prop can be used to customize the rendering of form fields.
export const SchemaForm: typeof _SchemaForm = ({ ...props }) => {
  const renderAfter: ComponentProps<typeof _SchemaForm>['renderAfter'] = props.renderAfter
    ? (vars) => <FormWrapper.Footer>{props.renderAfter?.(vars)}</FormWrapper.Footer>
    : undefined

  return (
    <_SchemaForm {...props} renderAfter={renderAfter}>
      {(fields: Record<string, ReactNode>, _context: unknown) => {
        const childRenderer = props.children as SchemaFormChildRenderer | undefined

        return (
          <FormWrapper.Body minW="100%" $platform-native={{ minW: '100%' }}>
            {childRenderer
              ? typeof childRenderer === 'function'
                ? childRenderer(fields)
                : childRenderer
              : Object.values(fields)}
          </FormWrapper.Body>
        )
      }}
    </_SchemaForm>
  )
}

// handle manual errors (most commonly coming from a server) for cases where it's not for a specific field - make sure to wrap inside a provider first
// stopped using it cause of state issues it introduced - set the errors to specific fields instead of root for now
export const RootError = () => {
  const context = useFormContext()
  const errorMessage = context?.formState?.errors?.root?.message

  return (
    <Theme name="error">
      <FieldError message={errorMessage} />
    </Theme>
  )
}
