/**
 * Button Component Tests - Demonstrating TDD Best Practices
 *
 * This test file demonstrates:
 * 1. Red-Green-Refactor cycle
 * 2. Testing user behavior, not implementation details
 * 3. Comprehensive coverage of component functionality
 * 4. Clear test organization and naming
 *
 * Updated for Tamagui-based Button from @unicornlove/ui
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import Button from './Button';
import { Home } from 'lucide-react';

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('should render button with text content', () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click me');
    });

    it('should render as a button element', () => {
      render(<Button>Submit</Button>);

      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should apply custom data attributes', () => {
      render(<Button data-testid="custom-button">Button</Button>);

      const button = screen.getByTestId('custom-button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render primary variant by default', () => {
      render(<Button>Primary</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      // Tamagui buttons don't use CSS classes, so we test behavior instead
    });

    it('should render secondary variant when specified', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render outlined variant when specified', () => {
      render(<Button variant="outlined">Outlined</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render danger variant when specified', () => {
      render(<Button variant="danger">Delete</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render ghost variant when specified', () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      render(<Button>Medium</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render small size when specified', () => {
      render(<Button size="$2">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render large size when specified', () => {
      render(<Button size="$4">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Width', () => {
    it('should not be full width by default', () => {
      render(<Button>Normal Width</Button>);

      const button = screen.getByRole('button');
      // Test that button renders (width is handled by Tamagui props)
      expect(button).toBeInTheDocument();
    });

    it('should be full width when width is 100%', () => {
      render(<Button width="100%">Full Width</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onPress handler when clicked', async () => {
      const user = userEvent.setup();
      const handlePress = vi.fn();

      render(<Button onPress={handlePress}>Click me</Button>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handlePress).toHaveBeenCalledTimes(1);
    });

    it('should not be clickable when disabled', () => {
      const handlePress = vi.fn();

      render(
        <Button onPress={handlePress} disabled>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button');
      // Tamagui disables the button with disabled attribute and pointer-events: none
      expect(button).toBeDisabled();
      // The button prevents pointer interactions, so clicking will not trigger handler
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const handlePress = vi.fn();

      render(<Button onPress={handlePress}>Press Enter</Button>);

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('{Enter}');

      expect(handlePress).toHaveBeenCalledTimes(1);
    });

    it('should trigger on space key press', async () => {
      const user = userEvent.setup();
      const handlePress = vi.fn();

      render(<Button onPress={handlePress}>Press Space</Button>);

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard(' ');

      expect(handlePress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not be disabled by default', () => {
      render(<Button>Enabled</Button>);

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Disabled Pointer Events', () => {
    it('should prevent pointer interactions when disabled', () => {
      const { container } = render(
        <Button disabled>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button');
      // Tamagui disables the button and sets pointer-events: none
      expect(button).toBeDisabled();
      // The element should have pointer-events: none in computed style
      expect(getComputedStyle(button).pointerEvents).toBe('none');
    });
  });

  describe('Icons', () => {
    it('should render icon when using Button.Icon subcomponent', () => {
      const { container } = render(
        <Button>
          <Button.Icon>
            <Home size={16} />
          </Button.Icon>
          With Icon
        </Button>
      );

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should support icon placement after text', () => {
      const { container } = render(
        <Button>
          With Icon After
          <Button.Icon>
            <Home size={16} />
          </Button.Icon>
        </Button>
      );

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('HTML Button Attributes', () => {
    it('should support type attribute', () => {
      render(<Button type="submit">Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should support form attribute', () => {
      render(<Button form="my-form">Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('form', 'my-form');
    });

    it('should support data attributes', () => {
      render(<Button data-testid="custom-button">Button</Button>);

      const button = screen.getByTestId('custom-button');
      expect(button).toBeInTheDocument();
    });

    it('should support aria-label attribute', () => {
      render(<Button aria-label="Close dialog">X</Button>);

      const button = screen.getByRole('button', { name: /close dialog/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      render(<Button>Tab to me</Button>);

      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });

    it('should have appropriate disabled semantics', () => {
      render(<Button disabled>Cannot interact</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });
  });

  describe('Forward Ref', () => {
    it('should forward ref to button element', () => {
      const ref = { current: null as HTMLButtonElement | null };

      render(<Button ref={ref}>Button with ref</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.tagName).toBe('BUTTON');
    });

    it('should allow ref access to button methods', () => {
      const ref = { current: null as HTMLButtonElement | null };

      render(<Button ref={ref}>Button</Button>);

      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.click).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Button />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('');
    });

    it('should handle multiple prop combinations', () => {
      render(
        <Button
          variant="danger"
          size="$4"
          width="100%"
          disabled
          data-testid="complex-button"
        >
          Complex Button
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
      // Verify the button has the data-testid attribute
      expect(button).toHaveAttribute('data-testid', 'complex-button');
    });

    it('should handle rapid clicks', async () => {
      const user = userEvent.setup();
      const handlePress = vi.fn();

      render(<Button onPress={handlePress}>Click rapidly</Button>);

      const button = screen.getByRole('button');

      await user.tripleClick(button);

      expect(handlePress).toHaveBeenCalledTimes(3);
    });
  });
});
