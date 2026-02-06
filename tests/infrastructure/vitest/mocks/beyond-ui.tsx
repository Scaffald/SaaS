/**
 * Minimal mock for @unicornlove/beyond-ui in tests.
 */
import type { ReactNode } from 'react'

export function Box({ children }: { children?: ReactNode }) {
  return <div>{children}</div>
}
export function Stack({ children }: { children?: ReactNode }) {
  return <div>{children}</div>
}
export function Row({ children }: { children?: ReactNode }) {
  return <div>{children}</div>
}
export function Button({
  children,
  onPress,
  ...rest
}: { children?: ReactNode; onPress?: () => void }) {
  return (
    <button type="button" onClick={onPress} {...rest}>
      {children}
    </button>
  )
}
export function Input({
  value,
  onChangeText,
  placeholder,
}: {
  value?: string
  onChangeText?: (text: string) => void
  placeholder?: string
}) {
  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChangeText && onChangeText(e.target.value)}
      data-testid="email-input"
    />
  )
}
export function Form({
  children,
  onSubmit,
}: { children?: ReactNode; onSubmit?: () => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit && onSubmit()
      }}
    >
      {children}
    </form>
  )
}
export function Paragraph({ children }: { children?: ReactNode }) {
  return <p>{children}</p>
}
export function Text({ children }: { children?: ReactNode }) {
  return <span>{children}</span>
}
export function Spinner() {
  return <span data-testid="spinner" />
}
export function Separator() {
  return <hr />
}
export function Caption({ children }: { children?: ReactNode }) {
  return <span>{children}</span>
}
export function Hide({ children }: { children?: ReactNode }) {
  return <>{children}</>
}
export function Show({ children }: { children?: ReactNode }) {
  return <>{children}</>
}
export function usePlatform() {
  return { platform: 'web' as const }
}
export function useToast() {
  return { show: () => '' }
}
export const ToastProvider = ({ children }: { children?: ReactNode }) => <>{children}</>
export const ToastContainer = () => null
