import React, { useState } from 'react';
import NavigationDrawer, { DrawerToggle } from './NavigationDrawer';
import ThemeSwitcher from '../Common/ThemeSwitcher';
import FoundationsSection from './sections/FoundationsSection';
import ComponentsSection from './sections/ComponentsSection';
import PatternsSection from './sections/PatternsSection';
import { Palette } from 'lucide-react';

export default function DesignSystemHome() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-secondary">
      <NavigationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <div className="lg:ml-72">
        <DrawerToggle onClick={() => setDrawerOpen(true)} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 rounded-2xl p-8 mb-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                  <Palette size={32} />
                </div>
                <div>
                  <h1 className="font-display text-4xl font-bold mb-2">
                    Design System
                  </h1>
                  <p className="text-primary-100 text-lg">
                    Complete UI component library and design foundations
                  </p>
                </div>
              </div>
              <ThemeSwitcher />
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                About This System
              </h2>
              <p className="text-text-secondary">
                This design system provides a comprehensive collection of
                reusable components, design foundations, and patterns to ensure
                consistency across all interfaces. Each component is built with
                accessibility, theming, and responsive design in mind.
              </p>
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
