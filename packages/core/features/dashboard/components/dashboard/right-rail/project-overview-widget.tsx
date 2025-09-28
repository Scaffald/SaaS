import { YStack, XStack, Text, Button, View, type PieChartData } from '@app/ui'
import { ArrowRight } from '@tamagui/lucide-icons'
import { PieChart } from '@app/ui'
import { DashboardWidget, SectionHeading } from '../primitives'

/**
 * Project Overview Widget
 * Displays project status distribution using a donut chart with legend
 */
export const ProjectOverviewWidget = () => {
  // Sample project data - in a real app this would come from props or API
  const projectData: PieChartData[] = [
    { value: 50, color: '#249DB3', text: 'Profile Completeness' },
    { value: 40, color: '#32575E', text: 'Engagement with Peers' },
    { value: 10, color: '#B34B24', text: 'Room for Improvement' },
  ]

  const score = 90

  return (
    <DashboardWidget>
      <SectionHeading title="Your Elevate Score" subtitle="Last updated 2 days ago" />

      <YStack gap="$4">
        {/* Chart and Legend */}
        <XStack gap="$4" alignItems="center">
          {/* Donut Chart */}
          <YStack alignItems="center" flex={1}>
            <PieChart
              data={projectData}
              radius={80}
              donut={true}
              showText={false}
              showTextBackground={false}
              centerLabelComponent={() => (
                <YStack alignItems="center">
                  <Text fontSize="$8" fontWeight="bold" color="$gray12">
                    {score}
                  </Text>
                </YStack>
              )}
            />
          </YStack>

          {/* Legend */}
          <YStack gap="$3" flex={1}>
            {projectData.map((item, index) => (
              <XStack key={index} gap="$2" alignItems="center">
                <View width={12} height={12} borderRadius={6} backgroundColor={item.color} />
                <YStack>
                  <Text fontSize="$4" fontWeight="600" color="$gray12">
                    {item.value}%
                  </Text>
                  <Text fontSize="$3" color="$gray10">
                    {item.text}
                  </Text>
                </YStack>
              </XStack>
            ))}
          </YStack>
        </XStack>
      </YStack>
    </DashboardWidget>
  )
}
