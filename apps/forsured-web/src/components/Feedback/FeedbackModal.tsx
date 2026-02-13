/**
 * FeedbackModal - Main modal container with view states
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Stack, Row, Text, Button } from '@scaffald/ui';
import { FeedbackList } from './FeedbackList';
import { FeedbackForm } from './FeedbackForm';
import { FeedbackConversation } from './FeedbackConversation';

type ModalView = 'list' | 'new' | 'conversation';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFeedbackId?: string; // For deep linking from notifications
}

export function FeedbackModal({ isOpen, onClose, initialFeedbackId }: FeedbackModalProps) {
  const [view, setView] = useState<ModalView>('list');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  // Handle initial feedback ID from notifications
  useEffect(() => {
    if (initialFeedbackId && isOpen) {
      setSelectedFeedbackId(initialFeedbackId);
      setView('conversation');
    }
  }, [initialFeedbackId, isOpen]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      // Delay reset to allow close animation
      const timer = setTimeout(() => {
        setView('list');
        setSelectedFeedbackId(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Navigation handlers
  const handleSelectFeedback = useCallback((feedbackId: string) => {
    setSelectedFeedbackId(feedbackId);
    setView('conversation');
  }, []);

  const handleNewFeedback = useCallback(() => {
    setView('new');
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedFeedbackId(null);
    setView('list');
  }, []);

  const handleFormSuccess = useCallback(() => {
    setView('list');
  }, []);

  const handleFormCancel = useCallback(() => {
    setView('list');
  }, []);

  if (!isOpen) return null;

  // Get title based on view
  const getTitle = () => {
    switch (view) {
      case 'new':
        return 'New Feedback';
      case 'conversation':
        return 'Feedback';
      default:
        return 'Feedback';
    }
  };

  return (
    <div
      data-feedback-modal
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Feedback"
      onClick={handleBackdropClick}
    >
      <Stack
        style={{
          width: 400,
          maxWidth: '100%',
          height: '70vh',
          maxHeight: 600,
          backgroundColor: 'var(--color-background)',
          borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header - only show on new feedback form */}
        {view === 'new' && (
          <Row
            style={{
              padding: 16,
              borderBottom: '1px solid var(--color-border)',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              {getTitle()}
            </Text>
            <Button
              onPress={onClose}
              variant="ghost"
              style={{ padding: 4 }}
              aria-label="Close"
            >
              <X size={20} color="var(--color-gray-10)" />
            </Button>
          </Row>
        )}

        {/* Content */}
        <Stack style={{ flex: 1, overflow: 'hidden' }}>
          {view === 'list' && (
            <FeedbackList onSelect={handleSelectFeedback} onNewFeedback={handleNewFeedback} />
          )}

          {view === 'new' && (
            <Stack style={{ padding: 16, overflowY: 'auto' }}>
              <FeedbackForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
            </Stack>
          )}

          {view === 'conversation' && selectedFeedbackId && (
            <FeedbackConversation feedbackId={selectedFeedbackId} onBack={handleBackToList} />
          )}
        </Stack>

        {/* Close button for list view */}
        {view === 'list' && (
          <Row
            style={{
              padding: 12,
              borderTop: '1px solid var(--color-border)',
              justifyContent: 'flex-end',
              flexShrink: 0,
            }}
          >
            <Button onPress={onClose} variant="ghost" size="sm">
              Close
            </Button>
          </Row>
        )}
      </Stack>
    </div>
  );
}

export default FeedbackModal;
