import { getFontSized } from '@tamagui/get-font-sized'
import { getSpace } from '@tamagui/get-token'
import { User } from '@tamagui/lucide-icons'
import type { FontSizeVariantSpreadFunction, SizeVariantSpreadFunction } from '@tamagui/web'
import { useState } from 'react'
import type { ColorTokens, FontSizeTokens } from 'tamagui'
import {
  Label,
  Button as TButton,
  Input as TInput,
  Text,
  View,
  XGroup,
  createStyledContext,
  getFontSize,
  getVariable,
  isWeb,
  styled,
  useGetThemedIcon,
  useTheme,
  withStaticProperties,
} from 'tamagui'

const defaultContextValues = {
  size: '$true',
  scaleIcon: 1.2,
  color: undefined,
} as const

export const InputContext = createStyledContext<{
  size: FontSizeTokens
  scaleIcon: number
  color?: ColorTokens | string
}>(defaultContextValues)

type VariantProps = Record<string, unknown>
type GetFontSizedExtras = Parameters<typeof getFontSized>[1]

const isFontSizeToken = (value: unknown): value is FontSizeTokens => {
  if (typeof value === 'number') return true
  return typeof value === 'string' && value.startsWith('$')
}

const getFontSizedVariant: FontSizeVariantSpreadFunction<VariantProps> = (value, extras) =>
  getFontSized(value, extras as GetFontSizedExtras)

type TokenWithOptionalValue = { val?: unknown }

const hasTokenValue = (token: unknown): token is TokenWithOptionalValue =>
  typeof token === 'object' && token !== null && 'val' in token

const getNumericTokenValue = (token: unknown): number | undefined => {
  if (typeof token === 'number') {
    return token
  }
  if (hasTokenValue(token) && typeof token.val === 'number') {
    return token.val
  }
  return undefined
}

const getPrimitiveTokenValue = (token: unknown): string | number | undefined => {
  if (typeof token === 'string' || typeof token === 'number') {
    return token
  }
  if (hasTokenValue(token)) {
    const { val } = token
    if (typeof val === 'string' || typeof val === 'number') {
      return val
    }
  }
  return undefined
}

const getTokenFromRecord = <T extends Record<string, unknown>>(
  record: T | undefined,
  key: string
) => {
  if (!record) return undefined
  return record[key as keyof T]
}

const getFontTokenKey = (value: FontSizeTokens): string =>
  typeof value === 'number' ? `${value}` : value

export const defaultInputGroupStyles = {
  size: '$true',
  fontFamily: '$body',
  borderWidth: 1,
  outlineWidth: 0,
  color: '$color',

  ...(isWeb
    ? {
        tabIndex: 0,
      }
    : {
        focusable: true,
      }),

  borderColor: '$borderColor',
  backgroundColor: '$color2',

  // this fixes a flex bug where it overflows container
  minWidth: 0,

  hoverStyle: {
    borderColor: '$borderColorHover',
  },

  focusStyle: {
    outlineColor: '$outlineColor',
    outlineWidth: 2,
    outlineStyle: 'solid',
    borderColor: '$borderColorFocus',
  },
} as const

const InputGroupFrame = styled(XGroup, {
  justifyContent: 'space-between',
  context: InputContext,
  variants: {
    unstyled: {
      false: defaultInputGroupStyles,
    },
    scaleIcon: {
      // biome-ignore lint/suspicious/noExplicitAny: Tamagui variant typing requires loose value map
      ':number': {} as any,
    },
    applyFocusStyle: {
      ':boolean': (val, { props }) => {
        if (val) {
          return props.focusStyle || defaultInputGroupStyles.focusStyle
        }
      },
    },
    size: {
      '...size': (val, { tokens }) => {
        return {
          borderRadius: tokens.radius[val],
        }
      },
    },
  } as const,
  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === '1',
  },
})

const FocusContext = createStyledContext({
  setFocused: (_val: boolean) => {},
  focused: false,
})

const InputGroupImpl = InputGroupFrame.styleable((props, forwardedRef) => {
  const { children, ...rest } = props
  const [focused, setFocused] = useState(false)

  return (
    <FocusContext.Provider focused={focused} setFocused={setFocused}>
      <InputGroupFrame applyFocusStyle={focused} ref={forwardedRef} {...rest}>
        {children}
      </InputGroupFrame>
    </FocusContext.Provider>
  )
})

export const inputSizeVariant: SizeVariantSpreadFunction<VariantProps> = (
  val = '$true',
  extras
) => {
  const radiusToken = extras.tokens.radius[val] ?? extras.tokens.radius['$true']
  const paddingHorizontal = getSpace(val, {
    shift: -1,
    bounds: [2],
  })

  const fontSizeToken = isFontSizeToken(val) ? val : '$true'
  const fontStyle = getFontSized(fontSizeToken, extras as GetFontSizedExtras)
  const { lineHeight: _lineHeight, ...fontStyleWithoutLineHeight } = fontStyle || {}
  const resolvedFontStyle = isWeb ? fontStyle : fontStyleWithoutLineHeight

  return {
    ...resolvedFontStyle,
    height: val,
    borderRadius: extras.props.circular ? 100_000 : radiusToken,
    paddingHorizontal,
  }
}

const InputFrame = styled(TInput, {
  unstyled: true,
  context: InputContext,
})

