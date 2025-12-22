import React, { useState } from 'react';
import { YStack, XStack, View, Text } from '@unicornlove/ui';
import {
  X,
  ChevronDown,
  Menu,
  Home,
  Box,
  LayoutGrid,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ForsuredLogo from '../Common/ForsuredLogo';

export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ComponentType<{ size?: number }>;
  children?: NavigationItem[];
}

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavigationDrawer({
  isOpen,
  onClose,
}: NavigationDrawerProps) {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'foundations',
    'components',
  ]);

  const navigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Design System Home',
      href: '/design-system',
      icon: Home,
    },
    {
      id: 'foundations',
      label: 'Foundations',
      icon: Layers,
      children: [
        { id: 'colors', label: 'Colors', href: '#colors' },
        { id: 'typography', label: 'Typography', href: '#typography' },
        { id: 'spacing', label: 'Spacing', href: '#spacing' },
        { id: 'shadows', label: 'Shadows', href: '#shadows' },
        { id: 'themes', label: 'Themes', href: '#themes' },
      ],
    },
    {
      id: 'components',
      label: 'Components',
      icon: Box,
      children: [
        { id: 'buttons', label: 'Buttons', href: '#buttons' },
        { id: 'forms', label: 'Form Controls', href: '#forms' },
        { id: 'display', label: 'Display', href: '#display' },
        { id: 'feedback', label: 'Feedback', href: '#feedback' },
        { id: 'navigation', label: 'Navigation', href: '#navigation' },
        { id: 'data-display', label: 'Data Display', href: '#data-display' },
        { id: 'layout', label: 'Layout', href: '#layout' },
      ],
    },
    {
      id: 'patterns',
      label: 'Patterns',
      icon: LayoutGrid,
      children: [
        {
          id: 'forms-patterns',
          label: 'Form Patterns',
          href: '#form-patterns',
        },
        {
          id: 'layout-patterns',
          label: 'Layout Patterns',
          href: '#layout-patterns',
        },
        {
          id: 'feedback-patterns',
          label: 'Feedback Patterns',
          href: '#feedback-patterns',
        },
      ],
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleNavigate = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.getElementById(href.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        onClose();
      }
    } else {
      navigate(href);
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <View
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={40}
          $gtLg={{ display: 'none' }}
          onPress={onClose}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        />
      )}

      <View
        tag="aside"
        position="absolute"
        top={0}
        left={0}
        height="100vh"
        width={288}
        backgroundColor="$background"
        borderRightWidth={1}
        borderRightColor="$borderColor"
        zIndex={50}
        overflow="scroll"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms ease-in-out',
        }}
        $gtLg={{
          position: 'fixed',
          transform: 'translateX(0)',
        }}
      >
        <XStack padding="$6" borderBottomWidth={1} borderBottomColor="$borderColor" alignItems="center" justifyContent="space-between">
          <ForsuredLogo height={24} />
          <View
            tag="button"
            onPress={onClose}
            padding="$2"
            borderRadius="$4"
            hoverStyle={{ backgroundColor: '$backgroundSecondary' }}
            $gtLg={{ display: 'none' }}
          >
            <X size={20} color="var(--color11)" />
          </View>
        </XStack>

        <View tag="nav" padding="$4">
          <YStack gap="$1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedSections.includes(item.id);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <YStack key={item.id}>
                  {hasChildren ? (
                    <>
                      <XStack
                        tag="button"
                        onPress={() => toggleSection(item.id)}
                        width="100%"
                        alignItems="center"
                        justifyContent="space-between"
                        paddingHorizontal="$3"
                        paddingVertical="$2"
                        borderRadius="$4"
                        hoverStyle={{ backgroundColor: '$backgroundSecondary' }}
                        cursor="pointer"
                      >
                        <XStack alignItems="center" gap="$2">
                          {Icon && <Icon size={18} />}
                          <Text fontWeight="500" color="$color12">{item.label}</Text>
                        </XStack>
                        <View
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 200ms',
                          }}
                        >
                          <ChevronDown size={16} />
                        </View>
                      </XStack>
                      {isExpanded && (
                        <YStack ml="$4" mt="$1" gap="$1">
                          {item.children.map((child) => (
                            <View
                              key={child.id}
                              tag="button"
                              onPress={() =>
                                child.href && handleNavigate(child.href)
                              }
                              width="100%"
                              paddingHorizontal="$3"
                              paddingVertical="$2"
                              borderRadius="$4"
                              hoverStyle={{ backgroundColor: '$backgroundSecondary' }}
                              cursor="pointer"
                            >
                              <Text fontSize="$3" color="$color11" hoverStyle={{ color: '$color12' }}>
                                {child.label}
                              </Text>
                            </View>
                          ))}
                        </YStack>
                      )}
                    </>
                  ) : (
                    <XStack
                      tag="button"
                      onPress={() => item.href && handleNavigate(item.href)}
                      width="100%"
                      alignItems="center"
                      gap="$2"
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      borderRadius="$4"
                      hoverStyle={{ backgroundColor: '$backgroundSecondary' }}
                      cursor="pointer"
                    >
                      {Icon && <Icon size={18} />}
                      <Text fontWeight="500" color="$color12">{item.label}</Text>
                    </XStack>
                  )}
                </YStack>
              );
            })}
          </YStack>
        </View>
      </View>
    </>
  );
}

export function DrawerToggle({ onClick }: { onClick: () => void }) {
  return (
    <View
      tag="button"
      onPress={onClick}
      position="absolute"
      top="$4"
      left="$4"
      zIndex={30}
      padding="$2"
      backgroundColor="$background"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$4"
      shadowRadius={8}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      hoverStyle={{ backgroundColor: '$backgroundHover' }}
      $gtLg={{ display: 'none' }}
      aria-label="Toggle navigation"
    >
      <Menu size={24} color="var(--color12)" />
    </View>
  );
}
