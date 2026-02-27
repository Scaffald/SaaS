import React, { useState } from 'react';
import { Stack, Row, Text, H1, H2 } from '@scaffald/ui';
import NavigationDrawer, { DrawerToggle } from './NavigationDrawer';
import ThemeSwitcher from '../Common/ThemeSwitcher';
import FoundationsSection from './sections/FoundationsSection';
import ComponentsSection from './sections/ComponentsSection';
import PatternsSection from './sections/PatternsSection';
import { Palette } from 'lucide-react';

export default function DesignSystemHome() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background-secondary)' }}>
      <NavigationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <div className="lg:ml-[288px]">
        <DrawerToggle onClick={() => setDrawerOpen(true)} />

        <div style={{ maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
          <div
            style={{
              borderRadius: 'var(--radius-6)',
              padding: 'var(--space-8)',
              marginBottom: 'var(--space-8)',
              boxShadow: '0 4px 12px var(--color-shadow)',
              background: 'linear-gradient(to right, var(--color-primary-600), var(--color-primary-800))',
            }}
          >
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Row style={{ alignItems: 'center', gap: 'var(--space-4)' }}>
                <div
                  style={{
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-6)',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <Palette size={32} color="white" />
                </div>
                <Stack>
                  <H1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-9)', fontWeight: 'bold', marginBottom: 'var(--space-2)', color: 'white' }}>
                    Design System
                  </H1>
                  <Text style={{ fontSize: 'var(--font-size-5)', color: 'var(--color-primary-100)' }}>
                    Complete UI component library and design foundations
                  </Text>
                </Stack>
              </Row>
              <ThemeSwitcher />
            </Row>
          </div>

          <div style={{ marginBottom: 'var(--space-8)' }}>
            <div
              style={{
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-6)',
                border: '1px solid var(--color-border)',
                padding: 'var(--space-6)',
                boxShadow: '0 1px 2px var(--color-shadow)',
              }}
            >
              <H2 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-2)' }}>
                About This System
              </H2>
              <Text style={{ color: 'var(--color-11)' }}>
                This design system provides a comprehensive collection of
                reusable components, design foundations, and patterns to ensure
                consistency across all interfaces. Each component is built with
                accessibility, theming, and responsive design in mind.
              </Text>
            </div>
          </div>

          <FoundationsSection />
          <ComponentsSection />
          <PatternsSection />
        </div>
      </div>
    </div>
  );
}
