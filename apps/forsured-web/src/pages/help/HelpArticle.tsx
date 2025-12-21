// src/pages/help/HelpArticle.tsx
import React from 'react';
import { YStack, H1 } from '@unicornlove/ui';
import { HelpArticle as ArticleType } from '../../services/helpArticleService';

interface HelpArticleProps {
  article: ArticleType;
}

/**
 * Simple markdown to HTML converter for help articles
 * Handles: headings, bold, lists, links, paragraphs
 */
function markdownToHtml(markdown: string): string {
  const lines = markdown.split('\n');
  const htmlLines: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Empty lines
    if (!line) {
      if (inList) {
        htmlLines.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      if (inList) {
        htmlLines.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      htmlLines.push(`<h3>${line.substring(4)}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) {
        htmlLines.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      htmlLines.push(`<h2>${line.substring(3)}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      if (inList) {
        htmlLines.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      htmlLines.push(`<h1>${line.substring(2)}</h1>`);
      continue;
    }

    // Numbered list items
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) {
          htmlLines.push(`</${listType}>`);
        }
        htmlLines.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      htmlLines.push(`<li>${numberedMatch[2]}</li>`);
      continue;
    }

    // Bullet list items
    if (line.startsWith('- ')) {
      if (!inList || listType !== 'ul') {
        if (inList) {
          htmlLines.push(`</${listType}>`);
        }
        htmlLines.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      htmlLines.push(`<li>${line.substring(2)}</li>`);
      continue;
    }

    // Regular paragraph
    if (inList) {
      htmlLines.push(`</${listType}>`);
      inList = false;
      listType = null;
    }

    // Process inline formatting (bold, links)
    let processedLine = line;
    processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: var(--blue-9); text-decoration: underline;">$1</a>');
    
    htmlLines.push(`<p>${processedLine}</p>`);
  }

  // Close any open list
  if (inList && listType) {
    htmlLines.push(`</${listType}>`);
  }

  return htmlLines.join('\n');
}

function HelpArticle({ article }: HelpArticleProps) {
  const htmlContent = markdownToHtml(article.content);

  return (
    <YStack padding="$6">
      <H1 fontSize="$9" fontWeight="bold" marginBottom="$4">{article.title}</H1>
      {/* Use a regular div for dangerouslySetInnerHTML on web - Tamagui View doesn't support it */}
      {/* This prevents "Unexpected text node" errors from React Native/Tamagui */}
      <div
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{
          // Match Tamagui text styling
          color: 'var(--color-12)',
          fontSize: '14px',
          lineHeight: '1.5',
        }}
      />
    </YStack>
  );
}

export default HelpArticle;
