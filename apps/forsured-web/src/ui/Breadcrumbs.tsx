import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { XStack, Text, Button, styled, useTheme } from '@unicornlove/ui';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  separator?: React.ComponentType<{ size?: number; color?: string }>;
  className?: string;
}

const BreadcrumbsNav = styled(XStack, {
  name: 'BreadcrumbsNav',
  alignItems: 'center',
  gap: '$2',
  fontSize: '$2',
});

const BreadcrumbList = styled(XStack, {
  name: 'BreadcrumbList',
  alignItems: 'center',
  gap: '$2',
});

const BreadcrumbItemContainer = styled(XStack, {
  name: 'BreadcrumbItemContainer',
  alignItems: 'center',
  gap: '$2',
});

const BreadcrumbButton = styled(Button, {
  name: 'BreadcrumbButton',
  alignItems: 'center',
  gap: '$1',
  color: '$color10',
  backgroundColor: 'transparent',
  hoverStyle: {
    color: '$color11',
  },
  transition: 'color 0.2s ease-in-out',
});

const BreadcrumbText = styled(Text, {
  name: 'BreadcrumbText',
  alignItems: 'center',
  gap: '$1',
  color: '$color11',
  fontWeight: '500',
});

export default function Breadcrumbs({
  items,
  showHome = false,
  separator: Separator = ChevronRight,
  className = '',
}: BreadcrumbsProps) {
  const theme = useTheme();
  const allItems = showHome
    ? [{ label: 'Home', icon: Home, href: '/' }, ...items]
    : items;

  return (
    <BreadcrumbsNav as="nav" className={className} aria-label="Breadcrumb">
      <BreadcrumbList as="ol">
        {allItems.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === allItems.length - 1;

          return (
            <BreadcrumbItemContainer as="li" key={index}>
              {index > 0 && (
                <Separator size={16} color={theme.color9.val} />
              )}
              {isLast ? (
                <BreadcrumbText>
                  {Icon && <Icon size={16} color={theme.color11.val} />}
                  <Text>{item.label}</Text>
                </BreadcrumbText>
              ) : (
                <BreadcrumbButton
                  onPress={item.onClick}
                  as={item.href ? 'a' : 'button'}
                  href={item.href}
                >
                  {Icon && <Icon size={16} />}
                  <Text>{item.label}</Text>
                </BreadcrumbButton>
              )}
            </BreadcrumbItemContainer>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbsNav>
  );
}
