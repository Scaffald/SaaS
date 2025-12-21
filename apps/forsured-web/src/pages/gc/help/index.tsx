// src/pages/gc/help/index.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { YStack, Text, Spinner } from '@unicornlove/ui';
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
      <YStack padding="$6" alignItems="center" gap="$4">
        <Spinner size="large" />
        <Text color="$color11">Loading help article...</Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack padding="$6">
        <Text color="$red10" fontSize="$4" fontWeight="500">
          Error: {error.message}
        </Text>
      </YStack>
    );
  }

  if (!article) {
    return (
      <YStack padding="$6">
        <Text color="$color11" fontSize="$4">
          Article not found.
        </Text>
      </YStack>
    );
  }

  return <HelpArticle article={article} />;
}

export default GCHelpGettingStarted;
