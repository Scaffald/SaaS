/**
 * ProcoreCallback — Handles the OAuth redirect from Procore
 *
 * URL: /manager/settings/integrations/procore/callback?code=...&state=...
 *
 * Extracts code + state from URL params, calls procore.callback tRPC mutation
 * to exchange the code for tokens, then redirects back to integrations page.
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Stack, Text, Spinner } from '@scaffald/ui';
import { trpc } from '../../../lib/trpc';

export default function ProcoreCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const callbackMutation = trpc.procore.callback.useMutation();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      setError('Missing authorization code or state parameter. Please try connecting again.');
      return;
    }

    callbackMutation
      .mutateAsync({ code, state })
      .then(() => {
        navigate('/manager/settings/integrations', { replace: true });
      })
      .catch((err) => {
        setError(err?.message ?? 'Failed to connect Procore. Please try again.');
      });
  }, [searchParams, callbackMutation, navigate]);

  if (error) {
    return (
      <Stack style={{ padding: 'var(--space-8)', alignItems: 'center', gap: 'var(--space-4)' }}>
        <Text style={{ color: 'var(--color-red-11)', fontWeight: 600, fontSize: 'var(--font-size-5)' }}>
          Connection Failed
        </Text>
        <Text style={{ color: 'var(--color-10)', textAlign: 'center', maxWidth: 400 }}>
          {error}
        </Text>
        <Text
          role="link"
          onClick={() => navigate('/manager/settings/integrations', { replace: true })}
          style={{ color: 'var(--color-blue-10)', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Back to Integrations
        </Text>
      </Stack>
    );
  }

  return (
    <Stack style={{ padding: 'var(--space-8)', alignItems: 'center', gap: 'var(--space-4)' }}>
      <Spinner size="lg" />
      <Text style={{ fontWeight: 600, fontSize: 'var(--font-size-5)' }}>
        Connecting Procore...
      </Text>
      <Text style={{ color: 'var(--color-10)' }}>
        Please wait while we complete the connection.
      </Text>
    </Stack>
  );
}
