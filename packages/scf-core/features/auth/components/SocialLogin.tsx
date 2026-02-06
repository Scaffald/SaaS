import { useTranslation } from '@scf/core/utils/useTranslation'
import { Caption, Row, Separator, Stack } from '@unicornlove/beyond-ui'
import { usePlatform } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

import { AppleSignIn } from './AppleSignIn'
import { GoogleSignIn } from './GoogleSignIn'

export function SocialLogin() {
  const { platform } = usePlatform()
  const isWeb = platform === 'web'
  const { t } = useTranslation()

  return (
    <Stack gap={20}>
      <OrSeparator label={t('common.or')} isWeb={isWeb} />
      <Row gap={12}>
        <AppleSignIn />
        <GoogleSignIn />
      </Row>
    </Stack>
  )
}

function OrSeparator({ label, isWeb }: { label: string; isWeb: boolean }) {
  return (
    <Stack style={{ position: 'relative' }}>
      <Stack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        align="center"
        justify="center"
      >
        <Separator style={{ flex: 1 }} />
      </Stack>
      <Stack align="center" justify="center">
        <Caption
          style={{
            backgroundColor: isWeb ? colors.bg.primary : 'transparent',
            paddingHorizontal: 12,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {label}
        </Caption>
      </Stack>
    </Stack>
  )
}
