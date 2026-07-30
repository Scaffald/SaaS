/** Touch platforms have no hover state; see useHover.web.ts for the web version. */
export function useHover() {
  return { hovered: false, hoverProps: {} as Record<string, unknown> }
}
