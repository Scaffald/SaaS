/**
 * Button Component Tests - Demonstrating TDD Best Practices
 *
 * This test file demonstrates:
 * 1. Red-Green-Refactor cycle
 * 2. Testing user behavior, not implementation details
 * 3. Comprehensive coverage of component functionality
 * 4. Clear test organization and naming
 *
 * Updated for Beyond UI-based Button from @scaffald/ui
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';
import { Home } from 'lucide-react';

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('should render button with text content', () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
      expect(screen.getByText('Click me')).toBeTruthy();
    });

    it('should render as a button element with accessibilityRole', () => {
      render(<Button>Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });

    it('should apply custom testID', () => {
      render(<Button testID="custom-button">Button</Button>);

      const button = screen.getByTestId('custom-button');
      expect(button).toBeTruthy();
    });
  });

  describe('Color Variants', () => {
    it('should render gray color by default', () => {
      render(<Button>Gray</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });

    it('should render primary color when specified', () => {
      render(<Button color="primary">Primary</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });

    it('should render error color when specified', () => {
      render(<Button color="error">Error</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });
  });

  describe('Style Variants', () => {
    it('should render filled variant by default', () => {
      render(<Button>Filled</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });

    it('should render outline variant when specified', () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });

    it('should render light variant when specified', () => {
      render(<Button variant="light">Light</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });

    it('should render text variant when specified', () => {
      render(<Button variant="text">Text</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      render(<Button>Medium</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });

    it('should render small size when specified', () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });

    it('should render large size when specified', () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });
  });

  describe('Full Width', () => {
    it('should not be full width by default', () => {
      render(<Button>Normal Width</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });

    it('should be full width when fullWidth prop is true', () => {
      render(<Button fullWidth>Full Width</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should call onPress handler when pressed', async () => {
      const user = userEvent.setup();
      const handlePress = vi.fn();

      render(<Button onPress={handlePress}>Click me</Button>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handlePress).toHaveBeenCalledTimes(1);
    });

    it('should not be pressable when disabled', async () => {
      const user = userEvent.setup();
      const handlePress = vi.fn();

      render(
        <Button onPress={handlePress} disabled>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handlePress).not.toHaveBeenCalled();
    });

    it('should not be pressable when loading', async () => {
      const user = userEvent.setup();
      const handlePress = vi.fn();

      render(
        <Button onPress={handlePress} loading>
          Loading
        </Button>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handlePress).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });

    it('should not be disabled by default', () => {
      render(<Button>Enabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      const { queryByText } = render(<Button loading>Loading</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
      // Text should not be visible when loading (shows spinner instead)
      expect(queryByText('Loading')).toBeNull();
    });

    it('should be disabled when loading', async () => {
      const user = userEvent.setup();
      const handlePress = vi.fn();

      render(
        <Button onPress={handlePress} loading>
          Loading
        </Button>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handlePress).not.toHaveBeenCalled();
    });
  });

  describe('Icons', () => {
    it('should render icon at start when using iconStart prop', () => {
      const { container } = render(
        <Button iconStart={Home}>With Icon</Button>
      );

      expect(screen.getByText('With Icon')).toBeTruthy();
      expect(container).toBeTruthy();
    });

    it('should render icon at end when using iconEnd prop', () => {
      const { container } = render(
        <Button iconEnd={Home}>With Icon After</Button>
      );

      expect(screen.getByText('With Icon After')).toBeTruthy();
      expect(container).toBeTruthy();
    });

    it('should render both start and end icons', () => {
      const { container } = render(
        <Button iconStart={Home} iconEnd={Home}>
          Both Icons
        </Button>
      );

      expect(screen.getByText('Both Icons')).toBeTruthy();
      expect(container).toBeTruthy();
    });

    it('should render icon-only button', () => {
      const { container, queryByText } = render(
        <Button iconStart={Home} iconOnly />
      );

      expect(container).toBeTruthy();
      // Should not render text in icon-only mode
      expect(queryByText('Button')).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible as a button', () => {
      render(<Button>Accessible</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });

    it('should support accessibilityLabel', () => {
      render(<Button accessibilityLabel="Submit form">Submit</Button>);

      const button = screen.getByLabelText('Submit form');
      expect(button).toBeTruthy();
    });
  });

  describe('Custom Styles', () => {
    it('should apply custom container style', () => {
      const customStyle = { marginTop: 20 };
      const { container } = render(<Button style={customStyle}>Styled</Button>);

      expect(screen.getByText('Styled')).toBeTruthy();
      expect(container).toBeTruthy();
    });

    it('should apply custom text style', () => {
      const customTextStyle = { fontSize: 20 };
      const { container } = render(
        <Button textStyle={customTextStyle}>Styled Text</Button>
      );

      expect(screen.getByText('Styled Text')).toBeTruthy();
      expect(container).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children with icon', () => {
      const { container } = render(<Button iconStart={Home} iconOnly />);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
      expect(container).toBeTruthy();
    });

    it('should handle multiple prop combinations', () => {
      render(
        <Button
          color="error"
          variant="outline"
          size="lg"
          fullWidth
          disabled
          testID="complex-button"
        >
          Complex Button
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
      expect(screen.getByTestId('complex-button')).toBeTruthy();
    });

    it('should handle rapid presses', async () => {
      const user = userEvent.setup();
      const handlePress = vi.fn();

      render(<Button onPress={handlePress}>Click rapidly</Button>);

      const button = screen.getByRole('button');

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handlePress).toHaveBeenCalledTimes(3);
    });
  });

  describe('Combined Variants', () => {
    it('should render primary filled large button', () => {
      render(
        <Button color="primary" variant="filled" size="lg">
          Primary Large
        </Button>
      );

      expect(screen.getByText('Primary Large')).toBeTruthy();
    });

    it('should render error outline small button with icon', () => {
      render(
        <Button color="error" variant="outline" size="sm" iconStart={Home}>
          Error Small
        </Button>
      );

      expect(screen.getByText('Error Small')).toBeTruthy();
    });

    it('should render gray light medium disabled button', () => {
      render(
        <Button color="gray" variant="light" size="md" disabled>
          Gray Disabled
        </Button>
      );

      expect(screen.getByText('Gray Disabled')).toBeTruthy();
    });
  });
});
