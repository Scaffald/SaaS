import { Stack } from '../Layout'
import { Paragraph } from '../Typography'
import { spacing } from '../../tokens/spacing'
import { colors } from '../../tokens/colors'
import { useThemeContext } from '../../theme'
import type { ChecklistHeaderProps } from './Checklist.types'

export function ChecklistHeader({ title, subtitle }: ChecklistHeaderProps) {
  const { theme } = useThemeContext()
  if (!title && !subtitle) return null

  return (
    <Stack gap={spacing[2]}>
      {title ? (
        <Paragraph
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.text[theme].primary,
          }}
        >
          {title}
        </Paragraph>
      ) : null}
      {subtitle ? (
        <Paragraph
          style={{
            fontSize: 14,
            color: colors.text[theme].secondary,
            lineHeight: 20,
          }}
        >
          {subtitle}
        </Paragraph>
      ) : null}
    </Stack>
  )
}
