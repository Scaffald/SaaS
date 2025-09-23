export const formatBoolean = (value: boolean | null | undefined) => {
  if (value === null || value === undefined) return 'Unknown'
  return value ? 'Yes' : 'No'
}

export const formatDate = (value: string | null | undefined) => {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch (_error) {
    return value
  }
}
