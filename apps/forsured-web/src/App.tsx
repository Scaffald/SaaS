import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { LiveRegion } from '@unicornlove/beyond-ui';
import AppRoutes from './router';
import { FeedbackButton, FeedbackModal } from './components/Feedback';
import { CommandMenuProvider } from './contexts/CommandMenuContext';

/**
 * Main App component
 *
 * Includes:
 * - Application routes
 * - Feedback button and modal for user feedback
 * - Toast notifications (sonner) - styled with beyond-ui design tokens
 * - LiveRegion for screen reader announcements
 */
function App() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackId, setFeedbackId] = useState<string | undefined>(undefined);

  // Handle deep linking to feedback from URL params (e.g., from notifications)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fbId = params.get('feedback');
    if (fbId) {
      setFeedbackId(fbId);
      setFeedbackOpen(true);
      // Clean up URL
      params.delete('feedback');
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  return (
    <CommandMenuProvider>
      <AppRoutes />
      <FeedbackButton onClick={() => setFeedbackOpen(true)} />
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => {
          setFeedbackOpen(false);
          setFeedbackId(undefined);
        }}
        initialFeedbackId={feedbackId}
      />
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
