import type { ReactNode } from 'react';
import { vi } from 'vitest';

/**
 * Legacy UI mock (Tamagui-compatible) for tests that still depend on it.
 * New tests should use Beyond UI and theme-setup instead.
 */
export const createTamaguiMock = () => {
  const createComponent =
    (tag = 'div') =>
    ({
      children,
      onPress,
      testID,
      ...rest
    }: {
      children?: ReactNode;
      onPress?: () => void;
      testID?: string;
      [key: string]: unknown;
    }) => {
      const props = {
        ...rest,
        'data-testid': testID,
        onClick: onPress,
        role: onPress ? 'button' : undefined,
      };
      const React = require('react') as typeof import('react');
      return React.createElement(tag, props, children);
    };

  const React = require('react') as typeof import('react');

  const Input = ({
    value,
    onChangeText,
    placeholder,
    ...rest
  }: {
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    [key: string]: unknown;
  }) => {
    return React.createElement('input', {
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        onChangeText?.(e.target.value),
      placeholder,
      ...rest,
    });
  };

  const TextArea = ({
    value,
    onChangeText,
    ...rest
  }: {
    value?: string;
    onChangeText?: (text: string) => void;
    [key: string]: unknown;
  }) => {
    return React.createElement('textarea', {
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
        onChangeText?.(e.target.value),
      ...rest,
    });
  };

  const Text = ({ children, ...rest }: { children?: ReactNode; [key: string]: unknown }) => {
    return React.createElement('span', rest, children);
  };

  const Image = ({
    source,
    alt,
    ...rest
  }: {
    source?: { uri?: string };
    alt?: string;
    [key: string]: unknown;
  }) => {
    return React.createElement('img', {
      src: source?.uri,
      alt: alt || '',
      ...rest,
    });
  };

  const View = createComponent('div');

  const Button = ({
    children,
    onPress,
    disabled,
    ...rest
  }: {
    children?: ReactNode;
    onPress?: () => void;
    disabled?: boolean;
    [key: string]: unknown;
  }) => {
    return React.createElement(
      'button',
      {
        type: 'button',
        disabled,
        onClick: onPress,
        ...rest,
      },
      children,
    );
  };

  const ScrollView = ({ children, ...rest }: { children?: ReactNode; [key: string]: unknown }) => {
    return React.createElement('div', { 'data-testid': 'scroll-view', ...rest }, children);
  };

  return {
    // Stacks
    YStack: createComponent('div'),
    XStack: createComponent('div'),
    ZStack: createComponent('div'),
    HStack: createComponent('div'),
    VStack: createComponent('div'),
    // Basic components
    View,
    Text,
    Input,
    TextArea,
    Button,
    Image,
    ScrollView,
    // Layout components
    Card: createComponent('div'),
    Sheet: createComponent('div'),
    Dialog: createComponent('div'),
    Popover: createComponent('div'),
    // Typography
    H1: createComponent('h1'),
    H2: createComponent('h2'),
    H3: createComponent('h3'),
    H4: createComponent('h4'),
    H5: createComponent('h5'),
    H6: createComponent('h6'),
    Paragraph: createComponent('p'),
    // Form components
    Select: createComponent('select'),
    Switch: createComponent('input'),
    Checkbox: createComponent('input'),
    RadioGroup: createComponent('div'),
    // Animation
    AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
    // Utilities
    styled: (Component: React.ComponentType<Record<string, unknown>>) => Component,
    createStyledContext: () => ({}),
    withStaticProperties: (
      Component: React.ComponentType<Record<string, unknown>>,
      _config: Record<string, unknown>,
    ) => Component,
    useWindowDimensions: () => ({ width: 1024, height: 768 }),
    useMedia: () => ({ sm: false }),
  };
};

/**
 * Mock for @tamagui/lucide-icons
 * Add icons as needed
 */
export const createLucideIconsMock = () => {
  const React = require('react') as typeof import('react');
  const Icon = ({ size, ...rest }: { size?: number; [key: string]: unknown }) => {
    return React.createElement('svg', { width: size || 24, height: size || 24, ...rest });
  };

  return {
    Briefcase: Icon,
    Image: Icon,
    X: Icon,
    Check: Icon,
    ChevronRight: Icon,
    ChevronLeft: Icon,
    ChevronDown: Icon,
    ChevronUp: Icon,
    Plus: Icon,
    Minus: Icon,
    Edit: Icon,
    Trash: Icon,
    Search: Icon,
    Filter: Icon,
    Settings: Icon,
    User: Icon,
    Mail: Icon,
    Phone: Icon,
    Calendar: Icon,
    Clock: Icon,
    MapPin: Icon,
    // Add more icons as needed
  };
};

/**
 * Setup Tamagui mocks globally
 * Call this in your test setup file
 */
export function setupTamaguiMocks() {
  vi.mock('tamagui', () => createTamaguiMock());
  vi.mock('@tamagui/lucide-icons', () => createLucideIconsMock());
}

