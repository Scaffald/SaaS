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
 * - Toast notifications (sonner) - styled with beyond-ui design tokens
 * - LiveRegion for screen reader announcements
 */
function App() {
  return (
    <CommandMenuProvider>
      <AppRoutes />
      <ThemeSwitcher />
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            background: 'var(--color-background)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(20, 28, 37, 0.078)',
            padding: '16px',
          },
          className: 'beyond-ui-toast',
          descriptionClassName: 'beyond-ui-toast-description',
        }}
      />
      {/* LiveRegion for accessible announcements - screen readers will read these */}
      <LiveRegion />
    </CommandMenuProvider>
  );
}

export default App;
