// src/pages/gc/help/index.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

  if (loading) return <div>Loading help article...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!article) return <div>Article not found.</div>;

  return <HelpArticle article={article} />;
}

export default GCHelpGettingStarted;
