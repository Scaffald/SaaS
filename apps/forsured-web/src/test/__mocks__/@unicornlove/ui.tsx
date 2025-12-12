/**
 * Mock for @unicornlove/ui package
 *
 * Provides minimal HTML-based implementations of UI components for testing.
 * This avoids the complex react-native dependency chain that causes
 * parsing errors in vitest/jsdom.
 *
 * IMPORTANT: This mock does NOT import from tamagui to avoid react-native deps.
 */
import { forwardRef, createContext, useContext, useState, type ReactNode, type ComponentProps, type CSSProperties } from 'react';

// Theme context for useTheme hook
const ThemeContext = createContext({ theme: 'light' as string });

export const useTheme = () => useContext(ThemeContext);

// Button with Icon subcomponent
interface ButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outlined' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | '$4' | string;
  width?: string | number;
  onPress?: () => void;
  children?: ReactNode;
}

const ButtonIcon = ({ children }: { children?: ReactNode }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center' }}>{children}</span>
);

export const Button = Object.assign(
  forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant, size, width, onPress, disabled, children, style, ...props }, ref) => {
      return (
        <button
          ref={ref}
          onClick={onPress}
          disabled={disabled}
          style={{
            ...(typeof style === 'object' ? style : {}),
            width: width,
            pointerEvents: disabled ? 'none' : 'auto',
          } as CSSProperties}
          {...props}
        >
          {children}
        </button>
      );
    }
  ),
  { Icon: ButtonIcon }
);
Button.displayName = 'Button';

export type { ButtonProps };

