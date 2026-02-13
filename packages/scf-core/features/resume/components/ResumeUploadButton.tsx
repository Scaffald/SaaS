import { UploadCloud } from 'lucide-react-native'
import { Button, type ButtonProps } from '@unicornlove/beyond-ui'

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
    <Button size={size} variant={variant} iconStart={icon} onPress={onPress} {...rest}>
      {label}
    </Button>
  )
}
