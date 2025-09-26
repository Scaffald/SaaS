import { FormWrapper, H2, YStack, isWeb } from '@app/ui'

export type ContentWrapperProps = {
  /**
   * Page title to display in the header
   */
  title?: string
  /**
   * Content to display in the body
   */
  children: React.ReactNode
  /**
   * Optional footer content
   */
  footer?: React.ReactNode
}

export const ContentWrapper = ({ title, children, footer }: ContentWrapperProps) => {
  return (
    <FormWrapper>
      <FormWrapper.Body mt="$2" gap="$10">
        {children}
      </FormWrapper.Body>
      {footer && <FormWrapper.Footer>{footer}</FormWrapper.Footer>}
    </FormWrapper>
  )
}
