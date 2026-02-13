import type { ReactNode } from 'react'
import { Hide, Row, Stack } from '@unicornlove/beyond-ui'
import { WelcomeScreen } from './welcome-screen'

export type AuthLayoutProps = {
  children?: ReactNode
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <Row flex={1}>
      <Stack flex={2} justify="center">
        <Stack paddingHorizontal={16}>{children}</Stack>
      </Stack>

      <Hide above="md">
        <Stack flex={3}>
          <WelcomeScreen />
        </Stack>
      </Hide>
    </Row>
  )
}
