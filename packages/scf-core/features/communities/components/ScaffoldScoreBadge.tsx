import { Text, Stack } from '@scaffald/ui'

interface Props {
  score: number
  size?: number
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#16a34a'
  if (score >= 60) return '#2563eb'
  if (score >= 40) return '#f59e0b'
  return '#dc2626'
}

export function ScaffoldScoreBadge({ score, size = 48 }: Props) {
  const color = getScoreColor(score)
  const fontSize = size * 0.4

  return (
    <Stack
      align="center"
      justify="center"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor: color,
        backgroundColor: 'transparent',
      }}
    >
      <Text style={{ fontSize, fontWeight: '700', color }}>{score}</Text>
    </Stack>
  )
}
