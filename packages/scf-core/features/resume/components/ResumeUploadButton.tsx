import { UploadCloud } from "lucide-react-native";
import { Button, type ButtonProps } from "@scaffald/ui";

export interface ResumeUploadButtonProps extends Omit<ButtonProps, "children"> {
  onPress: () => void;
  label?: string;
}

export function ResumeUploadButton({
  onPress,
  label = "Import from Resume",
  size = "md",
  variant = "outline",
  iconStart = UploadCloud,
  ...rest
}: ResumeUploadButtonProps) {
  return (
    <Button
      size={size}
      variant={variant}
      iconStart={iconStart}
      onPress={onPress}
      {...rest}
    >
      {label}
    </Button>
  );
}
