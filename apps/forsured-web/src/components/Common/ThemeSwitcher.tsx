/**
 * ThemeSwitcher - Theme switcher using Beyond UI
 * Migrated from Tamagui to Beyond UI
 */
import React, { useState, useEffect } from 'react';
import { Sun, Moon, Leaf } from 'lucide-react';
import { Stack, Row, Text, Button } from '@unicornlove/beyond-ui';

type Theme = 'light' | 'dark' | 'earth';

export default function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentThemeName, setCurrentThemeName] = useState<Theme>('light');

  useEffect(() => {
    const storedTheme = document.documentElement.getAttribute('data-theme') as Theme;
    if (storedTheme) {
      setCurrentThemeName(storedTheme);
    }
  }, []);

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

  const currentTheme = themes.find((t) => t.value === currentThemeName) || themes[0];

  const handleThemeChange = (newTheme: Theme) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    setCurrentThemeName(newTheme);
    setIsOpen(false);
  };

  return (
    <Stack
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 50,
      }}
    >
      <Stack style={{ position: 'relative' }}>
        {isOpen && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              onClick={() => setIsOpen(false)}
            />
            <Stack
              style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                marginBottom: 12,
                backgroundColor: 'var(--color-background-hover)',
                borderRadius: 12,
                boxShadow: '0 8px 20px var(--color-shadow)',
                border: '2px solid var(--color-border)',
                padding: 8,
                minWidth: 160,
              }}
            >
              {themes.map((t) => {
                const Icon = t.icon;
                const isActive = currentThemeName === t.value;
                return (
                  <Button
                    key={t.value}
                    onClick={() => handleThemeChange(t.value)}
                    variant="ghost"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      gap: 12,
                      paddingLeft: 16,
                      paddingRight: 16,
                      paddingTop: 12,
                      paddingBottom: 12,
                      backgroundColor: isActive ? 'var(--color-blue-3)' : 'transparent',
                      color: isActive ? 'var(--color-blue-11)' : 'var(--color-text-muted)',
                    }}
                  >
                    <Icon size={20} color={isActive ? t.color : undefined} />
                    <Text weight="medium">{t.label}</Text>
                  </Button>
                );
              })}
            </Stack>
          </>
        )}

        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="ghost"
          style={{
            backgroundColor: 'var(--color-background-hover)',
            borderRadius: '50%',
            padding: 16,
            boxShadow: '0 8px 20px var(--color-shadow)',
            border: '2px solid var(--color-border)',
          }}
          aria-label="Change theme"
        >
          <currentTheme.icon
            size={24}
            color={currentTheme.color}
          />
        </Button>
      </Stack>
    </Stack>
  );
}