const InputImpl = InputFrame.styleable((props, ref) => {
  const { setFocused } = FocusContext.useStyledContext()
  const { size } = InputContext.useStyledContext()
  const { ...rest } = props
  return (
    <View flex={1}>
      <InputFrame
        ref={ref}
        onFocus={() => {
          setFocused(true)
        }}
        onBlur={() => setFocused(false)}
        size={size}
        {...rest}
      />
    </View>
  )
})

const InputSection = styled(XGroup.Item, {
  justifyContent: 'center',
  alignItems: 'center',
  context: InputContext,
})

const Button = styled(TButton, {
  context: InputContext,
  justifyContent: 'center',
  alignItems: 'center',

  variants: {
    size: {
      '...size': (val = '$true', { tokens }) => {
        if (typeof val === 'number') {
          return {
            paddingHorizontal: 0,
            height: val,
            borderRadius: val * 0.2,
          }
        }
        return {
          paddingHorizontal: 0,
          height: val,
          borderRadius: tokens.radius[val],
        }
      },
    },
  } as const,
})

// Icon starts

export const InputIconFrame = styled(View, {
  justifyContent: 'center',
  alignItems: 'center',
  context: InputContext,

  variants: {
    size: {
      '...size': (val, { tokens }) => {
        return {
          paddingHorizontal: tokens.space[val],
        }
      },
    },
  } as const,
})

const getIconSize = (size: FontSizeTokens, scale: number) => {
  return (typeof size === 'number' ? size * 0.5 : getFontSize(size as FontSizeTokens)) * scale
}

const InputIcon = InputIconFrame.styleable<{
  scaleIcon?: number
  color?: ColorTokens | string
}>((props, ref) => {
  const { children, color: colorProp, ...rest } = props
  const inputContext = InputContext.useStyledContext()
  const { size = '$true', color: contextColor, scaleIcon = 1 } = inputContext

  const theme = useTheme()
  const color = getVariable(
    // biome-ignore lint/suspicious/noExplicitAny: theme tokens are not strongly typed
    contextColor || theme[contextColor as any]?.get('web') || theme.color10?.get('web')
  )
  const iconSize = getIconSize(size as FontSizeTokens, scaleIcon)

  // biome-ignore lint/suspicious/noExplicitAny: themed icon helper expects any typed token
  const getThemedIcon = useGetThemedIcon({ size: iconSize, color: color as any })
  return (
    <InputIconFrame ref={ref} {...rest}>
      {getThemedIcon(children)}
    </InputIconFrame>
  )
})

export const InputContainerFrame = styled(View, {
  context: InputContext,
  flexDirection: 'column',

  variants: {
    size: {
      '...size': (val, { tokens }) => ({
        gap: tokens.space[val].val * 0.3,
      }),
    },
    color: {
      '...color': () => ({}),
    },
    gapScale: {
      // biome-ignore lint/suspicious/noExplicitAny: tamagui variant typing requires loose number mapping
      ':number': {} as any,
    },
  } as const,

  defaultVariants: {
    size: '$4',
  },
})

export const InputLabel = styled(Label, {
  context: InputContext,
  variants: {
    size: {
      '...fontSize': getFontSizedVariant,
    },
  } as const,
})

export const InputInfo = styled(Text, {
  context: InputContext,
  color: '$color10',

  variants: {
    size: {
      '...fontSize': (val, { font }) => {
        if (!font) return
        const tokenKey = getFontTokenKey(val)
        const fontSizeValue = getNumericTokenValue(getTokenFromRecord(font.size, tokenKey))
        const lineHeightValue = getNumericTokenValue(getTokenFromRecord(font.lineHeight, tokenKey))
        const fontWeightToken = getTokenFromRecord(font.weight, '$2')
        const letterSpacing = getTokenFromRecord(font.letterSpacing, tokenKey)
        const textTransform = getTokenFromRecord(font.transform, tokenKey)
        const fontStyle = getTokenFromRecord(font.style, tokenKey)
        const fontWeight = getPrimitiveTokenValue(fontWeightToken)

        const fontSize = typeof fontSizeValue === 'number' ? fontSizeValue * 0.8 : undefined
        const lineHeight = typeof lineHeightValue === 'number' ? lineHeightValue * 0.8 : undefined

        return {
          fontSize,
          lineHeight,
          fontWeight,
          letterSpacing,
          textTransform,
          fontStyle,
        }
      },
    },
  } as const,
})

const InputXGroup = styled(XGroup, {
  context: InputContext,

  variants: {
    size: {
      '...size': (val, { tokens }) => {
        const radiusToken = tokens.radius[val] ?? tokens.radius['$true']
        return {
          borderRadius: radiusToken,
        }
      },
    },
  } as const,
})

export const Input = withStaticProperties(InputContainerFrame, {
  Box: InputGroupImpl,
  Area: InputImpl,
  Section: InputSection,
  Button,
  Icon: InputIcon,
  Info: InputInfo,
  Label: InputLabel,
  XGroup: withStaticProperties(InputXGroup, { Item: XGroup.Item }),
})

export const InputNew = () => {
  return (
    <Input w={400} size="$3">
      <Input.Box>
        <Input.Section>
          <Input.Icon>
            <User />
          </Input.Icon>
        </Input.Section>
        <Input.Section>
          <Input.Area paddingLeft={0} />
        </Input.Section>
        <Input.Section>
          <Input.Button>
            <Input.Icon>
              <User />
            </Input.Icon>
          </Input.Button>
        </Input.Section>
      </Input.Box>
    </Input>
  )
}
