import { Text, YStack, XStack, Button, ScrollView } from 'tamagui'
import { ProfileCompletionWidget } from '@app/core/features/dashboard/completion'
import { NewsCard } from '@app/ui'
import { useRouter } from 'expo-router'

export function DashboardIndexRight() {
  const router = useRouter()

  const handleNavigate = (route: string) => {
    router.push(route)
  }

  const handleNewsClick = (title: string) => {
    console.log('News article clicked:', title)
    // Could navigate to a news detail page or external link
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <ProfileCompletionWidget onNavigate={handleNavigate} />

      {/* News Section */}
      <YStack gap="$3">
        <Text fontSize="$6" fontWeight="600" paddingHorizontal="$6" pt="$6">
          Latest News
        </Text>

        <NewsCard
          title="Platform Feature Updates"
          description="New tools and improvements have been added to help you build better professional profiles and connect with opportunities."
          header={
            <Button size="$2" backgroundColor="$blue8" color="white" borderRadius="$10">
              Platform
            </Button>
          }
          footer={
            <XStack gap="$3" alignItems="center">
              <Text fontSize="$2" color="$color11">
                2 hours ago
              </Text>
              <Text fontSize="$2" color="$color11">
                •
              </Text>
              <Text fontSize="$2" color="$color11">
                2 min read
              </Text>
            </XStack>
          }
          showReadMore
          readMoreText="Learn More"
          onPress={() => handleNewsClick('Platform Feature Updates')}
          minHeight={240}
        />

        <NewsCard
          title="Industry Insights: Skills in Demand"
          description="Explore the most sought-after skills across industries and discover opportunities for professional growth."
          header={
            <Button size="$2" backgroundColor="$green8" color="white" borderRadius="$10">
              Career
            </Button>
          }
          footer={
            <XStack gap="$3" alignItems="center">
              <Text fontSize="$2" color="$color11">
                1 day ago
              </Text>
              <Text fontSize="$2" color="$color11">
                •
              </Text>
              <Text fontSize="$2" color="$color11">
                Market Research
              </Text>
            </XStack>
          }
          showReadMore
          readMoreText="View Insights"
          onPress={() => handleNewsClick('Industry Insights: Skills in Demand')}
          minHeight={220}
        />

        <NewsCard
          title="Success Stories"
          description="Read about professionals who transformed their careers using our platform and achieved their goals."
          header={
            <Button size="$2" backgroundColor="$purple8" color="white" borderRadius="$10">
              Success
            </Button>
          }
          footer={
            <XStack gap="$3" alignItems="center">
              <Text fontSize="$2" color="$color11">
                3 days ago
              </Text>
              <Text fontSize="$2" color="$color11">
                •
              </Text>
              <Text fontSize="$2" color="$color11">
                Community
              </Text>
            </XStack>
          }
          showReadMore
          readMoreText="Read Stories"
          onPress={() => handleNewsClick('Success Stories')}
          minHeight={200}
        />
      </YStack>
    </ScrollView>
  )
}
