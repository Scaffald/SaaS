import type { DatePickerProviderProps, DPPropGetter } from '@rehookify/datepicker'
import {
  DatePickerProvider as _DatePickerProvider,
  useDatePickerContext,
} from '@rehookify/datepicker'
import { Calendar, ChevronLeft, ChevronRight, X } from '@tamagui/lucide-icons'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { GestureResponderEvent } from 'react-native'
import type { PopoverProps } from 'tamagui'
import {
  Adapt,
  AnimatePresence,
  Button,
  Popover,
  SizableText,
  View,
  createStyledContext,
  styled,
  withStaticProperties,
  useDidFinishSSR,
} from 'tamagui'

import { useDateAnimation } from './datePickerUtils'
import { Input } from '../../../forms/inputs/components/inputsParts'

/** rehookify internally return `onClick` and that's incompatible with native */

type DatePickerClickHandler = NonNullable<DPPropGetter['onClick']>

type AdaptedDatePickerProps<T extends DPPropGetter> = Omit<T, 'onClick'> & {
  onClick?: DatePickerClickHandler
  onPress?: (event: GestureResponderEvent) => void
}

const createMouseEventShim = (event: GestureResponderEvent): ReactMouseEvent<HTMLElement> => {
  return {
    nativeEvent: event.nativeEvent,
    currentTarget: event.currentTarget as unknown as EventTarget & HTMLElement,
    target: event.target as unknown as EventTarget & HTMLElement,
    timeStamp: event.timeStamp,
    preventDefault: () => event.preventDefault?.(),
    stopPropagation: () => event.stopPropagation?.(),
    isDefaultPrevented: event.isDefaultPrevented?.bind(event),
    isPropagationStopped: event.isPropagationStopped?.bind(event),
    persist: () => event.persist?.(),
  } as unknown as ReactMouseEvent<HTMLElement>
}

export function createDatePickerButtonProps<T extends DPPropGetter>(
  props: T
): AdaptedDatePickerProps<T> {
  const { onClick, ...rest } = props

  if (!onClick) {
    return rest as AdaptedDatePickerProps<T>
  }

  return {
    ...rest,
    onClick,
    onPress: (event) => {
      onClick(createMouseEventShim(event))
    },
  }
}

export type DatePickerPressEvent = ReactMouseEvent<HTMLElement> | GestureResponderEvent | undefined

const DatePickerProvider = _DatePickerProvider as React.ComponentType<DatePickerProviderProps>

type DatePickerProps = PopoverProps & { config: DatePickerProviderProps['config'] }

export const { Provider: HeaderTypeProvider, useStyledContext: useHeaderType } =
  createStyledContext({ type: 'day', setHeader: (_: 'day' | 'month' | 'year') => {} })

const DatePickerImpl = (props: DatePickerProps) => {
  const { children, config, ...rest } = props
  const isHydrated = useDidFinishSSR()

  return (
    <Popover keepChildrenMounted size="$5" allowFlip {...rest}>
      {/* for mobile view */}
      {isHydrated ? (
        <Adapt when="sm" platform="touch">
          <Popover.Sheet modal dismissOnSnapToBottom snapPointsMode="fit">
            <Popover.Sheet.Frame padding="$2" alignItems="center">
              <DatePickerProvider config={config}>
                <Adapt.Contents />
              </DatePickerProvider>
            </Popover.Sheet.Frame>
            <Popover.Sheet.Overlay
              animation="lazy"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
          </Popover.Sheet>
        </Adapt>
      ) : null}

      {/* for desktop view */}
      <DatePickerProvider config={config}>{children}</DatePickerProvider>
    </Popover>
  )
}

const Trigger = Popover.Trigger

const DatePickerContent = styled(Popover.Content, {
  animation: [
    '100ms',
    {
      opacity: {
        overshootClamping: true,
      },
    },
  ],
  variants: {
    unstyled: {
      false: {
        padding: 12,
        borderWidth: 1,
        borderColor: '$borderColor',
        enterStyle: { y: -10, opacity: 0 },
        exitStyle: { y: -10, opacity: 0 },
        elevate: true,
      },
    },
  } as const,
  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === '1',
  },
})

export const DatePicker = withStaticProperties(DatePickerImpl, {
  Trigger,
  Content: withStaticProperties(DatePickerContent, {
    Arrow: styled(Popover.Arrow, {
      borderWidth: 1,
      borderColor: '$borderColor',
    }),
  }),
}) as any

type DatePickerInputProps = {
  onReset: () => void
  onButtonPress?: (e: GestureResponderEvent) => void
}
export const DatePickerInput = Input.Area.styleable<DatePickerInputProps>((props, ref) => {
  const { value, onButtonPress, size = '$3', onReset, ...rest } = props
  return (
    <View $platform-native={{ minWidth: '100%' }}>
      <Input size={size}>
        <Input.Box>
          <Input.Section>
            <Input.Area cursor="pointer" value={value} editable={false} ref={ref} {...rest} />
          </Input.Section>
          <Input.Section>
            <Input.Button
              onPress={(e) => {
                if (value) {
                  e.stopPropagation()
                  onReset()
                } else {
                  onButtonPress?.(e)
                }
              }}
            >
              {value ? (
                <Input.Icon>
                  <X />
                </Input.Icon>
              ) : (
                <Input.Icon>
                  <Calendar />
                </Input.Icon>
              )}
            </Input.Button>
          </Input.Section>
        </Input.Box>
      </Input>
    </View>
  )
})