// Chip/Badge component - includes role="status" for accessibility tests
// Also includes variant in className for tests that check for color classes
interface ChipProps extends ComponentProps<'span'> {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'green' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

// Map variant to color class for badge color tests
const variantToColorClass = (variant?: string): string => {
  switch (variant) {
    case 'success':
    case 'green':
      return 'bg-green-100 text-green-800';
    case 'warning':
    case 'yellow':
      return 'bg-yellow-100 text-yellow-800';
    case 'error':
    case 'red':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ variant, size, children, className, ...props }, ref) => {
    const colorClass = variantToColorClass(variant);
    const combinedClassName = className ? `${className} ${colorClass}` : colorClass;
    return (
      <span
        ref={ref}
        role="status"
        data-variant={variant}
        data-size={size}
        className={combinedClassName}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Chip.displayName = 'Chip';

// Badge is alias for Chip
export const Badge = Chip;

// Text component - renders as <a> when href prop is provided (like Tamagui web)
interface TextProps extends Omit<ComponentProps<'span'>, 'ref'> {
  fontSize?: string;
  fontWeight?: string | number;
  color?: string;
  href?: string;
  onPress?: () => void;
  display?: object | string;
  children?: ReactNode;
}

export const Text = forwardRef<HTMLSpanElement | HTMLAnchorElement, TextProps>(
  ({ fontSize, fontWeight, color, href, onPress, display, children, style, onClick, ...props }, ref) => {
    // If href is provided, render as anchor (like Tamagui web does)
    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          onClick={onPress || onClick}
          style={{
            ...(typeof style === 'object' ? style : {}),
            fontSize,
            fontWeight,
            color,
          } as CSSProperties}
          {...props}
        >
          {children}
        </a>
      );
    }
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        onClick={onPress || onClick}
        style={{
          ...(typeof style === 'object' ? style : {}),
          fontSize,
          fontWeight,
          color,
        } as CSSProperties}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Text.displayName = 'Text';

// Heading components
export const H1 = forwardRef<HTMLHeadingElement, ComponentProps<'h1'>>((props, ref) => <h1 ref={ref} {...props} />);
export const H2 = forwardRef<HTMLHeadingElement, ComponentProps<'h2'>>((props, ref) => <h2 ref={ref} {...props} />);
export const H3 = forwardRef<HTMLHeadingElement, ComponentProps<'h3'>>((props, ref) => <h3 ref={ref} {...props} />);
export const H4 = forwardRef<HTMLHeadingElement, ComponentProps<'h4'>>((props, ref) => <h4 ref={ref} {...props} />);
export const H5 = forwardRef<HTMLHeadingElement, ComponentProps<'h5'>>((props, ref) => <h5 ref={ref} {...props} />);
export const H6 = forwardRef<HTMLHeadingElement, ComponentProps<'h6'>>((props, ref) => <h6 ref={ref} {...props} />);
export const Paragraph = forwardRef<HTMLParagraphElement, ComponentProps<'p'>>((props, ref) => <p ref={ref} {...props} />);
export const SizableText = Text;

// View/Stack components - pass through all props including accessibility attributes
interface StackProps extends Omit<ComponentProps<'div'>, 'onPress'> {
  gap?: string | number;
  padding?: string | number;
  paddingHorizontal?: string | number;
  paddingVertical?: string | number;
  alignItems?: CSSProperties['alignItems'];
  justifyContent?: CSSProperties['justifyContent'];
  flexDirection?: CSSProperties['flexDirection'];
  marginBottom?: string | number;
  marginTop?: string | number;
  marginLeft?: string | number;
  marginRight?: string | number;
  margin?: string | number;
  backgroundColor?: string;
  borderRadius?: string | number;
  borderColor?: string;
  borderWidth?: number;
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  flex?: number;
  display?: string;
  position?: CSSProperties['position'];
  cursor?: CSSProperties['cursor'];
  overflow?: CSSProperties['overflow'];
  onPress?: () => void;
  hoverStyle?: object;
  pressStyle?: object;
  children?: ReactNode;
}

export const View = forwardRef<HTMLDivElement, StackProps>(
  ({
    gap, padding, paddingHorizontal, paddingVertical, alignItems, justifyContent,
    flexDirection, marginBottom, marginTop, marginLeft, marginRight, margin, backgroundColor, borderRadius,
    borderColor, borderWidth, width, height, minWidth, maxWidth, flex, display,
    position, cursor, overflow, onPress, hoverStyle, pressStyle, children, style, onClick, ...props
  }, ref) => (
    <div
      ref={ref}
      onClick={onPress || onClick}
      style={{
        ...(typeof style === 'object' ? style : {}),
        display: display || 'flex',
        gap,
        padding,
        paddingLeft: paddingHorizontal,
        paddingRight: paddingHorizontal,
        paddingTop: paddingVertical,
        paddingBottom: paddingVertical,
        alignItems,
        justifyContent,
        flexDirection,
        marginBottom,
        marginTop,
        marginLeft,
        marginRight,
        margin,
        backgroundColor,
        borderRadius,
        borderColor,
        borderWidth,
        width,
        height,
        minWidth,
        maxWidth,
        flex,
        position,
        cursor,
        overflow,
      } as CSSProperties}
      {...props}
    >
      {children}
    </div>
  )
);
View.displayName = 'View';

export const Stack = View;

export const YStack = forwardRef<HTMLDivElement, StackProps>(({ flexDirection, ...props }, ref) => (
  <View ref={ref} flexDirection="column" {...props} />
));
YStack.displayName = 'YStack';

export const XStack = forwardRef<HTMLDivElement, StackProps>(({ flexDirection, ...props }, ref) => (
  <View ref={ref} flexDirection="row" {...props} />
));
XStack.displayName = 'XStack';

// Input/TextInput component with label, error, and helperText support
interface TextInputProps extends Omit<ComponentProps<'input'>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, helperText, fullWidth, size, className, style, ...props }, ref) => (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && <label>{label}</label>}
      <input ref={ref} className={className} style={style} {...props} />
      {helperText && <span>{helperText}</span>}
      {error && <span style={{ color: 'red' }}>{error}</span>}
    </div>
  )
);
TextInput.displayName = 'TextInput';

// Input is alias for TextInput (some code uses Input, some uses TextInput)
export const Input = TextInput;
export type { TextInputProps as InputProps };

// TextArea component
export const TextArea = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'>>((props, ref) => (
  <textarea ref={ref} {...props} />
));
TextArea.displayName = 'TextArea';

// Label component
export const Label = forwardRef<HTMLLabelElement, ComponentProps<'label'>>((props, ref) => (
  <label ref={ref} {...props} />
));
Label.displayName = 'Label';

