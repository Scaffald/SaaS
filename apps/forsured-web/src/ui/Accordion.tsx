import React, { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { YStack, XStack, Text, Button, styled, useTheme } from '@unicornlove/ui';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

const AccordionContainer = styled(YStack, {
  name: 'AccordionContainer',
  divideColor: '$borderColor',
  divideWidth: 1,
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: '$lg',
  overflow: 'hidden',
});

const AccordionButton = styled(Button, {
  name: 'AccordionButton',
  width: '100%',
  paddingHorizontal: '$4',
  paddingVertical: '$3',
  alignItems: 'center',
  justifyContent: 'space-between',
  textAlign: 'left',
  transition: 'all 0.2s ease-in-out',
  backgroundColor: 'transparent',
  variants: {
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
      false: {
        hoverStyle: {
          backgroundColor: '$backgroundHover',
        },
        cursor: 'pointer',
      },
    },
  } as const,
});

const AccordionContent = styled(YStack, {
  name: 'AccordionContent',
  overflow: 'hidden',
  transition: 'all 0.2s ease-in-out',
  variants: {
    open: {
      true: {
        maxHeight: 1000, // max-h-screen equivalent
      },
      false: {
        maxHeight: 0,
      },
    },
  } as const,
});

const AccordionContentInner = styled(YStack, {
  name: 'AccordionContentInner',
  paddingHorizontal: '$4',
  paddingVertical: '$3',
  color: '$color10',
  backgroundColor: '$backgroundSecondary',
});

export default function Accordion({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className = '',
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen);
  const theme = useTheme();

  const toggleItem = (itemId: string) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(itemId)
          ? prev.filter((id) => id !== itemId)
          : [...prev, itemId]
      );
    } else {
      setOpenItems((prev) => (prev.includes(itemId) ? [] : [itemId]));
    }
  };

  return (
    <AccordionContainer className={className}>
      {items.map((item) => {
        const Icon = item.icon;
        const isOpen = openItems.includes(item.id);

        return (
          <YStack key={item.id}>
            <AccordionButton
              onPress={() => !item.disabled && toggleItem(item.id)}
              disabled={item.disabled}
            >
              <XStack alignItems="center" gap="$3">
                {Icon && <Icon size={20} color={theme.color10.val} />}
                <Text fontWeight="500" color="$color11">
                  {item.title}
                </Text>
              </XStack>
              <ChevronDown
                size={20}
                color={theme.color10.val}
                style={{
                  transform: `rotate(${isOpen ? 180 : 0}deg)`,
                  transition: 'transform 0.2s ease-in-out',
                }}
              />
            </AccordionButton>
            <AccordionContent open={isOpen}>
              <AccordionContentInner>{item.content}</AccordionContentInner>
            </AccordionContent>
          </YStack>
        );
      })}
    </AccordionContainer>
  );
}
