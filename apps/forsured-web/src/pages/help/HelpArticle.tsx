// src/pages/help/HelpArticle.tsx
import React from 'react';
// import ReactMarkdown from 'react-markdown'; // Assuming react-markdown is installed
import { HelpArticle as ArticleType } from '../../services/helpArticleService';

interface HelpArticleProps {
  article: ArticleType;
}

function HelpArticle({ article }: HelpArticleProps) {
  return (
    <div className="help-article p-6">
      <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
      {/* <ReactMarkdown>{article.content}</ReactMarkdown> */}
      <div dangerouslySetInnerHTML={{ __html: article.content }} /> {/* Using dangerouslySetInnerHTML for mock */}
    </div>
  );
}

export default HelpArticle;