// Select component with Item subcomponent
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  options?: SelectOption[];
}

const SelectTrigger = forwardRef<HTMLButtonElement, ComponentProps<'button'> & { placeholder?: string }>(
  ({ children, placeholder, ...props }, ref) => (
    <button ref={ref} type="button" {...props}>{children || placeholder}</button>
  )
);
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>;
const SelectContent = ({ children }: { children?: ReactNode }) => <div role="listbox">{children}</div>;
const SelectItem = forwardRef<HTMLDivElement, { value: string; children?: ReactNode }>(
  ({ value, children, ...props }, ref) => (
    <div ref={ref} role="option" data-value={value} {...props}>{children}</div>
  )
);
SelectItem.displayName = 'SelectItem';

export const Select = Object.assign(
  ({ value, onValueChange, children, disabled, label, options }: SelectProps) => {
    // If options array is provided, render as simple select
    // The native <select> shows the selected option text automatically
    if (options && options.length > 0) {
      return (
        <div data-value={value}>
          {label && <label>{label}</label>}
          <select
            value={value}
            onChange={(e) => onValueChange?.(e.target.value)}
            disabled={disabled}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {children}
        </div>
      );
    }
    return <div data-value={value}>{children}</div>;
  },
  {
    Trigger: SelectTrigger,
    Value: SelectValue,
    Content: SelectContent,
    Item: SelectItem,
  }
);

// RadioGroup component
interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
}

const RadioGroupItem = forwardRef<HTMLInputElement, { value: string; id?: string }>(
  ({ value, id, ...props }, ref) => (
    <input ref={ref} type="radio" value={value} id={id} {...props} />
  )
);
RadioGroupItem.displayName = 'RadioGroupItem';

const RadioGroupIndicator = () => <span />;

export const RadioGroup = Object.assign(
  ({ value, onValueChange, children }: RadioGroupProps) => (
    <div role="radiogroup" data-value={value}>{children}</div>
  ),
  {
    Item: RadioGroupItem,
    Indicator: RadioGroupIndicator,
  }
);

// Checkbox component
interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
}

const CheckboxIndicator = () => <span />;

export const Checkbox = Object.assign(
  forwardRef<HTMLInputElement, CheckboxProps>(
    ({ checked, onCheckedChange, id, disabled }, ref) => (
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        id={id}
        disabled={disabled}
      />
    )
  ),
  { Indicator: CheckboxIndicator }
);

// Switch component
interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked, onCheckedChange, disabled }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      role="switch"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      disabled={disabled}
    />
  )
);
Switch.displayName = 'Switch';

// Card component - converts onPress to onClick for DOM compatibility
interface CardProps extends StackProps {
  onPress?: () => void;
  clickable?: boolean;
  elevate?: boolean;
  bordered?: boolean;
  padded?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ onPress, clickable, elevate, bordered, padded, onClick, ...props }, ref) => (
    <div ref={ref} onClick={onPress || onClick} {...props} />
  )
);
Card.displayName = 'Card';

// Separator component
export const Separator = ({ vertical }: { vertical?: boolean }) => (
  <hr style={{ border: 'none', borderTop: vertical ? 'none' : '1px solid #ccc', borderLeft: vertical ? '1px solid #ccc' : 'none' }} />
);

// Spinner component
export const Spinner = ({ size }: { size?: string | number }) => (
  <span role="status" aria-label="Loading">Loading...</span>
);

// Avatar component
const AvatarImage = ({ src, alt }: { src?: string; alt?: string }) => (
  src ? <img src={src} alt={alt || ''} /> : null
);
const AvatarFallback = ({ children }: { children?: ReactNode }) => <span>{children}</span>;

export const Avatar = Object.assign(
  ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  { Image: AvatarImage, Fallback: AvatarFallback }
);

// ScrollView component
export const ScrollView = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  (props, ref) => <div ref={ref} style={{ overflow: 'auto' }} {...props} />
);
ScrollView.displayName = 'ScrollView';

// Dialog/Sheet/Modal components
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

