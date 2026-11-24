/**
 * "Core Skills · 1 of 3" for a section that completes at a count of more than
 * one, so a worker with one skill sees what is left rather than a bare Add
 * (#1418). A one-item section (a certification) needs no count.
 */
export function sectionRowLabel(item: {
  title: string
  progress?: { current: number; required: number }
}): string {
  const progress = item.progress
  if (!progress || progress.required <= 1) return item.title
  return `${item.title} · ${progress.current} of ${progress.required}`
}
