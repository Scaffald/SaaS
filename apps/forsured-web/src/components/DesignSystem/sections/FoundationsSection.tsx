import React from 'react';
import { YStack, XStack, View, Text, H1, H2, H3 } from '@unicornlove/ui';
import ComponentShowcase from '../ComponentShowcase';
import { Palette, Box as BoxIcon, Sun } from 'lucide-react';

export default function FoundationsSection() {
  const colorRamps = [
    { name: 'Primary (Blue)', base: '#0166FF', var: 'primary' },
    { name: 'Secondary (Orange)', base: '#F0A000', var: 'secondary' },
    { name: 'Tertiary (Yellow)', base: '#F2D200', var: 'tertiary' },
    { name: 'Success (Green)', base: '#22C55E', var: 'success' },
    { name: 'Warning (Amber)', base: '#F59E0B', var: 'warning' },
    { name: 'Error (Red)', base: '#EF4444', var: 'error' },
  ];

  const spacingScale = [
    { size: '0', value: '0px', class: 'p-0' },
    { size: '1', value: '4px', class: 'p-1' },
    { size: '2', value: '8px', class: 'p-2' },
    { size: '3', value: '12px', class: 'p-3' },
    { size: '4', value: '16px', class: 'p-4' },
    { size: '6', value: '24px', class: 'p-6' },
    { size: '8', value: '32px', class: 'p-8' },
    { size: '12', value: '48px', class: 'p-12' },
    { size: '16', value: '64px', class: 'p-16' },
  ];

  const shadows = [
    { name: 'Small', class: 'shadow-sm' },
    { name: 'Medium', class: 'shadow-md' },
    { name: 'Large', class: 'shadow-lg' },
    { name: 'Extra Large', class: 'shadow-xl' },
  ];

  return (
    <YStack gap="$8" mb="$12">
      <XStack alignItems="center" gap="$3" mb="$6">
        <Palette color="var(--blue10)" size={32} />
        <H2 fontSize="$9" fontWeight="bold" color="$color12">
          Foundations
        </H2>
      </XStack>

      <ComponentShowcase
        title="Colors"
        description="Complete color palette with 100-900 weight scales for all brand colors"
      >
        <XStack width="100%" flexWrap="wrap" gap="$6">
          {colorRamps.map((color) => (
            <YStack key={color.var} gap="$2" flex={1} minWidth={200}>
              <XStack fontWeight="600" color="$color12" mb="$3" alignItems="center" gap="$2">
                <View
                  width={24}
                  height={24}
                  borderRadius="$2"
                  shadowRadius={2}
                  style={{ backgroundColor: color.base }}
                />
                <Text>{color.name}</Text>
              </XStack>
              <YStack gap="$1">
                {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => (
                  <XStack key={weight} alignItems="center" gap="$2">
                    <View
                      width={64}
                      height={32}
                      borderRadius="$2"
                      shadowRadius={2}
                      borderWidth={1}
                      borderColor="$borderColor"
                      style={{
                        backgroundColor: `rgb(var(--color-${color.var}-${weight}))`,
                      }}
                    />
                    <Text fontSize="$2" fontFamily="$mono" color="$color11">
                      {weight}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            </YStack>
          ))}
        </XStack>
      </ComponentShowcase>

      <ComponentShowcase
        title="Typography"
        description="Font families, sizes, and weights used throughout the system"
      >
        <YStack width="100%" gap="$6">
          <View>
            <Text fontSize="$3" fontWeight="600" color="$color11" mb="$3">
              Display Font (Rokkitt)
            </Text>
            <H1 fontFamily="$display" fontSize="$10" fontWeight="bold" color="$color12">
              The quick brown fox
            </H1>
            <H2 fontFamily="$display" fontSize="$9" fontWeight="bold" color="$color12" mt="$2">
              The quick brown fox
            </H2>
            <H3 fontFamily="$display" fontSize="$8" fontWeight="bold" color="$color12" mt="$2">
              The quick brown fox
            </H3>
          </View>
          <View>
            <Text fontSize="$3" fontWeight="600" color="$color11" mb="$3">
              Body Font (Inter)
            </Text>
            <Text fontSize="$6" color="$color12">
              The quick brown fox jumps over the lazy dog
            </Text>
            <Text fontSize="$4" color="$color12" mt="$2">
              The quick brown fox jumps over the lazy dog
            </Text>
            <Text fontSize="$3" color="$color12" mt="$2">
              The quick brown fox jumps over the lazy dog
            </Text>
            <Text fontSize="$2" color="$color12" mt="$2">
              The quick brown fox jumps over the lazy dog
            </Text>
          </View>
        </YStack>
      </ComponentShowcase>

      <ComponentShowcase
        title="Spacing System"
        description="8px-based spacing scale for consistent layouts"
      >
        <YStack width="100%" gap="$2">
          {spacingScale.map((space) => (
            <XStack key={space.size} alignItems="center" gap="$4">
              <Text fontSize="$3" fontFamily="$mono" color="$color11" width={48}>
                {space.class}
              </Text>
              <View
                backgroundColor="$blue4"
                style={{ width: space.value, height: 32 }}
              />
              <Text fontSize="$3" color="$color10">{space.value}</Text>
            </XStack>
          ))}
        </YStack>
      </ComponentShowcase>

      <ComponentShowcase
        title="Shadows"
        description="Elevation system using box shadows"
      >
        <XStack width="100%" flexWrap="wrap" gap="$6">
          {shadows.map((shadow, index) => (
            <YStack key={shadow.name} alignItems="center" flex={1} minWidth={140}>
              <View
                width="100%"
                height={96}
                backgroundColor="$background"
                borderRadius="$4"
                shadowRadius={index === 0 ? 2 : index === 1 ? 4 : index === 2 ? 8 : 12}
                shadowColor="$shadowColor"
                shadowOffset={{ width: 0, height: index + 1 }}
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="$3" fontWeight="500" color="$color12">
                  {shadow.name}
                </Text>
              </View>
              <Text fontSize="$2" color="$color11" mt="$2" fontFamily="$mono">
                {shadow.class}
              </Text>
            </YStack>
          ))}
        </XStack>
      </ComponentShowcase>

      <ComponentShowcase
        title="Themes"
        description="Light, Dark, and Earth theme variations"
      >
        <YStack width="100%" gap="$4">
          <XStack flexWrap="wrap" gap="$4">
            <View flex={1} minWidth={180} backgroundColor="white" borderWidth={1} borderColor="$gray6" borderRadius="$4" padding="$4" alignItems="center">
              <Sun color="#eab308" size={32} />
              <Text fontWeight="600" color="$gray12" mt="$2">Light Theme</Text>
              <Text fontSize="$2" color="$gray11" mt="$1">Clean and bright</Text>
            </View>
            <View flex={1} minWidth={180} backgroundColor="$gray12" borderWidth={1} borderColor="$gray10" borderRadius="$4" padding="$4" alignItems="center">
              <Sun color="#60a5fa" size={32} />
              <Text fontWeight="600" color="white" mt="$2">Dark Theme</Text>
              <Text fontSize="$2" color="$gray8" mt="$1">Low-light optimized</Text>
            </View>
            <View flex={1} minWidth={180} backgroundColor="$orange2" borderWidth={1} borderColor="$orange6" borderRadius="$4" padding="$4" alignItems="center">
              <Sun color="#ea580c" size={32} />
              <Text fontWeight="600" color="$orange12" mt="$2">Earth Theme</Text>
              <Text fontSize="$2" color="$orange11" mt="$1">Warm and natural</Text>
            </View>
          </XStack>
          <Text fontSize="$3" color="$color11" style={{ textAlign: 'center' }}>
            Use the theme switcher in the top right to preview all themes
          </Text>
        </YStack>
      </ComponentShowcase>
    </YStack>
  );
}
