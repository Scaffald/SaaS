/**
 * ThemeSwitcher - Theme switcher using Tamagui
 */
import React, { useState } from 'react';
import { Sun, Moon, Leaf } from 'lucide-react';
import { YStack, XStack, Text, Button, styled } from '@unicornlove/ui';
import { useTheme as useTamaguiTheme } from '@unicornlove/ui';

type Theme = 'light' | 'dark' | 'earth';

export default function ThemeSwitcher() {
  const tamaguiTheme = useTamaguiTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes: {
    value: Theme;
    label: string;
    icon: React.ElementType;
    color: string;
  }[] = [
    { value: 'light', label: 'Light', icon: Sun, color: 'rgb(59, 130, 246)' },
    { value: 'dark', label: 'Dark', icon: Moon, color: 'rgb(96, 165, 250)' },
    { value: 'earth', label: 'Earth', icon: Leaf, color: 'rgb(184, 97, 54)' },
  ];

  const currentThemeName = (tamaguiTheme?.name || 'light') as Theme;
  const currentTheme = themes.find((t) => t.value === currentThemeName) || themes[0];

  const handleThemeChange = (newTheme: Theme) => {
    // Update document data-theme attribute for CSS variable compatibility
    document.documentElement.setAttribute('data-theme', newTheme);
    setIsOpen(false);
  };

  const ThemeButton = styled(Button, {
    name: 'ThemeButton',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '$3',
    paddingHorizontal: '$4',
    paddingVertical: '$3',
    borderRadius: '$3',
    backgroundColor: 'transparent',
    
    variants: {
      active: {
        true: {
          backgroundColor: '$blue3',
          color: '$blue11',
        },
        false: {
          color: '$color10',
          hoverStyle: {
            backgroundColor: '$backgroundHover',
            color: '$color11',
          },
        },
      },
    } as const,
  });

  return (
    <YStack
      position="fixed"
      bottom="$6"
      right="$6"
      zIndex={50}
    >
      <YStack position="relative">
        {isOpen && (
          <>
            <YStack
              position="fixed"
              top={0}
              left={0}
              right={0}
              bottom={0}
              onPress={() => setIsOpen(false)}
            />
            <YStack
              position="absolute"
              bottom="100%"
              right={0}
              mb="$3"
              backgroundColor="$backgroundHover"
              borderRadius="$5"
              shadowColor="$shadowColor"
              shadowRadius={20}
              shadowOffset={{ width: 0, height: 8 }}
              borderWidth={2}
              borderColor="$borderColor"
              padding="$2"
              minWidth={160}
            >
              {themes.map((t) => {
                const Icon = t.icon;
                const isActive = currentThemeName === t.value;
                return (
                  <ThemeButton
                    key={t.value}
                    onPress={() => handleThemeChange(t.value)}
                    active={isActive}
                  >
                    <Icon size={20} color={isActive ? t.color : undefined} />
                    <Text fontWeight="500">{t.label}</Text>
                  </ThemeButton>
                );
              })}
            </YStack>
          </>
        )}

        <Button
          onPress={() => setIsOpen(!isOpen)}
          backgroundColor="$backgroundHover"
          hoverStyle={{ backgroundColor: '$backgroundPress', borderColor: '$borderColorHover', scale: 1.1 }}
          color="$color11"
          borderRadius="$10"
          padding="$4"
          shadowColor="$shadowColor"
          shadowRadius={20}
          shadowOffset={{ width: 0, height: 8 }}
          borderWidth={2}
          borderColor="$borderColor"
          aria-label="Change theme"
        >
          <currentTheme.icon
            size={24}
            color={currentTheme.color}
          />
        </Button>
      </YStack>
    </YStack>
  );
}
