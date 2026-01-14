// src/pages/gc/help/index.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Stack, Text, Spinner } from '@unicornlove/beyond-ui';
import HelpArticle from '../../help/HelpArticle';
import { getHelpArticleBySlug, HelpArticle as ArticleType } from '../../../services/helpArticleService';

function GCHelpGettingStarted() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchArticle() {
      setLoading(true);
      try {
        const fetchedArticle = await getHelpArticleBySlug(slug || 'getting-started', 'gc');
        if (fetchedArticle) {
          setArticle(fetchedArticle);
        } else {
          setError(new Error('Article not found.'));
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <Stack style={{ padding: 'var(--space-6)', alignItems: 'center', gap: 'var(--space-4)' }}>
        <Spinner size="lg" />
        <Text style={{ color: 'var(--color-11)' }}>Loading help article...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack style={{ padding: 'var(--space-6)' }}>
        <Text style={{ color: 'var(--color-red-10)', fontSize: 'var(--font-size-4)', fontWeight: 500 }}>
          Error: {error.message}
        </Text>
      </Stack>
    );
  }

  if (!article) {
    return (
      <Stack style={{ padding: 'var(--space-6)' }}>
        <Text style={{ color: 'var(--color-11)', fontSize: 'var(--font-size-4)' }}>
          Article not found.
        </Text>
      </Stack>
    );
  }

  return <HelpArticle article={article} />;
}

export default GCHelpGettingStarted;
