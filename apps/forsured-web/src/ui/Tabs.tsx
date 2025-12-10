import React, { ReactNode, useState } from 'react';
import { YStack, XStack, Text, Button, styled, useTheme } from '@unicornlove/ui';
import { Chip as Badge } from '@unicornlove/ui';

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  disabled?: boolean;
  badge?: string | number;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'line' | 'pill' | 'enclosed';
  className?: string;
}

const TabsContainer = styled(YStack, {
  name: 'TabsContainer',
});

const TabsList = styled(XStack, {
  name: 'TabsList',
  gap: '$1',
  variants: {
    variant: {
      line: {
        borderBottomWidth: 1,
        borderBottomColor: '$borderColor',
      },
      pill: {
        backgroundColor: '$backgroundSecondary',
        borderRadius: '$lg',
        padding: '$1',
      },
      enclosed: {
        borderBottomWidth: 1,
        borderBottomColor: '$borderColor',
      },
    },
  } as const,
});

const TabButton = styled(Button, {
  name: 'TabButton',
  paddingHorizontal: '$4',
  paddingVertical: '$2',
  fontWeight: '500',
  fontSize: '$2',
  alignItems: 'center',
  gap: '$2',
  transition: 'all 0.2s ease-in-out',
  variants: {
    variant: {
      line: {
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        borderRadius: '$0',
        hoverStyle: {
          borderBottomColor: '$borderColorHover',
        },
      },
      pill: {
        borderRadius: '$md',
        backgroundColor: 'transparent',
        hoverStyle: {
          backgroundColor: '$backgroundTertiary',
        },
      },
      enclosed: {
        borderWidth: 1,
        borderColor: 'transparent',
        borderTopLeftRadius: '$lg',
        borderTopRightRadius: '$lg',
        marginBottom: '-1px',
        borderRadius: '$0',
        hoverStyle: {
          borderColor: '$borderColorHover',
        },
      },
    },
    active: {
      true: {},
      false: {},
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
      false: {},
    },
  } as const,
  compoundVariants: [
    {
      variant: 'line',
      active: true,
      style: {
        borderBottomColor: '$primary9',
        color: '$primary11',
      },
    },
    {
      variant: 'line',
      active: false,
      style: {
        color: '$color10',
        hoverStyle: {
          color: '$color11',
        },
      },
    },
    {
      variant: 'pill',
      active: true,
      style: {
        backgroundColor: '$primary9',
        color: '$color1',
        shadowColor: '$shadowColor',
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
      },
    },
    {
      variant: 'pill',
      active: false,
      style: {
        color: '$color10',
        hoverStyle: {
          color: '$color11',
        },
      },
    },
    {
      variant: 'enclosed',
      active: true,
      style: {
        borderColor: '$borderColor',
        borderBottomColor: '$background',
        backgroundColor: '$background',
        color: '$color11',
      },
    },
    {
      variant: 'enclosed',
      active: false,
      style: {
        color: '$color10',
        hoverStyle: {
          color: '$color11',
        },
      },
    },
  ],
});

export default function Tabs({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onChange,
  variant = 'line',
  className = '',
}: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id);
  const theme = useTheme();

  // Support controlled mode when activeTab prop is provided
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabChange = (tabId: string) => {
    setInternalActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <TabsContainer className={className}>
      <TabsList variant={variant}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <TabButton
              key={tab.id}
              onPress={() => !tab.disabled && handleTabChange(tab.id)}
              variant={variant}
              active={isActive}
              disabled={tab.disabled}
            >
              {Icon && (
                <Icon
                  size={16}
                  color={isActive ? (variant === 'pill' ? theme.color1?.val ?? '#fff' : theme.primary11?.val ?? '#0ea5e9') : theme.color10?.val ?? '#6b7280'}
                />
              )}
              <Text>{tab.label}</Text>
              {tab.badge && (
                <Badge
                  variant={isActive && variant === 'pill' ? 'default' : 'default'}
                  size="sm"
                  style={{
                    backgroundColor: isActive && variant === 'pill'
                      ? 'rgba(255, 255, 255, 0.2)'
                      : theme.backgroundTertiary?.val ?? '#f3f4f6',
                    color: isActive && variant === 'pill'
                      ? theme.color1?.val ?? '#fff'
                      : theme.color11?.val ?? '#374151',
                  }}
                >
                  {tab.badge}
                </Badge>
              )}
            </TabButton>
          );
        })}
      </TabsList>
      <YStack marginTop="$4">{activeTabContent}</YStack>
    </TabsContainer>
  );
}
