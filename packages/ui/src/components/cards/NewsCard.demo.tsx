import { Button, Text, XStack, YStack } from 'tamagui'
import { NewsCard } from './NewsCard'

/**
 * NewsCard Demo - Showcases various NewsCard configurations
 * This demo component demonstrates different ways to use the NewsCard component
 * with various props, layouts, and interaction patterns.
 */
export const NewsCardDemo = () => {
  return (
    <YStack gap="$4" p="$4" bg="$color2">
      <Text fontSize="$8" fontWeight="bold" text="center" mb="$4">
        NewsCard Component Demo
      </Text>

      <YStack gap="$6">
        {/* Basic NewsCard */}
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="600">
            Basic NewsCard
          </Text>
          <NewsCard
            title="Breaking: Technology News Update"
            description="This is a basic news card example with title and description. The image will fallback to a random abstract image."
          />
        </YStack>

        {/* NewsCard with Header and Footer */}
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="600">
            With Header and Footer
          </Text>
          <NewsCard
            title="Latest Development in AI Research"
            description="Scientists make breakthrough discovery in artificial intelligence that could revolutionize computing."
            header={
              <XStack>
                <Button size="$2" bg="$blue8" color="white" rounded="$10">
                  Technology
                </Button>
              </XStack>
            }
            footer={
              <XStack gap="$3" items="center">
                <Text fontSize="$2" color="$color11">
                  2 hours ago
                </Text>
                <Text fontSize="$2" color="$color11">
                  •
                </Text>
                <Text fontSize="$2" color="$color11">
                  5 min read
                </Text>
              </XStack>
            }
          />
        </YStack>

        {/* Full Card Clickable */}
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="600">
            Full Card Clickable
          </Text>
          <NewsCard
            title="Climate Change Solutions"
            description="New renewable energy technologies show promise for reducing carbon emissions globally."
            fullCardClickable
            onPress={() => alert('Full card clicked!')}
            header={
              <Button size="$2" bg="$green8" color="white" rounded="$10">
                Environment
              </Button>
            }
            footer={
              <Text fontSize="$2" color="$color11">
                Click anywhere on this card
              </Text>
            }
          />
        </YStack>

        {/* Read More Button */}
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="600">
            With Read More Link
          </Text>
          <NewsCard
            title="Space Exploration Milestone"
            description="Recent space missions have uncovered fascinating discoveries about distant planets and their potential for life."
            showReadMore
            onPress={() => alert('Read more clicked!')}
            header={
              <Button size="$2" bg="$blue8" color="white" rounded="$10">
                Science
              </Button>
            }
            footer={
              <XStack gap="$3" items="center">
                <Text fontSize="$2" color="$color11">
                  1 day ago
                </Text>
                <Text fontSize="$2" color="$color11">
                  •
                </Text>
                <Text fontSize="$2" color="$color11">
                  NASA
                </Text>
              </XStack>
            }
          />
        </YStack>

        {/* Both Clickable and Read More */}
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="600">
            Full Card + Read More
          </Text>
          <NewsCard
            title="Economic Market Analysis"
            description="Financial experts analyze current market trends and predict future economic conditions for the upcoming quarter."
            fullCardClickable
            showReadMore
            readMoreText="View Analysis"
            onPress={() => alert('Card interaction detected!')}
            header={
              <Button size="$2" bg="$yellow8" color="white" rounded="$10">
                Finance
              </Button>
            }
            footer={
              <XStack gap="$3" items="center">
                <Text fontSize="$2" color="$color11">
                  3 hours ago
                </Text>
                <Text fontSize="$2" color="$color11">
                  •
                </Text>
                <Text fontSize="$2" color="$color11">
                  Market Watch
                </Text>
              </XStack>
            }
          />
        </YStack>

        {/* Custom Image */}
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="600">
            With Custom Image
          </Text>
          <NewsCard
            image="https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&auto=format&q=80"
            title="Travel Adventures Await"
            description="Discover breathtaking destinations around the world and plan your next adventure with our comprehensive travel guide."
            showReadMore
            readMoreText="Plan Trip"
            onPress={() => alert('Planning trip!')}
            header={
              <Button size="$2" bg="$blue8" color="white" rounded="$10">
                Travel
              </Button>
            }
            footer={
              <XStack gap="$3" items="center">
                <Text fontSize="$2" color="$color11">
                  6 hours ago
                </Text>
                <Text fontSize="$2" color="$color11">
                  •
                </Text>
                <Text fontSize="$2" color="$color11">
                  Travel Guide
                </Text>
              </XStack>
            }
          />
        </YStack>

        {/* Disabled State */}
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="600">
            Disabled State
          </Text>
          <NewsCard
            title="Archived Article"
            description="This news card is in a disabled state and cannot be interacted with."
            disabled
            showReadMore
            fullCardClickable
            header={
              <Button size="$2" bg="$color8" color="white" rounded="$10">
                Archived
              </Button>
            }
            footer={
              <Text fontSize="$2" color="$color9">
                No interactions available
              </Text>
            }
          />
        </YStack>
      </YStack>
    </YStack>
  )
}
