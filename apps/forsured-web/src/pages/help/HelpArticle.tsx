// src/pages/help/HelpArticle.tsx
import React from 'react';
import { Stack, Text, H1 } from '@scaffald/ui';
import { HelpArticle as ArticleType } from '../../services/helpArticleService';

interface HelpArticleProps {
  article: ArticleType;
}

/**
 * Enhanced markdown to HTML converter for help articles
 * Handles: headings, bold, lists, links, paragraphs with better styling
 */
function markdownToHtml(markdown: string): string {
  const lines = markdown.split('\n');
  const htmlLines: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;
  let inStepSection = false;
  let stepNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Empty lines
    if (!line) {
      if (inList) {
        htmlLines.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      if (inStepSection) {
        htmlLines.push('</div>');
        inStepSection = false;
      }
      continue;
    }

    // H1 - Main title (skip, we render it separately)
    if (line.startsWith('# ')) {
      continue;
    }

    // H2 - Section headers (like "Step 1:", "What Happens Next?")
    if (line.startsWith('## ')) {
      if (inList) {
        htmlLines.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      if (inStepSection) {
        htmlLines.push('</div>');
        inStepSection = false;
      }

      const headerText = line.substring(3);
      const isStep = /^Step \d+:/.test(headerText);

      if (isStep) {
        stepNumber++;
        htmlLines.push(`<div class="step-section">`);
        htmlLines.push(`<h2 class="step-header">${headerText}</h2>`);
        inStepSection = true;
      } else {
        htmlLines.push(`<h2 class="section-header">${headerText}</h2>`);
      }
      continue;
    }

    // H3 - Subsections
    if (line.startsWith('### ')) {
      if (inList) {
        htmlLines.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      htmlLines.push(`<h3 class="subsection-header">${line.substring(4)}</h3>`);
      continue;
    }

    // Numbered list items
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) {
          htmlLines.push(`</${listType}>`);
        }
        htmlLines.push('<ol class="help-list">');
        inList = true;
        listType = 'ol';
      }
      const content = numberedMatch[2];
      let processedContent = content;
      processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      htmlLines.push(`<li>${processedContent}</li>`);
      continue;
    }

    // Bullet list items
    if (line.startsWith('- ')) {
      if (!inList || listType !== 'ul') {
        if (inList) {
          htmlLines.push(`</${listType}>`);
        }
        htmlLines.push('<ul class="help-list">');
        inList = true;
        listType = 'ul';
      }
      const content = line.substring(2);
      let processedContent = content;
      processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processedContent = processedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="help-link">$1</a>');
      htmlLines.push(`<li>${processedContent}</li>`);
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
    processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="help-link">$1</a>');

    htmlLines.push(`<p class="help-paragraph">${processedLine}</p>`);
  }

  // Close any open elements
  if (inList && listType) {
    htmlLines.push(`</${listType}>`);
  }
  if (inStepSection) {
    htmlLines.push('</div>');
  }

  return htmlLines.join('\n');
}

function HelpArticle({ article }: HelpArticleProps) {
  const htmlContent = markdownToHtml(article.content);

  return (
    <Stack style={{ maxWidth: 900, width: '100%' }}>
      {/* Hero Section */}
      <Stack style={{ marginBottom: 'var(--space-8)' }}>
        <H1
          style={{
            fontSize: 'var(--font-size-10)',
            fontWeight: 700,
            marginBottom: 'var(--space-3)',
            color: 'var(--color-gray-12)',
            lineHeight: 'var(--line-height-10)',
          }}
        >
          {article.title}
        </H1>
        <Text
          style={{
            fontSize: 'var(--font-size-5)',
            color: 'var(--color-gray-11)',
            lineHeight: 'var(--line-height-6)',
            marginTop: 'var(--space-2)',
          }}
        >
          Welcome to ForSured! This guide will help you set up your account and start managing subcontractor compliance in minutes.
        </Text>
      </Stack>

      {/* Content with enhanced styling */}
      <div
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        className="help-article-content"
        style={{
          color: 'var(--gray-12)',
          fontSize: '16px',
          lineHeight: '1.7',
        }}
      />

      <style>{`
        .help-article-content {
          width: 100%;
        }

        .help-article-content .section-header {
          font-size: 24px;
          font-weight: 600;
          color: hsla(28, 9%, 18%, 1);
          margin-top: 48px;
          margin-bottom: 16px;
          line-height: 1.4;
        }

        .help-article-content .step-section {
          background: hsla(40, 16%, 97%, 1);
          border: 1px solid hsla(37, 12%, 89%, 1);
          border-radius: 12px;
          padding: 24px;
          margin-top: 24px;
          margin-bottom: 24px;
        }

        .help-article-content .step-header {
          font-size: 20px;
          font-weight: 600;
          color: hsla(191, 72%, 35%, 1);
          margin-top: 0;
          margin-bottom: 16px;
          line-height: 1.4;
        }

        .help-article-content .subsection-header {
          font-size: 18px;
          font-weight: 600;
          color: hsla(30, 9%, 24%, 1);
          margin-top: 24px;
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .help-article-content .help-paragraph {
          margin: 16px 0;
          color: hsla(30, 9%, 24%, 1);
          line-height: 1.7;
        }

        .help-article-content .help-list {
          margin: 16px 0;
          padding-left: 24px;
          color: hsla(30, 9%, 24%, 1);
        }

        .help-article-content .help-list li {
          margin: 8px 0;
          line-height: 1.7;
        }

        .help-article-content .help-list strong {
          color: hsla(28, 9%, 18%, 1);
          font-weight: 600;
        }

        .help-article-content .help-link {
          color: hsla(191, 72%, 35%, 1);
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px solid hsla(191, 55%, 62%, 1);
          transition: all 0.2s ease;
        }

        .help-article-content .help-link:hover {
          color: hsla(191, 77%, 28%, 1);
          border-bottom-color: hsla(191, 72%, 35%, 1);
        }

        .help-article-content strong {
          color: hsla(28, 9%, 18%, 1);
          font-weight: 600;
        }
      `}</style>
    </Stack>
  );
}

export default HelpArticle;