const DialogPortal = ({ children }: { children?: ReactNode }) => <>{children}</>;
const DialogOverlay = forwardRef<HTMLDivElement, ComponentProps<'div'>>((props, ref) => (
  <div ref={ref} data-overlay {...props} />
));
const DialogContent = forwardRef<HTMLDivElement, ComponentProps<'div'>>((props, ref) => (
  <div ref={ref} role="dialog" {...props} />
));
const DialogTitle = forwardRef<HTMLHeadingElement, ComponentProps<'h2'>>((props, ref) => (
  <h2 ref={ref} {...props} />
));
const DialogDescription = forwardRef<HTMLParagraphElement, ComponentProps<'p'>>((props, ref) => (
  <p ref={ref} {...props} />
));
const DialogClose = forwardRef<HTMLButtonElement, ComponentProps<'button'>>((props, ref) => (
  <button ref={ref} type="button" {...props} />
));
const DialogTrigger = forwardRef<HTMLButtonElement, ComponentProps<'button'>>((props, ref) => (
  <button ref={ref} type="button" {...props} />
));

export const Dialog = Object.assign(
  ({ open, onOpenChange, children }: DialogProps) => (
    open ? <div data-state="open">{children}</div> : null
  ),
  {
    Portal: DialogPortal,
    Overlay: DialogOverlay,
    Content: DialogContent,
    Title: DialogTitle,
    Description: DialogDescription,
    Close: DialogClose,
    Trigger: DialogTrigger,
  }
);

// Sheet (similar to Dialog)
export const Sheet = Dialog;

// ResponsiveModal component
interface ResponsiveModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  children?: ReactNode;
}

export const ResponsiveModal = ({
  open,
  onOpenChange,
  title,
  size,
  children,
}: ResponsiveModalProps) => {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" data-size={size}>
      {title && <h2>{title}</h2>}
      <button
        type="button"
        onClick={() => onOpenChange?.(false)}
        aria-label="Close"
      >
        Close
      </button>
      {children}
    </div>
  );
};

export type { ResponsiveModalProps };

// Tabs component
interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children?: ReactNode;
}

const TabsList = forwardRef<HTMLDivElement, ComponentProps<'div'>>((props, ref) => (
  <div ref={ref} role="tablist" {...props} />
));
const TabsTrigger = forwardRef<HTMLButtonElement, ComponentProps<'button'> & { value: string }>(
  ({ value, ...props }, ref) => <button ref={ref} type="button" role="tab" data-value={value} {...props} />
);
const TabsContent = forwardRef<HTMLDivElement, ComponentProps<'div'> & { value: string }>(
  ({ value, ...props }, ref) => <div ref={ref} role="tabpanel" data-value={value} {...props} />
);

export const Tabs = Object.assign(
  ({ value, defaultValue, onValueChange, children }: TabsProps) => {
    const [activeTab, setActiveTab] = useState(value || defaultValue || '');
    return <div data-value={activeTab}>{children}</div>;
  },
  { List: TabsList, Trigger: TabsTrigger, Content: TabsContent }
);

// Accordion component
interface AccordionProps {
  type?: 'single' | 'multiple';
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  children?: ReactNode;
}

const AccordionItem = forwardRef<HTMLDivElement, ComponentProps<'div'> & { value: string }>(
  ({ value, ...props }, ref) => <div ref={ref} data-value={value} {...props} />
);
const AccordionTrigger = forwardRef<HTMLButtonElement, ComponentProps<'button'>>(
  (props, ref) => <button ref={ref} type="button" {...props} />
);
const AccordionContent = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  (props, ref) => <div ref={ref} {...props} />
);

export const Accordion = Object.assign(
  ({ type, value, onValueChange, children }: AccordionProps) => <div>{children}</div>,
  { Item: AccordionItem, Trigger: AccordionTrigger, Content: AccordionContent }
);

// Tooltip component
interface TooltipProps {
  children?: ReactNode;
}

const TooltipTrigger = forwardRef<HTMLButtonElement, ComponentProps<'button'>>(
  (props, ref) => <button ref={ref} type="button" {...props} />
);
const TooltipContent = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  (props, ref) => <div ref={ref} role="tooltip" {...props} />
);

