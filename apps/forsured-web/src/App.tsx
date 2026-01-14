import React from 'react';
import { Toaster } from 'sonner';
import { LiveRegion } from '@unicornlove/beyond-ui';
import AppRoutes from './router';
import ThemeSwitcher from './components/Common/ThemeSwitcher';
import { CommandMenuProvider } from './contexts/CommandMenuContext';

/**
 * Main App component
 *
 * Includes:
 * - Application routes
 * - Theme switcher for light/dark mode
 * - Toast notifications (sonner)
 * - LiveRegion for screen reader announcements
 */
function App() {
  return (
    <CommandMenuProvider>
      <AppRoutes />
      <ThemeSwitcher />
      <Toaster position="top-right" />
      {/* LiveRegion for accessible announcements - screen readers will read these */}
      <LiveRegion />
    </CommandMenuProvider>
  );
}

export default App;
