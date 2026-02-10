/**
 * Mock for @unicornlove/beyond-ui package
 *
 * Provides minimal HTML-based implementations of UI components for testing.
 * This avoids the complex react-native dependency chain that causes
 * parsing errors in vitest/jsdom.
 *
 * This mock avoids the react-native dependency chain for vitest/jsdom.
 */
import {
  forwardRef,
  createContext,
  useContext,
  useState,
  type ReactNode,
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
} from 'react';

// Theme types
export type ThemeMode = 'light' | 'dark';

// Theme context for useTheme hook
const ThemeContext = createContext({ theme: 'light' as ThemeMode, setTheme: (_: ThemeMode) => {} });

export const useTheme = () => useContext(ThemeContext);

// ThemeProvider for Beyond UI
interface ThemeProviderProps {
  children?: ReactNode;
  initialTheme?: ThemeMode;
}

export const ThemeProvider = ({ children, initialTheme = 'light' }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Stack/View components
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

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    {
      gap,
      padding,
      paddingHorizontal,
      paddingVertical,
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
      display,
      position,
      cursor,
      overflow,
      onPress,
      hoverStyle,
      pressStyle,
      children,
      style,
      onClick,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      onClick={onPress || onClick}
      style={{
        ...(typeof style === 'object' ? style : {}),
        display: display || 'flex',
        flexDirection: flexDirection || 'column',
        gap,
        padding,
        paddingLeft: paddingHorizontal,
        paddingRight: paddingHorizontal,
        paddingTop: paddingVertical,
        paddingBottom: paddingVertical,
        alignItems,
        justifyContent,
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
Stack.displayName = 'Stack';

export const Row = forwardRef<HTMLDivElement, StackProps>(({ flexDirection, ...props }, ref) => (
  <Stack ref={ref} flexDirection="row" alignItems="center" {...props} />
));
Row.displayName = 'Row';

export const View = Stack;
export const YStack = Stack;
export const XStack = Row;

// Text component
interface TextProps extends Omit<ComponentProps<'span'>, 'ref'> {
  fontSize?: string | number;
  fontWeight?: string | number;
  color?: string;
  href?: string;
  onPress?: () => void;
  display?: object | string;
  variant?: string;
  size?: string | number;
  children?: ReactNode;
}

export const Text = forwardRef<HTMLSpanElement | HTMLAnchorElement, TextProps>(
  (
    { fontSize, fontWeight, color, href, onPress, display, variant, size, children, style, onClick, ...props },
    ref
  ) => {
    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          onClick={onPress || onClick}
          style={{
            ...(typeof style === 'object' ? style : {}),
            fontSize: fontSize || size,
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
          fontSize: fontSize || size,
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

// Button component
interface ButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outlined' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | '$4' | string;
  width?: string | number;
  onPress?: () => void;
  leftIcon?: ComponentType<{ size?: number; color?: string }>;
  icon?: ComponentType<{ size?: number; color?: string }>;
  loading?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant,
      size,
      width,
      onPress,
      disabled,
      leftIcon: LeftIcon,
      icon: Icon,
      loading,
      children,
      style,
      onClick,
      ...props
    },
    ref
  ) => {
    const IconComponent = LeftIcon || Icon;
    return (
      <button
        ref={ref}
        onClick={onPress || onClick}
        disabled={disabled || loading}
        style={{
          ...(typeof style === 'object' ? style : {}),
          width: width,
          pointerEvents: disabled ? 'none' : 'auto',
        } as CSSProperties}
        {...props}
      >
        {loading && <span>Loading...</span>}
        {IconComponent && <IconComponent size={18} />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// Input component - handles both onChange (web) and onChangeText (React Native pattern)
interface InputProps extends Omit<ComponentProps<'input'>, 'size' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: string;
  onChangeText?: (text: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth, size, className, style, onChangeText, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onChangeText?.(e.target.value);
    };

    return (
      <div style={{ width: fullWidth ? '100%' : 'auto' }}>
        {label && <label>{label}</label>}
        <input ref={ref} className={className} style={style} onChange={handleChange} {...props} />
        {helperText && <span>{helperText}</span>}
        {error && <span style={{ color: 'red' }}>{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// SearchSelect component
interface SearchSelectOption {
  value: string;
  label: string;
}

interface SearchSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options?: SearchSelectOption[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  label?: string;
}

export const SearchSelect = forwardRef<HTMLSelectElement, SearchSelectProps>(
  ({ value, onChange, options = [], placeholder, searchable, disabled, label }, ref) => (
    <div data-value={value}>
      {label && <label>{label}</label>}
      <select
        ref={ref}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
);
SearchSelect.displayName = 'SearchSelect';

// Badge/Chip component
interface BadgeProps extends ComponentProps<'span'> {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'green' | 'yellow' | 'red' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant, size, children, className, ...props }, ref) => (
    <span ref={ref} role="status" data-variant={variant} data-size={size} className={className} {...props}>
      {children}
    </span>
  )
);
Badge.displayName = 'Badge';

export const Chip = Badge;

// Spinner component
export const Spinner = ({ size }: { size?: string | number }) => (
  <span role="status" aria-label="Loading">
    Loading...
  </span>
);

// Card component
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

// Modal component
interface ModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  children?: ReactNode;
}

export const Modal = ({ open, isOpen, onClose, onOpenChange, title, size, children }: ModalProps) => {
  const isVisible = open ?? isOpen;
  if (!isVisible) return null;

  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal'}
      data-size={size}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {title && <h2>{title}</h2>}
      <button type="button" onClick={handleClose} aria-label="Close">
        Close
      </button>
      {children}
    </div>
  );
};

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
    const [activeTab] = useState(value || defaultValue || '');
    return <div data-value={activeTab}>{children}</div>;
  },
  { List: TabsList, Trigger: TabsTrigger, Content: TabsContent }
);

// Separator component
export const Separator = ({ vertical }: { vertical?: boolean }) => (
  <hr
    style={{
      border: 'none',
      borderTop: vertical ? 'none' : '1px solid #ccc',
      borderLeft: vertical ? '1px solid #ccc' : 'none',
    }}
  />
);

// Avatar component
const AvatarImage = ({ src, alt }: { src?: string; alt?: string }) =>
  src ? <img src={src} alt={alt || ''} /> : null;
const AvatarFallback = ({ children }: { children?: ReactNode }) => <span>{children}</span>;

export const Avatar = Object.assign(({ children }: { children?: ReactNode }) => <div>{children}</div>, {
  Image: AvatarImage,
  Fallback: AvatarFallback,
});

// ScrollView component
export const ScrollView = forwardRef<HTMLDivElement, ComponentProps<'div'>>((props, ref) => (
  <div ref={ref} style={{ overflow: 'auto' }} {...props} />
));
ScrollView.displayName = 'ScrollView';

// Checkbox component
interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
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
);
Checkbox.displayName = 'Checkbox';

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

// Tooltip component
interface TooltipProps {
  children?: ReactNode;
  content?: string;
}

export const Tooltip = ({ children, content }: TooltipProps) => (
  <span title={content}>{children}</span>
);

// EmptyState component
interface EmptyStateProps {
  icon?: ComponentType<{ size?: number; color?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export const EmptyState = ({ icon: Icon, title, description, action, children }: EmptyStateProps) => (
  <div data-testid="empty-state">
    {Icon && <Icon size={32} />}
    <h2>{title}</h2>
    {description && <p>{description}</p>}
    {action && (
      <button onClick={action.onClick} data-testid="empty-state-action">
        {action.label}
      </button>
    )}
    {children}
  </div>
);

// Heading components
export const H1 = forwardRef<HTMLHeadingElement, ComponentProps<'h1'>>((props, ref) => (
  <h1 ref={ref} {...props} />
));
export const H2 = forwardRef<HTMLHeadingElement, ComponentProps<'h2'>>((props, ref) => (
  <h2 ref={ref} {...props} />
));
export const H3 = forwardRef<HTMLHeadingElement, ComponentProps<'h3'>>((props, ref) => (
  <h3 ref={ref} {...props} />
));
export const H4 = forwardRef<HTMLHeadingElement, ComponentProps<'h4'>>((props, ref) => (
  <h4 ref={ref} {...props} />
));

// Label component
export const Label = forwardRef<HTMLLabelElement, ComponentProps<'label'>>((props, ref) => (
  <label ref={ref} {...props} />
));
Label.displayName = 'Label';

// Spacer component
export const Spacer = ({ size, flex }: { size?: string | number; flex?: number }) => (
  <div style={{ width: size, height: size, flex }} />
);

// Portal component
export const Portal = ({ children }: { children?: ReactNode }) => <>{children}</>;

// Form components
export const Form = forwardRef<HTMLFormElement, ComponentProps<'form'>>((props, ref) => (
  <form ref={ref} {...props} />
));
Form.displayName = 'Form';

// Additional exports for compatibility
export const createTamagui = <T extends object>(config: T): T => config;
export const styled = <T extends object>(Component: React.ComponentType<T>) => Component;

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

export const Progress = ({ value, max = 100 }: ProgressProps) => (
  <div role="progressbar" aria-valuenow={value} aria-valuemax={max} />
);

// Circle component
interface CircleProps extends StackProps {
  size?: string | number;
}

export const Circle = forwardRef<HTMLDivElement, CircleProps>(({ size, style, ...props }, ref) => (
  <div
    ref={ref}
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      ...(typeof style === 'object' ? style : {}),
    }}
    {...props}
  />
));
Circle.displayName = 'Circle';

// VisuallyHidden component
export const VisuallyHidden = ({ children }: { children?: ReactNode }) => (
  <span
    style={{
      position: 'absolute',
      width: 1,
      height: 1,
      padding: 0,
      margin: -1,
      overflow: 'hidden',
      clip: 'rect(0,0,0,0)',
      whiteSpace: 'nowrap',
      border: 0,
    }}
  >
    {children}
  </span>
);

// Anchor component
export const Anchor = forwardRef<HTMLAnchorElement, ComponentProps<'a'>>((props, ref) => (
  <a ref={ref} {...props} />
));
Anchor.displayName = 'Anchor';
