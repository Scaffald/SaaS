import React from 'react';
import { Palette } from 'lucide-react';
import { YStack, XStack, Text, styled, useTheme } from '@unicornlove/ui';

interface ColorSwatchProps {
  name: string;
  colorVar: string;
  weight: number;
}

const SwatchContainer = styled(XStack, {
  name: 'ColorSwatchContainer',
  alignItems: 'center',
  gap: '$3',
});

const SwatchBox = styled(XStack, {
  name: 'ColorSwatchBox',
  width: 80, // w-20
  height: 80, // h-20
  borderRadius: '$lg',
  shadowColor: '$shadowColor',
  shadowRadius: 5,
  shadowOffset: { width: 0, height: 2 },
  borderWidth: 1,
  borderColor: '$borderColor',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '500',
  fontSize: '$2',
  transition: 'transform 0.2s ease-in-out',
  hoverStyle: {
    scale: 1.05,
  },
});

const SwatchInfo = styled(YStack, {
  name: 'SwatchInfo',
  flex: 1,
});

function ColorSwatch({ name, colorVar, weight }: ColorSwatchProps) {
  const theme = useTheme();
  const textColor = weight >= 600 ? theme.color1.val : theme.color12.val;

  return (
    <SwatchContainer>
      <SwatchBox
        style={{ backgroundColor: `rgb(var(${colorVar}))`, color: textColor }}
      >
        {weight}
      </SwatchBox>
      <SwatchInfo>
        <Text fontSize="$2" fontFamily="$mono" color="$color11">
          {colorVar}
        </Text>
        <Text fontSize="$1" fontFamily="$mono" color="$color10" marginTop="$1">
          rgb(var({colorVar}))
        </Text>
      </SwatchInfo>
    </SwatchContainer>
  );
}

interface ColorPaletteProps {
  name: string;
  displayName: string;
  baseColor: string;
}

const PaletteCard = styled(YStack, {
  name: 'ColorPaletteCard',
  backgroundColor: '$background',
  borderRadius: '$xl',
  shadowColor: '$shadowColor',
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 5 },
  borderWidth: 1,
  borderColor: '$borderColor',
  padding: '$6',
});

const PaletteHeader = styled(XStack, {
  name: 'PaletteHeader',
  alignItems: 'center',
  gap: '$3',
  marginBottom: '$6',
  paddingBottom: '$4',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
});

const BaseColorBox = styled(XStack, {
  name: 'BaseColorBox',
  width: 48, // w-12
  height: 48, // h-12
  borderRadius: '$lg',
  shadowColor: '$shadowColor',
  shadowRadius: 5,
  shadowOffset: { width: 0, height: 2 },
});

function ColorPalette({ name, displayName, baseColor }: ColorPaletteProps) {
  const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];

  return (
    <PaletteCard>
      <PaletteHeader>
        <BaseColorBox style={{ backgroundColor: baseColor }} />
        <YStack>
          <Text fontSize="$5" fontWeight="bold" color="$color11">
            {displayName}
          </Text>
          <Text fontSize="$2" color="$color10" fontFamily="$mono">
            {baseColor}
          </Text>
        </YStack>
      </PaletteHeader>

      <YStack gap="$4">
        {weights.map((weight) => (
          <ColorSwatch
            key={weight}
            name={`${name}-${weight}`}
            colorVar={`--color-${name}-${weight}`}
            weight={weight}
          />
        ))}
      </YStack>
    </PaletteCard>
  );
}

const HeroSection = styled(YStack, {
  name: 'ColorsHeroSection',
  background: 'linear-gradient(to right, $blue9, $teal9)',
  borderRadius: '$xl',
  padding: '$8',
  color: '$color1',
  shadowColor: '$shadowColor',
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 10 },
});

const HeroIconContainer = styled(XStack, {
  name: 'HeroIconContainer',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  padding: '$4',
  borderRadius: '$xl',
  backdropFilter: 'blur(10px)',
});

