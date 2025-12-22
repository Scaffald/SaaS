import { useTheme, styled } from '@unicornlove/ui'
import type { GetProps } from '@unicornlove/ui'

const SvgContainer = styled('svg', {
  name: 'ForsuredLogoSvg',
})

type SvgContainerProps = GetProps<typeof SvgContainer>

interface ForsuredLogoProps extends Omit<SvgContainerProps, 'height' | 'width' | 'marginBottom'> {
  height?: number
  width?: number
  color?: 'blue' | 'white' | 'auto'
  mb?: SvgContainerProps['mb']
}

export default function ForsuredLogo({
  height = 20,
  width,
  color = 'auto',
  mb,
  ...props
}: ForsuredLogoProps) {
  const theme = useTheme()

  const getLogoColor = () => {
    if (color === 'blue') return '#0166FF'
    if (color === 'white') return '#F9FAFB'

    // Use Tamagui theme colors
    const themeName = theme?.name || 'light'
    switch (themeName) {
      case 'light':
        return '#0166FF'
      case 'dark':
        return '#60A5FA'
      case 'earth':
        return '#8B6944'
      default:
        return '#0166FF'
    }
  }

  const fillColor = getLogoColor()
  const aspectRatio = 151 / 30
  const calculatedWidth = width ?? height * aspectRatio

  return (
    <SvgContainer
      width={calculatedWidth}
      height={height}
      viewBox="0 0 151 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      mb={mb}
      {...props}
    >
      <path
        d="M0 0.576735H19.3945V4.61392H4.69658V13.3329H17.4348V17.3701H4.69658V29.1085H0V0.576735Z"
        fill={fillColor}
      />
      <path
        d="M19.9689 25.0034V12.8579L23.9897 8.78681H35.1737L39.2283 12.8579V25.0034L35.1737 29.0745H23.9897L19.9689 25.0034ZM33.0112 25.207L34.6331 23.5785V14.2828L33.0112 12.6544H26.1522L24.5304 14.2828V23.5785L26.1522 25.207H33.0112Z"
        fill={fillColor}
      />
      <path
        d="M55.3452 25.2748V22.7982H59.8391V24.0874L60.9879 25.2748H67.8807L69.0295 24.0874V21.8822L67.8469 20.6948H59.1295L55.5142 17.0308V12.4847L59.1971 8.78681H69.3674L73.0841 12.5865V15.0631H68.5903V13.7739L67.4415 12.5865H61.1231L59.9743 13.7739V15.8095L61.1568 16.9969H69.8404L73.4896 20.6948V25.3766L69.8067 29.0745H59.062L55.3452 25.2748Z"
        fill={fillColor}
      />
      <path
        d="M75.652 24.9695V8.78681H80.2473V23.5107L81.8353 25.1052H85.3493L89.6404 20.7966V8.78681H94.2356V29.0745H89.9783V25.3427L86.194 29.0745H79.7404L75.652 24.9695Z"
        fill={fillColor}
      />
      <path
        d="M110.522 25.0373V12.8579L114.542 8.78681H125.524L129.612 12.8579V20.4234H115.083V23.6803L116.637 25.2409H123.564L125.017 23.7481V22.5268H129.544V25.1391L125.625 29.0745H114.475L110.488 25.0373H110.522ZM125.017 17.0647V14.2489L123.429 12.6204H116.671L115.083 14.2489V17.0647H125.017Z"
        fill={fillColor}
      />
      <path
        d="M101.297 29.0745V16.8951L105.352 12.7561H107.785L111.67 8.78681H104.338L100.96 12.2473V8.78681H96.7022V29.0745H101.297Z"
        fill={fillColor}
      />
      <path
        d="M131.741 25.0034V12.8579L135.761 8.78682H143.702L146.405 11.1616V0H151V29.0745H146.675V25.7498L143.364 29.0745H135.795L131.774 25.0034H131.741ZM142.823 25.1052L146.439 21.4412V15.5042L143.33 12.7222H138.059L136.37 14.4185V23.375L138.059 25.0713H142.857L142.823 25.1052Z"
        fill={fillColor}
      />
      <path
        d="M45.9522 29.0745V16.8951L50.0068 12.7561H52.4395L56.3252 8.78681H48.9931L45.6143 12.2473V8.78681H41.357V29.0745H45.9522Z"
        fill={fillColor}
      />
    </SvgContainer>
  )
}
