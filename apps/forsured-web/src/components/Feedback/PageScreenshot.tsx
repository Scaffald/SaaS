/**
 * PageScreenshot - Utility for capturing current page screenshot using html2canvas
 */

import React, { useState, useCallback } from 'react';
import { Camera, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Row, Text, Button } from '@scaffald/ui';

interface PageScreenshotProps {
  onCapture: (blob: Blob, fileName: string) => void;
  disabled?: boolean;
}

export function PageScreenshot({ onCapture, disabled = false }: PageScreenshotProps) {
  const [status, setStatus] = useState<'idle' | 'capturing' | 'success' | 'error'>('idle');

  const captureScreenshot = useCallback(async () => {
    setStatus('capturing');

    try {
      // Dynamically import html2canvas to reduce bundle size
      const html2canvas = (await import('html2canvas')).default;

      // Capture the document body
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 1, // Reduce scale for smaller file size
        logging: false,
        // Ignore certain elements that might cause issues
        ignoreElements: (element) => {
          // Ignore the feedback modal itself
          if (element.getAttribute('data-feedback-modal')) {
            return true;
          }
          return false;
        },
      });

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) {
              resolve(b);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/png',
          0.9
        );
      });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `screenshot-${timestamp}.png`;

      setStatus('success');
      onCapture(blob, fileName);

      // Reset status after a moment
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      setStatus('error');

      // Reset status after a moment
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [onCapture]);

  const getButtonContent = () => {
    switch (status) {
      case 'capturing':
        return (
          <>
            <Loader2 size={16} className="animate-spin" />
            <Text style={{ fontSize: 13 }}>Capturing...</Text>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle size={16} color="var(--color-green-9)" />
            <Text style={{ fontSize: 13, color: 'var(--color-green-9)' }}>Captured!</Text>
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle size={16} color="var(--color-red-9)" />
            <Text style={{ fontSize: 13, color: 'var(--color-red-9)' }}>Failed</Text>
          </>
        );
      default:
        return (
          <>
            <Camera size={16} />
            <Text style={{ fontSize: 13 }}>Capture Page</Text>
          </>
        );
    }
  };

  return (
    <Button
      onPress={captureScreenshot}
      variant="outline"
      disabled={disabled || status === 'capturing'}
      style={{
        padding: 8,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: 6,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Row style={{ alignItems: 'center', gap: 6 }}>
        {getButtonContent()}
      </Row>
    </Button>
  );
}

export default PageScreenshot;