const InfoCard = styled(YStack, {
  name: 'InfoCard',
  backgroundColor: '$background',
  borderRadius: '$xl',
  shadowColor: '$shadowColor',
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 5 },
  borderWidth: 1,
  borderColor: '$borderColor',
  padding: '$6',
});

const CodeBlock = styled(YStack, {
  name: 'CodeBlock',
  backgroundColor: '$backgroundSecondary',
  borderRadius: '$lg',
  padding: '$4',
  fontFamily: '$mono',
  fontSize: '$2',
  color: '$color10',
  gap: '$1',
});

export default function Colors() {
  const colorPalettes = [
    { name: 'blue', displayName: 'Blue (Primary)', baseColor: '#0166FF' },
    { name: 'orange', displayName: 'Orange (Secondary)', baseColor: '#F0A000' },
    { name: 'yellow', displayName: 'Yellow (Tertiary)', baseColor: '#F2D200' },
    { name: 'gray', displayName: 'Gray (Neutral)', baseColor: '#5D6570' },
    { name: 'teal', displayName: 'Teal (Accent)', baseColor: '#008A94' },
  ];

  return (
    <YStack gap="$6" padding="$4">
      <HeroSection>
        <XStack alignItems="center" gap="$4">
          <HeroIconContainer>
            <Palette size={32} color="white" />
          </HeroIconContainer>
          <YStack>
            <Text fontSize="$7" fontWeight="bold" color="$color1">
              Color System
            </Text>
            <Text fontSize="$4" color="rgba(255, 255, 255, 0.9)" marginTop="$1">
              Complete 100-900 weight color scales for all brand colors
            </Text>
          </YStack>
        </XStack>
      </HeroSection>

      <InfoCard>
        <Text fontSize="$4" fontWeight="600" color="$color11" marginBottom="$4">
          Color Scale Structure
        </Text>
        <YStack gap="$2">
          <Text fontSize="$2" color="$color10">
            <Text fontWeight="600" color="$color11">100:</Text> Lightest tint - near white with subtle color hint
          </Text>
          <Text fontSize="$2" color="$color10">
            <Text fontWeight="600" color="$color11">200-400:</Text> Light variations - ideal for backgrounds and subtle UI elements
          </Text>
          <Text fontSize="$2" color="$color10">
            <Text fontWeight="600" color="$color11">500:</Text> Base color - the primary brand color value
          </Text>
          <Text fontSize="$2" color="$color10">
            <Text fontWeight="600" color="$color11">600-800:</Text> Dark variations - ideal for text and emphasis
          </Text>
          <Text fontSize="$2" color="$color10">
            <Text fontWeight="600" color="$color11">900:</Text> Darkest shade - near black with subtle color tint
          </Text>
        </YStack>
      </InfoCard>

      <XStack flexWrap="wrap" gap="$6">
        {colorPalettes.map((palette) => (
          <YStack key={palette.name} flex={1} minWidth={300}>
            <ColorPalette
              name={palette.name}
              displayName={palette.displayName}
              baseColor={palette.baseColor}
            />
          </YStack>
        ))}
      </XStack>

      <InfoCard>
        <Text fontSize="$4" fontWeight="600" color="$color11" marginBottom="$4">
          Usage Examples
        </Text>
        <YStack gap="$4">
          <YStack>
            <Text fontSize="$2" fontWeight="600" color="$color11" marginBottom="$2">
              Tamagui Theme Tokens
            </Text>
            <CodeBlock>
              <Text>backgroundColor: '$blue9'</Text>
              <Text>color: '$orange11'</Text>
              <Text>borderColor: '$teal7'</Text>
            </CodeBlock>
          </YStack>

          <YStack>
            <Text fontSize="$2" fontWeight="600" color="$color11" marginBottom="$2">
              CSS Variables
            </Text>
            <CodeBlock>
              <Text>color: rgb(var(--color-blue-500));</Text>
              <Text>background-color: rgb(var(--color-orange-100));</Text>
              <Text>border-color: rgb(var(--color-gray-300));</Text>
            </CodeBlock>
          </YStack>
        </YStack>
      </InfoCard>
    </YStack>
  );
}
