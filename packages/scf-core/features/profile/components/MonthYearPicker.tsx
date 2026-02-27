import { Input, Text, Stack } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { useThemeContext } from "@scaffald/ui";

export interface MonthYearPickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
}

/**
 * MonthYearPicker component
 * Simple month/year date picker using a native input[type="month"]
 * Falls back to text input on platforms that don't support it
 */
export function MonthYearPicker({
  value,
  onChange,
  disabled,
  error,
  label,
}: MonthYearPickerProps) {
  useThemeContext();

  // Format Date to YYYY-MM string (required by input[type="month"])
  const toInputValue = (date: Date | null): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  // Parse YYYY-MM string to Date (first day of month)
  const fromInputValue = (str: string): Date | null => {
    if (!str) return null;
    const [year, month] = str.split("-").map(Number);
    if (!year || !month) return null;
    return new Date(year, month - 1, 1);
  };

  return (
    <Stack gap={4}>
      {label && <Text>{label}</Text>}
      <Input
        value={toInputValue(value)}
        onChangeText={(text) => onChange(fromInputValue(text))}
        placeholder="YYYY-MM"
        disabled={disabled}
        style={error ? { borderColor: colors.error[500] } : undefined}
      />
      {error && <Text style={{ color: colors.error[600] }}>{error}</Text>}
    </Stack>
  );
}
