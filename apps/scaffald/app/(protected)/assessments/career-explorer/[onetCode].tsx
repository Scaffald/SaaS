import { CareerDetailScreen } from '@scf/core/features/career-explorer/CareerDetailScreen'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { useLocalSearchParams } from 'expo-router'

export default function CareerDetailRoute() {
  const { onetCode } = useLocalSearchParams<{ onetCode: string }>()

  return (
    <DashboardPage
      breadcrumbs={[
        { label: 'Career Explorer', href: '/assessments/career-explorer' },
        { label: onetCode || 'Occupation' },
      ]}
      leftContent={<CareerDetailScreen onetCode={onetCode ?? ''} />}
      rightContent={null}
      fullWidth
    />
  )
}
