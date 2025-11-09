import { Button, type ButtonProps } from 'tamagui'
import { UploadCloud } from '@tamagui/lucide-icons'

export interface ResumeUploadButtonProps extends Omit<ButtonProps, 'children' | 'text'> {
  onPress: () => void
  label?: string
}

export function ResumeUploadButton({
  onPress,
  label = 'Import from Resume',
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
      {...rest}
    >
      {label}
    </Button>
  )
}

