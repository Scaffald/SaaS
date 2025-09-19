import { Card, type CardProps } from '@my/ui'

export type DashboardCardProps = CardProps

export const DashboardCard = ({ children, ...props }: DashboardCardProps) => {
  return (
    <Card
      p="$5"
      gap="$4"
      br="$6"
      bw={1}
      boc="$borderColor"
      bg="$color1"
      {...props}
    >
      {children}
    </Card>
  )
}
