import React, { useState } from 'react';
import { YStack, XStack, View, Text, H1, H2 } from '@unicornlove/ui';
import NavigationDrawer, { DrawerToggle } from './NavigationDrawer';
import ThemeSwitcher from '../Common/ThemeSwitcher';
import FoundationsSection from './sections/FoundationsSection';
import ComponentsSection from './sections/ComponentsSection';
import PatternsSection from './sections/PatternsSection';
import { Palette } from 'lucide-react';

export default function DesignSystemHome() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <View minHeight="100vh" backgroundColor="$backgroundSecondary">
      <NavigationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <View
        $gtLg={{ marginLeft: 288 }}
      >
        <DrawerToggle onClick={() => setDrawerOpen(true)} />

        <View maxWidth={1280} marginHorizontal="auto" paddingHorizontal="$4" paddingVertical="$8">
          <View
            borderRadius="$6"
            padding="$8"
            mb="$8"
            shadowRadius={12}
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: 4 }}
            style={{
              background: 'linear-gradient(to right, var(--color-primary-600), var(--color-primary-800))',
            }}
          >
            <XStack alignItems="center" justifyContent="space-between">
              <XStack alignItems="center" gap="$4">
                <View
                  padding="$4"
                  borderRadius="$6"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <Palette size={32} color="white" />
                </View>
                <YStack>
                  <H1 fontFamily="$display" fontSize="$9" fontWeight="bold" mb="$2" color="white">
                    Design System
                  </H1>
                  <Text fontSize="$5" style={{ color: 'var(--color-primary-100)' }}>
                    Complete UI component library and design foundations
                  </Text>
                </YStack>
              </XStack>
              <ThemeSwitcher />
            </XStack>
          </View>

          <View mb="$8">
            <View
              backgroundColor="$background"
              borderRadius="$6"
              borderWidth={1}
              borderColor="$borderColor"
              padding="$6"
              shadowRadius={2}
              shadowColor="$shadowColor"
              shadowOffset={{ width: 0, height: 1 }}
            >
              <H2 fontSize="$6" fontWeight="600" color="$color12" mb="$2">
                About This System
              </H2>
              <Text color="$color11">
                This design system provides a comprehensive collection of
                reusable components, design foundations, and patterns to ensure
                consistency across all interfaces. Each component is built with
                accessibility, theming, and responsive design in mind.
              </Text>
            </View>
          </View>

          <FoundationsSection />
          <ComponentsSection />
          <PatternsSection />
        </View>
      </View>
    </View>
  );
}