export const Tooltip = Object.assign(
  ({ children }: TooltipProps) => <>{children}</>,
  { Trigger: TooltipTrigger, Content: TooltipContent }
);

// Form components
export const Form = forwardRef<HTMLFormElement, ComponentProps<'form'>>((props, ref) => (
  <form ref={ref} {...props} />
));
Form.displayName = 'Form';

export const Fieldset = forwardRef<HTMLFieldSetElement, ComponentProps<'fieldset'>>((props, ref) => (
  <fieldset ref={ref} {...props} />
));
Fieldset.displayName = 'Fieldset';

// Anchor component
export const Anchor = forwardRef<HTMLAnchorElement, ComponentProps<'a'>>((props, ref) => (
  <a ref={ref} {...props} />
));
Anchor.displayName = 'Anchor';

// Image component
export const Image = forwardRef<HTMLImageElement, ComponentProps<'img'>>((props, ref) => (
  <img ref={ref} {...props} />
));
Image.displayName = 'Image';

// TamaguiProvider mock - just renders children
interface TamaguiProviderProps {
  config?: unknown;
  defaultTheme?: string;
  children?: ReactNode;
}

export const TamaguiProvider = ({ children, defaultTheme = 'light' }: TamaguiProviderProps) => (
  <ThemeContext.Provider value={{ theme: defaultTheme }}>
    {children}
  </ThemeContext.Provider>
);

// Theme component
export const Theme = ({ children, name }: { children?: ReactNode; name?: string }) => (
  <ThemeContext.Provider value={{ theme: name || 'light' }}>
    {children}
  </ThemeContext.Provider>
);

// createTamagui mock - returns the config as-is
export const createTamagui = <T extends object>(config: T): T => config;

// Minimal tamagui config export
export const tamaguiConfig = {
  fonts: {},
  tokens: {
    color: {},
    space: {},
    size: {},
    radius: {},
    zIndex: {},
  },
  themes: {
    light: {},
    dark: {},
  },
};

// Additional exports that components might need
export const styled = <T extends object>(Component: React.ComponentType<T>) => Component;
export const withStaticProperties = <A extends object, B extends object>(component: A, staticProps: B): A & B =>
  Object.assign(component, staticProps);

// Spacer component
export const Spacer = ({ size, flex }: { size?: string | number; flex?: number }) => (
  <div style={{ width: size, height: size, flex }} />
);

// VisuallyHidden component
export const VisuallyHidden = ({ children }: { children?: ReactNode }) => (
  <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
    {children}
  </span>
);

// Group component
export const Group = forwardRef<HTMLDivElement, ComponentProps<'div'>>((props, ref) => (
  <div ref={ref} role="group" {...props} />
));
Group.displayName = 'Group';

// Progress component
interface ProgressProps {
  value?: number;
  max?: number;
}

const ProgressIndicator = ({ value, max = 100 }: ProgressProps) => (
  <div style={{ width: `${((value || 0) / max) * 100}%` }} />
);

export const Progress = Object.assign(
  ({ value, max = 100, children }: ProgressProps & { children?: ReactNode }) => (
    <div role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      {children}
    </div>
  ),
  { Indicator: ProgressIndicator }
);

// Slider component
interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ value, onValueChange, min = 0, max = 100, step = 1 }, ref) => (
    <input
      ref={ref}
      type="range"
      value={value?.[0] || 0}
      onChange={(e) => onValueChange?.([Number(e.target.value)])}
      min={min}
      max={max}
      step={step}
    />
  )
);
Slider.displayName = 'Slider';

// Portal component
export const Portal = ({ children }: { children?: ReactNode }) => <>{children}</>;

// Toast components
export const ToastProvider = ({ children }: { children?: ReactNode }) => <>{children}</>;
export const ToastViewport = () => null;
export const Toast = ({ children }: { children?: ReactNode }) => <div role="alert">{children}</div>;
export const useToastState = () => ({ currentToast: null });
export const useToastController = () => ({ show: () => {}, hide: () => {} });