export function MonthPicker({
  onChange = () => {},
}: {
  onChange?: (event: DatePickerPressEvent, date: Date) => void
}) {
  const {
    data: { months },
    propGetters: { monthButton },
  } = useDatePickerContext()

  const { prevNextAnimation, prevNextAnimationKey } = useDateAnimation({
    listenTo: 'year',
  })

  return (
    <AnimatePresence key={prevNextAnimationKey}>
      <View
        {...prevNextAnimation()}
        flexDirection="row"
        flexWrap="wrap"
        gap="$2"
        animation="100ms"
        flexGrow={0}
        $platform-native={{
          justifyContent: 'space-between',
          width: '100%',
        }}
        $gtXs={{ width: 285 }}
      >
        {months.map((month) => (
          <Button
            themeInverse={month.active}
            borderRadius="$true"
            flexShrink={0}
            flexBasis={90}
            backgroundColor={month.active ? '$background' : 'transparent'}
            key={month.$date.toString()}
            chromeless
            padding={0}
            {...createDatePickerButtonProps(
              monthButton(month, {
                onClick: (event, date) => {
                  if (!date) return
                  onChange(event, date)
                },
              })
            )}
          >
            <Button.Text color={month.active ? '$gray12' : '$gray11'}>{month.month}</Button.Text>
          </Button>
        ))}
      </View>
    </AnimatePresence>
  )
}

export function YearPicker({
  onChange = () => {},
}: {
  onChange?: (event: DatePickerPressEvent, date: Date) => void
}) {
  const {
    data: { years, calendars },
    propGetters: { yearButton },
  } = useDatePickerContext()
  const selectedYear = calendars[0].year

  const { prevNextAnimation, prevNextAnimationKey } = useDateAnimation({
    listenTo: 'years',
  })

  return (
    <AnimatePresence key={prevNextAnimationKey}>
      <View
        {...prevNextAnimation()}
        animation="quick"
        flexDirection="row"
        flexWrap="wrap"
        gap="$2"
        width="100%"
        maxWidth={280}
        justifyContent="space-between"
      >
        {years.map((year) => (
          <Button
            themeInverse={year.year === Number(selectedYear)}
            borderRadius="$true"
            flexBasis="30%"
            flexGrow={1}
            backgroundColor={year.year === Number(selectedYear) ? '$background' : 'transparent'}
            key={year.$date.toString()}
            chromeless
            padding={0}
            {...createDatePickerButtonProps(
              yearButton(year, {
                onClick: (event, date) => {
                  if (!date) return
                  onChange(event, date)
                },
              })
            )}
          >
            <Button.Text color={year.year === Number(selectedYear) ? '$gray12' : '$gray11'}>
              {year.year}
            </Button.Text>
          </Button>
        ))}
      </View>
    </AnimatePresence>
  )
}
export function YearRangeSlider() {
  const {
    data: { years },
    propGetters: { previousYearsButton, nextYearsButton },
  } = useDatePickerContext()

  return (
    <View flexDirection="row" width="100%" alignItems="center" justifyContent="space-between">
      <Button circular size="$4" {...createDatePickerButtonProps(previousYearsButton())}>
        <Button.Icon scaleIcon={1.5}>
          <ChevronLeft />
        </Button.Icon>
      </Button>
      <View y={2} flexDirection="column" alignItems="center">
        <SizableText size="$5">{`${years[0].year} - ${years[years.length - 1].year}`}</SizableText>
      </View>
      <Button circular size="$4" {...createDatePickerButtonProps(nextYearsButton())}>
        <Button.Icon scaleIcon={1.5}>
          <ChevronRight />
        </Button.Icon>
      </Button>
    </View>
  )
}

export function YearSlider() {
  const {
    data: { calendars },
    propGetters: { subtractOffset },
  } = useDatePickerContext()
  const { setHeader } = useHeaderType()
  const { year } = calendars[0]

  return (
    <View
      flexDirection="row"
      width="100%"
      height={50}
      alignItems="center"
      justifyContent="space-between"
    >
      <Button circular size="$3" {...createDatePickerButtonProps(subtractOffset({ months: 12 }))}>
        <Button.Icon scaleIcon={1.5}>
          <ChevronLeft />
        </Button.Icon>
      </Button>
      <SizableText
        onPress={() => setHeader('year')}
        selectable
        tabIndex={0}
        size="$6"
        cursor="pointer"
        color="$color11"
        hoverStyle={{
          color: '$color12',
        }}
      >
        {year}
      </SizableText>
      <Button circular size="$3" {...createDatePickerButtonProps(subtractOffset({ months: -12 }))}>
        <Button.Icon scaleIcon={1.5}>
          <ChevronRight />
        </Button.Icon>
      </Button>
    </View>
  )
}
