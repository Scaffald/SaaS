import { Button, type ButtonProps } from 'tamagui'
import { UploadCloud } from '@tamagui/lucide-icons'

export interface ResumeUploadButtonProps extends Omit<ButtonProps, 'children'> {
  onPress: () => void
  text?: string
}

export function ResumeUploadButton({
  onPress,
  text = 'Import from Resume',
  size = '$4',
  variant = 'outlined',
  icon = UploadCloud,
  ...rest
}: ResumeUploadButtonProps) {
  return (
    <Button
      size={size}
      variant={variant}
      icon={icon}
      onPress={onPress}
      alignSelf="flex-start"
      {...rest}
    >
      {text}
    </Button>
  )
}

