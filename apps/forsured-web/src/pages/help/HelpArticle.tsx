// src/pages/help/HelpArticle.tsx
import React from 'react';
// import ReactMarkdown from 'react-markdown'; // Assuming react-markdown is installed
import { YStack, H1, View } from '@unicornlove/ui';
import { HelpArticle as ArticleType } from '../../services/helpArticleService';

interface HelpArticleProps {
  article: ArticleType;
}

function HelpArticle({ article }: HelpArticleProps) {
  return (
    <YStack padding="$6">
      <H1 fontSize="$9" fontWeight="bold" marginBottom="$4">{article.title}</H1>
      {/* <ReactMarkdown>{article.content}</ReactMarkdown> */}
      <View dangerouslySetInnerHTML={{ __html: article.content }} /> {/* Using dangerouslySetInnerHTML for mock */}
    </YStack>
  );
}

export default HelpArticle;
