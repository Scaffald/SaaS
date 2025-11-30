import { Calendar } from '@tamagui/lucide-icons'
import { Adapt, Select, Text, YStack } from 'tamagui'
import { Sheet } from '../sheets/Sheet'

interface MonthYearPickerProps {
  value: Date | null | undefined
  onChange: (date: Date | null) => void
  disabled?: boolean
  error?: string
  label?: string
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const MONTH_OPTIONS = MONTHS.map((month, index) => ({
  value: (index + 1).toString().padStart(2, '0'),
  label: month,
}))

// Generate year options: current year ± 50 years
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear + 10; i >= currentYear - 50; i--) {
    years.push({ value: i.toString(), label: i.toString() })
  }
  return years
}

const YEAR_OPTIONS = generateYearOptions()

/**
 * MonthYearPicker Component
 *
 * A simple month/year picker using Select dropdowns for cross-platform compatibility.
 * Stores dates with day=1 (first day of selected month).
 *
 * @example
 * ```tsx
 * <MonthYearPicker
 *   value={startDate}
 *   onChange={(date) => setStartDate(date)}
 *   placeholder="Select date"
 *   error={errors.start_date?.message}
 * />
 * ```
 */
export function MonthYearPicker({
  value,
  onChange,
  disabled = false,
  error,
  label,
}: MonthYearPickerProps) {
  const selectedMonth = value ? (value.getMonth() + 1).toString().padStart(2, '0') : ''
  const selectedYear = value ? value.getFullYear().toString() : ''

  const handleMonthChange = (month: string) => {
    if (disabled) {
      return
    }
    if (!month) {
      onChange(null)
      return
    }

    const year = selectedYear || new Date().getFullYear().toString()
    const date = new Date(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1, 1)
    onChange(date)
  }

  const handleYearChange = (year: string) => {
    if (disabled) {
      return
    }
    if (!year) {
      onChange(null)
      return
    }

    const month = selectedMonth || '01'
    const date = new Date(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1, 1)
    onChange(date)
  }

  return (
    <YStack gap="$2">
      {label && (
        <Text fontSize="$4" fontWeight="600" color="$color12">
          {label}
        </Text>
      )}
      <YStack gap="$2">
        <Select value={selectedMonth} onValueChange={handleMonthChange} size="$4">
          <Select.Trigger
            icon={Calendar}
            borderColor={error ? '$red10' : '$borderColor'}
            bg={disabled ? '$color3' : '$background'}
            disabled={disabled}
          >
            <Select.Value placeholder="Month" />
          </Select.Trigger>

          <Adapt when="sm" platform="touch">
            <Sheet modal dismissOnSnapToBottom>
              <Sheet.Frame>
                <Sheet.ScrollView>
                  <Adapt.Contents />
                </Sheet.ScrollView>
              </Sheet.Frame>
              <Sheet.Overlay />
            </Sheet>
          </Adapt>

          <Select.Content zIndex={200000}>
            <Select.Viewport>
              <Select.Group>
                {MONTH_OPTIONS.map((month, index) => (
                  <Select.Item key={month.value} value={month.value} index={index}>
                    <Select.ItemText>{month.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Viewport>
          </Select.Content>
        </Select>

        <Select value={selectedYear} onValueChange={handleYearChange} size="$4">
          <Select.Trigger
            icon={Calendar}
            borderColor={error ? '$red10' : '$borderColor'}
            bg={disabled ? '$color3' : '$background'}
            disabled={disabled}
          >
            <Select.Value placeholder="Year" />
          </Select.Trigger>

          <Adapt when="sm" platform="touch">
            <Sheet modal dismissOnSnapToBottom>
              <Sheet.Frame>
                <Sheet.ScrollView>
                  <Adapt.Contents />
                </Sheet.ScrollView>
              </Sheet.Frame>
              <Sheet.Overlay />
            </Sheet>
          </Adapt>

          <Select.Content zIndex={200000}>
            <Select.Viewport>
              <Select.Group>
                {YEAR_OPTIONS.map((year, index) => (
                  <Select.Item key={year.value} value={year.value} index={index}>
                    <Select.ItemText>{year.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Viewport>
          </Select.Content>
        </Select>
      </YStack>
      {error && (
        <Text fontSize="$2" color="$red10">
          {error}
        </Text>
      )}
    </YStack>
  )
}
